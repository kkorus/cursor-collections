import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run, selectSkillTrees, moveEntry, hashEntry, registryPath, UsageError, MANIFEST } from '../install.mjs';
import { execFileSync } from 'node:child_process';

const SCRIPT = path.resolve(import.meta.dirname, '..', 'install.mjs');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tsh-install-test-'));
const put = (root, rel, content = 'x') => {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
};
const exists = (p) => { try { fs.lstatSync(p); return true; } catch { return false; } };

const LEGACY = { renamed: { 'tsh-code-reviewing': 'tsh-reviewing-code' }, deleted: ['tsh-old-gone'], nowSubagents: ['tsh-architect'] };

function makeSource({ skills = ['tsh-alpha', 'tsh-beta'], agents = ['tsh-agent'], legacy = LEGACY } = {}) {
  const src = tmp();
  for (const d of ['.agents/skills', '.claude/skills']) {
    for (const s of skills) {
      put(src, `${d}/${s}/SKILL.md`, `skill ${s}`);
      put(src, `${d}/${s}/references/r.md`, 'ref');
    }
    put(src, `${d}/not-ours/SKILL.md`, 'ignored by installer');
  }
  for (const a of agents) {
    put(src, `.cursor/agents/${a}.md`, 'cursor agent');
    put(src, `.claude/agents/${a}.md`, 'claude agent');
    put(src, `.codex/agents/${a}.toml`, 'codex agent');
  }
  if (legacy) put(src, 'scripts/legacy-names.json', JSON.stringify(legacy));
  return src;
}

function env() {
  const home = tmp();
  const project = tmp();
  const source = makeSource();
  const go = (args, extra = {}) => run(args, { home, cwd: project, source, quiet: true, ...extra });
  return { home, project, source, go };
}

test('--force with the target inside the source checkout raises a UsageError and moves nothing', () => {
  const { source, go } = env();
  assert.throws(() => go(['--scope', 'project', '--project-dir', source, '--tools', 'claude', '--force']), UsageError);
  assert.ok(exists(path.join(source, '.claude/skills/tsh-alpha/SKILL.md')));
});

test('--update ignores manifest names with path separators or without the tsh- prefix', () => {
  const { home, go } = env();
  const victim = path.join(path.dirname(home), `victim-${path.basename(home)}`);
  put(victim, 'keep.txt');
  put(home, '.claude/skills/other/SKILL.md');
  go(['--tools', 'claude']);
  const mf = path.join(home, '.claude/skills', MANIFEST);
  const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
  m.names.push(`../../${path.basename(victim)}`, 'other', 'tsh-a/b');
  fs.writeFileSync(mf, JSON.stringify(m));
  const r = go(['--update']);
  assert.equal(r.code, 0);
  assert.ok(exists(path.join(victim, 'keep.txt')));
  assert.ok(exists(path.join(home, '.claude/skills/other/SKILL.md')));
  fs.rmSync(victim, { recursive: true, force: true });
});

test('--update reports only entries it actually pruned', () => {
  const { home, go } = env();
  go(['--tools', 'claude']);
  const mf = path.join(home, '.claude/skills', MANIFEST);
  const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
  m.names.push('tsh-never-there');
  fs.writeFileSync(mf, JSON.stringify(m));
  const r = go(['--update']);
  assert.ok(!r.lines.some((l) => l.includes('tsh-never-there')));
});

test('tree selection table: all 7 rows', () => {
  const rows = [
    [['cursor'], ['.agents/skills']],
    [['claude'], ['.claude/skills']],
    [['codex'], ['.agents/skills']],
    [['cursor', 'claude'], ['.claude/skills']],
    [['cursor', 'codex'], ['.agents/skills']],
    [['claude', 'codex'], ['.agents/skills', '.claude/skills']],
    [['cursor', 'claude', 'codex'], ['.agents/skills', '.claude/skills']],
  ];
  for (const [tools, want] of rows) assert.deepEqual(selectSkillTrees(tools).sort(), want, tools.join('+'));
});

test('installs the selected trees and agents into HOME, writes manifests, leaves non-tsh alone', () => {
  const { home, go, source } = env();
  put(home, '.claude/skills/my-skill/SKILL.md', 'mine');
  put(home, '.claude/agents/my-agent.md', 'mine');
  const r = go(['--tools', 'cursor,claude']);
  assert.equal(r.code, 0);
  assert.ok(exists(path.join(home, '.claude/skills/tsh-alpha/references/r.md')));
  assert.ok(!exists(path.join(home, '.agents/skills')), 'cursor+claude installs only .claude/skills');
  assert.ok(exists(path.join(home, '.cursor/agents/tsh-agent.md')));
  assert.ok(exists(path.join(home, '.claude/agents/tsh-agent.md')));
  assert.ok(!exists(path.join(home, '.codex')));
  assert.ok(!exists(path.join(home, '.claude/skills/not-ours')));
  assert.equal(fs.readFileSync(path.join(home, '.claude/skills/my-skill/SKILL.md'), 'utf8'), 'mine');
  assert.equal(fs.readFileSync(path.join(home, '.claude/agents/my-agent.md'), 'utf8'), 'mine');
  const m = JSON.parse(fs.readFileSync(path.join(home, '.claude/skills', MANIFEST), 'utf8'));
  assert.deepEqual(m.names, ['tsh-alpha', 'tsh-beta']);
  assert.deepEqual(m.tools, ['claude', 'cursor']);
  assert.ok('sourceCommit' in m);
  assert.ok(r.lines.some((l) => /cursor: merge .*\.cursor\/mcp\.json/.test(l)));
  assert.ok(!exists(path.join(home, '.cursor/mcp.json')), 'MCP config is never written');
  assert.ok(!exists(path.join(source, '.cursor/mcp.json')));
});

test('all three tools: both trees, Cursor duplicate guidance; project scope uses project dir', () => {
  const { home, project, go } = env();
  const r = go(['--tools', 'cursor,claude,codex', '--scope', 'project']);
  for (const p of ['.agents/skills/tsh-alpha', '.claude/skills/tsh-alpha', '.cursor/agents/tsh-agent.md', '.codex/agents/tsh-agent.toml']) {
    assert.ok(exists(path.join(project, p)), p);
  }
  assert.deepEqual(fs.readdirSync(home), ['.tsh-ai-collections'], 'HOME holds only the install registry after a project install');
  assert.ok(r.lines.some((l) => /Include Third-Party/.test(l)));
});

test('--dry-run prints actions and changes nothing (also for legacy cleanup)', () => {
  const { home, go } = env();
  put(home, '.cursor/skills/tsh-architect/SKILL.md', 'old');
  const r = go(['--tools', 'claude', '--dry-run', '--verbose']);
  assert.ok(r.lines.some((l) => /would copy/.test(l)));
  assert.ok(r.lines.some((l) => /would move .*tsh-architect/.test(l)));
  assert.deepEqual(fs.readdirSync(home).sort(), ['.cursor']);
  assert.ok(exists(path.join(home, '.cursor/skills/tsh-architect/SKILL.md')));
});

test('default dry-run output is grouped: one line per folder, shortened paths, backup location once', () => {
  const { home, go } = env();
  for (const n of ['a', 'b', 'c', 'd', 'e']) put(home, `.cursor/skills/agents/tsh-old-${n}/SKILL.md`, 'old');
  fs.mkdirSync(path.join(home, '.cursor/skills'), { recursive: true });
  const r = go(['--tools', 'claude', '--dry-run']);
  const text = r.lines.join('\n');
  assert.ok(!r.lines.some((l) => /^would (move|copy|remove)/.test(l)), 'no per-entry lines');
  assert.ok(r.lines.some((l) => /^ {4}~\/\.cursor\/skills\/agents\/ {2}\(5\): tsh-old-a, tsh-old-b, tsh-old-c, \+2 more/.test(l)), text);
  assert.ok(r.lines.some((l) => /Would move to the backup \(real directories\): 5/.test(l)), text);
  assert.equal(r.lines.filter((l) => /\.tsh-ai-collections-backup/.test(l)).length, 1, 'backup location printed once');
  assert.ok(r.lines.some((l) => /Would install \d+ (skills|agents) \(copy\) -> ~\/\.claude/.test(l)), text);
  assert.ok(exists(path.join(home, '.cursor/skills/agents/tsh-old-a/SKILL.md')), 'dry-run changed nothing');
});

test('does not overwrite an unmanaged tsh-* entry without --force; --force backs it up', () => {
  const { home, go } = env();
  put(home, '.claude/skills/tsh-alpha/SKILL.md', 'user edited');
  const r = go(['--tools', 'claude']);
  assert.equal(r.code, 1);
  assert.equal(fs.readFileSync(path.join(home, '.claude/skills/tsh-alpha/SKILL.md'), 'utf8'), 'user edited');
  assert.ok(exists(path.join(home, '.claude/skills/tsh-beta/SKILL.md')));
  const r2 = go(['--tools', 'claude', '--force'], { now: () => new Date('2026-01-02T03:04:05Z') });
  assert.equal(r2.code, 0);
  assert.equal(fs.readFileSync(path.join(home, '.claude/skills/tsh-alpha/SKILL.md'), 'utf8'), 'skill tsh-alpha');
  const backups = path.join(home, '.tsh-ai-collections-backup');
  const [stamp] = fs.readdirSync(backups);
  assert.match(stamp, /^2026-01-02T03-04-05/);
  const moved = path.join(backups, stamp, path.join(home, '.claude/skills/tsh-alpha/SKILL.md'));
  assert.equal(fs.readFileSync(moved, 'utf8'), 'user edited');
});

test('--update prunes a renamed skill into the backup when locally edited, removes it without backup when unmodified', () => {
  const { home, source, go } = env();
  go(['--tools', 'claude']);
  fs.appendFileSync(path.join(home, '.claude/skills/tsh-beta/SKILL.md'), ' edited');
  for (const d of ['.agents/skills', '.claude/skills']) {
    fs.renameSync(path.join(source, d, 'tsh-alpha'), path.join(source, d, 'tsh-alpha-renamed'));
    fs.renameSync(path.join(source, d, 'tsh-beta'), path.join(source, d, 'tsh-beta-renamed'));
  }
  const r = go(['--update']);
  assert.equal(r.code, 0);
  const skills = path.join(home, '.claude/skills');
  assert.ok(!exists(path.join(skills, 'tsh-alpha')));
  assert.ok(!exists(path.join(skills, 'tsh-beta')));
  assert.ok(exists(path.join(skills, 'tsh-alpha-renamed/SKILL.md')));
  const m = JSON.parse(fs.readFileSync(path.join(skills, MANIFEST), 'utf8'));
  assert.deepEqual(m.names, ['tsh-alpha-renamed', 'tsh-beta-renamed']);
  // the edited pruned dir is kept in the backup, never hard-deleted; the unmodified one is just removed
  const backups = path.join(home, '.tsh-ai-collections-backup');
  const [stamp] = fs.readdirSync(backups);
  assert.ok(exists(path.join(backups, stamp, skills, 'tsh-beta/SKILL.md')));
  assert.ok(!exists(path.join(backups, stamp, skills, 'tsh-alpha')));
  assert.ok(r.lines.some((l) => /Removed 1 unmodified entry no longer in the source/.test(l)), r.lines.join('\n'));
  assert.ok(r.lines.some((l) => /pruned: no longer in source; edited locally/.test(l)), r.lines.join('\n'));
});

// ---------- content checksums (manifest version 2) ----------

const changeSource = (source, skill = 'tsh-alpha') => {
  for (const d of ['.agents/skills', '.claude/skills']) fs.writeFileSync(path.join(source, d, skill, 'SKILL.md'), 'new version');
};
const manifestOf = (home, rel = '.claude/skills') => JSON.parse(fs.readFileSync(path.join(home, rel, MANIFEST), 'utf8'));
const backupRoot = (home) => path.join(home, '.tsh-ai-collections-backup');

test('copy install writes version 2 manifests with a sha256 per entry, matching hashEntry of the installed copy', () => {
  const { home, go } = env();
  go(['--tools', 'claude']);
  const m = manifestOf(home);
  assert.equal(m.version, 2);
  assert.deepEqual(Object.keys(m.hashes), ['tsh-alpha', 'tsh-beta']);
  assert.equal(m.hashes['tsh-alpha'], hashEntry(fs, path.join(home, '.claude/skills/tsh-alpha')));
  const am = manifestOf(home, '.claude/agents');
  assert.match(am.hashes['tsh-agent.md'], /^[0-9a-f]{64}$/);
});

test('--update replaces an unmodified copy of a changed source without a backup', () => {
  const { home, source, go } = env();
  go(['--tools', 'claude']);
  changeSource(source);
  fs.writeFileSync(path.join(source, '.claude/agents/tsh-agent.md'), 'new agent');
  const r = go(['--update']);
  assert.equal(r.code, 0);
  assert.equal(fs.readFileSync(path.join(home, '.claude/skills/tsh-alpha/SKILL.md'), 'utf8'), 'new version');
  assert.equal(fs.readFileSync(path.join(home, '.claude/agents/tsh-agent.md'), 'utf8'), 'new agent');
  assert.ok(!exists(backupRoot(home)), 'no backup directory');
  assert.ok(r.lines.some((l) => /Replaced 1 unmodified entry with the new version/.test(l)), r.lines.join('\n'));
  assert.ok(!r.lines.some((l) => /backup/i.test(l) && !/no backup needed/.test(l)), r.lines.join('\n'));
  assert.equal(manifestOf(home).hashes['tsh-alpha'], hashEntry(fs, path.join(home, '.claude/skills/tsh-alpha')));
});

test('--update backs up an edited copy before installing the new version', () => {
  const { home, source, go } = env();
  go(['--tools', 'claude']);
  const f = path.join(home, '.claude/skills/tsh-alpha/SKILL.md');
  fs.writeFileSync(f, 'my edit');
  changeSource(source);
  const r = go(['--update']);
  assert.equal(fs.readFileSync(f, 'utf8'), 'new version');
  const [stamp] = fs.readdirSync(backupRoot(home));
  assert.equal(fs.readFileSync(path.join(backupRoot(home), stamp, f), 'utf8'), 'my edit');
  assert.ok(r.lines.some((l) => /\[edited locally\]/.test(l)), r.lines.join('\n'));
});

test('a version 1 manifest (no hashes) keeps the safe backup behavior with an honest reason', () => {
  const { home, source, go } = env();
  go(['--tools', 'claude']);
  const mf = path.join(home, '.claude/skills', MANIFEST);
  const m = manifestOf(home);
  delete m.hashes;
  m.version = 1;
  fs.writeFileSync(mf, JSON.stringify(m));
  changeSource(source);
  const r = go(['--update']);
  assert.equal(r.code, 0);
  const [stamp] = fs.readdirSync(backupRoot(home));
  assert.ok(exists(path.join(backupRoot(home), stamp, home, '.claude/skills/tsh-alpha/SKILL.md')));
  assert.ok(!exists(path.join(backupRoot(home), stamp, home, '.claude/skills/tsh-beta')), 'identical entry replaced losslessly');
  assert.ok(r.lines.some((l) => /no checksum recorded; backed up to be safe/.test(l)), r.lines.join('\n'));
  assert.equal(manifestOf(home).version, 2);
  assert.ok(manifestOf(home).hashes['tsh-alpha']);
});

test('an identical source changes nothing and makes no backup', () => {
  const { home, go } = env();
  go(['--tools', 'claude']);
  const before = manifestOf(home).hashes;
  const r = go(['--update']);
  assert.ok(!exists(backupRoot(home)));
  assert.ok(!r.lines.some((l) => /unmodified|backup/i.test(l)), r.lines.join('\n'));
  assert.deepEqual(manifestOf(home).hashes, before);
});

test('link mode writes no hashes', () => {
  const { home, go } = env();
  go(['--tools', 'claude', '--mode', 'link']);
  assert.equal(manifestOf(home).version, 2);
  assert.ok(!('hashes' in manifestOf(home)));
  assert.ok(!('hashes' in manifestOf(home, '.claude/agents')));
});

test('hashEntry is deterministic and changes with a byte or a file name', () => {
  const a = tmp(), b = tmp();
  for (const root of [a, b]) { put(root, 'e/SKILL.md', 'body'); put(root, 'e/references/r.md', 'ref'); }
  const h = hashEntry(fs, path.join(a, 'e'));
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(hashEntry(fs, path.join(a, 'e')), h);
  assert.equal(hashEntry(fs, path.join(b, 'e')), h, 'same content in another place hashes the same');
  fs.writeFileSync(path.join(b, 'e/references/r.md'), 'reF');
  assert.notEqual(hashEntry(fs, path.join(b, 'e')), h, 'one byte changed');
  fs.writeFileSync(path.join(b, 'e/references/r.md'), 'ref');
  assert.equal(hashEntry(fs, path.join(b, 'e')), h);
  fs.renameSync(path.join(b, 'e/references/r.md'), path.join(b, 'e/references/s.md'));
  assert.notEqual(hashEntry(fs, path.join(b, 'e')), h, 'file renamed');
  put(a, 'agent.md', 'x');
  assert.equal(hashEntry(fs, path.join(a, 'agent.md')), '2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881', 'file entry = sha256 of its bytes');
});

test('dry-run reports the same decisions as the real run and writes nothing', () => {
  const { home, source, go } = env();
  go(['--tools', 'claude']);
  fs.writeFileSync(path.join(home, '.claude/skills/tsh-beta/SKILL.md'), 'my edit');
  changeSource(source, 'tsh-alpha');
  changeSource(source, 'tsh-beta');
  fs.writeFileSync(path.join(source, '.claude/agents/tsh-agent.md'), 'new agent');
  const mfBefore = fs.readFileSync(path.join(home, '.claude/skills', MANIFEST), 'utf8');
  const dry = go(['--update', '--dry-run']);
  assert.ok(!exists(backupRoot(home)));
  assert.equal(fs.readFileSync(path.join(home, '.claude/skills', MANIFEST), 'utf8'), mfBefore);
  assert.equal(fs.readFileSync(path.join(home, '.claude/skills/tsh-alpha/SKILL.md'), 'utf8'), 'skill tsh-alpha');
  const real = go(['--update']);
  const pick = (lines) => lines.filter((l) => /unmodified|to the backup|edited locally/.test(l))
    .map((l) => l.replace(/^(\s*)Would (\w)/, (_, s, c) => s + c.toUpperCase()).replace(/^(\s*)(Replace|Remove|Move)\b/, (_, s, v) => `${s}${v}d`));
  assert.deepEqual(pick(dry.lines), pick(real.lines));
  assert.ok(pick(real.lines).some((l) => /Replaced 1 unmodified entry/.test(l)) && pick(real.lines).some((l) => /to the backup.*: 1/.test(l)), real.lines.join('\n'));
});

test('--update without any manifest is an error', () => {
  const { go } = env();
  assert.throws(() => go(['--update']), UsageError);
});

test('old-layout fixture: dangling category symlink removed, copied tsh-architect backed up, my-skill untouched', () => {
  const { home, go } = env();
  const cs = path.join(home, '.cursor/skills');
  fs.mkdirSync(cs, { recursive: true });
  fs.symlinkSync(path.join(cs, 'workflows/tsh-code-reviewing'), path.join(cs, 'tsh-code-reviewing'));
  put(home, '.cursor/skills/tsh-architect/SKILL.md', 'copied persona');
  put(home, '.cursor/skills/my-skill/SKILL.md', 'mine');
  put(home, '.cursor/skills/workflows/tsh-old-flow/SKILL.md', 'category tree');
  put(home, '.cursor/skills/workflows/other/SKILL.md', 'not tsh');
  // (c) in a target dir: symlink into the old category layout (valid), and a legacy-named copy
  fs.mkdirSync(path.join(home, '.claude/skills'), { recursive: true });
  const real = path.join(cs, 'commands/tsh-cmd');
  put(home, '.cursor/skills/commands/tsh-cmd/SKILL.md', 'cmd');
  fs.symlinkSync(real, path.join(home, '.claude/skills/tsh-cmd'));
  put(home, '.claude/skills/tsh-old-gone/SKILL.md', 'deleted artifact');
  put(home, '.claude/skills/my-other/SKILL.md', 'mine');

  const r = go(['--migrate-legacy'], { now: () => new Date('2026-05-05T05:05:05Z') });
  assert.equal(r.code, 0);
  assert.ok(!exists(path.join(cs, 'tsh-code-reviewing')), 'dangling symlink removed');
  assert.ok(!exists(path.join(cs, 'tsh-architect')));
  assert.ok(!exists(path.join(cs, 'workflows/tsh-old-flow')));
  assert.ok(!exists(path.join(cs, 'commands/tsh-cmd')));
  assert.ok(!exists(path.join(home, '.claude/skills/tsh-cmd')), 'symlink into category layout removed');
  assert.ok(!exists(path.join(home, '.claude/skills/tsh-old-gone')));
  assert.equal(fs.readFileSync(path.join(cs, 'my-skill/SKILL.md'), 'utf8'), 'mine');
  assert.ok(exists(path.join(cs, 'workflows/other/SKILL.md')));
  assert.ok(!exists(path.join(cs, 'commands')), 'emptied legacy category folder is removed');
  assert.ok(exists(path.join(cs, 'workflows')), 'category folder with other content stays');
  assert.ok(exists(path.join(home, '.claude/skills/my-other/SKILL.md')));
  const bk = path.join(home, '.tsh-ai-collections-backup');
  const [stamp] = fs.readdirSync(bk);
  assert.equal(fs.readFileSync(path.join(bk, stamp, cs, 'tsh-architect/SKILL.md'), 'utf8'), 'copied persona');
  assert.ok(exists(path.join(bk, stamp, cs, 'workflows/tsh-old-flow/SKILL.md')));
  assert.ok(exists(path.join(bk, stamp, home, '.claude/skills/tsh-old-gone/SKILL.md')));
  assert.ok(!exists(path.join(home, '.claude/skills/tsh-alpha')), '--migrate-legacy does not install');
});

test('legacy cleanup does not treat current skill names as legacy even if listed; scans project .cursor/skills', () => {
  const home = tmp(), project = tmp();
  const source = makeSource({ legacy: { renamed: { 'tsh-alpha': 'x' }, deleted: [], nowSubagents: [] } });
  put(home, '.claude/skills/tsh-alpha/SKILL.md', 'current');
  put(project, '.cursor/skills/tsh-whatever/SKILL.md', 'old');
  run(['--migrate-legacy', '--project-dir', project], { home, source, quiet: true });
  assert.ok(exists(path.join(home, '.claude/skills/tsh-alpha/SKILL.md')));
  assert.ok(!exists(path.join(project, '.cursor/skills/tsh-whatever')));
});

test('missing legacy-names.json is a clear error', () => {
  const home = tmp(), project = tmp();
  const source = makeSource({ legacy: null });
  assert.throws(() => run(['--tools', 'claude'], { home, cwd: project, source, quiet: true }),
    (e) => e instanceof UsageError && /legacy-names\.json/.test(e.message));
  assert.equal(fs.readdirSync(home).length, 0);
});

test('--mode link creates symlinks to the source; bad mode is rejected', () => {
  const { home, source, go } = env();
  go(['--tools', 'claude', '--mode', 'link']);
  const l = path.join(home, '.claude/skills/tsh-alpha');
  assert.ok(fs.lstatSync(l).isSymbolicLink());
  assert.equal(fs.readlinkSync(l), path.join(source, '.claude/skills/tsh-alpha'));
  assert.ok(fs.lstatSync(path.join(home, '.claude/agents/tsh-agent.md')).isSymbolicLink());
  assert.throws(() => go(['--tools', 'claude', '--mode', 'bogus']), /Invalid --mode/);
});

test('copy mode dereferences symlinks in the source', () => {
  const { home, source, go } = env();
  const outside = tmp();
  put(outside, 'real.md', 'real content');
  fs.symlinkSync(path.join(outside, 'real.md'), path.join(source, '.agents/skills/tsh-alpha/linked.md'));
  go(['--tools', 'codex']);
  const f = path.join(home, '.agents/skills/tsh-alpha/linked.md');
  assert.ok(!fs.lstatSync(f).isSymbolicLink());
  assert.equal(fs.readFileSync(f, 'utf8'), 'real content');
});

test('moveEntry falls back to copy + remove on EXDEV and rethrows other errors', () => {
  const dir = tmp();
  put(dir, 'from/a/b.txt', 'data');
  const exdev = { ...fs, renameSync() { throw Object.assign(new Error('x'), { code: 'EXDEV' }); } };
  moveEntry(exdev, path.join(dir, 'from'), path.join(dir, 'out/to'));
  assert.equal(fs.readFileSync(path.join(dir, 'out/to/a/b.txt'), 'utf8'), 'data');
  assert.ok(!exists(path.join(dir, 'from')));
  const eperm = { ...fs, renameSync() { throw Object.assign(new Error('x'), { code: 'EPERM' }); } };
  put(dir, 'f2/x', '1');
  assert.throws(() => moveEntry(eperm, path.join(dir, 'f2'), path.join(dir, 'out/f2')), /x/);
  assert.ok(exists(path.join(dir, 'f2/x')), 'source kept when the move fails');
});

test('cleanup uses the EXDEV fallback through run() with an injected fs', () => {
  const { home, go } = env();
  put(home, '.cursor/skills/tsh-architect/SKILL.md', 'old');
  const fsx = { ...fs, renameSync() { throw Object.assign(new Error('x'), { code: 'EXDEV' }); } };
  go(['--migrate-legacy'], { fs: fsx });
  assert.ok(!exists(path.join(home, '.cursor/skills/tsh-architect')));
  const bk = path.join(home, '.tsh-ai-collections-backup');
  const [stamp] = fs.readdirSync(bk);
  assert.ok(exists(path.join(bk, stamp, home, '.cursor/skills/tsh-architect/SKILL.md')));
});

test('home comes from TSH_HOME when not injected; the real home is not used', () => {
  const home = tmp(), project = tmp(), source = makeSource();
  const prev = process.env.TSH_HOME;
  process.env.TSH_HOME = home;
  try {
    run(['--tools', 'claude'], { cwd: project, source, quiet: true });
  } finally {
    if (prev === undefined) delete process.env.TSH_HOME; else process.env.TSH_HOME = prev;
  }
  assert.ok(exists(path.join(home, '.claude/skills/tsh-alpha/SKILL.md')));
});

test('argument errors', () => {
  const { go } = env();
  assert.throws(() => go([]), /--tools is required/);
  assert.throws(() => go(['--tools', 'vim']), /Invalid --tools/);
  assert.throws(() => go(['--scope', 'x']), /Invalid --scope/);
  assert.throws(() => go(['--nope']), /Unknown argument/);
  assert.match(go(['--help'], { quiet: true }).lines[0], /--mode copy\|link/);
});

test('CLI: runs as a script against a fixture, exits 2 on usage error', async () => {
  const { spawnSync } = await import('node:child_process');
  const home = tmp(), project = tmp(), source = makeSource();
  const ok = spawnSync(process.execPath, [SCRIPT, '--tools', 'codex', '--scope', 'project', '--project-dir', project, '--source', source],
    { env: { ...process.env, TSH_HOME: home }, encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(exists(path.join(project, '.codex/agents/tsh-agent.toml')));
  const bad = spawnSync(process.execPath, [SCRIPT], { env: { ...process.env, TSH_HOME: home }, encoding: 'utf8' });
  assert.equal(bad.status, 2);
});

// ---------- install registry and --list ----------

const readReg = (home) => JSON.parse(fs.readFileSync(registryPath(home), 'utf8'));
const entryOf = (home, root, scope) => readReg(home).installs.find((e) => e.path === root && e.scope === scope);
const at = (iso) => ({ now: () => new Date(iso) });

/** A throwaway git repo as the source clone: `commit()` adds a commit and returns its sha. */
function gitSource() {
  const source = makeSource();
  const g = (...a) => execFileSync('git', ['-C', source, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a],
    { stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: os.devNull } }).toString().trim();
  g('init', '-q');
  let i = 0;
  const commit = () => { put(source, `c${i++}.txt`); g('add', '-A'); g('commit', '-q', '-m', `c${i}`); return g('rev-parse', 'HEAD'); };
  commit();
  return { source, commit };
}

test('an install creates the registry with the expected fields and private modes', () => {
  const { home, source, go } = env();
  go(['--tools', 'claude'], at('2026-03-01T10:00:00Z'));
  const reg = readReg(home);
  assert.equal(reg.version, 1);
  assert.deepEqual(reg.installs, [{ path: home, scope: 'user', tools: ['claude'], mode: 'copy', source, sourceCommit: null,
    installedAt: '2026-03-01T10:00:00.000Z', updatedAt: '2026-03-01T10:00:00.000Z' }]);
  const dir = path.dirname(registryPath(home));
  assert.deepEqual(fs.readdirSync(dir), ['installs.json'], 'no temp file left behind');
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
    assert.equal(fs.statSync(registryPath(home)).mode & 0o777, 0o600);
  }
});

test('a second install with another tool merges tools, keeps installedAt, refreshes updatedAt', () => {
  const { home, go } = env();
  go(['--tools', 'claude'], at('2026-03-01T10:00:00Z'));
  go(['--tools', 'codex', '--mode', 'link'], at('2026-03-02T10:00:00Z'));
  const e = entryOf(home, home, 'user');
  assert.deepEqual(e.tools, ['claude', 'codex']);
  assert.equal(e.mode, 'link');
  assert.equal(e.installedAt, '2026-03-01T10:00:00.000Z');
  assert.equal(e.updatedAt, '2026-03-02T10:00:00.000Z');
  assert.equal(readReg(home).installs.length, 1);
});

test('--dry-run, --migrate-legacy and --list write no registry', () => {
  const { home, go } = env();
  go(['--tools', 'claude', '--dry-run']);
  go(['--migrate-legacy']);
  go(['--list']);
  assert.ok(!exists(path.dirname(registryPath(home))));
});

test('an install that skips entries (exit 1) still registers what it installed', () => {
  const { home, go } = env();
  put(home, '.claude/skills/tsh-alpha/SKILL.md', 'user edited');
  assert.equal(go(['--tools', 'claude']).code, 1);
  assert.deepEqual(entryOf(home, home, 'user').tools, ['claude']);
});

test('a corrupt registry is moved to .bak (timestamped if .bak exists) and the install succeeds', () => {
  const { home, go } = env();
  const f = registryPath(home);
  put(home, path.relative(home, f), '{not json');
  const r = go(['--tools', 'claude']);
  assert.equal(r.code, 0);
  assert.equal(r.lines.filter((l) => /Warning: .*registry/.test(l)).length, 1, r.lines.join('\n'));
  assert.equal(fs.readFileSync(`${f}.bak`, 'utf8'), '{not json');
  assert.deepEqual(entryOf(home, home, 'user').tools, ['claude']);
  fs.writeFileSync(f, '[]');
  go(['--tools', 'claude'], at('2026-04-01T00:00:00Z'));
  assert.equal(fs.readFileSync(`${f}.bak`, 'utf8'), '{not json', 'existing .bak is not overwritten');
  assert.equal(fs.readFileSync(`${f}.2026-04-01T00-00-00-000Z.bak`, 'utf8'), '[]');
  assert.ok(entryOf(home, home, 'user'));
});

test('--update registers an install that had no entry, in project and user scope; entries coexist', () => {
  const { home, project, go } = env();
  go(['--tools', 'claude', '--scope', 'project']);
  go(['--tools', 'codex']);
  fs.rmSync(path.dirname(registryPath(home)), { recursive: true });
  go(['--update', '--scope', 'project']);
  assert.ok(!entryOf(home, home, 'user'));
  go(['--update']);
  const reg = readReg(home);
  assert.deepEqual(reg.installs.map((e) => [e.path, e.scope, e.tools.join(',')]),
    [[home, 'user', 'codex'], [project, 'project', 'claude']].sort((a, b) => (a[0] < b[0] ? -1 : 1)), 'sorted by path');
});

test('--list shows up to date, N commits behind, unknown and missing', () => {
  const { source, commit } = gitSource();
  const home = tmp(), p1 = tmp(), p2 = tmp(), p3 = tmp(), gone = tmp();
  const go = (args) => run(args, { home, source, quiet: true });
  go(['--tools', 'claude', '--scope', 'project', '--project-dir', p1]);
  go(['--tools', 'claude', '--scope', 'project', '--project-dir', gone]);
  go(['--tools', 'claude', '--scope', 'project', '--project-dir', p3]);
  const mf = path.join(p3, '.claude/skills', MANIFEST);
  fs.writeFileSync(mf, JSON.stringify({ ...JSON.parse(fs.readFileSync(mf, 'utf8')), sourceCommit: 'f'.repeat(40) }));
  commit(); commit();
  go(['--tools', 'claude', '--scope', 'project', '--project-dir', p2]);
  go(['--tools', 'codex']);
  fs.rmSync(gone, { recursive: true });
  const before = fs.readFileSync(registryPath(home), 'utf8');
  const r = go(['--list']);
  assert.equal(r.code, 0);
  const line = (p) => r.lines.find((l) => l.trimStart().startsWith(p + ' ')) || '';
  assert.match(line(p1), /project\s+claude\s+copy\s+[0-9a-f]{7}\s+2 commits behind$/, r.lines.join('\n'));
  assert.match(line(p2), /up to date$/);
  assert.match(line(p3), /ffffff\s+unknown$/);
  assert.match(line(gone), /missing$/);
  assert.match(line('~'), /user\s+codex\s+copy\s+[0-9a-f]{7}\s+up to date$/);
  assert.ok(r.lines.some((l) => l === `Registry: ~/.tsh-ai-collections/installs.json`), r.lines.join('\n'));
  assert.ok(r.lines.some((l) => l === `Refresh with: node scripts/install.mjs --update --scope project --project-dir ${p1}`), r.lines.join('\n'));
  assert.equal(fs.readFileSync(registryPath(home), 'utf8'), before, '--list writes nothing');
});

test('--list says all are up to date; an empty registry prints the explanation', () => {
  const { source } = gitSource();
  const home = tmp();
  const empty = run(['--list'], { home, source, quiet: true });
  assert.equal(empty.code, 0);
  assert.ok(empty.lines.some((l) => /No installs recorded yet/.test(l)), empty.lines.join('\n'));
  assert.ok(empty.lines.some((l) => /recorded automatically/.test(l)));
  assert.ok(empty.lines.some((l) => /--update/.test(l)));
  run(['--tools', 'cursor'], { home, source, quiet: true });
  const r = run(['--list'], { home, source, quiet: true });
  assert.ok(r.lines.includes('All installs are up to date.'), r.lines.join('\n'));
});

test('--list with a corrupt registry warns and moves nothing', () => {
  const { home, go } = env();
  put(home, path.relative(home, registryPath(home)), 'garbage');
  const r = go(['--list']);
  assert.equal(r.code, 0);
  assert.ok(r.lines.some((l) => /Warning: .*corrupt/.test(l)));
  assert.equal(fs.readFileSync(registryPath(home), 'utf8'), 'garbage');
  assert.ok(!exists(`${registryPath(home)}.bak`));
});

test('--list rejects combinations that make no sense', () => {
  const { go } = env();
  for (const extra of [['--tools', 'claude'], ['--update'], ['--dry-run'], ['--migrate-legacy'], ['--scope', 'project'], ['--force']]) {
    assert.throws(() => go(['--list', ...extra]), (e) => e instanceof UsageError && /--list cannot be combined/.test(e.message), extra.join(' '));
  }
});

test('a failed registry write warns and leaves no temp file; the install still succeeds', () => {
  const { home, go } = env();
  const fsx = { ...fs, renameSync(a, b) { if (String(b).endsWith('installs.json')) throw Object.assign(new Error('x'), { code: 'EIO' }); return fs.renameSync(a, b); } };
  const r = go(['--tools', 'claude'], { fs: fsx });
  assert.equal(r.code, 0);
  assert.ok(r.lines.some((l) => /Warning: could not update the install registry/.test(l)), r.lines.join('\n'));
  assert.deepEqual(fs.readdirSync(path.dirname(registryPath(home))), []);
});

test('install.mjs imports only node: built-ins', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8');
  const specs = [...src.matchAll(/(?:^|\s)(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]/gm), ...src.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm), ...src.matchAll(/\bimport\(\s*['"]([^'"]+)['"]/g), ...src.matchAll(/\brequire\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.ok(specs.length >= 4);
  for (const s of specs) assert.match(s, /^node:/, `non-builtin import: ${s}`);
});
