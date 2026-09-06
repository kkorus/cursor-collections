---
sidebar_position: 12
title: Cursor Artifact Reviewer (internal)
---

# Cursor Artifact Reviewer Agent

**File:** `.cursor/skills/agents/tsh-cursor-artifact-reviewer/SKILL.md`
**Type:** Internal delegate-only worker (`disable-model-invocation: true`)

Review specialist that evaluates Cursor customization artifacts (`SKILL.md`, `.mdc` rules) against best practices, workspace consistency, and structural correctness. Returns structured review findings categorized by severity — read-only, does not modify files.

## Responsibilities

- Evaluate Cursor customization artifacts against quality criteria provided in the delegation prompt.
- Compare artifacts against existing workspace patterns for consistency in naming, structure, formatting, and tool configuration.
- Identify separation of concerns violations — flag when artifacts cross their defined boundaries.
- Produce structured review findings categorized by severity with specific, actionable recommendations.

## Review Dimensions

| Dimension | What It Checks |
|---|---|
| **Structural Correctness** | Valid YAML frontmatter, required sections present, proper tag usage |
| **Best Practice Adherence** | Token efficiency, progressive disclosure, no redundant content |
| **Workspace Consistency** | Naming conventions, tool arrays, section ordering, formatting |
| **Separation of Concerns** | Agent (WHO), workflow skill (HOW), command skill (WHAT), Instructions (RULES) boundaries |
| **Tool Configuration** | Tools match stated role, appropriate access boundaries |

## Boundaries

- Does not modify any files — reports findings only.
- Does not propose alternative designs or architectures.
- Does not limit findings based on fixability — reports all issues found.

## Tool Access

| Tool | Usage |
|---|---|
| **read** | Examine artifacts and compare against workspace patterns |
| **search** | Find cross-references and check consistency across files |

## Invocation

Delegated by the [Cursor Orchestrator](./cursor-orchestrator) via the Cursor **Task** tool (`@tsh-cursor-artifact-reviewer` with review criteria in the prompt). Not intended for direct user invocation.
