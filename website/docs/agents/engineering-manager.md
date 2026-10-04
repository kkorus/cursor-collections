---
sidebar_position: 4
title: Engineering Manager
---

# Engineering Manager (orchestrator)

**Source:** `src/skills/tsh-engineering-manager/SKILL.md`  
**Kind:** orchestrator skill (runs in the main thread)

The Engineering Manager is an orchestrator skill, not a subagent. [`/tsh-implement`](../commands/implement) and [`/tsh-refactor`](../commands/refactor) load it in the main conversation, so it can ask you questions at every phase gate. It does not write code. It decides what happens next, delegates each step to a subagent with full context, checks the result and keeps the plan up to date.

Because subagents start with a clean context, every delegation names the input files by explicit path and starts with `MODE: delegated`. Each subagent answers with a `STATUS` block (`DONE`, `NEEDS_INPUT`, `NEEDS_ARCHITECT_DECISION` or `BLOCKED`). The manager asks you the questions of a `NEEDS_INPUT` status and delegates again with your answers. Delegation goes one level deep: the subagents never delegate further.

## Flows

The manager recommends a flow and lets you confirm or override it.

| Flow | When | Steps |
|---|---|---|
| **Quick** | Bug fixes, small self-contained features, config changes, added tests | Implement, quality checks, code review in diff mode (no plan file) |
| **Full** | Multi-component features, unclear requirements, architectural changes, UI work with Figma | Research, plan, plan review, implementation per task, UI verification, E2E tests, code review |
| **Refactor** | Entered from `/tsh-refactor`; behavior must not change | Plan with `Behavior-preserving: yes`, characterization tests first, atomic steps, review (uses the `tsh-refactoring` skill) |

Before moving between research, planning and implementation, the manager asks you to confirm.

## Delegation

| Subagent | Handles | When |
|---|---|---|
| [Context Engineer](./context-engineer) | Requirements and context (research file) | The task lacks the information needed for a plan |
| [Architect](./architect) | Plan, plan revisions, technical context, architecture decisions | The plan is missing, incomplete or needs revision |
| [Plan Reviewer](./plan-reviewer) | Plan stress-test | After every new or updated plan in the Full flow |
| [Software Engineer](./software-engineer) | Application code, bug fixes | A task changes backend, API, database or frontend code |
| [E2E Engineer](./e2e-engineer) | End-to-end tests | The plan has E2E test tasks |
| [DevOps Engineer](./devops-engineer) | Infrastructure, CI/CD, observability, secrets | A task changes infrastructure (uses `tsh-delivering-infrastructure`) |
| [Prompt Engineer](./prompt-engineer) | LLM application prompts | The plan contains prompt work |
| [UI Reviewer](./ui-reviewer) | Figma verification | After each UI task with a Figma reference, through [`tsh-orchestrate-ui-verification`](../commands/internal/orchestrate-ui-verification) |
| [Code Reviewer](./code-reviewer) | Final review | After implementation and the UI gate, or when the plan defines no review phase |

## Loops the manager owns

- **Plan review** (maximum 3 iterations): the Plan Reviewer returns `APPROVED` or `REVISIONS NEEDED`. On `REVISIONS NEEDED` the Architect must resolve every BLOCKER, then the plan is reviewed again. After 3 iterations, or with unresolved BLOCKERs, the manager stops and lets you decide.
- **Implementation to review**: tasks run in plan order with one todo per task. After each code task the manager runs static analysis, the build and the tests. After the review, `critical` and `warning` findings go to you before anything changes.
- **UI verification**: implement, verify, fix, with at most 5 iterations per component. See [`tsh-orchestrate-ui-verification`](../commands/internal/orchestrate-ui-verification).

## Artifacts

The manager owns the artifact naming. `<specs>` is `specifications/` unless the project instructions say otherwise.

| Artifact | Path |
|---|---|
| Research | `<specs>/<task>/<task>.research.md` |
| Plan | `<specs>/<task>/<task>.plan.md` |
| Plan review | `<specs>/<task>/<task>.plan-review.md` |

## Tool access

- **Atlassian** - only when you give a Jira key or a Confluence page.
- **Sequential Thinking** - when the delegate choice or the sequencing is not obvious.
- The manager edits only the plan (checkboxes, Changelog). Everything else goes through subagents.

## Suggested next steps

After the review, the manager offers `/tsh-review` for a repeat review, `/tsh-commit` to commit the work and `/tsh-audit-codebase` for a wider quality audit.
