---
sidebar_position: 16
title: Creating Agents
---

# Creating Agents

**Folder:** `.cursor/skills/workflows/tsh-creating-agents/`
**Used by:** Cursor Engineer

Provides templates, guidelines, and a structured process for building custom agent definitions (`SKILL.md`) that describe behavior, personality, responsibilities, and problem-solving approaches.

## Core Design Principles

- **Separation of concerns** — An agent file defines WHO the agent is. It must NOT define HOW specific workflows are executed (that belongs in skills) or WHAT triggers them (that belongs in prompts).
- **XML syntax** — All structured content inside the agent body uses XML-like tags for reliable parsing across LLM model tiers.
- **Minimal scope** — Only include context the LLM doesn't already have. Every token competes for context window space.

## Agent File Structure

| Section | Purpose |
|---|---|
| **YAML Frontmatter** | `name`, `description`; optional `disable-model-invocation: true` for delegate-only workers |
| **Body** | `> Recommended model:` and `> Recommended tools:` lines (Cursor convention) |
| **Agent Role** | WHO the agent is, responsibilities, boundaries |
| **Behavior Guidelines** | Decision-making rules, communication style |
| **Skills Usage** | Which skills to load and when |
| **Tool Usage** | How to use each configured tool |
| **Handoffs** | Transitions to other agents with intent and prompt references |

## Validation Checklist

- YAML frontmatter is syntactically valid
- All required sections present
- No workflow steps embedded (skill territory)
- No coding standards embedded (instructions territory)
- Tools listed match the agent's stated role
- Handoff references use correct `tsh-` prefixed names

## Connected Skills

- `tsh-creating-skills` — For creating matching skills that complement the agent.
- `tsh-creating-commands` — For creating slash commands that route to the agent.
- `tsh-creating-instructions` — For scoped coding conventions the agent should follow.
