# Decision: What `disable-model-invocation` means in Cursor skills

**Status:** ACCEPTED  
**Date:** 2026-05-21

## Context

Cursor [Agent Skills documentation](https://cursor.com/docs/skills) states that skills are auto-applied when the agent finds them relevant, unless `disable-model-invocation: true` is set — then the skill loads only when the user explicitly invokes `/skill-name`.

In `cursor-collections`, this flag appears on all `commands/` and `internal/` skills, but not on most `workflows/`. Contributors need a clear mental model to choose the right setting when creating new skills.

## How Cursor loads skills (two phases)

| Phase | What loads | When |
| ----- | ---------- | ---- |
| **Discovery** | Only `name` + `description` from frontmatter (~100 tokens per skill) | Cursor startup; agent always "sees" available skills |
| **Activation** | Full `SKILL.md` body + optional `references/`, `scripts/` | When agent decides skill is relevant **or** user types `/name` |

`disable-model-invocation` controls **activation**, not discovery.

## Options Considered

### Option 1: Treat `disable-model-invocation: true` as "slash command only"
- **Pros:** Matches official Cursor docs literally; maps to `commands/` and `internal/` in this repo.
- **Cons:** Easy to confuse with "hidden from `/` menu" — it is not.

### Option 2: Treat the flag as "hide from slash menu"
- **Pros:** Would reduce palette clutter if it worked that way.
- **Cons:** **Incorrect.** Cursor still lists discovered skills in `/`; palette clutter is solved here by moving 1:1 workflow duplicates to `commands/*/references/` (see `slash-menu-visibility-policy.decision.md`), not by this flag alone.

### Option 3: Never use the flag; rely on agent judgment for everything
- **Pros:** Maximum auto-help.
- **Cons:** Entry-point workflows (`/tsh-implement`, `/tsh-commit`) could load mid-conversation without user intent; internal sub-steps (`tsh-plan`) could pollute context when not orchestrated.

## Decision

**Use `disable-model-invocation: true` for skills that must only run when the user (or a parent command) explicitly starts them.**

| Skill category | Flag | Behavior |
| -------------- | ---- | -------- |
| `commands/` (e.g. `tsh-implement`, `tsh-ask`) | `true` | User types `/tsh-implement` → full skill loads. Agent does **not** auto-load it while fixing a typo. |
| `internal/` (e.g. `tsh-plan`, `tsh-research`) | `true` | Loaded when a command delegates ("Read tsh-plan skill"). Not auto-loaded during unrelated chat. |
| `workflows/` (e.g. `tsh-technical-context-discovering`) | omit / `false` | Agent may auto-load when task matches description (implementing a feature, reviewing SQL, etc.). |
| `agents/` (user-facing) | omit | Persona skills; invoked via `@tsh-*` or auto-apply from `description`. |
| `agents/` (delegate-only, e.g. `tsh-architect-reviewer`, `tsh-cursor-researcher`) | `true` | Orchestrator-only; same pattern as `internal/`. |

**Analogy:**  
- Workflow **without** flag = reference book on the shelf — agent pulls it when the task fits.  
- Command **with** flag = procedure you start by pressing a labeled button — not opened unless you (or orchestrator) press it.

## Consequences

- New slash commands in `commands/` must include `disable-model-invocation: true` (enforced by `tsh-creating-commands`).
- Shared knowledge in `workflows/` should **not** set the flag, or agents lose automatic loading during `/tsh-implement` and similar flows.
- Reducing `/` menu noise requires structural changes (references, not only this flag).
- `description` still matters for commands: it appears in `/` search even when auto-invocation is disabled.

## Rationale

Official Cursor behavior: default = intelligent auto-apply; `true` = explicit invocation only. This repo's split matches Copilot-era design (prompts = user-triggered, skills = agent-triggered) documented in `tsh-migrating-copilot-to-cursor`. Option 3 was rejected because orchestrated workflows need predictable, user-initiated entry points.

## Examples in this repository

```yaml
# Command — user must invoke /tsh-analyze-materials
---
name: tsh-analyze-materials
description: Process discovery workshop materials...
disable-model-invocation: true
---
```

```yaml
# Workflow — agent may load while implementing
---
name: tsh-technical-context-discovering
description: Discover and establish technical context before implementing...
# no disable-model-invocation
---
```

```yaml
# Internal — only when /tsh-implement delegates planning
---
name: tsh-plan
description: Create a detailed implementation plan...
disable-model-invocation: true
---
```
