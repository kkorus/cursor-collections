# Code Quality Report - cursor-collections

## Overview

| Field | Value |
|---|---|
| Repository | cursor-collections |
| Repository Type | Single System (Cursor customization artifacts + docs) |
| Date | 2026-07-24 |
| Layers/Apps Analyzed | `.cursor/skills/` (92 SKILL.md), `.cursor/rules/`, `website/docs/`, `README.md`, `CHANGELOG.md` |

> This report supersedes the 2026-06-05 audit, whose findings were remediated (reference integrity, docs sync, installation symlinks, Plan Reviewer naming, MCP verification). It reflects the state after porting copilot-collections PRs #65–#74 and normalizing all agents to XML structure.
>
> **Remediation (2026-07-24):** Finding 1 (BA orchestrator stale worker models) and Finding 2 (`tsh-ui-reviewer` stale Playwright description) were fixed in the same pass — the per-worker model annotations were removed from `tsh-business-analyst`, and the reviewer description now reflects CLI capture. Findings 3 and 4 are intentional/no-action.

## Executive Summary

This repository is a **Cursor AI IDE customization framework**, not an application codebase. "Code quality" here means the internal consistency of skill definitions, cross-references, naming conventions, documentation mirrors, and model metadata.

**Overall health: very good.** The active `.cursor/` tree is coherent: all 92 `SKILL.md` `name` fields match their directory names, every command and internal skill correctly carries `disable-model-invocation: true`, no agent frontmatter carries it incorrectly, all `.cursor/skills/**/SKILL.md` cross-references resolve, every `@tsh-*` delegation targets a real agent, and every relative link in `website/docs/**` resolves. README/website skill counts (25 agents / 17 commands / 38 workflows / 12 internal = 92) all match `scripts/count-skills.sh`.

The findings below are limited and low-blast-radius. The most material one is **model-metadata drift**: the Business Analyst orchestrator hardcodes its five workers' models in prose, and those values were not updated when PR #73 changed the workers' models — so the orchestrator now advertises stale models. This is a maintainability trap (a duplicated source of truth), not a runtime bug. Everything else is minor polish.

---

## Findings by Layer/App

### Agents (`.cursor/skills/agents/`)

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🟡 | Stale metadata / duplication | `tsh-business-analyst/SKILL.md:22-26` | The orchestrator's worker roster hardcodes each worker's model in prose: transcript `GPT-5.4 mini`, analysis `Gemini 3.1 Pro (Preview)`, extraction `Claude Sonnet 4.6`, quality `GPT-5.4`, formatting `GPT-5.4 mini`. PR #73 changed several of these (e.g. extraction → `Claude Sonnet 5`), so the orchestrator now advertises models that no longer match the workers. The workers themselves no longer carry a model line (removed with the `> Recommended model:` cleanup), so this prose is now the only — and wrong — model claim. | Drop the per-worker model annotations from the roster (models are session-level in Cursor, consistent with the `> Recommended model:` removal). This removes the duplicated source of truth entirely. |
| 2 | 🟢 | Documentation accuracy | `tsh-ui-reviewer/SKILL.md` frontmatter `description` | The `description` still says the reviewer compares "actual implementation (via Playwright)". After PR #72 the reviewer judges CLI-captured evidence via `tsh-ui-capture-worker`, not direct Playwright. The body is correct; only the frontmatter description is stale. | Reword the description to reflect CLI capture (e.g. "…against CLI-captured implementation evidence…"). |

### Workflow skills (`.cursor/skills/workflows/`)

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 3 | 🟢 | Structure consistency | `.cursor/skills/workflows/*/SKILL.md` | Only 15 of 38 workflow skills use any XML-tag sections; the rest are pure Markdown. This is **allowed** by `tsh-creating-skills` (`<xml-syntax>` rule: XML for principles/specs, Markdown for steps/tables), so it is not a defect — but the split is applied inconsistently across skills with principle-style blocks. | No action required. Optionally, when a skill is next edited, wrap genuine "principles/rules" blocks in `<principles>` per the skill rule. Do not bulk-convert. |

### Documentation (`website/docs/`)

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 4 | 🟢 | Docs parity | `website/docs/skills/` | The two orchestration-layer workflow skills added this batch — `tsh-orchestrating-implementation` (PR #66) and `playwright-cli` (PR #72) — have no dedicated `website/docs/skills/*.md` page, unlike most workflow skills. This mirrors upstream (which also added no page), so it is intentional-by-port, but it leaves two catalog gaps. | Optional: add `orchestrating-implementation.md` and `playwright-cli.md`, or leave as-is to stay aligned with upstream. |

---

## Architecture Observations

- **Layer separation is clean.** The four skill layers (agents / workflows / commands / internal) hold their roles: commands and internal skills are all `disable-model-invocation: true`; user-facing agents are `@`-invocable; the internal delegate-only agents (BA workers, cursor workers, plan-reviewer, plan-implementor, technical-writer, ui-capture-worker) correctly carry the flag while user-facing agents do not.
- **Cross-reference integrity is intact** after the migration — every `.cursor/skills/**/SKILL.md` path referenced in agent/skill bodies exists, and no `.prompt.md` / `.github/` residue leaked into active `.cursor/` files (the only `.github/` mentions are legitimate GitHub Actions paths and the migration skill's own mapping tables).
- **Model metadata is the one place the repo duplicates a source of truth.** Cursor doesn't bind models per artifact, and the repo already removed `> Recommended model:` lines — but the BA orchestrator still narrates worker models inline (Finding 1). Centralizing/removing it eliminates the whole drift class.
- **No dead code / true duplication** in the code sense applies — the artifacts are prose specifications, with no unused exports or copy-pasted logic. The nearest analog (duplicated model claims) is Finding 1.

## Summary

| Category | 🔴 Critical | 🟡 Important | 🟢 Nice to Have | Total |
|---|---|---|---|---|
| Dead Code | 0 | 0 | 0 | 0 |
| Duplications | 0 | 1 | 0 | 1 |
| Improvements | 0 | 0 | 3 | 3 |
| **Total** | **0** | **1** | **3** | **4** |

## Recommended Action Plan

### Immediate (Critical)
- None.

### Short-term (Important)
1. Fix Finding 1: remove the stale per-worker model annotations from `tsh-business-analyst/SKILL.md` so the orchestrator stops advertising models that no longer match the workers and no longer duplicates model info Cursor manages at the session level.

### Long-term (Nice to Have)
1. Finding 2: refresh the `tsh-ui-reviewer` frontmatter description to reflect CLI capture instead of direct Playwright.
2. Finding 4: optionally add `website/docs/skills/` pages for `tsh-orchestrating-implementation` and `playwright-cli`.
3. Finding 3: opportunistically wrap principle-style blocks in remaining Markdown-only workflow skills in `<principles>` tags when next edited (no bulk conversion).

---

## Consistency Verdict

| Area | Verdict |
|---|---|
| `.cursor/skills/` name↔dir + frontmatter flags | **Consistent** (92/92) |
| `.cursor/skills/**` cross-references + `@agent` delegations | **Consistent** — all resolve |
| `website/docs/**` relative links | **Consistent** — all resolve |
| Skill counts (README ↔ docs ↔ script) | **Consistent** (25/17/38/12) |
| Model metadata | **Drift** — BA orchestrator prose stale after PR #73 (Finding 1) |
| Post-migration terminology (playwright MCP→CLI) | **Consistent** in bodies; one stale reviewer `description` (Finding 2) |

**Bottom line:** The repository is coherent end-to-end after the #65–#74 port and the XML normalization. Only one Important finding (BA model drift) is worth fixing promptly; the rest are optional polish.
