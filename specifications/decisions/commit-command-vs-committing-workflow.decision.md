# Decision: `/tsh-commit` vs `tsh-committing`

**Status:** ACCEPTED  
**Date:** 2026-05-21

## Context

The repository added two related artifacts for git commits: a slash command `/tsh-commit` and a workflow skill `tsh-committing`. Both names sound similar, which causes confusion about when to invoke which and whether one replaces the other.

This split follows the established Cursor Collections pattern from `tsh-creating-commands`: **commands** are user-triggered entry points; **workflow skills** hold reusable domain knowledge loaded on demand. The commit feature was intentionally split so Conventional Commits rules stay maintainable in one place while the command focuses on git operations and the user confirmation gate.

## Options Considered

### Option 1: Single artifact — only `/tsh-commit` with everything inline
- **Pros:** One name to remember; simpler mental model for users.
- **Cons:** Duplicates Conventional Commits spec in the command body; violates separation-of-concerns; harder to reuse message rules from other workflows (e.g. future PR title helper); command file grows past recommended size.

### Option 2: Two artifacts — command + workflow (current design)
- **Pros:** Matches `tsh-ask` + `tsh-codebase-analysing` pattern; command stays procedural (git + gate); workflow holds CC types, inference table, anti-patterns; workflow can auto-load when agent drafts messages without user typing `/tsh-commit`.
- **Cons:** Two names; users may not know they only need `/tsh-commit`.

### Option 3: Only workflow skill `tsh-committing`, no slash command
- **Pros:** No duplicate naming surface.
- **Cons:** No explicit entry point; auto-invocation is unreliable for “commit now”; no `disable-model-invocation` guarantee; confirmation gate less visible in slash menu.

## Decision

**Keep a single user entry point:** **`/tsh-commit`**. Conventional Commits rules live in **`commands/tsh-commit/references/conventional-commits.md`** (not a discovered skill — does not appear in `/`). Supersedes the original two-artifact split after `slash-menu-visibility-policy` (2026-05-21).

| Aspect | `/tsh-commit` (command) | `references/conventional-commits.md` |
| ------ | ------------------------ | -------------------------------------- |
| Location | `.cursor/skills/commands/tsh-commit/SKILL.md` | `.cursor/skills/commands/tsh-commit/references/` |
| User trigger | Yes — type `/tsh-commit` | No — agent reads file during `/tsh-commit` |
| `disable-model-invocation` | `true` | N/A (not a skill) |
| Responsibility | Git inspect; proposal; **approval gate**; `git add` + `commit` | CC format; type/scope; split; secret-file rules |
| Side effects | Mutates git (after approval) | Read-only |

## Consequences

- Documentation and README should describe **`/tsh-commit`** as the user-facing feature; mention `tsh-committing` only as an internal dependency (optional).
- Agents implementing commit support must load `tsh-committing` when following `/tsh-commit`, not re-embed CC rules in the command.
- Adding Husky/commitlint later belongs in workflow or repo config, not in the command gate logic.
- Users who try `/tsh-committing` will get no dedicated slash command — that is expected.

## Rationale

Option 2 aligns with `tsh-creating-commands`: commands define **what workflow runs** (inspect → propose → confirm → execute); workflow skills define **how to apply domain rules** (Conventional Commits). The confirmation gate is workflow-specific to committing and belongs in the command; CC type tables are domain knowledge and belong in `tsh-committing`. Same pattern as `/tsh-ask` (orchestration + ADR output) loading `tsh-codebase-analysing` (research process) without users typing the latter as a command.
