---
sidebar_position: 16
title: /tsh-create-custom-rules
---

# /tsh-create-custom-rules

**Agent:** Cursor Orchestrator  
**File:** `.cursor/skills/commands/tsh-create-custom-rules/SKILL.md`

Creates custom Cursor rules: repository-level `cursor-instructions.md` or file-scoped `.mdc` rules with `globs` patterns in `.cursor/rules/`.

## Usage

```text
/tsh-create-custom-rules <conventions or requirements to encode>
```

## What It Does

1. **Research workspace conventions** — Analyzes existing standards, project structure, and any rule files.
2. **Determine rule type** — Chooses between repo-level (`cursor-instructions.md`) and file-scoped (`.mdc` with `globs`).
3. **Clarify requirements** — Captures coding standards, framework patterns, and behavioral guidelines to encode.
4. **Create the rules** — Delegates creation to the artifact creator worker.
5. **Review and validate** — Verifies scope, `globs` patterns, and clarity.

## Skills Loaded

- `tsh-creating-rules` — Rules file creation workflow, type selection, and validation checklist.
- `tsh-technical-context-discovering` — Discover project conventions and workspace patterns.
- `tsh-codebase-analysing` — Analyze workspace for existing coding conventions.

## Output

Rule files under `.cursor/rules/` following Cursor conventions.

:::info Orchestrator Workflow
This command routes to the Cursor Orchestrator which handles the full research → create → review workflow automatically using specialized sub-agents.
:::
