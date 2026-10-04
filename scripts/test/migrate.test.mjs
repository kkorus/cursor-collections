// Idempotence and rewrite rules of the one-off migration (plan Task 2.1). Fixtures live in the OS temp dir.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { migrate } from '../migrate/migrate-structure.mjs';
import { makeRoot } from './helpers.mjs';

const skill = (name, description, body = '# Title\n', extra = '') =>
  `---\nname: ${name}\ndescription: ${description}\n${extra}---\n${body}`;

function fixture() {
  return makeRoot({
    '.cursor/mcp.json': { servers: { ctx: { command: 'npx', args: ['-y', 'x'], type: 'stdio' }, fig: { url: 'https://f.example/mcp', type: 'http' } } },
    '.cursor/skills/agents/tsh-architect/SKILL.md': skill('tsh-architect', '"Designs things. Use when planning. Invoke with @tsh-architect."',
      '# Architect\n\n> Recommended model: GPT-5.4\n> Recommended tools: execute, read\n\n## Role\n\nSee [tsh-review](.cursor/skills/commands/tsh-review/SKILL.md) and `.cursor/skills/workflows/tsh-code-reviewing/SKILL.md`.\n'),
    '.cursor/skills/agents/tsh-engineering-manager/SKILL.md': skill('tsh-engineering-manager', 'Orchestrates. Use when managing.',
      '# EM\n\n> Recommended model: GPT-5.4\n> Recommended tools: agent\n\nText.\n', 'disable-model-invocation: true\n'),
    '.cursor/skills/commands/tsh-review/SKILL.md': skill('tsh-review', 'Reviews. Use when /tsh-review.', '# /tsh-review\n\nLoad `tsh-code-reviewing`.\n', 'disable-model-invocation: true\n'),
    '.cursor/skills/commands/tsh-commit/SKILL.md': skill('tsh-commit', 'Commits. Use when /tsh-commit.'),
    '.cursor/skills/internal/tsh-implement-ui/SKILL.md': skill('tsh-implement-ui', 'Does UI. Internal skill used by tsh-engineering-manager. Not user-invokable.',
      '# UI\n\nAlso tsh-implement-ui-common-task.\n', 'disable-model-invocation: true\n'),
    '.cursor/skills/workflows/tsh-code-reviewing/SKILL.md': skill('tsh-code-reviewing', 'Code review. Use when reviewing.',
      '# Review\n\nTemplate: [t](skill.template.md), example `plan.example.md`, see `examples/good.md` and [refs](../tsh-implementing-frontend/references/react-patterns.md).\n'),
    '.cursor/skills/workflows/tsh-code-reviewing/skill.template.md': '# template\n',
    '.cursor/skills/workflows/tsh-code-reviewing/plan.example.md': '# example\n',
    '.cursor/skills/workflows/tsh-code-reviewing/examples/good.md': '# good\n',
    '.cursor/skills/workflows/tsh-code-reviewing/references/r.md': '# ref\n',
    '.cursor/skills/workflows/tsh-implementing-frontend/SKILL.md': skill('tsh-implementing-frontend', 'Frontend. Use when building.'),
    '.cursor/skills/workflows/tsh-implementing-frontend/references/react-patterns.md': '# react\n',
  });
}

function snapshot(dir, rel = '') {
  const abs = join(dir, rel);
  return readdirSync(abs).sort().flatMap((e) => {
    const child = rel ? `${rel}/${e}` : e;
    return statSync(join(dir, child)).isDirectory() ? snapshot(dir, child) : [[child, readFileSync(join(dir, child), 'utf8')]];
  });
}

test('dry run prints the plan and writes nothing', () => {
  const root = fixture();
  const lines = [];
  const result = migrate({ root, dryRun: true, log: (l) => lines.push(l) });
  assert.ok(result.created > 5);
  assert.ok(lines.some((l) => l.startsWith('would write new src/skills/tsh-reviewing-code/SKILL.md')));
  assert.throws(() => readFileSync(join(root, 'src/agents/tsh-architect.md')));
});

test('migration is idempotent', () => {
  const root = fixture();
  migrate({ root });
  const first = snapshot(root, 'src');
  const second = migrate({ root });
  assert.equal(second.created + second.updated, 0);
  assert.deepEqual(snapshot(root, 'src'), first);
});

test('migration is a no-op once the source is gone', () => {
  const root = fixture();
  migrate({ root });
  const sourceless = { root, sourceDir: join(root, 'nope') };
  const result = migrate(sourceless);
  assert.equal(result.items.length, 0);
  assert.equal(result.created + result.updated, 0);
});

test('files, frontmatter and references are converted', () => {
  const root = fixture();
  migrate({ root });
  const read = (p) => readFileSync(join(root, p), 'utf8');
  const agent = read('src/agents/tsh-architect.md');
  assert.match(agent, /^---\nname: tsh-architect\n/);
  assert.match(agent, /type: agent\nmodel-tier: deep\naccess: read-write\n/);
  assert.doesNotMatch(agent, /Recommended|Invoke with/);
  assert.match(agent, /the `tsh-review` skill and the `tsh-reviewing-code` skill/);
  assert.match(read('src/skills/tsh-engineering-manager/SKILL.md'), /type: orchestrator/);
  const command = read('src/skills/tsh-review/SKILL.md');
  assert.match(command, /type: command\nroutes-to: tsh-code-reviewer/);
  assert.doesNotMatch(command, /disable-model-invocation/);
  assert.match(command, /`tsh-reviewing-code`/);
  assert.match(read('src/skills/tsh-commit/SKILL.md'), /standalone: true/);
  const internal = read('src/skills/tsh-orchestrate-ui-verification/SKILL.md');
  assert.match(internal, /type: internal/);
  assert.doesNotMatch(internal, /Internal skill used by|Not user-invokable/);
  assert.match(internal, /tsh-implement-ui-common-task/); // prefix of a non-renamed name is left alone
  const workflow = read('src/skills/tsh-reviewing-code/SKILL.md');
  assert.match(workflow, /type: skill/);
  assert.match(workflow, /\[t\]\(assets\/skill\.template\.md\)/);
  assert.match(workflow, /`assets\/plan\.template\.md`/);
  assert.match(workflow, /`references\/good\.md`/);
  assert.match(workflow, /the React patterns reference of the `tsh-implementing-frontend` skill/);
  assert.doesNotMatch(workflow, /\]\(\.\.\//);
  assert.equal(read('src/skills/tsh-reviewing-code/assets/plan.template.md'), '# example\n');
  assert.equal(read('src/skills/tsh-reviewing-code/references/good.md'), '# good\n');
});

test('MCP servers get a transport and keep their fields; legacy-names.json has the agreed shape', () => {
  const root = fixture();
  migrate({ root });
  const servers = JSON.parse(readFileSync(join(root, 'src/mcp/servers.json'), 'utf8')).servers;
  assert.deepEqual(servers, { ctx: { transport: 'stdio', command: 'npx', args: ['-y', 'x'] }, fig: { transport: 'http', url: 'https://f.example/mcp' } });
  const legacy = JSON.parse(readFileSync(join(root, 'scripts/legacy-names.json'), 'utf8'));
  assert.deepEqual(Object.keys(legacy), ['renamed', 'deleted', 'nowSubagents']);
  assert.equal(legacy.renamed['tsh-code-reviewing'], 'tsh-reviewing-code');
  assert.ok(legacy.deleted.includes('tsh-plan'));
  assert.equal(legacy.nowSubagents.length, 17);
  assert.ok(!legacy.nowSubagents.includes('tsh-cursor-engineer'));
});
