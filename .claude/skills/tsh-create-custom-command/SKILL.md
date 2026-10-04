---
name: tsh-create-custom-command
description: Create a new slash command (a skill of type command with a route to an agent or orchestrator) for Cursor, Claude Code and Codex, in the neutral source when the project has one and as a native command skill otherwise. Use when the user types /tsh-create-custom-command or asks to create a new command.
argument-hint: <command purpose or description>
disable-model-invocation: true
metadata:
  short-description: Create a new custom command
---
<!-- Generated from src/skills/tsh-create-custom-command/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-create-custom-command

## Route

Load and follow the `tsh-ai-customization-orchestrator` skill. Artifact type: command. Governing skill: `tsh-creating-commands`.

## Inputs

- The command's purpose, target workflow and arguments, from the user's input after the command
- The agent or orchestrator that should do the work; ask if unclear

## Required Skills

- `tsh-creating-commands` - command schema, per-tool rendering, template and validation checklist
- `tsh-discovering-technical-context` - project conventions and existing commands
- `tsh-analyzing-codebase` - structural patterns of existing commands and agents

## Steps

1. Research existing commands and the available agents and orchestrators to find the route.
2. Clarify requirements with the user: purpose, inputs, skills to load, expected output.
3. Create the command with `routes-to` and `argument-hint`, named `tsh-<verb>[-<object>]`.
4. Review it against the `tsh-creating-commands` checklist, including that the route resolves.

## Output

- The new command, created and validated, with a short summary of what was created

## Guardrails

- A command stays thin: domain knowledge goes into a knowledge skill. Ask the user when a design decision is unclear.
