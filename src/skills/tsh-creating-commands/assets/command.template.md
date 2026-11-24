---
name: tsh-<verb>[-<object>]
description: >-
  <What the command does, third person>. Use when the user types /tsh-<verb>[-<object>] or <other triggers>.
type: command
routes-to: tsh-<agent-or-orchestrator>
argument-hint: "<expected input>"
# requires-mcp: [atlassian]
metadata:
  short-description: "<at most 120 characters>"
---

# /tsh-<verb>[-<object>]

<One sentence: what the command accomplishes.>

## Route

Delegate to the `tsh-<agent>` subagent.
For an orchestrator, write instead: Load and follow the `tsh-<orchestrator>` skill.

## Inputs

- <Input taken from the user's input after the command>
- <What to ask the user when it is missing>

## Required Skills

Before starting, load these skills:

- `tsh-<knowledge-skill>` - <why this workflow needs it>

## Steps

1. **<Step title>**: <hand-over instruction>
2. **<Step title>**: <hand-over instruction>
3. **<Step title>**: <hand-over instruction>

## Output

- <Deliverable, its location and naming>
- <How to tell the work is complete>

## Guardrails

- <Workflow-specific limit or scope boundary; no coding standards here>

<!-- Template note: a command routed to an agent ends with the line "include: caller-status-handling" written as an include comment. Delete this note. -->
