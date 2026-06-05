# Code Quality Report - cursor-collections

> **Remediation:** Findings from this report were addressed on 2026-06-05 (reference integrity, docs sync, installation symlinks, Plan Reviewer naming, MCP verification, ADR notes, `scripts/count-skills.sh`).

## Overview

| Field | Value |
|---|---|
| Repository | cursor-collections |
| Repository Type | Single System (customization artifacts + docs) |
| Date | 2026-06-05 |
| Layers/Apps Analyzed | `.cursor/skills/` (83 SKILL.md), `website/docs/`, `specifications/`, `README.md` |

## Executive Summary

This repository is a **Cursor AI IDE customization framework** — not an application codebase. Consistency is therefore measured across skill definitions, cross-references, documentation mirrors, installation instructions, and historical decision records.

**Overall health: good with systematic drift.** The active `.cursor/` tree is largely coherent: all 83 `SKILL.md` frontmatter `name` fields match directory names, `disable-model-invocation` is correctly applied to commands/internal/workers, and the `tsh-architect-reviewer` → `tsh-plan-reviewer` rename is complete inside `.cursor/`.

The main consistency gaps are **cross-layer documentation drift** (README/website counts, wrong skill paths, wrong GitHub org URLs), **phantom slash commands** referencing internal skills as `/tsh-*` commands that do not exist, **incomplete installation symlink instructions** (missing `internal/`), and **stale historical ADRs** still naming removed artifacts. A secondary concern is **display-name fragmentation** for Plan Reviewer (`tsh-plan-reviewer` vs "Architect Reviewer" vs "Plan Reviewer") across docs and skill bodies.

Recommended priority: fix P1 reference/installation errors first, then synchronize counters and changelogs, then resolve naming policy and architectural duplication in orchestration skills.

---

## Findings by Layer/App

### `.cursor/skills/` (`/.cursor/skills/`)

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | 🟢 | Historical reference only | `specifications/decisions/plan-review-single-artifact.decision.md` | References removed `internal/tsh-review-plan` and `tsh-architect-reviewer` — not dead runtime code, but misleading for readers. |
| 2 | 🟢 | Unreferenced workflow | `.cursor/skills/workflows/tsh-migrating-copilot-to-cursor/SKILL.md` | Not referenced by any other `.cursor/` skill; only mentioned in README/specifications. Acceptable as on-demand doc skill. |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🟡 | Orchestration overlap | `.cursor/skills/internal/tsh-implement-ui/SKILL.md`, `.cursor/skills/commands/tsh-implement/SKILL.md`, `.cursor/skills/agents/tsh-engineering-manager/SKILL.md` | UI implementation + verification flow defined in three places with overlapping steps (plan review, dev server, UI gate, code review). | Pick one source of truth: either slim `tsh-implement-ui` to verify-fix loop only, or make it canonical and remove duplicated steps from EM + `/tsh-implement`. |
| 2 | 🟡 | Delegation indirection | `.cursor/skills/internal/tsh-research/SKILL.md`, `.cursor/skills/agents/tsh-context-engineer/SKILL.md`, `.cursor/skills/agents/tsh-engineering-manager/SKILL.md` | EM delegates to context-engineer with instruction to follow `tsh-research`, but context-engineer loads `tsh-task-analysing` directly and does not list `tsh-research`. | Add `tsh-research` to context-engineer required skills, or remove `internal/tsh-research` and delegate directly to `tsh-task-analysing`. |
| 3 | 🟢 | Agent + workflow pairing | `tsh-code-reviewer` + `tsh-code-reviewing`, `tsh-ui-reviewer` + `tsh-ui-verifying` | Intentional split (persona vs process). Not a defect. | No change required. |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🔴 | Broken references | `.cursor/skills/commands/tsh-audit-infrastructure/SKILL.md:87-97` | Routes to `/tsh-implement-terraform`, `/tsh-deploy-kubernetes`, `/tsh-implement-pipeline`, `/tsh-implement-observability` — none exist in `commands/`. | Replace with file paths (`.cursor/skills/internal/tsh-implement-terraform/SKILL.md`) or `@tsh-devops-engineer` delegation. |
| 2 | 🔴 | Broken references | `.cursor/skills/internal/tsh-implement-terraform/SKILL.md:96-98`, `tsh-deploy-kubernetes/SKILL.md:90-92`, `tsh-implement-pipeline/SKILL.md:86-88`, `tsh-implement-observability/SKILL.md:91-92` | Same phantom `/tsh-*` slash commands between internal skills. | Use relative SKILL.md paths or explicit "load internal skill" wording. |
| 3 | 🟡 | Broken markdown links | `.cursor/skills/workflows/tsh-designing-multi-cloud-architecture/references/multi-cloud-patterns.md:315-316`, `service-comparison.md:169-170` | Links to non-existent `../../terraform-module-library/SKILL.md` and `../../cost-optimization/SKILL.md`. | Point to `../../tsh-implementing-terraform-modules/SKILL.md` and `../../tsh-optimizing-cloud-cost/SKILL.md`. |
| 4 | 🟡 | Naming inconsistency | `.cursor/skills/agents/tsh-plan-reviewer/SKILL.md:7,12` | H1 says "Plan Reviewer" but role text says "Architect Reviewer". | Align persona text to "Plan Reviewer" (or document dual naming policy). |
| 5 | 🟢 | Incomplete rule doc | `.cursor/rules/cursor-instructions.md:7-10` | Describes `agents/` as user-facing only; 9 delegate-only agents also live in `agents/`. | Add subsection for delegate-only agents in `agents/`. |

**Positive checks (`.cursor/`):**
- 21 agents, 17 commands, 34 workflows, 11 internal — all `name:` frontmatter matches directory names (83/83).
- Zero `tsh-architect-reviewer` references in `.cursor/`.
- `disable-model-invocation: true` on all 17 commands, all 11 internal, all 9 worker agents.
- EM and `/tsh-implement` correctly reference `tsh-plan-reviewer` with full file path.

---

### `website/docs/` + `README.md`

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | 🟡 | Removed page | `website/docs/agents/architect-reviewer.md` (deleted, unstaged) | Replaced by `plan-reviewer.md` — migration in progress, not yet committed. |
| 2 | 🟢 | Missing doc pages | No pages for `tsh-committing`, `tsh-migrating-copilot-to-cursor` | Skills exist in FS but lack dedicated website pages (mentioned in README/commands). |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🟡 | Dual changelog | `CHANGELOG.md`, `website/src/pages/changelog.md` | Manually mirrored; website missing `## 2026-03-01` section present in root CHANGELOG. | Sync missing section or generate website page from root file. |
| 2 | 🟢 | Count declarations | `README.md`, `website/docs/intro.md`, `website/docs/skills/overview.md` | Same metrics repeated with different numbers (see Improvements). | Single source of truth + scripted count. |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🔴 | Wrong skill path | `website/docs/skills/creating-instructions.md:8`, `creating-agents.md:44`, `agents/cursor-engineer.md:58` | References `tsh-creating-instructions/` which does not exist. Actual skill: `tsh-creating-rules`. | Replace all `tsh-creating-instructions` → `tsh-creating-rules`. |
| 2 | 🔴 | Installation gap | `README.md:80-93`, `website/docs/getting-started/installation.md:42-55` | Symlink instructions cover `agents/`, `workflows/`, `commands/` only — **not** `internal/` (11 skills). `/tsh-implement` and EM depend on internal skills (`tsh-plan`, `tsh-research`, `tsh-implement-ui`, etc.). | Add `internal/` symlink loop or document that Option 2 requires repo in workspace / GitHub import. |
| 3 | 🟡 | Wrong GitHub org | `website/docs/getting-started/installation.md:17,34,76`, `mcp-setup.md:19`, `for-ctos.md:101` | Uses `TheSoftwareHouse/cursor-collections`; canonical repo is `kkorus/cursor-collections` (README, docusaurus). | Unify all install/MCP links to `kkorus/cursor-collections`. |
| 4 | 🟡 | Counter drift | `README.md:397-398` vs FS | README tree comment: **16 commands**, **32 workflows**; actual: **17 commands**, **34 workflows**. | Update README structure comment to 17 + 34. |
| 5 | 🟡 | Counter drift | `website/docs/intro.md:25`, `skills/overview.md:8` | Declares **35 workflow skills**; FS has **34**. | Change to 34 or add missing doc page for the 35th if intended. |
| 6 | 🟡 | Agent classification | `README.md:351` | "Architect Reviewer" listed under Development (user-facing table) but is internal `tsh-plan-reviewer` with `disable-model-invocation: true`. | Move to internal workers section or mark "(delegate-only, not for direct @)". |
| 7 | 🟡 | Naming policy | `website/docs/agents/plan-reviewer.md:3,6` vs `overview.md:58-59,116` | Page title "Architect Reviewer", diagram "Plan Reviewer", skill `tsh-plan-reviewer`. | Adopt one display name across docs; add alias note during transition. |
| 8 | 🟡 | MCP doc accuracy | `website/docs/getting-started/mcp-setup.md:54-62`, `website/static/img/mcp-list-servers.png` | Instructions say Cursor Settings → MCP; screenshot shows VS Code/Copilot-style "Select an MCP Server" UI with pylance and "Global in Code". | Replace screenshot with real Cursor MCP settings view or remove image and use text-only verification. |
| 9 | 🟢 | Stale terminology | `website/docs/integrations/overview.md:8,20,22` | "Copilot sessions", "Copilot Eng." instead of Cursor terminology. | Rename to Cursor Engineer / Cursor sessions. |
| 10 | 🟢 | MCP Used By | `website/docs/getting-started/mcp-setup.md:32` | Atlassian lists Software Engineer; changelog 2026-03-17 removed Atlassian from SE tools. | Remove SE from Atlassian row; add CE/EM if applicable. |
| 11 | 🟢 | Changelog gap | `website/src/pages/changelog.md` vs `CHANGELOG.md:200` | Website snapshot missing entire `## 2026-03-01` section (README restructure, agent renames). | Copy section from root CHANGELOG. |

**Positive checks (docs):**
- Agent count 21 = 12 user-facing + 9 internal is **correct** in README L396, intro.md L23, overview.md.
- No broken `architect-reviewer` links remain in `website/docs/` (all point to `plan-reviewer`).
- MCP server list (11 servers) consistent across `mcp-setup.md`, `integrations/overview.md`, `.cursor/mcp.json`.

---

### `specifications/` (historical plans & ADRs)

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | 🟡 | Stale ADR names | `specifications/decisions/plan-review-single-artifact.decision.md`, `disable-model-invocation-explained.decision.md:45`, `agents-skills-vs-cursor-subagents.decision.md:44,74,81` | Still reference `tsh-architect-reviewer`, `internal/tsh-review-plan`. Active code uses `tsh-plan-reviewer`. | Add "Superseded" note or update artifact names in ADRs. |
| 2 | 🟢 | Stale refactor plan | `specifications/refactoring/agents-skills-quality.refactor-plan.md` | References `tsh-architect-reviewer` throughout; includes outdated code review findings from prior migration. | Archive or append supersession note linking to `tsh-plan-reviewer`. |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| — | — | — | — | No actionable code duplication in specifications layer. | — |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | 🟢 | Phantom skill name | `specifications/slash-menu-workflow-visibility/slash-menu-workflow-visibility.plan.md:99` | Lists `tsh-creating-instructions` (does not exist). | Update to `tsh-creating-rules`. |

---

## Architecture Observations

### Layer model

```text
User entry points          Orchestrators              Workers / Internal           Knowledge
─────────────────          ─────────────              ──────────────────           ─────────
/tsh-* commands     →      tsh-engineering-manager  →  tsh-plan-reviewer      →  workflows/*
/tsh-analyze-*      →      tsh-business-analyst       →  tsh-ba-*-worker        →  workflows/*
/tsh-create-custom-* →     tsh-cursor-orchestrator    →  tsh-cursor-*-worker    →  workflows/*
@tsh-architect etc. →      (direct agent use)         →  internal/* wrappers  →  workflows/*
```

**Strengths:**
- Clear four-tier layout: `commands/` (user), `agents/` (personas), `internal/` (delegate steps), `workflows/` (domain knowledge).
- `disable-model-invocation` correctly prevents slash-menu pollution for commands and internal skills.
- Orchestrator → worker pattern (BA, Cursor customization, plan review) is consistent.

**Weaknesses:**
- **Internal skills masquerading as slash commands** breaks the layer model — agents may try to invoke `/tsh-implement-terraform` which Cursor will not resolve.
- **Installation path (symlink Option 2)** does not expose `internal/`, breaking EM/implement delegation for users who follow README literally.
- **Documentation is not generated from `.cursor/`** — counts and paths drift manually (16 vs 17, 32/35 vs 34).
- **Display names decoupled from skill IDs** after renames (Plan Reviewer) without a documented naming policy.

### Dependency graph (reference integrity)

| Source layer | Target | Status |
|---|---|---|
| EM → plan-reviewer | `.cursor/skills/agents/tsh-plan-reviewer/SKILL.md` | ✅ OK |
| EM → internal infra skills | file paths in EM SKILL.md | ✅ OK |
| audit-infrastructure → `/tsh-implement-*` | commands/ (missing) | ❌ Broken |
| internal infra cross-refs | `/tsh-implement-*` | ❌ Broken |
| website → tsh-creating-instructions | workflows/ (missing) | ❌ Broken |
| multi-cloud references → terraform-module-library | workflows/ (missing) | ❌ Broken |
| README install → internal/ | not symlinked | ❌ Broken |

### Scalability & maintainability

- Adding new agents/skills works well (frontmatter conventions enforced).
- Risk grows with **manual doc mirroring** and **orchestration duplication** — each new flow (UI, infra) tends to copy steps into EM, commands, and internal skills.
- Recommendation: introduce a lightweight `scripts/count-skills.sh` and a CI check that greps for known-bad patterns (`tsh-creating-instructions`, `/tsh-implement-terraform`, `TheSoftwareHouse/cursor-collections`, `tsh-architect-reviewer` in `.cursor/`).

---

## Summary

| Category | 🔴 Critical | 🟡 Important | 🟢 Nice to Have | Total |
|---|---|---|---|---|
| Dead Code | 0 | 2 | 3 | 5 |
| Duplications | 0 | 3 | 2 | 5 |
| Improvements | 4 | 10 | 8 | 22 |
| **Total** | **4** | **15** | **13** | **32** |

## Recommended Action Plan

### Immediate (Critical)

1. Replace phantom `/tsh-implement-*` slash references with `.cursor/skills/internal/*/SKILL.md` paths in `tsh-audit-infrastructure` and all four internal infra skills.
2. Fix `tsh-creating-instructions` → `tsh-creating-rules` in three website docs files.
3. Add `internal/` to symlink installation instructions in `README.md` and `website/docs/getting-started/installation.md`.
4. Replace or remove misleading MCP screenshot in `website/static/img/mcp-list-servers.png` and align verify instructions with Cursor UI.

### Short-term (Important)

1. Synchronize skill counters: commands=17, workflows=34 across README, intro.md, skills/overview.md.
2. Unify GitHub URLs to `kkorus/cursor-collections` in installation, MCP setup, for-ctos.
3. Sync website changelog with missing `2026-03-01` section from root `CHANGELOG.md`.
4. Fix broken links in multi-cloud reference markdown files.
5. Resolve Plan Reviewer display naming (pick "Plan Reviewer" or "Architect Reviewer" + document alias).
6. Reclassify Architect Reviewer in README from user-facing Development table to internal workers.
7. Decide orchestration source of truth for UI flow (`tsh-implement-ui` vs EM vs `/tsh-implement`).
8. Align `tsh-research` ↔ `tsh-context-engineer` delegation chain.

### Long-term (Nice to Have)

1. Add supersession notes to historical ADRs referencing `tsh-architect-reviewer`.
2. Add website doc pages for `tsh-committing` and `tsh-migrating-copilot-to-cursor`.
3. Update `cursor-instructions.md` to document delegate-only agents in `agents/`.
4. Replace "Copilot" terminology in integrations overview.
5. Add CI grep checks for reference integrity and skill count drift.
6. Reference `tsh-migrating-copilot-to-cursor` from `tsh-cursor-engineer` or orchestrator skill body.

---

## Consistency Verdict

| Area | Verdict |
|---|---|
| `.cursor/skills/` active references | **Mostly consistent** — rename complete, frontmatter correct |
| Cross-layer docs (README ↔ website ↔ skills) | **Drifted** — counts, paths, org URLs |
| Installation instructions | **Incomplete** — missing `internal/` symlinks |
| Historical `specifications/` | **Stale** — expected for ADRs, needs supersession notes |
| Recent migration (PR #62 plan-reviewer) | **Complete in `.cursor/` and website docs** |
| Recent migration (PR #64 MCP docs) | **Text OK, screenshot incorrect** |

**Bottom line:** The customization layer (`.cursor/`) is production-ready for the plan-reviewer rename, but the repository is **not fully consistent end-to-end**. Documentation and internal-skill cross-references need a focused sync pass before claiming full coherence across install paths, docs, and agent delegation.
