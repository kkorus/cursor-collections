// Contract tests over the real source tree and the committed outputs (plan Task 3.3).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { parse as parseToml } from 'smol-toml';
import { REPO_ROOT } from './helpers.mjs';

const read = (rel) => readFileSync(join(REPO_ROOT, rel), 'utf8');
const files = (dir) =>
  readdirSync(join(REPO_ROOT, dir)).flatMap((e) => {
    const rel = `${dir}/${e}`;
    return statSync(join(REPO_ROOT, rel)).isDirectory() ? files(rel) : [rel];
  });

test('every generated Codex agent carries the agent-modes text in developer_instructions', () => {
  const modes = read('src/partials/agent-modes.md').trim();
  const tomls = files('.codex/agents').filter((f) => f.endsWith('.toml'));
  assert.ok(tomls.length > 0);
  for (const rel of tomls) {
    assert.ok(parseToml(read(rel)).developer_instructions.includes(modes), `${rel} lacks the agent-modes text`);
  }
});

test('agent-modes: interactive is the default and only the exact first line MODE: delegated switches it', () => {
  const modes = read('src/partials/agent-modes.md');
  assert.match(modes, /\*\*Interactive mode is the default\.\*\*/);
  assert.match(modes, /first line of the task you received is exactly `MODE: delegated`/);
  for (const status of ['DONE', 'NEEDS_INPUT', 'NEEDS_ARCHITECT_DECISION', 'BLOCKED']) assert.ok(modes.includes(status));
  assert.match(modes, /numbered \*\*"Questions for you"\*\* list/);
  assert.match(modes, /never depends on line breaks/);
});

test('caller-status-handling: parsing does not depend on line breaks and the iteration cap is stated', () => {
  const caller = read('src/partials/caller-status-handling.md');
  assert.match(caller, /parsing must not depend on line breaks/);
  assert.match(caller, /`STATUS: DONE SUMMARY: \.\.\.`/);
  assert.match(caller, /at most 3 times per task/);
  assert.match(caller, /^MODE: delegated$/m);
});

test('the plan-progress text lives in exactly one src file', () => {
  const marker = 'After completing each task, update the plan by checking the task\'s progress checkbox.';
  const holders = files('src').filter((f) => f.endsWith('.md') && read(f).includes(marker));
  assert.deepEqual(holders, ['src/partials/plan-progress.md']);
});
