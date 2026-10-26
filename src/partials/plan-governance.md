## Seam definition

A task is an actionable low-risk seam when it lists its `Files`, has a runnable Definition of Done command and a Stop Rule, has no open question, touches at most 5 files, and involves no new architecture decision, public API, schema or migration, auth or security, concurrency or cross-cutting change.

## Plan Revision

`Plan Revision` is a positive integer. Its home is the `Plan Revision` row of the `## Human Approval` table. A legacy plan without that section may carry it as a `Plan Revision` row in Task Details; when both exist they must be equal. A legacy plan with neither has the implicit revision 1; the section is created with that value at the first gate.

## Material and non-material changes

The engineering manager decides whether a revision is material; the architect applies the definition and reports every change it made, and the stricter result wins. A revision of an approved plan is **material** when it:

- adds or removes a task, or changes task order or dependencies,
- changes the `Files` scope or the `Stop Rule` of a task,
- changes a Definition of Done command or an acceptance criterion,
- changes whether a task is marked an actionable low-risk seam (it changes the routing),
- adds a dependency or technology,
- changes the solution approach,
- makes a security-relevant change,
- changes a command in Technical Context that a Definition of Done or Verification line uses.

A revision is **non-material** when it is a typo fix, a rewording, a checkbox tick, a Changelog addition, a Technical Context addition that changes no command used by a task, or a clarification that changes no task, no `Files` and no Definition of Done.

A material revision bumps `Plan Revision`, sets `Human Decision` to `PENDING`, sets `Approved Revision` to `-` and is logged in the Changelog. It also makes the existing plan review stale: the plan is reviewed again before the gate. A non-material revision keeps `Plan Revision` and the review; it keeps a valid `APPROVED` record, and a `PENDING` record stays `PENDING`.

The only values of `Human Decision` are `PENDING` and `APPROVED`.
