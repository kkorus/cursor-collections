---
sidebar_position: 3
title: Context Engineer
---

# Context Engineer Agent

**Source:** `src/agents/tsh-context-engineer.md`  
**Kind:** subagent, model tier `deep`, read-write access

The Context Engineer agent specializes in gathering requirements, analyzing processes, and building detailed context for development tasks.

## Responsibilities

- Gathering all information related to a task from the codebase, Jira, Confluence, Figma, and other sources.
- Analyzing the task thoroughly, including parent tasks and subtasks.
- Checking external links and Confluence pages linked to the task.
- Reviewing Figma designs when linked to the task.
- Identifying ambiguities and missing information, asking for clarification.
- Exploring industry standards and domain-specific best practices.

## What It Produces

A `.research.md` document containing:

- **Task summary** — Clear description of what needs to be done.
- **Requirements and acceptance criteria** — Detailed functional requirements.
- **User stories and key flows** — How users interact with the feature.
- **Assumptions** — What the agent assumed based on available information.
- **Open questions** — Unresolved ambiguities that need stakeholder input.
- **Suggested next steps** — Recommendations for the planning phase.

## What It Does NOT Do

- Does not provide implementation details or technical specifications.
- Does not create implementation plans, deployment plans, or test plans.
- These are provided by the Architect in the next phase.

## Tool access

- **Read-write.**
- **No shell.** Shell access is denied on Claude Code.
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Atlassian, Figma, PDF Reader, Sequential Thinking.

## Skills loaded

- `tsh-analyzing-requirements` (preloaded) - Analyze a task and build its context and research document
- `tsh-analyzing-codebase` - Analyze a codebase: dependencies, business logic, duplications
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** the `tsh-engineering-manager` (research phase). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).

## Suggested next steps

The agent recommends these commands as text; it never starts them itself.

- `/tsh-implement Start implementation for the current task` once the context is gathered.
