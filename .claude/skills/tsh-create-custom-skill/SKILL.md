---
name: tsh-create-custom-skill
description: Create a new skill (knowledge skill, internal step or orchestrator) for Cursor, Claude Code and Codex, in the neutral source when the project has one and as native Agent Skills files otherwise. Use when the user types /tsh-create-custom-skill or asks to create a new skill.
argument-hint: <skill purpose or description>
disable-model-invocation: true
metadata:
  short-description: Create a new custom skill
---
<!-- Generated from src/skills/tsh-create-custom-skill/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-create-custom-skill

## Route

Load and follow the `tsh-ai-customization-orchestrator` skill. Artifact type: skill. Governing skill: `tsh-creating-skills`.

## Inputs

- The skill's purpose, triggers and expected output, from the user's input after the command
- A proposed name, for example `tsh-reviewing-<topic>` (knowledge skill) or `tsh-run-<task>` (command or internal step); ask if the purpose or the type is unclear

## Required Skills

- `tsh-creating-skills` - schema, naming, layout and validation checklist
- `tsh-discovering-technical-context` - project conventions and existing skills
- `tsh-analyzing-codebase` - structural patterns of existing skills

## Steps

1. Research existing skills: naming, layout, frontmatter, size, and whether the project has a neutral source.
2. Clarify requirements with the user and choose the `type` and the name.
3. Create the skill with its support files (`references/`, `assets/`) in the right place for the project.
4. Review it against the `tsh-creating-skills` checklist and fix the findings.

## Output

- The new skill, created and validated, with a short summary of what was created

## Guardrails

- Ask the user when a design decision is unclear instead of guessing.
