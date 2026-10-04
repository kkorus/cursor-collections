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
  --dry-run            print what would happen and change nothing
  --verbose, -v        one line per entry instead of grouped summaries
  --force              replace an unmanaged tsh-* entry (it is moved to the backup first)
  --help               show this text

Legacy cleanup runs before every install/update. Symlinks are removed; real directories
are moved to ~/.tsh-ai-collections-backup/<timestamp>/ and never hard-deleted.
Home dir: $TSH_HOME if set, else the OS home dir. MCP config is never written; the
installer prints which generated file to merge for each tool.
`;

export function parseArgs(argv) {
  const o = { tools: null, scope: 'user', projectDir: null, source: null, mode: 'copy',
    update: false, migrateLegacy: false, dryRun: false, force: false, help: false, verbose: false };
  const valued = { '--tools': 'tools', '--scope': 'scope', '--project-dir': 'projectDir',
    '--source': 'source', '--mode': 'mode' };
  const flags = { '--update': 'update', '--migrate-legacy': 'migrateLegacy',
    '--dry-run': 'dryRun', '--force': 'force', '--verbose': 'verbose', '-v': 'verbose', '--help': 'help', '-h': 'help' };
  for (let i = 0; i < argv.length; i++) {
    let [k, v] = argv[i].startsWith('--') && argv[i].includes('=')
      ? [argv[i].slice(0, argv[i].indexOf('=')), argv[i].slice(argv[i].indexOf('=') + 1)]
      : [argv[i], undefined];
    if (k in flags) { o[flags[k]] = true; continue; }
    if (!(k in valued)) throw new UsageError(`Unknown argument: ${argv[i]}`);
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
function treesEqual(ctx, a, b) {
  const sa = ctx.fs.statSync(a), sb = ctx.fs.statSync(b);
  if (sa.isDirectory() !== sb.isDirectory()) return false;
  if (!sa.isDirectory()) return ctx.fs.readFileSync(a).equals(ctx.fs.readFileSync(b));
  const la = ctx.fs.readdirSync(a).sort(), lb = ctx.fs.readdirSync(b).sort();
  if (la.join('\0') !== lb.join('\0')) return false;
  return la.every((n) => treesEqual(ctx, path.join(a, n), path.join(b, n)));
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
  if (!ctx.backupRoot) {
    const stamp = ctx.now().toISOString().replace(/[:.]/g, '-');
    ctx.backupRoot = path.join(ctx.home, '.tsh-ai-collections-backup', stamp);
  }
  return ctx.backupRoot;
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
  const dest = path.join(backupDir(ctx), p.replace(/^[A-Za-z]:/, '').replace(/^[\\/]+/, ''));
  ctx.pending.push({ kind: 'move', p, why });
  if (ctx.verbose) ctx.log(`${ctx.dry ? 'would move' : 'moved'} ${p} -> ${dest} (${why})`);
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

export function loadLegacyNames(ctx) {
  const f = path.join(ctx.source, 'scripts', 'legacy-names.json');
  let raw;
  try { raw = ctx.fs.readFileSync(f, 'utf8'); } catch (e) {
    throw new UsageError(`Cannot read ${f}: ${e.code || e.message}. The legacy cleanup needs scripts/legacy-names.json (is --source a complete checkout?).`);
  }
  let j;
  try { j = JSON.parse(raw); } catch (e) { throw new UsageError(`${f} is not valid JSON: ${e.message}`); }
  const names = new Set([
    ...Object.keys(j.renamed || {}),
    ...(j.deleted || []),
    ...(j.nowSubagents || []),
  ]);
  return names;
}

function sourceSkillNames(ctx) {
  const s = new Set();
  for (const d of SKILL_DIRS) for (const n of listDir(ctx, path.join(ctx.source, d))) if (n.startsWith(PREFIX)) s.add(n);
  return s;
}

const LEGACY_LINK_RE = /[\\/]\.cursor[\\/]skills[\\/](agents|commands|workflows|internal)[\\/]/;

export function cleanupLegacy(ctx) {
  const legacyNames = loadLegacyNames(ctx);
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
          if (m.startsWith(PREFIX)) hit(path.join(p, m), `legacy: category folder ${n}/ under .cursor/skills`);
        }
        // the old layout's category folder is empty now: remove it, never one that still holds other files
        if (!ctx.dry && listDir(ctx, p).length === 0) ctx.fs.rmdirSync(p);
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

function sourceCommit(ctx) {
  try {
    return execFileSync('git', ['-C', ctx.source, 'rev-parse', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch { return null; }
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
    if (st) {
      if (!st.isSymbolicLink() && !oldNames.has(n) && !ctx.force) {
        ctx.log(`skipped ${short(ctx, dest)}: exists and is not managed by this installer (use --force to replace; it will be backed up)`);
        result.skipped.push(n);
        continue;
      }
      if (st.isSymbolicLink()) retire(ctx, dest, 'replace symlink');
      else if (ctx.force) retire(ctx, dest, 'force overwrite');
      else if (treesEqual(ctx, src, dest)) {
        if (!ctx.dry) ctx.fs.rmSync(dest, { recursive: true, force: true }); // identical copy: lossless
      } else {
        const state = editState(ctx, old, n, dest);
        if (state === 'unmodified') { dropUnmodified(ctx, dest, 'replace'); result.replaced.push(n); }
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
  }

  if (ctx.update) {
    for (const n of oldNames) {
      if (names.includes(n)) continue;
      const p = path.join(targetDir, n);
      const st = lstat(ctx, p);
      if (!st) continue;
      const state = st.isSymbolicLink() ? null : editState(ctx, old, n, p);
      if (state === 'unmodified') { dropUnmodified(ctx, p, 'remove'); result.removed.push(n); }
      else retire(ctx, p, state ? `pruned: no longer in source; ${state}` : 'pruned: no longer in source');
      result.pruned.push(n);
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
    verbose: o.verbose, pending: [],
    source: path.resolve(cwd, o.source || opts.source || SCRIPT_ROOT),
    now: opts.now || (() => new Date()),
    log: (m) => { lines.push(m); if (!opts.quiet) (opts.stdout || console.log)(m); },
    lines,
  };
}

/** Programmatic entry point. Returns { code, lines }. Throws UsageError for bad input. */
export function run(argv, opts = {}) {
  const o = parseArgs(argv);
  if (o.help) { (opts.quiet ? () => {} : (opts.stdout || console.log))(HELP); return { code: 0, lines: [HELP] }; }
  const ctx = makeCtx(opts, o);
  if (ctx.scope === 'project' && !ctx.projectDir) throw new UsageError('--scope project needs a project dir');
  const realOf = (p) => { try { return ctx.fs.realpathSync(p); } catch { return path.resolve(p); } };
  const srcReal = realOf(ctx.source);
  const rootReal = realOf(targetRoot(ctx));
  if (rootReal === srcReal || rootReal.startsWith(srcReal + path.sep)) {
    throw new UsageError(`The install target (${targetRoot(ctx)}) is inside the source checkout (${ctx.source}); installing there would overwrite the generated tree. Use a different ${ctx.scope === 'project' ? '--project-dir' : 'home'}.`);
  }
  if (ctx.dry) ctx.log('[dry-run] no changes will be made');

  cleanupLegacy(ctx);
  if (o.migrateLegacy) return { code: 0, lines: ctx.lines, ctx };

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
  for (const l of mcpGuidance(ctx, tools)) ctx.log(l);
  if (ctx.backupRoot) ctx.log(`${ctx.dry ? 'Backups would go to' : 'Backups'}: ${short(ctx, ctx.backupRoot)}/ (originals are kept under their absolute path)`);
  if (!ctx.verbose && ctx.dry) ctx.log('Use --verbose to see every entry.');
  return { code: skipped ? 1 : 0, lines: ctx.lines, ctx };
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
