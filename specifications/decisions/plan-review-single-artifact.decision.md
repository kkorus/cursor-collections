# Decision: Single artifact for plan review (`tsh-architect-reviewer`)

> **Superseded in part (2026-06-04):** The agent was renamed to `tsh-plan-reviewer` (display name: Plan Reviewer). Paths in this ADR that reference `tsh-architect-reviewer` or `internal/tsh-review-plan` are historical; the current source of truth is `.cursor/skills/agents/tsh-plan-reviewer/SKILL.md`.

**Status:** ACCEPTED  
**Date:** 2026-05-22

## Context

After migrating from GitHub Copilot to Cursor, plan validation existed as two parallel customization files:

- `.cursor/skills/agents/tsh-architect-reviewer/SKILL.md` — persona, tool guidelines, severity levels
- `.cursor/skills/internal/tsh-review-plan/SKILL.md` — numbered workflow (9 passes) and output format

Orchestration was inconsistent: `tsh-engineering-manager` and `/tsh-implement` told the model to delegate to **`tsh-architect-reviewer`** but to load **`internal/tsh-review-plan/SKILL.md`**. Both files defined the same quality gate (research + plan → `APPROVED` or `REVISIONS NEEDED`) with overlapping required workflow skills.

This was flagged as a critical finding in `code-quality-report.md` and addressed in `specifications/refactoring/plan-review-and-rules-globs.refactor-plan.md`.

## Options Considered

### Option A: Keep only `internal/tsh-review-plan`
- **Pros:** Fits the `internal/` folder convention for delegate-only steps without a public agent persona.
- **Cons:** Loses the richer agent definition (tool usage, BLOCKER/WARNING/SUGGESTION tables, constraints). EM and docs already named the role “Architect Reviewer” as an agent.

### Option B: Keep only `agents/tsh-architect-reviewer` (merge workflow into agent)
- **Pros:** One canonical `name`, one path, one file to maintain; aligns delegation text with the file agents actually load; plan review has a clear persona (Architect Reviewer).
- **Cons:** Slightly longer agent skill file; delegate-only role remains under `agents/` (same pattern as `tsh-cursor-researcher` per `disable-model-invocation-explained.decision.md`).

### Option C: Keep both files
- **Pros:** Theoretical separation of “persona” (agent) vs “procedure” (internal).
- **Cons:** Guaranteed content drift; two entries in Cursor’s skill index (`tsh-review-plan` vs `tsh-architect-reviewer`); orchestration confusion; the agent file was effectively unused in the delegation path.

## Decision

**Remove `internal/tsh-review-plan` and keep a single source of truth at `.cursor/skills/agents/tsh-architect-reviewer/SKILL.md`.**

Merge the numbered workflow and output format from the internal skill into the agent skill. Update all references (`tsh-engineering-manager`, `tsh-implement`, website docs) to point at the agent path only.

This is a **consolidation choice**, not a Cursor platform requirement. Cursor does not mandate one file per role.

## Consequences

- Plan review behavior for users is unchanged: Engineering Manager still validates `.plan.md` after the Architect produces or updates it.
- Internal skills count drops from 12 to 11; `internal/` remains for steps without a dedicated agent persona (`tsh-plan`, `tsh-research`, etc.).
- `tsh-architect-reviewer` retains `disable-model-invocation: true` — delegate-only, same as other orchestrator workers in `agents/`.
- No duplicate `/` or cross-reference target for `tsh-review-plan`.
- Future edits to plan review happen in one file only.

## Rationale

Option B best matches how the repo already described the role (Architect Reviewer agent) while eliminating the name/path split that caused agents to load the wrong skill. Option C duplicated maintenance with no isolation benefit once the agent already had `disable-model-invocation: true`. Option A would have discarded the more complete agent content.

Keeping plan review in `agents/` rather than `internal/` is consistent with roles that have a defined reviewer persona and tool expectations, unlike stateless internal steps such as `tsh-plan` or `tsh-research`.

Related: `agents-skills-vs-cursor-subagents.decision.md` (delegate-only agents in `agents/` with `disable-model-invocation`); native `.cursor/agents/` subagents remain a separate optional improvement for context isolation.
