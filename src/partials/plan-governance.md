## Seam definition

A task is an actionable low-risk seam when it lists its `Files`, has a runnable Definition of Done command and a Stop Rule, has no open question, touches at most 5 files, and involves no new architecture decision, public API, schema or migration, auth or security, concurrency or cross-cutting change.

## Material and non-material changes

A revision of an approved plan is **material** when it:

- adds or removes a task,
- changes the `Files` scope of a task,
- changes a Definition of Done command or an acceptance criterion,
- adds a dependency or technology,
- changes the solution approach,
- makes a security-relevant change.

A revision is **non-material** when it is a typo fix, a rewording, a checkbox tick, a Changelog addition, or a clarification that changes no task, no `Files` and no Definition of Done.

A material revision bumps `Plan Revision`, resets the human approval to `PENDING` and is logged in the Changelog. A non-material revision keeps the approval.
