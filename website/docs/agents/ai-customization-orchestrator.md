---
sidebar_position: 9
title: AI Customization Orchestrator
---

# AI Customization Orchestrator

**Source:** `src/skills/tsh-ai-customization-orchestrator/SKILL.md`  
**Kind:** orchestrator skill (runs in the main thread)

The AI Customization Orchestrator coordinates multi-step work on AI customization artifacts: skills, commands, agents and project rules, for Cursor, Claude Code and Codex. The four [`/tsh-create-custom-*`](../commands/overview) commands load it. It is an internal step, so you normally start it through one of those commands.

It decomposes the work into research, creation and review, delegates each to a subagent and validates every result. A quick mode handles a single small edit directly.

## Artifact types

| Artifact | Governing skill | Entry command |
|---|---|---|
| Skill (knowledge, command, internal step, orchestrator) | `tsh-creating-skills` | `/tsh-create-custom-skill` |
| Command | `tsh-creating-commands` | `/tsh-create-custom-command` |
| Agent (subagent) | `tsh-creating-agents` | `/tsh-create-custom-agent` |
| Project instructions and rules | `tsh-creating-rules` | `/tsh-create-custom-rules` |

In a repository with `src/skills/`, `src/agents/` and a generator, the artifacts are written to `src/` and the native files are generated. In other projects they are written as native files for the tools the project uses.

## How it works

Complex tasks degrade when one agent handles them in one long conversation. The orchestrator keeps only your conversation, the design decisions and summaries of the workers' output. Raw research stays in the workers' contexts.

1. **Clarify** the requirements with you.
2. **Research** with [`tsh-ai-customization-researcher`](./ai-customization-researcher): existing artifacts, tool documentation, patterns.
3. **Decide** the design in the orchestrator, then write a detailed specification.
4. **Create** with [`tsh-ai-customization-creator`](./ai-customization-creator), which applies the governing skill.
5. **Review** with [`tsh-ai-customization-reviewer`](./ai-customization-reviewer). Must-fix findings go back to the creator, with at most 3 create-review-fix cycles.

The workers run one at a time in this order and never delegate.

## Quick mode

The orchestrator edits a file itself only when the change is a single small edit in one existing artifact (a typo, a wording fix, one frontmatter field, one renamed reference), with no design question, and you asked for exactly that edit. In a repository with a generator it then runs `npm run generate && npm run check`. If the edit grows, it switches to the full workflow.

## Key principles

- **Context is precious.** Raw research output stays with the workers.
- **Delegate execution, retain judgment.** The orchestrator makes the design decisions. Workers research, write and review.
- **The prompt is the interface.** A worker sees only its delegation prompt, which lists the exact files to read.
- Every created artifact gets at least one review pass before you see it.
- Generated files are never edited by hand.

## Workers

| Worker | Tier | Access | Delegated when |
|---|---|---|---|
| [`tsh-ai-customization-researcher`](./ai-customization-researcher) | balanced | read-only | The task needs the state of existing artifacts, tool documentation or patterns |
| [`tsh-ai-customization-creator`](./ai-customization-creator) | fast | read-write | A file must be created or modified and the design is decided |
| [`tsh-ai-customization-reviewer`](./ai-customization-reviewer) | deep | read-only | A new or existing artifact needs validation |
