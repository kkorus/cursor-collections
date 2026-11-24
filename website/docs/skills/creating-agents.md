---
sidebar_position: 36
title: Creating Agents
---

# Creating Agents

**Skill name:** `tsh-creating-agents`  
**Source:** `src/skills/tsh-creating-agents/`  
**Used by:** AI Customization Creator, AI Customization Reviewer, AI Customization Orchestrator (orchestrator), `/tsh-create-custom-agent`

Guides creating and reviewing custom agents (subagents) for Cursor, Claude Code and Codex, from the neutral source schema in `src/agents/` or as native agent files. Covers the agent schema, per-tool output, separation of concerns, dual-mode behavior, the no-delegation rule and the orchestrator-versus-subagent decision.

**Use when** creating, reviewing or updating an agent, or when deciding whether a role should be an agent, an orchestrator or a skill.

## What it covers

- Core Design Principles
- Where Agents Live
- Agent Source Schema
- Native Output per Tool
- Dual Mode and Callers
- Orchestrator, Subagent or Skill
- Creation Process
- Body Structure

## Support files

- `assets/`: `agent.template.md`

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-creating-commands`](./creating-commands)
- [`tsh-creating-rules`](./creating-rules)
- [`tsh-creating-skills`](./creating-skills)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
- [`tsh-reviewing-code`](./reviewing-code)
