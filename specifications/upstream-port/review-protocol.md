# Review: approval protocol, routing and installer (port/upstream, HEAD 8da923e)

Scope: `git diff 90b3213..HEAD -- src scripts AGENTS.md`, parts A (approval protocol) and B (installer).

## Check results

- `node scripts/lint.mjs`: 0 errors, 0 warnings.
- `npm test`: 255 tests, 255 pass, 0 fail.
- `npx -y node@22 --test "scripts/test/*.test.mjs"`: 255 pass, 0 fail.
- Counts verified: 21 agents, 16 commands, 3 orchestrators, 3 internal steps, 43 knowledge skills, 65 skills; README line 15 matches. Seven agents include the precondition, as `port-contracts` expects.
- Nothing in the repo was modified except this file. The installer was not run.

Totals: critical 0, warning 5, suggestion 8.

## Warnings

### W1. Re-asking the gate after a material revision contradicts the stale-review check
- `src/skills/tsh-engineering-manager/references/plan-approval.md:44` vs `:20`; also `src/partials/human-approval-precondition.md:27`.
- Problem: line 44 says a material revision resets the approval to `PENDING`, the manager halts, opens the gate again, and "there is no automatic re-review". But a material revision bumps `Plan Revision`, so the last plan-review report now has a lower `REVIEWED_PLAN_REVISION`. Line 20 then says "do not open the gate: re-run the review, or ask `stop here` / `custom guidance`".
- Failure scenario: the user picks `I have comments`, the architect adds a task (material, revision 2), and the manager must re-ask the gate. The stale-review check forbids that. If the manager follows line 44 and the user approves, every executor evaluates the precondition at `human-approval-precondition.md:27`, sees a stale review, and returns `BLOCKED`. `task-routing.md:34` sends the manager "back to the gate". The gate holds a valid record and is reused without asking, so the manager delegates again and gets `BLOCKED` again.
- Related gaps:
  - A re-run review may be capped at 3 and leaves only `stop here` or `custom guidance`, which is undefined.
  - Executors are not given the review path, so the "when a report exists" check depends on a naming convention nobody states.
- Fix:
  - After a material revision, state explicitly: re-run the plan review with a fresh iteration budget (3), then gate.
  - Delete "There is no automatic re-review".
  - Pass the plan-review path to executors, or drop the stale-review check from the executor side. The manager gate already enforces it.
  - Define `custom guidance`.

### W2. A non-material revision after `I have comments` has no defined next transition
- `src/skills/tsh-engineering-manager/references/plan-approval.md:44`; `src/partials/plan-governance.md:18`.
- Problem: "A non-material revision keeps the approval", but when comments are processed the record is still `PENDING`; there is nothing to keep. The text re-opens the gate only for a material revision.
- Failure scenario: a user comments on wording, the architect makes a rewording (non-material), and the record is `PENDING`. The manager has no instruction to re-ask. A manager that carries on has executors that return `BLOCKED`. A manager that waits stalls.
- Fix: after any comment-driven revision, always re-ask the gate unless the record is already valid for the new revision. Say that "keeps the approval" applies only to an `APPROVED` record.

### W3. The precondition is triggered lexically by any `*.plan.md` mention, so plan-less work can be blocked
- `src/partials/human-approval-precondition.md:10-11`.
- Problem: "The task names any `*.plan.md` path" and "refers to a plan file" fire on text, not on whether the work is plan-based.
- Failure scenario:
  - `/tsh-debug` on a bug in plan tooling hands `tsh-software-engineer` a root cause naming `specifications/x/x.plan.md` or a fixture (this repository is full of them). With no `PLAN:` line, the delegated agent returns `BLOCKED` ("missing line").
  - In interactive mode the agent refuses to edit.
  - The same applies to `tsh-technical-writer` documenting a plan, and to an audit that names a plan.
  - Quick flow with a user-supplied plan path is also blocked, which is fail-closed but undocumented.
- Fix: limit the trigger to "the task asks you to implement, or work from, the plan". Mention incidental plan paths as read-only context, and let the caller state `PLAN: none` for plan-less delegations.

### W4. A legacy plan can never reach the gate
- `src/skills/tsh-engineering-manager/references/plan-approval.md:26`; `src/skills/tsh-reviewing-plans/SKILL.md:96`; `src/skills/tsh-designing-architecture/assets/plan.template.md:75-81`.
- Problem: `Plan Revision` lives only inside the `## Human Approval` table, and a legacy plan has no such section. The reviewer therefore records `unknown` and is forced to `REVISIONS NEEDED`. The gate requires an `APPROVED` review with a matching revision. Line 26 ("gate once, then `record_human_approval` creates the section") is unreachable without an architect pass.
- Failure scenario: `/tsh-implement` on an old plan runs review iteration 1, which returns `unknown`. The architect may treat this as a non-blocker and resolve nothing. The manager then burns the 3-iteration cap on a structural defect.
- Fix: in plan-approval, state that a legacy plan first gets the section from the architect (`PENDING`, revision 1) before the review. Name this as an explicit pre-review step.

### W5. Plan-review loop, step 5, has no cap, and the override path is unspecified
- `src/skills/tsh-engineering-manager/SKILL.md:153-154`.
- Problem:
  - "Re-delegate the reviewer with the same inputs" when the report is incomplete or missing is not tied to the 3-iteration loop.
  - `unless the user overrides` (line 153) does not say whether the gate still runs. `plan-approval.md:18` runs the gate only "after the loop settles with `APPROVED`".
- Failure scenario: a reviewer that repeatedly writes a malformed report loops until the generic 3-re-delegation cap in `caller-status-handling.md`, which is a different counter. After a user override of BLOCKERS there is no defined route to approval, because the stale-review and `APPROVED` preconditions both fail.
- Fix: count step 5 against the 3-iteration cap. State that an override still goes through the gate, with the open BLOCKERS shown in the gate text.

## Suggestions

- S1. `human-approval-precondition.md:22`. A delegation with `PLAN:` but no `PLAN_REVISION:` silently skips the stale-caller check ("when the task carries it"). Make `PLAN_REVISION` mandatory when `PLAN:` is present; otherwise `BLOCKED`.
- S2. Forged or stale records and post-approval edits. The executor trusts the table, and the architect writes `APPROVED` from a "verbatim answer" supplied by the manager, which nobody can verify. A material edit made by anyone other than the architect, or made without a revision bump, leaves a valid record. The architect also classifies its own revisions as material or non-material. Mitigation: the manager should diff the plan before and after each architect revision and compare against the classification, and the rules should say that classification is the manager's, not the author's. An optional content hash of the task and Files sections in the record would close this.
- S3. `plan-governance.md:7-16`. The material list omits the `Stop Rule`, task order and dependencies, the seam classification (which changes routing), and Technical Context additions (`implementation-flows.md` step 4 asks the architect to add Technical Context to an already approved plan). Say which of these are material.
- S4. `plan-governance.md:18` says "resets to `PENDING`", while `plan.template.md:85` also says "clears `Approved Revision`". Align them.
- S5. `plan-approval.md:40-44` records nothing on `Stop` and never records `CHANGES_REQUESTED`, but `tsh-architect.md:70` and the template define `STOPPED` and `CHANGES_REQUESTED`. Either delete the unused values or record them.
- S6. Routing.
  - `plan-governance.md:3` "touches at most 5 files" is ambiguous. It is unclear whether tests, created files and `reuse` files count, and how globs are counted. `task-routing.md:34` says "failed after the loop cap of 3" while `SKILL.md:93` and the routing table say "returned `NEEDS_ARCHITECT_DECISION` twice". Two different escalation triggers exist.
  - `task-routing.md:34` escalates `BLOCKED` for any reason other than approval. A version-control conflict would be re-routed to the software engineer, which has the same rule.
  - There is no escalation path after the UI engineer fails.
  - Template `Stop Rule: <stop-condition-or-omit>` allows omission, while the seam requires it. A task without a Stop Rule silently fails the seam test; say so.
  - "UI task = any rendered-UI change" does not cover mixed tasks with UI and non-UI files. Add a rule: split, or route to the UI engineer.
- S7. `task-routing.md:36` ("never skills or agents under `src/`") is consistent with the technical writer, but the `tsh-write-documentation` skill says "plan scope". Confirm that a plan task touching `src/` agents is routed to `tsh-ai-customization-*`, not left unrouted.
- S8. Installer tests (`scripts/test/install.test.mjs`, the new "unprefixed legacy names" test).
  - The flat symlink `.claude/skills/playwright-cli` -> `.cursor/skills/workflows/playwright-cli` is created before the category step moves its target. By the time step b2 runs the link is dangling, so the `LEGACY_LINK_RE` branch (`install.mjs:345`) is never the one that fires. A live old-layout symlink is untested.
  - There is no negative case (a symlink to a live, non-legacy target must stay), no dry-run case, and no second-run idempotence assertion.
  - The test `invalid unprefixed content` is fine.
  - `port-manager.test.mjs` "protocol: fixture records" re-implements the validity predicate inside the test and parses the fixture table with regexes. It checks only that the documentation table matches a copy of itself, not that any agent behaves accordingly.

## Part B: installer verdict

- `scripts/install.mjs:296-300`. The name validation `^[a-z0-9-]+$` is sound (JS `$` does not match before a trailing newline). Separators, `..` and dots are impossible, so there is no path injection through `unprefixed`. A bad type or shape raises `UsageError`. The 5 invalid inputs are tested.
- Deletion safety.
  - Step b2 (`:338-346`) removes only symlinks (`lstat.isSymbolicLink`), and `retire` for a symlink only unlinks, never touching the target. A real directory named `playwright-cli` in a flat directory is left alone (tested).
  - The category-folder branch (`:332`) moves real entries to the timestamped backup (`retire` -> `moveEntry`), not deleted. Content under the old `.cursor/skills/<category>/` is old-layout territory.
  - A user-made symlink named `playwright-cli` to a live non-old-layout target is kept. A user symlink that is dangling is removed; acceptable.
- Windows (reasoning only).
  - `LEGACY_LINK_RE` handles `\` and `/`.
  - A junction reports as a symlink via `lstat`.
  - `readlink` may return `\\?\`-prefixed or trailing-slash targets, which the regex still matches.
  - A relative target such as `.cursor/skills/agents/x` without a leading separator is caught only by the resolved-path test, which is present.
  - No issue found.
- Idempotence: after retire, `lstat` returns null, so a rerun is a no-op (`seen` de-duplicates between steps). Only the dry-run/rerun cases are untested (S8).
- `legacy-names.json` additions are consistent: `tsh-orchestrating-implementation` is not in `src/` (the `port-contracts` (h) test also asserts that), the `nowSubagents` additions are agents, and the `!current.has(n)` guard prevents removing a live skill.

## Cross-file consistency (part A, item 4)

- Caps 3/3/5 agree across `SKILL.md:44,153,157`, `caller-status-handling.md:45`, the orchestrate skill (line 57) and the designing-architecture skill.
- Names and references resolve: record_human_approval, `PLAN:`/`PLAN_REVISION:`, partial includes (7 agents, 2 skills for plan-governance).
- No contradiction found between the manager, the architect and the reviewer about who writes the record: the architect writes it, only on `record_human_approval`; the manager runs the gate; the reviewer never evaluates approval.
- Delegated agents never ask the user (agent-modes line, precondition delegated branch, architect "never asks"). The one exception is a mis-templated first line, which falls back to interactive by design.
- Quick flow, `/tsh-debug`, audit and cost commands do not deadlock unless a plan path appears in the task text (W3). `/tsh-review-ui` correctly skips the gate and makes no code changes.
