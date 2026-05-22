---
sidebar_position: 15
title: /tsh-create-custom-command
---

# /tsh-create-custom-command

**Agent:** Cursor Orchestrator  
**File:** `.cursor/skills/commands/tsh-create-custom-command/SKILL.md`

Creates a new Cursor slash command (`.cursor/skills/commands/<name>/SKILL.md`). Analyzes existing commands and agents, identifies routing, creates the skill file, and validates the workflow end-to-end.

## Usage

```text
/tsh-create-custom-command <command requirements or description>
```

## What It Does

1. **Research existing commands** — Analyzes commands in `.cursor/skills/commands/` for frontmatter, body structure, and skill references.
2. **Research available agents** — Determines the best agent routing target from `.cursor/skills/agents/`.
3. **Clarify requirements** — Confirms purpose, workflow, required skills, and routing with the user.
4. **Create the command** — Delegates creation to the artifact creator worker with `disable-model-invocation: true`.
5. **Review and validate** — Delegates review to the artifact reviewer.

## Skills Loaded

- `tsh-creating-commands` — Command skill creation workflow, templates, and validation checklist.
- `tsh-technical-context-discovering` — Discover project conventions and workspace patterns.
- `tsh-codebase-analysing` — Analyze existing commands for structural patterns.

## Output

A command skill in `.cursor/skills/commands/<name>/SKILL.md` with correct agent routing and workflow references.

:::info Orchestrator Workflow
This command routes to the Cursor Orchestrator which handles the full research → create → review workflow automatically using specialized sub-agents.
:::
