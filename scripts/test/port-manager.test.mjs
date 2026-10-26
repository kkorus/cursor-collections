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

// Protocol test: the documented predicate applied to the fixture records.
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const isValid = ({ decision, approvedRevision, planRevision, timestamp }) =>
  decision === 'APPROVED' && approvedRevision === planRevision && TIMESTAMP.test(timestamp);

test('protocol: the fixture records are classified by the documented predicate', () => {
  const rows = read(`${EM}/references/plan-approval.md`).split('\n').filter((l) => l.startsWith('| Record:'));
  assert.equal(rows.length, 4);
  const results = rows.map((row) => {
    const [, example, verdict] = row.split('|').map((c) => c.trim());
    const decision = /decision `?PENDING/.test(example) ? 'PENDING' : 'APPROVED';
    const stale = /`Approved Revision` 1, `Plan Revision` 2/.test(example);
    const ts = /timestamp `([^`]+)`/.exec(example)?.[1] ?? '2026-10-26T10:00:00Z';
    const record = { decision, approvedRevision: stale ? 1 : 2, planRevision: 2, timestamp: ts };
    return { verdict, valid: isValid(record) };
  });
  assert.deepEqual(results.map((r) => r.valid), [true, false, false, false]);
  assert.deepEqual(results.map((r) => r.verdict.startsWith('valid')), [true, false, false, false]);
});
