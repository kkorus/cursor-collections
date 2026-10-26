---
sidebar_position: 4
title: /tsh-implement
---

# /tsh-implement

**Source:** `src/skills/tsh-implement/SKILL.md`  
**Routes to:** [Engineering Manager](../agents/engineering-manager) orchestrator skill (`tsh-engineering-manager`), runs in the main thread

Implements a feature from a plan, a Jira ticket or a plain description. The command only loads the Engineering Manager and recommends a flow; the manager does the work.

## Usage

```text
/tsh-implement <task-id | plan path | description>
```

## What it does

1. Recommends the **Quick flow** for small, obvious changes or the **Full flow** for multi-component, unclear or UI work, and lets you confirm the choice.
2. **Quick flow:** delegates the task to the Software Engineer (or the UI Engineer for UI work), runs the quality checks and delegates a review of the current diff to the Code Reviewer. No plan file is produced and no approval gate applies.
3. **Full flow:**
   - Checks what already exists (research, plan, plan review). Delegates research to the Context Engineer and the plan to the Architect if they are missing.
   - Runs the plan review with the Plan Reviewer (maximum 3 iterations), then opens the one approval gate: `Approve plan`, `I have comments` or `Stop`. The answer is recorded in the plan by the Architect, and executors will not change files without a valid record.
   - Creates a todo for every task and processes the tasks in plan order, delegating by task type.
   - After each task, updates the plan checkboxes and runs static analysis, the build and the tests.
   - Verifies UI tasks with a Figma reference through [`tsh-orchestrate-ui-verification`](./internal/orchestrate-ui-verification) (capture, then review, then fix, per iteration), writes E2E tests, then delegates the final review.
4. Asks you before deviating from the plan and records every change in the plan's Changelog.

For plan-based work the approval gate is the single point where you authorize implementation; a material change to the plan later asks again. See the [Engineering Manager](../agents/engineering-manager) page for the delegation table.

## Delegation

| Task type | Subagent |
|---|---|
| Research | [Context Engineer](../agents/context-engineer) |
| Plan and architecture decisions | [Architect](../agents/architect) |
| Plan validation | [Plan Reviewer](../agents/plan-reviewer) |
| Non-UI application code, actionable low-risk tasks (default) | [Plan Implementor](../agents/plan-implementor) |
| Complex or exceptional non-UI code, refactor tasks | [Software Engineer](../agents/software-engineer) |
| UI code and UI fixes (any rendered-UI change) | [UI Engineer](../agents/ui-engineer) |
| E2E tests | [E2E Engineer](../agents/e2e-engineer) |
| Kubernetes, Terraform, CI/CD, observability | [DevOps Engineer](../agents/devops-engineer) |
| LLM application prompts | [Prompt Engineer](../agents/prompt-engineer) |
| Documentation (README, CHANGELOG, docs site) | [Technical Writer](../agents/technical-writer) |
| UI capture | [UI Capture Worker](../agents/ui-capture-worker) |
| UI verification | [UI Reviewer](../agents/ui-reviewer) |
| Final review | [Code Reviewer](../agents/code-reviewer) |

## Input

A Jira ticket ID (`/tsh-implement PROJ-123`), a path to a research file (`*.research.md`) or a plan (`*.plan.md`), or a free-form description (`/tsh-implement Add pagination to the user list API`). Jira and Confluence are read only when you give a key or a page.

## Output

- Code changes made by the delegated subagents.
- Research, plan and plan-review files in `specifications/<task>/` (Full flow).
- Updated plan checkboxes and Changelog entries.
- The findings of the final code review.
