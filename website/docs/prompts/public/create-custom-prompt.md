---
sidebar_position: 15
title: /tsh-create-custom-prompt
---

# /tsh-create-custom-prompt

**Agent:** Cursor Orchestrator  
**File:** `.cursor/skills/commands/tsh-create-custom-prompt/SKILL.md`

Creates a new custom prompt (`/SKILL.md`) for VS Code Copilot. Analyzes existing prompts for patterns, identifies the right agent to route to, creates the prompt file, and validates the workflow end-to-end.

## Usage

```text
/tsh-create-custom-prompt <prompt requirements or description>
```

## What It Does

1. **Research existing prompts** — Analyzes prompts in `.cursor/skills/commands/` for frontmatter format, body structure, skill reference format, and body size patterns.
2. **Research available agents** — Analyzes agents in `.cursor/skills/agents/` to determine the best routing target for the new prompt.
3. **Clarify requirements** — Determines the prompt's purpose, target workflow, and which agent should handle it.
4. **Create the prompt** — Delegates creation to the artifact creator worker. Ensures agent and model are specified following established patterns.
5. **Review and validate** — Delegates review to the artifact reviewer. Fixes issues if found.

## Skills Loaded

- `tsh-creating-prompts` — Prompt file creation workflow, templates, and validation checklist.
- `tsh-technical-context-discovering` — Discover project conventions and workspace patterns.
- `tsh-codebase-analysing` — Analyze existing prompts for structural patterns and routing conventions.

## Output

A prompt file in `.cursor/skills/commands/` with correct agent routing.

:::info Orchestrator Workflow
This command routes to the Cursor Orchestrator which handles the full research → create → review workflow automatically using specialized sub-agents.
:::
