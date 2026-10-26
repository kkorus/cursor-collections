# Plan Review: upstream-port.plan.md

- **Plan:** specifications/upstream-port/upstream-port.plan.md
- **Research:** specifications/upstream-port/analysis-agents.md, analysis-skills.md, analysis-docs.md, AGENTS.md, specifications/unified-agent-structure/unified-agent-structure.plan.md
- **Review date:** 2026-10-26
- **Iteration:** 1
- **Reviewed Plan Revision:** unknown (this plan has no `## Human Approval` section)
- **Verdict:** REVISIONS NEEDED
- **Findings:** 4 blockers, 9 warnings, 4 suggestions

## Challenge Domains

- **Technology and stack decisions:** BLOCKER 1 (Figma reference image cannot be shown to be writable to disk) and WARNING 5 (shell-capable cheap-tier credential worker).
- **Irreversible or high-cost decisions:** BLOCKER 4 (`git merge -s ours` against an unpinned `origin/main`).
- **Contradictions with research or prior context:** BLOCKER 2 (architect runs an approval ask, against the owner decision). WARNING 2 (six-category list placed in two incompatible homes).
- **Scope gaps and silent omissions:** ledger itself is complete (see below). WARNING 3 (old Phase Gates, legacy plans without a record) and WARNING 9 (docs pages that change but are not on any list).
- **Cross-cutting decisions that propagate:** BLOCKER 3 (per-group gates cannot pass), WARNING 4 (seam definition and UI-only mode have two owners).
- **Build vs buy vs reuse:** no issue detected (new partials and references are reused instead of duplicated; no new skill for the plan contract).

## Decision and Revision History

| Date | Iteration | Decision / Topic | Problem / Challenge | Plan Decision / Change | Status |
| --- | --- | --- | --- | --- | --- |
| 2026-10-26 | 1 | Path ledger | Does it cover every path of `git diff --name-only 324d2fd..origin/main` (117 paths)? | Checked mechanically: every path maps to a row, direct or via a grouped row | resolved |
| 2026-10-26 | 1 | Artifact-based UI loop | `figma-expected.png` writability unproven; spike scheduled last | none | open |
| 2026-10-26 | 1 | One gate in the manager | Task 2.4 lets the architect ask the gate in interactive mode | none | open |
| 2026-10-26 | 1 | Parallel groups | Group gates need other groups' names | none | open |
| 2026-10-26 | 1 | `merge -s ours origin/main` | upstream tip not pinned | none | open |

## Verification of the requested stress points

### (1) Ledger completeness

Ran `git diff --name-only 324d2fd..origin/main` (117 paths) and matched every path against the plan. No path is missing. Five groups of paths appear only through compact notation: `tsh-ba-*-worker (5)`, `-artifact-creator/-reviewer`, `-gcp-costs`, `-implement-observability/-pipeline/-terraform` and `-creating-commands`. They are covered but cannot be diffed by a script (SUGGESTION 1). Spot checks of the NOOP claims (`internal/tsh-plan`, `internal/tsh-implement-terraform` and siblings, `tsh-create-custom-command`) hold: the diffs are folded content or the resolving note only. Upstream HEAD is `3232199e9c95...`, 34 commits as stated.

### (3) Counts and gates

- Counts after the port are right: agents 17 to 21, orchestrators 3, commands 16, internal 2 to 3, knowledge 41 to 43 (total skills 62 to 65).
- Lint: listing-budget is fine (current short-description total is 3235 chars; three new skills at most 120 each gives at most 3595, limit 6000). `naming-by-type` accepts `tsh-writing-documentation`, `tsh-using-playwright-cli` (gerund first) and `tsh-write-documentation` (internal, second word not a gerund). "Use when" is required only for `skill` and `command`, as the plan assumes. `agent-no-delegation` scans only the raw body of the agent, not the partials, so the partial is not linted at all; the plan's own DoD grep is the only check. `preload-skills` <= 2 holds for every new agent. `caller-status-handling` is required only for orchestrators and agent-routed commands, so `/tsh-review-ui` routed to the orchestrator needs no extra include (the plan's "if the lint requires it" is harmless).
- Schema and `targets.json`: `fast`, `balanced`, `deep` tiers exist; no `targets.json` edit is needed. `scripts/test/leaf-agents.test.mjs` expects `tsh-software-engineer` to stay `deep`/`opus` (the plan keeps it). The repo-contracts rule "read-only agents are never told to write" will apply to the rewritten `tsh-ui-reviewer`; the plan's wording ("writes no report.md", "never write") passes the negation filter.
- `scripts/baseline/` does not exist in the repo, so QA bullet "`scripts/baseline/*.jsonl` unchanged or smaller" is vacuous.

## Findings

### BLOCKERS

**B1. The whole artifact-based UI loop depends on `figma-expected.png` being written to disk, and nothing shows that is possible (Task 4.2, 4.3, 4.5, Open Question 1, Task 4.8).**
- Evidence: the Figma server in `src/mcp/servers.json` is the remote HTTP `https://mcp.figma.com/mcp`. Its image tools return image content to the model; there is no documented tool that writes a file. The capture worker is a `fast`-tier agent whose only way to put the bytes on disk is a shell step with a token it does not have. The spike (Task 4.8, "G3 task 3.8" in the Open Questions) is the last task of G3, tests only whether the read-only reviewer can read a PNG, and may close as "not run with reason".
- Failure scenario: G3, G4 and G5 are fully built, then the worker cannot persist the expected image. Task 4.5 says a missing reference means `VERIFICATION NOT RUN` even if the reviewer viewed the node, so on Claude Code and Codex every verification ends NOT RUN. The loop cannot ever PASS, the gate for UI plans becomes permanent escalation, and the docs and templates of three groups need rework.
- Fix: move the spike to Wave 0 and make it cover both write (Figma export to a file in the artifact root) and read (read-only reviewer opens the PNG) on Claude Code, Cursor and Codex. Define the fallback before G3 starts: for example the reviewer takes EXPECTED from a `figma` node view when the file is absent and PASS stays reachable, with the limitation recorded. Make Open Question 1 blocking.

**B2. Task 2.4 contradicts the owner decision "one gate run by the manager in the main thread, the architect only writes the record".**
- Evidence: Task 2.4, `## Human approval record`: "interactive mode: may ask `Approve plan` / `I have comments` and record, then end with `/tsh-implement`".
- Failure scenario: a user running `/tsh-architect` gets a second gate holder with its own wording. The two gates drift apart (labels, revision handling, comment classification live in `plan-approval.md` of G4 only). The manager's "reuse a valid record" rule then trusts a record produced by a gate that is not the specified one.
- Fix: the architect in interactive mode only reports that approval is pending and points to `/tsh-implement`; it writes a record only for `TASK: record_human_approval` carrying a verbatim answer.

**B3. The per-group Definition of Done (`npm run check` passes on the group branch) cannot be met by four of five groups (Execution model, "Each task's Definition of Done includes").**
- Evidence: `npm run check` runs `generate --check`, `lint` and `check-refs --docs`. `check-refs` flags every `tsh-*` token that is not a skill or agent, and `routes-to` must resolve. G2 agents name `tsh-ui-engineer` (G3), the manager (G4) names all four new agents and two new references, G5 docs name everything, `tsh-review-ui` (G3) routes to the manager (G4, present). The plan says names are "fixed" but a name check needs the file. Only a few DoDs are marked "after S1"; the global rule says otherwise. In addition `scripts/test/repo-contracts.test.mjs` (G1) reads the committed `.codex/agents` tomls against `agent-modes.md`; the Wave 0 edit to `agent-modes.md` makes that test and `generate --check` fail unless the Wave 0 commit includes regenerated outputs, which the plan never says.
- Failure scenario: every group hits red gates, the workers improvise (baseline entries, which AGENTS.md forbids, or edits to files owned by another group), or the gate is silently dropped and the first real check is S1.
- Fix: Wave 0 also commits valid skeleton files for the 4 new agents and 3 new skills (frontmatter, name, description, `agent-modes` include) plus regenerated outputs; the owners overwrite them, so ownership stays disjoint. State the per-group gate explicitly: local `npm run generate` then `lint`, `check-refs`, and `node --test` of the group's own file. Put every cross-group assertion (Task 2.8 includes of the seven executors, tier checks) into one S1-owned test file; "mark the assertions to run in S1" has no mechanism in `node:test`.

**B4. S4 `git merge -s ours origin/main` has no pinned upstream commit (Task S4.1, QA last bullet, Task Details).**
- Evidence: the range is written as `324d2fd..origin/main`, a moving ref. `-s ours` records the parent and discards its tree entirely; it hides, permanently from `git diff` and from the next `git merge`, any upstream commit that was not ported.
- Failure scenario: the owner keeps porting Copilot PRs; `origin/main` advances (it already contains a merge of PR #1 from `kkorus/feat/port-copilot-prs-65-74`) between analysis and S4. After `git fetch`, S4 swallows commits that no ledger row covers and nothing fails. Also, if the PR into `main` is squash-merged or rebased, the ancestry the merge was meant to create is lost, and the merge's effect is nil. The QA bullet "leaves no content from origin/main in the tree" restates the semantics of the merge, it is not a check, and `git diff origin/main..HEAD --stat` "is the intended refactor diff" cannot be verified.
- Fix: record `git rev-parse origin/main` (currently `3232199e9c951d77317edcfda4ab52c2c0fbd65a`) in Task Details; S4 first runs `git fetch` and fails if `origin/main` differs, then merges that exact SHA (`git merge -s ours -m "..." <sha>`). Add a pre-merge mechanical check that `git diff --name-only 324d2fd..<sha>` is a subset of the ledger. State that the PR must use a merge commit. State on which branch S4 runs and how `port/upstream` lands on `refactor/unified-agent-structure`.

### WARNINGS

**W1. Installer cleanup misses the realistic install shape (Open Question 3, Tasks 2.6, 2.7; `scripts/install.mjs` `cleanupLegacy`, lines 299-347).**
- The upstream README installs by symlinking each category child flat into `~/.cursor/skills` (`ln -sf .../workflows/*/ ~/.cursor/skills/`). So the leftover is `~/.cursor/skills/playwright-cli` (a symlink into the old layout), not `~/.cursor/skills/workflows/playwright-cli`. Rule (a)/(b) retires only names that start with `tsh-` at that level, and rule (c) ignores non-`tsh-` names. The plan's `unprefixed` check "inside the old category folders" therefore fixes only the copied-folder case.
- Fix: also retire a flat `<skills>/playwright-cli` only when it is a symlink whose target matches `LEGACY_LINK_RE` (never a real directory: the Playwright project's own `playwright-cli install --skills` can put a real one there). Re-budget the "about 15 lines" (loader, category check, symlink check is about 20-25). Names from the JSON are only compared, never joined into paths, so hostile content in the list is harmless, but validate that `unprefixed` is an array of strings. `listDir` entries cannot contain separators, and `retire` moves real directories to a backup, so the exact-name rule is safe.
- Also: `deleted` / `nowSubagents` entries for names that never existed in the new layout (`tsh-plan-implementor` etc.) are dead; harmless.

**W2. The six BLOCKER categories have two homes (Tasks 2.2, 2.3, 2.4, 2.8).**
- Task 2.2: "list lives here" (`tsh-designing-architecture`); Task 2.3 DoD and Task 2.8: "exactly one file (the skill `tsh-reviewing-plans`)". The architect preloads only `tsh-designing-architecture` and Task 2.4 points it at "the skill's six categories". A worker following 2.2 fails 2.3's DoD and 2.8's test, and vice versa. Also the reviewing skill today treats open decisions and research contradictions as BLOCKERS; making the six categories "exhaustive" needs an explicit rewrite of the Severity, Execution-critical and Approval sections, which Task 2.3 does not state.
- Fix: choose one owner (the reviewing skill), have the architect load it by name for its self-check (add it to the architect's on-demand skills), and list the sections of `SKILL.md` that are replaced.

**W3. Approval protocol gaps (Tasks 5.1, 5.2, 5.3; Design item 1).**
- The manager's existing "Phase Gates: before moving between research, planning and implementation, ask the user to confirm" section is not in Task 5.1's edit list, so the user is asked informally and then by the formal gate (two gates).
- Nothing makes the manager compare `REVIEWED_PLAN_REVISION` with the current `Plan Revision` before opening the gate (a stale APPROVED could be gated).
- Plans written before this change (every existing `specifications/**/*.plan.md`, and this plan) have no `## Human Approval` section: the record is "missing", and `record_human_approval` is never told to create the section.
- The material or non-material classification of review fixes is made by the manager, which can then skip re-approval by classification.
- Fix: edit Phase Gates to point at the single formal gate; add the revision-equality check to `plan-approval.md`; define the missing-section case (architect adds the section with `PENDING`); have the architect, not the manager, classify.

**W4. Two owners for the seam definition and for UI-only mode.**
- Seam: G1 Task 2.2 defines it (Files, runnable DoD, Stop Rule) for the architect; G4 `task-routing.md` defines it again (at most 5 files, no new architecture decision, public API, schema, auth, concurrency). The architect cannot tell the plan author which side it is on, the manager overrules by its own test, and the two drift.
- UI-only mode: G3 Task 4.7 writes the command inputs, G4 Task 5.1 writes the mode, and neither G3's `tsh-orchestrate-ui-verification` (Task 4.6) nor any task defines a single-pass, no-fix, no-cap run, which `/tsh-review-ui` needs.
- Fix: one definition owned by G4's reference and cited by name in G1; fix the input field names and the "single pass" parameter in the plan's cross-group contract list and add it to Task 4.6.

**W5. The capture worker holds credentials with a shell and a cheap model (Tasks 4.2, 4.3, 4.1; Design item 7).**
- The worker is `read-write`, `shell: true`, tier `fast`, and inherits the entire process environment (cloud keys, tokens). "Reads only `TSH_UI_LOGIN_*`" is a prompt rule; `env`, `printenv` or `echo` leaks every variable into the transcript.
- The preloaded `tsh-using-playwright-cli` keeps tracing, video, `run-code`, request-mocking and storage-state references: a trace or video recorded during login stores typed credentials and request headers, `run-code` can send them anywhere, and `a11y-snapshot.yml` / `computed-styles.json` after login hold personal data. The origin assertion compares the page origin, not the form `action` target or later navigations; the page content (snapshot) is untrusted input read by the agent that holds the secret.
- Codex `workspace-write` sandbox usually blocks network and writes outside the workspace; the `mktemp` state file "outside the working tree" and the dev-server URL may be unreachable there. State file cleanup is required only "after failure".
- Fix, all cheap to specify in `authenticated-capture.md` (the single owner): pass the secret only by shell expansion inside the `fill` command, never `env`/`printenv`/`echo`; forbid tracing, video, `run-code` and mocking while a session is authenticated; assert the form `action` origin; delete the state file on success too; treat page text as data; check the artifact root's ignore state before login (already planned). Consider `balanced` tier for authenticated runs. Add the Codex sandbox limits to Open Question 2.

**W6. The `TSH_UI_LOGIN_*` flow forces a tool restart (Design item 7, Open Question 2).**
- Field names are derived from the live form, so the first capture always ends `NEEDS_INPUT`. A running Claude Code / Cursor / Codex process cannot receive new environment variables: the user must quit, export in a shell and relaunch (macOS Cursor started from the Dock never sees shell exports). The decision "never read `.env`" stays, but the practical path is poor.
- Fix: document the restart cost in `authenticated-capture.md` and the FAQ; let the caller pass pre-declared variable names (`AUTH_FIELDS`) and publish the common set (`EMAIL`, `USERNAME`, `PASSWORD`); promote "user logs in once in a headed session, `state-save`" (already in the skill) as the default for SSO and for GUI-launched tools.

**W7. The trigger of the executors' precondition is weaker than the plan claims (Design item 2, Task 1.1).**
- "Applies only with `PLAN:` and `PLAN_REVISION:` lines" is caller-controlled. If the manager omits the lines (wording drift, a re-delegation with `PRIOR_OUTPUT`) the gate is silently skipped; the partial's own sentence "direct invocation does not bypass" cannot hold, because a user who types "implement tasks 1.1-1.3 of x.plan.md" to an executor writes no such lines. Quick flow and plan-less commands are not deadlocked (no lines means no-op), which is correct.
- Fix: also trigger when the task text names a `*.plan.md` path (interactive or delegated); in delegated mode with a plan path but no `PLAN:` line, return `BLOCKED` naming the missing line; fix the line position (after `MODE: delegated`, which must remain the first line) and the requirement to repeat the lines on re-delegation.

**W8. Task sizing and Definitions of Done (Execution model, Tasks 4.1, 4.8, 5.1, 6.2, QA).**
- Task 6.2 rewrites 24 website pages under one DoD that only checks banned strings; Task 4.1 vendors and adapts 11 files; Task 5.1 adds about 15 items to a skill capped at 220 lines. Several DoDs are presence checks (`grep -c ... shows all four` returns one number, not four), "sidebar shows both pages" is manual, Task 4.8 may close as "not run", and the core safety feature (approval record validation) has only grep checks plus a manual smoke test.
- Fix: split 6.2 into per-folder tasks with a content check (for example named sections or tokens present); make the DoD of 2.1 `grep -c` return >= 4 or check each pattern; add one automated test that feeds the precondition validator cases (valid, `PENDING`, stale revision, wrong timestamp) at least as fixtures reviewed by the contract test; make the spike non-skippable (see B1).

**W9. Docs and checker interactions that will fail at S2/S3 (Tasks 6.2, 6.4, S2.1).**
- `check-refs --docs` scans the latest CHANGELOG entry; the removed names (`tsh-resolving-skill-references`, `tsh-orchestrating-implementation`, `tsh-creating-implementation-plans`) are allowed only inside the `<!-- migration-table -->` table, so the "Removed / not ported" prose of S2.1 must not name them.
- `no-path-refs` flags the literal `.cursor/skills/` in any src text and cannot be baselined; "Porting a PR / Divergence from upstream" in `tsh-migrating-copilot-customizations` (Task 6.4c) must describe the old layout without that literal or the old names.
- Existing pages that change with the port are on no list: `website/docs/skills/{reviewing-plans,reviewing-code,using-mcp-servers,implementing-frontend,verifying-ui}.md`, `agents/code-reviewer.md`, `commands/internal/implement-task.md`, `commands/{analyze-cloud-costs,audit-infrastructure}.md`, `getting-started/{upgrading,which-command}.md` (installer behavior, counts). `supported-tools.md` also states "62 skills in total" (becomes 65).
- Fix: add them to Task 6.2 or to S2.1; state the two constraints in the tasks.

### SUGGESTIONS

1. Expand the grouped ledger rows (`tsh-ba-*-worker (5)`, `-artifact-*`, `-implement-*`, `-gcp-costs`, `-creating-commands`) into one row per upstream path and add the mechanical check as a Task 0.1 DoD (a script that diffs `git diff --name-only 324d2fd..<sha>` against the ledger).
2. Fix stale references: Open Question 3 says "Task 1.7" (it is 2.7); Open Question 1 says "G3 task 3.8" (it is 4.8); "Branch / base" says `fc29c80` while HEAD is `9e87f94`; the untracked `skills-ideas/` is not part of worktrees.
3. `.gitignore`: `.env.*` also ignores committed templates such as `.env.example`; add `!.env.example`. Remove the vacuous `scripts/baseline` QA bullet.
4. Update the `description` of `tsh-engineering-manager` and `tsh-orchestrate-ui-verification` (still "Internal step of /tsh-implement and /tsh-refactor") to mention `/tsh-review-ui`; Task 1.1 hides the `version-control-safety` partial in a DoD bullet, give it its own `Files` entry.

## Decision compliance

All 15 owner decisions are respected except B2 (architect gate in interactive mode). Two points to confirm with the owner: Task 5.3 "`/tsh-implement` with a plan path always uses the Full flow" narrows the kept Quick flow slightly; and the Task 2.3 change makes the six categories the exhaustive BLOCKER list, which weakens this reviewer's current adversarial scope (the 3-iteration loop itself is kept).

## Verdict

REVISIONS NEEDED - four blockers: the central UI-evidence assumption is unproven and its spike comes last (B1), the plan contradicts the single-gate decision (B2), the per-group gates cannot pass as specified (B3), and the final `-s ours` merge can silently swallow unported upstream commits (B4). The ledger is complete and the counts, naming, listing budget and schema checks hold.
