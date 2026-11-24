import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { generate } from '../generate.mjs';
import { isOwned } from '../lib/write-or-check.mjs';
import { REPO_ROOT, TARGETS, makeRoot, sourceFiles, writeFiles } from './helpers.mjs';

const OLD_CURSOR_MCP = '{\n  "servers": { "figma": { "url": "https://mcp.figma.com/mcp", "type": "http" } }\n}\n';

/** Snapshot of every file below root: relative path -> content. */
function snapshot(root, rel = '') {
  const out = {};
  for (const entry of readdirSync(join(root, rel))) {
    const childRel = rel ? `${rel}/${entry}` : entry;
    if (statSync(join(root, childRel)).isDirectory()) Object.assign(out, snapshot(root, childRel));
    else out[childRel] = readFileSync(join(root, childRel), 'utf8');
  }
  return out;
}

function generated() {
  const root = makeRoot(sourceFiles());
  assert.equal(generate(root).code, 0);
  return root;
}

test('clean -> --check passes', () => {
  const { code, lines } = generate(generated(), { check: true });
  assert.equal(code, 0, lines.join('\n'));
  assert.ok(lines.some((l) => l.startsWith('Generated outputs are up to date')));
});

test('an edited generated file -> --check fails and lists it', () => {
  const root = generated();
  writeFileSync(join(root, '.claude/skills/tsh-review/SKILL.md'), 'edited\n');
  const { code, lines } = generate(root, { check: true });
  assert.equal(code, 1);
  assert.ok(lines.includes('changed: .claude/skills/tsh-review/SKILL.md'), lines.join('\n'));
});

test('a missing generated file -> --check fails and lists it', () => {
  const root = generated();
  rmSync(join(root, '.codex/agents/tsh-ui-reviewer.toml'));
  const { code, lines } = generate(root, { check: true });
  assert.equal(code, 1);
  assert.ok(lines.includes('missing: .codex/agents/tsh-ui-reviewer.toml'));
});

test('an extra tsh-* file in an owned dir -> --check fails; generate deletes it and prunes the dir', () => {
  const root = generated();
  writeFiles(root, {
    '.claude/skills/tsh-old-skill/SKILL.md': 'old\n',
    '.claude/skills/tsh-old-skill/references/a.md': 'old\n',
    '.cursor/agents/tsh-old-agent.md': 'old\n',
  });
  const { code, lines } = generate(root, { check: true });
  assert.equal(code, 1);
  for (const rel of ['.claude/skills/tsh-old-skill/SKILL.md', '.claude/skills/tsh-old-skill/references/a.md', '.cursor/agents/tsh-old-agent.md']) {
    assert.ok(lines.includes(`extra:   ${rel}`), rel);
  }
  assert.equal(generate(root).code, 0);
  assert.equal(existsSync(join(root, '.claude/skills/tsh-old-skill')), false);
  assert.equal(existsSync(join(root, '.cursor/agents/tsh-old-agent.md')), false);
  assert.equal(generate(root, { check: true }).code, 0);
});

test('non-tsh files next to the outputs are untouched and ignored', () => {
  const root = makeRoot(sourceFiles({
    '.claude/skills/my-skill/SKILL.md': 'mine\n',
    '.claude/settings.local.json': '{}\n',
    '.cursor/agents/helper.md': 'mine\n',
    '.agents/skills/README.md': 'mine\n',
    '.codex/agents/other.toml': 'x = 1\n',
  }));
  assert.equal(generate(root).code, 0);
  assert.equal(generate(root, { check: true }).code, 0);
  for (const rel of ['.claude/skills/my-skill/SKILL.md', '.cursor/agents/helper.md', '.agents/skills/README.md']) {
    assert.equal(readFileSync(join(root, rel), 'utf8'), 'mine\n', rel);
  }
  assert.equal(readFileSync(join(root, '.claude/settings.local.json'), 'utf8'), '{}\n');
  assert.equal(readFileSync(join(root, '.codex/agents/other.toml'), 'utf8'), 'x = 1\n');
});

test('generate twice produces no diff (idempotent)', () => {
  const root = generated();
  const before = snapshot(root);
  const { code, lines } = generate(root);
  assert.equal(code, 0);
  assert.ok(lines.some((l) => /\(0 written, 0 deleted\)/.test(l)), lines.join('\n'));
  assert.deepEqual(snapshot(root), before);
});

test('an owned symlink is replaced, never written through', () => {
  const root = generated();
  const outside = join(mkdtempSync(join(tmpdir(), 'tsh-gen-test-')), 'target.md');
  writeFileSync(outside, 'outside\n');
  rmSync(join(root, '.cursor/agents/tsh-ui-reviewer.md'));
  symlinkSync(outside, join(root, '.cursor/agents/tsh-ui-reviewer.md'));
  assert.equal(generate(root, { check: true }).code, 1);
  assert.equal(generate(root).code, 0);
  assert.equal(readFileSync(outside, 'utf8'), 'outside\n');
  assert.equal(generate(root, { check: true }).code, 0);
});

test('without src/mcp/servers.json the MCP files are not owned: an existing .cursor/mcp.json survives', () => {
  const root = makeRoot(sourceFiles({
    'src/mcp/servers.json': null,
    'src/skills/tsh-reviewing-code/SKILL.md': sourceFiles()['src/skills/tsh-reviewing-code/SKILL.md'].replace(/requires-mcp:\n {2}- context7\n/, ''),
    'src/skills/tsh-review/SKILL.md': sourceFiles()['src/skills/tsh-review/SKILL.md'].replace(/requires-mcp:\n {2}- figma\n/, ''),
    'src/agents/tsh-code-reviewer.md': sourceFiles()['src/agents/tsh-code-reviewer.md'].replace(/requires-mcp:\n {2}- context7\n/, ''),
    '.cursor/mcp.json': OLD_CURSOR_MCP,
    '.mcp.json': '{}\n',
    '.codex/config.toml': 'model = "x"\n',
  }));
  const { code, lines } = generate(root);
  assert.equal(code, 0, lines.join('\n'));
  assert.equal(readFileSync(join(root, '.cursor/mcp.json'), 'utf8'), OLD_CURSOR_MCP);
  assert.equal(readFileSync(join(root, '.mcp.json'), 'utf8'), '{}\n');
  assert.equal(readFileSync(join(root, '.codex/config.toml'), 'utf8'), 'model = "x"\n');
  assert.equal(generate(root, { check: true }).code, 0);
});

test('once src/mcp/servers.json exists, .cursor/mcp.json is owned and regenerated with mcpServers', () => {
  const root = makeRoot(sourceFiles({ '.cursor/mcp.json': OLD_CURSOR_MCP }));
  assert.equal(generate(root, { check: true }).code, 1);
  assert.equal(generate(root).code, 0);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(root, '.cursor/mcp.json'), 'utf8'))), ['mcpServers']);
});

test('an empty model (only targets.json) touches nothing, including .cursor/mcp.json and .cursor/skills', () => {
  const root = makeRoot({
    'src/config/targets.json': TARGETS,
    '.cursor/mcp.json': OLD_CURSOR_MCP,
    '.cursor/rules/cursor-instructions.md': 'rules\n',
    '.cursor/skills/agents/tsh-architect/SKILL.md': 'legacy source\n',
    '.claude/settings.local.json': '{}\n',
    'README.md': 'readme\n',
  });
  const before = snapshot(root);
  const { code, lines } = generate(root);
  assert.equal(code, 0, lines.join('\n'));
  assert.deepEqual(snapshot(root), before);
  assert.equal(generate(root, { check: true }).code, 0);
});

test('a root without src/ is a valid empty model and nothing is touched', () => {
  const root = makeRoot({ '.cursor/mcp.json': OLD_CURSOR_MCP, '.claude/skills/tsh-x/SKILL.md': 'x\n' });
  const before = snapshot(root);
  assert.equal(generate(root).code, 0);
  assert.equal(generate(root, { check: true }).code, 0);
  assert.deepEqual(snapshot(root), before);
});

test('owned globs match whole entries only', () => {
  assert.equal(isOwned('.claude/skills/tsh-a/SKILL.md', TARGETS.owned), true);
  assert.equal(isOwned('.claude/skills/my-skill/SKILL.md', TARGETS.owned), false);
  assert.equal(isOwned('.cursor/agents/tsh-a.md', TARGETS.owned), true);
  assert.equal(isOwned('.cursor/agents/tsh-a.txt', TARGETS.owned), false);
  assert.equal(isOwned('.cursor/mcp.json', TARGETS.owned), true);
  assert.equal(isOwned('.cursor/mcp.jsonx', TARGETS.owned), false);
  assert.equal(isOwned('.cursor/skills/tsh-a/SKILL.md', TARGETS.owned), false);
});

test('CLI: --root, exit codes and the per-type summary', () => {
  const root = makeRoot(sourceFiles());
  const run = (...args) => spawnSync(process.execPath, [join(REPO_ROOT, 'scripts/generate.mjs'), '--root', root, ...args], { encoding: 'utf8' });
  const check = run('--check');
  assert.equal(check.status, 1);
  assert.match(check.stdout, /missing: \.agents\/skills\/tsh-review\/SKILL.md/);
  const write = run();
  assert.equal(write.status, 0, write.stderr);
  assert.match(write.stdout, /skills: 5 \(skill 1, command 2, internal 1, orchestrator 1\); agents: 2; mcp servers: 3/);
  assert.equal(run('--check').status, 0);
});
