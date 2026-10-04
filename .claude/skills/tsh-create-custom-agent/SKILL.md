---
name: tsh-create-custom-agent
description: Create a new custom agent (subagent) for Cursor, Claude Code and Codex, in the neutral source when the project has one and as native agent files for each tool otherwise. Use when the user types /tsh-create-custom-agent or asks to create a new agent.
argument-hint: <agent role or description>
disable-model-invocation: true
metadata:
  short-description: Create a new custom agent definition
---
<!-- Generated from src/skills/tsh-create-custom-agent/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-create-custom-agent

## Route

Load and follow the `tsh-ai-customization-orchestrator` skill. Artifact type: agent. Governing skill: `tsh-creating-agents`.

## Inputs

- The agent's role, responsibilities and use cases, from the user's input after the command
- The tools (Cursor, Claude Code, Codex) to target when the project has no neutral source; ask if unclear

## Required Skills

- `tsh-creating-agents` - agent schema, per-tool mapping, rules and validation checklist
- `tsh-discovering-technical-context` - project conventions and existing agents
- `tsh-analyzing-codebase` - structural patterns of existing agents

## Steps

1. Research existing agents: naming, structure, access levels, MCP servers and skill references.
2. Clarify requirements with the user: purpose, access level, model tier, MCP servers, skills to load.
3. Decide with the user whether the role is an agent, an orchestrator or a skill.
4. Create the agent file (or files), then review it against the `tsh-creating-agents` checklist.

## Output

- The new agent, created and validated, with a short summary of what was created

## Guardrails

- Ask the user when a design decision is unclear. Agents never delegate; a role that must delegate is an orchestrator.
