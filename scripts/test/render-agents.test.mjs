import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';
import { loadSource } from '../lib/load-source.mjs';
import { renderAgents, tomlMultiline } from '../lib/render-agents.mjs';
import { TARGETS, makeRoot, sourceFiles, withFrontmatter } from './helpers.mjs';

const render = (files = sourceFiles()) => renderAgents(loadSource(makeRoot(files)));
const frontmatter = (text) => parseYaml(/^---\n([\s\S]*?)\n---\n/.exec(text)[1]);
const NOTE = (name) => `<!-- Generated from src/agents/${name}.md by scripts/generate.mjs. Do not edit. -->`;
const MODES = '## Modes\n\nInteractive by default. Delegated when the task starts with `MODE: delegated`.\n';

test('golden: read-write agent for Cursor, Claude and Codex', () => {
  const out = render();
  const body = '# Code reviewer\n\nFollow `tsh-reviewing-code`.\n\n';
  assert.equal(out.get('.cursor/agents/tsh-code-reviewer.md'), [
    '---',
    'name: tsh-code-reviewer',
    'description: Reviews a change. Use when a review is needed.',
    '---',
    NOTE('tsh-code-reviewer'),
    '',
    'Required skills: load `tsh-reviewing-code` by name before starting.',
    '',
    '',
  ].join('\n') + body + MODES);
  assert.equal(out.get('.claude/agents/tsh-code-reviewer.md'), [
    '---',
    'name: tsh-code-reviewer',
    'description: Reviews a change. Use when a review is needed.',
    'disallowedTools:',
    '  - Agent',
    'model: sonnet',
    'skills:',
    '  - tsh-reviewing-code',
    '---',
    NOTE('tsh-code-reviewer'),
    '',
    '',
  ].join('\n') + body + MODES);
  assert.equal(out.get('.codex/agents/tsh-code-reviewer.toml'), [
    '# Generated from src/agents/tsh-code-reviewer.md by scripts/generate.mjs. Do not edit.',
    'name = "tsh-code-reviewer"',
    'description = "Reviews a change. Use when a review is needed."',
    'model = "gpt-5.4"',
    'model_reasoning_effort = "medium"',
    'developer_instructions = """',
    'Required skills: load `tsh-reviewing-code` by name before starting.',
    '',
    '',
  ].join('\n') + body + MODES + '"""\n');
});

test('golden: read-only agent without shell for Cursor, Claude and Codex', () => {
  const out = render();
  const body = `# UI reviewer\n\n${MODES}`;
  assert.equal(out.get('.cursor/agents/tsh-ui-reviewer.md'),
    `---\nname: tsh-ui-reviewer\ndescription: Verifies UI. Use when checking a UI.\nreadonly: true\n---\n${NOTE('tsh-ui-reviewer')}\n\n${body}`);
  assert.equal(out.get('.claude/agents/tsh-ui-reviewer.md'), [
    '---',
    'name: tsh-ui-reviewer',
    'description: Verifies UI. Use when checking a UI.',
    'disallowedTools:',
    '  - Agent',
    '  - Write',
    '  - Edit',
    '  - NotebookEdit',
    '  - Bash',
    'model: opus',
    '---',
    NOTE('tsh-ui-reviewer'),
    '',
    '',
  ].join('\n') + body);
  assert.equal(out.get('.codex/agents/tsh-ui-reviewer.toml'), [
    '# Generated from src/agents/tsh-ui-reviewer.md by scripts/generate.mjs. Do not edit.',
    'name = "tsh-ui-reviewer"',
    'description = "Verifies UI. Use when checking a UI."',
    'model = "gpt-5.4"',
    'model_reasoning_effort = "high"',
    'sandbox_mode = "read-only"',
    'developer_instructions = """',
    '',
  ].join('\n') + body + '"""\n');
});

test('every Claude agent denies Agent, also when targets.claude adds disallowedTools', () => {
  const files = sourceFiles();
  files['src/agents/tsh-ui-reviewer.md'] = withFrontmatter(files, 'src/agents/tsh-ui-reviewer.md', {
    targets: { claude: { disallowedTools: ['mcp__atlassian'], color: 'blue' } },
  });
  const out = render(files);
  for (const name of ['tsh-code-reviewer', 'tsh-ui-reviewer']) {
    assert.ok(frontmatter(out.get(`.claude/agents/${name}.md`)).disallowedTools.includes('Agent'), name);
  }
  const ui = frontmatter(out.get('.claude/agents/tsh-ui-reviewer.md'));
  assert.deepEqual(ui.disallowedTools, ['Agent', 'Write', 'Edit', 'NotebookEdit', 'Bash', 'mcp__atlassian']);
  assert.equal(ui.color, 'blue');
});

test('targets.* are merged last', () => {
  const files = sourceFiles();
  files['src/agents/tsh-code-reviewer.md'] = withFrontmatter(files, 'src/agents/tsh-code-reviewer.md', {
    targets: { cursor: { model: 'fast-model', is_background: true }, codex: { model_reasoning_effort: 'high' } },
  });
  const out = render(files);
  const cursor = frontmatter(out.get('.cursor/agents/tsh-code-reviewer.md'));
  assert.deepEqual(Object.keys(cursor), ['name', 'description', 'is_background', 'model']);
  assert.equal(parseToml(out.get('.codex/agents/tsh-code-reviewer.toml')).model_reasoning_effort, 'high');
});

test('the "Required skills" line lists both preloaded skills for Cursor and Codex', () => {
  const files = sourceFiles();
  files['src/agents/tsh-code-reviewer.md'] = withFrontmatter(files, 'src/agents/tsh-code-reviewer.md', {
    'preload-skills': ['tsh-reviewing-code', 'tsh-implement-task'],
  });
  const out = render(files);
  const line = 'Required skills: load `tsh-reviewing-code` and `tsh-implement-task` by name before starting.';
  assert.ok(out.get('.cursor/agents/tsh-code-reviewer.md').includes(`-->\n\n${line}\n`));
  assert.ok(parseToml(out.get('.codex/agents/tsh-code-reviewer.toml')).developer_instructions.startsWith(`${line}\n`));
  assert.doesNotMatch(out.get('.claude/agents/tsh-code-reviewer.md'), /Required skills/);
  assert.doesNotMatch(out.get('.cursor/agents/tsh-ui-reviewer.md'), /Required skills/);
});

test('inlinePreload inlines the skill body and its references, without links into skill trees (N2)', () => {
  const files = sourceFiles({
    'src/config/targets.json': { ...TARGETS, inlinePreload: ['cursor', 'codex'] },
    'src/skills/tsh-reviewing-code/references/checklist.md': '# Checklist\n\n- Correctness, see [notes](../assets/report.template.md)\n',
  });
  const out = render(files);
  const cursor = out.get('.cursor/agents/tsh-code-reviewer.md');
  const codex = parseToml(out.get('.codex/agents/tsh-code-reviewer.toml')).developer_instructions;
  for (const text of [cursor, codex]) {
    assert.match(text, /Required skills: `tsh-reviewing-code` is inlined at the end of these instructions\./);
    assert.match(text, /## Preloaded skill: `tsh-reviewing-code`\n\n# Reviewing code/);
    assert.match(text, /### `tsh-reviewing-code` reference: references\/checklist.md\n\n# Checklist\n\n- Correctness/);
    assert.match(text, /Use the checklist \(`references\/checklist.md`, inlined below\)/);
    assert.match(text, /the report \(`assets\/report.template.md` in the `tsh-reviewing-code` skill\)/);
    assert.doesNotMatch(text, /\]\(/, 'no Markdown links remain');
    assert.doesNotMatch(text, /\.agents\/|\.claude\//);
    assert.doesNotMatch(text, /Required skills: load/);
  }
  // Claude keeps its native preload.
  assert.deepEqual(frontmatter(out.get('.claude/agents/tsh-code-reviewer.md')).skills, ['tsh-reviewing-code']);
  assert.doesNotMatch(out.get('.claude/agents/tsh-code-reviewer.md'), /Preloaded skill/);
});

test('inlinePreload for one tool leaves the other on the "Required skills" line', () => {
  const out = render(sourceFiles({ 'src/config/targets.json': { ...TARGETS, inlinePreload: ['codex'] } }));
  assert.match(out.get('.cursor/agents/tsh-code-reviewer.md'), /Required skills: load `tsh-reviewing-code`/);
  assert.match(out.get('.codex/agents/tsh-code-reviewer.toml'), /Preloaded skill/);
});

test('Codex TOML round-trips through smol-toml', () => {
  const out = render();
  for (const name of ['tsh-code-reviewer', 'tsh-ui-reviewer']) {
    const parsed = parseToml(out.get(`.codex/agents/${name}.toml`));
    assert.equal(parsed.name, name);
    assert.equal(typeof parsed.developer_instructions, 'string');
    assert.ok(parsed.developer_instructions.endsWith(MODES));
  }
});

test('a body with """, backslashes and control characters is escaped correctly', () => {
  const body = 'Run `grep "a\\\\b"` then:\n\n```\n"""quoted"""\n""""four\n```\nC:\\path\\to\\file\ttab \u0007bell "end"';
  const files = sourceFiles({ 'src/agents/tsh-ui-reviewer.md': null });
  files['src/agents/tsh-code-reviewer.md'] = withFrontmatter(files, 'src/agents/tsh-code-reviewer.md', {
    'preload-skills': undefined,
    targets: { codex: { nested: { key: 'value' } } },
  }, `${body}\n`);
  const toml = render(files).get('.codex/agents/tsh-code-reviewer.toml');
  const parsed = parseToml(toml);
  assert.equal(parsed.developer_instructions, `${body}\n`);
  assert.deepEqual({ ...parsed.nested }, { key: 'value' });
  assert.equal(parseToml(`x = ${tomlMultiline('a"""b\\')}`).x, 'a"""b\\');
  assert.equal(parseToml(`x = ${tomlMultiline('ends with a quote"\n')}`).x, 'ends with a quote"\n');
});
