---
sidebar_position: 5
title: Software Engineer
---

# Software Engineer Agent

**Source:** `src/agents/tsh-software-engineer.md`  
**Kind:** subagent, model tier `deep`, read-write access

The Software Engineer agent implements software solutions based on provided requirements and technical designs. It executes against implementation plans created by the Architect.

## Responsibilities

- Implementing code changes following the plan step by step.
- Writing clean, efficient, and maintainable code.
- Following best practices and coding standards.
- Adhering to security considerations and quality assurance guidelines from the plan.
- Reviewing own code to ensure it meets requirements.
- Communicating with the Architect when ambiguities arise.

## Key Behaviors

- **Strictly follows the plan** — Does not deviate unless explicitly instructed.
- **No dead code** — Does not create unused functions or future-only code.
- **No unnecessary files** — Focus on delivering required changes efficiently.
- **Well-documented** — Includes comments and documentation for future maintainability.

## Tool access

- **Read-write.**
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Figma, Playwright, Sequential Thinking.

## Skills loaded

- `tsh-implement-task` (preloaded) - Implement a feature from a plan or a task description
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-analyzing-implementation-gaps` - Compare a plan with the current state to find implementation gaps
- `tsh-analyzing-codebase` - Analyze a codebase: dependencies, business logic, duplications
- `tsh-designing-databases` - SQL and database design: schemas, indexing, queries, ORMs
- `tsh-implementing-frontend` - Frontend components, design tokens and Figma-to-code
- `tsh-implementing-forms` - Form architecture, validation and accessible patterns
- `tsh-writing-hooks` - Custom React hook patterns
- `tsh-ensuring-accessibility` - WCAG accessibility: semantic HTML, ARIA, keyboard, contrast
- `tsh-optimizing-frontend` - Frontend rendering, bundle and memory optimization
- `tsh-verifying-ui` - UI verification criteria and report format against Figma
- `tsh-implementing-backend` - Backend patterns: APIs, auth, testing, integrations
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** `/tsh-debug` (the fix) and the `tsh-engineering-manager` (implementation tasks and fixes). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).

## Suggested next steps

The agent recommends these commands as text; it never starts them itself.

- `/tsh-review Review the implementation against the plan and feature context` after the implementation.
