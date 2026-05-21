---
sidebar_position: 16
title: /tsh-create-custom-instructions
---

# /tsh-create-custom-instructions

**Agent:** Cursor Orchestrator  
**File:** `.cursor/skills/commands/tsh-create-custom-instructions/SKILL.md`

Creates custom instructions (`.rules.mdc` or `cursor-rules.mdc`) for VS Code Copilot. Helps decide between repository-level and file-scoped instructions, analyzes existing project conventions, and creates the instructions file.

## Usage

```text
/tsh-create-custom-instructions <conventions or requirements to encode>
```

## What It Does

1. **Research workspace conventions** — Analyzes the workspace for existing coding standards, project structure, technology stack, and any existing instruction files.
2. **Determine instruction type** — Helps choose between:
   - **Repository-level** (`cursor-rules.mdc`) — applies to all Copilot interactions in the workspace.
   - **File-scoped** (`.rules.mdc` with `applyTo` glob patterns) — applies only to interactions involving matching files.
3. **Clarify requirements** — Determines what coding standards, framework-specific patterns, or behavioral guidelines to encode.
4. **Create the instructions** — Delegates creation to the artifact creator worker.
5. **Review and validate** — Delegates review to the artifact reviewer. Fixes issues if found.

## Skills Loaded

- `tsh-creating-instructions` — Instructions file creation workflow, type selection, scope decisions, and validation checklist.
- `tsh-technical-context-discovering` — Discover project conventions and workspace patterns.
- `tsh-codebase-analysing` — Analyze workspace for existing coding conventions and patterns.

## Output

An instructions file with appropriate scope and content.

:::info Orchestrator Workflow
This command routes to the Cursor Orchestrator which handles the full research → create → review workflow automatically using specialized sub-agents.
:::
