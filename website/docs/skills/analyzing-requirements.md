---
sidebar_position: 2
title: Analyzing Requirements
---

# Analyzing Requirements

**Skill name:** `tsh-analyzing-requirements`  
**Source:** `src/skills/tsh-analyzing-requirements/`  
**Used by:** BA Analysis Worker, Context Engineer, E2E Engineer

Analyzes a task and builds its requirements context into a structured research document (.research.md), gathering information from Jira, Confluence, Figma, PDFs and the codebase and surfacing ambiguities as questions.

**Use when** a task is missing requirements or context, before planning a feature, or when asked to research a task.

## What it covers

- Analysis process
- Delegated mode

## Support files

- `assets/`: `research.template.md`

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-analyzing-implementation-gaps`](./analyzing-implementation-gaps)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
