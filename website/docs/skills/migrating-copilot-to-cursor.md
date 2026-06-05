---
sidebar_position: 21
title: Migrating Copilot to Cursor
---

# Migrating Copilot to Cursor

**Folder:** `.cursor/skills/workflows/tsh-migrating-copilot-to-cursor/`  
**Used by:** Cursor Engineer, Cursor Orchestrator

Deterministic mapping for porting GitHub Copilot customization artifacts to Cursor equivalents: file types, frontmatter fields, path references, and terminology.

## Artifact Mapping

| Copilot source | Cursor target |
|---|---|
| `.github/agents/*.agent.md` | `.cursor/skills/agents/<name>/SKILL.md` |
| `.github/skills/*.skill.md` | `.cursor/skills/workflows/<name>/SKILL.md` |
| `.github/prompts/*.prompt.md` | `.cursor/skills/commands/<name>/SKILL.md` |
| `.github/internal-prompts/*.prompt.md` | `.cursor/skills/internal/<name>/SKILL.md` |
| `.github/instructions/*.instructions.md` | `.cursor/rules/*.mdc` |

## Key Conversions

- `user-invocable: false` → `disable-model-invocation: true`
- `model:` / `tools:` frontmatter → `> Recommended model:` / `> Recommended tools:` in skill body
- `vscode/askQuestions` → natural-language user questions
- `tsh-copilot-*` agent names → `tsh-cursor-*`

## Connected Skills

- [Creating Agents](./creating-agents) — Target structure for ported agents.
- [Creating Commands](./creating-commands) — Target structure for ported prompts.
- [Creating Rules](./creating-instructions) — Target structure for ported instructions.
