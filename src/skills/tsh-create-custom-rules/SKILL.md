---
name: tsh-create-custom-rules
description: Create project instructions and scoped rules for Cursor, Claude Code and Codex - AGENTS.md with the CLAUDE.md import, Cursor scoped rule files, Claude rule files and nested AGENTS.md. Use when the user types /tsh-create-custom-rules or asks to create coding rules or project instructions.
type: command
routes-to: tsh-ai-customization-orchestrator
argument-hint: "<conventions to encode or description>"
metadata:
  short-description: Create custom project rules or instructions
---
# /tsh-create-custom-rules

## Route

Load and follow the `tsh-ai-customization-orchestrator` skill. Artifact type: project instructions and rules. Governing skill: `tsh-creating-rules`.

## Inputs

- The conventions, standards or behaviors to encode, from the user's input after the command
- The tools in use (Cursor, Claude Code, Codex) and whether the rule is project-wide or scoped; ask if unclear

## Required Skills

- `tsh-creating-rules` - per-tool placement, fields, templates and validation checklist
- `tsh-discovering-technical-context` - project conventions and existing instruction files
- `tsh-analyzing-codebase` - stack, structure and existing coding patterns

## Steps

1. Research the project: stack, structure, conventions and which instruction and rule files exist.
2. Decide with the user between project-wide instructions and scoped rules, per tool in use.
3. Create the files with the placement and fields `tsh-creating-rules` defines.
4. Review them against its checklist, including that no rule is written in two places.

## Output

- The new or updated instruction and rule files, with a short summary of what was created

## Guardrails

- Ask the user when the rule type or scope is unclear. Procedures belong in a skill, not in rules.
