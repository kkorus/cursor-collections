---
sidebar_position: 18
title: Creating Commands
---

# Creating Commands

**Folder:** `.cursor/skills/workflows/tsh-creating-commands/`  
**Used by:** Cursor Engineer

Provides templates, guidelines, and a structured process for building Cursor **slash command** skills (`.cursor/skills/commands/<name>/SKILL.md`).

## Core Design Principles

- **Separation of concerns** — A command defines WHAT workflow to run. It must NOT define WHO the agent is (agent territory) or embed reusable domain knowledge (workflow skill territory).
- **Explicit entry point** — Commands use `disable-model-invocation: true` so they appear in `/` and do not auto-trigger from context alone.
- **Minimal duplication** — Commands reference agents and workflow skills; they do not duplicate their content.

## Command Skill Structure

| Section | Purpose |
|---|---|
| **YAML Frontmatter** | `name`, `description`, `disable-model-invocation: true` |
| **Agent routing** | "Load and follow the `tsh-<agent>` agent skill" |
| **Required Skills** | Workflow skills to load, with rationale |
| **Workflow** | Numbered steps for the entry-point workflow |
| **Constraints / Connected Skills** | Optional boundaries and related skills |

## Template

Use [`command.template.md`](https://github.com/kkorus/cursor-collections/blob/main/.cursor/skills/workflows/tsh-creating-commands/command.template.md) in the repository (not the deprecated `prompt.template.md`).

## Key Guidelines

- Every command must set `disable-model-invocation: true`
- `name` must match the directory name (including `tsh-` prefix in this repo)
- Route to an existing agent — do not embed agent persona in the command body
- Do not embed coding standards (use `.cursor/rules/`)

## Validation Checklist

- Valid YAML frontmatter with `name`, `description`, `disable-model-invocation: true`
- All referenced workflow skills exist under `.cursor/skills/workflows/`
- No domain knowledge duplicated from workflow skills
- Workflow steps are numbered and actionable
- Distinct from existing commands

## Connected Skills

- `tsh-creating-agents` — When the command needs a new agent
- `tsh-creating-skills` — General skill creation conventions
- `tsh-creating-rules` — When the command should reference rules instead of duplicating standards
