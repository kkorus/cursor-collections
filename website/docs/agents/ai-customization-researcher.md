---
sidebar_position: 13
title: AI Customization Researcher (internal)
---

# AI Customization Researcher Agent

**Source:** `src/agents/tsh-ai-customization-researcher.md`  
**Kind:** subagent, model tier `balanced`, read-only access

Research specialist that gathers and summarizes information about AI-customization artifacts (skills, commands, agents, project rules, MCP) and the Cursor, Claude Code and Codex documentation. Read-only; returns structured research summaries.

## Responsibilities

- Analyze codebase structure, existing agent/workflow/command skill and instruction files, and workspace patterns.
- Fetch and summarize external documentation (Cursor, Claude Code and Codex docs, MCP server docs, best practices).
- Identify patterns, conventions, and inconsistencies across multiple files.
- Return structured, concise findings organized by topic with file paths for traceability.

## Output Format

Every research response includes:

1. **Summary** — 2–3 sentences answering the research question directly.
2. **Key Findings** — Organized by topic with file paths.
3. **Patterns and Observations** — Cross-cutting patterns and notable conventions.
4. **Gaps or Ambiguities** — Areas that could not be found or are uncertain.

## Boundaries

- Does not create or modify any files.
- Does not make design decisions or propose implementations.
- Does not include raw file contents — always synthesizes and summarizes.

## Tool access

- **Read-only.** The agent cannot edit or create files, so it returns its results in the reply.
- **No shell.** Shell access is denied on Claude Code.
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7.

## Invocation and modes

- **Delegated by:** the `tsh-ai-customization-orchestrator` skill. In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
- **Read-only persona:** when run as a main-thread persona on Claude Code (`claude --agent`), the agent keeps its restrictions and cannot write files there either.
