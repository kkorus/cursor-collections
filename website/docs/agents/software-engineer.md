---
sidebar_position: 5
title: Software Engineer
---

# Software Engineer Agent

**Source:** `src/agents/tsh-software-engineer.md`  
**Kind:** subagent, model tier `deep`, read-write access

The Software Engineer agent implements **NON-UI** application code (backend, API, database, business logic) based on provided requirements and technical designs. It is the exception route for complex work: the [Plan Implementor](./plan-implementor) is the default executor for actionable, low-risk plan tasks, and rendered UI belongs to the [UI Engineer](./ui-engineer).

## Responsibilities

- Implementing code changes following the plan step by step.
- Writing clean, efficient, and maintainable code.
- Following best practices and coding standards.
- Adhering to security considerations and quality assurance guidelines from the plan.
- Reviewing own code to ensure it meets requirements.
- Communicating with the Architect when ambiguities arise.
- Handling plan tasks that fail the Engineering Manager's seam test, refactor-mode tasks and plan-less work such as `/tsh-debug` fixes.

## Key Behaviors

- **Strictly follows the plan** — Does not deviate unless explicitly instructed.
- **No dead code** — Does not create unused functions or future-only code.
- **No unnecessary files** — Focus on delivering required changes efficiently.
- **Well-documented** — Includes comments and documentation for future maintainability.
- **Does not broaden the task** — Does not invent details the plan does not contain.
- **Never wipes the working tree** — It follows the version control safety rules and does not discard changes it did not make.
- **Needs an approved plan for plan-based work** — Before any file change it validates the `## Human Approval` record of the plan. Work without a plan is not affected. See [Approval precondition](../workflow/standard-flow#approval-gate).

## Tool access

- **Read-write.**
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Sequential Thinking.

## Skills loaded

- `tsh-implement-task` (preloaded) - Implement a feature from a plan or a task description
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-analyzing-implementation-gaps` - Compare a plan with the current state to find implementation gaps
- `tsh-analyzing-codebase` - Analyze a codebase: dependencies, business logic, duplications
- `tsh-designing-databases` - SQL and database design: schemas, indexing, queries, ORMs
- `tsh-implementing-backend` - Backend patterns: APIs, auth, testing, integrations
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** `/tsh-debug` (the fix) and the `tsh-engineering-manager` (implementation tasks and fixes). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).

## Suggested next steps

The agent recommends these commands as text; it never starts them itself.

- `/tsh-review Review the implementation against the plan and feature context` after the implementation.
