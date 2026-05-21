# Decision: Folder and file structure compliance with Cursor Agent Skills spec

**Status:** ACCEPTED  
**Date:** 2026-05-21

## Context

The `cursor-collections` repository organizes Cursor customization under `.cursor/skills/` with four top-level categories: `agents/`, `commands/`, `workflows/`, and `internal/`. Each leaf folder contains a `SKILL.md`. The question is whether this layout matches the official [Cursor Agent Skills documentation](https://cursor.com/docs/skills).

A prior decision (`slash-menu-visibility-policy.decision.md`) already addressed UX clutter in the `/` palette — that is separate from structural validity.

## Options Considered

### Option 1: Fully compliant — keep current four-folder taxonomy
- **Pros:** Matches Cursor’s documented nested-directory model; categories are purely organizational; optional `references/` and `assets/` already used; `internal/` skills use `disable-model-invocation: true`.
- **Cons:** `internal/` is a repo convention, not named in Cursor docs; some workflow skills still appear in `/` (Tier B — policy, not structure); templates live at skill root instead of `assets/` (cosmetic).

### Option 2: Flatten to single `.cursor/skills/<skill-name>/` level
- **Pros:** Mirrors the minimal example in Cursor docs literally.
- **Cons:** Loses navigability at ~87 skills; no spec benefit — docs explicitly allow nested category folders.

### Option 3: Migrate to `.agents/skills/` as primary path
- **Pros:** Listed first in Cursor docs skill directories table.
- **Cons:** `.cursor/skills/` is equally valid; would break README install symlinks and GitHub import expectations for no gain.

## Decision

**The repository folder and file structure is compliant with the Cursor Agent Skills spec.** Keep the current layout (`agents/`, `commands/`, `workflows/`, `internal/` under `.cursor/skills/`).

No structural migration is required. Optional improvements (not blockers): document the four-folder taxonomy in `tsh-creating-skills`; consider moving `*.example.md` templates into `assets/` for strict alignment with optional-directory naming.

## Consequences

- New skills continue to be created as `<category>/tsh-<name>/SKILL.md` with `name` matching the leaf folder.
- `references/` remains the correct place for command backing docs (Tier A slash-menu policy).
- `internal/` stays valid: nested discovery + `disable-model-invocation: true` prevents auto-invocation; folder name signals “delegate-only, not user entry point.”
- Rules stay in `.cursor/rules/*.mdc` — separate artifact type, not skills.

## Rationale

Official Cursor docs state:

1. Skills load from `.cursor/skills/` (project-level) — **we use this path.**
2. Each skill is a folder containing `SKILL.md` — **every leaf folder follows this.**
3. Nested directories are supported; category folders are “purely organizational”; identity comes from the folder containing `SKILL.md` (e.g. `tsh-implement`, not `commands`) — **matches `commands/tsh-implement/SKILL.md`.**
4. Optional `scripts/`, `references/`, `assets/` — **used where needed** (`tsh-review/references/`, `tsh-creating-rules/assets/`, etc.).
5. `disable-model-invocation: true` for explicit-only skills — **all commands and all `internal/` skills set this.**

What is **not** a spec violation:

| Repo pattern | Cursor docs |
|---|---|
| `agents/`, `commands/`, `workflows/`, `internal/` | Same as `shipping/`, `debugging/`, `workflow/` examples |
| Templates at skill root (`plan.example.md`) | Allowed; `assets/` is optional naming preference |
| `examples/` under `tsh-creating-skills/` | Analogous to `references/` |
| Workflow skills visible in `/` (Tier B) | Discovery behavior; managed by tiered slash policy, not folder shape |

What would **violate** the spec (we do not do):

- Skill files not named `SKILL.md`
- `name` in frontmatter not matching leaf directory
- Copilot-only paths (`.github/skills/`, `.agent.md`) as primary storage

## Compliance checklist

| Requirement | Status |
|---|---|
| `.cursor/skills/` as project skill root | ✅ |
| One `SKILL.md` per skill folder | ✅ |
| `name` + `description` frontmatter | ✅ |
| Nested category folders | ✅ |
| `references/` for progressive disclosure | ✅ (partial — Tier A commands) |
| `disable-model-invocation` on commands | ✅ |
| `disable-model-invocation` on internal skills | ✅ |
| Rules separate from skills (`.cursor/rules/`) | ✅ |
