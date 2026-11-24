# Upstream port analysis: agents (324d2fd..origin/main vs refactor/unified-agent-structure)

Scope: the 25 paths under `.cursor/skills/agents/` that changed upstream (21 modified, 4 new). Read from `git show origin/main:<path>`, `git diff 324d2fd..origin/main`, the 34 commit messages, and the current `src/` files. Items I could not verify are marked "(unverified)".

## 0. Findings that apply to every agent

1. **Most of the upstream diff is mechanical.** Per agent it is (a) removal of the `> Recommended model / tools` lines (d7a2f25), (b) the XML-tag restructure (88f7651), (c) skill-name edits for the old layout. The only semantic changes are in: architect, plan-reviewer, engineering-manager, software-engineer, ui-reviewer, code-reviewer (2 lines), devops/e2e/prompt-engineer (approval precondition), and the 4 new agents.
2. **Upstream nests delegation in five places; the refactor forbids all of them** (`agent-modes` partial, Claude `disallowedTools: [Agent]`, lint `agent-no-delegation`):
   - architect -> plan-reviewer ("Task tool", once per plan lifecycle)
   - ui-engineer -> ui-capture-worker and ui-reviewer (the 5-iteration loop)
   - devops -> architect (still present, with a new "cannot spawn" fallback)
   - business-analyst and cursor-orchestrator -> workers (these two are already main-thread orchestrators in `src/`)
3. **Upstream agents ask the user directly in places where a delegated worker must return a status:** the approval precondition ("ask the user in chat which next step to take") in 7 agents, the architect's plan-authoring gate, the ui-reviewer clarification gate. In the refactor these become `NEEDS_INPUT`/`BLOCKED` in delegated mode and stay as questions in interactive mode (already what `agent-modes` does).
4. **Banned in `src/` by lint (scripts/lint.mjs TOOL_SYNTAX):** `@tsh-`, "Task tool", `agentId`, `GPT-`, `Claude Sonnet`, `Gemini`, `Dev Mode`, `*.mdc rules`, `cursor-instructions.md`. The words "delegate to", "spawn*" and "subagent(s)" in an agent body trip `agent-no-delegation` unless the agent is allow-listed. Ported wording has to avoid them (for example write "when your caller passes..." instead of "when running as a delegated subagent").
5. **Schema limits to respect:** `preload-skills` has at most 2 entries and each must be named in the body; read-only agents get Claude `disallowedTools` Write/Edit/NotebookEdit and Codex `sandbox_mode = read-only`; `shell: false` denies Bash on Claude. Cursor model is always `null` in `src/config/targets.json`, so tiers only act on Claude and Codex.
6. **Dependency on skills analysis (not in my scope):** the agents reference upstream skills that need a refactor counterpart. Proposed names, to be confirmed by the skills analysis:

| Upstream skill | Refactor counterpart |
|---|---|
| `tsh-creating-implementation-plans` (plan template, `## Human Approval` table, Plan Revision, DoD rules) | extend `tsh-designing-architecture` (+ `assets/plan.template.md`) rather than add a skill that overlaps it |
| `tsh-orchestrating-implementation` | no separate skill: `tsh-engineering-manager` already IS the main-thread orchestrator; put the content in `src/skills/tsh-engineering-manager/references/` |
| `tsh-resolving-skill-references` | drop (D6 already makes every skill loadable by name; the "read, do not invoke" rule exists only because Cursor refused internal skills) |
| `tsh-writing-documentation` | new knowledge skill, same name |
| `tsh-write-documentation` (internal handoff) | drop; fold into the agent body (it only points to the knowledge skill) |
| `playwright-cli` (+10 references) | new knowledge skill `tsh-using-playwright-cli` (lint requires the `tsh-` prefix; follows `tsh-using-mcp-servers`) |

---

## 1. Cross-cutting design questions (resolved once, referenced below)

### Q1. The persisted human-approval record, the 7-agent precondition and "no unplanned implementation"

Upstream (7bea710, 78e1ddc): every plan has a `## Human Approval` table (Plan Revision, Human Decision, Approved Revision, Decision Timestamp). Seven executors (software-engineer, ui-engineer, plan-implementor, e2e, devops, prompt-engineer, technical-writer) carry a byte-identical `<human-approval-precondition>`: no file change without a valid on-disk record. The Quick flow and every no-plan route were deleted.

Conflicts with the refactor:
- `/tsh-debug` routes straight to `tsh-software-engineer` and `/tsh-ask`/`/tsh-review` have no plan. `src/skills/tsh-engineering-manager/references/implementation-flows.md` has a Quick flow, and `tsh-implement-task` has a "plain task description" mode. A blanket precondition would break `/tsh-debug`.
- The precondition tells the agent to "ask the user in chat" -> must be a status in delegated mode.
- Copy-pasting one block into 7 agents contradicts the partial-based design.

Recommendation:
- Make it a partial `src/partials/human-approval-precondition.md`, included by the 7 executors, **scoped to plan-driven work**: it applies when the task names a `*.plan.md` in `INPUT_ARTIFACTS` or the caller says plan-driven. Without a plan the agent proceeds as today (so `/tsh-debug` keeps working).
- Failure handling: delegated mode returns `BLOCKED` with `BLOCKER` naming the exact failed field/condition/file (the caller owns recovery, see Q2); interactive mode asks the user for the 4 options (point at plan, request approval, back to architect, stop). Drop the "ask the user" wording for delegated mode.
- Whether to also delete the Quick flow is a **user decision** (see table).

### Q2. Who owns the approval gates; the "two-gate model" and the Implementation Discussion Boundary

Upstream has the architect run a plan-authoring gate (`Approve plan` / `I have comments`) after its own nested review, and the EM run a recovery-only gate (`Approve current plan` / `Request changes` / `Stop`). The EM has no edit tools, so it delegates the write of the record to the architect. After approval the "Implementation Discussion Boundary" requires implementation to start in a NEW chat.

Fit with the refactor:
- The architect cannot run its gate after review: it cannot call the reviewer (leaf rule), and when delegated it cannot ask. The EM runs in the main thread and can ask the user.
- The discussion boundary cannot be enforced (upstream itself says it is "instruction-level") and clashes with `/tsh-implement` doing research, plan, review and implementation in one thread (the EM Full flow).

Recommendation:
- **One user-facing gate, owned by the EM** (main thread), after the plan review is settled. Options keep upstream labels: `Approve plan`, `I have comments`, plus `Stop` (merge of the two vocabularies; EM text must say it explicitly).
- **Only the architect writes the record**: the EM delegates a narrowly scoped "record this literal decision" task (`TASK: record_human_approval`, with the verbatim user answer), the architect writes the table and returns `DONE`. The EM re-reads the record read-only before every file-changing delegation and reuses a valid current-revision record without asking again (upstream reuse rule).
- In interactive mode (user talks to `tsh-architect` directly) the architect may ask the user and record the answer itself, but cannot claim reviewer readiness: it ends with "Suggested next steps: run `/tsh-implement`" so the EM performs the review and the gate.
- **Drop** the Implementation Discussion Boundary and the "two distinct gates" table. Keep Material Revision Handling (increment Plan Revision, set PENDING, Changelog entry, halt file-changing delegation until renewed approval); it is enforceable by the EM.
- This deviates from the upstream "ratified two-gate model" (7dc0d1a), so it is a **user decision**.

### Q3. Plan review: one review per lifecycle versus the EM's 3-iteration loop

Upstream #79: the reviewer is a lightweight reality check, six canonical BLOCKER categories, run **once per plan lifecycle** (re-review only when the user explicitly directs it). The architect closes each BLOCKER with a correction or a recorded justification. The reviewer returns `<plan-review-report verdict=... architect-action-required=... reviewed-plan-revision=... report-file=...>`. A verdict is actionable only if `reviewed-plan-revision` equals the current Plan Revision.

Refactor: `tsh-engineering-manager` owns a plan review loop of up to 3 iterations (D5 table); `tsh-reviewing-plans` defines a broader adversarial review.

Recommendation: adopt the upstream contract with EM ownership: EM delegates the reviewer once, then delegates the architect to dispose of every BLOCKER (append-only `.plan-review.md`), then runs the human gate. Return contract: no XML. The reviewer puts, in `SUMMARY`: `VERDICT: APPROVED|REVISIONS NEEDED; REVIEWED_PLAN_REVISION: <n|unknown>; BLOCKERS/WARNINGS/SUGGESTIONS: a/b/c` and the path in `ARTIFACTS`. The EM compares the revision before accepting. A mismatch means: log a reconciliation entry, do not accept, ask the user (`stop here` / `custom guidance`). The six categories and the self-check live in `tsh-reviewing-plans` and `tsh-designing-architecture`. **User decision** (changes the loop cap documented in the plan, row 10 and D5).

### Q4. The "canonical XML-tag structure" (88f7651)

What it is: all agent bodies rewritten to `<agent-role>`, `<skills-usage>`, `<tool-usage>` with nested `<tool name="...">`, `<user-confirmation>`, `<constraints>`, `<output-format>` and domain tags, mandated by upstream `tsh-creating-agents`. Structure-only commit ("wording preserved verbatim").

Assessment:
- The refactor deliberately removed the XML mandate (plan row 54; `src/skills/tsh-creating-agents/SKILL.md:153,164`: "Markdown headings only ... one body format"). `src/` agents use headings.
- Per-tool `MUST use when / SHOULD NOT use for` blocks duplicate `tsh-using-mcp-servers` and name tools that differ per target.
- Nothing in the generator needs the tags: `normalizeBody` only trims; Cursor/Claude `.md` and Codex TOML multi-line strings carry them unchanged.

Recommendation: **drop** (do not port the restructure). Port only the semantic blocks as normal Markdown sections or partials (`## Version control safety`, `## Plan progress` already a partial). If the owner later wants XML anyway: lint rule `agent-structure` (required tags per agent: role, constraints, output-format; tag names allow-list), an `agent.template.md` update, a rewrite of the lint's `agent-no-delegation` scan to ignore tag text, and ~17 body rewrites. Not recommended; small generator impact but large churn and conflict with `tsh-creating-agents`. Needs only a confirmation (see table).

### Q5. UI loop ownership (ui-engineer / ui-capture-worker / ui-reviewer)

Upstream: ui-engineer implements, then delegates capture to ui-capture-worker, then review to ui-reviewer, fixes, repeats up to 5 times, with a post-budget gate (continue-with-N / stop `ESCALATED` / custom). The EM only checks the result.

Refactor: this loop is already owned by the EM through the internal skill `tsh-orchestrate-ui-verification`, which currently delegates implementation and fixes to `tsh-software-engineer`, verification to `tsh-ui-reviewer`, with a 5-iteration cap. So:
- `tsh-ui-engineer` = implement/fix only (Figma-before-code gate inside the agent). It never delegates.
- The loop becomes: `tsh-ui-engineer` (implement) -> `tsh-ui-capture-worker` -> `tsh-ui-reviewer` -> `tsh-ui-engineer` (fix with the full report) ... cap 5, run by the EM. Only the first line of the loop in `tsh-orchestrate-ui-verification` changes from `tsh-software-engineer` to `tsh-ui-engineer`, plus a new capture step and the artifact-freshness rule (delete the three ACTUAL files before each capture; the existence check becomes a freshness gate).
- `/tsh-review-ui` currently has `routes-to: tsh-ui-reviewer`. After the split the reviewer cannot capture and the command cannot delegate twice. Options: (a) `routes-to: tsh-engineering-manager` with a "UI verification only, single pass, no fixes" mode that loads `tsh-orchestrate-ui-verification`; (b) keep routing to the reviewer and require artifacts from the user. Recommend (a). Command is outside my scope; it is a dependency (**user decision**).

---

## 2. Per-agent analysis

Format: (1) intent, (2) target, (3) port / do not port, (4) conflicts, (5) size.

### 2.1 tsh-architect (M) -> `src/agents/tsh-architect.md`

1. **Intent.** #65/#67/#76/#79: architect becomes WHO-only, owns plan creation and (upstream) the nested review loop, a pre-submission self-check, a plan-authoring human gate, and the record-writing delegated by the EM. It also becomes the advisor the EM must consult on ambiguity.
2. **Target.** Existing file. Keep `model-tier: deep`, `access: read-write`, shell true (read-only use, as already written), requires-mcp unchanged. Preload stays `tsh-designing-architecture`.
3. **Port:**
   - `## Plan artifact paths` with the three file names and the `{task-name-or-id}` / `{task-name}` distinction (the EM is the single path owner in `src/`; the architect only needs "use the paths your caller gave you; when interactive use these").
   - `## Pre-submission self-check` with the 6 BLOCKER criteria (or, better, put the list in `tsh-designing-architecture` and reference it).
   - `## Disposition of review blockers`: for each eligible BLOCKER do exactly one of resolve / accept with evidence-based justification / escalate to the user; append dated entries to `.plan-review.md`, never overwrite; advisory notes need no rationale. In delegated mode "escalate to the user" = `NEEDS_INPUT`.
   - `## Human approval record` (writer role only, see Q2): write the literal decision (`APPROVED`, `Approved Revision` = current, UTC-Z timestamp; `CHANGES_REQUESTED` before any edit; material change -> bump Plan Revision, `PENDING`, Changelog), never infer or paraphrase consent, never write human approval into `.plan-review.md` and never reviewer approval into the plan table.
   - Material comment classification (material vs formatting-only) for `I have comments`.
   - Low-risk exemption list (7 conditions) for skipping review: move to the EM (it now decides whether to invoke the reviewer) and keep a one-line pointer in the architect. Open question whether the exemption survives (Q3).
   - Constraints: BLOCKERS are never silently dropped or downgraded; reviewer verdict is not consent.
4. **Do not port:** `<plan-review-report ...>` XML schema (use the STATUS/SUMMARY contract, Q3); "invoke `tsh-plan-reviewer` via the Task tool" and the `agent` tool block; the Handoffs section naming `@tsh-engineering-manager` (keep `## Suggested next steps` with `/tsh-implement`); `tsh-sql-and-database-understanding` / `tsh-codebase-analysing` old names; "Implementation Discussion Boundary" and "end the authoring discussion"; "Figma desktop app Dev Mode" text (already removed in `src/`); the XML structure.
5. **Conflicts / decisions.** Q2 (gate owner), Q3 (one review). Also: upstream expects the architect to also run in "advisor" mode for the EM; in `src/` that is the `NEEDS_ARCHITECT_DECISION` route (already in `agent-modes`), so no new mode, only a sentence in the architect body that it answers `DECISION_NEEDED` with a recorded decision (plan Changelog or a short decision note).
6. **Size: medium** (about 40 lines of agent text, plus the skills it points to).

### 2.2 tsh-plan-reviewer (M) -> `src/agents/tsh-plan-reviewer.md` + `src/skills/tsh-reviewing-plans/SKILL.md`

1. **Intent.** #79: reviewer is a lightweight final reality check (architecture, security, execution risk), six BLOCKER categories only, explicit ineligible concerns, revision-bound verdict, advisory notes, never comments on human approval, "short APPROVED is the normal outcome". Hidden from direct invocation.
2. **Target.** Existing agent stays thin (tier deep, read-write for the report only, no shell, same MCP, preload `tsh-reviewing-plans`). The bulk goes to `tsh-reviewing-plans`, which today is the broader adversarial method (BLOCKER definition at line 47 is open-ended).
3. **Port (to the skill):** six categories as the exhaustive BLOCKER list; the ineligible list (grep syntax, diff-hunk counts, style, template conformance, Files bookkeeping, wording, doc sync, report verbosity; a verification defect is eligible only if it removes the only safety proof = category 4); finding discipline (criterion, evidence, consequence, minimum correction); open-questions early exit (any `Open` row in `## Open Questions` = BLOCKER, still write the report); report content shrunk to 3 items; read research first, then plan; read `Plan Revision` verbatim from the plan (or `unknown`, which forces `REVISIONS NEEDED`).
   **Port (to the agent):** never state/evaluate human approval or consent; the read-then-write order; "one write only: the report; never modify the plan".
4. **Do not port:** the XML return schema (Q3), "delegated by tsh-architect via Task tool" in the description, `disable-model-invocation`, the lifecycle-invocation rule as reviewer text (it is the caller's rule).
5. **Conflicts.** The refactor's reviewer is intentionally adversarial ("assume the plan is wrong", WARNING-level categories such as over-engineering as BLOCKER, `tsh-reviewing-plans:78`). Upstream removed exactly that class. **Decision needed** whether the over-engineering BLOCKER (`:78`) stays; recommendation: demote to WARNING to match the six categories.
6. **Size: medium** (mostly skill edits; agent about 10 lines).

### 2.3 tsh-engineering-manager (L) -> `src/skills/tsh-engineering-manager/SKILL.md` (type orchestrator) + `references/`

1. **Intent.** #65 architect-as-advisor (consultation triggers, "never first writer of product code", Constraints); #66 extraction of the workflow into a skill (not needed here); #69/#70 roster and routing for technical-writer, ui-engineer, plan-implementor, software-engineer exception; #72 UI via capture worker; #76/#79 human gate, Quick flow removed; user-facing cadence and delegation-economy rules.
2. **Target.** Existing orchestrator (145 lines, limit 500). Put the long material in `references/` (new files `approval-gate.md`, `routing.md`) and keep the SKILL.md as the router. Do NOT create a separate `tsh-orchestrating-implementation` skill.
3. **Port:**
   - **New delegation blocks** (same format as the existing ones, tool-neutral): `tsh-ui-engineer`, `tsh-plan-implementor`, `tsh-technical-writer`. `tsh-ui-capture-worker` is delegated from `tsh-orchestrate-ui-verification` (an internal step run by the EM), not from a block of its own; add one line saying so. Edit `tsh-software-engineer`'s block to "NON-UI, complex; exception route", and the ui-reviewer block to "after a capture pass, with the artifact directory".
   - **Routing table** (task type -> delegate -> skill): app code plan task -> plan-implementor (default), complex -> software-engineer, UI with Figma -> ui-engineer, E2E, infra/K8s/CI-CD/observability -> devops, LLM prompts -> prompt-engineer, documentation -> technical-writer, `[REUSE]` UI -> ui-reviewer (one item at a time, never batched). Skill names use refactor names (`tsh-implement-task`, `tsh-delivering-infrastructure`, `tsh-writing-documentation`; no `tsh-implement-common-task`).
   - **Architect consultation triggers** (5) + ambiguity escalation + artifact-readiness cascade (already half present in Phase Gates).
   - **Constraints**: the EM never writes product code or documents itself (it keeps the main-thread tools but must delegate; the only exception is the plan-progress checkbox edits it already does — decide); "no suitable specialist -> stop and ask"; "delegation economy" (no Task spawned just to re-verify; one worker per seam; handoffs state exact scope); user-facing cadence (one sentence before the first delegation, update only on ownership change/blocker, lead with the outcome).
   - **Approval gate and Material Revision Handling** per Q2 (read-only validation of the record, reuse receipt, three-choice recovery gate, delegate the record write to the architect).
   - **UI inventory early** (every `[REUSE]` UI task and Figma URL) and pin the dev-server URL once (already in `tsh-orchestrate-ui-verification`); add the "UI-verification scope is broad: any rendered-UI change on a Figma-backed screen counts" rule and "do not infer a Figma MCP blocker from your own tool access; delegate and let the reviewer's runtime decide".
   - **Code review after UI gate; UI and code review reported separately.**
   - Review-fix classification (non-material vs material) and routing back through the correct implementer.
4. **Do not port:** "use the **Task** tool", `@tsh-*` roster, "has no document-editing tools" as a tool claim (cannot be enforced on a skill; keep as a behavioral rule), `tsh-resolving-skill-references` mandate, "Full Flow is the only route" (Q1), the Implementation Discussion Boundary (Q2), `tsh-cursor-engineer`/`tsh-cursor-orchestrator` routing rows (the `/tsh-create-custom-*` commands already load `tsh-ai-customization-orchestrator`; its quick mode is the single-artifact route), the preservation-coverage table, XML structure, GPT/Sonnet model names.
5. **Conflicts.** Q1 (Quick flow/no-plan), Q2, Q3, Q5. Also `caller-status-handling` iteration cap (3) vs the loops with their own caps: keep: plan review once, code-review loop 3, UI loop 5.
6. **Size: large** (EM + 2 reference files; touches `implementation-flows.md`, `tsh-orchestrate-ui-verification`).

### 2.4 tsh-software-engineer (M) -> `src/agents/tsh-software-engineer.md`

1. **Intent.** #70: becomes NON-UI, complex/exception route; UI duties move to ui-engineer. Adds `<version-control-safety>` and the approval precondition. Drops the Figma and Playwright tools and the frontend skills.
2. **Target.** Existing file. `model-tier`: see section 3 (keep `deep`). `requires-mcp`: remove `figma` and `playwright` -> `context7`, `sequential-thinking`. `preload-skills: [tsh-implement-task]` unchanged.
3. **Port:** scope sentence "NON-UI: backend, API, database, business logic; UI with Figma belongs to `tsh-ui-engineer`"; constraints "do not broaden the task", "do not invent implementation details not in the plan"; `Version control safety` section (new partial `version-control-safety`, shared with plan-implementor): never `git clean/restore/checkout --/reset/stash`, treat the working tree as found, delete files with normal edits, if uncommitted changes block the task return `BLOCKED`; the precondition partial (Q1); remove the frontend skill list entries (`tsh-implementing-frontend`, `-forms`, `tsh-writing-hooks`, `-ensuring-accessibility`, `-optimizing-frontend`) and the "Frontend/UI tasks" ask rules.
4. **Do not port:** "Run Code Review / Write E2E Tests" handoffs with `@` mentions (the agent already has `## Suggested next steps`); "communicate with the architect" (returns `NEEDS_ARCHITECT_DECISION`); the no-plan sentence, replaced per Q1.
5. **Conflicts.** `tsh-implement-task` still contains the "UI tasks (Figma)" section that SE reads today. It stays (ui-engineer will use it); add one line "skip it for non-UI work". `/tsh-debug` routes to SE: Q1 scoping keeps it working. After the change, `tsh-orchestrate-ui-verification` must not delegate UI work to SE (Q5).
6. **Size: small-medium.**

### 2.5 tsh-ui-engineer (NEW) -> `src/agents/tsh-ui-engineer.md`

1. **Intent.** #70/#72: UI-specialized implementor; Figma-before-code hard gate; owns UI fixes; (upstream) also orchestrates capture and review.
2. **Target.** New agent. `type: agent`, `model-tier: balanced` (upstream "Claude Sonnet 5"), `access: read-write`, `shell: true` (builds/tests), `requires-mcp: [context7, figma, sequential-thinking]` (no playwright: capture belongs to the worker), `preload-skills: [tsh-implement-task, tsh-implementing-frontend]` (2 max; both named in body). Other skills listed as "load when needed": `tsh-implementing-forms`, `tsh-writing-hooks`, `tsh-ensuring-accessibility`, `tsh-optimizing-frontend`, `tsh-discovering-technical-context`, `tsh-analyzing-implementation-gaps`, `tsh-analyzing-codebase`.
3. **Port:**
   - Role text: UI scope (components, forms, hooks, accessibility, UI performance, visual correctness).
   - **Figma-before-code hard gate**: for any Figma-backed task, fetch and review the design through `figma` before writing markup/layout/styles; if the link or MCP is missing, stop (delegated: `NEEDS_INPUT` with a QUESTIONS entry asking for the link; no figma MCP: `BLOCKED`). The gate is distinct from the verification loop.
   - **Figma EXPECTED only via the figma MCP**; never open figma.com in a browser; if unavailable report `VERIFICATION NOT RUN` (the EM relays).
   - "A clean build is never UI verification": in the output the agent states which components need verification and returns `DONE`; it does not claim PASS.
   - Pinned URL: when the task includes a user-confirmed dev server URL, treat as fixed input; do not infer another port.
   - Auth rule: never bypass/seed/inject auth state (sessionStorage, cookies, tokens) to get past a login wall; credentials stay out of plans/specs/commits.
   - Plan-progress partial, version-control safety? (upstream: no; keep out), precondition partial (Q1).
   - Output: `SUMMARY` lists changed files and the components to verify; fixes from a review report must address ALL listed differences.
4. **Do not port:** the capture/review loop, "5 iterations", the post-budget gate (EM owns it, see Q5); `agent` tool; "Invoke @tsh-ui-capture-worker/@tsh-ui-reviewer/@tsh-code-reviewer/@tsh-e2e-engineer" handoffs; `tsh-implement-e2e` and `tsh-resolving-skill-references` mentions; XML.
5. **Conflicts.** Upstream's agent owns the loop and the user gate: here a fix-pass delegation by the EM passes the previous report as `INPUT_ARTIFACTS`/`PRIOR_OUTPUT`. WCAG version: upstream says 2.1 AA, `src` skill says 2.2 AA: use the skill, do not restate the version.
6. **Size: medium.**

### 2.6 tsh-ui-capture-worker (NEW) -> `src/agents/tsh-ui-capture-worker.md`

1. **Intent.** #72: mechanical evidence collection: exports the shared `figma-expected.png` via the figma MCP, drives the app with `playwright-cli` against a caller-supplied, user-confirmed full URL, writes `actual.png`, `computed-styles.json`, `a11y-snapshot.yml` into the caller's iteration directory, optional `toHaveScreenshot` tripwire; no judgment of design match.
2. **Target.** New agent. `model-tier: fast` (upstream GPT-5.4 mini), `access: read-write` (it writes artifacts under `specifications/<id>/ui-verification/`), `shell: true` (playwright-cli, Playwright test), `requires-mcp: [figma]`, `preload-skills: [tsh-using-playwright-cli, tsh-verifying-ui]` (artifact contract, canonical artifact root, tolerances live in `tsh-verifying-ui`; command patterns in the new playwright-cli skill). Needs the skills to exist first.
3. **Port:**
   - Inputs: confirmed full URL, `$UI_VERIFICATION_DIR`, `$ARTIFACT_DIR`, Figma URL/node, optional auth inputs (env contract or storage-state path).
   - Order: export/ensure `figma-expected.png` before browser capture, so auth does not block EXPECTED.
   - Never infer/normalize a URL, never inspect config for a port, never start another server; artifacts always at explicit paths (never leave them in `.playwright-cli/`); cleanup attempted even after failure; exit codes recorded for open/goto/capture/cleanup/tripwire.
   - **Auth contract** (security-sensitive, keep verbatim in `tsh-using-playwright-cli`/`tsh-verifying-ui`, agent keeps the constraints): `TSH_UI_LOGIN_<FIELD>` env vars derived from `name -> autocomplete -> id -> label`; reload repo-root `.env` on each run; **authorized origin** recorded once from the confirmed URL, compared after all redirects before deriving a key, reading any `TSH_UI_LOGIN_*` variable or `fill`; mismatch = blocker; the worker never authorizes an origin; reads only the variables it requested for the form on screen; no printing of values; storage-state files are secrets, never written under `specifications/**`; no bypass/fake/inject of auth even if trivially possible; flag a trivially bypassable gate as a possible vulnerability in the reply (note only, never exploit).
   - Return data: URL used, artifact dir, shared reference path/status, files written, session name, exit codes, blocker notes, derived env var names in form order, authorized and observed origin, tripwire collected yes/no.
4. **Status mapping:** `DONE` (all three artifacts exist; the data above in `SUMMARY`, paths in `ARTIFACTS`); `NEEDS_INPUT` (login redirect: `QUESTIONS` lists the exact env var names and says "rerun after the file is saved"; origin mismatch: question asks the user to authorize the observed origin; URL missing); `BLOCKED` (page unreachable, figma MCP unavailable, tool failure). Never `NEEDS_ARCHITECT_DECISION`. "Never ask the user directly" is already the delegated-mode rule; upstream's "return blocker to the caller" = these statuses.
5. **Do not port:** "delegated by tsh-ui-reviewer via Task tool" (wrong caller in the refactor: the EM, via the orchestrate step); `disable-model-invocation`; the `figma/*` `MUST/SHOULD NOT` blocks; `Task`; XML. Description: write for the EM ("Use when ... collecting UI capture evidence"), no "subagent" wording (lint).
6. **Conflicts.** Interactive-by-default: if a user invokes it directly it will ask; acceptable, description says "normally delegated". An agent that reads `.env` secrets needs an explicit owner sign-off (see table). Claude/Cursor `.env` read permissions: (unverified).
7. **Size: medium-large** (agent plus the playwright-cli skill with references).

### 2.7 tsh-ui-reviewer (M) -> `src/agents/tsh-ui-reviewer.md`

1. **Intent.** #72: no longer drives the browser. Judges Figma EXPECTED against CLI-captured ACTUAL from the caller's artifact directory; `VERIFICATION NOT RUN` when artifacts are missing/stale; no PASS while a Critical/Major finding remains; clarification gate for content/data/state differences; never loop on a failing tool call (stop after a second failure).
2. **Target.** Existing file. Tier `deep` (see section 3), `access: read-only`, `shell: false`, `requires-mcp: [context7, figma, sequential-thinking]` (remove `playwright`), preload `tsh-verifying-ui`.
3. **Port:**
   - Replace "Every verification MUST use figma and playwright" with "EXPECTED from `figma`, ACTUAL from the artifact directory the caller passed (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`)". Never verify from code reading.
   - Missing/stale/incomplete artifacts -> report `VERIFICATION NOT RUN` with guidance "run the capture step for the same pinned URL and re-delegate". In delegated mode this is `NEEDS_INPUT`/`BLOCKED` with the partial report in the reply body (read-only agent cannot write files; `ARTIFACTS: none`), exactly as `src` does today.
   - PASS gate sentence; do not let pixel-diff tripwire overrule the multimodal and computed-style comparison; second-failure stop rule.
   - Content/data/state clarification gate: keep `FAIL` pending clarification, list items under `Clarification Needed`; in delegated mode these are `QUESTIONS` with `DONE`/`NEEDS_INPUT` per `agent-modes` (a FAIL report with open QUESTIONS is `DONE`).
   - Only-direct-user escalation: auth/login blockers resolved via the `.env` path owned by the caller/capture worker; the reviewer never authenticates.
4. **Do not port:** `playwright/*` MCP text; "export the node image and save it as figma-expected.png" as a reviewer duty: the reviewer is read-only and cannot write. Conflict resolution: the capture worker exports the shared reference (as upstream already specifies); the reviewer reads it, and if it is missing it may view the node through `figma` for judgment but reports `VERIFICATION NOT RUN` for the missing reference (unverified whether Cursor/Codex read-only agents can open PNG files: needs a spike). Also drop `Perform Code Review` handoff text, "called by tsh-ui-engineer".
5. **Conflicts.** `tsh-verifying-ui` and `/tsh-review-ui` must change in step (artifact contract, Q5). Report-format sections `### Artifact Directory/Status/Blocker Resolution` live in `tsh-verifying-ui`.
6. **Size: medium.**

### 2.8 tsh-plan-implementor (NEW) -> `src/agents/tsh-plan-implementor.md`

1. **Intent.** #70: strict executor of exactly one delegated plan task, no scope expansion, default route for approved, actionable, low-risk plan seams; stops with a structured blocker on ambiguity.
2. **Target.** New agent. `model-tier: fast` (upstream qwen3-coder / MAI-Code-1-Flash / GPT-5.4 mini), `access: read-write`, `shell: true`, `requires-mcp: []` (none), `preload-skills: [tsh-implement-task]`. Its "skills usage" list (technical context, gap analysis, codebase analysis) stays as plain skill names in the body.
3. **Port:** role (execute exactly as written; if the request seems mistaken, say so briefly and continue as written); one task at a time, never later phases; do not invent seams/fallbacks/extra files; stop and return the blocker if the seam is missing or the plan ambiguous; plan-progress partial (only the delegated scope's checkboxes); version-control-safety partial; approval precondition partial (Q1); "tests/builds only for task work, never to discard changes".
4. **Status mapping:** `DONE`; `NEEDS_ARCHITECT_DECISION` when the plan is ambiguous or a seam is missing (EM routes to the architect, which fits upstream "ambiguity goes to the architect"); `NEEDS_INPUT` for a missing input only the user has; `BLOCKED` for an invalid approval record (BLOCKER names the failed field; the EM runs its recovery gate) or a version-control conflict.
5. **Do not port:** "delegated by tsh-engineering-manager via Task tool - not for direct user invocation", `disable-model-invocation`, "asking the user directly is reserved for approval recovery" (delegated mode never asks), the `Task` word and "subagent" wording (lint).
6. **Conflicts.** The default-vs-exception rule (plan-implementor vs software-engineer) depends on a definition of "actionable, low-risk seam" that upstream leaves to the orchestration skill and the plan template (per-task `Files`, DoD runnable command). Needs the plan template changes from the skills analysis. Adds a 3-way routing choice to the EM: **user decision** whether to adopt the split now (see table).
7. **Size: small** (about 50 lines) + partial `version-control-safety`.

### 2.9 tsh-technical-writer (NEW) -> `src/agents/tsh-technical-writer.md`

1. **Intent.** #69: owns README, CHANGELOG, in-repo `/docs`, the published docs site (when present); verifies every claim against the repo; mirrors neighbouring pages; never writes product code. F6 closed the open-ended scope.
2. **Target.** New agent. `model-tier: fast` (upstream Luna + GPT-5.4 mini), `access: read-write`, `shell: true` (docs build, link check), `requires-mcp: []`, `preload-skills: [tsh-writing-documentation]` (new knowledge skill; the upstream internal `tsh-write-documentation` is folded in: input = delegated slice + technical context; output = files changed, one-line summary per file, build/verification result, open dependencies).
3. **Port:** responsibilities and boundaries (4 + 4 bullets); "docs build failure = broken internal links are build failures, never invent link targets"; "if docs cannot be written without a code change, stop and report the dependency" (-> `BLOCKED` with BLOCKER); plan-progress partial; precondition partial (Q1); skills list: `tsh-technical-context-discovering` -> `tsh-discovering-technical-context`, `tsh-codebase-analysing` -> `tsh-analyzing-codebase`.
4. **Do not port:** "check all available skills and decide which fits" boilerplate (AG-X8 removed it everywhere), tool MUST/SHOULD NOT blocks, "Task tool" in description, `disable-model-invocation`.
5. **Conflicts / decisions.** (a) The precondition makes a docs-only change require an approved plan; consider exempting docs-only tasks, otherwise "update the README" needs a plan first (upstream accepts that). (b) In this repo `website/docs` is hand-authored and `CHANGELOG.md` has conventions (`tsh-committing`/AGENTS.md); the writer must follow project instructions, not a built-in layout. (c) EM routes documentation work to the writer; `tsh-ai-customization-*` still own skill/agent files, so the boundary "not generated outputs, not `src/`" should be stated.
6. **Size: small-medium** (agent + new knowledge skill of 100 lines).

### 2.10 tsh-code-reviewer (S) -> `src/agents/tsh-code-reviewer.md`

1. **Intent.** #65/#70: N+1 and in-memory-processing anti-pattern coverage; "report every evidence-backed finding, then classify severity" (high recall); fixes route to software-engineer (non-UI) or ui-engineer (UI); explicit read/search/execute tool entries (F2, F3).
2. **Target.** Existing; no frontmatter change.
3. **Port:** the recall sentence; extend the `tsh-designing-databases` skill hint with "N+1 access patterns or in-memory data processing"; the anti-pattern checklist belongs in `tsh-reviewing-code` (upstream added it to the code-reviewing skill; `src/skills/tsh-reviewing-code` has no N+1 mention, grep-verified); in `## Suggested next steps` say UI fixes go to `/tsh-implement` (EM routes to `tsh-ui-engineer`).
4. **Do not port:** `Atlassian`/`execute` tool blocks, `*.mdc` rules, `Task`, XML.
5. **Conflict.** None. **Size: small.**

### 2.11 tsh-devops-engineer (S) -> `src/agents/tsh-devops-engineer.md`

1. **Intent.** Precondition added; F4 changed "agent tool" to "Task tool"; new fallback when the architect cannot be spawned (ask the user: retry / state the stack / stop).
2. **Target.** Existing; no frontmatter change.
3. **Port:** precondition partial (Q1). Nothing else.
4. **Do not port:** all architect delegation text (the refactor already returns `NEEDS_ARCHITECT_DECISION`); "Task tool"; the managed-containers fallback was already removed in `src/` (grep-verified).
5. **Conflict.** The cost/audit commands (`/tsh-analyze-cloud-costs`, `/tsh-audit-infrastructure`) route to devops with no plan: Q1 scoping must exempt read-only audits. **Size: small.**

### 2.12 tsh-e2e-engineer (S) -> `src/agents/tsh-e2e-engineer.md`

1. **Intent.** Precondition added; defects found by tests route to software-engineer (non-UI) or ui-engineer (UI); the "no plan" sentence removed.
2. **Target.** Existing; no frontmatter change (playwright MCP stays: E2E still uses it).
3. **Port:** precondition partial; defect routing as `## Suggested next steps`; remove the no-plan fallback only if Q1 is decided to remove Quick flow.
4. **Do not port:** `@` handoffs, XML, `tsh-implement-e2e` reference (folded into the agent).
5. **Conflict.** Same as 2.11 for no-plan runs. **Size: small.**

### 2.13 tsh-prompt-engineer (S) -> `src/agents/tsh-prompt-engineer.md`

Precondition partial added; the "no plan -> technical judgment" sentence removed upstream. **Port:** the partial and, after Q1, the sentence change. **Do not port:** skill-reference-resolution text, XML. **Size: small.**

### 2.14 tsh-context-engineer (S) -> `src/agents/tsh-context-engineer.md`

Only the XML restructure and a "resolve skill references / read the skill file" note for `tsh-research`. **Port:** nothing (`tsh-research` is folded into `tsh-analyzing-requirements`; skill resolution is dropped). **Size: none (no-op).**

### 2.15 Business analyst group: tsh-business-analyst and 5 workers (no-op) -> `src/skills/tsh-business-analyst/SKILL.md`, `src/agents/tsh-ba-*-worker.md`

Upstream: XML restructure; removed the per-worker model names from the BA prose (01d6351) and the `Recommended model` lines. `src/skills/tsh-business-analyst/SKILL.md:21` already uses worker tiers instead of model names. **Port:** nothing. **Size: none.**

### 2.16 tsh-cursor-* group (S) -> `tsh-ai-customization-{orchestrator,researcher,creator,reviewer}`; `tsh-cursor-engineer` deleted

- `tsh-cursor-engineer`: only model/tools lines changed; the agent is deleted in the refactor (legacy-names `deleted`). Upstream also routes "Cursor customization (single artifact)" to it. Refactor equivalent: quick mode of `tsh-ai-customization-orchestrator` (`SKILL.md:51`). **Port:** nothing.
- `tsh-cursor-orchestrator` -> `src/skills/tsh-ai-customization-orchestrator/SKILL.md`: **Port** the cadence rules (one sentence before the first worker run; progress updates only when a phase completes or direction changes, replacing line 98 "between worker runs"; lead with the outcome; concise replies), delegation-economy (no worker for work doable with a few reads; one worker per seam; no worker whose only job is to re-verify another worker's output; exact scope in handoffs). **Port as text** the "plans/plan review/human approval -> route the user to `/tsh-implement`" sentence (the refactor already forbids delegating to the EM). Mapping of "prefer `@tsh-cursor-engineer`" -> "quick mode".
- `researcher`, `creator`, `reviewer`: XML restructure and tool-block wording only (creator still names `.cursor/skills/agents/` paths, already retargeted in `src/`). **Port:** nothing; the reviewer's `read`/`search` MUST/SHOULD NOT bullets are not needed.
- **Size: small** (orchestrator text only).

---

## 3. Model changes mapped to tiers (`src/config/targets.json`: deep / balanced / fast / inherit)

Upstream changed `Recommended model` lines in #70, #72, #73 and then deleted all of them (d7a2f25, 01d6351, 321c149: "non-functional", "model selection is session-level"). The final upstream state has no model per agent. So the only live content is the transition below. Cursor tier models are `null`, so tiers matter for Claude (opus/sonnet/haiku) and Codex only.

| Upstream agent | Base model -> #70/#72/#73 | Current tier | Recommended tier |
|---|---|---|---|
| architect, context-engineer, prompt-engineer, business-analyst, ba-quality-worker | GPT-5.4 -> GPT-5.6 Terra + GPT-5.4 | deep | deep (no change) |
| plan-reviewer | GPT-5.4 -> GPT-5.6 Sol + GPT-5.5 | deep | deep |
| cursor-artifact-reviewer | Gemini 3.1 Pro -> Sol + GPT-5.5 | deep | deep |
| ba-analysis-worker | Gemini 3.1 Pro (unchanged) | deep | deep |
| code-reviewer, devops-engineer, cursor-researcher, ba-extraction-worker | Sonnet 4.6 -> Sonnet 5 | balanced | balanced |
| ba-transcript, ba-formatting, cursor-artifact-creator | GPT-5.4 mini -> Luna + GPT-5.4 mini | fast | fast |
| e2e-engineer | GPT-5.4 mini (unchanged) | fast | fast |
| software-engineer | Gemini 3.1 Pro -> Kimi K2.7 Code, GPT-5.3-Codex, Gemini 3.5 Flash | deep | **keep deep** (now the complex-exception path); decision |
| ui-reviewer | Gemini 3.1 Pro -> Sonnet 4.6 (#72) | deep | **keep deep** (multimodal judgment); decision |
| engineering-manager, cursor-orchestrator | GPT-5.4 -> Luna/Terra + Sonnet 5 | orchestrators (main thread, no tier) | n/a |
| NEW ui-engineer | Sonnet 5 | - | balanced |
| NEW plan-implementor | qwen3-coder-30b (custom endpoint), MAI-Code-1-Flash, GPT-5.4 mini | - | fast |
| NEW technical-writer | Luna + GPT-5.4 mini | - | fast |
| NEW ui-capture-worker | GPT-5.4 mini | - | fast |

Rationale: our tiers are quality tiers, upstream arrays are Copilot cost/availability picks; none of the upstream moves crosses a tier boundary except the two flagged rows. Codex mapping for `fast` is `gpt-5.4-mini` (no reasoning effort set): acceptable for plan-implementor and capture worker; whether the writer needs `balanced` for prose quality is a taste call. `shell`/`access` values for new agents are in their sections.

## 4. Order of work (suggested, dependencies first)

1. Decide Q1-Q5 (table below).
2. Skills the agents depend on: `tsh-writing-documentation`, `tsh-using-playwright-cli`, updates to `tsh-verifying-ui`, `tsh-reviewing-plans`, `tsh-designing-architecture` (plan template: Plan Revision and Human Approval), `tsh-reviewing-code` (N+1), `tsh-orchestrate-ui-verification`.
3. Partials: `human-approval-precondition`, `version-control-safety`.
4. New agents: plan-implementor, technical-writer, ui-engineer, ui-capture-worker. Edits: software-engineer, ui-reviewer, architect, plan-reviewer, e2e/devops/prompt (partial include), code-reviewer.
5. EM skill + references, `/tsh-review-ui` routing, `ai-customization-orchestrator` cadence edit.
6. Run `npm run generate && npm run check && npm test`; regenerate counts in README/website (not analysed here).

## 5. Summary table

| Upstream agent | Target | Size | Needs user decision |
|---|---|---|---|
| tsh-architect | `src/agents/tsh-architect.md` (+ `tsh-designing-architecture`) | medium | yes: Q2 single EM-owned approval gate instead of upstream two-gate model; Q3 one review per lifecycle |
| tsh-plan-reviewer | `src/agents/tsh-plan-reviewer.md` + `tsh-reviewing-plans` | medium | yes: drop the over-engineering BLOCKER (six categories only)? |
| tsh-engineering-manager | `src/skills/tsh-engineering-manager/` (+ 2 references) | large | yes: remove Quick flow and no-plan mode (Q1)? drop Implementation Discussion Boundary (Q2)? |
| tsh-software-engineer | existing agent, make non-UI | small-medium | yes: tier stays `deep`? |
| tsh-ui-engineer (new) | new agent: balanced, rw, shell, figma+context7+seq-thinking, preload `tsh-implement-task`+`tsh-implementing-frontend` | medium | no (follows Q5) |
| tsh-ui-capture-worker (new) | new agent: fast, rw, shell, figma, preload playwright-cli skill + `tsh-verifying-ui` | medium-large | yes: approve agent reading `TSH_UI_LOGIN_*` from repo `.env` (origin-bound) |
| tsh-ui-reviewer | existing agent, read-only, drop playwright MCP | medium | yes: `/tsh-review-ui` route (EM "UI-only mode" vs direct) and keep tier `deep`? |
| tsh-plan-implementor (new) | new agent: fast, rw, shell, no MCP, preload `tsh-implement-task` | small | yes: adopt the 3-way routing split now? |
| tsh-technical-writer (new) | new agent: fast, rw, shell, no MCP, preload `tsh-writing-documentation` | small-medium | yes: exempt docs-only tasks from the approval precondition? |
| tsh-code-reviewer | existing agent + `tsh-reviewing-code` | small | no |
| tsh-devops-engineer | existing agent (partial include only) | small | no (after Q1) |
| tsh-e2e-engineer | existing agent (partial include) | small | no (after Q1) |
| tsh-prompt-engineer | existing agent (partial include) | small | no (after Q1) |
| tsh-context-engineer | none | none | no |
| tsh-business-analyst + 5 BA workers | none | none | no |
| tsh-cursor-orchestrator | `tsh-ai-customization-orchestrator` (cadence text) | small | no |
| tsh-cursor-researcher / -creator / -reviewer | none | none | no |
| tsh-cursor-engineer | deleted (quick mode of the ai-customization orchestrator) | none | no |
| XML-tag normalization (all agents) | not ported | none | yes (confirm drop; Q4) |
