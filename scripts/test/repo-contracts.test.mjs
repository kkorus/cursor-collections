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

test('plan template and gap-analysis template use the same create/modify/reuse terms and end with a newline', () => {
  const plan = read('src/skills/tsh-designing-architecture/assets/plan.template.md');
  const gap = read('src/skills/tsh-analyzing-implementation-gaps/assets/implementation-gap-analysis.template.md');
  for (const term of ['To Be Created', 'To Be Modified', 'To Be Reused']) {
    assert.ok(plan.includes(`### ${term}`), `plan template lacks ${term}`);
    assert.ok(gap.includes(`### ${term}`), `gap template lacks ${term}`);
  }
  for (const text of [plan, gap, read('src/skills/tsh-analyzing-implementation-gaps/SKILL.md')]) assert.ok(text.endsWith('\n'));
});

test('agents with access read-only are never told to write files', () => {
  const instructsWrite = /\b(write|save|persist|store|create)\b[^.\n]{0,60}\b(to|into|at|in)\b[^.\n]{0,40}\b(file|files|path|disk|specifications)\b/i;
  const negated = /\b(never|cannot|can't|not|no)\b|if your role can write|if you can write/i;
  const readOnly = files('src/agents').filter((f) => f.endsWith('.md') && /^access: read-only$/m.test(read(f)));
  assert.ok(readOnly.length >= 7, 'expected the read-only agents to be found');
  for (const rel of readOnly) {
    read(rel).split('\n').forEach((line, i) => {
      if (instructsWrite.test(line) && !negated.test(line)) assert.fail(`${rel}:${i + 1} tells a read-only agent to write files: ${line.trim()}`);
    });
  }
  const modes = read('src/partials/agent-modes.md');
  assert.match(modes, /If your role can write files/);
  assert.match(modes, /If your role is read-only, never write files/);
});

const srcMd = () => files('src').filter((f) => f.endsWith('.md'));
const holdersOf = (text) => srcMd().filter((f) => read(f).includes(text));

test('the plan template carries the plan contract sections and the three gap-analysis terms', () => {
  const plan = read('src/skills/tsh-designing-architecture/assets/plan.template.md');
  for (const pattern of ['## Human Approval', '## Wildly Important Goal', '**UI Verification Status**', '**Stop Rule**', '**Verification**', '### To Be Created', '### To Be Modified', '### To Be Reused']) {
    assert.ok(plan.includes(pattern), `plan template lacks ${pattern}`);
  }
  assert.ok(plan.endsWith('\n'));
});

test('the approval and version-control partials exist once and hold their distinctive sentences once', () => {
  const approval = 'src/partials/human-approval-precondition.md';
  const vcs = 'src/partials/version-control-safety.md';
  assert.deepEqual(holdersOf('A reviewer verdict of APPROVED is not human approval.'), [approval]);
  assert.deepEqual(holdersOf('Never run `git clean`'), [vcs]);
  const text = read(approval);
  for (const token of ['PLAN_REVISION', 'Approved Revision', 'REVIEWED_PLAN_REVISION', '*.plan.md']) assert.ok(text.includes(token), `precondition lacks ${token}`);
  for (const rel of [approval, vcs]) assert.doesNotMatch(read(rel), /delegate to|spawn|subagent/i, rel);
});

test('approval protocol: the architect records only on request, the partial names the triggers and the BLOCKED branch', () => {
  const architect = read('src/agents/tsh-architect.md');
  assert.ok(architect.includes('record_human_approval'));
  assert.doesNotMatch(architect, /Approve plan|I have comments/);
  const partial = read('src/partials/human-approval-precondition.md');
  assert.match(partial, /`PLAN: <path>` and `PLAN_REVISION: <n>`/);
  assert.match(partial, /names any `\*\.plan\.md` path/);
  assert.match(partial, /refers to a plan file/);
  assert.match(partial, /Delegated mode:\*\* never ask\. Return `BLOCKED`/);
  assert.match(partial, /return `BLOCKED` and name the missing line/);
});

test('tsh-reviewing-plans is the only src file listing the blocker categories', () => {
  const phrase = 'No safety proof';
  assert.deepEqual(holdersOf(phrase), ['src/skills/tsh-reviewing-plans/SKILL.md']);
  const skill = read('src/skills/tsh-reviewing-plans/SKILL.md');
  assert.ok(skill.includes('REVIEWED_PLAN_REVISION'));
  assert.ok(read('src/agents/tsh-plan-reviewer.md').includes('REVIEWED_PLAN_REVISION'));
  for (const rel of srcMd()) assert.doesNotMatch(read(rel), /<plan-review-report/, rel);
});

test('plan-governance exists once with its two headings and is included by tsh-designing-architecture', () => {
  const rel = 'src/partials/plan-governance.md';
  const seam = 'A task is an actionable low-risk seam when it lists its `Files`';
  assert.deepEqual(holdersOf(seam), [rel]);
  const text = read(rel);
  assert.ok(text.includes('## Seam definition') && text.includes('## Material and non-material changes'));
  assert.doesNotMatch(text, /<!-- include:/);
  assert.ok(read('src/skills/tsh-designing-architecture/SKILL.md').includes('<!-- include: plan-governance -->'));
});

test('legacy-names.json lists the upstream port names and a valid unprefixed list', () => {
  const j = JSON.parse(read('scripts/legacy-names.json'));
  assert.equal(j.renamed['tsh-orchestrating-implementation'], 'tsh-engineering-manager');
  for (const n of ['tsh-creating-implementation-plans', 'tsh-resolving-skill-references']) assert.ok(j.deleted.includes(n), n);
  for (const n of ['tsh-plan-implementor', 'tsh-technical-writer', 'tsh-ui-engineer', 'tsh-ui-capture-worker']) assert.ok(j.nowSubagents.includes(n), n);
  assert.deepEqual(j.unprefixed, ['playwright-cli']);
  assert.ok(Array.isArray(j.unprefixed) && j.unprefixed.every((n) => /^[a-z0-9-]+$/.test(n)));
});
