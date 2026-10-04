// Golden-output checks for the three leaf agents reworked in plan Task 3.15 (model tier, read-only, leaf enforcement).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';
import { loadSource } from '../lib/load-source.mjs';
import { renderAgents } from '../lib/render-agents.mjs';
import { REPO_ROOT } from './helpers.mjs';

const out = renderAgents(loadSource(REPO_ROOT));
const frontmatter = (text) => parseYaml(/^---\n([\s\S]*?)\n---\n/.exec(text)[1]);

const EXPECTED = {
  'tsh-architect': { claude: 'opus', codex: { model: 'gpt-5.4', model_reasoning_effort: 'high' } },
  'tsh-software-engineer': { claude: 'opus', codex: { model: 'gpt-5.4', model_reasoning_effort: 'high' } },
  'tsh-code-reviewer': { claude: 'sonnet', codex: { model: 'gpt-5.4', model_reasoning_effort: 'medium' } },
};

for (const [name, want] of Object.entries(EXPECTED)) {
  test(`${name}: read-write leaf agent renders the expected model and permissions`, () => {
    const claude = frontmatter(out.get(`.claude/agents/${name}.md`));
    assert.equal(claude.model, want.claude);
    assert.deepEqual(claude.disallowedTools, ['Agent']);
    const cursor = frontmatter(out.get(`.cursor/agents/${name}.md`));
    assert.equal(cursor.readonly, undefined);
    assert.equal(cursor.model, undefined);
    const codex = parseToml(out.get(`.codex/agents/${name}.toml`));
    assert.equal(codex.model, want.codex.model);
    assert.equal(codex.model_reasoning_effort, want.codex.model_reasoning_effort);
    assert.equal(codex.sandbox_mode, undefined);
  });
}
