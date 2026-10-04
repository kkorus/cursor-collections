---
sidebar_position: 13
title: /tsh-create-custom-agent
---

# /tsh-create-custom-agent

**Source:** `src/skills/tsh-create-custom-agent/SKILL.md`  
**Routes to:** [AI Customization Orchestrator](../agents/ai-customization-orchestrator) orchestrator skill (`tsh-ai-customization-orchestrator`)

Creates a new custom agent (subagent) for Cursor, Claude Code and Codex. In a repository with a neutral source (`src/`) and a generator, it writes the source and regenerates the native files. In other projects it writes native files for the tools you use.

## Usage

```text
/tsh-create-custom-agent <agent role or description>
```

## What it does

1. Loads the AI Customization Orchestrator with the governing skill `tsh-creating-agents`.
2. Researches existing artifacts in your project (naming, structure, conventions) with the Researcher subagent.
3. Clarifies the requirements with you: purpose, access level, model tier, MCP servers and skills to load. If the project has no neutral source, it also asks which tools (Cursor, Claude Code, Codex) to target.
4. Creates the artifact with the Creator subagent and reviews it against the checklist of `tsh-creating-agents` with the Reviewer subagent. Must-fix findings go back to the Creator (at most 3 cycles).

## Output

The agent file (or files) for the tools you use, created and validated, with a short summary of what was created.

The orchestrator asks you whenever a design decision is unclear and never leaves manual edits to you. See [AI Customization Orchestrator](../agents/ai-customization-orchestrator).
