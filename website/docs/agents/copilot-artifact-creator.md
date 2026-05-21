---
sidebar_position: 11
title: Cursor Artifact Creator (internal)
---

# Cursor Artifact Creator Agent

**File:** `.cursor/skills/agents/tsh-cursor-artifact-creator/SKILL.md`
**Type:** Internal worker — not user-invocable

Creation specialist that builds and modifies Copilot customization artifacts (`SKILL.md`, `SKILL.md`, `/SKILL.md`, `.rules.mdc`) based on detailed specifications from the orchestrator. Executes creation tasks only — does not research or review.

## Responsibilities

- Create and modify Copilot customization artifacts based on specifications provided in the delegation prompt.
- Apply the relevant creation skill (`tsh-creating-agents`, `tsh-creating-skills`, `tsh-creating-prompts`, `tsh-creating-instructions`) based on the artifact type.
- Follow workspace conventions — match structure, formatting, and patterns of existing files.
- Validate created files before returning — ensure YAML frontmatter is valid, required sections are present, and the file follows the skill's checklist.

## Boundaries

- Does not make design decisions beyond what the specification provides.
- Does not conduct research — all information must be in the specification or existing workspace files.
- Does not review or critique specifications — review is a separate worker's responsibility.
- Does not propose alternative approaches — the orchestrator is the design authority.

## Tool Access

| Tool | Usage |
|---|---|
| **read** | Check existing patterns before creating artifacts |
| **search** | Find references and check consistency impacts |
| **edit** | Create new files or modify existing ones |
| **todo** | Track multi-file creation tasks |

## Skills Loaded

- `tsh-creating-agents` — Agent file template, structural conventions, and validation checklist.
- `tsh-creating-skills` — Naming conventions, body structure, progressive disclosure patterns.
- `tsh-creating-prompts` — Prompt file template, workflow focus guidelines, validation checklist.
- `tsh-creating-instructions` — Templates for repository-level and granular instruction files, decision framework.

## Invocation

This agent is not directly invocable by users. It is delegated to by the [Cursor Orchestrator](./cursor-orchestrator) as part of multi-step customization workflows.
