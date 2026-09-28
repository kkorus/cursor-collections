import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { loadSource } from '../lib/load-source.mjs';
import { renderSkills } from '../lib/render-skills.mjs';
import { makeRoot, sourceFiles, withFrontmatter } from './helpers.mjs';

const render = (files = sourceFiles()) => renderSkills(loadSource(makeRoot(files)));
const frontmatter = (text) => parseYaml(/^---\n([\s\S]*?)\n---\n/.exec(text)[1]);
const keys = (text) => Object.keys(frontmatter(text));

test('type skill: exact frontmatter, neutral keys stripped, compatibility from requires-mcp', () => {
  const text = render().get('.agents/skills/tsh-reviewing-code/SKILL.md');
  assert.equal(text, [
    '---',
    'name: tsh-reviewing-code',
    'description: Reviews code changes. Use when reviewing a change.',
    'compatibility: "Requires MCP servers: context7"',
    'metadata:',
    '  short-description: Review code',
    'paths:',
    '  - "**/*.ts"',
    '---',
    '<!-- Generated from src/skills/tsh-reviewing-code/SKILL.md by scripts/generate.mjs. Do not edit. -->',
    '',
    '# Reviewing code',
    '',
    'Use the [checklist](references/checklist.md) and fill in the [report](assets/report.template.md).',
    '',
  ].join('\n'));
});

test('type command: disable-model-invocation and argument-hint', () => {
  const fm = frontmatter(render().get('.claude/skills/tsh-review/SKILL.md'));
  assert.deepEqual(fm, {
    name: 'tsh-review',
    description: 'Reviews a change set. Use when a review is needed.',
    'argument-hint': '[task-id | scope]',
    compatibility: 'Requires MCP servers: figma',
    'disable-model-invocation': true,
    metadata: { 'short-description': 'Review a change' },
  });
});

test('type internal and orchestrator: user-invocable false', () => {
  const out = render();
  for (const name of ['tsh-implement-task', 'tsh-engineering-manager']) {
    const fm = frontmatter(out.get(`.agents/skills/${name}/SKILL.md`));
    assert.deepEqual(Object.keys(fm), ['name', 'description', 'metadata', 'user-invocable']);
    assert.equal(fm['user-invocable'], false);
  }
});

test('both trees get byte-identical SKILL.md and support files', () => {
  const out = render();
  const agentsTree = [...out.keys()].filter((k) => k.startsWith('.agents/skills/') && !k.endsWith('agents/openai.yaml'));
  assert.ok(agentsTree.length > 5);
  for (const path of agentsTree) {
    const twin = path.replace('.agents/skills/', '.claude/skills/');
    assert.ok(out.has(twin), `${twin} missing`);
    assert.ok(Buffer.from(out.get(path)).equals(Buffer.from(out.get(twin))), `${path} differs`);
  }
  assert.equal(out.get('.claude/skills/tsh-reviewing-code/assets/report.template.md').toString(), '# Report\n\n```\ntsh-anything-goes-here\n```\n');
});

test('agents/openai.yaml exists only for commands and merges targets.codex', () => {
  const files = sourceFiles();
  files['src/skills/tsh-review/SKILL.md'] = withFrontmatter(files, 'src/skills/tsh-review/SKILL.md', {
    targets: { codex: { interface: { display_name: 'Review' } } },
  });
  const out = render(files);
  const yamlFiles = [...out.keys()].filter((k) => k.endsWith('agents/openai.yaml'));
  assert.deepEqual(yamlFiles.sort(), ['.agents/skills/tsh-commit/agents/openai.yaml', '.agents/skills/tsh-review/agents/openai.yaml']);
  assert.deepEqual(parseYaml(out.get('.agents/skills/tsh-review/agents/openai.yaml')), {
    policy: { allow_implicit_invocation: false },
    interface: { display_name: 'Review' },
  });
  assert.match(out.get('.agents/skills/tsh-commit/agents/openai.yaml'), /^# Generated from src\/skills\/tsh-commit\/SKILL.md/);
});

test('deterministic key order (name, description, then alphabetical) and a trailing newline', () => {
  const files = sourceFiles();
  files['src/skills/tsh-review/SKILL.md'] = withFrontmatter(files, 'src/skills/tsh-review/SKILL.md', {
    targets: { claude: { 'allowed-tools': ['Read'], effort: 'high' }, cursor: { color: 'blue' } },
  });
  const first = render(files);
  const second = render(files);
  for (const [path, content] of first) {
    assert.ok(Buffer.from(content).equals(Buffer.from(second.get(path))), `${path} is not deterministic`);
    if (path.endsWith('.md') || path.endsWith('.yaml')) assert.ok(String(content).endsWith('\n') && !String(content).endsWith('\n\n'), path);
  }
  const text = first.get('.agents/skills/tsh-review/SKILL.md');
  assert.deepEqual(keys(text), ['name', 'description', 'allowed-tools', 'argument-hint', 'color', 'compatibility',
    'disable-model-invocation', 'effort', 'metadata']);
});

test('a key present in both targets.cursor and targets.claude is an error', () => {
  const files = sourceFiles();
  files['src/skills/tsh-review/SKILL.md'] = withFrontmatter(files, 'src/skills/tsh-review/SKILL.md', {
    targets: { claude: { color: 'red' }, cursor: { color: 'blue' } },
  });
  assert.throws(() => render(files), /src\/skills\/tsh-review\/SKILL.md: targets.claude.color: collides with targets.cursor.color/);
});
