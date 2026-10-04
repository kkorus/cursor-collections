import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run, selectSkillTrees, moveEntry, UsageError, MANIFEST } from '../install.mjs';

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
  assert.equal(fs.readdirSync(home).length, 0, 'HOME untouched by project install');
  assert.ok(r.lines.some((l) => /Include Third-Party/.test(l)));
});

test('--dry-run prints actions and changes nothing (also for legacy cleanup)', () => {
  const { home, go } = env();
  put(home, '.cursor/skills/tsh-architect/SKILL.md', 'old');
  const r = go(['--tools', 'claude', '--dry-run']);
  assert.ok(r.lines.some((l) => /would copy/.test(l)));
  assert.ok(r.lines.some((l) => /would move .*tsh-architect/.test(l)));
  assert.deepEqual(fs.readdirSync(home).sort(), ['.cursor']);
  assert.ok(exists(path.join(home, '.cursor/skills/tsh-architect/SKILL.md')));
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

test('--update prunes a renamed skill into the backup when locally edited, removes it when identical', () => {
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
  // the edited (non-identical) pruned dir is kept in the backup, never hard-deleted
  const backups = path.join(home, '.tsh-ai-collections-backup');
  const [stamp] = fs.readdirSync(backups);
  assert.ok(exists(path.join(backups, stamp, skills, 'tsh-beta/SKILL.md')));
  assert.ok(exists(path.join(backups, stamp, skills, 'tsh-alpha/SKILL.md')));
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

test('install.mjs imports only node: built-ins', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8');
  const specs = [...src.matchAll(/(?:^|\s)(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]/gm), ...src.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm), ...src.matchAll(/\bimport\(\s*['"]([^'"]+)['"]/g), ...src.matchAll(/\brequire\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.ok(specs.length >= 4);
  for (const s of specs) assert.match(s, /^node:/, `non-builtin import: ${s}`);
});
