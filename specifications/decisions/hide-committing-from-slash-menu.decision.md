# Decision: Hide `tsh-committing` from the `/` slash menu

**Status:** ACCEPTED (implemented 2026-05-21)  
**Date:** 2026-05-21

## Context

After adding `/tsh-commit` and the workflow skill `tsh-committing`, typing `/` in Cursor Agent chat shows **both** `commit` and `committing` (or `tsh-commit` and `tsh-committing`). That contradicts the intended model: only `/tsh-commit` is user-facing; `tsh-committing` is internal domain knowledge loaded by the agent.

Cursor discovers **every** `SKILL.md` under `.cursor/skills/` at startup (~100 tokens: `name` + `description`). Skills without `disable-model-invocation: true` are eligible for **automatic** invocation and typically also appear as **manually invokable** entries when the user opens the `/` palette. Commands under `.cursor/skills/commands/` set `disable-model-invocation: true` so they behave as explicit slash workflows only. Workflow skills under `.cursor/skills/workflows/` intentionally omit that flag (see `tsh-migrating-copilot-to-cursor`: “Never for workflow skills”), which keeps auto-loading but **registers a second slash entry** when names are similar.

Internal skills (e.g. `tsh-plan`) use `disable-model-invocation: true` plus description “Not user-invokable”, but they can still appear in the palette depending on Cursor version — they are not a reliable way to hide discovery.

## Options Considered

### Option 1: Remove standalone skill — move rules to `commands/tsh-commit/references/`
- **Pros:** `tsh-committing` no longer exists as a discovered skill → disappears from `/` menu; keeps separation via file path; matches progressive disclosure (reference loaded on demand); no change to Cursor flags semantics.
- **Cons:** Not reusable as an auto-invoked workflow from other commands without duplicating or adding a thin loader; slightly longer path in `tsh-commit` Required Skills section (“read `references/conventional-commits.md`”).

### Option 2: Move to `.cursor/skills/internal/tsh-committing/` with `disable-model-invocation: true`
- **Pros:** Matches `tsh-plan` pattern; signals “internal”; keeps separate SKILL.md for reuse from `/tsh-implement` or other flows.
- **Cons:** May still show in `/` palette; two slash-adjacent artifacts remain; internal folder is for sub-workflows of other commands, not duplicate entry points.

### Option 3: Add `disable-model-invocation: true` to `workflows/tsh-committing/SKILL.md`
- **Pros:** Minimal diff.
- **Cons:** Violates repo convention (“never for workflow skills”); creates **two** `disable-model-invocation: true` slash targets (`commit` + `committing`) — does not reliably hide from menu and worsens duplication.

### Option 4: Rename only (e.g. `tsh-conventional-commits-rules`)
- **Pros:** Reduces confusion between similar names.
- **Cons:** Still visible in `/`; does not fix root cause.

## Decision

**Adopt Option 1:** delete `.cursor/skills/workflows/tsh-committing/SKILL.md` as a discoverable skill and move its content to:

`.cursor/skills/commands/tsh-commit/references/conventional-commits.md`

Update `/tsh-commit` to load that reference (and update `specifications/decisions/commit-command-vs-committing-workflow.decision.md` to describe “reference file” instead of “workflow skill”).

**Yes — `tsh-committing` should not be visible in the `/` menu.** Only `/tsh-commit` should be listed for end users.

## Consequences

- One public slash command for git commits; Conventional Commits rules remain maintainable in a reference file.
- Any documentation mentioning `tsh-committing` as a workflow skill must be updated.
- Other agents that need CC rules should read the same reference path or rely on `/tsh-commit` — not a separate slash skill.
- Follow-up: implement via `/tsh-implement` or a small chore PR (move file, update cross-references, optional README note: “only commands appear in `/`”).

## Rationale

The `/` menu lists **discovered skills**, not “commands folder only.” A second `SKILL.md` with a similar `name`/`description` will always compete with `/tsh-commit` unless it is not a skill root. Reference files under a command directory are not registered in the skill discovery index, which matches the product expectation and the ADR on command vs workflow separation.
