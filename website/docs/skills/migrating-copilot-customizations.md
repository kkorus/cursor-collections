---
sidebar_position: 40
title: Migrating Copilot Customizations
---

# Migrating Copilot Customizations

**Skill name:** `tsh-migrating-copilot-customizations`  
**Source:** `src/skills/tsh-migrating-copilot-customizations/`  
**Used by:** loaded on demand by any agent when the task matches its description

Converts GitHub Copilot customization artifacts (agents, skills, prompts, instructions) into the neutral source in `src/` when the repository has one, or into native Cursor, Claude Code and Codex files otherwise. Maps file types, frontmatter fields, paths and terminology, and keeps model, tools and handoffs as structured fields.

**Use when** porting a PR or branch from a Copilot-based repository, adding a Copilot-originated agent, skill or prompt, or verifying a converted artifact.

## What it covers

- Choose the Target
- Artifact Type Mapping
- Frontmatter Conversion
- Path and Terminology Replacements
- Decision Rules
- Conversion Process
- Post-Conversion Checks

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-creating-agents`](./creating-agents)
- [`tsh-creating-commands`](./creating-commands)
- [`tsh-creating-rules`](./creating-rules)
- [`tsh-creating-skills`](./creating-skills)
