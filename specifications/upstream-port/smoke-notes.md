# Upstream port smoke notes (Task S3.1)

Run on branch `port/upstream`, `claude` 2.1.308 in print mode (`-p --output-format stream-json --verbose`), scratch consumer installed with `node scripts/install.mjs --tools claude --scope project` (dry run first, `TSH_HOME` pointed at the scratch dir). 10 model runs. Fixture plans follow `plan.template.md`.

| # | Scenario | Expected | Result | Evidence |
|---|---|---|---|---|
| 1 | `/tsh-implement` plan with valid approval (rev 2 = rev 2, `2026-10-26T10:00:00Z`) | No second approval question, task routed to `tsh-plan-implementor`, file change appears | PASS | `Agent {"subagent_type":"tsh-plan-implementor", prompt "MODE: delegated / PLAN: ... / PLAN_REVISION: 2"}`; subagent "the plan has valid approval (APPROVED, revision 2, valid timestamp)"; `src/sub.js` and `src/sub.test.js` written, `npm test` 2/2; manager "reused the existing plan approval". No gate question. |
| 2 | `/tsh-implement` legacy plan without `## Human Approval` | Gate raised once with the three options (Approve plan / I have comments / Stop), no project file changed | PASS (with notes) | Run 1: manager asked to confirm the flow first (Quick vs Full), nothing changed. After "Full flow": plan review, architect revision (added Plan Revision and a PENDING `## Human Approval`), re-review, then "Plan approval gate ... Choose one: 1. Approve plan 2. I have comments 3. Stop". `git status`: only the plan, the plan-review file; no `src/` change. |
| 3 | Stale approval (Approved Revision 2, Plan Revision 3) | Gated, not executed | PASS | "Approval record: not valid. It approves revision 2, but the plan is at revision 3 ... I need a new approval before any file is changed." No `src/` change, no implementor call. |
| 4 | `/tsh-debug` small bug, no plan | No gate, fix delegated to software engineer | PASS | `Agent {"subagent_type":"tsh-software-engineer", prompt "MODE: delegated / CALLER: tsh-debug ..."}`; no approval question; `src/mul.js` `a + b` -> `a * b`, `npm test` passes. |
| 5 | `claude --agent tsh-plan-implementor`, task names a plan without valid approval | Refuses, offers options, no file change | PASS | "the plan revision is 3, but the Approved Revision is 2 ... I have four options: 1. Point me at the plan with a valid approval 2. Request approval through the implement command 3. Go back to the architect command 4. Stop". `git status` empty. |
| 6 | `/tsh-review-ui` with no dev server and no `playwright-cli` | Graceful stop, `VERIFICATION NOT RUN` or a question, never PASS | PASS (with notes) | Final trace: capture worker "playwright-cli is not installed ... STATUS: BLOCKED"; manager "Verdict: VERIFICATION NOT RUN ... This is not a pass", reviewer not delegated. Earlier runs stopped on a question (artifact dir not git-ignored) and on my own Bash allowlist denying the worker. |

Installed tree (`.claude` in the scratch project): 21 agents, 65 skills; every agent has `disallowedTools: [Agent]`; `tsh-ui-capture-worker` has no tool restriction beyond `Agent` (shell available, no figma mention outside the prose "you have no figma tool"); `tsh-ui-reviewer` disallows Agent, Write, Edit, NotebookEdit, Bash (read-only). All OK.

## Findings

No FAIL. Observations, none blocking:

1. The Claude Code render of `tsh-ui-capture-worker` has no tool allowlist, so "no figma MCP" is enforced only by the prose and by the absent `requires-mcp`. If a consumer configures a figma MCP server the worker inherits it. File if this should be hard: `scripts/generate.mjs` (Claude agent rendering) plus `src/agents/tsh-ui-capture-worker.md`.
2. Scenario 2: for a legacy plan the manager first asks the user to confirm the flow (Quick vs Full) and only then runs plan review, architect revision and the gate, so the gate appears several steps in. Scenario 3 skipped the flow question. Consistent with the design, but `src/skills/tsh-implement/SKILL.md` ("let the user confirm the choice") makes the flow question appear whenever a plan path is passed without approval; consider not asking when the argument is a plan path (Full flow is forced by `src/skills/tsh-engineering-manager/references/implementation-flows.md`).
3. Scenario 2: the architect's revision of a legacy plan added a `Plan Revision | 1` row to Task Details in addition to the Human Approval table. Harmless, but the template keeps Plan Revision only in `## Human Approval`.
4. Scenario 6: the capture worker refuses an unauthenticated capture when the artifact root is not git-ignored (rule from `tsh-verifying-ui` authenticated-capture). Intended for login captures; it also fires for plain captures. File: the `tsh-verifying-ui` capture-flow reference, if this should apply only to authenticated captures.
5. Print mode limits: a worker that needs a Bash pattern outside `--allowedTools` stops with `NEEDS_INPUT`/`BLOCKED`; this was a harness limit, not a product defect.

## Re-run on 8b67737

Fresh scratch consumer installed from the current checkout (21 agents, 65 skills), `claude` 2.1.308 print mode, 10 model runs. Scenarios 2, 3, 5, 6, 7 and e ran in parallel in one tree, so some traces show stray files created by the (e) run; the verdicts are unaffected.

| # | Scenario | Expected | Result | Evidence |
|---|---|---|---|---|
| 1 | Valid approval (2 = 2) | No second question, routed to `tsh-plan-implementor`, file change | PASS | "valid approval record (revision 2) ... reusing it without asking again"; `Agent subagent_type=tsh-plan-implementor` with `PLAN:` and `PLAN_REVISION: 2`; `src/sub.js`, `src/sub.test.js` written. The manager first ran a plan review (no report on disk). |
| 2 | Legacy plan, no `## Human Approval` | Gate reached once, no project file changed | PASS | Reviewer returned APPROVED for "revision 1 (implicit)" in one pass, no architect revision loop; gate "1. Approve plan 2. I have comments 3. Stop". No `src/` change before the answer. |
| 3 | Stale approval (2 vs 3) | Gated, not executed | PASS | "The existing approval record is stale ... I'm not reusing it", gate with 3 options, no implementor call. |
| 4 | `/tsh-debug`, no plan | No gate, software engineer fixes | PASS (see 7) | `Agent tsh-software-engineer` (`CALLER: tsh-debug`), no gate, `mul` fixed. |
| 5 | Direct `--agent tsh-plan-implementor` on stale plan | Refuses with options, no change | PASS | "approval record is not valid ... four options: 1. Point you at a plan ... 4. Stop"; no file changed. |
| 6 | `/tsh-review-ui`, no server, no `playwright-cli` | `VERIFICATION NOT RUN`, never PASS | PASS | "Verdict for add-page: VERIFICATION NOT RUN ... not a pass ... playwright-cli isn't installed"; reviewer not called. |
| 7 / a | `/tsh-debug` that mentions a plan file as read-only context | Not blocked | PASS | Delegated to `tsh-software-engineer` with no `PLAN:` line; fix applied; no approval gate. |
| b | Legacy plan reaches the gate; Plan Revision 1 recorded at the first gate | Gate, then record | PASS | Gate shown with "Plan Revision: 1 (implicit ...)". After "Approve plan": architect `TASK: record_human_approval` wrote `Plan Revision 1 / APPROVED / Approved Revision 1 / 2026-10-26T15:25:05Z`; implementor then ran. |
| c | "I have comments" with a non-material change | Gate re-asked | PASS | Second `--resume` turn: architect edited only the Task 1.1 description plus a Changelog row, classified non-material, "Approval gate (re-ask 1 of 3) ... Plan Revision: 1" with the three options. |
| d | `/tsh-implement <plan path>` | No Quick/Full question | PASS | Skill args "plan path given: Full flow, ask nothing"; no flow question in scenarios 1, 2 and 3. |
| e | Executor invoked directly with `PLAN:` and no `PLAN_REVISION:` | `BLOCKED` naming the missing line | FAIL (2 of 2 runs) | Prompt `MODE: delegated / PLAN: specifications/ok/ok.plan.md / TASK: Implement Task 1.1`. `tsh-plan-implementor` (haiku tier) answered "The approval is valid", wrote `src/sub.js` and `src/sub.test.js`, returned `STATUS: DONE`. |

### FAILs

- **e**: the rule exists in `src/partials/human-approval-precondition.md` ("A `PLAN:` line without `PLAN_REVISION:` is not valid: return BLOCKED"), but the fast-tier executor validated the approval record and skipped the header check. Probable cause: the header check is a sub-bullet inside "When it applies", after the model has already decided the plan is approved. Fix in `src/partials/human-approval-precondition.md` (make "check the task header first, before opening the plan" a numbered first step, with the BLOCKED text), then regenerate; if it persists, strengthen the top of `src/agents/tsh-plan-implementor.md`.
