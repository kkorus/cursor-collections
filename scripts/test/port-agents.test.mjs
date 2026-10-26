import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { loadSource } from '../lib/load-source.mjs';
import { renderAgents } from '../lib/render-agents.mjs';
import { REPO_ROOT } from './helpers.mjs';

const source = loadSource(REPO_ROOT);
const out = renderAgents(source);
const partial = (name) => readFileSync(join(REPO_ROOT, 'src', 'partials', `${name}.md`), 'utf8').trim();
const PRECONDITION = partial('human-approval-precondition');
const VCS = partial('version-control-safety');
const count = (text, needle) => text.split(needle).length - 1;
const claude = (name) => out.get(`.claude/agents/${name}.md`);
const frontmatter = (text) => parseYaml(/^---\n([\s\S]*?)\n---\n/.exec(text)[1]);
const agentData = (name) => source.agents.find((a) => a.data.name === name).data;

const EXECUTORS = ['tsh-software-engineer', 'tsh-plan-implementor', 'tsh-technical-writer',
  'tsh-e2e-engineer', 'tsh-devops-engineer', 'tsh-prompt-engineer'];

test('plan-implementor and technical-writer render Claude haiku without the Agent tool', () => {
  for (const name of ['tsh-plan-implementor', 'tsh-technical-writer']) {
    const fm = frontmatter(claude(name));
    assert.equal(fm.model, 'haiku', name);
    assert.deepEqual(fm.disallowedTools, ['Agent'], name);
  }
});

test('software-engineer stays opus and has no figma or playwright', () => {
  assert.equal(frontmatter(claude('tsh-software-engineer')).model, 'opus');
  assert.deepEqual(agentData('tsh-software-engineer')['requires-mcp'], ['context7', 'sequential-thinking']);
  for (const name of ['tsh-plan-implementor', 'tsh-technical-writer']) {
    assert.equal(agentData(name)['requires-mcp'], undefined, name);
  }
});

test('six executors render the approval precondition exactly once in every target', () => {
  assert.equal(EXECUTORS.length, 6);
  const files = (name) => [`.cursor/agents/${name}.md`, `.claude/agents/${name}.md`, `.codex/agents/${name}.toml`];
  for (const name of EXECUTORS) {
    for (const file of files(name)) assert.equal(count(out.get(file), PRECONDITION), 1, file);
  }
});

test('the approval precondition is absent from the code reviewer', () => {
  for (const file of ['.cursor/agents/tsh-code-reviewer.md', '.claude/agents/tsh-code-reviewer.md', '.codex/agents/tsh-code-reviewer.toml']) {
    assert.equal(count(out.get(file), PRECONDITION), 0, file);
  }
});

test('version-control-safety is rendered in exactly the two coding agents', () => {
  const withVcs = [...source.agents].map((a) => a.data.name)
    .filter((name) => count(claude(name), VCS) === 1);
  assert.deepEqual(withVcs.sort(), ['tsh-plan-implementor', 'tsh-software-engineer']);
});
