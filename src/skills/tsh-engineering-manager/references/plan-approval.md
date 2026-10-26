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

Run the gate after the plan review loop (maximum 3) settles with `APPROVED`, before any file-changing delegation. Plan-less work (Quick flow) has no gate.

Before opening it, check that `REVIEWED_PLAN_REVISION` in the last plan-review report equals the plan's `Plan Revision`. On a mismatch, log it and do not open the gate: re-run the review, or ask the user to choose `stop here` or `custom guidance`.

## Reading the record

Read the plan from disk, never from memory or the caller's claim. Open `## Human Approval`. The record is valid only when `Human Decision` is `APPROVED`, `Approved Revision` equals `Plan Revision`, and `Decision Timestamp` is ISO 8601 UTC ending with `Z`.

- A missing section (a legacy plan) means unapproved: gate once, then `record_human_approval` creates the section.
- `PENDING`, a revision mismatch or a malformed timestamp means not approved.
- Re-read the record before each file-changing delegation. A valid record is reused: tell the user the plan path, the approved revision and the timestamp, and do not ask again.

## Gate text and options

Show the plan path, the `Plan Revision`, the plan-review path and a short summary of the content (tasks, files in scope, risks). Offer exactly these options:

1. `Approve plan`
2. `I have comments`
3. `Stop`

## Recording the answer

Delegate `tsh-architect` with `TASK: record_human_approval` and the user's verbatim answer. The architect writes the `## Human Approval` table for that task only, and creates the section when a legacy plan has none. The architect never asks the user. After `Approve plan`, continue with the tasks, each carrying `PLAN:` and `PLAN_REVISION:`. After `Stop`, record nothing and end.

## Comments and renewed approval

After `I have comments`, delegate `tsh-architect` to revise the plan with the comments. Classify the revision with the material and non-material rules of the Plan governance section. A non-material revision keeps the approval. A material revision bumps `Plan Revision` and resets the approval to `PENDING`: halt file-changing delegation and open the gate again. There is no automatic re-review. A gate re-ask is not a review iteration.

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
| Record: `APPROVED`, revision equals `Plan Revision`, timestamp `2026-10-26T10:00:00Z` | valid |
| Record: decision `PENDING` | not valid |
| Record: `APPROVED`, `Approved Revision` 1, `Plan Revision` 2 | not valid (stale) |
| Record: `APPROVED`, timestamp `26/10/2026 10:00` | not valid (bad timestamp) |
