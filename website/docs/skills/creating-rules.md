---
sidebar_position: 39
title: Creating Rules
---

# Creating Rules

**Skill name:** `tsh-creating-rules`  
**Source:** `src/skills/tsh-creating-rules/`  
**Used by:** AI Customization Creator, AI Customization Reviewer, AI Customization Orchestrator (orchestrator), `/tsh-create-custom-rules`

Guides creating and reviewing project instructions and scoped rules for Cursor, Claude Code and Codex: AGENTS.md as the single constitution, CLAUDE.md importing it, Cursor .mdc rules, Claude .claude/rules files and Codex nested AGENTS.md. Covers per-tool placement, frontmatter, precedence, templates and the rules-versus-skills decision.

**Use when** creating, reviewing or updating AGENTS.md, CLAUDE.md or scoped rule files.

## What it covers

- Core Design Principles
- Where Each Tool Reads Instructions
- Creation Process

## Support files

- `assets/`: `agents-md.template.md`, `scoped-rule.template.md`

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-creating-agents`](./creating-agents)
- [`tsh-creating-commands`](./creating-commands)
- [`tsh-creating-skills`](./creating-skills)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
