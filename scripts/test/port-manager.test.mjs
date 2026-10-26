// Own-file tests for group G4 (engineering manager and orchestration).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { REPO_ROOT } from './helpers.mjs';

const read = (rel) => readFileSync(join(REPO_ROOT, rel), 'utf8');
const EM = 'src/skills/tsh-engineering-manager';
const count = (text, needle) => text.split(needle).length - 1;

test('the manager includes caller-status-handling and plan-governance once each', () => {
  const skill = read(`${EM}/SKILL.md`);
  assert.equal(count(skill, '<!-- include: caller-status-handling -->'), 1);
  assert.equal(count(skill, '<!-- include: plan-governance -->'), 1);
});

test('the manager SKILL.md has no Phase Gates heading, stays within 260 lines and names the UI-only contract', () => {
  const skill = read(`${EM}/SKILL.md`);
  assert.equal(count(skill, '## Phase Gates'), 0);
  assert.ok(skill.replace(/\n$/, '').split('\n').length <= 260);
  for (const name of ['UI_TASKS', 'FIGMA_URLS', 'DEV_SERVER_URL', 'UI_VERIFICATION_DIR', 'SINGLE_PASS', 'ITERATION_DIR',
    'tsh-plan-implementor', 'tsh-ui-engineer', 'tsh-technical-writer', 'record_human_approval']) {
    assert.ok(skill.includes(name), `SKILL.md lacks ${name}`);
  }
});

test('task-routing names the four executors and does not restate the seam sentence', () => {
  const routing = read(`${EM}/references/task-routing.md`);
  for (const name of ['tsh-plan-implementor', 'tsh-software-engineer', 'tsh-ui-engineer', 'tsh-technical-writer']) {
    assert.ok(routing.includes(name), `task-routing lacks ${name}`);
  }
  assert.equal(count(routing, 'actionable low-risk seam when it lists'), 0);
  assert.equal(count(routing, 'touches at most 5 files'), 0);
  assert.ok(routing.split('\n').length < 200);
});

test('plan-approval carries the gate labels, the legacy rule and the revision equality check', () => {
  const approval = read(`${EM}/references/plan-approval.md`);
  for (const label of ['Approve plan', 'I have comments', 'Stop']) assert.ok(approval.includes(`\`${label}\``), label);
  for (const needle of ['record_human_approval', 'REVIEWED_PLAN_REVISION', 'A missing section (a legacy plan) means unapproved']) {
    assert.ok(approval.includes(needle), needle);
  }
  assert.ok(approval.split('\n').length < 200);
  assert.equal(count(approval, 'touches at most 5 files'), 0);
});

test('implementation-flows keeps the Quick flow and has no Phase Gates', () => {
  const flows = read(`${EM}/references/implementation-flows.md`);
  assert.equal(count(flows, '## Quick flow'), 1);
  assert.equal(count(flows, 'Phase Gates'), 0);
  assert.ok(flows.includes('always uses the Full flow'));
});

// Protocol tests: assert on the protocol text and the fixture table, not on a copy of the predicate.
const PRECONDITION = 'src/partials/human-approval-precondition.md';

test('protocol: the fixture records state their verdict next to the documented validity rule', () => {
  const approval = read(`${EM}/references/plan-approval.md`);
  const rows = approval.split('\n').filter((l) => l.startsWith('| Record:')).map((l) => l.split('|').map((c) => c.trim()));
  assert.deepEqual(rows.map((r) => r[2].split(' ')[0]), ['valid', 'not', 'not', 'not']);
  assert.ok(rows[0][1].includes('revision equals `Plan Revision`'));
  assert.ok(/`Approved Revision` equals the plan's `Plan Revision`/.test(read(PRECONDITION)));
  assert.ok(/ISO 8601 UTC timestamp ending with `Z`/.test(read(PRECONDITION)));
});

test('protocol: a material revision goes review then gate, with capped gate re-asks and no dead end', () => {
  const approval = read(`${EM}/references/plan-approval.md`);
  const skill = read(`${EM}/SKILL.md`);
  assert.equal(count(approval, 'There is no automatic re-review'), 0);
  assert.ok(approval.includes('run the plan review loop again, then open the gate'));
  assert.ok(approval.includes('at most 3 times per plan'));
  assert.ok(approval.includes('`custom guidance` means'));
  assert.ok(skill.includes('Every delegation counts as one iteration'));
  assert.ok(skill.includes('An override is not an approval'));
  assert.ok(skill.includes('`PLAN_REVISION` is never omitted'));
  // the executor side does not evaluate the review revision; the manager does, before the gate
  assert.ok(read(PRECONDITION).includes('Do not evaluate `REVIEWED_PLAN_REVISION`'));
});

test('protocol: the precondition triggers on executing a plan only and requires PLAN_REVISION', () => {
  const pre = read(PRECONDITION);
  assert.ok(pre.includes('EXECUTES a plan'));
  assert.ok(pre.includes('read-only context'));
  assert.equal(count(pre, 'names any `*.plan.md` path'), 0);
  assert.ok(pre.includes('A `PLAN:` line without `PLAN_REVISION:` is not valid'));
});

test('protocol: legacy plans reach the gate and only PENDING and APPROVED exist', () => {
  const reviewing = read('src/skills/tsh-reviewing-plans/SKILL.md');
  assert.ok(reviewing.includes('implicit revision 1'));
  assert.ok(read(`${EM}/references/plan-approval.md`).includes('implicit 1'));
  assert.ok(read('src/partials/plan-governance.md').includes('The only values of `Human Decision` are `PENDING` and `APPROVED`'));
  for (const f of ['src/agents/tsh-architect.md', 'src/skills/tsh-designing-architecture/assets/plan.template.md', `${EM}/references/plan-approval.md`]) {
    assert.ok(!/STOPPED|CHANGES_REQUESTED/.test(read(f)), f);
  }
});

test('protocol: UI-only mode says where the task slug and the verification dir come from', () => {
  assert.ok(read(`${EM}/SKILL.md`).includes('derive `<task>` from the user\'s request as a short kebab-case slug'));
  assert.ok(read('src/skills/tsh-review-ui/SKILL.md').includes('only when the user gave one'));
});
