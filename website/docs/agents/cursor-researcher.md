---
sidebar_position: 13
title: Cursor Researcher (internal)
---

# Cursor Researcher Agent

**File:** `.cursor/skills/agents/tsh-cursor-researcher/SKILL.md`
**Type:** Internal worker — not user-invocable

Research specialist that gathers, analyzes, and summarizes information from codebases and documentation for Cursor engineering tasks. Returns structured research summaries — read-only, does not create or modify files.

## Responsibilities

- Analyze codebase structure, existing agent/skill/prompt/instruction files, and workspace patterns.
- Fetch and summarize external documentation (Cursor docs, MCP server docs, best practices).
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

## Tool Access

| Tool | Usage |
|---|---|
| **read** | Examine specific files in detail after discovery |
| **search** | Discover patterns across files, locate artifacts by name or content |
| **web/fetch** | Fetch external documentation (Cursor docs, MCP server docs) |
| **Context7** | Library-specific documentation lookup, API specs, MCP server capabilities |

## Invocation

This agent is not directly invocable by users. It is delegated to by the [Cursor Orchestrator](./cursor-orchestrator) as part of multi-step customization workflows.
