---
sidebar_position: 13
title: /tsh-create-custom-agent
---

# /tsh-create-custom-agent

**Agent:** Cursor Orchestrator  
**File:** `.cursor/skills/commands/tsh-create-custom-agent/SKILL.md`

Creates a new custom agent (`SKILL.md`) for VS Code Copilot. Analyzes existing agents for patterns, guides through design decisions, creates the agent file, and validates against best practices.

## Usage

```text
/tsh-create-custom-agent <agent requirements or description>
```

## What It Does

1. **Research existing agents** — Analyzes agents in `.cursor/skills/agents/` for naming conventions, structural patterns, tool configurations, and skill references.
2. **Clarify requirements** — Determines the agent's purpose, responsibilities, target workflows, and tool needs with the user.
3. **Design the agent** — Makes design decisions based on research findings and user input: agent name, description, personality, tool list, and skill references.
4. **Create the agent** — Delegates creation to the artifact creator worker.
5. **Review and validate** — Delegates review to the artifact reviewer. Fixes issues if found.

## Skills Loaded

- `tsh-creating-agents` — Agent file creation workflow, templates, and validation checklist.
- `tsh-technical-context-discovering` — Discover project conventions and workspace patterns.
- `tsh-codebase-analysing` — Analyze existing agents for structural patterns.

## Output

A new agent file in `.cursor/skills/agents/` following workspace conventions.

:::info Orchestrator Workflow
This command routes to the Cursor Orchestrator which handles the full research → create → review workflow automatically using specialized sub-agents.
:::
