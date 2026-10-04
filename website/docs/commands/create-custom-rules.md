---
sidebar_position: 16
title: /tsh-create-custom-rules
---

# /tsh-create-custom-rules

**Source:** `src/skills/tsh-create-custom-rules/SKILL.md`  
**Routes to:** [AI Customization Orchestrator](../agents/ai-customization-orchestrator) orchestrator skill (`tsh-ai-customization-orchestrator`)

Creates project instructions and scoped rules for Cursor, Claude Code and Codex. In a repository with a neutral source (`src/`) and a generator, it writes the source and regenerates the native files. In other projects it writes native files for the tools you use.

## Usage

```text
/tsh-create-custom-rules <conventions to encode or description>
```

## What it does

1. Loads the AI Customization Orchestrator with the governing skill `tsh-creating-rules`.
2. Researches existing artifacts in your project (naming, structure, conventions) with the Researcher subagent.
3. Clarifies the requirements with you: project-wide instructions versus scoped rules, per tool in use. If the project has no neutral source, it also asks which tools (Cursor, Claude Code, Codex) to target.
4. Creates the artifact with the Creator subagent and reviews it against the checklist of `tsh-creating-rules` with the Reviewer subagent. Must-fix findings go back to the Creator (at most 3 cycles).

## Output

`AGENTS.md` with the `CLAUDE.md` import, Cursor scoped rule files, Claude rule files or nested `AGENTS.md`, as needed, created and validated, with a short summary of what was created.

The orchestrator asks you whenever a design decision is unclear and never leaves manual edits to you. See [AI Customization Orchestrator](../agents/ai-customization-orchestrator).
