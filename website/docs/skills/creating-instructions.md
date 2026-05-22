---
sidebar_position: 19
title: Creating Instructions
---

# Creating Instructions

**Folder:** `.cursor/skills/workflows/tsh-creating-instructions/`
**Used by:** Cursor Engineer

Covers repository-level instructions (`cursor-instructions.md`) and granular file-based rules with `globs` patterns. Provides templates and a decision framework for rules vs. skill placement.

## Instruction Types

| Aspect | Repository-level | Granular custom |
|---|---|---|
| **File** | `.cursor/rules/cursor-instructions.md` | `*.mdc rules` |
| **Count per repo** | Exactly one | Multiple |
| **Frontmatter** | Not required | Recommended (`globs`, `name`, `description`) |
| **Applied when** | Every Cursor Agent interaction | Files matching `globs` pattern are in context |
| **Location** | `.cursor/rules/cursor-instructions.md` | `.cursor/rules/` folder |
| **Purpose** | Project constitution — architecture, stack, fundamental rules | Scoped conventions — file-type or domain-specific rules |

## Decision Framework: Instructions vs. Skills

| Content Type | Belongs In |
|---|---|
| Always-applied project conventions | Instructions |
| File-type-specific coding standards | Granular rules with `globs` |
| Reusable multi-step workflows | Skills |
| Domain-specific knowledge and templates | Skills |
| Workflow triggers and task definitions | Prompts |

## Key Guidelines

- Repository-level instructions are the "constitution" — the first file any developer or AI agent should read.
- Granular rules use `globs` patterns to apply when matching files are in context.
- Instructions must NOT trigger workflows (prompt territory) or define agent behavior (agent territory).

## Validation Checklist

- Correct file location (`.cursor/rules/cursor-instructions.md` or `.cursor/rules/*.mdc`)
- `globs` pattern is valid and scoped appropriately (granular only)
- No workflow steps (skill territory)
- No personality or behavioral content (agent territory)
- Content is concise and focused on conventions/constraints

## Connected Skills

- `tsh-creating-agents` — For understanding how agents consume instructions.
- `tsh-creating-skills` — For deciding whether content belongs in instruction vs. skill.
