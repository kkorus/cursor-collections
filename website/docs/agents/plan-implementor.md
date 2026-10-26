---
sidebar_position: 15
title: Plan Implementor
---

# Plan Implementor Agent

**Source:** `src/agents/tsh-plan-implementor.md`  
**Kind:** subagent, model tier `fast`, read-write access

The Plan Implementor is a strict single-task worker. It executes exactly one delegated plan task as written and does not broaden scope. It is the **default executor** for non-UI plan tasks that are actionable, low-risk seams: the task lists its files, has a runnable definition of done and a stop rule, has no open question, and involves no new architecture decision. Tasks that fail that test go to the [Software Engineer](./software-engineer).

## Responsibilities

- Execute one delegated plan task at a time, never later phases.
- Follow the plan literally. If the request looks mistaken, say so briefly and continue as written.
- Stay inside the `Files` listed by the task; invent no seams, fallbacks or extra files.
- Stop when a seam is missing or the task is ambiguous, instead of guessing.
- Update plan checkboxes only for the delegated scope.

## Approved plan precondition

For plan-based work, the agent validates the plan's `## Human Approval` record before it changes any file: the decision must be `APPROVED`, the approved revision must equal the current `Plan Revision`, and the decision timestamp must be valid. Without a valid record it does not start: in interactive mode it offers you the options (point it at the right plan, request approval through `/tsh-implement`, go back to `/tsh-architect`, or stop) and never records an approval itself; in delegated mode it returns `BLOCKED` and names the failed field or condition. Work without a plan is not affected. See the [approval gate](../workflow/standard-flow#approval-gate).

## Statuses

In delegated mode the agent ends its reply with a `STATUS` block.

| Status | Meaning |
|---|---|
| `DONE` | The task is implemented and its definition of done was checked |
| `NEEDS_ARCHITECT_DECISION` | The task is ambiguous or a seam is missing; the manager routes the question to the Architect |
| `NEEDS_INPUT` | The task needs input only you have |
| `BLOCKED` | The approval record is invalid, or a version control conflict stops the work |

If the agent returns `NEEDS_ARCHITECT_DECISION` twice for the same task, the Engineering Manager re-routes that task to the Software Engineer.

## Non-goals

- No UI work: rendered UI belongs to the [UI Engineer](./ui-engineer).
- No plan rewriting, task expansion or adjacent follow-on fixes.
- It never discards, reverts, stashes or cleans changes it did not make. It treats the working tree as intentional and reports a conflict instead.

## Tool access

- **Read-write**, with shell access.
- **Leaf agent.** It never delegates to other agents.
- **No MCP servers required.**

## Skills loaded

- `tsh-implement-task` (preloaded) - Implement a feature from a plan or a task description
- `tsh-discovering-technical-context` - Confirm plan context and repository conventions before editing
- `tsh-analyzing-implementation-gaps` - Verify which seams already exist and which still need work
- `tsh-analyzing-codebase` - Understand the existing patterns around the delegated task

## Invocation and modes

- **Delegated by:** the `tsh-engineering-manager`, one plan task per delegation. The task starts with `MODE: delegated`, followed by the `PLAN:` and `PLAN_REVISION:` lines.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
