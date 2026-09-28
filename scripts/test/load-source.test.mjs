import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadSource } from '../lib/load-source.mjs';
import { TARGETS, makeRoot, sourceFiles } from './helpers.mjs';

test('resolves <!-- include: name --> lines from src/partials', () => {
  const model = loadSource(makeRoot(sourceFiles()));
  const agent = model.agents.find((a) => a.name === 'tsh-code-reviewer');
  assert.deepEqual(agent.includes, ['agent-modes']);
  assert.match(agent.body, /## Modes\n\nInteractive by default/);
  assert.doesNotMatch(agent.body, /<!-- include/);
  assert.match(agent.rawBody, /<!-- include: agent-modes -->/);
});

test('a missing partial is an error', () => {
  const root = makeRoot(sourceFiles({ 'src/partials/agent-modes.md': null }));
  assert.throws(() => loadSource(root), /src\/agents\/tsh-code-reviewer\.md: include: partial "agent-modes" not found/);
});

test('a nested include is an error', () => {
  const root = makeRoot(sourceFiles({ 'src/partials/agent-modes.md': 'Modes\n<!-- include: caller-status-handling -->\n' }));
  assert.throws(() => loadSource(root), /src\/partials\/agent-modes\.md: include: nested includes are not allowed/);
});

test('collects support files from references/, assets/ and scripts/ only', () => {
  const root = makeRoot(sourceFiles({
    'src/skills/tsh-reviewing-code/references/deep/more.md': 'more\n',
    'src/skills/tsh-reviewing-code/scripts/run.sh': '#!/bin/sh\n',
    'src/skills/tsh-reviewing-code/examples/old.md': 'old\n',
  }));
  const skill = loadSource(root).skills.find((s) => s.name === 'tsh-reviewing-code');
  assert.deepEqual(skill.supportFiles.map((f) => f.path), [
    'references/checklist.md', 'references/deep/more.md', 'assets/report.template.md', 'scripts/run.sh',
  ]);
  assert.equal(skill.supportFiles[3].content.toString(), '#!/bin/sh\n');
  assert.deepEqual(skill.entries, ['SKILL.md', 'assets', 'examples', 'references', 'scripts']);
});

test('a missing src/ yields an empty model', () => {
  const model = loadSource(mkdtempSync(join(tmpdir(), 'tsh-gen-test-')));
  assert.equal(model.hasSource, false);
  assert.deepEqual([model.skills, model.agents, model.mcp, model.targets], [[], [], null, null]);
});

test('a src/ with only targets.json yields an empty model', () => {
  const model = loadSource(makeRoot({ 'src/config/targets.json': TARGETS }));
  assert.equal(model.hasSource, true);
  assert.deepEqual([model.skills, model.agents, model.mcp], [[], [], null]);
});

test('src/ without targets.json is an error', () => {
  assert.throws(() => loadSource(makeRoot({ 'src/agents/README.txt': 'x' })), /src\/config\/targets\.json: file is missing/);
});

test('invalid frontmatter is an error naming the file', () => {
  const root = makeRoot(sourceFiles({ 'src/agents/tsh-ui-reviewer.md': 'no frontmatter\n' }));
  assert.throws(() => loadSource(root), /src\/agents\/tsh-ui-reviewer\.md: frontmatter/);
});
