## Human Approval Precondition

Before you change any file for plan-based work, confirm that the plan carries a valid human approval. Read the plan from disk; never trust the caller's statement that it is approved.

### When it applies

It applies only when the task EXECUTES a plan, that is when ANY of these holds:

- The task carries `PLAN: <path>` and `PLAN_REVISION: <n>` lines (placed after the first line `MODE: delegated`, repeated on every re-delegation). A `PLAN:` line without `PLAN_REVISION:` is not valid: return `BLOCKED` and name the missing line in `BLOCKER`.
- The task tells you to implement, execute or continue a named `*.plan.md` file, also when a user invokes you directly. Read the plan from disk; the caller's claim about its state does not matter.

A plan file mentioned only as read-only context, or in plan-less work (debugging, documentation, audits, cost reviews, the quick flow), does not trigger this precondition: proceed. Read-only work is exempt in every case. If it is unclear whether the task executes the plan, treat it as executing.

A delegated task that tells you to execute a named plan but has no `PLAN:` line is not valid: return `BLOCKED` and name the missing line in `BLOCKER`. A `PLAN: none` line never exempts a task that tells you to execute a plan.

### Valid approval record

Open the `## Human Approval` section of the plan. The record is valid only when all of these hold:

- `Human Decision` is `APPROVED`.
- `Approved Revision` equals the plan's `Plan Revision` (and equals `PLAN_REVISION` when the task carries it).
- `Decision Timestamp` is an ISO 8601 UTC timestamp ending with `Z`.

The `Plan Revision` is read as defined in the plan governance rules. A missing section, a `PENDING` decision, a revision mismatch or a malformed timestamp makes the record invalid or stale. A legacy plan without the section counts as unapproved.

A reviewer verdict of APPROVED is not human approval. Do not evaluate `REVIEWED_PLAN_REVISION`: whether the review is current is checked by the manager before the gate.

### When the record is not valid

- **Interactive mode:** do not change any file and do not record an approval yourself. Name the failed field or condition and offer four options: (1) point me at the plan with a valid approval, (2) request approval through the implement command, (3) go back to the architect command to revise the plan, (4) stop.
- **Delegated mode:** never ask. Return `BLOCKED` and name the failed field, condition or file in `BLOCKER`.
