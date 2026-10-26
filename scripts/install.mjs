#!/usr/bin/env node
// Consumer installer for the generated skill and agent trees (Task 2.7, plan D2/D3).
// Node built-ins only. Writes and removes only `tsh-*` entries plus its own manifest.
import { createHash } from 'node:crypto';
import nodeFs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const MANIFEST = '.tsh-install-manifest.json';
export const TOOLS = ['cursor', 'claude', 'codex'];
export const CATEGORIES = ['agents', 'commands', 'workflows', 'internal'];
const PREFIX = 'tsh-';
const AGENT_DIRS = { cursor: '.cursor/agents', claude: '.claude/agents', codex: '.codex/agents' };
const SKILL_DIRS = ['.agents/skills', '.claude/skills'];
const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export class UsageError extends Error {}

export const HELP = `Usage: node scripts/install.mjs [options]

Installs the generated tsh-* skills and subagents into a user or project tree.

  --tools <list>       comma list of: cursor, claude, codex (required for install)
  --scope user|project where to install (default: user = home dir)
  --project-dir <dir>  project root for --scope project (default: current dir)
  --source <dir>       repo root holding the generated trees and scripts/legacy-names.json (default: this clone)
  --mode copy|link     copy (default) or symlink to the clone, so "git pull" updates it.
                       Windows: symlinks need Developer Mode or admin rights; prefer copy.
  --update             reinstall the tools recorded in the manifests and prune tsh-*
                       entries that no longer exist in the source. Copies you did not edit
                       (checksum in the manifest) are replaced or removed without a backup;
                       edited copies are moved to the backup first, never deleted
  --migrate-legacy     only run the legacy cleanup (old .cursor/skills layout), then exit
  --list               list the recorded installs and whether each is behind the clone
                       (combine only with --source); writes nothing
  --update-all         preview an --update of every recorded install (writes nothing);
                       missing installs are skipped. Never uses --force
  --yes                with --update-all: apply the updates, one install after another
  --forget-missing     drop registry entries of installs that no longer exist on disk
                       (never touches a project); with --dry-run only prints them
  --dry-run            print what would happen and change nothing
  --verbose, -v        one line per entry instead of grouped summaries
  --force              replace an unmanaged tsh-* entry (it is moved to the backup first)
  --help               show this text

Legacy cleanup runs before every install/update. Symlinks are removed; real directories
are moved to ~/.tsh-ai-collections-backup/<timestamp>/ and never hard-deleted.
Home dir: $TSH_HOME if set, else the OS home dir. MCP config is never written; the
installer prints which generated file to merge for each tool.
Every real install or update is recorded in ~/.tsh-ai-collections/installs.json (local only,
safe to delete; each later install or --update records its install again).
`;

export function parseArgs(argv) {
  const o = { tools: null, scope: 'user', projectDir: null, source: null, mode: 'copy',
    update: false, migrateLegacy: false, dryRun: false, force: false, help: false, verbose: false, list: false,
    updateAll: false, yes: false, forgetMissing: false };
  const given = new Set();
  const valued = { '--tools': 'tools', '--scope': 'scope', '--project-dir': 'projectDir',
    '--source': 'source', '--mode': 'mode' };
  const flags = { '--update': 'update', '--migrate-legacy': 'migrateLegacy',
    '--dry-run': 'dryRun', '--force': 'force', '--verbose': 'verbose', '-v': 'verbose', '--help': 'help', '-h': 'help',
    '--list': 'list', '--update-all': 'updateAll', '--yes': 'yes', '--forget-missing': 'forgetMissing' };
  for (let i = 0; i < argv.length; i++) {
    let [k, v] = argv[i].startsWith('--') && argv[i].includes('=')
      ? [argv[i].slice(0, argv[i].indexOf('=')), argv[i].slice(argv[i].indexOf('=') + 1)]
      : [argv[i], undefined];
    if (k in flags) { o[flags[k]] = true; given.add(k); continue; }
    if (!(k in valued)) throw new UsageError(`Unknown argument: ${argv[i]}`);
    given.add(k);
    if (v === undefined) {
      v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new UsageError(`Missing value for ${k}`);
    }
    o[valued[k]] = v;
  }
  if (!['user', 'project'].includes(o.scope)) throw new UsageError(`Invalid --scope "${o.scope}" (user|project)`);
  if (!['copy', 'link'].includes(o.mode)) throw new UsageError(`Invalid --mode "${o.mode}" (copy|link)`);
  if (o.tools !== null) {
    o.tools = [...new Set(o.tools.split(',').map((s) => s.trim()).filter(Boolean))];
    const bad = o.tools.filter((t) => !TOOLS.includes(t));
    if (bad.length || !o.tools.length) throw new UsageError(`Invalid --tools: ${bad.join(',') || '(empty)'}; use ${TOOLS.join(',')}`);
  }
  // The registry commands work on every recorded install; they take no target of their own
  const registryModes = ['--list', '--update-all', '--forget-missing'].filter((k) => given.has(k));
  if (registryModes.length > 1) throw new UsageError(`${registryModes.join(', ')} cannot be combined (use one at a time)`);
  const only = (flag, allowed, hint) => {
    const clash = [...given].filter((k) => ![flag, ...allowed, '--source', '--verbose', '-v', '--help', '-h'].includes(k));
    if (clash.length) throw new UsageError(`${flag} cannot be combined with ${clash.join(', ')} (${hint})`);
  };
  if (o.list) only('--list', [], 'only --source is allowed');
  // --force never runs in bulk: a forced overwrite needs a decision per install
  if (o.updateAll) only('--update-all', ['--yes', '--dry-run'], 'allowed: --yes, --dry-run, --verbose, --source; scope, project dir, tools and mode come from the registry');
  if (o.forgetMissing) only('--forget-missing', ['--dry-run'], 'allowed: --dry-run, --verbose, --source');
  if (o.yes && !o.updateAll) throw new UsageError('--yes is only valid with --update-all');
  return o;
}

/** D2 minimal-tree selection for skills. */
export function selectSkillTrees(tools) {
  const t = new Set(tools);
  const trees = [];
  if (t.has('claude') && t.has('codex')) return [...SKILL_DIRS];
  if (t.has('claude')) trees.push('.claude/skills');
  else if (t.has('cursor') || t.has('codex')) trees.push('.agents/skills');
  return trees;
}

// ---------- fs helpers (all through ctx.fs so tests can inject failures) ----------

function lstat(ctx, p) {
  try { return ctx.fs.lstatSync(p); } catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return null; throw e; }
}
function isDangling(ctx, p) {
  try { ctx.fs.statSync(p); return false; } catch { return true; }
}
function listDir(ctx, p) {
  const st = lstat(ctx, p);
  if (!st || !st.isDirectory()) return [];
  return ctx.fs.readdirSync(p);
}
/** Whether an installed entry equals its source entry. The source side follows links (copies are
 *  dereferenced); an installed link (dangling or not) or a missing entry is never equal, so it
 *  takes the edited-copy path instead of throwing in the middle of an update. */
function treesEqual(ctx, src, dest) {
  let ss, sd;
  try { ss = ctx.fs.statSync(src); sd = ctx.fs.lstatSync(dest); } catch { return false; }
  if (sd.isSymbolicLink() || ss.isDirectory() !== sd.isDirectory()) return false;
  if (!ss.isDirectory()) return ctx.fs.readFileSync(src).equals(ctx.fs.readFileSync(dest));
  const ls = ctx.fs.readdirSync(src).sort(), ld = ctx.fs.readdirSync(dest).sort();
  if (ls.join('\0') !== ld.join('\0')) return false;
  return ls.every((n) => treesEqual(ctx, path.join(src, n), path.join(dest, n)));
}
function readManifest(ctx, dir) {
  const f = path.join(dir, MANIFEST);
  if (!lstat(ctx, f)) return null;
  let m;
  try { m = JSON.parse(ctx.fs.readFileSync(f, 'utf8')); } catch { return null; }
  if (!m || typeof m !== 'object') return null;
  // Only plain tsh-* entry names are trusted as path components (a tampered manifest must not reach other paths)
  const names = Array.isArray(m.names) ? m.names : [];
  const good = names.filter((n) => typeof n === 'string' && n.startsWith('tsh-') && n === path.basename(n) && !n.includes('\\'));
  if (good.length !== names.length) ctx.log(`ignored ${names.length - good.length} invalid name(s) in ${f}`);
  // Version 1 manifests have no hashes; only well-formed sha256 values for trusted names are kept
  const hashes = {};
  if (m.hashes && typeof m.hashes === 'object') {
    for (const n of good) if (typeof m.hashes[n] === 'string' && /^[0-9a-f]{64}$/.test(m.hashes[n])) hashes[n] = m.hashes[n];
  }
  return { ...m, names: good, hashes, tools: Array.isArray(m.tools) ? m.tools.filter((t) => TOOLS.includes(t)) : [] };
}

/** sha256 of an installed entry as it is on disk. A file hashes to its bytes. A directory hashes
 *  every entry below it in sorted order as a framed record (type, relative POSIX path, size or
 *  link target, bytes), so a changed byte, a renamed or added file all change the hash. */
export function hashEntry(fsx, p) {
  if (!fsx.lstatSync(p).isDirectory()) return createHash('sha256').update(fsx.readFileSync(p)).digest('hex');
  const h = createHash('sha256');
  const walk = (dir, rel) => {
    for (const name of fsx.readdirSync(dir).sort()) {
      const abs = path.join(dir, name), r = rel ? `${rel}/${name}` : name;
      const st = fsx.lstatSync(abs);
      if (st.isSymbolicLink()) h.update(`l\0${r}\0${fsx.readlinkSync(abs)}\0`);
      else if (st.isDirectory()) { h.update(`d\0${r}\0`); walk(abs, r); }
      else {
        const data = fsx.readFileSync(abs);
        h.update(`f\0${r}\0${data.length}\0`);
        h.update(data);
      }
    }
  };
  walk(p, '');
  return h.digest('hex');
}

/** Copy a file or directory tree, replacing every symlink with the content it points to.
 *  Not fs.cpSync({ dereference }): on Node 22 it leaves symlinked files inside directories as links. */
export function copyDereferenced(fsx, from, to) {
  if (fsx.statSync(from).isDirectory()) {
    fsx.mkdirSync(to, { recursive: true });
    for (const name of fsx.readdirSync(from)) copyDereferenced(fsx, path.join(from, name), path.join(to, name));
  } else {
    fsx.mkdirSync(path.dirname(to), { recursive: true });
    fsx.copyFileSync(from, to);
  }
}

/** Move to the backup dir. rename, with copy + remove fallback on EXDEV (N6). */
export function moveEntry(fsx, from, to) {
  fsx.mkdirSync(path.dirname(to), { recursive: true });
  try {
    fsx.renameSync(from, to);
  } catch (e) {
    if (e.code !== 'EXDEV') throw e;
    fsx.cpSync(from, to, { recursive: true, verbatimSymlinks: true });
    fsx.rmSync(from, { recursive: true, force: true }); // only after a successful copy
  }
}

function backupDir(ctx) {
  if (!ctx.backupRoot && ctx.backupBase) ctx.backupRoot = ctx.backupBase; // shared by the installs of one --update-all
  if (!ctx.backupRoot) {
    const stamp = ctx.now().toISOString().replace(/[:.]/g, '-');
    ctx.backupRoot = path.join(ctx.home, '.tsh-ai-collections-backup', stamp);
  }
  return ctx.backupRoot;
}

/** The backup dir as shown to the user. A dry run or preview creates no folder, so it shows the
 *  literal <timestamp> placeholder instead of a timestamp that will never exist. */
function backupLabel(ctx, dry) {
  return short(ctx, dry ? path.join(path.dirname(backupDir(ctx)), '<timestamp>') : backupDir(ctx));
}

/** Display form of a path: relative to the project dir, or with ~ for the home dir. */
function short(ctx, p) {
  const under = (base) => base && (p === base || p.startsWith(base + path.sep));
  if (under(ctx.projectDir)) return '.' + p.slice(ctx.projectDir.length) || '.';
  if (under(ctx.home)) return '~' + p.slice(ctx.home.length);
  return p;
}

/** N3: symlinks are unlinked, real entries are moved to the backup, never deleted. */
function retire(ctx, p, why) {
  const st = lstat(ctx, p);
  if (!st) return;
  if (st.isSymbolicLink()) {
    ctx.pending.push({ kind: 'symlink', p, why });
    if (ctx.verbose) ctx.log(`${ctx.dry ? 'would remove' : 'removed'} symlink ${p} (${why})`);
    if (!ctx.dry) ctx.fs.unlinkSync(p);
    return;
  }
  const rel = p.replace(/^[A-Za-z]:/, '').replace(/^[\\/]+/, '');
  const dest = path.join(backupDir(ctx), rel);
  ctx.pending.push({ kind: 'move', p, why });
  if (!why.startsWith('legacy')) ctx.stats.backedUp++; // legacy entries are counted by cleanupLegacy
  if (ctx.verbose) ctx.log(`${ctx.dry ? 'would move' : 'moved'} ${p} -> ${ctx.dry ? path.join(backupLabel(ctx, true), rel) : dest} (${why})`);
  if (!ctx.dry) moveEntry(ctx.fs, p, dest);
}

/** Grouped summary of the retire() calls since the last flush (verbose mode logged them one by one). */
function flushRetired(ctx) {
  const items = ctx.pending.splice(0);
  if (ctx.verbose || !items.length) return;
  const groups = new Map();
  for (const it of items) {
    const key = `${it.kind}\0${path.dirname(it.p)}`;
    if (!groups.has(key)) groups.set(key, { kind: it.kind, dir: path.dirname(it.p), names: [], whys: new Set() });
    const g = groups.get(key);
    g.names.push(path.basename(it.p));
    if (!it.why.startsWith('legacy')) g.whys.add(it.why);
  }
  const dry = ctx.dry;
  const sections = [
    ['move', `${dry ? 'Would move' : 'Moved'} to the backup (real directories)`],
    ['symlink', `${dry ? 'Would remove' : 'Removed'} symlinks`],
  ];
  for (const [kind, title] of sections) {
    const gs = [...groups.values()].filter((g) => g.kind === kind);
    if (!gs.length) continue;
    ctx.log(`  ${title}: ${gs.reduce((n, g) => n + g.names.length, 0)}`);
    for (const g of gs) {
      const shown = g.names.slice(0, 3).join(', ');
      const more = g.names.length > 3 ? `, +${g.names.length - 3} more` : '';
      const why = g.whys.size ? `  [${[...g.whys].join('; ')}]` : '';
      ctx.log(`    ${short(ctx, g.dir)}/  (${g.names.length}): ${shown}${more}${why}`);
    }
  }
}


// ---------- legacy cleanup (D3, B1, N1) ----------

function readLegacyJson(ctx) {
  const f = path.join(ctx.source, 'scripts', 'legacy-names.json');
  let raw;
  try { raw = ctx.fs.readFileSync(f, 'utf8'); } catch (e) {
    throw new UsageError(`Cannot read ${f}: ${e.code || e.message}. The legacy cleanup needs scripts/legacy-names.json (is --source a complete checkout?).`);
  }
  try { return JSON.parse(raw); } catch (e) { throw new UsageError(`${f} is not valid JSON: ${e.message}`); }
}

export function loadLegacyNames(ctx) {
  const j = readLegacyJson(ctx);
  const names = new Set([
    ...Object.keys(j.renamed || {}),
    ...(j.deleted || []),
    ...(j.nowSubagents || []),
  ]);
  return names;
}

// Names without the tsh- prefix that the old layout left behind (for example playwright-cli).
export function loadUnprefixedNames(ctx) {
  const list = readLegacyJson(ctx).unprefixed ?? [];
  if (!Array.isArray(list) || !list.every((n) => typeof n === 'string' && /^[a-z0-9-]+$/.test(n))) {
    throw new UsageError('scripts/legacy-names.json: "unprefixed" must be an array of names matching ^[a-z0-9-]+$.');
  }
  return new Set(list);
}

function sourceSkillNames(ctx) {
  const s = new Set();
  for (const d of SKILL_DIRS) for (const n of listDir(ctx, path.join(ctx.source, d))) if (n.startsWith(PREFIX)) s.add(n);
  return s;
}

const LEGACY_LINK_RE = /[\\/]\.cursor[\\/]skills[\\/](agents|commands|workflows|internal)[\\/]/;

export function cleanupLegacy(ctx) {
  const legacyNames = loadLegacyNames(ctx);
  const unprefixed = loadUnprefixedNames(ctx);
  const current = sourceSkillNames(ctx);
  const roots = [ctx.home];
  if (ctx.projectDir) roots.push(ctx.projectDir);
  const uniq = [...new Set(roots.map((r) => path.resolve(r)))];
  let count = 0;
  const seen = new Set();
  const hit = (p, why) => { if (seen.has(p)) return; seen.add(p); count++; retire(ctx, p, why); };

  for (const root of uniq) {
    // (a) + (b): everything tsh-* under .cursor/skills is legacy
    const cs = path.join(root, '.cursor', 'skills');
    for (const n of listDir(ctx, cs)) {
      const p = path.join(cs, n);
      if (n.startsWith(PREFIX)) hit(p, 'legacy: tsh-* under .cursor/skills');
      else if (CATEGORIES.includes(n)) {
        const st = lstat(ctx, p);
        if (!st || !st.isDirectory()) continue;
        for (const m of listDir(ctx, p)) {
          if (m.startsWith(PREFIX) || unprefixed.has(m)) hit(path.join(p, m), `legacy: category folder ${n}/ under .cursor/skills`);
        }
        // the old layout's category folder is empty now: remove it, never one that still holds other files
        if (!ctx.dry && listDir(ctx, p).length === 0) ctx.fs.rmdirSync(p);
      }
    }
    // (b2): unprefixed leftovers are retired in the flat dirs only as symlinks into the old layout or dangling ones
    for (const d of ['.cursor/skills', ...SKILL_DIRS]) {
      for (const n of unprefixed) {
        const p = path.join(root, d, n);
        const st = lstat(ctx, p);
        if (!st || !st.isSymbolicLink()) continue;
        const target = ctx.fs.readlinkSync(p);
        if (isDangling(ctx, p) || LEGACY_LINK_RE.test(target) || LEGACY_LINK_RE.test(path.resolve(path.dirname(p), target))) hit(p, `legacy: unprefixed ${n} left by the old layout`);
      }
    }
    // (c): other target skills dirs
    for (const d of SKILL_DIRS) {
      const dir = path.join(root, d);
      for (const n of listDir(ctx, dir)) {
        if (!n.startsWith(PREFIX)) continue;
        const p = path.join(dir, n);
        const st = lstat(ctx, p);
        if (st.isSymbolicLink()) {
          const target = ctx.fs.readlinkSync(p);
          const abs = path.resolve(dir, target);
          if (isDangling(ctx, p)) { hit(p, 'legacy: dangling symlink'); continue; }
          if (LEGACY_LINK_RE.test(target) || LEGACY_LINK_RE.test(abs)) { hit(p, 'legacy: symlink into old .cursor/skills category layout'); continue; }
        }
        if (legacyNames.has(n) && !current.has(n)) hit(p, 'legacy: name listed in legacy-names.json');
      }
    }
  }
  if (count === 0) ctx.log('Legacy cleanup: nothing to do.');
  else ctx.log(`Legacy cleanup: ${count} entr${count === 1 ? 'y' : 'ies'} ${ctx.dry ? 'would be ' : ''}handled.`);
  flushRetired(ctx);
  ctx.stats.legacy += count;
  return count;
}

// ---------- install ----------

function listSource(ctx, rel, kind) {
  const dir = path.join(ctx.source, rel);
  const st = lstat(ctx, dir);
  if (!st) throw new UsageError(`Source tree not found: ${dir}. Run "npm run generate" or pass --source <repo root>.`);
  return listDir(ctx, dir).filter((n) => n.startsWith(PREFIX) && !n.startsWith('.') &&
    (kind === 'dir' ? ctx.fs.statSync(path.join(dir, n)).isDirectory() : ctx.fs.statSync(path.join(dir, n)).isFile()));
}

function git(ctx, args) {
  try {
    return execFileSync('git', ['-C', ctx.source, ...args], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch { return null; }
}

function sourceCommit(ctx) {
  if (ctx.commit === undefined) ctx.commit = git(ctx, ['rev-parse', 'HEAD']) || null;
  return ctx.commit;
}

/** Remove a managed copy whose on-disk hash still equals the one recorded at install time (no backup). */
function dropUnmodified(ctx, p, verb) {
  if (ctx.verbose) ctx.log(`${ctx.dry ? `would ${verb}` : `${verb}d`} unmodified ${p} (checksum matches the manifest)`);
  if (!ctx.dry) ctx.fs.rmSync(p, { recursive: true, force: true });
}

/** How to handle an existing managed real entry: 'unmodified' (hash matches) or a backup reason. */
function editState(ctx, old, n, p) {
  const recorded = old?.hashes?.[n];
  if (!recorded) return 'no checksum recorded; backed up to be safe';
  return hashEntry(ctx.fs, p) === recorded ? 'unmodified' : 'edited locally';
}

function installTree(ctx, { targetDir, srcRel, kind, tools }) {
  const names = listSource(ctx, srcRel, kind);
  const old = readManifest(ctx, targetDir);
  const oldNames = new Set(old?.names || []);
  const result = { installed: [], skipped: [], pruned: [], replaced: [], removed: [] };
  const hashes = {};
  if (ctx.verbose) ctx.log(`${targetDir}: ${names.length} entries from ${srcRel} (${ctx.mode})`);
  else ctx.log(`${ctx.dry ? 'Would install' : 'Installing'} ${names.length} ${kind === 'dir' ? 'skills' : 'agents'} (${ctx.mode}) -> ${short(ctx, targetDir)}`);
  if (!ctx.dry) ctx.fs.mkdirSync(targetDir, { recursive: true });

  for (const n of names) {
    const src = path.join(ctx.source, srcRel, n);
    const dest = path.join(targetDir, n);
    const st = lstat(ctx, dest);
    if (!st) ctx.stats.added++;
    else {
      if (!st.isSymbolicLink() && !oldNames.has(n) && !ctx.force) {
        ctx.log(`skipped ${short(ctx, dest)}: exists and is not managed by this installer (use --force to replace; it will be backed up)`);
        result.skipped.push(n);
        ctx.stats.skipped++;
        continue;
      }
      if (st.isSymbolicLink()) {
        // a link install whose link already points at this source entry stays as it is
        ctx.stats[ctx.mode === 'link' && ctx.fs.readlinkSync(dest) === src ? 'unchanged' : 'replaced']++;
        retire(ctx, dest, 'replace symlink');
      } else if (ctx.force) retire(ctx, dest, 'force overwrite');
      else if (treesEqual(ctx, src, dest)) {
        ctx.stats[ctx.mode === 'copy' ? 'unchanged' : 'replaced']++;
        if (!ctx.dry) ctx.fs.rmSync(dest, { recursive: true, force: true }); // identical copy: lossless
      } else {
        const state = editState(ctx, old, n, dest);
        if (state === 'unmodified') { dropUnmodified(ctx, dest, 'replace'); result.replaced.push(n); ctx.stats.replaced++; }
        else retire(ctx, dest, state);
      }
    }
    if (ctx.mode === 'link') {
      if (ctx.verbose) ctx.log(`${ctx.dry ? 'would link' : 'linked'} ${dest} -> ${src}`);
      if (!ctx.dry) ctx.fs.symlinkSync(src, dest, kind === 'dir' ? 'dir' : 'file');
    } else {
      if (ctx.verbose) ctx.log(`${ctx.dry ? 'would copy' : 'copied'} ${src} -> ${dest}`);
      if (!ctx.dry) {
        copyDereferenced(ctx.fs, src, dest);
        hashes[n] = hashEntry(ctx.fs, dest); // what landed on disk, so a later --update can tell edits apart
      }
    }
    result.installed.push(n);
    ctx.stats.installed++;
  }

  if (ctx.update) {
    for (const n of oldNames) {
      if (names.includes(n)) continue;
      const p = path.join(targetDir, n);
      const st = lstat(ctx, p);
      if (!st) continue;
      const state = st.isSymbolicLink() ? null : editState(ctx, old, n, p);
      if (state === 'unmodified') { dropUnmodified(ctx, p, 'remove'); result.removed.push(n); ctx.stats.removed++; }
      else retire(ctx, p, state ? `pruned: no longer in source; ${state}` : 'pruned: no longer in source');
      result.pruned.push(n);
      ctx.stats.pruned++;
    }
  }

  if (!ctx.verbose) {
    const count = (k) => `${k} unmodified entr${k === 1 ? 'y' : 'ies'}`;
    if (result.replaced.length) ctx.log(`  ${ctx.dry ? 'Would replace' : 'Replaced'} ${count(result.replaced.length)} with the new version (no backup needed)`);
    if (result.removed.length) ctx.log(`  ${ctx.dry ? 'Would remove' : 'Removed'} ${count(result.removed.length)} no longer in the source (no backup needed)`);
  }
  flushRetired(ctx);

  // Names kept in the manifest: everything installed now, plus earlier ones still on disk (unless pruned)
  const keep = new Set([...result.installed]);
  if (!ctx.update) for (const n of oldNames) if (lstat(ctx, path.join(targetDir, n))) keep.add(n);
  for (const n of result.skipped) if (oldNames.has(n)) keep.add(n);
  if (!ctx.dry) {
    // Entries kept from an earlier run but not reinstalled now keep their recorded hash
    for (const n of keep) if (!(n in hashes) && old?.hashes?.[n]) hashes[n] = old.hashes[n];
    const manifest = {
      version: 2,
      tools: [...new Set([...(old?.tools || []), ...tools])].sort(),
      mode: ctx.mode,
      sourceCommit: sourceCommit(ctx),
      source: ctx.source,
      names: [...keep].sort(),
    };
    // Link mode: entries are symlinks to the clone, there is no installed copy to checksum
    if (ctx.mode === 'copy') manifest.hashes = Object.fromEntries(Object.keys(hashes).sort().map((n) => [n, hashes[n]]));
    ctx.fs.writeFileSync(path.join(targetDir, MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
  }
  return result;
}

export function targetRoot(ctx) {
  return ctx.scope === 'user' ? ctx.home : ctx.projectDir;
}

/** Tools recorded in any manifest below the scope root. */
function recordedTools(ctx) {
  const root = targetRoot(ctx);
  const tools = new Set();
  for (const d of [...SKILL_DIRS, ...Object.values(AGENT_DIRS)]) {
    for (const t of readManifest(ctx, path.join(root, d))?.tools || []) if (TOOLS.includes(t)) tools.add(t);
  }
  return [...tools];
}

// ---------- install registry (an index of installs; the manifests stay the source of truth) ----------

export function registryPath(home) {
  return path.join(home, '.tsh-ai-collections', 'installs.json');
}

const validEntry = (e) => e && typeof e === 'object' && typeof e.path === 'string' && path.isAbsolute(e.path) &&
  ['user', 'project'].includes(e.scope);

/** Read the registry. Absent: empty. Corrupt or unreadable: warn once, move it aside (unless
 *  readOnly) and continue with an empty registry, so a bad index never breaks an install. */
function loadRegistry(ctx, { readOnly = false } = {}) {
  const f = registryPath(ctx.home);
  const empty = { version: 1, installs: [] };
  let j = null, problem = 'corrupt';
  try { j = JSON.parse(ctx.fs.readFileSync(f, 'utf8')); } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return empty;
    if (e.code) problem = `unreadable (${e.code})`;
  }
  if (j && typeof j === 'object' && Array.isArray(j.installs)) {
    const installs = j.installs.filter(validEntry).map((e) => ({ ...e, tools: Array.isArray(e.tools) ? e.tools.filter((t) => TOOLS.includes(t)) : [] }));
    return { version: 1, installs };
  }
  if (readOnly) {
    ctx.log(`Warning: the install registry ${short(ctx, f)} is ${problem}; ignoring it (the next install or --update moves it aside).`);
    return empty;
  }
  let bak = `${f}.bak`;
  if (lstat(ctx, bak)) bak = `${f}.${ctx.now().toISOString().replace(/[:.]/g, '-')}.bak`;
  try {
    ctx.fs.renameSync(f, bak);
    ctx.log(`Warning: the install registry was ${problem}; moved it to ${short(ctx, bak)} and started a new one.`);
  } catch (e) {
    ctx.log(`Warning: the install registry ${short(ctx, f)} is ${problem} and could not be moved aside (${e.code || e.message}); not recording this install.`);
    return { ...empty, keep: true }; // never overwrite a file that could not be preserved
  }
  return empty;
}

/** Atomic write: a temp file in the same directory (mode 0600), then rename over the registry. */
function writeRegistry(ctx, reg) {
  const f = registryPath(ctx.home);
  const dir = path.dirname(f);
  if (!lstat(ctx, dir)) {
    ctx.fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    ctx.fs.chmodSync(dir, 0o700); // mkdir's mode is masked by the umask
  }
  const tmpFile = path.join(dir, `.installs.json.${process.pid}.${Date.now()}.tmp`);
  const installs = [...reg.installs].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.scope < b.scope ? -1 : 1));
  try {
    ctx.fs.writeFileSync(tmpFile, JSON.stringify({ version: 1, installs }, null, 2) + '\n', { mode: 0o600 });
    ctx.fs.chmodSync(tmpFile, 0o600);
    ctx.fs.renameSync(tmpFile, f);
  } catch (e) {
    try { ctx.fs.rmSync(tmpFile, { force: true }); } catch { /* best effort */ }
    throw e;
  }
}

/** Add or refresh the entry for this install root, keyed by (path, scope). Returns whether it did. */
function registerInstall(ctx, tools) {
  try {
    const reg = loadRegistry(ctx);
    if (reg.keep) return false;
    const root = targetRoot(ctx);
    const now = ctx.now().toISOString();
    const prev = reg.installs.find((e) => e.path === root && e.scope === ctx.scope);
    const entry = {
      path: root,
      scope: ctx.scope,
      tools: [...new Set([...(prev?.tools || []), ...tools])].sort(),
      mode: ctx.mode,
      source: ctx.source,
      sourceCommit: sourceCommit(ctx),
      installedAt: prev?.installedAt || now,
      updatedAt: now,
    };
    reg.installs = [...reg.installs.filter((e) => e !== prev), entry];
    writeRegistry(ctx, reg);
    return true;
  } catch (e) {
    ctx.log(`Warning: could not update the install registry ${short(ctx, registryPath(ctx.home))} (${e.code || e.message}); the install itself is complete.`);
    return false;
  }
}

/** Where `commit` stands against HEAD of the source clone: { behind: N } (0: it is HEAD),
 *  { diverged: true } (not HEAD and not behind it: ahead of or diverged from HEAD), or null
 *  when that cannot be told (no commit recorded, not a git clone, commit not in the clone). */
function commitPosition(ctx, commit) {
  if (typeof commit !== 'string' || !/^[0-9a-f]{7,64}$/.test(commit)) return null;
  const head = sourceCommit(ctx);
  const full = head && git(ctx, ['rev-parse', '--verify', '--quiet', `${commit}^{commit}`]);
  if (!full) return null;
  if (full === head) return { behind: 0 };
  const out = git(ctx, ['rev-list', '--count', `${full}..HEAD`]);
  if (!out || !/^\d+$/.test(out)) return null;
  return Number(out) > 0 ? { behind: Number(out) } : { diverged: true };
}

/** Manifests of the recorded tools under an entry's root (every tool dir when the entry records
 *  no valid tool), or null when the install is missing (the root is gone or none of those
 *  manifests exists). */
function entryManifests(ctx, e) {
  const st = lstat(ctx, e.path);
  if (!st || !st.isDirectory()) return null;
  const dirs = e.tools.length ? [...selectSkillTrees(e.tools), ...e.tools.map((t) => AGENT_DIRS[t])]
    : [...SKILL_DIRS, ...Object.values(AGENT_DIRS)];
  const manifests = dirs.map((d) => readManifest(ctx, path.join(e.path, d))).filter(Boolean);
  return manifests.length ? manifests : null;
}

/** Status of one registry entry, read from the manifests under its root (registry as fallback). */
function installStatus(ctx, e) {
  const manifests = entryManifests(ctx, e);
  if (!manifests) return { status: 'missing', commit: e.sourceCommit };
  const commits = [...new Set(manifests.map((m) => m.sourceCommit || null))];
  if (commits.every((c) => c === null)) commits.splice(0, commits.length, e.sourceCommit || null);
  // Several manifests: report the oldest one; one that cannot be placed makes the whole install unknown
  let worst = null, diverged = null;
  for (const c of commits) {
    const pos = commitPosition(ctx, c);
    if (!pos) return { status: 'unknown', commit: c };
    if (pos.diverged) diverged ||= { behind: 0, commit: c };
    else if (!worst || pos.behind > worst.behind) worst = { behind: pos.behind, commit: c };
  }
  if (worst?.behind) return { status: `${worst.behind} commit${worst.behind === 1 ? '' : 's'} behind`, ...worst };
  if (diverged) return { status: 'ahead or diverged', ...diverged };
  return { status: 'up to date', ...worst };
}

const quoteArg = (p) => (/[\s"'$]/.test(p) ? JSON.stringify(p) : p);

function updateCommand(e) {
  return `node scripts/install.mjs --update --scope ${e.scope}${e.scope === 'project' ? ` --project-dir ${quoteArg(e.path)}` : ''}`;
}

/** --list: print every recorded install and how far it is behind the source clone. Writes nothing. */
function noInstallsRecorded(ctx) {
  ctx.log(`No installs recorded yet (${short(ctx, registryPath(ctx.home))}).`);
  ctx.log('Installs made with this installer version are recorded automatically. To record an existing');
  ctx.log(`install, run --update in it, for example: ${updateCommand({ scope: 'project', path: '<project dir>' })}`);
}

/** Pads every column but the last to its widest cell. */
function logTable(ctx, rows) {
  if (!rows.length) return;
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const r of rows) ctx.log('  ' + r.map((c, i) => (i < r.length - 1 ? c.padEnd(widths[i]) : c)).join('  '));
}

function listInstalls(ctx) {
  const reg = loadRegistry(ctx, { readOnly: true });
  const where = short(ctx, registryPath(ctx.home));
  if (!reg.installs.length) { noInstallsRecorded(ctx); return; }
  const rows = reg.installs.map((e) => {
    const s = installStatus(ctx, e);
    return { e, s, cells: [short(ctx, e.path), e.scope, e.tools.join(',') || '-', e.mode || '-', s.commit ? s.commit.slice(0, 7) : '-', s.status] };
  });
  ctx.log(`Recorded installs (source: ${ctx.source}):`);
  logTable(ctx, rows.map((r) => r.cells));
  ctx.log('');
  ctx.log(`Registry: ${where}`);
  const stale = rows.find((r) => r.s.behind > 0) || rows.find((r) => r.s.status === 'unknown') ||
    rows.find((r) => r.s.status === 'ahead or diverged');
  if (stale) ctx.log(`Refresh with: ${updateCommand(stale.e)}`);
  else if (rows.every((r) => r.s.status === 'up to date')) ctx.log('All installs are up to date.');
  else ctx.log('No install is behind; installs marked missing no longer exist on disk.');
}

// ---------- --update-all and --forget-missing ----------

const emptyStats = () => ({ installed: 0, added: 0, replaced: 0, unchanged: 0, backedUp: 0, pruned: 0, removed: 0, skipped: 0, legacy: 0 });
const hasFileChanges = (s) => s.added + s.replaced + s.backedUp + s.pruned + s.legacy > 0;

/** Compact description of the counts an update produced (or would produce). */
function describeStats(s) {
  const parts = [];
  if (s.replaced) parts.push(`${s.replaced} replaced (unmodified)`);
  if (s.backedUp) parts.push(`${s.backedUp} backed up (edited)`);
  if (s.pruned) parts.push(`${s.pruned} pruned`);
  if (s.added) parts.push(`${s.added} new`);
  if (s.legacy) parts.push(`${s.legacy} legacy cleaned`);
  if (s.skipped) parts.push(`${s.skipped} skipped (unmanaged)`);
  return parts.join(', ');
}

function realPath(ctx, p) {
  try { return ctx.fs.realpathSync(p); } catch { return path.resolve(p); }
}

function insideSource(ctx, p) {
  const src = realPath(ctx, ctx.source), real = realPath(ctx, p);
  return real === src || real.startsWith(src + path.sep);
}

/** One --update of a registry entry through run(), the same code path as a single --update. */
function updateEntry(ctx, opts, e, { dry, show }) {
  const argv = ['--update', '--scope', e.scope, ...(e.scope === 'project' ? ['--project-dir', e.path] : []),
    ...(e.tools.length ? ['--tools', e.tools.join(',')] : []), '--mode', e.mode === 'link' ? 'link' : 'copy',
    ...(dry ? ['--dry-run'] : []), ...(show ? ['--verbose'] : [])];
  return run(argv, { ...opts, home: ctx.home, source: ctx.source, lines: [], quiet: !show,
    stdout: (m) => ctx.log(m), backupRoot: backupDir(ctx) });
}

/** Inner lines that report a problem; the compact --update-all view prints them after its table. */
const NOTE_RE = /^(Warning:|ignored |skipped )/;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** --update-all: preview (apply = false) or apply the update of every recorded install. */
function updateAll(ctx, opts, apply) {
  const reg = loadRegistry(ctx, { readOnly: true });
  const total = emptyStats();
  const done = { code: 0, lines: ctx.lines, ctx, stats: total, results: [] };
  if (!reg.installs.length) { noInstallsRecorded(ctx); return done; }
  ctx.log(`${apply ? 'Updating' : 'Update preview for'} ${reg.installs.length} recorded install${reg.installs.length === 1 ? '' : 's'} (source: ${ctx.source}):`);
  const home = realPath(ctx, ctx.home);
  let backups = false;
  for (const e of reg.installs) {
    const s = installStatus(ctx, e);
    const r = { path: e.path, scope: e.scope, tools: e.tools.join(',') || '-', status: s.status, outcome: 'skipped', detail: '', stats: null, notes: [] };
    done.results.push(r);
    if (s.status === 'missing') r.detail = 'skipped: no longer on disk';
    else if (insideSource(ctx, e.path)) r.detail = 'skipped: inside the source clone';
    else if (e.scope === 'user' && realPath(ctx, e.path) !== home) r.detail = 'skipped: user install of another home dir';
    else {
      if (ctx.verbose) { ctx.log(''); ctx.log(`== ${short(ctx, e.path)} (${e.scope}, ${r.tools}) ==`); }
      try {
        const res = updateEntry(ctx, opts, e, { dry: true, show: ctx.verbose && !apply });
        r.stats = res.stats;
        r.notes = res.lines.filter((l) => NOTE_RE.test(l));
        const skips = res.stats.skipped;
        // an install behind the clone gets its manifests and registry record moved to the current commit;
        // one with unmanaged entries runs too, so it ends like a single --update would (exit 1)
        const pending = hasFileChanges(res.stats) || s.behind > 0 || skips > 0;
        if (!pending) {
          r.outcome = 'unchanged';
          r.detail = 'no changes';
        } else if (!apply) {
          r.outcome = skips ? 'pending-skips' : 'pending';
          const what = describeStats({ ...res.stats, skipped: 0 }) || (skips ? 'no file changes' : 'no file changes; records the current commit');
          r.detail = skips ? `${what}; will skip ${plural(skips, 'unmanaged entry', 'unmanaged entries')} (exit 1)` : what;
          backups ||= Boolean(res.ctx.backupRoot);
        } else {
          const real = updateEntry(ctx, opts, e, { dry: false, show: ctx.verbose });
          r.stats = real.stats;
          r.notes = real.lines.filter((l) => NOTE_RE.test(l));
          backups ||= Boolean(real.ctx.backupRoot);
          // a single --update exits 1 only when it skipped unmanaged entries; anything else throws
          r.outcome = real.stats.skipped ? 'updated-skips' : 'updated';
          const label = `${real.stats.skipped ? 'updated with skipped entries' : 'updated'}${real.registered === false ? ' (registry not refreshed)' : ''}`;
          r.detail = `${label}: ${describeStats(real.stats) || 'recorded the current commit'}`;
        }
      } catch (err) {
        r.outcome = 'failed';
        r.detail = `failed: ${err.message}`;
      }
    }
    if (r.outcome !== 'unchanged' && r.outcome !== 'skipped') for (const k of Object.keys(total)) total[k] += r.stats?.[k] || 0;
    if (ctx.verbose) ctx.log(`-> ${short(ctx, e.path)}: ${r.detail}`);
  }
  const by = (o) => done.results.filter((r) => r.outcome === o).length;
  if (!ctx.verbose) {
    logTable(ctx, done.results.map((r) => [short(ctx, r.path), r.scope, r.tools, r.status, r.detail]));
    // the compact view runs the updates quietly: repeat what they reported as a problem (verbose showed it inline)
    const noted = done.results.filter((r) => r.notes.length);
    if (noted.length) {
      ctx.log('');
      ctx.log('Messages from the updates:');
      for (const r of noted) { ctx.log(`  ${short(ctx, r.path)}`); for (const l of r.notes) ctx.log(`    ${l}`); }
    }
  }
  ctx.log('');
  const counts = apply
    ? `${by('updated')} updated, ${by('updated-skips')} updated with skipped entries, ${by('failed')} failed, ${by('unchanged')} without changes, ${by('skipped')} skipped`
    : `${by('pending')} to update${by('pending-skips') ? `, ${by('pending-skips')} to update with skipped entries` : ''}, ${by('unchanged')} without changes, ${by('skipped')} skipped${by('failed') ? `, ${by('failed')} failed` : ''}`;
  ctx.log(`Totals: ${counts}; changes: ${describeStats(total) || 'none'}`);
  if (done.results.some((r) => r.status === 'missing')) ctx.log('Missing installs are skipped; drop them from the registry with --forget-missing.');
  if (backups) ctx.log(`${apply ? 'Backups' : 'Backups would go to'}: ${backupLabel(ctx, !apply)}/ (originals are kept under their absolute path)`);
  if (!apply) ctx.log(by('pending') + by('pending-skips') ? 'Run again with --yes to apply.' : 'Nothing to update.');
  const withSkips = done.results.filter((r) => r.outcome === (apply ? 'updated-skips' : 'pending-skips'));
  const failed = by('failed');
  if (withSkips.length || failed) {
    done.code = 1;
    const why = [];
    if (withSkips.length) why.push(`${plural(withSkips.length, 'install', 'installs')} ${apply ? 'updated with skipped entries' : 'will skip unmanaged entries'}`);
    if (failed) why.push(`${plural(failed, 'install', 'installs')} failed`);
    ctx.log(`Exit code 1: ${why.join(', ')}.`);
  }
  if (withSkips.length) {
    ctx.log('Unmanaged tsh-* entries are never replaced in bulk. To replace them, run a single update with --force');
    ctx.log('in that install; it moves each such entry to the backup first:');
    for (const r of withSkips) ctx.log(`  ${updateCommand(r)} --force`);
  }
  return done;
}

/** --forget-missing: drop registry entries whose install is gone. Reads installs, writes only the
 *  registry. Returns the exit code: 1 when the registry could not be rewritten (it is left as it was). */
function forgetMissing(ctx) {
  const reg = loadRegistry(ctx, { readOnly: true });
  if (!reg.installs.length) { noInstallsRecorded(ctx); return 0; }
  const gone = reg.installs.filter((e) => !entryManifests(ctx, e));
  if (!gone.length) { ctx.log('No recorded install is missing; nothing to forget.'); return 0; }
  const f = registryPath(ctx.home);
  if (!ctx.dry) {
    // rewrite from the file as it is, so entries this version does not read are kept unchanged;
    // writeRegistry replaces the file atomically, so a failure leaves it as it was
    try {
      const raw = JSON.parse(ctx.fs.readFileSync(f, 'utf8'));
      if (!raw || !Array.isArray(raw.installs)) throw new Error('not a registry file');
      const drop = new Set(gone.map((e) => `${e.scope}\0${e.path}`));
      writeRegistry(ctx, { installs: raw.installs.filter((e) => !(validEntry(e) && drop.has(`${e.scope}\0${e.path}`))) });
    } catch (e) {
      ctx.log(`Warning: could not rewrite the install registry ${short(ctx, f)} (${e.code || e.message}); left it unchanged, nothing forgotten.`);
      return 1;
    }
  }
  ctx.log(`${ctx.dry ? 'Would forget' : 'Forgot'} ${gone.length} missing install${gone.length === 1 ? '' : 's'}:`);
  for (const e of gone) ctx.log(`  ${e.path}  (${e.scope})`);
  if (!ctx.dry) ctx.log(`Registry: ${short(ctx, f)}`);
  return 0;
}

function mcpGuidance(ctx, tools) {
  const user = ctx.scope === 'user';
  const lines = ['', 'MCP servers are not configured automatically. Merge the generated file into your config:'];
  if (tools.includes('cursor')) lines.push(`  cursor: merge ${path.join(ctx.source, '.cursor/mcp.json')} into ${user ? '~/.cursor/mcp.json' : '<project>/.cursor/mcp.json'}`);
  if (tools.includes('claude')) lines.push(`  claude: merge ${path.join(ctx.source, '.mcp.json')} into ${user ? '~/.claude.json (mcpServers)' : '<project>/.mcp.json'}`);
  if (tools.includes('codex')) lines.push(`  codex:  merge ${path.join(ctx.source, '.codex/config.toml')} into ${user ? '~/.codex/config.toml' : '<project>/.codex/config.toml'}`);
  if (tools.length === 3) {
    lines.push('', 'Cursor reads .agents/skills and .claude/skills, so skills may be listed twice. If so, turn off',
      'Settings > "Include Third-Party Plugins, Skills, and Other Configs"; Cursor then reads .agents/skills and .cursor/agents natively.');
  }
  return lines;
}

export function makeCtx(opts, o) {
  const fsx = opts.fs || nodeFs;
  const home = path.resolve(opts.home || process.env.TSH_HOME || os.homedir());
  const scope = o.scope;
  const cwd = opts.cwd || process.cwd();
  const projectDir = o.projectDir ? path.resolve(cwd, o.projectDir) : (scope === 'project' ? path.resolve(cwd) : null);
  const lines = opts.lines || [];
  return {
    fs: fsx, home, projectDir, scope, mode: o.mode, dry: o.dryRun, force: o.force, update: o.update,
    verbose: o.verbose, pending: [], backupBase: opts.backupRoot,
    // what installTree, retire and cleanupLegacy did (or would do in a dry run), returned by run()
    stats: emptyStats(),
    source: path.resolve(cwd, o.source || opts.source || SCRIPT_ROOT),
    now: opts.now || (() => new Date()),
    log: (m) => { lines.push(m); if (!opts.quiet) (opts.stdout || console.log)(m); },
    lines,
  };
}

/** Programmatic entry point. Returns { code, lines, ctx, stats } (--update-all adds results; an
 *  install or --update adds registered: whether the registry was refreshed, null in a dry run).
 *  Throws UsageError for bad input. */
export function run(argv, opts = {}) {
  const o = parseArgs(argv);
  if (o.help) { (opts.quiet ? () => {} : (opts.stdout || console.log))(HELP); return { code: 0, lines: [HELP] }; }
  const ctx = makeCtx(opts, o);
  if (o.list) { listInstalls(ctx); return { code: 0, lines: ctx.lines, ctx, stats: ctx.stats }; }
  if (o.forgetMissing) return { code: forgetMissing(ctx), lines: ctx.lines, ctx, stats: ctx.stats };
  if (o.updateAll) return updateAll(ctx, opts, o.yes && !o.dryRun);
  if (ctx.scope === 'project' && !ctx.projectDir) throw new UsageError('--scope project needs a project dir');
  if (insideSource(ctx, targetRoot(ctx))) {
    throw new UsageError(`The install target (${targetRoot(ctx)}) is inside the source checkout (${ctx.source}); installing there would overwrite the generated tree. Use a different ${ctx.scope === 'project' ? '--project-dir' : 'home'}.`);
  }
  if (ctx.dry) ctx.log('[dry-run] no changes will be made');

  cleanupLegacy(ctx);
  if (o.migrateLegacy) return { code: 0, lines: ctx.lines, ctx, stats: ctx.stats };

  let tools = o.tools;
  if (o.update && !tools) {
    tools = recordedTools(ctx);
    if (!tools.length) throw new UsageError(`--update found no ${MANIFEST} under ${targetRoot(ctx)}; install first with --tools.`);
    ctx.log(`Updating tools from manifests: ${tools.join(', ')}`);
  }
  if (!tools) throw new UsageError('--tools is required (cursor,claude,codex)');

  const root = targetRoot(ctx);
  let skipped = 0;
  for (const rel of selectSkillTrees(tools)) {
    skipped += installTree(ctx, { targetDir: path.join(root, rel), srcRel: rel, kind: 'dir', tools }).skipped.length;
  }
  for (const t of tools) {
    skipped += installTree(ctx, { targetDir: path.join(root, AGENT_DIRS[t]), srcRel: AGENT_DIRS[t], kind: 'file', tools: [t] }).skipped.length;
  }
  const registered = ctx.dry ? null : registerInstall(ctx, tools); // also after skipped entries: what was installed is recorded
  for (const l of mcpGuidance(ctx, tools)) ctx.log(l);
  if (ctx.backupRoot) ctx.log(`${ctx.dry ? 'Backups would go to' : 'Backups'}: ${backupLabel(ctx, ctx.dry)}/ (originals are kept under their absolute path)`);
  if (!ctx.verbose && ctx.dry) ctx.log('Use --verbose to see every entry.');
  return { code: skipped ? 1 : 0, lines: ctx.lines, ctx, stats: ctx.stats, registered };
}

function main() {
  try {
    process.exitCode = run(process.argv.slice(2)).code;
  } catch (e) {
    if (e instanceof UsageError) { console.error(`Error: ${e.message}\n\nRun with --help for usage.`); process.exitCode = 2; }
    else throw e;
  }
}

if (process.argv[1] && nodeFs.realpathSync(process.argv[1]) === nodeFs.realpathSync(fileURLToPath(import.meta.url))) main();
