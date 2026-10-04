---
sidebar_position: 15
title: /tsh-create-custom-command
---

# /tsh-create-custom-command

**Source:** `src/skills/tsh-create-custom-command/SKILL.md`  
**Routes to:** [AI Customization Orchestrator](../agents/ai-customization-orchestrator) orchestrator skill (`tsh-ai-customization-orchestrator`)

Creates a new slash command (a skill of type command with a route to an agent or orchestrator) for Cursor, Claude Code and Codex. In a repository with a neutral source (`src/`) and a generator, it writes the source and regenerates the native files. In other projects it writes native files for the tools you use.

## Usage

```text
/tsh-create-custom-command <command purpose or description>
```

## What it does

1. Loads the AI Customization Orchestrator with the governing skill `tsh-creating-commands`.
2. Researches existing artifacts in your project (naming, structure, conventions) with the Researcher subagent.
3. Clarifies the requirements with you: purpose and the agent or orchestrator it routes to. If the project has no neutral source, it also asks which tools (Cursor, Claude Code, Codex) to target.
4. Creates the artifact with the Creator subagent and reviews it against the checklist of `tsh-creating-commands` with the Reviewer subagent. Must-fix findings go back to the Creator (at most 3 cycles).

## Output

The command skill, created and validated, with a short summary of what was created.

The orchestrator asks you whenever a design decision is unclear and never leaves manual edits to you. See [AI Customization Orchestrator](../agents/ai-customization-orchestrator).
