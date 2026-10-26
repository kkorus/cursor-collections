# Plan Approval

The one formal gate for plan-based work. The material and non-material rules are in the Plan governance section of the manager's `SKILL.md`; apply them from there.

## Contents

- When the gate runs
- Reading the record
- Gate text and options
- Recording the answer
- Comments and renewed approval
- Review blockers the architect cannot settle
- Defence in depth
- Fixture table

## When the gate runs

Run the gate once the plan review loop (maximum 3 iterations per plan revision) settles with `APPROVED` for the current `Plan Revision`, before any file-changing delegation. Plan-less work (Quick flow) has no gate.

Order of states: review, then gate, then execution. Before opening the gate, check that `REVIEWED_PLAN_REVISION` in the last plan-review report equals the plan's `Plan Revision`. On a mismatch the review is stale: run the plan review loop again, then open the gate. This never needs the user, so the gate can always be opened after a revision.

If the review loop ended with open BLOCKERS and the user overrode that (see the loop in the main instructions), the gate still runs: list the open BLOCKERS in the gate text. An override is not an approval.

## Reading the record

Read the plan from disk, never from memory or the caller's claim. Open `## Human Approval`. The record is valid only when `Human Decision` is `APPROVED`, `Approved Revision` equals `Plan Revision`, and `Decision Timestamp` is ISO 8601 UTC ending with `Z`.

- A missing section (a legacy plan) means unapproved. A legacy plan is not sent to the architect just for the section, and the reviewer does not fail it for that. Its `Plan Revision` is the implicit 1 when absent. At the first gate, `record_human_approval` (with `PLAN_REVISION` set to that value) creates the section.
- `PENDING`, a revision mismatch or a malformed timestamp means not approved.
- Re-read the record before each file-changing delegation. A valid record is reused: tell the user the plan path, the approved revision and the timestamp, and do not ask again.

## Gate text and options

Show the plan path, the `Plan Revision`, the plan-review path and a short summary of the content (tasks, files in scope, risks). After a comment round, add a short summary of what changed since the previous ask. Offer exactly these options:

1. `Approve plan`
2. `I have comments`
3. `Stop`

## Recording the answer

Delegate `tsh-architect` with `TASK: record_human_approval`, `PLAN_REVISION: <n>` and the user's verbatim answer. The architect writes the `## Human Approval` table for that task only, and creates the section when a legacy plan has none. The architect never asks the user. After `Approve plan`, continue with the tasks, each carrying `PLAN:` and `PLAN_REVISION:`. After `Stop`, record nothing and end.

## Comments and renewed approval

After `I have comments`, delegate `tsh-architect` to revise the plan with the comments, then classify the revision with the material and non-material rules of the Plan governance section (the manager classifies; the stricter result wins).

- **Non-material:** keep `Plan Revision`, make sure the record is `PENDING`, and ask the gate again with a short summary of the changes. The existing review stays valid.
- **Material:** `Plan Revision` is bumped and the record is `PENDING`. Run the plan review loop again (a fresh maximum of 3 iterations), then open the gate. The path is always review, then gate.
- **Cap:** the gate is asked again after comments at most 3 times per plan. A fourth round of comments does not start another revision: stop and ask the user for `stop here` or `custom guidance`. A gate re-ask is not a review iteration.

`custom guidance` means the user's free-text instruction on how to proceed. Follow it, route any plan change through the revision rules above, and never treat it as approval.

## Review blockers the architect cannot settle

When the architect cannot resolve a review blocker, ask the user for exactly one of: `stop here` or `custom guidance`.

## Defence in depth

Every executor re-validates the record on its own and returns `BLOCKED` when it is not valid. Do not rely on this; run the gate anyway.

## Fixture table

Examples of revisions and their classification, and of approval records and whether they are valid.

| Example | Classification |
| --- | --- |
| Typo fix in a task description | non-material |
| Add a task | material |
| Change a task's `Files` scope | material |
| Change a Definition of Done command | material |
| Add a Changelog entry | non-material |
| Add a dependency | material |
| Change a task's `Stop Rule` or the order of tasks | material |
| Add a Technical Context note that changes no command | non-material |
| Comments answered with a rewording (revision kept, record `PENDING`) | non-material, re-ask the gate |
| Comments that add a task (revision bumped, record `PENDING`) | material, review again, then the gate |
| Record: `APPROVED`, revision equals `Plan Revision`, timestamp `2026-10-26T10:00:00Z` | valid |
| Record: decision `PENDING` | not valid |
| Record: `APPROVED`, `Approved Revision` 1, `Plan Revision` 2 | not valid (stale) |
| Record: `APPROVED`, timestamp `26/10/2026 10:00` | not valid (bad timestamp) |
