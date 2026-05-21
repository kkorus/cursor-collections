# Decision: Slash menu visibility policy (commands vs workflows)

**Status:** ACCEPTED  
**Date:** 2026-05-21

## Context

Cursor discovers every `SKILL.md` under `.cursor/skills/` and exposes `name` + `description` in the `/` palette. The repository has ~16 **commands** (intended user entry points) and ~36 **workflows** (agent knowledge). Users see both — e.g. `/tsh-review` and `tsh-code-reviewing` — which causes confusion about what to invoke manually.

## Options Considered

### Option 1: Tiered model — references for 1:1 command pairs; keep shared workflows as SKILL
- **Pros:** Removes duplicate slash entries for high-confusion pairs; preserves auto-invoke for shared skills (`tsh-technical-context-discovering`, etc.).
- **Cons:** Commands must explicitly `Read` reference paths; some website docs still mention old workflow paths until updated.

### Option 2: Document-only — README says “ignore workflows in `/`”
- **Pros:** Zero file moves.
- **Cons:** Menu stays cluttered; no fix for commit/committing-style duplicates.

### Option 3: `disable-model-invocation: true` on all workflows
- **Pros:** Might reduce auto-invoke noise.
- **Cons:** Violates `tsh-migrating-copilot-to-cursor` rules; does not reliably hide palette entries; breaks agent auto-loading.

## Decision

**Adopt Option 1 (tiered model).**

| Tier | Treatment | User action |
| ---- | ----------- | ------------- |
| **A** | Workflow with dedicated command and similar name → `commands/<cmd>/references/*.md`, delete workflow `SKILL.md` | Use slash **command** only (`/tsh-review`, not `code-reviewing`) |
| **B** | Shared infrastructure workflows → keep `workflows/*.md` | May appear in `/`; agent-only — do not invoke manually |
| **C** | Command-orchestrated only (e.g. transcript-processing) | Backlog for optional reference migration |
| **D** | Meta/migration skills | Defer |

**Tier A implemented (2026-05-21):**

- `tsh-committing` → `commands/tsh-commit/references/conventional-commits.md`
- `tsh-code-reviewing` → `commands/tsh-review/references/code-reviewing.md`
- `tsh-ui-verifying` → `commands/tsh-review-ui/references/ui-verifying.md`

## Consequences

- `/` palette has fewer near-duplicate entries for commit and review flows.
- New command-specific knowledge should default to `references/` when there is no need for a separate discovered skill.
- `tsh-creating-commands` and `tsh-creating-skills` document the anti-pattern.
- Website docs under `website/docs/skills/` may still list old paths until a docs pass.

## Rationale

Cursor has no stable `user-invocable: false` for repo skills that keeps auto-invoke but hides manual slash. Reference files are not indexed as skills, which matches the product behavior users expect: **commands in `/`, workflows loaded by agents.**
