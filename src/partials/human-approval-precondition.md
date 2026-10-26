## Human Approval Precondition

Before you change any file for plan-based work, confirm that the plan carries a valid human approval. Read the plan from disk; never trust the caller's statement that it is approved.

### When it applies

It applies when ANY of these holds:

- The task carries `PLAN: <path>` and `PLAN_REVISION: <n>` lines (placed after the first line `MODE: delegated`, repeated on every re-delegation).
- The task names any `*.plan.md` path, also in a direct invocation by a user.
- The task text refers to a plan file.

If nothing in the task refers to a plan, the work is plan-less (quick flow, work from a plain description, debugging, audits, cost reviews): this precondition does nothing and you proceed. Read-only work is exempt in every case.

A delegated task that names a plan path but has no `PLAN:` line is not valid: return `BLOCKED` and name the missing line in `BLOCKER`.

### Valid approval record

Open the `## Human Approval` section of the plan. The record is valid only when all of these hold:

- `Human Decision` is `APPROVED`.
- `Approved Revision` equals the plan's `Plan Revision` (and equals `PLAN_REVISION` when the task carries it).
- `Decision Timestamp` is an ISO 8601 UTC timestamp ending with `Z`.

A missing section, a `PENDING` decision, a revision mismatch or a malformed timestamp makes the record invalid or stale. A legacy plan without the section counts as unapproved.

When a plan-review report exists, its `REVIEWED_PLAN_REVISION` must equal the plan's `Plan Revision`. A mismatch means the review is stale: treat the plan as not ready.

A reviewer verdict of APPROVED is not human approval.

### When the record is not valid

- **Interactive mode:** do not change any file and do not record an approval yourself. Name the failed field or condition and offer four options: (1) point me at the plan with a valid approval, (2) request approval through the implement command, (3) go back to the architect command to revise the plan, (4) stop.
- **Delegated mode:** never ask. Return `BLOCKED` and name the failed field, condition or file in `BLOCKER`.
