# Implementation Flows

## Quick flow

The Quick flow carries no approval gate and no `PLAN:` lines.

1. **Implement**: delegate to `tsh-software-engineer` (or `tsh-ui-engineer` for UI work) with the task description and any context. There is no plan file.
2. **Quality checks**: run static analysis, the build and the tests.
3. **Review**: delegate `tsh-code-reviewer` in diff mode (no plan). It runs all quality gates.
4. **Fixes**: before changing the original solution because of review findings, ask the user for confirmation.

## Full flow

`/tsh-implement` with a plan path always uses the Full flow.

1. **Assess the state**: check what already exists (research, plan, review). If information is missing, delegate `tsh-context-engineer`. If the plan is missing, delegate `tsh-architect`. Read the plan's `## Human Approval` section too (see [plan-approval.md](plan-approval.md)).
2. **Validate the plan**: run the plan review loop from the main instructions (maximum 3 iterations). Proceed only once the plan is `APPROVED`.
3. **Analyze the plan**: read the plan and research. Identify every task, its type (`[CREATE]`, `[MODIFY]`, `[REUSE]`) and the agent that should handle it. Create a todo for every task, not one per phase. List the UI tasks with Figma references separately; the `tsh-orchestrate-ui-verification` skill handles them.
4. **Technical context**: if the plan has no populated Technical Context section, delegate `tsh-architect` to establish it with the `tsh-discovering-technical-context` skill.
5. **Approval gate**: run the formal gate from [plan-approval.md](plan-approval.md). It replaces any informal confirmation; no file changes before a valid approval is recorded.
6. **Process the tasks in plan order**:
   - `[CREATE]` or `[MODIFY]`: delegate to the specialist chosen by [task-routing.md](task-routing.md), with `PLAN:` and `PLAN_REVISION:` lines. Run quality checks afterwards.
   - `[REUSE]` UI verification tasks: never skip them. Follow the `tsh-orchestrate-ui-verification` skill.
   - Other `[REUSE]` tasks: do what the task says.
7. **After each task**: confirm the plan was updated, compare the result with the plan and research, run static analysis, the build and the unit and integration tests.
8. **UI gate**: UI tasks run `tsh-orchestrate-ui-verification`; its UI gate must be satisfied before the code review phase. Report the UI verification and the code review separately.
9. **E2E then review**: delegate E2E tasks to `tsh-e2e-engineer`, then delegate `tsh-code-reviewer` (with the plan).
10. **Review fixes**: classify each fix against the plan. A non-material change needs no re-approval. A material change runs the revision handling in [plan-approval.md](plan-approval.md).
11. **Changes during the work**: ask the user before changing the original solution and record each change in the plan's Changelog with a timestamp.

## Refactor mode details

- The plan states `Behavior-preserving: yes` in Task Details, so plan review and code review tooling works on it unchanged.
- Order inside the plan: establish characterization tests first, refactor in small steps, run the tests after each step.
- Any behavior change discovered on the way is a finding, not part of the refactor: return to the user before continuing.
- The code review checks that no public behavior, contract or data shape changed.

## Rules that apply to every flow

- Never let a delegate write to a path you did not give it.
- One delegation level: delegates never delegate; route everything through this skill.
- Status handling and re-delegation follow the included status section, with the 3-iteration cap per agent per task. The plan review loop keeps its own cap.
