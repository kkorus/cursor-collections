---
sidebar_position: 38
title: Creating Commands
---

# Creating Commands

**Skill name:** `tsh-creating-commands`  
**Source:** `src/skills/tsh-creating-commands/`  
**Used by:** AI Customization Creator, AI Customization Reviewer, AI Customization Orchestrator (orchestrator), `/tsh-create-custom-command`

Guides creating and reviewing slash commands for Cursor, Claude Code and Codex, from the neutral source (`type: command` skills with `routes-to` and `argument-hint`) or as native command skills. Covers the command schema, per-tool rendering, naming, the thin-router rule and the command template.

**Use when** creating, reviewing or updating a user-invoked command, or when deciding whether a workflow belongs in a command.

## What it covers

- Core Design Principles
- Where Commands Live
- Command Source Schema
- Native Output per Tool
- Creation Process
- Body Structure

## Support files

- `assets/`: `command.template.md`

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-creating-agents`](./creating-agents)
- [`tsh-creating-rules`](./creating-rules)
- [`tsh-creating-skills`](./creating-skills)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
