---
sidebar_position: 11
title: AI Customization Creator (internal)
---

# AI Customization Creator Agent

**Source:** `src/agents/tsh-ai-customization-creator.md`  
**Kind:** subagent, model tier `fast`, read-write access

Creation specialist that builds and modifies AI-customization artifacts (skills, commands, agents, project rules) from detailed specifications. It writes the neutral source when the project has one and native files for Cursor, Claude Code and Codex otherwise. Executes creation only; no research or review.

## Responsibilities

- Create and modify AI-customization artifacts based on specifications provided in the delegation prompt.
- Apply the relevant creation skill (`tsh-creating-agents`, `tsh-creating-skills`, `tsh-creating-commands`, `tsh-creating-rules`) based on the artifact type.
- Follow workspace conventions — match structure, formatting, and patterns of existing files.
- Validate created files before returning — ensure YAML frontmatter is valid, required sections are present, and the file follows the skill's checklist.

## Boundaries

- Does not make design decisions beyond what the specification provides.
- Does not conduct research — all information must be in the specification or existing workspace files.
- Does not review or critique specifications — review is a separate worker's responsibility.
- Does not propose alternative approaches — the orchestrator is the design authority.

## Tool access

- **Read-write.**
- **Leaf agent.** It never delegates to other agents.

## Skills loaded

- `tsh-creating-skills` (preloaded) - Schema, naming, layout and templates for writing skills
- `tsh-creating-rules` - Placement, fields and templates for project instructions and rules
- `tsh-creating-agents` - Schema, mapping and rules for writing agents
- `tsh-creating-commands` - Schema, mapping and template for writing commands

## Invocation and modes

- **Delegated by:** the `tsh-ai-customization-orchestrator` skill. In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
