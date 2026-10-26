# Upstream port analysis: docs, models, Playwright CLI, changelog

Scope: everything in `git diff --name-status 324d2fd..origin/main` outside `.cursor/skills/**` and `.cursor/rules/**` (49 files: 45 under `website/`, plus `README.md`, `CHANGELOG.md`, `code-quality-report.md`, `.gitignore`). Read-only analysis of branch `refactor/unified-agent-structure` (HEAD fc29c80) against `origin/main`. Upstream = origin/main (34 commits, PRs #65-#79, CodeRabbit rounds 1-3, merged as PR #1 on 2026-10-19).

Facts used as ground truth in the refactor: `src/config/targets.json` tiers `deep|balanced|fast|inherit` (Cursor always `null` = inherit; Claude `opus|sonnet|haiku|inherit`; Codex `gpt-5.4` high/medium, `gpt-5.4-mini`, `{}`); one delegation level (D5: subagents never delegate, orchestrators run in the main thread); tool-neutral wording (no model names in `src/`); name references only (D6); `servers.json` currently contains `playwright` (`@playwright/mcp@latest`).

## 0. Key structural finding (read first)

Upstream added three kinds of content that collide with the refactor design, not just with file paths:

1. **Nested delegation.** Upstream now has Architect -> Plan Reviewer (nested), UI Engineer -> UI Capture Worker + UI Reviewer (nested), UI Reviewer -> UI Capture Worker (nested). Under D5 every one of these must be flattened: the orchestrator (`tsh-engineering-manager`, `tsh-orchestrate-ui-verification`) delegates each leaf.
2. **Human-approval record** (`## Human Approval` table in the plan: `Human Decision`, `Approved Revision`, `Decision Timestamp`, `Plan Revision`) written by the Architect at its own gate (`Approve plan` / `I have comments`) and validated from disk by every execution owner. The refactor has no equivalent; D5 also forbids a delegated subagent from asking the user (it returns `NEEDS_INPUT`). The Architect "ask in chat" gate and "fail closed + ask recovery question" in every implementor therefore need a redesign (see F1).
3. **Files written by a worker.** `tsh-ui-capture-worker` writes `actual.png`, `computed-styles.json`, `a11y-snapshot.yml` to an iteration directory. Our `tsh-ui-reviewer` is read-only and cannot write files; the capture worker needs `access: write` plus `shell: true`.

Also: the upstream final state **contains no model information in any agent** (see A). The upstream `.cursor/mcp.json` is **unchanged** (`git diff 324d2fd..origin/main -- .cursor/mcp.json` is empty; it still has `playwright` with `@playwright/mcp@latest`).

## A. Model changes

### A.1 What actually happened upstream (net result)

- `1e02836` (PR #73, 2026-07-24) rewrote `> Recommended model:` lines in 21 agent skills (GPT-5.6 Sol/Terra/Luna, Sonnet 4.6 -> Sonnet 5, plus Kimi K2.7 Code, MAI-Code-1-Flash).
- `d7a2f25` (same day) **removed every `> Recommended model/tools` line** from all 25 agents and the template ("non-functional"; model is session-level in Cursor).
- `01d6351` removed the stale per-worker model annotations from `tsh-business-analyst`.
- `321c149` (PR #77 "port", 2026-09-04) removed the remaining model claims from the Engineering Manager, `tsh-orchestrating-implementation`, and 3 website pages (replaced by one sentence: "Model selection is a session-level concern in Cursor ... not bound by the artifact").
- Final origin/main: `git grep -i "recommended model" origin/main` finds only a migration-skill instruction not to carry the line, and the historical CHANGELOG entries. The only live model content is the **README table "Recommended Thinking Effort Settings"** (GPT-5.6 Sol medium, Terra medium/high, Luna high/xhigh, Sonnet 5 high, MAI-Code-1-Flash high). The Software Engineer / EM / `/tsh-implement` pages no longer name models.

So no per-agent model change survives upstream; the PR #73 per-agent values below are historical and only inform tier assignment. Tier column is our current `model-tier` (verified in `src/agents/*.md`).

### A.2 Per-agent table (PR #73 values, mapped to our tiers)

| Agent (ours) | Upstream PR #73 change (old -> new) | Our tier | Action |
|---|---|---|---|
| tsh-architect | GPT-5.4 -> GPT-5.6 Terra, GPT-5.4 | deep | none |
| tsh-context-engineer | GPT-5.4 -> GPT-5.6 Terra, GPT-5.4 | deep | none |
| tsh-prompt-engineer | GPT-5.4 -> GPT-5.6 Terra, GPT-5.4 | deep | none |
| tsh-ba-quality-worker | GPT-5.4 -> GPT-5.6 Terra, GPT-5.4 | deep | none |
| tsh-business-analyst (orchestrator) | GPT-5.4 -> GPT-5.6 Terra, GPT-5.4; per-worker prose later removed | n/a (skill) | none; do not add model prose |
| tsh-ba-analysis-worker | not touched in #73 (Gemini 3.1 Pro stays in older text) | deep | none |
| tsh-ba-extraction-worker | Sonnet 4.6 -> Sonnet 5 | balanced | none |
| tsh-ba-formatting-worker | GPT-5.4 mini -> GPT-5.6 Luna, GPT-5.4 mini | fast | none |
| tsh-ba-transcript-worker | GPT-5.4 mini -> GPT-5.6 Luna, GPT-5.4 mini | fast | none |
| tsh-code-reviewer | Sonnet 4.6 -> Sonnet 5 | balanced | none |
| tsh-devops-engineer | Sonnet 4.6 -> Sonnet 5 | balanced | none |
| tsh-e2e-engineer | not in #73 | fast | none |
| tsh-plan-reviewer | GPT-5.5 -> GPT-5.6 Sol, GPT-5.5 | deep | none |
| tsh-ai-customization-reviewer (was cursor-artifact-reviewer) | Gemini 3.1 Pro -> GPT-5.6 Sol, GPT-5.5 | deep | none |
| tsh-ai-customization-creator (was cursor-artifact-creator) | GPT-5.4 mini -> GPT-5.6 Luna, GPT-5.4 mini | fast | none |
| tsh-ai-customization-researcher (was cursor-researcher) | Sonnet 4.6 -> Sonnet 5 | balanced | none |
| tsh-ai-customization-orchestrator (was cursor-orchestrator) | GPT-5.4 -> GPT-5.6 Terra, Sonnet 5 | n/a (skill) | none |
| tsh-engineering-manager (orchestrator) | GPT-5.4 -> GPT-5.6 Luna, Sonnet 5; claim deleted in #77 | n/a (skill) | none |
| tsh-software-engineer | GPT-5.3-Codex, Gemini 3.5 Flash -> + Kimi K2.7 Code (claim deleted in #77) | deep | **decide** (F3): role narrows to "complex non-UI exception"; upstream's array is mid-tier, ours is deep. Keep deep unless the user wants balanced. |
| tsh-ui-reviewer | not in #73 (no model line) | deep | none |
| tsh-cursor-engineer | Sonnet 4.6 -> Sonnet 5 | deleted (OQ2) | none |
| **new** tsh-ui-engineer | Sonnet 4.6 (CHANGELOG, #70) -> Sonnet 5 | **balanced** | create with `model-tier: balanced` |
| **new** tsh-plan-implementor | qwen3-coder-30b (customendpoint), GPT-5.4 mini -> + MAI-Code-1-Flash | **fast** | create with `model-tier: fast` |
| **new** tsh-technical-writer | GPT-5.4 mini -> GPT-5.6 Luna, GPT-5.4 mini | **fast** | create with `model-tier: fast` |
| **new** tsh-ui-capture-worker | none (mechanical "weak worker") | **fast** | create with `model-tier: fast` |

Tier reasoning: Sol (+5.5) = top reasoning = `deep`; Terra (+5.4) = `deep` (Codex `deep` is gpt-5.4 high, which is the fallback in every Terra row); Sonnet 5 = `balanced`; Luna/mini/qwen/Flash = `fast`. Nothing in `src/config/targets.json` needs editing for tiers to hold.

### A.3 Carry-over decisions for models

- **Do not** port model names into `src/` (tool-neutral rule) or into agent pages (upstream itself removed them as false claims).
- **Carry the README "Recommended Thinking Effort Settings" table** but scope it to Cursor: place it under the Cursor part of README (or `getting-started/supported-tools.md`) with the sentence "In the Cursor model picker, select each model, choose its thinking effort ... active in your current Cursor profile". Fits because Cursor tier is `null` (inherit) so this table is the only Cursor-side lever. Kimi K2.7 and MAI-Code-1-Flash only appear there.
- `targets.json` Codex values are `gpt-5.4*`; upstream now talks about GPT-5.6 Sol/Terra/Luna. Whether to bump Codex tiers is a separate decision (F6); the identifiers for Codex are unverified, do not guess them.
- Upstream's `tsh-migrating-copilot-to-cursor` now says "drop `model:`/`tools:` (do not convert to a body line)". In the refactor `tsh-migrating-copilot-customizations` already converts `model` into `model-tier` (structured field). Do not take this upstream change; docs pages `skills/migrating-copilot-to-cursor.md` and `skills/creating-agents.md` (removal of the "Recommended model" table row) are obsolete: our `creating-agents` documents `model-tier`.

## B. Playwright MCP -> CLI (PR #72 and later fixes)

### B.1 What changed upstream

- UI verification no longer uses Playwright **MCP** for ACTUAL. EXPECTED = Figma MCP (exports `figma-expected.png` to a shared root); ACTUAL = `tsh-ui-capture-worker` running `playwright-cli` (`npx playwright-cli` or `npm i -g @playwright/cli@latest`) into `$ARTIFACT_DIR` (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`, optional `pixel-gate/` tripwire).
- New verdict `VERIFICATION NOT RUN` (missing/blocked/stale capture, wrong page state); it does **not** consume the 5-iteration budget. Reviewer enumerates all differences (no stop at first CRITICAL). After 5 FAIL iterations a structured 3-option gate: extra iterations / stop and mark `ESCALATED` / custom instruction.
- User must confirm the **exact full dev server URL** (pinned for the session, re-confirmed across the "authoring discussion" boundary). Worker never discovers/starts a server or changes the URL.
- Playwright MCP stays configured for *interactive* use: docs say "Interactive browser automation and UI debugging", used by Software Engineer (ad hoc inspection) and E2E Engineer (locator discovery). Removed from UI Reviewer in every docs table. `.cursor/mcp.json` unchanged.
- New vendored skill `playwright-cli` (name without `tsh-`, `allowed-tools: Bash(playwright-cli:*) ...`, 10 reference files) loaded by the capture worker and UI Engineer.
- Security fixes (CodeRabbit round 2, `5563f59`): origin assertion before any credential fill (abort on origin mismatch), per-run unique state file via `mktemp` (never `mktemp -u`), `chmod 600` right after `storageState`, ignore patterns for state files in the consuming project, state outside the working tree, in-memory sessions by default, never commit state. Repo `.gitignore` gained: `.playwright-cli`, `.env`, `.env.*`, `auth.json`, `*-auth.json`, `*auth-state.json`, `*session.json`, `storage-state-*.json`.
- Docs-only trace: Playwright row in `mcp-setup.md`, `integrations/overview.md`, `integrations/playwright.md` (note box + prerequisite + "Used By" table), `prerequisites.md` (new section "Additional Requirement for Figma-backed UI Verification"), `quick-wins.md`, `intro.md`/`use-cases.md` wording, README (UI flow paragraph + skills table row `playwright-cli`).

### B.2 Recommended resolution in the refactor

| Item | Current in refactor (verified) | Recommended |
|---|---|---|
| `src/mcp/servers.json` `playwright` entry | present; generated into `.cursor/mcp.json`, `.mcp.json`, `.codex/config.toml` | **Keep.** Removal is NOT implied: upstream kept the server for E2E Engineer and interactive debugging and did not touch `mcp.json`. |
| `requires-mcp` of `tsh-ui-reviewer` | `context7, figma, playwright, sequential-thinking` | Drop `playwright` (reviewer consumes artifacts; capture is the worker's). Rewrite body lines 25-29, 67-75 ("MUST use `playwright`") accordingly. |
| `requires-mcp` of `tsh-software-engineer` | `context7, figma, playwright, sequential-thinking` | Upstream removed Figma and Playwright from the non-UI Software Engineer (CHANGELOG, #70). Drop `figma` and `playwright`. Needs the engineer split (E). |
| `tsh-e2e-engineer` | `context7, figma, playwright, sequential-thinking` | Keep `playwright` (upstream docs keep it). `figma` unchanged by upstream; leave. |
| new `tsh-ui-engineer` | n/a | `requires-mcp: context7, figma, sequential-thinking`. Upstream docs table has no Playwright MCP, but the CHANGELOG line says "Figma, Playwright, Context7, Sequential Thinking"; docs table wins (it is the later, corrected state), flag to the SKILL analyst. |
| new `tsh-ui-capture-worker` | n/a | `requires-mcp: []`; `access: write`, `shell: true` (needs `playwright-cli`, writes artifacts); `model-tier: fast`; preload `tsh-verifying-ui` and the playwright-cli skill. |
| `tsh-using-mcp-servers/references/playwright.md` | describes Playwright MCP for verifying a frontend change | Reword to "interactive exploration/debugging, E2E locator discovery"; add a pointer: "Figma-backed UI verification does not use this server; ACTUAL comes from the capture worker (`playwright-cli`)." Keep the 'When blocked' rule. Line 59 of SKILL.md ("`tsh-verifying-ui` — for the Figma and Playwright verification procedure") should say CLI capture. |
| `tsh-verifying-ui`, `tsh-review-ui`, `tsh-orchestrate-ui-verification` | use "playwright" tool; orchestrator delegates engineer then reviewer; reviewer 'cannot save files' | Orchestrator loop becomes: engineer -> **capture worker** (fresh artifacts, pinned URL, clear artifacts first so existence = freshness) -> reviewer (reads artifacts, returns PASS/FAIL/VERIFICATION NOT RUN) -> fix. Flattening of upstream nesting. Reviewer stays read-only (reads the iteration dir). Standalone `/tsh-review-ui` has no orchestrator: either the command routes to the orchestrator for this path or the reviewer may run capture itself in interactive mode (F2). |
| `playwright-cli` skill | none | Rename (naming rule: everything `tsh-` prefixed; frontmatter name must equal directory; `owned` globs are `tsh-*`). Suggested `tsh-using-playwright-cli`, or fold into `tsh-verifying-ui/references/`. Counts as +1 knowledge skill if kept separate. If the upstream text is third-party vendored, record provenance (F4). |
| Security notes | none in refactor | Carry into the capture worker body / `tsh-verifying-ui` (origin assertion, URL pinned, no fallback discovery), and into the playwright-cli references (mktemp, chmod 600, ignore patterns, in-memory default). Add the `.gitignore` patterns to the repo `.gitignore` as well. |
| Atlassian-style MCP caveat | n/a | The capture worker has no MCP; nothing for `targets.claude.disallowedTools`. Note Claude `Bash` allowlist (`Bash(playwright-cli:*) Bash(npx:*)`) is a Claude-specific `allowed-tools` equivalent; our generator must decide whether to emit it (otherwise permission prompts). Unverified for Codex/Cursor. |
| README / website claims | "Browser automation for UI verification and E2E tests" | "Interactive browser automation (debugging, E2E locator discovery). Figma-backed UI verification uses the Playwright CLI." Add `playwright-cli` as a prerequisite for `/tsh-implement` and `/tsh-review-ui` on Figma work. |

## C. Website pages (upstream-changed -> refactor)

Layout mapping: `prompts/public/*` -> `commands/*`; `prompts/internal/*` -> `commands/internal/*` (only 2 left: `implement-task`, `orchestrate-ui-verification`); `cursor-*` agents -> `ai-customization-*`; skill pages renamed to the gerund names. "Obsolete" means the upstream edit only touched wording that the rewrite replaced. Size = upstream diff lines (insertions/deletions) from `--stat`.

| Upstream path | Exists in refactor as | Content to carry over | Size |
|---|---|---|---|
| agents/architect.md | agents/architect.md | Human-approval ownership (records literal response only), plan-authoring gate, pre-submission self-check against the 6 BLOCKER categories, `reviewed-plan-revision` check, `stop here`/`custom guidance` choice, handoffs to Engineering Manager, skill `tsh-creating-implementation-plans`. **Rewrite**: the Architect cannot invoke the Plan Reviewer (D5); the EM runs the loop. | +27 |
| agents/context-engineer.md | same | Obsolete (removed a `.cursor/skills/internal/tsh-plan` path; we reference by name) | 2 |
| agents/cursor-artifact-creator.md, cursor-artifact-reviewer.md | agents/ai-customization-creator.md, -reviewer.md | Obsolete (path/wording only) | 2 each |
| agents/cursor-engineer.md | none (agent deleted, OQ2) | Obsolete. The "command skill vs prompt file" wording is already covered by `tsh-creating-commands` | 6 |
| agents/devops-engineer.md, e2e-engineer.md, prompt-engineer.md, software-engineer.md | same names | "Before any file change validate Human Approval record" paragraph + Ask Questions row, only if F1 = port the approval gate. Software Engineer: becomes "exception route for complex non-UI work", drop frontend skill list (now UI Engineer), drop Figma/Playwright rows, add `tsh-implementing-backend`, add rule "never wipes the working tree" (take this one regardless). Prompt Engineer: wording fix | 2-22 each |
| agents/engineering-manager.md | same | Rewrite of the whole page: EM = orchestration seat (WHO), mechanics in `tsh-orchestrating-implementation`; entry points (direct or `/tsh-implement`); Step 0 todos / Step 1 Full Flow; Architect consultation triggers; delegation roster (Plan Implementor default, Software Engineer exception, UI Engineer, E2E, DevOps, Architect, Code Reviewer, UI Reviewer, Context Engineer, Prompt Engineer, Technical Writer); "no document-editing tools" (recording approval = delegation to Architect); authoring-discussion stop. Adapt to the orchestrator-skill model. | -128/+ |
| agents/overview.md | same | Counts and a roster of new agents; "tool usage guidance" wording replaces "Recommended tools". Counts must use the refactor numbers (E). | 28 |
| agents/plan-implementor.md | NEW agents/plan-implementor.md | Whole page (strict single-task worker, DEFAULT executor for low-risk seams, reuses common-task step, stop-and-report, no wiping). In the refactor it reuses `tsh-implement-task`. Reviewer-fix F5 (returns blockers to the manager, not the user) is the correct form for D5. | 53 |
| agents/technical-writer.md | NEW | Whole page; terminal only for `npm --prefix website run build` and link validation | 56 |
| agents/ui-capture-worker.md | NEW | Whole page; artifacts, non-goals (no URL discovery, no questions to user), tool access terminal + file read | 50 |
| agents/ui-engineer.md | NEW | Whole page; replace "delegates capture/review" with "orchestrator does" (D5) | 81 |
| agents/plan-reviewer.md | same | Lightweight final reality check (APPROVED is the common outcome), Reviewer approval != Human approval, six BLOCKER categories, `reviewed-plan-revision`, `architect-action-required` attributes, append-only `.plan-review.md`, location `specifications/<task-name-or-id>/`. Invoker text: orchestrator, not Architect. | +37 |
| agents/ui-reviewer.md | same | Artifact-based ACTUAL, `VERIFICATION NOT RUN`, clarification on content/data/state diffs, fresh capture per pass, remove Playwright row, no 5-iteration consumption for blockers. Delegation to capture worker -> orchestrator. | +47 |
| getting-started/faq.md | NEW getting-started/faq.md (add to sidebar) | 19 Q&A (session sizing, 50 percent token rule, compaction, story-by-story, follow-ups, research.md vs plan.md vs ADRs, specs folder organization, model switching, Bypass Approvals). Needs tool-neutralization (Cursor-only: token percent, Bypass Approvals, model picker) and name check (`check-refs --docs`). | +245 |
| getting-started/mcp-setup.md | same | Playwright row ("Interactive browser automation and UI debugging", agents SE/E2E) + UI verification note box | 6 |
| getting-started/prerequisites.md | same | Section "Additional Requirement for Figma-backed UI Verification" (`npx playwright-cli`, global fallback, running app, full URL) | +8 |
| getting-started/quick-wins.md | same | Step 3 wording (capture worker) + setup note. Agent chain text must say orchestrator/UI engineer | 4 |
| integrations/overview.md, integrations/playwright.md | same | Playwright row/purpose, note box (verification does not use the MCP, artifacts named), "Used By" shrink, prerequisite on `playwright-cli`. Refactor page must also use `mcpServers` key (see Phase 6 fix) | 4 / 13 |
| intro.md | same | Obsolete counts (25/39); only the idea "UI Engineer / Technical Writer exist" matters; use E numbers | 4 |
| use-cases.md | same | One sentence (Figma MCP vs Playwright CLI artifacts) | 2 |
| prompts/internal/implement-ui.md | commands/internal/orchestrate-ui-verification.md | Pinned URL, FAIL/VERIFICATION NOT RUN branches, post-5 gate applies to real FAIL only; UI Engineer wording. Content belongs in `src/skills/tsh-orchestrate-ui-verification/SKILL.md` first | 20 |
| prompts/internal/plan.md, research.md | none (`tsh-plan`/`tsh-research` were folded into Architect / Context Engineer / designing-architecture) | Only: output path `specifications/<task-name-or-id>/`, link to implementation-plan skill. Put in architect/context-engineer pages | 11 / 2 |
| prompts/internal/review-plan.md (deleted upstream) | does not exist (never ported) | Nothing | -49 |
| prompts/overview.md | commands/overview.md | Four primary inputs of `/tsh-implement`; routing table rows (Plan Implementor default, Software Engineer exception, UI Engineer, Technical Writer) | 14 |
| prompts/public/implement.md | commands/implement.md | Thin-trigger rewrite, four inputs (`*.research.md`, `*.plan.md`), Step 0 / Step 1 / Full Flow only, approval rule | -56 |
| prompts/public/review-ui.md | commands/review-ui.md | New report shape (Differences table, Clarification Needed, Blocker Resolution), `VERIFICATION NOT RUN`, full URL, "canonical order owned by `tsh-ui-verifying`" | 31 |
| skills/architecture-design.md | skills/designing-architecture.md | Plan authoring split out to `tsh-creating-implementation-plans` (only if F7 = split) | 15 |
| skills/creating-agents.md | skills/creating-agents.md | Obsolete (removed model row) | 1 |
| skills/migrating-copilot-to-cursor.md | skills/migrating-copilot-customizations.md | Obsolete / conflicting (we keep `model-tier`) | 2 |
| skills/creating-implementation-plans.md | NEW skills/creating-implementation-plans.md (if skill created) | Whole page; plan template with capture-worker-before-reviewer ordering (F22) | 70 |
| skills/writing-documentation.md | NEW skills/writing-documentation.md | Whole page | 52 |
| skills/overview.md | same | New rows: creating-implementation-plans, writing-documentation, orchestration, playwright-cli (renamed); `tsh-resolving-skill-references` row = obsolete | 15 |
| skills/ui-verification.md | skills/verifying-ui.md (33 lines, short) | Five-step process with CLI-first capture, `figma-expected.png` ownership, artifact contract, stabilization, tripwire, report format; the refactor page is a summary so add a short "CLI-first capture" section and keep detail in the SKILL | 64 |
| workflow/overview.md | same | Gate rewording: research review is a quality checkpoint; Architect gate; new roster; "authoring discussion" paragraph; recovery on failed validation | 14 |
| workflow/standard-flow.md | same | Same set + four inputs + reuse rule + step table changes | 35 |
| workflow/e2e-flow.md | same | Same set (sidebar_position 4 -> 5 because new page) | 11 |
| workflow/frontend-flow.md | same | UI loop with capture worker, pinned URL, post-5 gate, "do not start /tsh-review until UI gate closed", URL re-confirmed across discussion boundary | 56 |
| workflow/ui-verification-flow.md | NEW workflow/ui-verification-flow.md | Full page (258 lines, 2 Mermaid graphs; Docusaurus has no Mermaid plugin in `docusaurus.config.ts`, same as upstream, so blocks render as code; either enable `@docusaurus/theme-mermaid` or leave the info box). Must be re-drawn for the flattened roles. Keep "Source of Truth" pointing at `tsh-verifying-ui`/`tsh-orchestrate-ui-verification`. | +258 |
| website/src/pages/changelog.md | same | Snapshot of `CHANGELOG.md`; regenerate from the merged CHANGELOG (D) | +308 |

Pages with nothing to carry: 4 (context-engineer, cursor-artifact-creator/reviewer, cursor-engineer) plus creating-agents, migrating skill, prompts/internal/review-plan, prompts/internal/research(minor). New pages to create: plan-implementor, technical-writer, ui-capture-worker, ui-engineer, faq, ui-verification-flow, creating-implementation-plans (conditional), writing-documentation.

## D. README, CHANGELOG, .gitignore, code-quality-report

### D.1 README.md (upstream +43/-?)

Carry: (1) Recommended Thinking Effort table (A.3). (2) UI flow paragraph (UI Engineer, capture worker, `playwright-cli` prerequisite, running app + full URL). (3) Agent rows: UI Engineer; Software Engineer redefined as non-UI; Plan Implementor, UI Capture Worker, Technical Writer. (4) Plan Reviewer line "one final reality check". (5) Skills: add creating-implementation-plans, writing-documentation, (orchestration skill, playwright-cli) per decisions. Obsolete: structure tree (25/39/12 counts), `tsh-resolving-skill-references`, migration bullet about dropping `model:`/`tools:`. Our README counts must be recomputed (E): "Knowledge skills (41)" heading, agents table, "lists exactly the 16 commands".

### D.2 CHANGELOG.md (+346 upstream)

Facts (verified by `grep '^## '`): refactor top entry is `## 2026-10-04` (breaking changes, lines 7-124), followed by `## 2026-06-04`. Upstream added dated sections between those: `2026-09-06` (x2), `2026-09-05` (x3), `2026-09-04` (x6, with PR suffixes), `2026-07-30`, `2026-07-11` (x2), `2026-07-10`, `2026-06-22`, `2026-06-19`, `2026-06-18`, `2026-06-15`, `2026-06-11`, `2026-06-09`, then `2026-06-04`. All upstream dates are before 2026-10-04, so **chronological order works with no reordering**: refactor entry stays on top, upstream entries slot in directly below it, above `2026-06-04`. The merge conflict is exactly one hunk at that boundary; resolve by keeping both sides in that order.

Recommended strategy:
1. Keep upstream entries verbatim (they are history in the old layout; paths like `.cursor/skills/agents/...` stay as written). `check-refs --docs` only checks the **latest** entry, so old paths below it do not fail.
2. Add the port to the top: either a new dated section for the day of the port (today is 2026-10-26; recommended) above `2026-10-04`, or append "Added/Changed" bullets to `2026-10-04` if that release is unreleased. A new section is safer: `2026-10-04` is already described as the breaking release and the migration tables (`<!-- migration-table -->`) live there.
3. The new top entry (becomes the one `check-refs --docs` scans) must use new names only: list the ported features in refactor terms (UI Engineer, Plan Implementor, Technical Writer, UI Capture Worker, Playwright CLI verification, two-gate approval, FAQ) and extend the migration table with the new mappings (`tsh-architecture-designing` split, `tsh-ui-verifying` -> `tsh-verifying-ui` unchanged mapping, `tsh-orchestrating-implementation` -> merged into `tsh-engineering-manager` or kept, `tsh-write-documentation` -> internal step, `playwright-cli` rename, `tsh-resolving-skill-references` -> removed).
4. Upstream entries that describe what was dropped in the refactor (model arrays, `tsh-cursor-*`, `tsh-resolving-skill-references`) stay as history; no edit.
5. `website/src/pages/changelog.md`: regenerate as copy of the merged `CHANGELOG.md` with the existing note header (upstream's snapshot already lags: it lacks the 2026-09-04 entry and has "PR #77 port" extra; regenerate from the merged file to remove that drift).
6. Record in the new entry that PR #74 was reviewed upstream as not applicable and that #77 had no frontmatter target (we have `model-tier`, so likewise).

### D.3 .gitignore

Carry the new patterns (`.playwright-cli`, `.env`, `.env.*`, auth/storage-state patterns); our file already has Codex lines to preserve. **Do not take `specifications/`**: the refactor tracks `specifications/**` (plans, audits, reviews, decisions; `git ls-files specifications` lists many). Upstream's rule only hides *untracked* files, but it silently hides this `upstream-port/` folder and any new plan from `git add .`. Keep as is (F8).

### D.4 code-quality-report.md

Upstream rewrote it (92 SKILL.md audit, 2026-07-24). In the refactor the root file was deleted in `0ace5a9`; the copy now lives at `specifications/code-quality/code-quality-report.md`. Resolution: do not restore the root file; if the upstream audit is wanted, drop the new version into `specifications/code-quality/` as a historical snapshot (its findings reference old paths and `.cursor/skills` counts, so it is obsolete as a living report). Useful lesson kept in the report: duplicated model prose is a drift trap (already satisfied by tool-neutral rule).

## E. New concepts and counts after the port

Current (refactor): 17 agents (subagents), 3 orchestrators, 16 commands, 2 internal, 41 knowledge skills (source: README, `website/docs/intro.md`).

| Artifact (upstream) | Kind in refactor | Counterpart needed | Count effect |
|---|---|---|---|
| tsh-ui-engineer | subagent | create `src/agents/tsh-ui-engineer.md` (balanced; skills frontend, forms, hooks, accessibility, optimizing-frontend, verifying-ui) | agents +1 |
| tsh-plan-implementor | subagent | `src/agents/`, fast, delegated-only, preload `tsh-implement-task` | agents +1 |
| tsh-technical-writer | subagent | `src/agents/`, fast, delegated-only | agents +1 |
| tsh-ui-capture-worker | subagent | `src/agents/`, fast, write+shell, delegated-only | agents +1 |
| tsh-software-engineer split (UI removed) | existing | rewrite scope | 0 |
| tsh-write-documentation (internal) | internal step | `src/skills/tsh-write-documentation` (loaded by the EM; no `tsh-writing-*` clash: upstream has both `tsh-write-documentation` and `tsh-writing-documentation`) | internal +1 |
| tsh-writing-documentation | knowledge skill | create | skills +1 |
| tsh-creating-implementation-plans | knowledge skill | create, or keep inside `tsh-designing-architecture` (F7) | skills +1 (or 0) |
| tsh-orchestrating-implementation | upstream: workflow skill read by EM | refactor EM is already the orchestrator skill; fold content into `tsh-engineering-manager` (Step 0/1, routing table, gates) rather than a separate skill | 0 (or +1 as `internal`) |
| tsh-resolving-skill-references | upstream workaround (resolve a skill file path) | obsolete: D6 name references; do not create | 0 |
| playwright-cli | vendored skill | rename (B.2) | skills +1 (or 0 if folded) |

Resulting counts: **21 subagents, 3 orchestrators, 16 commands, 3 internal, 43 knowledge skills** (minimum, with creating-implementation-plans separate and playwright-cli folded: 43; with playwright-cli separate: 44; if orchestrating-implementation stays separate: 45). The generator prints the authoritative counts; update `README.md` ("Knowledge skills (N)", "exactly the 16 commands" is unchanged), `website/docs/intro.md`, `agents/overview.md` (17 -> 21), `skills/overview.md` (41 -> N), `commands/internal` (2 -> 3 if the documentation step is user-visible there), AGENTS.md has no counts. Commands: upstream has no new command (17 -> 17 old, our 16 unchanged); `/tsh-implement` gains the documented inputs `*.research.md` and `*.plan.md`, which the refactor command must accept (check `argument-hint` of `src/skills/tsh-implement`).

Concepts documented upstream that need a design counterpart:
- **Two-gate approval model**: gate 1 = Architect plan-authoring gate (`Approve plan` / `I have comments`) records the literal decision in the plan's `## Human Approval`; gate 2 = EM recovery gate (`Approve current plan` / `Request changes` / `Stop`) only when no valid current-revision record exists. Reviewer `APPROVED` is never permission to implement. Material revision after approval halts and requires renewed approval; no automatic re-review (a new review only when the user directs one). Execution owners validate the record from disk (exact fields) and fail closed with a named failed field and 4 recovery choices (point to plan, obtain approval, start planning, hand back to EM). Exemption path: initial-plan low-risk automated review exemption has no Architect gate, so EM gate is the only one.
- **Authoring discussion boundary**: recording plan approval ends the discussion; implementation starts in a new discussion. This is a Cursor-session concept (token/compaction driven, see FAQ); in the refactor it needs tool-neutral wording or can be dropped (F1).
- **Plan review lifecycle**: Plan Reviewer once per lifecycle (was: up to 3 iterations in our EM, `SKILL.md` line 112-117); `.plan-review.md` append-only; revision-bound verdict.
- **Plan Implementor default / Software Engineer exception** routing; Technical Writer for README/CHANGELOG/docs requests ("documentation" is a first-class work type in EM routing).
- **Four primary inputs** for `/tsh-implement`: task, Jira ID, `*.research.md`, `*.plan.md`; spec path `specifications/<task-name-or-id>/`.
- **UI loop contract**: capture before review, plan template requires capture-worker pass before reviewer, one Figma component per verification root (F34, `b8f1b80`).
- **FAQ** (new page) - several answers describe the above gates.

## F. Open questions (real decisions)

F1. **Port the two-gate Human Approval model?** It requires: a `## Human Approval` table in the plan template, a user-facing gate in the Architect (impossible as delegated subagent under D5 unless the EM asks the user and the Architect only writes the record, or the Architect runs interactive only), approval validation in plan implementor / software engineer / ui engineer / devops / e2e / prompt engineer / technical writer, and the "authoring discussion" boundary (Cursor-specific; drop or keep?). Options: (a) full port with the EM asking and a scoped write delegation to the Architect; (b) simplified: a single EM approval gate, record in plan Changelog; (c) skip. This is the largest change.
F2. **Flattening capture:** accept orchestrator-driven capture (engineer -> capture worker -> reviewer, all delegated by `tsh-orchestrate-ui-verification`)? For standalone `/tsh-review-ui` (no orchestrator): route to the orchestrator, or allow the interactive reviewer to run `playwright-cli` itself?
F3. **`tsh-software-engineer` tier and scope:** keep `deep`, or `balanced` now that it is the "exception" route? Also do we really want both UI Engineer and Software Engineer plus Plan Implementor (3 implementors) or keep one engineer with a UI section?
F4. **`playwright-cli` skill:** vendored third-party text. Rename to `tsh-using-playwright-cli` / fold into `tsh-verifying-ui/references`, or exempt from the `tsh-` rule? Is the license of the vendored text confirmed? Also should the generator emit a Claude `allowed-tools: Bash(playwright-cli:*)`?
F5. **Keep `@playwright/mcp` in `servers.json`?** Recommendation: yes (E2E and interactive debugging). Confirm.
F6. **Codex tier models:** bump `gpt-5.4*` to the GPT-5.6 family? (identifiers unverified; also the README thinking-effort table scope).
F7. **Split `tsh-creating-implementation-plans` from `tsh-designing-architecture`?** Upstream split for plan-contract hardening (and the reviewer loads it). Alternative: keep one skill with a `references/plan.template` and update the plan reviewer.
F8. **`.gitignore` `specifications/`:** reject (recommended) or accept and `git add -f` all new specs?
F9. **CHANGELOG:** new dated top entry (recommended) vs amending 2026-10-04; date to use (2026-10-26 today).
F10. **FAQ:** port as-is (Cursor-centric) or rewrite tool-neutral for Claude Code/Codex? (Token percentage, Bypass Approvals and model-picker answers are Cursor-only.)
