# Refactor plan: Agent skills quality (Option 4)

**Source:** `specifications/decisions/agents-skills-vs-cursor-subagents.decision.md`  
**Scope:** `.cursor/skills/agents/`, `website/docs/agents/overview.md`, `specifications/decisions/disable-model-invocation-explained.decision.md`  
**Out of scope:** `.cursor/agents/` hybrid layer (Option 3), XML template migration across all agents, `tsh-creating-agents` template rewrite

## Problem

Agent skills live in the correct folder (`skills/agents/`) but contain Copilot-era paths (`*.prompt.md`), `runSubagent` terminology, and inconsistent `disable-model-invocation` on internal workers.

## Characterization (unchanged behavior)

- Agent roles, delegation graph, and workflow semantics stay the same.
- Only path references, delegation API wording, and frontmatter flags change.
- No application code or tests in this repo for Cursor artifacts — verification is grep + link existence.

## Steps

### Step 1: Fix `tsh-engineering-manager` delegation paths and Task tool wording — DONE
- Replace all `*.prompt.md` links with `*/SKILL.md` paths under `commands/` and `internal/`.
- Replace `runSubagent` with Task tool + `@tsh-*` / read internal skill instructions.
- **Done when:** zero `.prompt.md` and `runSubagent` in this file.

### Step 2: Add `disable-model-invocation` to `tsh-architect-reviewer` — DONE
- Align with cursor internal workers; update description.
- Update `disable-model-invocation-explained.decision.md` agents table.
- **Done when:** frontmatter matches delegate-only pattern.

### Step 3: Update Cursor customization agents terminology — DONE
- `tsh-cursor-engineer`, `tsh-cursor-orchestrator`, `tsh-cursor-artifact-creator`, `tsh-cursor-artifact-reviewer`: `.prompt.md` → command skills (`commands/*/SKILL.md`).
- **Done when:** no `.prompt.md` as Cursor artifact type in these four files (runtime prompts in `tsh-prompt-engineer` unchanged).

### Step 4: Fix `website/docs/agents/overview.md` — DONE
- Clarify Agent Skills vs Cursor Subagents (`.cursor/agents/`).
- Fix invocation: `@tsh-*`, `/tsh-*` for commands; internal agents delegate-only.
- **Done when:** no misleading `/agent-name` for agent skills.

### Step 5: Close decision record — DONE
- Set `agents-skills-vs-cursor-subagents.decision.md` status to ACCEPTED.
- **Done when:** decision reflects completed Option 4.

## Definition of done

- [x] `rg '\.prompt\.md|runSubagent' .cursor/skills/agents/` returns no matches
- [x] `tsh-architect-reviewer` has `disable-model-invocation: true`
- [x] `overview.md` documents Skills vs Subagents correctly
- [x] All `tsh-engineering-manager` linked `SKILL.md` paths exist on disk
- [x] Docusaurus build passes (`website/npm run build`)

## Code Review Findings

**Reviewed:** staged changes (7 agent skills + `overview.md`) against this plan and `agents-skills-vs-cursor-subagents.decision.md` (Option 4).  
**Verdict:** **APPROVED with minor follow-ups** — safe to merge for agent-path fixes; complete the commit bundle before push.

### Summary

Refactor correctly replaces dead `*.prompt.md` links with existing `commands/` and `internal/` skills, aligns delegation wording with Cursor **Task** tool, and marks `tsh-architect-reviewer` as delegate-only. No application code affected; behavior of workflows unchanged.

### Verification

| Check | Result |
| ----- | ------ |
| No `*.prompt.md` / `runSubagent` in `.cursor/skills/agents/` | Pass |
| 15 EM-linked skill files exist | Pass |
| `disable-model-invocation: true` on architect-reviewer | Pass |
| `website` build | Pass |

### Issues

#### Should-fix (before or with merge)

1. **Incomplete staged set** — `specifications/decisions/disable-model-invocation-explained.decision.md` was updated (architect-reviewer row) but is **not staged**. Stage it with the agent changes or the decision doc drifts from code.
2. **Untracked supporting docs** — `specifications/refactoring/agents-skills-quality.refactor-plan.md`, `agents-skills-vs-cursor-subagents.decision.md`, `why-remove-prompt-md-references.decision.md` are untracked. Recommend adding to the same PR for traceability.

#### Consider (follow-up, out of Option 4 scope)

3. ~~**`tsh-cursor-orchestrator`** Task tool wording~~ — **Done** (2026-05-21 follow-up).
4. ~~**Per-agent website pages** (internal workers)~~ — **Done** (`architect-reviewer`, `cursor-researcher`, `cursor-artifact-creator`, `cursor-artifact-reviewer`).
5. **Overview nuance** — `disable-model-invocation` blocks auto-apply, not manual `/tsh-architect-reviewer` in `/` menu; “not intended for direct `@`” is policy, not a hard Cursor lock.
6. **Legacy `.prompt.md` elsewhere** — `tsh-creating-commands/prompt.template.md`, `plan.example.md`, changelog — unchanged; acceptable per decision.

### Security / quality

- No secrets, no executable code changes.
- Separation of concerns improved (command skill vs agent skill terminology).
- No regressions identified in linked paths.

## Changelog

- 2026-05-21 — Code review performed (`/tsh-review`). Verdict: approved with minor follow-ups (stage decision doc, optional per-agent website pages).
- 2026-05-21 — Follow-up implemented: Task tool in `tsh-cursor-orchestrator`, internal agent docs on website updated.
