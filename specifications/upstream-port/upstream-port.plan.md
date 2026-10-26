# Port of origin/main (PRs #65-#79) into the unified `src/` structure - Implementation Plan

## Contents

- [Task Details](#task-details)
- [Proposed Solution](#proposed-solution)
- [Upstream path ledger](#upstream-path-ledger)
- [Open Questions](#open-questions)
- [Technical Context](#technical-context)
- [Implementation Plan](#implementation-plan)
- [Quality Assurance](#quality-assurance)
- [Improvements (Out of Scope)](#improvements-out-of-scope)
- [Changelog](#changelog)

## Task Details

| Field | Value |
| --- | --- |
| Task ID | upstream-port |
| Title | Port the 34 upstream commits of origin/main into `src/` |
| Description | Semantic port of the owner's Copilot-collections PRs #65-#79 (old `.cursor/skills` layout) onto `refactor/unified-agent-structure`. No git merge of content; the last step is `git merge -s ours origin/main`. |
| Related Research | `analysis-agents.md`, `analysis-skills.md`, `analysis-docs.md` (same folder) |
| Branch / base | `refactor/unified-agent-structure` @ fc29c80; upstream range `324d2fd..origin/main` |

## Proposed Solution

Apply the semantic delta to `src/`, regenerate, and keep the layering rules (one delegation level, leaf agents, flat name references, tool-neutral wording). Decisions 1-15 of the brief are fixed; this plan only operationalises them.

### Resulting design

1. **Approval gate.** `tsh-engineering-manager` (main thread) runs the ONE gate for plan-based work after the plan review loop (max 3) settles: `Approve plan` / `I have comments` / `Stop`. It delegates `TASK: record_human_approval` (verbatim user answer) to `tsh-architect`, which alone writes the `## Human Approval` table. The EM re-reads the record before each file-changing delegation and reuses a valid one. Material revision: architect bumps `Plan Revision`, sets `PENDING`, logs the Changelog; EM halts file-changing delegation and re-asks; no automatic re-review. No "new discussion" rule.
2. **Precondition partial** `human-approval-precondition`, included by seven executors (`tsh-software-engineer`, `tsh-plan-implementor`, `tsh-ui-engineer`, `tsh-e2e-engineer`, `tsh-devops-engineer`, `tsh-prompt-engineer`, `tsh-technical-writer`). It applies only when the delegation carries `PLAN: <path>` and `PLAN_REVISION: <n>` lines. No `PLAN:` line = plan-less work (Quick flow, `/tsh-implement` without a plan, `/tsh-debug`, audits, cost commands) and the partial is a no-op. Plan-based and invalid/missing/stale/PENDING record: interactive mode asks the four options (point at the plan, request approval via `/tsh-implement`, back to `/tsh-architect`, stop); delegated mode returns `BLOCKED` with `BLOCKER` naming the failed field/condition/file. Valid record = `Human Decision: APPROVED`, `Approved Revision` = `Plan Revision`, `Decision Timestamp` ISO 8601 UTC with `Z`.
3. **Routing (kept in `tsh-engineering-manager/references/task-routing.md`).**

| Task (plan-based unless stated) | Delegate | Rule |
| --- | --- | --- |
| App code, NON-UI, "actionable low-risk seam" | `tsh-plan-implementor` (default) | Seam = the task lists `Files`, has a runnable DoD command, a Stop Rule, no open question, touches at most 5 files, and involves no new architecture decision, public API, schema or migration, auth/security, concurrency or cross-cutting change |
| App code, NON-UI, complex / exception | `tsh-software-engineer` | Anything failing the seam test; the plan-implementor returned `NEEDS_ARCHITECT_DECISION` twice for the same task; refactor-mode tasks |
| UI task (Figma URL, or any rendered-UI change) incl. UI fix passes | `tsh-ui-engineer` | Regardless of complexity; `tsh-software-engineer` and `tsh-plan-implementor` never edit UI |
| Plan-less work (Quick flow, `/tsh-implement <description>`, `/tsh-debug`) | `tsh-software-engineer` (non-UI) / `tsh-ui-engineer` (UI) | No `PLAN:` line, no gate |
| E2E / infra, K8s, CI-CD, observability / LLM prompts / documentation | `tsh-e2e-engineer` / `tsh-devops-engineer` / `tsh-prompt-engineer` / `tsh-technical-writer` | Documentation = README, CHANGELOG, `/docs`, docs site; never `src/` skills/agents (those stay with the `tsh-ai-customization-*` flow) |
| `[REUSE]` UI verification | EM runs `tsh-orchestrate-ui-verification` | One item at a time, never batched |

   Escalation: plan-implementor fails or is `BLOCKED` for a non-approval reason after the loop cap of 3 -> one re-route to `tsh-software-engineer`; after that stop and ask the user.
4. **UI loop (EM-owned, cap 5, separate from the cap 3 loops).** `tsh-ui-engineer` (implement) -> `tsh-ui-capture-worker` (artifacts) -> `tsh-ui-reviewer` (reads artifacts; PASS / FAIL / `VERIFICATION NOT RUN`) -> `tsh-ui-engineer` (fix with the full report) ... `VERIFICATION NOT RUN` and LOW-confidence pauses do not consume an iteration; after 5 FAILs a 3-choice gate (continue N more / stop and mark `ESCALATED` / custom). Before each capture the EM deletes the three ACTUAL files (never `figma-expected.png`), so existence = freshness. `/tsh-review-ui` routes to `tsh-engineering-manager` in a UI-only mode: one pass, no fixes, no plan, no gate.
5. **Plan contract** goes into `src/skills/tsh-designing-architecture/assets/plan.template.md` and the planning rules (no new skill).
6. **Playwright.** `tsh-using-playwright-cli` (knowledge skill, vendored text adapted) is used only by `tsh-ui-capture-worker`. The authenticated-capture rules have ONE owner: `tsh-verifying-ui/references/authenticated-capture.md`. The `playwright` MCP stays for E2E and ad hoc use.
7. **Capture worker credentials.** Never reads any `.env` file. It reads `TSH_UI_LOGIN_<FIELD>` from the process environment (field key derived `name -> autocomplete -> id -> label`, upper-cased, non-alphanumerics to `_`). Missing variables: `NEEDS_INPUT` with the exact names in `QUESTIONS` ("export them in the shell that starts the tool, then re-run").

### Counts after the port (verify with `npm run generate`)

| Type | Now | After |
| --- | --- | --- |
| Subagents | 17 | 21 (+ plan-implementor, technical-writer, ui-engineer, ui-capture-worker) |
| Orchestrators | 3 | 3 |
| Commands | 16 | 16 |
| Internal steps | 2 | 3 (+ `tsh-write-documentation`) |
| Knowledge skills | 41 | 43 (+ `tsh-writing-documentation`, `tsh-using-playwright-cli`) |

## Upstream path ledger

Fate legend: PORTED (to target), MERGED (into target), DROPPED (reason), NOOP (diff only mechanical/obsolete). "G" = owning group below; "S" = final sequential task.

### `.cursor/skills/agents/*`

| Upstream | Fate | Target / reason | Owner |
| --- | --- | --- | --- |
| tsh-architect | PORTED | `src/agents/tsh-architect.md`: artifact paths, self-check (6 BLOCKER categories), blocker disposition, human approval record (writer role), material-change classification. Dropped: nested reviewer call, XML verdict, discussion boundary, low-risk review exemption (our loop stays) | G1 |
| tsh-plan-reviewer | PORTED | `src/agents/tsh-plan-reviewer.md` + `tsh-reviewing-plans` (six categories, ineligible list, revision-bound verdict in STATUS SUMMARY, no XML) | G1 |
| tsh-engineering-manager | MERGED | `src/skills/tsh-engineering-manager/` (+ `references/task-routing.md`, `references/plan-approval.md`) | G4 |
| tsh-software-engineer | PORTED | non-UI scope, drop `figma` and `playwright` MCP, frontend skills, version-control-safety, precondition | G2 |
| tsh-ui-engineer, tsh-ui-capture-worker | PORTED (new) | `src/agents/` | G3 |
| tsh-ui-reviewer | PORTED | artifact-based, read-only, drop `playwright` | G3 |
| tsh-plan-implementor, tsh-technical-writer | PORTED (new) | `src/agents/` | G2 |
| tsh-code-reviewer | PORTED | recall sentence, N+1 hint, UI fix routing text | G2 |
| tsh-devops-engineer, tsh-e2e-engineer, tsh-prompt-engineer | PORTED | precondition include, defect routing text (e2e) | G2 |
| tsh-context-engineer, tsh-business-analyst, tsh-ba-*-worker (5) | NOOP | XML restructure / model-prose removal only; refactor already free of both | - |
| tsh-cursor-orchestrator | PORTED | cadence + delegation-economy text into `tsh-ai-customization-orchestrator` | G4 |
| tsh-cursor-researcher, -artifact-creator, -artifact-reviewer | NOOP | XML/tool-block wording only | - |
| tsh-cursor-engineer | DROPPED | agent deleted in the refactor (quick mode of the ai-customization orchestrator) | - |

### `.cursor/skills/{commands,internal,workflows}/*`

| Upstream | Fate | Target / reason | Owner |
| --- | --- | --- | --- |
| commands/tsh-implement | NOOP + small | stays thin; add "plan-based work passes the approval gate; Quick flow unchanged" line | G4 |
| commands/tsh-review-ui | PORTED | `tsh-review-ui`: `routes-to: tsh-engineering-manager`, UI-only mode, inputs, never-empty verdict | G3 |
| commands/tsh-analyze-aws-costs, -gcp-costs, tsh-audit-infrastructure | PORTED | degraded mode and `tsh-managing-secrets` gate into `tsh-analyze-cloud-costs`, `tsh-audit-infrastructure` (+ `tsh-optimizing-cloud-cost` reference) | G5 |
| commands/tsh-create-custom-command | NOOP | already fixed | - |
| internal/tsh-implement-ui | MERGED | `tsh-orchestrate-ui-verification` | G3 |
| internal/tsh-implement-ui-common-task | MERGED | Figma-before-code gate into `tsh-implement-task` "UI tasks (Figma)" | G2 |
| internal/tsh-plan | NOOP | already folded in `tsh-designing-architecture` | - |
| internal/tsh-write-documentation | PORTED | `src/skills/tsh-write-documentation/` (type internal) | G2 |
| internal/tsh-deploy-kubernetes, -implement-observability, -implement-pipeline, -implement-terraform | NOOP | folded into `tsh-delivering-infrastructure`; diff was only the resolving note | - |
| workflows/tsh-orchestrating-implementation | MERGED | into the EM (see G4) | G4 |
| workflows/tsh-creating-implementation-plans + plan.example.md | MERGED | into `tsh-designing-architecture` + `assets/plan.template.md` (no new skill) | G1 |
| workflows/tsh-architecture-designing (+ deleted plan.example.md) | PORTED | planning rules in `tsh-designing-architecture` | G1 |
| workflows/tsh-resolving-skill-references | DROPPED | by-name loading solves it; keep one fail-loud sentence in `agent-modes` / `caller-status-handling` | G1 |
| workflows/playwright-cli (+10 references) | PORTED | `tsh-using-playwright-cli` (SKILL.md + 10 references, `## Contents` where > 100 lines; auth section moved out; `allowed-tools` dropped) | G3 |
| workflows/tsh-ui-verifying | PORTED | `tsh-verifying-ui` + `references/cli-capture-flow.md`, `references/authenticated-capture.md`, report template | G3 |
| workflows/tsh-implementing-frontend | PORTED | Step 0 Figma gate | G3 |
| workflows/tsh-writing-documentation | PORTED | `src/skills/tsh-writing-documentation/` | G2 |
| workflows/tsh-code-reviewing | PORTED | `tsh-reviewing-code`: recall rule, N+1 / in-memory anti-patterns, integration-coverage rule | G2 |
| workflows/tsh-creating-agents (+agent.template.md), -commands | NOOP | XML mandate not adopted; by-name rule already in AGENTS.md | - |
| workflows/tsh-creating-skills | PORTED if absent | confirm by-name checklist bullet exists, else add one | G5 |
| workflows/tsh-migrating-copilot-to-cursor | PORTED | two short sections in `tsh-migrating-copilot-customizations` ("Porting a PR", "Divergence from upstream") | G5 |

### Rules, config, root files

| Upstream | Fate | Target / reason | Owner |
| --- | --- | --- | --- |
| .cursor/rules/tsh-naming-conventions.mdc, imported copy, cursor-instructions.md | MERGED | one sentence in `AGENTS.md` (prefix scope: skill dirs, agent files; support files named by topic). No vendored-name exception | G1 |
| .cursor/mcp.json (unchanged upstream) | NOOP | `playwright` stays in `src/mcp/servers.json` | - |
| .gitignore | PORTED partly | add `.playwright-cli`, `.env`, `.env.*` (keep existing `.env*.local`), `auth.json`, `*-auth.json`, `*auth-state.json`, `*session.json`, `storage-state-*.json`. REJECT `specifications/` | G5 |
| README.md | PORTED | agent/skill rows, UI flow + `playwright-cli` prerequisite, counts, Cursor-scoped thinking-effort table | S2 |
| CHANGELOG.md | PORTED | NEW top entry dated 2026-10-26 (new names only); upstream dated entries are not copied (old layout history stays in git) | S2 |
| code-quality-report.md | DROPPED | obsolete, old paths and counts; refactor keeps its own under `specifications/code-quality/` | - |
| website/src/pages/changelog.md | PORTED | regenerated snapshot of CHANGELOG.md | S2 |

### `website/docs/*`

| Upstream | Fate | Target | Owner |
| --- | --- | --- | --- |
| agents/plan-implementor, technical-writer, ui-capture-worker, ui-engineer (new) | PORTED | `website/docs/agents/` (flattened roles) | G5 |
| agents/architect, plan-reviewer, ui-reviewer, software-engineer, engineering-manager, devops/e2e/prompt-engineer | PORTED | rewritten per refactor roles | G5 |
| agents/context-engineer, cursor-artifact-*, cursor-engineer | NOOP / DROPPED | obsolete wording / deleted agent | - |
| agents/overview | PORTED | roster + counts | S2 |
| getting-started/faq (new) | PORTED | tool-neutral rewrite; Cursor-only answers moved to a "Cursor" subsection | G5 |
| getting-started/mcp-setup, prerequisites, quick-wins | PORTED | Playwright row, `playwright-cli` prerequisite, `TSH_UI_LOGIN_*` note | G5 |
| integrations/overview, playwright | PORTED | MCP vs CLI split (key `mcpServers`) | G5 |
| intro, use-cases | PORTED | counts in `intro.md` -> S2; use-cases sentence -> G5 | G5 / S2 |
| prompts/internal/implement-ui | PORTED | `commands/internal/orchestrate-ui-verification.md` | G5 |
| prompts/internal/plan, research | NOOP | folded | - |
| prompts/internal/review-plan (deleted upstream) | NOOP | never existed here | - |
| prompts/overview, public/implement, public/review-ui | PORTED | `commands/overview.md` (counts -> S2), `implement.md`, `review-ui.md`; new `commands/internal/write-documentation.md` | G5 / S2 |
| skills/architecture-design, ui-verification | PORTED | `designing-architecture.md`, `verifying-ui.md` | G5 |
| skills/creating-implementation-plans | DROPPED | no such skill; covered by `designing-architecture.md` | - |
| skills/writing-documentation (new) | PORTED | `skills/writing-documentation.md`; new `skills/using-playwright-cli.md` | G5 |
| skills/overview | PORTED | rows + counts | S2 |
| skills/creating-agents, migrating-copilot-to-cursor | DROPPED | refactor keeps `model-tier` | - |
| workflow/overview, standard-flow, e2e-flow, frontend-flow | PORTED | gate, roster, UI loop wording | G5 |
| workflow/ui-verification-flow (new) | PORTED | rewritten for the flattened loop (diagrams stay code blocks; no Mermaid plugin) | G5 |

## Open Questions

| # | Question | Answer | Status |
| --- | --- | --- | --- |
| 1 | Does the Cursor/Codex read-only agent open PNG files for the reviewer? | Reviewer is read-only and needs `actual.png` + `figma-expected.png`. Spike in G3 task 3.8; fallback: reviewer judges from `figma` node view plus `computed-styles.json` + `a11y-snapshot.yml` and reports `VERIFICATION NOT RUN` if the PNG cannot be read | Open (G3 spike, not blocking) |
| 2 | Do Cursor and Codex ever propagate shell environment variables to the capture worker? | Claude Code inherits the launching shell env. Cursor/Codex unverified; if the variables are not visible the worker returns `NEEDS_INPUT` (same path). Document "start the tool from a shell where the variables are exported" | Open (documented risk) |
| 3 | Installer: `playwright-cli` has no `tsh-` prefix, so legacy cleanup (prefix-based) would leave `.cursor/skills/workflows/playwright-cli` behind | Task 1.7 adds an `unprefixed` list to `legacy-names.json` honoured only inside the old category folders (exact name match) | Resolved by plan |
| 4 | Does `git check-ignore` need to gate the artifact root (analysis proposal, not upstream)? | Yes, in `authenticated-capture.md` and the worker: when `<specs>/<task>/ui-verification` is not git-ignored, return `NEEDS_INPUT` asking the user to ignore it (screenshots of an authenticated app) | Resolved by plan |

## Technical Context

### Project Instructions

- `AGENTS.md`: edit `src/` only; run `npm run generate`; never baseline new lint/refs findings; commits follow the table in AGENTS.md (one commit per group task, `src/` together with regenerated outputs).
- Neutral wording in `src/`: no `@tsh-`, "Task tool", model names, `.cursor/skills` paths. Agent bodies must not contain "delegate to", "spawn*", "subagent(s)" (lint `agent-no-delegation`; allow-list is not extended). Write "your caller" and "delegated mode".
- Frontmatter limits: `preload-skills` at most 2, each named in the body; read-only agents get Claude `disallowedTools`; `SKILL.md` <= 500 lines; `references/` files > 100 lines start with `## Contents`; knowledge skill names `tsh-<gerund>-...`; `metadata.short-description` <= 120 chars; descriptions of `skill`/`command` contain "Use when".
- Orchestrators and agent-routed commands include `caller-status-handling`; agents include `agent-modes`.

### Tech Stack

- Node >= 22 ESM generator (`scripts/generate.mjs`, `lint.mjs`, `check-refs.mjs`, `install.mjs`), `node --test`, Docusaurus website (`website/`, hand-authored pages, autogenerated sidebar by `sidebar_position`).

### Testing Patterns

- `npm run generate`, `npm run check`, `npm test` (Node 26) and `npx -y node@22 --test "scripts/test/*.test.mjs"`, `npm --prefix website run build`.
- Contract tests read the real tree: `scripts/test/repo-contracts.test.mjs` (G1 only), new per-group files `scripts/test/port-agents.test.mjs` (G2), `port-ui.test.mjs` (G3), `port-manager.test.mjs` (G4).

## Implementation Plan

### Execution model

- **Integration branch** `port/upstream` created from HEAD by the parent. Wave 0 is committed there first, then each group works in its own git worktree branched from the Wave 0 commit: `port/g1-contracts`, `port/g2-implementors`, `port/g3-ui`, `port/g4-manager`, `port/g5-docs`.
- **Disjoint file ownership.** A group never edits a file owned by another group. Generated trees (`.agents`, `.claude`, `.cursor/agents`, `.claude/agents`, `.codex`) are NOT committed by groups 2-5 (they would conflict): each group runs `npm run generate` locally for its own gate but commits only `src/`, `scripts/`, `website/`, docs. The generated outputs are committed once in S1 (task S1.2) after all branches are merged.
- **Ordering constraints.**
  1. Wave 0 (G1 tasks 1.1-1.2: the two new partials and the fail-loud edit) precedes every other group, because agents include them and `npm run check` fails on unknown includes.
  2. Wave 1 = G1 (rest), G2, G3, G4, G5 in parallel. Names that cross groups are fixed by this plan (agent names, skill names, `PLAN:`/`PLAN_REVISION:` lines, `TASK: record_human_approval`, `UI_VERIFICATION_DIR`, `TSH_UI_LOGIN_*`, file names under `references/`), so no group needs another group's files to write its own.
  3. Wave 2 (sequential, parent): S1 merge + generate + gates, then S2 counts and top-level docs, then S3 final gates, then S4 `merge -s ours`.
  4. Merge order in S1: G1, G2, G3, G4, G5 (G4 and G3 both reference each other only by name; G5 last because `check-refs --docs` needs all names).
- **Each task's Definition of Done includes** `npm run check` passing on the group branch, except where it can only pass after S1 (marked "after S1").

### Phase 0: Preparation (parent)

#### Task 0.1 - [CREATE] Integration branch and worktrees

**Description**: Create `port/upstream` from HEAD; commit this plan; create the five worktrees after Wave 0.

**Definition of Done**:

- [ ] `git worktree list` shows five group worktrees on distinct branches; `git status` clean on the integration branch

### Phase 1: Wave 0 - shared partials (G1 tasks 1.1-1.2, committed first)

#### Task 1.1 - [CREATE] `src/partials/human-approval-precondition.md`

**Description**: Neutral text, no delegation words. Sections: when it applies (only with `PLAN:` and `PLAN_REVISION:` lines; otherwise "no plan: proceed as your role says"), the validation predicate (read the plan from disk, never trust the caller's claim), interactive branch (four options), delegated branch (`BLOCKED` with `BLOCKER` naming the failed field, condition or file; never ask), "direct invocation does not bypass", "read-only work is exempt", "reviewer APPROVED is not human approval". Include this partial's marker once per executor.

**Files**: create `src/partials/human-approval-precondition.md`.

**Stop Rule**: stop if `scripts/lib` include resolution rejects a new partial name; report the loader error.

**Definition of Done**:

- [ ] File exists, no banned words (`delegate to`, `spawn`, `subagent`); `grep -c "Approved Revision" ` >= 1
- [ ] Also create `src/partials/version-control-safety.md` (never `git clean`, `restore`, `checkout --`, `reset`, `stash`; treat the working tree as found; delete files with normal edits; uncommitted changes that block the task -> delegated `BLOCKED`, interactive: ask; tests/builds only for the task) and record it in the same commit

#### Task 1.2 - [MODIFY] fail-loud sentence in shared partials

**Description**: `src/partials/agent-modes.md`: one sentence "If a skill you were told to load cannot be loaded, do not continue from general knowledge: interactive - tell the user; delegated - return `BLOCKED` naming the skill." `src/partials/caller-status-handling.md`: "A missing skill is a stop, not a skip", plus a note that the plan review loop (3), code-review loop (3) and UI loop (5) have their own caps and gate re-asks after a material revision are not review iterations.

**Definition of Done**:

- [ ] Both sentences present exactly once; `scripts/test/repo-contracts.test.mjs` still green (existing regexes untouched)

### Phase 2: Group G1 - Contracts, planning, review, shared files

Owns: `src/partials/*` (all), `src/skills/tsh-designing-architecture/**`, `src/skills/tsh-reviewing-plans/**`, `src/agents/tsh-architect.md`, `src/agents/tsh-plan-reviewer.md`, `AGENTS.md`, `scripts/legacy-names.json`, `scripts/install.mjs`, `scripts/test/repo-contracts.test.mjs`, `scripts/test/install.test.mjs`, `src/config/targets.json` (expected: no edit).

#### Task 2.1 - [MODIFY] `assets/plan.template.md` (plan contract)

**Description**: Keep `Task ID`, `Behavior-preserving`, the `To Be Created / Modified / Reused` order and the `#### Task N.M - [CREATE/MODIFY/REUSE]` headings (contract test and gap-analysis skill depend on them). Add: `## Wildly Important Goal` (Goal, Success Measure, Do NOT touch / add) after Task Details; `## Human Approval` table (`Plan Revision`=1, `Human Decision`=PENDING, `Approved Revision`, `Decision Timestamp` UTC `Z`, `Note`) with a plain-text protocol comment (no XML tag) after Open Questions; per phase `**Goal**`, `**Description**`, `**Verification**`; per task `**Files**` (create/modify/reuse, with back-references "modify - created in Task 1.1"), `**Stop Rule**`, `**Clues**` (optional); DoD rule (at least one reviewer-verifiable check; code tasks use a runnable command taken verbatim from Technical Context, docs/config tasks may use a grep-style assertion); a UI task block with `**UI Verification Status**` (component, iterations used, final status `PASSED | ESCALATED | VERIFICATION NOT RUN`, Figma URL) and the verification task text rewritten for the flattened loop (capture worker, then `tsh-ui-reviewer`, fixes by `tsh-ui-engineer`, cap 5, run by the engineering manager via `tsh-orchestrate-ui-verification`); an explicit final phase `Code review` (run `/tsh-review` equivalent through the EM; UI gate reported separately); dispatch-gate comment block (no `❓ Open` row, no angle-bracket placeholder or assumed-default command in Verification/DoD/Files, no real code, pseudo-code only for complicated algorithms). Update the `## Contents`.

**Files**: modify `src/skills/tsh-designing-architecture/assets/plan.template.md` (grows to about 280 lines; keeps `## Contents`; ends with newline).

**Stop Rule**: stop if the existing contract test or `tsh-analyzing-implementation-gaps` terms would need to change.

**Definition of Done**:

- [ ] `grep -c "## Human Approval\|## Wildly Important Goal\|UI Verification Status\|Stop Rule" assets/plan.template.md` shows all four
- [ ] `npm test -- scripts/test/repo-contracts.test.mjs` equivalent passes (`node --test scripts/test/repo-contracts.test.mjs`)

#### Task 2.2 - [MODIFY] `tsh-designing-architecture/SKILL.md` planning rules

**Description**: Add to the planning rules: Open Questions dispatch gate, executable-slots gate, no real code, `Files` + `Stop Rule` per task, `Human Approval` section owned by the architect (material revision bump rules; the architect records only a literal decision and never infers consent), UI Verification Status, six BLOCKER categories as the pre-submission self-check (list lives here, `tsh-reviewing-plans` references it by name), the seam definition used by routing (so the plan states per task whether it is an "actionable low-risk seam": `Files` listed, runnable DoD, Stop Rule). Keep <= 140 lines.

**Definition of Done**:

- [ ] SKILL.md <= 500 lines; `npm run lint` shows no new finding for it

#### Task 2.3 - [MODIFY] `tsh-reviewing-plans` + `tsh-plan-reviewer`

**Description**: Skill: add the six canonical BLOCKER categories as the exhaustive BLOCKER list (1 requirement/scope contradiction, 2 architecture or technology choice contradicting research or project instructions, 3 security or data-loss risk without mitigation, 4 no safety proof - verification missing or cannot detect failure, 5 unexecutable task - missing seam, circular dependency or unresolvable `Open` question, 6 irreversible step without rollback); the ineligible list (grep syntax, diff-hunk counts, style, template conformance, `Files` bookkeeping, wording, doc sync, report verbosity); finding discipline (criterion, evidence, consequence, minimum correction); early exit when any `Open` row exists (BLOCKER, still write the report); read research first, then plan; read `Plan Revision` verbatim (or `unknown`, which forces `REVISIONS NEEDED`); advisory notes. Demote the existing "over-engineering" BLOCKER (`SKILL.md:78` area) to WARNING. Report template header gains `Reviewed Plan Revision`. Agent: add "never state or evaluate human approval", "one write only: the report; never edit the plan", and the return contract: `SUMMARY: VERDICT: APPROVED|REVISIONS NEEDED; REVIEWED_PLAN_REVISION: <n|unknown>; BLOCKERS/WARNINGS/SUGGESTIONS: a/b/c`, report path in `ARTIFACTS`. Frontmatter unchanged (`deep`, read-write, no shell, `context7`, `sequential-thinking`, preload `tsh-reviewing-plans`).

**Definition of Done**:

- [ ] Template and agent mention `REVIEWED_PLAN_REVISION`; the six categories appear in exactly one file (the skill); no XML verdict tag anywhere

#### Task 2.4 - [MODIFY] `tsh-architect` agent

**Description**: Keep frontmatter (`deep`, read-write, shell true, MCP unchanged, preload `tsh-designing-architecture`). Add sections: `## Plan artifact paths` (use the caller's paths; interactive default `<specs>/<task>/<task>.plan.md`, `.research.md`, `.plan-review.md`), `## Pre-submission self-check` (pointer to the skill's six categories), `## Disposition of review blockers` (per eligible BLOCKER exactly one of resolve / accept with evidence / escalate - delegated: `NEEDS_INPUT`; append-only dated entries in the plan-review file; never drop or downgrade), `## Human approval record` (task `record_human_approval`: write the literal decision, `Approved Revision` = current, UTC-Z timestamp; `CHANGES_REQUESTED` before any edit; never paraphrase consent; never write approval into the review file or reviewer verdict into the table; interactive mode: may ask `Approve plan` / `I have comments` and record, then end with "Suggested next steps: `/tsh-implement`"), `## Material revision` (classification, bump, `PENDING`, Changelog), one sentence that it answers `DECISION_NEEDED` with a recorded decision. No reviewer call.

**Definition of Done**:

- [ ] Body contains none of the lint-banned delegation words; `npm run lint` clean for the file

#### Task 2.5 - [MODIFY] `AGENTS.md` prefix scope

**Description**: Add to the Naming section: "The `tsh-` prefix applies to skill directory names, agent file names; support files under `references/`, `assets/`, `scripts/` are named for their topic." Nothing else.

**Definition of Done**:

- [ ] `grep -c "named for their topic" AGENTS.md` = 1

#### Task 2.6 - [MODIFY] `scripts/legacy-names.json`

**Description**: `renamed`: `tsh-orchestrating-implementation` -> `tsh-engineering-manager`. `deleted`: `tsh-creating-implementation-plans`, `tsh-resolving-skill-references`. `nowSubagents`: `tsh-plan-implementor`, `tsh-technical-writer`, `tsh-ui-engineer`, `tsh-ui-capture-worker`. New key `unprefixed`: `["playwright-cli"]`. `tsh-write-documentation` / `tsh-writing-documentation` are current names and need no entry (cleanup skips current names).

**Definition of Done**:

- [ ] JSON valid; keys unique; no entry equals a current source name except where the installer logic ignores it

#### Task 2.7 - [MODIFY] installer: `unprefixed` legacy names

**Description**: In `scripts/install.mjs` `cleanupLegacy`, inside the old category-folder loop (step b), also retire an entry whose exact name is in `unprefixed`; keep `loadLegacyNames` returning the prefixed set unchanged and add a second small loader. Add one test in `scripts/test/install.test.mjs` (category folder `workflows/playwright-cli` is retired and backed up; an unrelated `workflows/my-skill` is not).

**Files**: modify `scripts/install.mjs`, `scripts/test/install.test.mjs`.

**Stop Rule**: if the change needs more than ~15 lines, record the gap in the CHANGELOG known-limits instead (task S2.1) and skip.

**Definition of Done**:

- [ ] Node 22 and 26 `node --test scripts/test/install.test.mjs` green

#### Task 2.8 - [MODIFY] `scripts/test/repo-contracts.test.mjs`

**Description**: Add contract tests: the plan template contains the new sections and ends with a newline; `human-approval-precondition` and `version-control-safety` text each live in exactly one `src/partials` file and every one of the seven executors includes the former (`<!-- include: human-approval-precondition -->`), and `tsh-plan-implementor` and `tsh-software-engineer` include the latter; `tsh-reviewing-plans` is the only holder of the six categories; `legacy-names.json` contains the new subagent names. These tests fail until S1 merges the other groups: mark the include assertions to run in S1 (they are the S1 gate).

**Definition of Done**:

- [ ] Template/partial/legacy tests pass on the G1 branch; include assertions pass after S1

### Phase 3: Group G2 - Implementors, documentation, code review

Owns: `src/agents/tsh-{plan-implementor,technical-writer,software-engineer,e2e-engineer,devops-engineer,prompt-engineer,code-reviewer}.md`, `src/skills/tsh-{writing-documentation,write-documentation,implement-task,reviewing-code}/**`, `scripts/test/port-agents.test.mjs`.

#### Task 3.1 - [CREATE] `src/agents/tsh-plan-implementor.md`

**Description**: Frontmatter: `type: agent`, `model-tier: fast`, `access: read-write`, `shell: true`, no `requires-mcp`, `preload-skills: [tsh-implement-task]`, description "Executes exactly one delegated plan task ... Use when the engineering manager delegates an approved, actionable, low-risk plan task". Body sections: `# Plan Implementor`, `## Role` (execute exactly as written; if the request looks mistaken say so briefly and continue as written; one task at a time, never later phases), `## Constraints` (no invented seams, fallbacks or extra files; stay inside the task `Files`; stop on a missing seam or ambiguity), `<!-- include: agent-modes -->`, `<!-- include: plan-progress -->` (only the delegated scope's checkboxes), `<!-- include: version-control-safety -->`, `<!-- include: human-approval-precondition -->`, `## Skills usage` (`tsh-implement-task` preloaded; `tsh-discovering-technical-context`, `tsh-analyzing-implementation-gaps`, `tsh-analyzing-codebase` on demand), `## Status mapping` (`DONE`; `NEEDS_ARCHITECT_DECISION` for ambiguity or missing seam; `NEEDS_INPUT` for input only the user has; `BLOCKED` for an invalid approval record or a version-control conflict), `## Output format`.

**Definition of Done**:

- [ ] Generated Claude file has `disallowedTools: [Agent]`; Codex TOML contains the agent-modes text; lint clean

#### Task 3.2 - [CREATE] `src/agents/tsh-technical-writer.md`, `src/skills/tsh-writing-documentation`, `src/skills/tsh-write-documentation`

**Description**: Agent: `model-tier: fast`, `access: read-write`, `shell: true`, no `requires-mcp`, `preload-skills: [tsh-write-documentation, tsh-writing-documentation]`. Sections: Role (owns README, CHANGELOG, in-repo `/docs`, published docs site; never product code; never generated outputs nor `src/` skills/agents), Responsibilities and Boundaries, modes include, `plan-progress`, `human-approval-precondition`, Skills usage (`tsh-discovering-technical-context`, `tsh-analyzing-codebase`, `tsh-creating-rules` on demand), "docs that need a code change: `BLOCKED` naming the dependency", Output format (files changed, one line each, build/link-check result, open dependencies). Skill `tsh-writing-documentation` (type skill, about 80 lines, "Use when", `short-description`): accuracy over volume, mirror sibling pages and their frontmatter, internal links must resolve (build failure is a failure, never invent targets), busy-reader craft, 5-step workflow, write-versus-review boundary, connected skills. Internal step `tsh-write-documentation` (type internal, "Internal step of the technical writer; load only when instructed"): inputs, scope, procedure, escalation (`NEEDS_INPUT`/`BLOCKED`), plan synchronisation, output format. Not "repo-specific website shape" - say "match sibling pages".

**Definition of Done**:

- [ ] `npm run lint` clean for names (`tsh-writing-documentation` passes `naming-by-type`, `tsh-write-documentation` passes internal naming); both skills named in the agent body

#### Task 3.3 - [MODIFY] `tsh-software-engineer`

**Description**: `requires-mcp: [context7, sequential-thinking]` (drop `figma`, `playwright`); `model-tier: deep` unchanged; `preload-skills: [tsh-implement-task]` unchanged. Body: scope "NON-UI: backend, API, database, business logic; UI belongs to `tsh-ui-engineer`"; "complex / exception route" wording; constraints "do not broaden the task", "do not invent details not in the plan"; remove the frontend skill entries (`tsh-implementing-frontend`, `-forms`, `tsh-writing-hooks`, `tsh-ensuring-accessibility`, `tsh-optimizing-frontend`), the Figma/Playwright tool lines (lines ~85) and the "Frontend/UI tasks" ask rules; add includes `version-control-safety`, `human-approval-precondition` (no-plan sentence replaced by the partial's scope rule; `/tsh-debug` keeps working); add `tsh-implementing-backend` to on-demand skills.

**Definition of Done**:

- [ ] Generated `.claude/agents/tsh-software-engineer.md` has no `figma`/`playwright`; `/tsh-debug` text still says no plan is required

#### Task 3.4 - [MODIFY] `tsh-implement-task`

**Description**: In "UI tasks (Figma)": add the hard gate (before the first UI edit resolve the exact node and inspect it through a real Figma tool call; a URL in the plan is not enough; delegated + unresolvable node -> `NEEDS_INPUT`); add a line "skip this section for non-UI work"; keep the "No plan provided" section (Quick flow).

**Definition of Done**:

- [ ] `grep -n "real Figma tool call\|skip this section" src/skills/tsh-implement-task/SKILL.md` finds both

#### Task 3.5 - [MODIFY] `tsh-e2e-engineer`, `tsh-devops-engineer`, `tsh-prompt-engineer`

**Description**: Add `<!-- include: human-approval-precondition -->` to each; e2e: `## Suggested next steps` says defects found by tests go to `/tsh-implement` (EM routes non-UI to `tsh-software-engineer`, UI to `tsh-ui-engineer`); keep `playwright` MCP and the no-plan paths (read-only audits and cost commands never carry `PLAN:`). No frontmatter changes.

**Definition of Done**:

- [ ] Three generated agents contain the precondition text; `/tsh-audit-infrastructure` description unchanged

#### Task 3.6 - [MODIFY] `tsh-code-reviewer` + `tsh-reviewing-code`

**Description**: Agent: add "report every evidence-backed finding first, then classify severity"; extend the `tsh-designing-databases` hint with "N+1 access patterns or in-memory data processing"; in `## Suggested next steps` say UI fixes go to `/tsh-implement` (EM -> `tsh-ui-engineer`). Skill: findings-reporting sentence, the anti-pattern list (N+1, in-memory pagination/filter/aggregation, missing integration tests at service boundaries) in the quality step, integration-coverage rule in the testing step; keep severity words `critical/warning/suggestion`.

**Definition of Done**:

- [ ] `grep -n "N+1" src/skills/tsh-reviewing-code/SKILL.md` matches; severity words unchanged

#### Task 3.7 - [CREATE] `scripts/test/port-agents.test.mjs`

**Description**: Golden checks: for the four new agents and software-engineer, the Claude model (`haiku` for plan-implementor/technical-writer, `sonnet` for ui-engineer is G3's), `disallowedTools: [Agent]`, `requires-mcp` absence of `playwright` and `figma` for software-engineer, the seven executors include the precondition marker text in every rendered target.

**Definition of Done**:

- [ ] Test file runs green after S1 (it reads G3 agents for the UI ones; G2 limits itself to its own agents and the include checks of the seven executors, skipping `tsh-ui-engineer` if the file is absent)

### Phase 4: Group G3 - UI verification stack

Owns: `src/agents/tsh-{ui-engineer,ui-capture-worker,ui-reviewer}.md`, `src/skills/tsh-{using-playwright-cli,verifying-ui,orchestrate-ui-verification,review-ui,implementing-frontend,using-mcp-servers}/**`, `scripts/test/port-ui.test.mjs`.

#### Task 4.1 - [CREATE] `tsh-using-playwright-cli`

**Description**: `type: skill`, `requires-mcp` omitted, description "Use when driving a browser through the `playwright-cli` command line ... to capture screenshots, snapshots and computed styles". Adapt the 478-line upstream SKILL.md to <= 400 lines: keep quick start, command groups, `--raw`, named sessions `-s`, open parameters, `run-code`, tracing, video, mocking, storage state, test generation. Remove `allowed-tools`, `.cursor` paths, vendoring language, dashboard/extension commands not verifiable on Claude/Codex, and the authenticated-capture section (replace with a 3-line pointer "per the `tsh-verifying-ui` skill"). Port the 10 references (`element-attributes`, `playwright-tests`, `request-mocking`, `running-code`, `session-management`, `spec-driven-testing`, `storage-state`, `test-generation`, `tracing`, `video-recording`); add `## Contents` to those over 100 lines (8 files). Security text in `storage-state.md` and `session-management.md` kept: per-run unique file via `mktemp` (never `mktemp -u`), `chmod 600` immediately after `state-save`, state outside the working tree, in-memory sessions by default, never commit state, never print credential values, ignore patterns.

**Definition of Done**:

- [ ] `npm run lint` and `node scripts/check-refs.mjs` clean for the skill; SKILL.md <= 500 lines; `grep -rn "mktemp -u" src/skills/tsh-using-playwright-cli` finds only "never" statements

#### Task 4.2 - [MODIFY] `tsh-verifying-ui`

**Description**: `requires-mcp: [figma]`. Rewrite per analysis-skills 4.4: Step 1 URL is user-confirmed or caller-supplied, never discovered from config; Step 2 export `figma-expected.png` through `figma` into `<specs>/<task>/ui-verification/` (one Figma node per verification root; `VERIFICATION_ID` single path segment: refuse `/`, `\`, `..`, leading `~`, absolute paths, newlines; a caller-supplied directory must resolve inside the specs tree); Step 3 CLI capture (three mandatory artifacts `actual.png`, `computed-styles.json`, `a11y-snapshot.yml` in `iteration-<N>/`, stabilization, exit codes, optional `toHaveScreenshot` tripwire as one sentence); strict PASS gate (no PASS while a Critical/Major remains; tripwire never overrules the comparison); content/data/state clarification gate; `VERIFICATION NOT RUN`; second-failure stop rule. Bulk moves to `references/cli-capture-flow.md` and `references/authenticated-capture.md` (the SINGLE owner of: `TSH_UI_LOGIN_<FIELD>` derivation, authorized-origin assertion before any credential read or fill, origin recorded once from the confirmed URL and compared after all redirects, mismatch = `NEEDS_INPUT` with the observed origin, `mktemp` + `chmod 600` state file, ignore patterns, no bypass/seed/inject of auth, trivially bypassable gate reported as a note, `git check-ignore` gate for the artifact root, **no `.env` reading**). Report template gains `VERIFICATION NOT RUN`, Sources, Artifact Directory, Artifact Status, Clarification Needed, Blocker Resolution, Re-verify After Fix.

**Files**: modify `SKILL.md`, `assets/ui-verification-report.template.md`; create `references/cli-capture-flow.md`, `references/authenticated-capture.md` (each with `## Contents` when > 100 lines).

**Definition of Done**:

- [ ] SKILL.md <= 500 lines; `grep -rln "TSH_UI_LOGIN" src` lists only `tsh-verifying-ui/references/authenticated-capture.md` and `tsh-ui-capture-worker.md`; `grep -rn "\.env" src/skills/tsh-verifying-ui src/agents/tsh-ui-capture-worker.md` contains only "never read" statements

#### Task 4.3 - [CREATE] `src/agents/tsh-ui-capture-worker.md`

**Description**: Frontmatter: `type: agent`, `model-tier: fast`, `access: read-write` (writes only under the artifact root), `shell: true`, `requires-mcp: [figma]`, `preload-skills: [tsh-using-playwright-cli, tsh-verifying-ui]`; description "Collects UI capture evidence (screenshot, computed styles, accessibility snapshot) ... normally used by the engineering manager; Use when ...". Sections: Role (mechanical evidence only, no judgment), Inputs (confirmed full URL, `UI_VERIFICATION_DIR`, `ARTIFACT_DIR`, Figma URL/node, optional auth inputs), Order (export or ensure `figma-expected.png` first), Constraints (never infer or normalize the URL, never inspect config for a port, never start a server, artifacts only at explicit paths never left in `.playwright-cli/`, cleanup attempted after failure, exit codes recorded), Authentication (pointer to `authenticated-capture.md`; reads only `TSH_UI_LOGIN_*` variables it requested for the form on screen from the process environment; NEVER reads any `.env` file; origin assertion; never prints values; missing variables -> `NEEDS_INPUT` with names), Status mapping (`DONE` all three artifacts exist; `NEEDS_INPUT` login redirect, origin mismatch, URL missing, artifact root not git-ignored; `BLOCKED` page unreachable, `figma` unavailable, tool failure; never `NEEDS_ARCHITECT_DECISION`), Output (URL used, artifact dir, shared reference status, files, session name, exit codes, derived variable names in form order, authorized and observed origin, tripwire yes/no). Includes `agent-modes`.

**Definition of Done**:

- [ ] Generated outputs exist for 3 tools; body has no `.env` read instruction; lint clean

#### Task 4.4 - [CREATE] `src/agents/tsh-ui-engineer.md`

**Description**: Frontmatter: `model-tier: balanced`, `access: read-write`, `shell: true`, `requires-mcp: [context7, figma, sequential-thinking]`, `preload-skills: [tsh-implement-task, tsh-implementing-frontend]`. Sections: Role (UI components, forms, hooks, accessibility, UI performance, visual correctness), Figma-before-code hard gate (fetch and review through `figma` before markup/layout/styles; missing link -> delegated `NEEDS_INPUT`; no `figma` -> `BLOCKED`; never open figma.com in a browser; unavailable -> report `VERIFICATION NOT RUN`), "a clean build is never UI verification" (state the components needing verification, return `DONE`, never claim PASS), pinned dev URL as fixed input, auth rule (never bypass/seed/inject auth state; credentials never in plans, specs or commits), fix passes address ALL differences of the report in `PRIOR_OUTPUT`, includes `agent-modes`, `plan-progress`, `human-approval-precondition`, Skills usage (on demand: `tsh-implementing-forms`, `tsh-writing-hooks`, `tsh-ensuring-accessibility`, `tsh-optimizing-frontend`, `tsh-discovering-technical-context`, `tsh-analyzing-implementation-gaps`, `tsh-analyzing-codebase`; do not restate the WCAG version), Output (changed files, components to verify). No capture/review loop, no cap text.

**Definition of Done**:

- [ ] Generated Claude model is `sonnet`; both preloaded skills named in the body

#### Task 4.5 - [MODIFY] `tsh-ui-reviewer`

**Description**: `requires-mcp: [context7, figma, sequential-thinking]`; `access: read-only`, `shell: false`, tier `deep` unchanged; replace the "MUST use `figma` and `playwright`" block with: EXPECTED from `figma`, ACTUAL from the artifact directory passed by the caller; never verify from code reading; missing/stale/incomplete artifacts -> `VERIFICATION NOT RUN` (delegated: partial report in the reply, `ARTIFACTS: none`, `NEEDS_INPUT` or `BLOCKED` per cause, guidance "run the capture step for the same pinned URL and re-delegate"); the reviewer never authenticates; no PASS while Critical/Major remains; stop after a second failing tool call; content/data/state clarification via `QUESTIONS` (FAIL report with open questions = `DONE`); `Confidence` field HIGH/MEDIUM/LOW; if `figma-expected.png` is missing it may view the node through `figma` but still reports `VERIFICATION NOT RUN` for the missing reference. Remove "called by ..." text for the old flow.

**Definition of Done**:

- [ ] Generated `.codex/agents/tsh-ui-reviewer.toml` has `sandbox_mode = "read-only"`; no `playwright` string remains in the file

#### Task 4.6 - [MODIFY] `tsh-orchestrate-ui-verification`

**Description**: Rewrite the loop: capture step before each review; hard ordering (no review without a fresh capture); freshness (delete the three ACTUAL files before each capture); the reviewer response contract (`Verification Result`, `Component`, `Artifact Directory`, per-file status, `Confidence`); re-run once on an empty response, absent confidence = LOW; confidence handling (HIGH fix all; MEDIUM fix obvious, ask on unclear; LOW pause before any fix, not an iteration); `VERIFICATION NOT RUN` non-terminal, no iteration cost; fixes go to `tsh-ui-engineer` with the full report and artifact paths; cap 5 then the 3-choice gate (fields: component, Figma URL, remaining mismatches, attempts per iteration, suspected root cause); `ESCALATED` only with the user's explicit acknowledgement; type-check/build/code review never substitute; do not infer a Figma MCP blocker from the manager's own tools; UI scope rule (any visual/layout change on a Figma-backed screen counts, ask for the Figma reference if missing); the reviewer report stays in the reply and is summarized in the plan Changelog (the read-only reviewer writes no `report.md`).

**Definition of Done**:

- [ ] Skill names `tsh-ui-capture-worker`, `tsh-ui-reviewer`, `tsh-ui-engineer`, no `tsh-software-engineer`; includes `caller-status-handling` unchanged if present

#### Task 4.7 - [MODIFY] `tsh-review-ui`, `tsh-implementing-frontend`, `tsh-using-mcp-servers`

**Description**: `tsh-review-ui`: `routes-to: tsh-engineering-manager`, description "Routes to the engineering manager (UI-only mode)", `argument-hint` unchanged, body: load the manager in UI-only mode (one capture + one review pass, no fixes, no plan, no gate), inputs list (Figma URL or node link, user-confirmed full dev URL, component name, optional artifact directory), verdict never empty, `VERIFICATION NOT RUN` when artifacts or tools are missing, never fix code; include `caller-status-handling` if the lint requires it for orchestrator-routed commands (check the `routes-to` rule). `tsh-implementing-frontend`: new Step 0 "Fetch and review Figma design" (resolve node, export via `figma`, extract layout, spacing, typography, colors, dimensions, variants, states; missing -> delegated `NEEDS_INPUT`), distinct from post-implementation verification. `tsh-using-mcp-servers`: `references/playwright.md` = interactive exploration, E2E locator discovery, "not used for Figma UI verification (see `tsh-using-playwright-cli` and `tsh-verifying-ui`)"; SKILL.md line about `tsh-verifying-ui` says CLI capture; Connected Skills list adds `tsh-using-playwright-cli`; keep `playwright` in `requires-mcp`.

**Definition of Done**:

- [ ] `npm run check` lint passes for the touched skills (after S1 for refs)

#### Task 4.8 - [CREATE] `scripts/test/port-ui.test.mjs` and a read-PNG spike note

**Description**: Tests: `tsh-ui-reviewer` has no `playwright` in all three renderings, `tsh-ui-capture-worker` and `tsh-ui-engineer` tiers (`haiku`, `sonnet`), `tsh-review-ui` routes to `tsh-engineering-manager`, `TSH_UI_LOGIN` confined to the two files above. Spike: in Cursor CLI and Claude Code, check whether the read-only reviewer can open a PNG; record the result in `specifications/upstream-port/ui-spike.md` (not a deliverable of the generator).

**Definition of Done**:

- [ ] Tests green after S1; spike result recorded or "not run" with reason

### Phase 5: Group G4 - Engineering manager and orchestration

Owns: `src/skills/tsh-engineering-manager/**`, `src/skills/tsh-implement/**`, `src/skills/tsh-ai-customization-orchestrator/**`, `scripts/test/port-manager.test.mjs`.

#### Task 5.1 - [MODIFY] `tsh-engineering-manager/SKILL.md`

**Description**: Stay an `orchestrator` with `caller-status-handling` (keep it), <= 220 lines. Add: principles (never writes product code or documents itself; reads/searches only to route; plan-progress checkbox edits stay; no suitable specialist -> stop and ask; delegation economy: no delegation only to re-verify, one worker per seam, exact scope in handoffs; user-facing cadence: one sentence before the first delegation, updates on ownership change or blocker, lead with the outcome); todos per plan task, per review event, per `[REUSE]` UI item, per final gate (update the plan first on scope change); architect consultation triggers (5: ambiguity in the plan, a seam missing, a conflicting convention, a security/data decision, a delegate's `NEEDS_ARCHITECT_DECISION`) with `TASK: record_human_approval` as the only write-delegation to the architect; delegation blocks for `tsh-ui-engineer`, `tsh-plan-implementor`, `tsh-technical-writer`; adjust `tsh-software-engineer` block ("NON-UI, complex; exception route") and `tsh-ui-reviewer` block ("after a capture pass, with the artifact directory"); one line that `tsh-ui-capture-worker` is delegated by the `tsh-orchestrate-ui-verification` step; a UI-only mode (used by `/tsh-review-ui`); pointers to the two new references. Keep the artifact path table (`<task>.plan-review.md`). Handoff contract: every file-changing delegation of plan-based work carries `PLAN: <path>` and `PLAN_REVISION: <n>`; plan-less delegations carry neither. Caps: plan review 3, code-review loop 3, UI loop 5, gate re-asks not counted.

**Definition of Done**:

- [ ] SKILL.md <= 500 lines and names every delegate above; `npm run lint` clean for it

#### Task 5.2 - [CREATE] `references/task-routing.md` and `references/plan-approval.md`

**Description**: `task-routing.md` (has `## Contents`): the routing table and seam definition from "Resulting design" item 3, skills each delegate follows (`tsh-implement-task`, `tsh-writing-documentation`, `tsh-delivering-infrastructure`, preloaded skills of e2e/prompt agents), escalation rule, UI scope rule. `plan-approval.md`: predicate, how the EM reads `## Human Approval`, the reuse note (tell the user path, revision, timestamp), the gate text with the plan path, `Plan Revision`, review path and a content summary; options `Approve plan` / `I have comments` / `Stop`; recording via `TASK: record_human_approval` with the verbatim answer; comments classification (material vs formatting-only) and renewed approval; review-blocker disposition when the architect cannot settle: ask `stop here` or `custom guidance`; defence in depth (executors re-validate).

**Definition of Done**:

- [ ] Both files < 200 lines, `## Contents` where > 100 lines; no cross-skill file links

#### Task 5.3 - [MODIFY] `references/implementation-flows.md`

**Description**: Full flow: step 1 also reads `## Human Approval`; step 2 plan review loop unchanged (cap 3); after `APPROVED` and before processing tasks run the formal gate (replaces the informal "confirm with the user" steps); tasks pass `PLAN:`/`PLAN_REVISION:`; UI tasks run `tsh-orchestrate-ui-verification` and the UI gate before the code review phase; UI and code review reported separately; review-fix classification (non-material needs no re-approval; material runs the revision handling). Quick flow stays and carries no gate; add one line that `/tsh-implement` with a plan path always uses the Full flow.

**Definition of Done**:

- [ ] Quick flow section intact; Full flow mentions the gate exactly once

#### Task 5.4 - [MODIFY] `tsh-implement` and `tsh-ai-customization-orchestrator`

**Description**: `tsh-implement`: keep the one-line router and the Quick/Full recommendation, add "plan-based work is approved by the user before any file change". Orchestrator: cadence rules (one sentence before the first worker run; progress updates only when a phase completes or direction changes, replacing the "between worker runs" line), delegation economy, "plans, plan review and human approval belong to `/tsh-implement`".

**Definition of Done**:

- [ ] `tsh-implement` description still contains "Use when"; `routes-to` unchanged

#### Task 5.5 - [CREATE] `scripts/test/port-manager.test.mjs`

**Description**: Tests: the manager includes `caller-status-handling`; `task-routing.md` names all of plan-implementor, software-engineer, ui-engineer, technical-writer; `plan-approval.md` contains the three gate labels and `record_human_approval`; `implementation-flows.md` still has a Quick flow; `/tsh-review-ui` and `/tsh-implement` both route to the manager.

**Definition of Done**:

- [ ] Green after S1

### Phase 6: Group G5 - Website docs and skill-level misc

Owns: `website/docs/**` EXCEPT `agents/overview.md`, `skills/overview.md`, `commands/overview.md`, `intro.md`, `getting-started/supported-tools.md` (S2); `.gitignore`; `src/skills/{tsh-analyze-cloud-costs,tsh-audit-infrastructure,tsh-optimizing-cloud-cost,tsh-managing-secrets,tsh-migrating-copilot-customizations,tsh-creating-skills}/**`.

#### Task 6.1 - [CREATE] Agent and skill pages

**Description**: New `website/docs/agents/{plan-implementor,technical-writer,ui-capture-worker,ui-engineer}.md` (front matter `sidebar_position`, `title`; Source, Kind and tier lines as in `ui-reviewer.md`; responsibilities, non-goals, tools, statuses, no model names), `website/docs/skills/{writing-documentation,using-playwright-cli}.md`, `website/docs/commands/internal/write-documentation.md`. Use each agent's frontmatter from this plan.

**Definition of Done**:

- [ ] `npm --prefix website run build` has no broken link; `node scripts/check-refs.mjs --docs` has no unknown name (after S1)

#### Task 6.2 - [MODIFY] Existing pages

**Description**: Rewrite for the refactor roles: `agents/{architect,plan-reviewer,ui-reviewer,software-engineer,engineering-manager,devops-engineer,e2e-engineer,prompt-engineer}.md`; `workflow/{overview,standard-flow,e2e-flow,frontend-flow}.md`; `commands/{implement,review-ui}.md`, `commands/internal/orchestrate-ui-verification.md`; `skills/{designing-architecture,verifying-ui}.md`; `getting-started/{mcp-setup,prerequisites,quick-wins}.md`; `integrations/{overview,playwright}.md`; `use-cases.md`. Content: one EM-owned gate, reviewer once per loop iteration with revision-bound verdict, flattened UI loop, `VERIFICATION NOT RUN`, `playwright-cli` prerequisite (`npx playwright-cli` or `npm install -g @playwright/cli@latest`), `TSH_UI_LOGIN_*` variables exported in the launching shell, `playwright` MCP = interactive and E2E only.

**Definition of Done**:

- [ ] No page mentions Task tool, `@tsh-`, "new discussion", `tsh-orchestrating-implementation`, `tsh-resolving-skill-references`, `tsh-creating-implementation-plans`

#### Task 6.3 - [CREATE] `getting-started/faq.md` and `workflow/ui-verification-flow.md`

**Description**: FAQ (19 upstream Q&A) rewritten tool-neutral; Cursor-only answers (token percentage, Bypass Approvals, model picker) in a labeled "Cursor" subsection; no claim that cannot be verified for Claude/Codex. `ui-verification-flow.md`: loop diagram redrawn for the flattened roles, sources of truth pointing at `tsh-verifying-ui` and `tsh-orchestrate-ui-verification`; positions chosen so the sidebar order stays valid (`e2e-flow` position shift as upstream).

**Definition of Done**:

- [ ] Website build green; sidebar shows both pages

#### Task 6.4 - [MODIFY] Skill-level misc

**Description**: (a) `tsh-analyze-cloud-costs`: degraded mode (if `tsh-optimizing-cloud-cost` with its tagging reference cannot be loaded, use Core 5 tag names `CostCenter, Environment, Service, Owner, DataClass` / GCP labels `cost_center, environment, service, owner, data_class` for presence only, state the substitution in the Executive Summary, issue no finding from defaults); (b) `tsh-analyze-cloud-costs` and `tsh-audit-infrastructure`: `tsh-managing-secrets` is a gate for the security section - if unavailable stop and ask (or re-scope to exclude security); (c) `tsh-migrating-copilot-customizations`: add "Porting a PR (not a fresh conversion)" and "Divergence from upstream" generalized to `src/` (apply onto the neutral source, run `npm run generate`, fold command model changes into `model-tier`); (d) `tsh-creating-skills`: confirm the by-name validation bullet, add only if absent; (e) `.gitignore` patterns from the ledger (no `specifications/`).

**Definition of Done**:

- [ ] `git diff .gitignore` shows no `specifications` line; `npm run lint` clean for the four skills

### Phase 7: Wave 2 - sequential integration (parent)

#### Task S1.1 - [MODIFY] Merge groups and fix seams

**Description**: Merge `port/g1`, `g2`, `g3`, `g4`, `g5` into `port/upstream` in that order. Expected conflicts: none (disjoint ownership). Fix seam findings only (dangling names, wrong counts in tests).

**Definition of Done**:

- [ ] `git diff --name-only` per group intersected pairwise is empty (check before merging)

#### Task S1.2 - [MODIFY] Regenerate outputs

**Description**: `npm run generate`; commit all generated trees (`.agents/skills/tsh-*`, `.claude/skills/tsh-*`, three agent dirs, MCP files) in one `chore(generator)`-style commit per AGENTS.md ("with their `src/` change" is satisfied by landing them right after the merge; no hand edits).

**Definition of Done**:

- [ ] `npm run generate` prints 21 agents, 3 orchestrators, 16 commands, 3 internal, 43 knowledge skills; second `npm run generate` yields no diff

#### Task S2.1 - [MODIFY] Counts and top-level docs

**Description**: With the generator's printed numbers: `README.md` (subagent/skill tables incl. the four agents and the two skills, `/tsh-review-ui` row now routed through the manager, UI flow paragraph and `playwright-cli` prerequisite, "Playwright" MCP row = interactive and E2E, Cursor-scoped "Recommended Thinking Effort" table only if it fits - model names live only there, not in `src/`), `CHANGELOG.md` (NEW top section `## 2026-10-26` using new names only: Added, Changed, Removed/not ported, Known limits; extend the migration table with `tsh-orchestrating-implementation` -> `tsh-engineering-manager`, `playwright-cli` -> `tsh-using-playwright-cli`, `tsh-creating-implementation-plans` -> `tsh-designing-architecture`, `tsh-resolving-skill-references` removed; note PR #74 not applicable; note 2.7 limitation if skipped), `website/docs/{intro.md,agents/overview.md,skills/overview.md,commands/overview.md,getting-started/supported-tools.md}` counts and rows, `website/src/pages/changelog.md` regenerated from CHANGELOG.md with its existing header.

**Definition of Done**:

- [ ] `node scripts/check-refs.mjs --docs` clean; counts in README, intro, both overview pages equal the generator output

#### Task S3.1 - [REUSE] Final gates

**Description**: Run all gates (see Quality Assurance).

**Definition of Done**:

- [ ] All gates green; `git status` clean

#### Task S4.1 - [CREATE] `git merge -s ours origin/main` (parent)

**Description**: After S3.1 and user review, run `git merge -s ours origin/main` on the branch. The merge commit message states that the content was ported semantically (see CHANGELOG). Run only after the gates; it is the last step.

**Definition of Done**:

- [ ] `git merge-base --is-ancestor origin/main HEAD` succeeds; `git diff origin/main..HEAD --stat` is the intended refactor diff; a PR into `main` shows no conflicts

## Quality Assurance

Acceptance criteria:

- [ ] Every row of the path ledger has a fate; none is missing from the three analyses
- [ ] `npm run generate` twice: no diff; counts 21 / 3 / 16 / 3 / 43
- [ ] `npm run check` (drift, lint, refs + docs) passes; `scripts/baseline/*.jsonl` unchanged or smaller
- [ ] `npm test` on Node 26 and `npx -y node@22 --test "scripts/test/*.test.mjs"` pass, including the new `port-*.test.mjs` files
- [ ] `npm --prefix website run build` passes without broken links
- [ ] Behavioural checks by grep: `grep -rln "TSH_UI_LOGIN" src` = 2 files; no `.env` read instruction in `src`; `grep -rn "playwright" src/agents/tsh-ui-reviewer.md src/agents/tsh-software-engineer.md` empty; `grep -rn "new discussion\|Implementation Discussion" src` empty; `grep -rn "tsh-resolving-skill-references\|tsh-creating-implementation-plans\|tsh-orchestrating-implementation" src` empty; the plan template ends with a newline and has all dispatch-gate sections
- [ ] Smoke (manual, parent): a trivial plan through `/tsh-implement` passes the gate and routes one task to `tsh-plan-implementor`; `/tsh-debug` still works with no plan; `/tsh-review-ui` runs capture then review
- [ ] `git merge -s ours origin/main` leaves no content from origin/main in the tree

## Improvements (Out of Scope)

- Bump Codex tiers to the newer model family (identifiers unverified)
- Optional `toHaveScreenshot` tripwire implementation (only one sentence in the reference)
- Persisting `iteration-<N>/report.md` from the read-only reviewer
- Codex behavior for hidden skills and environment propagation to the capture worker (open question 2)
- A one-review-per-lifecycle policy (upstream) instead of the loop of 3
- Mermaid rendering plugin for the website

## Changelog

| Date | Change Description |
| --- | --- |
| 2026-10-26 | Initial plan created from the three upstream analyses and the 15 fixed decisions |
