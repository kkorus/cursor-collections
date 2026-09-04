---
title: Changelog
---

# Changelog

All notable changes to this project will be documented in this file.

:::note
The canonical source for this changelog is [CHANGELOG.md](https://github.com/kkorus/cursor-collections/blob/main/CHANGELOG.md) in the repository root. This page is a snapshot — check the repository for the latest entries.
:::

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 2026-09-04 (docs fix — approval gate separation)

### Fixed

- Published flow pages described one authorization gate where the source ratifies two — the Workflow Overview, Standard Flow, Frontend Flow, and UI Verification Flow pages presented the Engineering Manager's `Approve current plan` / `Request changes` / `Stop` as the single gate that authorizes implementation. The orchestration skill's approval-gate-separation section ratifies two distinct gates that must not duplicate each other: the Architect's plan-authoring gate (`Approve plan`, `I have comments`), which fires immediately after a settled review event and writes the `## Human Approval` record, and the manager's execution authorization, which is fail-closed recovery only and never a second normal authorization when a valid current-revision record already exists, including one the Architect recorded. All four pages now name the Architect's gate as the normal one and the manager's as recovery that does not fire when a valid current-revision record exists; the wording reuses what the Engineering Manager and Architect pages already publish rather than inventing new phrasing. **This is a regression introduced by the workflow-pages commit in this port:** the Workflow Overview page contained no Human approval prose before it, so every one of those sentences was written there.
- Three sites gave the Plan Reviewer loop to the wrong owner — the Standard Flow page listed the Plan Validation Phase as delegated to the Plan Reviewer, and both it and the Frontend Flow page showed the Engineering Manager delegating to the Plan Reviewer for plan validation. The source gives that loop to the architect, which owns producing a finished reviewed plan with one reviewer invocation per plan lifecycle, and the Architect and Plan Reviewer pages already publish it correctly. All three now attribute the invocation to the Architect, once per plan lifecycle, with no loop language reintroduced. **This one is pre-existing, not a port regression** — it was present before the port began. It is the same misattribution class already fixed on the internal `/tsh-plan` page, so correcting it here extends a ratified decision rather than making a new one.
- The Cursor Engineer page — the artifact-boundary table said a prompt "routes to agent + model"; it now says it routes to the owning agent and the skill it follows, because model selection is a session-level concern in Cursor and is not bound by the artifact. Also **pre-existing**: no model-mention sweep caught it, because the cell names no model.

### Changed

- The four workflow flow pages now state one identical re-review contract — the Standard Flow, Frontend Flow, and E2E Testing Flow pages gained the "a new review event happens only when the user explicitly directs one" clause that the UI Verification Flow page already carried, matching the Architect's contract that a new review occurs only through an explicitly user-directed new review event.

### Notes

- One further site in the same class was corrected inside a page already in scope: the Standard Flow page said the Engineering Manager must obtain Human approval of the exact current plan revision before the first file-changing delegation. The manager validates a persisted record and reuses a valid one, gating only on recovery, so the sentence now states the requirement as a recorded approval rather than a manager-run gate.
- Two further single-gate statements on the agent pages are corrected in the same commit: the Agents Overview page and the opening paragraph of the Architect page both said the approval gate is the Engineering Manager's. The second contradicted the Handoffs section of its own page, which already described the two-gate model correctly, so the page disagreed with itself. Both are regressions of the PR #76 port rather than pre-existing text — neither file mentioned Human approval before it. Both now state that the manager validates and reuses the persisted record and gates only as fail-closed recovery.
- No skill artifact was touched — the collection still counts 25 agents, 17 commands, 39 workflow skills, and 12 internal skills (93 total).

## 2026-09-04 (docs fix)

### Fixed

- Published pages no longer advertise the abolished second implementation route — the Workflow Overview page said "Quick and Full routes both require Human approval…" and the UI Verification Flow page said "Both Quick and Full routes require…", while the ratified source states Full Flow is the only implementation-orchestration route and that no alternative flow may be offered, recommended, accepted, recorded, or honored as an override. Both now state the single route. **This is a regression introduced by the PR #76 commit and missed by the PR #79 commit:** #76 wrote these two sentences, and #79's documentation sweep grepped the literal string `Quick Flow`, which neither sentence contains. It is the same failure mode already recorded for `Quick vs Full Flow`, recurring in text this port itself authored; the sweep was rerun as a case-insensitive `quick (and|vs) full` search across the docs and the README, which now reports zero.
- Published pages no longer publish the pre-#79 re-review contract — the Standard Flow, E2E Flow, Frontend Flow, and UI Verification Flow pages each said a material revision "requires Reviewer re-review and renewed Human approval". The ratified source says the opposite about re-review: the orchestration skill states no re-review is invoked automatically, the Architect does not automatically invoke `tsh-plan-reviewer`, and the plan-creation skill never triggers a reviewer invocation on its own. Renewed Human approval is still required and is unchanged on all four pages; only the automatic Reviewer re-review is removed. **This is a regression introduced by the PR #76 commit and left standing by the PR #79 commit:** #76 wrote the sentences faithfully, because its own `## Material Revision Handling` did mandate re-review; #79 removed that mandate from the source but swept only the orchestration skill for automatic re-review wording. No verification step swept `re-review` across the published documentation, and the #79 analysis had concluded the workflow pages needed no Quick Flow change — true for Quick Flow, false for this contract.
- The Architect page — "on the low-risk-exemption path **no plan**-authoring gate runs" reworded to "the plan-authoring gate does not run". The meaning is unchanged; the phrase was a coincidental `no plan` substring that tripped the abolished-route guard, and it was the one reason the published documentation did not report zero occurrences.

### Changed

- The two port entries below use this page's native date-first heading shape again, `## 2026-09-04 (PR #NN port)`, matching its eight pre-existing headings and the repository `CHANGELOG.md`. They had been inverted to `## PR #NN port (2026-09-04)` purely to satisfy a verification assertion that forbade any heading beginning `## 2026-09-04` — a substring check whose intent was only that the missing `tsh-resolving-skill-references` entry must not be backfilled here. That intent still holds: this snapshot still carries no entry describing that work.

## 2026-09-04 (PR #77 port)

### Fixed

- Model-name drift removed (exposed by copilot-collections PR #77) — seven fork-local sites asserted a model binding the source does not have. Two were deletions in the skill collection (the Engineering Manager's roster bullet naming `GPT-5.3-Codex` / `Gemini 3.5 Flash`, and the app-code routing-row model clause in `tsh-orchestrating-implementation`); five were replaced on three published pages — Software Engineer, Engineering Manager, and `/tsh-implement` — with one accurate statement per page: model selection is handled at the Cursor session level per worker and is not bound by the artifact. On the `/tsh-implement` page the labelled `**Model array (from the agent):**` metadata line was removed whole, since deleting only its value would have left a dangling label.
- The removed claims were false as written, not merely stale — frontmatter extraction across all 93 artifacts finds zero `model:` and zero `tools:` keys, so "matching the current source frontmatter" and "declares a shared model array" described frontmatter that does not exist. Two of them published mutually contradictory arrays for the same seat: the Engineering Manager page named **GPT-5.6 Luna** and **Claude Sonnet 5**, while the agent skill it documents named `GPT-5.3-Codex` and `Gemini 3.5 Flash`.

### Notes

- Upstream #77 itself was **not applicable** to this fork. It standardized `model:` and `tools:` frontmatter across the upstream agent set; this collection carries neither key on any artifact, and `tsh-migrating-copilot-to-cursor` mandates dropping both at conversion time, so #77's frontmatter hunks had no target here. Its value was diagnostic — going to look for that frontmatter is what proved the seven prose claims wrong.
- Per the batch decision record (D4), one of the seven — the routing-row model clause in `tsh-orchestrating-implementation` — was deleted in the **PR #79** commit rather than this one, because that single line is touched by #76, by #79, and by the skill-reference-resolution change, and a fourth pass over it would have been a needless conflict surface. This knowingly relaxes strict one-commit-per-PR purity for one line.
- Five model mentions are legitimate and were deliberately **not** swept: the multi-cloud service comparison reference, the cloud-cost tagging-standards example tag, the migration skill's own `model:` frontmatter example, the README's Recommended Thinking Effort table, and the code-quality report's audit findings. Historical changelog prose naming past model arrays is untouched for the same reason.
- Pre-existing gaps carried rather than silently repaired: this snapshot still lacks the `2026-09-04` entry that the repository `CHANGELOG.md` carries for the `tsh-resolving-skill-references` change, and `tsh-write-documentation` still has an internal skill with no published page — the mirror image of the `review-plan` orphan the #79 commit deleted. Backfilling either inside a port commit would misattribute it to this port.
- No skill artifact was added or removed — the collection still counts 25 agents, 17 commands, 39 workflow skills, and 12 internal skills (93 total).

## 2026-09-04 (PR #79 port)

### Changed

- Plan review is a lightweight final reality check, invoked once per plan lifecycle (ported from copilot-collections PR #79) — the Plan Reviewer no longer stress-tests the plan or works toward a findings target. It runs one high-level gate and approves a plan that is coherent, feasible, and correctly sequenced. Reports carry only BLOCKERs, from six canonical categories: missing critical context, infeasible approach, wrong sequencing, contradicted project reality, unresolved open question, and unverifiable definition of done. The Architect invokes the reviewer once per plan lifecycle, and a further review event happens only when the user explicitly directs one.
- Report schema — added `reviewed-plan-revision` so a review binds to the exact plan revision it examined, and `architect-action-required` is now `true|false`. The Architect gained a pre-submission self-check and a plan-authoring approval gate that stops and asks on an ambiguous response instead of guessing.
- The 3-iteration escalation loop and the `Decision and Revision History` table are gone — the loop drove the adversarial framing, and the table duplicated the `## Human Approval` record introduced by PR #76.
- **Quick Flow is removed, so after this port there is exactly one implementation route and unplanned implementation is no longer offered at all.** Full Flow is the only implementation-orchestration route, and no alternative flow may be offered, recommended, accepted, recorded, or honored as an override — including the former "with the user able to override the recommendation" behavior. Step 0 now creates execution todos and Step 1 establishes Full Flow and assesses planning readiness.
- New canonical sections — Approval Gate Separation distinguishes the Architect's plan-authoring gate (`Approve plan` / `I have comments`) from the Engineering Manager's recovery-only gate (`Approve current plan` / `Request changes` / `Stop`). Implementation Discussion Boundary requires delivery to begin in a new discussion, after reporting the plan path, current `Plan Revision`, persisted `Decision Timestamp`, and review path.
- A material revision no longer triggers an automatic re-review — it halts further file-changing delegation and requires renewed Human approval, and never invokes a reviewer on its own.

### Removed

- The internal `tsh-review-plan` prompt page was deleted as an orphan documenting a skill this fork does not have; its one inbound link was fixed in the same commit.

### Notes

- Upstream #79's internal-prompt changes were merged into the `tsh-plan-reviewer` agent skill, because this fork folded that prompt into the agent.
- Three `.github/skills/...` path citations a mechanical port would have introduced were converted to backticked skill names resolved per `tsh-resolving-skill-references`.
- The fork-local delegation-economy bullet in `tsh-engineering-manager` was rewritten rather than dropped, and the replacement UI-verification scope paragraph keeps this fork's richer breadth definition from the PR-#72 port.
- No skill artifact was added or removed — the collection still counts 25 agents, 17 commands, 39 workflow skills, and 12 internal skills (93 total).

## 2026-09-04 (PR #76 port)

### Added

- Human plan-approval gate (ported from copilot-collections PR #76) — Implementation plans now carry a persisted `## Human Approval` record (`Plan Revision`, `Human Decision`, `Approved Revision`, `Decision Timestamp`, `Note`). Approval binds to the exact current plan revision and is valid only when the decision is `APPROVED`, the approved revision matches the current one, and the timestamp is ISO 8601 UTC ending in `Z`.
- `<human-approval-precondition>` — All seven execution owners (`tsh-plan-implementor`, `tsh-software-engineer`, `tsh-ui-engineer`, `tsh-e2e-engineer`, `tsh-devops-engineer`, `tsh-prompt-engineer`, `tsh-technical-writer`) validate that record from disk before any file change and fail closed on a missing, stale, mismatched, inferred, Reviewer-only, or unreadable basis, then ask the user which next step to take instead of dead-ending.
- `## Material Revision Handling` — A material revision of an already approved plan halts further file-changing delegation, increments the revision, and requires Reviewer re-review followed by renewed Human approval.
- Role ownership — `tsh-engineering-manager` presents the gate (`Approve current plan`, `Request changes`, `Stop`); `tsh-architect` owns revisions and records only the user's literal response; `tsh-plan-reviewer` `APPROVED` remains Reviewer approval only and never authorizes implementation.

### Changed

- Unplanned implementation is no longer offered — a missing research or plan artifact routes to the preparation sequence instead of an implementation owner.
- Delegation roster and routing — `tsh-plan-implementor` is the default owner for actionable, low-risk plan seams and `tsh-software-engineer` is the complex NON-UI exception; documentation targets are addressed only when they exist in the project.
- Documentation — 19 pages under `website/docs/` now describe research and plan reviews as quality checkpoints rather than authorization gates, with the Human approval gate as the only step that authorizes or halts execution.

### Notes

- Upstream #76's Quick Flow step 1 is ported as written so the commit stays faithful to its PR; the next commit in this port batch removes Quick Flow entirely.
- No skill artifact was added or removed — the collection still counts 25 agents, 17 commands, 39 workflow skills, and 12 internal skills (93 total).
- Pre-existing gap, recorded rather than backfilled: this snapshot never received the `2026-09-04` entry that the repository `CHANGELOG.md` carries for the `tsh-resolving-skill-references` change.

## 2026-07-11 (docs)

### Notes

- Reviewed copilot-collections PR #74 (README path adjustments): not applicable to Cursor Collections. Upstream #74 fixed hardcoded `/Users/adampolak/...` absolute paths, a `<this-repo-url>` clone placeholder, and a settings trailing comma that existed only in the upstream slimmed README. This fork's README is the richer diverged version and already uses relative `.cursor/mcp.json` links and a real clone URL, so no changes were needed.

## 2026-07-11

### Changed

- Recommended model arrays updated across agents and prompts (ported from copilot-collections PR #73):
  - `tsh-architect`, `tsh-business-analyst`, `tsh-context-engineer`, `tsh-prompt-engineer`, and `tsh-ba-quality-worker` now use `GPT-5.6 Terra` with `GPT-5.4`.
  - `tsh-ba-formatting-worker`, `tsh-ba-transcript-worker`, `tsh-cursor-artifact-creator`, and `tsh-technical-writer` now use `GPT-5.6 Luna` with `GPT-5.4 mini`.
  - `tsh-cursor-artifact-reviewer` and `tsh-plan-reviewer` now use `GPT-5.6 Sol` with `GPT-5.5`.
  - `tsh-cursor-orchestrator` now uses `GPT-5.6 Terra` with `Claude Sonnet 5`; `tsh-engineering-manager` (and `/tsh-implement`) now use `GPT-5.6 Luna` with `Claude Sonnet 5`.
  - `tsh-ba-extraction-worker`, `tsh-code-reviewer`, `tsh-cursor-engineer`, `tsh-cursor-researcher`, `tsh-devops-engineer`, and `tsh-ui-engineer` now use `Claude Sonnet 5`.
  - Cost/analysis and review commands (`/tsh-analyze-aws-costs`, `/tsh-analyze-gcp-costs`, `/tsh-analyze-materials`, `/tsh-explore-materials`, `/tsh-audit-infrastructure`, `/tsh-review-codebase`, `/tsh-review`) fold the upstream `GPT-5.6 Terra` / `Claude Sonnet 5` model changes into the delegated agents' Recommended model lines (Cursor commands do not bind models in frontmatter).
  - `tsh-software-engineer` now lists `Kimi K2.7 Code`, `GPT-5.3-Codex`, and `Gemini 3.5 Flash`; `tsh-plan-implementor` now lists `qwen3-coder-30b-a3b-instruct (customendpoint)`, `MAI-Code-1-Flash`, and `GPT-5.4 mini`.
- Website docs — Synced the Engineering Manager, Software Engineer, and `/tsh-implement` pages to the current model arrays.
- README — Added a Recommended Thinking Effort Settings table for manually configuring per-model thinking effort in the Cursor model picker (`GPT-5.6 Sol` medium, `GPT-5.6 Terra` medium/high, `GPT-5.6 Luna` high/xhigh, `Sonnet 5` high, `MAI-Code-1-Flash` high).

## 2026-07-10

### Added

- `playwright-cli` workflow skill (+ 10 reference guides) — CLI-first browser automation and capture skill (session management, storage state, tracing, request mocking, test/video generation, spec-driven testing) that replaces the Playwright MCP for UI verification (ported from copilot-collections PR #72)
- `tsh-ui-capture-worker` agent — Internal worker that performs CLI-based UI capture and optional screenshot-tripwire evidence collection for the verification loop; exports the shared `figma-expected.png` reference, writes per-iteration artifacts, and escalates blockers without judging visual correctness
- `ui-verification-flow` website doc — Documents the capture → review UI verification loop end to end

### Changed

- UI verification reworked from Playwright MCP to CLI capture — `tsh-ui-reviewer` now reviews CLI-captured ACTUAL evidence against a Figma EXPECTED export and delegates capture to `tsh-ui-capture-worker`; `tsh-ui-engineer` runs an explicit implement → capture → review loop (Figma-before-code gate, pinned dev-server URL, up to 5 iterations); `/tsh-review-ui`, `tsh-ui-verifying`, and `tsh-implement-ui` updated to the CLI capture contract with a strict PASS gate and `VERIFICATION NOT RUN` reporting
- `tsh-orchestrating-implementation` skill — Broadened the UI-verification hard-exclusion (any rendered-UI change on a Figma-backed screen triggers the verification gate, even without a `[REUSE]` task or Figma URL in hand)
- `tsh-creating-implementation-plans` skill and `plan.example.md` — Added a per-task UI Verification Status tracking convention
- `tsh-implementing-frontend` skill — Added a Step 0 Figma-fetch gate before UI implementation
- `.gitignore` — Ignore `.playwright-cli` capture output and the `specifications/` artifact tree
- Website docs — Reworked UI Engineer, UI Reviewer, UI Verification, frontend/e2e flow, Playwright integration, MCP setup, prerequisites, and quick-wins pages for the CLI capture workflow

## 2026-06-22

### Added

- `tsh-ui-engineer` agent — New UI-specialized implementor (Recommended model `Claude Sonnet 4.6`) that owns frontend and user-interface implementation. Carries the full UI toolset (Figma, Playwright, Context7, Sequential Thinking), the frontend skill bundle (`tsh-implementing-frontend`, `tsh-implementing-forms`, `tsh-writing-hooks`, `tsh-ensuring-accessibility`, `tsh-optimizing-frontend`, `tsh-ui-verifying`), delegates verification to `tsh-ui-reviewer`, and confirms scope before proceeding without a plan (ported from copilot-collections PR #70)
- `tsh-plan-implementor` agent — New internal-only (`disable-model-invocation: true`) strict implementor that executes one plan task at a time exactly as written, with a minimal toolset and a stop-and-report path for missing seams or ambiguous plans. Reuses the shared `tsh-implement-common-task` internal skill; Recommended model array `qwen3-coder-30b-a3b-instruct (customendpoint)` / `GPT-5.4 mini`
- Website docs pages for the UI Engineer and Plan Implementor agents

### Changed

- Software Engineer agent (`tsh-software-engineer`) — Refactored into the standard non-UI implementor: removed the Figma and Playwright tools and the UI skill bundle, switched to a `GPT-5.3-Codex` / `Gemini 3.5 Flash` Recommended model array, restructured into canonical XML sections, and added an explicit no-plan confirmation step. UI work now routes to `tsh-ui-engineer`
- `tsh-orchestrating-implementation` skill — Split the single implementor route into three: UI with Figma to `tsh-ui-engineer`, approved low-risk plan seams to `tsh-plan-implementor` (DEFAULT), and complex/no-plan non-UI work to `tsh-software-engineer` (EXCEPTION); added the no-plan confirmation gate and the software-engineer delegation-time model-selection note
- Engineering Manager agent (`tsh-engineering-manager`) — Registered `tsh-ui-engineer` and `tsh-plan-implementor` in the delegation roster, narrowed the `tsh-software-engineer` entry to the complex/no-plan non-UI exception path, and reconciled the constraints and delegation list
- Reference reconciliation — Repointed UI ownership to `tsh-ui-engineer` across `tsh-ui-reviewer`, `plan.example.md`, and the `tsh-implement-ui` internal skill, while keeping `tsh-software-engineer` as the default non-UI fix target in `tsh-code-reviewer` and `tsh-e2e-engineer` with an explicit UI exception
- Website docs — Reframed the Software Engineer page as non-UI, updated the agents overview table and handoff diagram to include the three implementors, and added the new agent pages

## 2026-06-19

### Added

- `tsh-technical-writer` agent — Internal worker agent that owns repository documentation, authoring and updating README, CHANGELOG, in-repo `/docs`, and website docs pages. Delegated to by the Engineering Manager for documentation-only work; never writes or edits product code (ported from copilot-collections PR #69)
- `tsh-writing-documentation` workflow skill — Canonical documentation-writing skill covering README, CHANGELOG, in-repo `/docs`, and the website docs site; includes documentation scope rules, accuracy-over-volume, structure-mirrors-neighbors, broken-link policy, and reader-centered craft guidelines from *Writing for Busy Readers*
- `tsh-write-documentation` internal skill — Worker handoff that delegates a bounded documentation task to `tsh-technical-writer` and loads `tsh-writing-documentation` before authoring begins
- Website docs pages for the Technical Writer agent and Writing Documentation skill

### Changed

- Engineering Manager agent (`tsh-engineering-manager`) — Added `tsh-technical-writer` to the delegation roster with documentation-only rules; tightened the "never writes product code" constraint to "never edits any file directly"; added read/search guardrails (routing decisions only, never for research or solving)
- `tsh-orchestrating-implementation` skill — Renamed the `never-writes-product-code` principle to `never-edits-files-directly` (all file types), added `read-search-routing-only` and `last-resort-stop-or-ask` principles, added documentation as a first-class routed work type, and tightened the handoff and fix-routing rules
- Website agents overview — Added the Technical Writer to the delegation diagram and the internal delegate-only agents table

## 2026-06-18

### Added

- Open-questions dispatch gate for implementation plans — plans with any `❓ Open` rows now block execution until `tsh-architect` resolves them (ported from copilot-collections PR #68)
- Executable-slot dispatch gate — plans can't be dispatched if any verification field, DoD command, or file path still contains placeholder/default values
- Planning-readiness gate in `tsh-orchestrating-implementation` — execution now checks that open questions are cleared before proceeding

### Changed

- `tsh-creating-implementation-plans` skill — hardened the plan contract: Wildly Important Goal now requires `Goal`, `Success Measure`, and `Do NOT touch / do NOT add`; phases require a `Verification` field with exact fast-running checks; tasks require `Files:` entries with `create`/`modify`/`reuse` labels and an optional `Stop Rule`; DoD distinguishes code tasks from docs/config tasks and requires stack-specific runnable checks or deterministic file assertions; UI verification clarified as distinct from full e2e
- `plan.example.md` template — updated to match the stricter plan contract (goal hierarchy, per-phase Verification, per-task Files/Stop Rule, docs-only task pattern, comment-wrapped implementation note)
- Plan Reviewer agent (`tsh-plan-reviewer`) — now blocks review when `## Open Questions` still contains `❓ Open`
- Website docs for Creating Implementation Plans — synced to the new template and workflow rules

## 2026-06-15

### Added

- `tsh-creating-implementation-plans` workflow skill — Centralized plan-structure ownership: the plan template (`plan.example.md`), phase/task ordering, Wildly Important Goal, per-task Clues, and definition-of-done rules (ported from copilot-collections PR #67)
- Direct architect/plan-reviewer nesting — `tsh-architect` now invokes `tsh-plan-reviewer` directly via the Task tool with a strict `<plan-review-report>` verdict schema, owning the review loop end to end

### Changed

- Architect agent (`tsh-architect`) — Tightened into a WHO-only architecture role, restructured into XML sections, delegated plan-structure ownership to `tsh-creating-implementation-plans`, and added the nested review contract (append-only `.plan-review.md`, mandatory review with low-risk exemptions, 3-iteration cap with structured user escalation)
- Plan Reviewer agent (`tsh-plan-reviewer`) — Returns a structured `<plan-review-report>` assessment to its invoker instead of self-routing to the architect; dropped the `todo` tool and added `tsh-creating-implementation-plans` to its skills
- Engineering Manager agent — Removed `tsh-plan-reviewer` from its delegation roster; plan review is now owned by the architect
- `tsh-orchestrating-implementation` skill — Step 2 now plans task order (not a binding call sequence); the planning sequence delegates the reviewed-plan handoff (including the nested review loop) to the architect
- `tsh-plan` internal skill and `tsh-architecture-designing` skill — Removed duplicated plan-authoring rules and moved them into `tsh-creating-implementation-plans`
- `tsh-creating-agents` skill — Documented the optional `<approach>` section and justified agent-specific domain tags
- Website docs — Updated architect, plan reviewer, engineering manager, architecture-design, skills overview, and internal plan/research/review-plan pages for the refactored flow

## 2026-06-11

### Added

- `tsh-orchestrating-implementation` workflow skill — Added the canonical implementation orchestration workflow with flow selection, delegation routing (Task-to-Owner table), todo control, and review/UI-verification gates (ported from copilot-collections PR #66)

### Changed

- Engineering Manager agent (`tsh-engineering-manager`) — Reworked into a WHO-only orchestrator that delegates implementation work through `tsh-orchestrating-implementation`; restructured into role, delegation roster, skills usage, tool usage, and constraints sections
- `/tsh-implement` command — Reduced to a thin trigger that hands off to the orchestration skill
- Website documentation — Updated the Engineering Manager and `/tsh-implement` docs to reflect the new orchestration flow

## 2026-06-09

### Added

- FAQ & Best Practices documentation — New `getting-started/faq.md` page capturing TSH team working habits: session sizing, when to start a new `/tsh-implement`, using `research.md`/`plan.md` vs. durable docs, spec folder organization, and model-switching guidance (ported from copilot-collections PR #65)

### Changed

- Engineering Manager agent (`tsh-engineering-manager`) — Repositioned as architect-advised orchestrator: added mandatory architect-consultation triggers, an explicit "never first writer of product code" boundary, and a `## Constraints` section; removed the `edit` tool so implementation work is always delegated (ported from copilot-collections PR #65)
- `/tsh-implement` command — Added orchestration-only guardrails requiring delegation before any source-code modification in both Quick and Full flows
- Code review workflow (`tsh-code-reviewing`) and Code Reviewer agent (`tsh-code-reviewer`) — Added a high-risk anti-pattern checklist (N+1 access patterns, in-memory pagination/filtering/aggregation) and treat missing integration coverage as a substantive finding when correctness depends on a real database or external service boundary
- Plan Reviewer agent (`tsh-plan-reviewer`) — Recommended model bumped to GPT-5.5

## 2026-06-04

### Changed

- Plan reviewer agent — Renamed `tsh-architect-reviewer` to `tsh-plan-reviewer`; added `edit` tool, REVISIONS NEEDED handoff to `tsh-architect`, and updated Engineering Manager and `/tsh-implement` delegation references (ported from copilot-collections PR #62)

## 2026-06-01

### Added

- `/tsh-explore-materials` command — Business Analyst exploration mode for ambiguous workshop inputs; produces `workshop-context-summary.md` before backlog extraction begins
- Internal BA worker agent skills — `tsh-ba-transcript-worker`, `tsh-ba-analysis-worker`, `tsh-ba-extraction-worker`, `tsh-ba-quality-worker`, `tsh-ba-formatting-worker` for model-specialized orchestration phases
- `intent-brief.example.md` and `task-baseline.example.md` — Example artifacts for Gate 0 intent brief and project baseline continuity

### Changed

- Business Analyst agent (`tsh-business-analyst`) — Reworked into an orchestrator that delegates transcript cleanup, context synthesis, extraction, quality review, and Jira formatting to internal BA workers while retaining all user-facing gates and Jira mutations
- `/tsh-analyze-materials` command — Added Gate 0 intent-brief approval, Explore Mode support, Lite/Full quality review with Gate 1.5, post-push Jira verification, and project baseline refresh after verified sync
- Task extraction, quality review, and Jira formatting workflow skills — Expanded for intent briefs, source traceability, GIVEN/WHEN/THEN acceptance criteria, Lite/Full review modes, and baseline refresh
- Product ideation documentation — Updated README, changelog, and website docs to reflect the new BA orchestration flow, optional exploration, expanded artifact set, and verified Jira sync process
- MCP setup documentation — Added post-installation steps and MCP verification checklist (ported from copilot-collections PR #64)

## 2026-05-17

### Changed

- Cost optimization — Switched default model from Claude Opus 4.6 to GPT-5.4 across implementation and infrastructure agents (`tsh-architect`, `tsh-engineering-manager`) and public prompts (`/tsh-implement`, `/tsh-analyze-aws-costs`, `/tsh-analyze-gcp-costs`, `/tsh-audit-infrastructure`, `/tsh-review-codebase`)
- `tsh-e2e-engineer` agent — Changed model from Claude Sonnet 4.6 to GPT-5.4 mini
- Internal prompts — Removed YAML frontmatter (agent, model, description) from all internal prompts (`tsh-deploy-kubernetes`, `tsh-implement-common-task`, `tsh-implement-e2e`, `tsh-implement-observability`, `tsh-implement-pipeline`, `tsh-implement-terraform`, `tsh-implement-ui-common-task`, `tsh-implement-ui`, `tsh-plan`, `tsh-research`); internal prompts now fully inherit context from the delegating agent

## 2026-05-15

### Changed

- Copilot customization agents — Updated model assignments: `tsh-copilot-engineer` and `tsh-copilot-orchestrator` switched from Claude Opus 4.6 to GPT-5.4; added explicit model to `tsh-copilot-artifact-creator` (GPT-5.4 mini), `tsh-copilot-artifact-reviewer` (Gemini 3.1 Pro), and `tsh-copilot-researcher` (Claude Sonnet 4.6)
- Copilot customization prompts (`/tsh-create-custom-agent`, `/tsh-create-custom-instructions`, `/tsh-create-custom-prompt`, `/tsh-create-custom-skill`) — Removed `model` field from frontmatter; prompts now inherit the model from the routed agent (`tsh-copilot-orchestrator`) instead of overriding it

## 2026-04-10

### Changed

- `/tsh-implement` prompt — Fixed chronic UI verification skipping: added mandatory UI task inventory at plan review (step 2), proactive dev server URL collection before implementation (step 3), elevated `[REUSE]` UI verification to a prominent task type with explicit delegation instructions (step 6), added mandatory UI Verification Gate before code review (step 8), and explicit code review delegation step (step 9); references `tsh-implement-ui.prompt.md` for full verification workflow instead of duplicating it
- Engineering Manager agent (`tsh-engineering-manager`) — Added "UI Verification Enforcement" subsection with 4-point checklist (inventory at plan review, early dev server URL collection, process in order, gate code review); strengthened `tsh-ui-reviewer` delegation with mandatory emphasis and "never skip" guardrail
- UI Reviewer agent (`tsh-ui-reviewer`) — Added "Tool-to-URL mapping" rule clarifying that all Figma data (URLs, node IDs, file keys) must go through `figma` tool and Playwright is only for dev server navigation

## 2026-04-01

### Changed

- Renamed Figma MCP server key from `figma-mcp-server` to `figma` across all agents, prompts, skills, MCP configuration, and documentation — aligns with Figma's recommended server naming in their official docs

## 2026-03-30

### Added

- Backend development skill `tsh-implementing-backend`

### Changed

- Updated `tsh-implementing-backend` skill reference in `tsh-software-engineer` agent
- Updated `tsh-implementing-backend` as a conditional skill in `implement` prompt for backend API tasks

## 2026-03-20

### Changed

- `/tsh-implement` prompt — Now auto-detects missing context and missing plan; delegates to `tsh-context-engineer` for research and `tsh-architect` for planning before implementation, with user confirmation between phases
- `/tsh-plan` prompt — Moved from public `.github/prompts/` to internal `.github/internal-prompts/`; no longer invoked directly by users — the Engineering Manager delegates to the Architect automatically when a plan is needed
- `/tsh-research` prompt — Moved from public `.github/prompts/` to internal `.github/internal-prompts/`; no longer invoked directly by users — the Engineering Manager delegates to the Context Engineer automatically when research is needed
- Engineering Manager agent (`tsh-engineering-manager`) — Added `tsh-context-engineer` to subagents; added structured workflow to decide between research, planning, and implementation phases; added delegation rules for `tsh-context-engineer` (missing context) and `tsh-architect` (missing plan); added Sequential Thinking usage for phase routing decisions
- Business Analyst agent (`tsh-business-analyst`) — Replaced "Deep-dive Research per Task" and "Prepare Implementation Plan" handoff buttons with single "Start Implementation" handoff routing to Engineering Manager
- Context Engineer agent (`tsh-context-engineer`) — Replaced "Prepare Implementation Plan" handoff button with "Start Implementation" handoff routing to Engineering Manager
- Updated website documentation: moved `/tsh-plan` and `/tsh-research` prompt pages from public to internal section; updated agents overview, prompts overview, workflow docs, and getting started pages

## 2026-03-17

### Added

- Engineering Manager agent (`tsh-engineering-manager`) — Orchestrates the implementation phase by delegating tasks to specialized agents (Software Engineer, E2E Engineer, DevOps Engineer, Architect, Code Reviewer, UI Reviewer) based on the implementation plan; uses Sequential Thinking for ambiguous routing; auto-triggers code review if no review phase is defined; tracks progress via plan checkboxes
- Internal prompts directory (`.github/internal-prompts/`) — Agent-only prompts not visible in the slash command menu, used exclusively for sub-agent delegation by the Engineering Manager
- Internal prompt `tsh-implement-common-task` — Base implementation workflow for Software Engineer delegated tasks (backend and non-Figma frontend)
- Internal prompt `tsh-implement-ui-common-task` — Extends `tsh-implement-common-task` with UI-specific behaviors for Figma-based frontend tasks
- Internal prompt `tsh-implement-ui` — Full UI implementation + verification loop orchestration for the Engineering Manager
- Documentation page for the Engineering Manager agent on the website
- Documentation pages for all new internal prompts on the website

### Changed

- `/tsh-implement` prompt — Rewritten to route through the Engineering Manager agent instead of Software Engineer; now delegates tasks to specialized agents based on plan task types (`[CREATE]`, `[MODIFY]`, `[REUSE]`)
- Architect agent (`tsh-architect`) — Handoff now routes to Engineering Manager instead of Software Engineer; removed "Start UI Implementation" handoff button (consolidated into single "Start Implementation"); reformatted tools list YAML; updated plan template to include `[REUSE]` UI verification tasks delegated to `tsh-ui-reviewer`
- Architecture Designing skill (`tsh-architecture-designing`) — Updated plan phases to run only fast tests/checks per phase (unit, integration, linters, build); added code review phase requirement using `tsh-code-reviewer` with `tsh-review.prompt.md`; added `[REUSE]` UI verification task pattern for Figma-based features
- UI Reviewer agent (`tsh-ui-reviewer`) — Removed "Start UI Implementation" and "Implement UI Fixes" handoff buttons (Engineering Manager now owns the verify-fix loop); added explicit dev server URL confirmation requirement; added authentication/login screen detection and escalation; added "reading source code is NOT verification" guardrail
- Code Reviewer agent (`tsh-code-reviewer`) — Added explicit mention of e2e tests alongside unit and integration tests in verification requirements
- Software Engineer agent (`tsh-software-engineer`) — Removed `atlassian/search` from tool access (Atlassian context now gathered by Engineering Manager)
- `/tsh-plan` prompt — Minor update
- `/tsh-review-ui` prompt — Minor update
- `/tsh-review` prompt — Minor update
- Prompts reorganized into public and internal categories on the documentation website with separate sidebar sections
- Moved 7 infrastructure/DevOps prompts from public `.github/prompts/` to internal `.github/internal-prompts/` (`tsh-deploy-kubernetes`, `tsh-implement-e2e`, `tsh-implement-observability`, `tsh-implement-pipeline`, `tsh-implement-terraform`)
- Updated agents overview documentation with Engineering Manager in the handoff diagram and agent summary table
- Updated prompts overview documentation with public/internal prompt distinction and delegation table
- Updated workflow documentation (standard flow, frontend flow, e2e flow) to reflect Engineering Manager orchestration

### Removed

- `/tsh-implement-ui` public prompt — Consolidated into `/tsh-implement`; UI implementation is now handled internally by the Engineering Manager's delegation to Software Engineer + UI Reviewer
- `/tsh-clean-transcript` prompt — Removed (functionality available through `/tsh-analyze-materials`)
- `/tsh-create-jira-tasks` prompt — Removed (functionality available through `/tsh-analyze-materials`)

## 2026-03-08

### Added

- Ensuring Accessibility skill (`tsh-ensuring-accessibility`) — WCAG 2.1 AA compliance, semantic HTML, ARIA patterns, keyboard navigation, focus management, screen reader support, and color contrast requirements
- Implementing Forms skill (`tsh-implementing-forms`) — Form architecture, schema-based validation, field composition, error handling, multi-step form flows, and accessible form patterns
- Frontend Optimization skill (`tsh-optimizing-frontend`) — Rendering optimization, code splitting, memoization strategies, bundle size control, asset optimization, and memory management with React-specific reference patterns
- Frontend Review skill (`tsh-reviewing-frontend`) — Frontend-specific code review criteria: component anti-patterns, hooks quality, rendering correctness, accessibility and performance spot-checks, module organization with React-specific reference checklist
- Writing Hooks skill (`tsh-writing-hooks`) — Custom hook and composable patterns: naming, composition, stable return shapes, lifecycle cleanup, and testing strategies with React-specific reference patterns
- React-specific reference files (`references/react-patterns.md`) for implementing-frontend, optimizing-frontend, reviewing-frontend, and writing-hooks skills
- Documentation pages for all 5 new skills on the website

### Changed

- Software Engineer agent (`tsh-software-engineer`) — Added 4 new frontend skills to skills list (`tsh-implementing-forms`, `tsh-writing-hooks`, `tsh-ensuring-accessibility`, `tsh-optimizing-frontend`); added `tsh-ui-reviewer` as subagent for verification delegation; reformatted tools list
- Code Reviewer agent (`tsh-code-reviewer`) — Added `tsh-reviewing-frontend` skill for frontend-specific review criteria
- UI Reviewer agent (`tsh-ui-reviewer`) — Rewritten to emphasize subagent usage pattern, mandatory tool-based verification (never mental comparison), transparent error reporting with LOW confidence; reformatted tools list
- Frontend Implementation skill (`tsh-implementing-frontend`) — Refactored to focus on component patterns and composition, moved accessibility to dedicated `tsh-ensuring-accessibility` skill; added React-specific reference file
- UI Verification skill (`tsh-ui-verifying`) — Rewritten with 5-step verification process, verification order (stop on first CRITICAL failure), and improved report format
- `/tsh-implement-ui` prompt — Rewritten to use `tsh-ui-reviewer` as subagent (not `/tsh-review-ui` prompt call); added `tsh-ensuring-accessibility` skill; clarified that SE must never verify UI itself
- `/tsh-review-ui` prompt — Simplified to delegate entirely to `tsh-ui-verifying` skill workflow; fixed "all differences" wording to align with skill's stop-on-critical-failure rule
- Updated website documentation for Software Engineer, Code Reviewer, UI Reviewer agents and `/tsh-implement-ui`, `/tsh-review-ui` prompts
- Updated skills overview: skill count 25 → 30, added new skills to Development and Quality tables, updated agent–skill matrix
- Fixed Architect agent docs — added 7 missing skills (multi-cloud, cloud cost, CI/CD, Terraform, secrets, Kubernetes, observability)
- Fixed DevOps Engineer agent docs — added missing `tsh-codebase-analysing` skill
- Fixed Frontend Flow workflow docs — added `tsh-ensuring-accessibility` to required skills, updated subagent terminology

## 2026-03-06

### Added

- DevOps Engineer agent (`tsh-devops-engineer`) — Senior DevOps Engineer and Consultant persona specializing in Golden Paths, automation, and Cloud governance; mandatory architect sub-agent delegation for all design decisions; multi-cloud guardrails with FinOps alerts (>10% cost increase triggers alert); three-option output strategy (Golden Path, Cost-Optimized, Velocity); mandatory skill-loading chains for 8 task types; tools include AWS API MCP, AWS Docs MCP, GCP gcloud/observability/storage MCPs, Context7, Sequential Thinking
- Multi-Cloud Architecture skill (`tsh-designing-multi-cloud-architecture`) for selecting and integrating services across AWS, Azure, and GCP with service comparison and multi-cloud pattern references
- CI/CD Implementation skill (`tsh-implementing-ci-cd`) for pipeline design patterns and deployment strategies
- Kubernetes Implementation skill (`tsh-implementing-kubernetes`) for deployment patterns, Helm charts, and cluster management
- Observability Implementation skill (`tsh-implementing-observability`) for logging, monitoring, alerting, and distributed tracing patterns
- Terraform Modules skill (`tsh-implementing-terraform-modules`) for reusable Terraform modules across AWS, Azure, and GCP with per-cloud module references
- Secrets Management skill (`tsh-managing-secrets`) for secrets management patterns in cloud and Kubernetes environments
- Cloud Cost Optimization skill (`tsh-optimizing-cloud-cost`) for rightsizing, tagging strategies, and spending analysis with tagging standards reference
- AWS cost analysis prompt (`/tsh-analyze-aws-costs`) for cost optimization and tagging compliance audit with hybrid IaC + live API approach
- GCP cost analysis prompt (`/tsh-analyze-gcp-costs`) for cost optimization and labeling compliance audit with hybrid IaC + live API approach
- Infrastructure audit prompt (`/tsh-audit-infrastructure`) for multi-scope audit (AWS/Azure/GCP/K8s/CI-CD) covering security, cost, and best practices
- Kubernetes deployment prompt (`/tsh-deploy-kubernetes`) for deployments, Helm charts, and workload configurations
- CI/CD pipeline prompt (`/tsh-implement-pipeline`) for pipelines with deployment stages and environment protection
- Terraform implementation prompt (`/tsh-implement-terraform`) for Terraform modules and cloud infrastructure provisioning
- Observability implementation prompt (`/tsh-implement-observability`) for metrics, logs, traces, and alerting solutions

### Changed

- Updated Architect agent (`tsh-architect`) with handoff to DevOps Engineer for infrastructure implementation
- Renamed 7 new infrastructure skill directories with `tsh-` prefix (continuation of 2026-03-05 prefix migration)
- Renamed 7 new infrastructure prompt files with `tsh-` prefix
- Updated all skill cross-references in architect agent, devops engineer agent, and all 7 infrastructure SKILL.md files
- Updated all skill references in 7 infrastructure prompt files

## 2026-03-05

### Changed

- Added `tsh-` prefix to all Copilot customization artifacts to prevent naming collisions when used alongside project-specific customizations
- Renamed all 18 skill directories to include `tsh-` prefix (e.g., `code-reviewing` → `tsh-code-reviewing`, `creating-agents` → `tsh-creating-agents`)
- Renamed all 15 prompt files to include `tsh-` prefix (e.g., `/create-custom-agent` → `/tsh-create-custom-agent`, `/implement` → `/tsh-implement`)
- Renamed worker agents to include `tsh-` prefix: `copilot-researcher` → `tsh-copilot-researcher`, `copilot-artifact-creator` → `tsh-copilot-artifact-creator`, `copilot-artifact-reviewer` → `tsh-copilot-artifact-reviewer`
- Updated all cross-references between artifacts to use prefixed names

### Added

- Naming convention instruction (`.github/instructions/naming-conventions.instructions.md`) enforcing `tsh-` prefix on all artifact filenames, frontmatter names, and cross-references
- `tsh-` prefix explanation note in README for external users

## 2026-03-02

### Added

- Custom agent creation prompt (`/create-custom-agent`) for creating new `.agent.md` files via the orchestrator — researches existing patterns, guides design decisions, creates and validates the agent file
- Custom skill creation prompt (`/create-custom-skill`) for creating new `SKILL.md` files via the orchestrator — enforces gerund naming, creates supporting resources alongside the skill file
- Custom prompt creation prompt (`/create-custom-prompt`) for creating new `.prompt.md` files via the orchestrator — identifies correct agent routing, ensures prompt follows established patterns
- Custom instructions creation prompt (`/create-custom-instructions`) for creating new `.instructions.md` or `copilot-instructions.md` files via the orchestrator — helps decide between repo-level and file-scoped instructions

### Changed

- Creating Agents, Creating Skills, Creating Prompts, and Creating Instructions skills marked as internal (agent-only) — hidden from the slash command menu via `user-invokable: false` in SKILL.md frontmatter while remaining accessible to agents
- New `/create-custom-*` prompts serve as the recommended user-facing entry points for Copilot customization workflows, replacing direct skill invocation

## 2026-03-01

### Changed

- Restructured README around the full product development lifecycle: Product Ideation → Development → Quality
- Reorganized Agents, Skills, and Prompts sections into lifecycle phase groups (Product Ideation, Development, Quality)
- Moved Context Engineer from Product Ideation to Development agents
- Renamed "Backlog" phase to "Product Ideation" across the entire README
- Updated workflow examples to show `/research` under Development (not Product Ideation)
- Replaced flat prompt/agent listings with per-phase tables in "Using This Repository" section
- Updated Summary to reflect full lifecycle framing
- Renamed agent: `tsh-workshop-analyst` → `tsh-business-analyst`
- Renamed agent: `tsh-business-analyst` → `tsh-context-engineer` (old Business Analyst became Context Engineer)
- Renamed prompt: `/workshop-analyze` → `/analyze-materials`
- Renamed prompt: `/transcript-clean` → `/clean-transcript`
- Renamed prompt: `/code-quality-check` → `/review-codebase`
- Renamed prompt: `/e2e` → `/implement-e2e`
- Renamed skill: `task-extraction` → `task-extracting`
- Renamed skill: `task-quality-review` → `task-quality-reviewing`
- Renamed skill: `frontend-implementation` → `implementing-frontend`
- Renamed skill: `ui-verification` → `ui-verifying`
- Renamed skill: `architecture-design` → `architecture-designing`
- Renamed skill: `code-review` → `code-reviewing`
- Renamed skill: `codebase-analysis` → `codebase-analysing`
- Renamed skill: `implementation-gap-analysis` → `implementation-gap-analysing`
- Renamed skill: `task-analysis` → `task-analysing`

## 2026-02-27

### Added

- Copilot Engineer agent (`tsh-copilot-engineer`) for designing, creating, reviewing, and improving all GitHub Copilot customization artifacts — custom agents, skills, prompts, and instructions
- Copilot Orchestrator agent (`tsh-copilot-orchestrator`) for coordinating complex, multi-step Copilot engineering tasks by decomposing work into focused subtasks and delegating to specialized workers
- Copilot Researcher worker agent (`copilot-researcher`) for gathering, analyzing, and summarizing information from codebases and documentation — read-only research specialist for orchestrator delegation
- Copilot Artifact Creator worker agent (`copilot-artifact-creator`) for building and modifying Copilot customization artifacts based on detailed specifications — creation specialist for orchestrator delegation
- Copilot Artifact Reviewer worker agent (`copilot-artifact-reviewer`) for evaluating Copilot customization artifacts against best practices, workspace consistency, and structural correctness — review specialist for orchestrator delegation
- Orchestrator pattern documentation (`docs/orchestrator-pattern.md`) describing the orchestrator + specialized workers architecture as an alternative to monolithic agents, addressing context window degradation in complex multi-step tasks
- Creating Agents skill (`creating-agents`) with agent file template, structural conventions, and validation checklist for building `.agent.md` files
- Creating Skills skill (`creating-skills`) with naming conventions, body structure guidelines, progressive disclosure patterns, templates, and examples for building `SKILL.md` files
- Creating Prompts skill (`creating-prompts`) with prompt file template, workflow focus guidelines, and validation checklist for building `.prompt.md` files
- Creating Instructions skill (`creating-instructions`) with templates for repository-level and granular instruction files, decision framework for instruction vs. skill placement

### Changed

- Adopted gerund-form naming convention (`verb-ing` + `object`) as the standard for all skill directories, documented in README and enforced by the Creating Skills skill
- Existing skills will be adapted to follow the new gerund-form naming convention in separate upcoming pull requests

## 2026-02-24

### Added

- Workshop Analyst agent (`tsh-workshop-analyst`) for converting discovery workshop materials (transcripts, designs, codebase context) into Jira-ready epics and user stories
- Transcript Processing skill (`transcript-processing`) for cleaning raw workshop/meeting transcripts and extracting structured business-relevant content
- Task Extraction skill (`task-extraction`) for identifying and structuring epics and user stories from workshop materials
- Task Quality Review skill (`task-quality-review`) for analyzing extracted tasks for quality gaps, missing edge cases, and improvement opportunities
- Jira Task Formatting skill (`jira-task-formatting`) for transforming extracted tasks into Jira-ready format with field mapping and markdown compatibility
- Workshop analysis prompts: `/workshop-analyze`, `/transcript-clean`, `/create-jira-tasks`

## 2026-02-18

### Added

- SQL & Database engineering skill covering schema design (naming conventions, primary key strategies, data types, normalisation), performant SQL writing, indexing strategies, join optimisation, locking mechanics, transactions, query debugging with EXPLAIN ANALYZE, and ORM integration (TypeORM, Prisma, Doctrine, Eloquent, Entity Framework, Hibernate, GORM). Applies to PostgreSQL, MySQL, MariaDB, SQL Server, and Oracle

## 2026-02-17

### Added

- Frontend Implementation skill (`frontend-implementation`) for accessibility, design system usage, component patterns, and performance guidelines
- UI Verification skill (`ui-verification`) for verification criteria, tolerances, checklists, and severity definitions

### Changed

- Consolidated `tsh-frontend-software-engineer` agent into `tsh-software-engineer` - frontend capabilities are now handled via skills
- Updated `tsh-software-engineer` tool guidelines with frontend-specific scenarios (Figma, Playwright, design tokens)
- Made skills tool-agnostic by removing hardcoded tool names
- Refactored `implement-ui.prompt.md` and `review-ui.prompt.md` to reference skills instead of duplicating content

### Removed

- `tsh-frontend-software-engineer` agent (replaced by `tsh-software-engineer` + frontend skills)

## 2026-02-15

### Added

- Code quality check prompt (`/code-quality-check`) for comprehensive repository analysis covering dead code detection, duplication identification, improvement opportunities, and architecture review

## 2026-02-08

### Added

- Technical context discovery skill for codebase exploration and understanding

### Changed

- Refactored agents, prompts, and skills to follow a consistent standard
- Improved architecture-design plan example with expanded detail
- Updated implementation-gap-analysis and task-analysis examples
- Streamlined agent definitions by extracting workflow logic into prompts and skills

## 2026-02-07

### Added

- Skills support for modular, domain-specific agent capabilities (architecture-design, code-review, codebase-analysis, e2e-testing, implementation-gap-analysis, task-analysis)

### Changed

- Cleaned up repository structure

## 2026-02-05

### Changed

- Switched default model to Claude Opus 4.6
- Updated documentation for VS Code 1.109 compatibility

## 2026-02-03

### Removed

- GitHub MCP integration
- Copilot Spaces usage from agents

## 2026-01-29

### Fixed

- Updated tool names to follow new VS Code naming pattern

## 2026-01-21

### Fixed

- Updated Atlassian MCP URL to new recommended endpoint

## 2026-01-15

### Changed

- Removed "(Preview)" label from model names in all prompt files for consistency

## 2026-01-08

### Changed

- Updated package name

## 2026-01-07

### Changed

- Updated agent tools for improved functionality and testing capabilities

## 2025-12-18

### Added

- Frontend Software Engineer agent with UI implementation workflow
- UI implementation prompt with iterative UI verification process

## 2025-12-16

### Changed

- Standardized tool names across all agents

## 2025-12-15

### Changed

- Separated workflow instructions from agent identity definitions

## 2025-12-12

### Added

- Language consistency guidelines for agents

### Changed

- Code reviewer now runs automatically after implementation

## 2025-12-11

### Added

- Copilot Pro license requirement documentation

## 2025-12-10

### Changed

- Updated review prompt model to Claude Opus 4.5

## 2025-12-08

### Added

- Domain-specific Copilot Spaces support for agents
- Code reviewer as a subagent of the software engineer

## 2025-12-02

### Added

- VS Code version requirement documentation (1.99+)

### Changed

- Generalized software engineer agent (previously backend-specific)
- Standardized agent descriptions and enforced instructions usage
- Switched agents to use Claude Opus

## 2025-11-28

### Added

- Figma MCP Server integration for UI verification
- Git-committer agent with automated commit message generation

## 2025-11-26

### Added

- `tsh-` prefix for all agent names for namespace consistency
- Atlassian resource accessibility checks

## 2025-11-23

### Added

- Detailed MCP tool usage guidelines for all agents (Context7, Playwright, Figma, Atlassian)

## 2025-11-21

### Added

- Sequential Thinking MCP integration for complex problem-solving
- Data Engineer agent

## 2025-11-20

### Added

- MCP server configurations (Playwright, Context7, Figma Dev Mode, Atlassian)
- UI/Figma verification agent and review workflow
- Frontend Software Engineer agent (initial base)

## 2025-11-19

### Added

- MCP configuration for workspace and user-level setups
- LICENSE file and updated README

## 2025-11-14

### Added

- Agent-based architecture with handoffs (Architect, Business Analyst, Software Engineer, Code Reviewer)

### Changed

- Updated models to GPT-5.1 across prompts
- Specified Figma MCP usage in research workflow

## 2025-11-05

### Changed

- Planning prompt now focuses on tasks only, excluding improvements

## 2025-11-03

### Added

- New operational mode and additional tools

## 2025-10-31

### Changed

- Narrowed Atlassian/Jira access scope
- Enhanced planning and research prompts with implementation analysis guidelines

## 2025-10-29

### Added

- Plan prompt with task-specific implementation focus

## 2025-10-28

### Added

- Initial project setup with EditorConfig, Prettier, Husky, and Copilot configurations
- Automated commit message generation prompt
- Security review configuration and documentation
