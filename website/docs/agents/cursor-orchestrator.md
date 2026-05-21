---
sidebar_position: 9
title: Cursor Orchestrator
---

# Cursor Orchestrator Agent *(experimental)*

**File:** `.cursor/skills/agents/tsh-cursor-orchestrator/SKILL.md`

The Cursor Orchestrator coordinates complex, multi-step Cursor customization tasks using specialized sub-agents. It decomposes work into focused subtasks, delegates to workers, and synthesizes results.

## When to Use

Use the Orchestrator **instead of** the Cursor Engineer when the task involves:

- Creating an agent from scratch (requires research → design → create → review).
- Auditing all customization artifacts for consistency.
- Designing multi-agent systems.
- Any task that spans multiple phases of research, creation, and review.

For simple and medium tasks, the [Cursor Engineer](./cursor-engineer) may produce better results.

## How It Works

The Orchestrator solves the "context rot" problem — complex tasks degrade quality when handled by a single agent in one long conversation. Instead, it delegates to three specialized workers, each running in an isolated context window:

1. **Cursor Researcher** (`tsh-cursor-researcher`) — Analyzes existing codebase state, reads documentation, extracts patterns.
2. **Cursor Artifact Creator** (`tsh-cursor-artifact-creator`) — Creates or modifies files based on fully specified requirements.
3. **Cursor Artifact Reviewer** (`tsh-cursor-artifact-reviewer`) — Validates quality, consistency, and best practices.

The standard flow is: **Research → Design decisions → Create → Review → Fix (if needed)**.

## Key Principles

- **Context is precious** — The orchestrator's context contains only user interactions, design decisions, and synthesized summaries. Raw research output stays in worker contexts.
- **Delegate execution, retain judgment** — The orchestrator makes design decisions. Workers execute. Output is always validated.
- **Prompt is the interface** — Workers receive only the delegation prompt, no conversation history. Quality depends entirely on prompt clarity.

## Tool Access

| Tool | Usage |
|---|---|
| **Sequential Thinking** | Decompose complex tasks, evaluate design trade-offs |
| **File Read/Search** | Read and search workspace files for context |
| **Sub-agents** | Delegate to specialized worker agents (researcher, creator, reviewer) |
| **Todo** | Track orchestration progress with structured checklists |

## Sub-Agents

| Worker | When Delegated |
|---|---|
| `tsh-cursor-researcher` | Analyzing existing files, extracting patterns, reading docs |
| `tsh-cursor-artifact-creator` | Creating or modifying customization files |
| `tsh-cursor-artifact-reviewer` | Validating quality and consistency of artifacts |
| `tsh-cursor-engineer` | Moderately complex subtasks that don't decompose cleanly |

## Delegation Flow

```
User Request
    │
    ▼
┌──────────────────┐
│   Orchestrator    │ ← Design decisions live here
└──────┬───────────┘
       │
  ┌────┼────────────────┐
  ▼    ▼                ▼
Research  →  Create  →  Review
  │           │           │
  └───────────┴───────────┘
       │
       ▼
  Synthesized Results → User
```
