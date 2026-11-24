# Upstream port analysis: skills, commands, internal, workflows, rules

Scope: `git diff --name-status 324d2fd..origin/main -- .cursor/skills/commands .cursor/skills/internal .cursor/skills/workflows .cursor/rules` (43 paths: 6 commands, 8 internal, 13 workflow dirs incl. `playwright-cli` with 10 references, 3 rule files). Upstream = origin/main (34 commits, ports of Copilot-collections PRs #65-#79 plus CodeRabbit fixes). Refactor = branch `refactor/unified-agent-structure` (`src/`).
All upstream files were read via `git show origin/main:<path>`; current `src/` files were read directly. Unverified items are marked **(unverified)**.

Out of scope but required by these skills (agent analysts own them): new agents `tsh-ui-capture-worker`, `tsh-ui-engineer`, `tsh-plan-implementor`, `tsh-technical-writer`; changed `tsh-architect`, `tsh-plan-reviewer`, `tsh-ui-reviewer`, `tsh-engineering-manager` (upstream agent). Dependencies on them are listed per section.

## 0. Cross-cutting findings (read first)

1. **Upstream is still in the old model**: skills are loaded by reading paths, internal skills carry `disable-model-invocation: true`, workers are told to "ask the user in chat", the manager is an agent plus a workflow skill, nesting is partly used (reviewer was told to call the capture worker in earlier commits; later commits moved capture to the manager). A literal port breaks D5/D6. Every port item below is a semantic port.
2. **Upstream abolished the Quick flow** ("Full Flow is the only route", "Unplanned implementation is no longer offered anywhere", commit 7bea710 message + follow-up commit). Our D5/`implementation-flows.md`, `/tsh-implement` ("recommend Quick for small changes"), `tsh-implement-task` "No plan provided" section and `/tsh-debug`/`/tsh-refactor` all rely on plan-less work. This is the biggest design conflict (Decision A).
3. **Duplicated blocks upstream**: the auth/`.env`/origin-binding text exists 5 times (orchestrating-implementation, implement-ui, ui-verifying, playwright-cli, capture worker). In `src/` it must have exactly one owner (`tsh-verifying-ui`, new `references/authenticated-capture.md`); everything else says "per the `tsh-verifying-ui` skill".
4. **Cursor-only / non-neutral syntax in upstream text** (never port): "Task tool", `read`/`search`/`execute` tool names, `figma/*`, "agent discovery", "Cursor Settings", `disable-model-invocation` explanations, `@tsh-...` mentions, "must be **read**, not invoked", `.cursor/skills/<layer>/...` paths, XML-tag body structure mandate (`<principles>`, `<agent-role>`), `vscode/*`, "Recommended model/tools" removal notes (already handled in our migrating skill).
5. **Lint/schema impacts of the port** (verified in `scripts/`): `SKILL_KEYS` lacks `allowed-tools` (playwright-cli has it); `naming-by-type` requires knowledge skills `^tsh-[a-z]+ing(-[a-z0-9]+)*$` (so `playwright-cli` fails the `tsh-` prefix and naming schema); `references/` files over 100 lines need `## Contents` (8 of the 10 playwright-cli references are over 100 lines); `SKILL.md` max 500 lines (playwright-cli is 478 before any adaptation).
6. **Version/dep**: UI capture requires the `playwright-cli` binary on the user's machine (upstream documents `npx playwright-cli` / `npm i -g @playwright/cli@latest`). That is not an MCP server, so `requires-mcp` cannot express it. See section 4.

## 1. Orchestration: `tsh-orchestrating-implementation` (new, 248 lines), `commands/tsh-implement`, `agents/tsh-engineering-manager` split

### 1.1 Upstream intent
PR #66: split the manager into WHO (agent, delegation guidelines) and HOW (workflow skill `tsh-orchestrating-implementation`: todo protocol, Full Flow readiness table, Task-to-Owner routing table, material revision handling, approval gate separation, implementation discussion boundary, execution rules 1-13 incl. UI loop). `/tsh-implement` shrank to "load manager agent, then read the workflow skill". PR #76 added the human approval gate and removed the Quick flow.

### 1.2 Target in the refactor
**Merge into the existing `src/skills/tsh-engineering-manager/` (type `orchestrator`), content moved to references; no second orchestrator skill.** Reasons:
- In the refactor the manager already IS a main-thread skill (D5). Upstream's agent-vs-workflow split exists only because the manager was a Cursor/Copilot agent persona; D5 removed that persona. A second orchestrator would give two skills with the same responsibility, two `caller-status-handling` includes and an ambiguous `routes-to`.
- Size: upstream 248 lines (40 KB, very dense lines) + ours 145 + 37. Merging all inline would exceed the 500-line cap, so use references.
Proposed layout (all under `src/skills/tsh-engineering-manager/`):
| File | Content |
|---|---|
| `SKILL.md` | Role, principles (never edits files itself, read/search only for routing, delegation economy, user-facing cadence, todo role), flow selection, artifact paths, loops. Stays at about 170-200 lines. |
| `references/implementation-flows.md` | Existing; Full flow gains the approval gate steps (see 2.3). |
| `references/task-routing.md` (new, has `## Contents`) | Task-to-owner table adapted to our names (see 1.4). |
| `references/plan-approval.md` (new) | `## Human Approval` predicate, reuse receipt, material revision handling, gate wording. |
Type `orchestrator`, name unchanged, no new command (`/tsh-implement` already `routes-to: tsh-engineering-manager`).

### 1.3 Port vs do not port
Port (re-worded neutrally, markdown headings, no XML tags):
- Principles: never edits any file itself (all file changes are delegated to the owning specialist); read/search only to choose the specialist; if no specialist exists stop and ask the user (do not self-execute); todo list is a progress surface, not context recovery; delegation economy (no subagent only to double-check own work; one worker per seam; exact scope in handoffs); user-facing cadence.
- Step 0 todos: one todo per plan task, per review event, per `[REUSE]` UI verification item, per final gate; update plan first on scope change. (Our manager already says "one todo per task"; add the review/gate todos.)
- Planning readiness table (research / plan / open-questions gate / Technical Context / reviewer readiness / human approval): replace "Route to `tsh-architect` following `tsh-plan`" with delegation to `tsh-architect` using `tsh-designing-architecture`; Technical Context missing -> `tsh-architect` with `tsh-discovering-technical-context` (upstream said `tsh-review-codebase`, which in our repo is `/tsh-audit-codebase`, the wrong target; do not copy).
- Open Questions gate: plan not dispatchable while any row is `❓ Open` (also goes into `tsh-designing-architecture`, section 3).
- UI-verification scope rule: any change to rendered UI on a Figma-backed screen counts as UI work even without a `[REUSE]` task; obtain the Figma reference (ask the user if missing) and run the gate. Goes into `tsh-orchestrate-ui-verification` (section 5), referenced from the manager.
- Material Revision Handling and approval record rules (section 2).
- Execution rules 1-6, 8-13: stay inside the approved plan; handoff contract (bounded slice, technical context, targeted summary of prior output, Figma URL mandatory for UI tasks); update plan and todo after each task; checks after each task; UI gate before code review, reported separately from code review; classify review fixes as material or non-material; route fixes through the correct implementer; deviations to Changelog.
- Documentation work type routes to the technical writer (new agent, see 7).
Do NOT port:
- "Full Flow is the only route / no alternative flow may be offered" and "do not offer no-plan implementation" -> Decision A.
- Implementation Discussion Boundary -> Decision C.
- Task-to-Owner rows for `tsh-cursor-engineer` / `tsh-cursor-orchestrator`: customization work is reached through `/tsh-create-custom-*`, not through the EM. Do not add routing from the manager to `tsh-ai-customization-orchestrator`.
- Rows naming devops internals (`tsh-implement-terraform`, `tsh-deploy-kubernetes`, `tsh-implement-pipeline`, `tsh-implement-observability`), `tsh-implement-e2e`, `tsh-engineer-prompt`: in the refactor these are folded; routing is by agent plus `tsh-delivering-infrastructure` / `tsh-writing-e2e-tests` / the agent itself.
- Everything about locating skill files ("resolve per `tsh-resolving-skill-references`", "must be read, not invoked", the Note under the routing table, the Connected Skills line): see section 6.
- "Task tool", "`read`/`search` tools", "agent discovery", `tsh-ui-capture-worker is invocable with the Task tool` wording. State neutrally: "delegate to the `tsh-ui-capture-worker` subagent".
- The 4x repeated authentication/`.env`/origin paragraphs in execution rule 7: keep one pointer to `tsh-verifying-ui`.
- "Preservation coverage" table (refers to checklist item numbers of the upstream port plan; meaningless here).

### 1.4 Routing table in our names (for `references/task-routing.md`)
| Task type | Delegate to | Skill the delegate follows |
|---|---|---|
| App code, plan task, low risk (DEFAULT upstream) | `tsh-plan-implementor` **only if** that agent is ported (see Decision F); otherwise `tsh-software-engineer` | `tsh-implement-task` |
| App code, complex | `tsh-software-engineer` | `tsh-implement-task` |
| UI with Figma | `tsh-ui-engineer` if ported, else `tsh-software-engineer` | `tsh-implement-task` (section "UI tasks (Figma)") |
| E2E | `tsh-e2e-engineer` | `tsh-writing-e2e-tests` (preloaded) |
| IaC, Kubernetes, CI/CD, observability | `tsh-devops-engineer` | `tsh-delivering-infrastructure` |
| LLM prompts | `tsh-prompt-engineer` | `tsh-engineering-prompts` (preloaded) |
| Documentation | `tsh-technical-writer` | `tsh-writing-documentation` |
| `[REUSE]` UI verification | manager runs `tsh-orchestrate-ui-verification` (capture worker, then `tsh-ui-reviewer`) | `tsh-verifying-ui` |

### 1.5 Conflicts and recommendations
- Upstream says the manager has "no document-editing tools" and therefore delegates the approval-record write to the architect. Our manager is a main-thread skill with whatever tools the session has. Recommendation: keep the principle "orchestrator never edits files", delegate the narrow write ("record Human Decision X at timestamp T, Plan Revision unchanged") to `tsh-architect` as a `MODE: delegated` task. Small extra delegation, single owner of the schema.
- Upstream routes `NEEDS_ARCHITECT_DECISION`-like cases by prose; ours has the status protocol. Keep ours.
- Upstream "ask the user which of exactly two options: `stop here` or `custom guidance`" when the architect cannot settle a review blocker: map to architect returning `NEEDS_INPUT`; the manager asks these two options.
- Upstream `tsh-implement` instructs "Delivery begins in a new discussion". Our `/tsh-implement` stays one line; the discussion rule (if adopted) lives in the manager.
- Size: **large** (reference files plus manager edits; careful because `caller-status-handling` include must stay and the 3/5-iteration caps must be preserved).

## 2. Human plan-approval gate and execution-owner precondition

### 2.1 Upstream contract (PR #76/#79, verified in plan example, creating-implementation-plans and orchestrating skill)
- Every plan has `## Human Approval` table: `Plan Revision` (int), `Human Decision` (`PENDING|APPROVED|CHANGES_REQUESTED|STOPPED`), `Approved Revision`, `Decision Timestamp` (ISO 8601 UTC with `Z`), `Note`.
- Valid approval iff `Human Decision=APPROVED` AND `Approved Revision = current Plan Revision` AND valid UTC-`Z` timestamp. A material change bumps `Plan Revision`, sets `PENDING`, clears `Approved Revision`, logs the reason in Changelog, halts all file-changing delegation, and does NOT trigger a reviewer automatically.
- Two gates: architect plan-authoring gate (`Approve plan` / `I have comments`, right after a settled review event) and manager execution-authorization gate (`Approve current plan` / `Request changes` / `Stop`, recovery only when no valid record exists). Manager reuses a valid on-disk record via an ephemeral `reused` receipt, fails closed with an `invalid-or-missing` receipt.
- Low-risk automated-review exemption for initial plan preparation (no reviewer report; never replaces human approval).
- Seven execution owners carry a byte-identical `<human-approval-precondition>`: read the plan from disk, validate the predicate, fail closed, then ask the user which next step to take (options: point at the plan, request approval now, back to architect, stop; "hand back to the manager" when delegated). Direct invocation never bypasses.

### 2.2 Conflicts with the refactor
1. Owners "ask the user in chat" -> forbidden for delegated agents. Map to `agent-modes`: interactive = ask with the listed options; delegated = `STATUS: BLOCKED` (for an unreadable/stale record, with `BLOCKER:` naming the exact field/condition/file) or `NEEDS_INPUT` (the options as `QUESTIONS`). Never ask directly.
2. Architect asks the human directly at its own gate -> in delegated mode impossible. The architect cannot present `Approve plan`. Either the manager presents it (one gate), or the architect presents it only in interactive mode.
3. Plan-less flows (Quick flow, `/tsh-debug` -> software engineer, `/tsh-refactor` plan is a normal plan so fine) have no `## Human Approval`. A precondition that applies to every file-changing run would block `/tsh-debug` and the Quick flow (Decision A).
4. "Plan reviewer approval is Reviewer approval only" is already consistent with our `tsh-reviewing-plans` (APPROVED verdict separate from user confirmation). No conflict.
5. Our existing phase gates ("ask the user to confirm") and plan-review loop steps 2 and 5 of Full flow already contain two informal confirmations; they should collapse into the one formal gate.

### 2.3 Mapping onto our Full flow (`references/implementation-flows.md`)
Current steps -> proposed:
1. Assess state -> unchanged (also read `## Human Approval`).
2. Validate plan (review loop, cap 3) -> unchanged; on `APPROVED`: do not ask a generic "confirm" yet.
3. Analyze the plan (todos per task) -> unchanged.
4. Technical context -> unchanged.
5. "Confirm with the user" -> **replaced by the gate**: validate the persisted record (predicate above). Valid -> reuse (tell the user path, revision, timestamp). Invalid/missing/PENDING -> present exact plan path, current content summary, `Plan Revision`, review path (or the statement that the low-risk exemption applies, if adopted), offer `Approve current plan` / `Request changes` / `Stop`; record the literal choice via `tsh-architect` (delegated write).
6. Process tasks -> every file-changing delegation passes the plan path; delegate prompt says `PLAN: <path>, REVISION: <n>`; owners re-validate (defence in depth, as upstream).
10. Changes during the work -> "ask the user before changing the solution" is replaced by the material/non-material classification: non-material plan-conforming fixes need no re-approval; material ones run Material Revision Handling (renewed gate, no automatic re-review).
Add to the cap table: gate re-asks after material revision are not iterations of the plan review loop (cap 3 unchanged).

### 2.4 Target artifacts
- `src/partials/human-approval-precondition.md` (new): the predicate plus the mode-aware failure behaviour; included by `tsh-software-engineer`, `tsh-e2e-engineer`, `tsh-devops-engineer`, `tsh-prompt-engineer` and the ported new owners (writer, plan-implementor, ui-engineer if ported). This replaces upstream's "byte-identical copy in seven agents" with an `include` (needs an `agent-modes` cross-check; lint already supports partial includes).
- `src/skills/tsh-designing-architecture/assets/plan.template.md`: add `## Human Approval` (see section 3).
- `src/skills/tsh-engineering-manager/references/plan-approval.md` (new).
- Optionally `tsh-reviewing-plans`: `reviewed-plan-revision` in the report header (upstream PR #79; agent analyst to confirm). Scope note only.

### 2.5 Recommendations
- **One gate, owned by the manager in the main thread** (options as upstream's execution gate). Drop the architect's `Approve plan`/`I have comments` as a separate user-facing gate in delegated mode; in interactive mode (user talks to `tsh-architect` directly) the architect may offer `Approve plan` and write the record itself, which the manager then reuses. This keeps the persisted record and the reuse logic but removes the second delegated-mode user question.
- Keep the predicate and the schema byte-for-byte (cheap, auditable); do not add receipts to disk (upstream explicitly forbids).
- Size: **large** (plan template, partial, 4 to 7 agents via include, manager references, flows). Needs user decisions A, B, C below.

## 3. `tsh-creating-implementation-plans` (new), `tsh-architecture-designing` (modified), `tsh-plan` (modified), plan example

### 3.1 Upstream intent
Split "design the solution" (`tsh-architecture-designing`) from "structure it as a plan" (new `tsh-creating-implementation-plans`, owner of the template `plan.example.md`, DoD rules, mandatory plan content). `tsh-plan` became a thin internal step. The old `tsh-architecture-designing/plan.example.md` was deleted in favour of the new one (291 lines).

### 3.2 Target in the refactor
Our `tsh-designing-architecture` already merges design + plan authoring and absorbed `tsh-plan`. **Do not create a second skill.** Options: (a) keep one skill and import the hardened contract; (b) create `tsh-writing-implementation-plans` (gerund-first, knowledge skill) for the plan contract and make `tsh-designing-architecture` link to it. Recommendation (a): the plan template already lives in `assets/` and the contract is about 30 lines of rules; a second skill adds a load hop and a name that agents must be told about. Revisit if `SKILL.md` approaches 200 lines. (Upstream's naming `tsh-creating-implementation-plans` is also not our verb-gerund style relative to `tsh-creating-*` authoring skills; if (b) is chosen, name it `tsh-writing-implementation-plans`.)
Support layout for (a): `assets/plan.template.md` (updated), `references/plan-contract.md` (optional, only if rules do not fit into the SKILL.md `## Planning rules` section).

### 3.3 Template diff: upstream `plan.example.md` vs our `assets/plan.template.md`
| Element | Upstream | Ours | Port? |
|---|---|---|---|
| `Task Details` first row | `Jira ID` | `Task ID` + `Behavior-preserving` row | keep ours (refactor mode depends on it) |
| `## Wildly Important Goal` (Goal, Success Measure, Do NOT touch / add) | present | missing | port (scope-creep control) |
| Current Implementation Analysis order | Already Implemented / To Be Modified / To Be Created | To Be Created / Modified / Reused (matches `tsh-analyzing-implementation-gaps`) | keep ours |
| `## Human Approval` table + protocol comment | present | missing | port (section 2), drop the `<human-approval-protocol>` XML tag, use plain text |
| Technical Context: "relevant `.cursor/rules/*.mdc`" | cursor-only | neutral wording (`AGENTS.md`, `CLAUDE.md`, scoped rules) | keep ours |
| Per phase | `**Goal**`, `**Description**`, `**Verification:**` | none | port Goal/Description/Verification |
| Per task | `**Files:**` with `create/modify/reuse` + back-reference `(modify — created in Task 1.1)`; `**Stop Rule:**`; `**Clues**` | none | port Files (also feeds `tsh-implement-task` scope), Stop Rule, Clues |
| DoD | at least one reviewer-verifiable check; code tasks need a runnable command taken verbatim from Technical Context (never assumed Node/npm); docs/config tasks may use a grep-style assertion | "specific verifiable criterion" | port |
| Executable-slots dispatch gate | no angle-bracket placeholder or assumed-default command in Verification/DoD/Files before dispatch | missing | port into planning rules and the plan-reviewer checklist (agent analyst) |
| Open-questions dispatch gate | no dispatch while any row is `❓ Open` | missing | port |
| No real code in plans (pseudo-code and seams allowed) | present | missing | port |
| UI verification task text | capture worker -> reviewer -> engineer fix, max 5 iterations; `UI Verification Status` element (component, iteration count, final status `PASSED/ESCALATED/VERIFICATION NOT RUN`, Figma URL) tracked separately from code review | single paragraph, fix goes to `tsh-software-engineer` | port the status block and wording, adapt owners (Decision F), reference `tsh-orchestrate-ui-verification` by name |
| Code review phase | explicit Phase 4 in template, code review via `tsh-review` with E2E passed to the reviewer | rule text only, no phase in the template | port the phase to the template (rule already in SKILL.md) |
| Prompt task | `tsh-prompt-engineer` using `tsh-engineer-prompt` | rule text, subagent | keep ours |
| Mandatory clause "resolved per `tsh-resolving-skill-references`" in review/UI/prompt tasks | present | n/a | **do not port** (section 6) |
| Plan path | `specifications/{task-name-or-id}/{task-name}.plan.md` | `<specs>/<task>/<task>.plan.md` via technical-context resolution | keep ours |
| Bug-fix planning, scope, reuse | present | present | no change |
| `## Contents` TOC | none | has TOC | keep (template over 100 lines) |
Size note: template grows from 174 to about 290 lines (TOC required, already present).

### 3.4 `tsh-architecture-designing` -> `tsh-designing-architecture`
- Port nothing structural (Step 5 "hand off" is moot after the merge).
- The upstream-deleted `plan.example.md` is already `assets/plan.template.md` here.
- Planning rules gain: Open Questions gate, executable-slots gate, no-real-code, per-task `Files` and `Stop Rule`, UI Verification Status, Human Approval, "architect owns material revision bump".
- Architect's interactive plan-authoring gate (see 2.5) is documented in `tsh-architect` (agent analyst), not in this skill.
- Size: **medium**.

### 3.5 `internal/tsh-plan` (modified)
Already merged into `tsh-designing-architecture` (legacy list `deleted: tsh-plan`). Nothing to port beyond 3.3/3.4. Size: **small**. Needs user decision: no.

## 4. `playwright-cli` (new, 478-line SKILL.md + 10 references, vendored) and Playwright MCP -> CLI for UI verification

### 4.1 Upstream intent
PR #72: UI verification no longer drives Playwright MCP from the reviewer. A new worker (`tsh-ui-capture-worker`) uses the `playwright-cli` binary to produce three artifacts (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`) into `specifications/<id>/ui-verification/iteration-<N>/`, plus the shared `figma-expected.png`; the reviewer (read-only, `figma` only) compares them. Rationale visible in text: CLI output goes to disk instead of the model context (context savings), deterministic artifacts, auth through env contract and storage state, optional `toHaveScreenshot` tripwire. `playwright-cli` is a vendored third-party skill (upstream-diffable, kept unprefixed).

### 4.2 Target
Port as a **knowledge skill** `src/skills/tsh-using-playwright-cli/` (gerund-first, same family as `tsh-using-mcp-servers`; passes `naming-by-type`). `type: skill`, `metadata.short-description`, description with "Use when". Support files: `references/` with the 10 upstream files, each over 100 lines prefixed with `## Contents` (element-attributes 23 and playwright-tests 39 lines need none). Rename inside text: `playwright-cli` command name stays (it is a binary); the skill name differs from the binary name, which is fine.
Alternative: keep the vendored name `playwright-cli` as an allowlisted exception, as upstream did with its named exceptions. That needs: relaxing `NAME_RE`/`naming-by-type`, adding `allowed-tools` to `SKILL_KEYS`, and an AGENTS.md exception. Not recommended: our AGENTS.md says "Everything uses the `tsh-` prefix" and has no exception mechanism; the lint allowlist is empty by design.
`allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*)`: either add `allowed-tools` to `SKILL_KEYS` (and the renderer for Claude only; Cursor/Codex ignore it **(unverified)**) or drop it. Recommend drop; shell permission is expressed by agent `shell: true` on the capture worker.

### 4.3 Port vs do not port
Port: Quick start, command groups (core, navigation, keyboard, mouse, tabs, storage, network, devtools), raw output (`--raw` for piping to files), named sessions (`-s`), open parameters, `run-code`, tracing, video, request mocking, storage state, element attributes, test generation, spec-driven testing references (as generic CLI knowledge).
Move out of this skill to `tsh-verifying-ui` (single owner): the "Authenticated capture (real login + session reuse)" section (lines 141-212 upstream: origin binding, `TSH_UI_LOGIN_<KEY>` derivation, `.env` reader loop, storage-state ignore patterns). `tsh-using-playwright-cli` keeps a 3-line pointer.
Do NOT port: `.cursor/` paths; the Cursor-specific "Playwright Extension" / "launch dashboard for UI review" lines if not applicable to Claude/Codex **(unverified; check each `show`/dashboard command)**; repo-specific `TSH_UI_LOGIN_` naming inside a generic CLI skill; `playwright-cli`-vendoring exception language.
Security notes to keep: the `.env` reader is a deliberate limited reader (documented limitations); storage-state files must live outside the specs tree; never print credential values.

### 4.4 Where the MCP -> CLI change must be reflected (verified current state)
| File | Current | Change |
|---|---|---|
| `src/skills/tsh-verifying-ui/SKILL.md` | `requires-mcp: [figma, playwright]`; Step 3 "browser automation tool / navigate using `playwright`"; Step 1 asks the user to confirm the dev URL after reading `package.json` | `requires-mcp: [figma]`. Rewrite Step 1 (URL only user-confirmed or caller-provided, never discovered from config), Step 2 (export `figma-expected.png` via Figma MCP to the canonical root), Step 3 (CLI capture flow, three mandatory artifacts, stabilization, exit codes), add canonical artifact root, PASS gate (strict), content/data clarification gate, `VERIFICATION NOT RUN`. Move bulk to `references/cli-capture-flow.md` and `references/authenticated-capture.md` to keep `SKILL.md` under 500 lines. |
| `src/skills/tsh-verifying-ui/assets/ui-verification-report.template.md` | 15 lines, PASS/FAIL | Add `VERIFICATION NOT RUN`, Sources, Artifact Directory, Artifact Status, Clarification Needed, Blocker Resolution, Re-verify After Fix (upstream sections, upstream `tsh-ui-verifying` "Report Format" section). |
| `src/skills/tsh-orchestrate-ui-verification/SKILL.md` | Loop: engineer -> `tsh-ui-reviewer` (no capture step) | Insert capture step before each review; hard ordering gate; freshness (delete the 3 ACTUAL files before each capture, never `figma-expected.png`); `VERIFICATION NOT RUN` state; LOW-confidence pause; structured 3-choice gate after 5 iterations (see section 5). |
| `src/agents/tsh-ui-reviewer.md` | `requires-mcp: [context7, figma, playwright, sequential-thinking]`, "MUST use `playwright`" in body, `access: read-only`, `shell: false` | Remove `playwright` and its tool block; reviewer reads artifacts (images and JSON/YAML) and uses `figma`. (agent analyst) |
| new agent `tsh-ui-capture-worker` | n/a | `access: read-write` (limited to artifacts dir), `shell: true`, `requires-mcp: [figma]` (to export `figma-expected.png`), `preload-skills: [tsh-verifying-ui, tsh-using-playwright-cli]`. Leaf; escalations via `STATUS` (never asks). (agent analyst) |
| `src/skills/tsh-review-ui/SKILL.md` | step 3 "via `playwright`" | command routes to `tsh-ui-reviewer`; standalone use must run capture first. The command is `routes-to` an agent, so cannot run the manager loop: either (1) the command text says "the caller must provide a capture directory; for a standalone run, the main thread first delegates `tsh-ui-capture-worker`, then `tsh-ui-reviewer`", or (2) re-route the command to the manager's UI loop. Recommend (1), see Decision G. |
| `src/skills/tsh-using-mcp-servers/` | frontmatter `requires-mcp` includes `playwright`; `references/playwright.md` says "Browser automation through the Playwright MCP server" for verifying a frontend | Keep `playwright` MCP (still used by `tsh-e2e-engineer`, `tsh-software-engineer`, upstream kept `.cursor/mcp.json` unchanged). Edit `references/playwright.md`: add "Do not use this server for Figma UI verification; that flow uses `playwright-cli` through `tsh-verifying-ui`." Update Connected Skills line. |
| `src/mcp/servers.json` | `playwright` present | **No change**: still needed for E2E agents. Do not add a CLI entry (schema only knows servers). |
| agents `tsh-software-engineer`, `tsh-e2e-engineer` | `requires-mcp: playwright` | no change for UI verification; check whether the engineer still needs it **(unverified; agent analyst)**. |
| docs | none | README/website prerequisites: `playwright-cli` must be runnable (`npx playwright-cli` or `npm install -g @playwright/cli@latest`) on the machine; Figma MCP still needed for EXPECTED. Upstream already wrote this in `website/docs/getting-started/prerequisites.md`; port to our docs (docs analyst). |

### 4.5 Conflicts and recommendations
- **Artifact root**: upstream hard-codes `specifications/<verification-id>/ui-verification/`. Ours is `<specs>/<task>/` (manager owns paths). Recommendation: `<specs>/<task>/ui-verification/figma-expected.png` and `.../iteration-<N>/`; manager passes `UI_VERIFICATION_DIR`. Keep upstream's guard: `VERIFICATION_ID` is a single path segment (refuse `/`, `\`, `..`, leading `~`, absolute path, newline); a caller-supplied dir must resolve inside the specs tree after normalization. Upstream justified this with `specifications/` being git-ignored there; in consumer projects the specs dir may be tracked, and these are screenshots of an authenticated app. Add a rule: capture worker checks `git check-ignore <specs>/<task>/ui-verification` and returns `NEEDS_INPUT` (ask the user to ignore it) when not ignored **(design proposal, not upstream)**.
- **One Figma node per verification root** (upstream F34): port.
- **Reviewer cannot save files** in our design (`access: read-only`); upstream's `report.md` per iteration then has no writer. Recommendation: reviewer returns the report in the reply body (as today), the manager (or capture worker on request) persists it as `iteration-<N>/report.md` through a delegate. Small decision, covered by Decision G.
- **Auth handling asks the user**: capture worker returns `NEEDS_INPUT` with the derived env var names (QUESTIONS), the manager asks using the upstream message pattern; origin mismatch returns `NEEDS_INPUT` with the observed origin; matches D5 protocol exactly.
- **Optional `toHaveScreenshot` tripwire**: upstream marks it optional/non-blocking. Recommend leave out of the first port (it needs a project Playwright dependency); keep one sentence in the reference.
- Size: playwright-cli skill **medium** (mechanical), `tsh-verifying-ui` rewrite **large**, loop skill **medium**.

## 5. UI verification group: `tsh-ui-verifying`, `tsh-implement-ui`, `tsh-implement-ui-common-task`, `commands/tsh-review-ui`, `tsh-implementing-frontend`

| Upstream | Target in refactor | Port | Do not port | Size |
|---|---|---|---|---|
| `workflows/tsh-ui-verifying` (+295 lines) | `tsh-verifying-ui` (+ references) | CLI-first flow, canonical artifact root, three mandatory artifacts, `VERIFICATION NOT RUN`, strict PASS gate, content/data clarification gate, authenticated capture pre-step, origin binding, "default to asking" rule (delegated: return NEEDS_INPUT), report format sections, Figma EXPECTED only from Figma MCP (never screenshot Figma in the browser), ENSURE-OR-FETCH | the `specifications/` literal, `.gitignore:6` citation, "Task tool", repeated auth text across skills, "the reviewer brain" jargon | large |
| `internal/tsh-implement-ui` (+103) | `tsh-orchestrate-ui-verification` | per-item loop; capture before review; reviewer response contract (`Verification Result`, `Component`, `Artifact Directory`, per-file artifact status, `Confidence`, blocker guidance), re-run once on empty response, absent confidence = LOW; confidence handling (HIGH fix all; MEDIUM fix obvious and ask on unclear; LOW pause before any fix, not an iteration, not NOT RUN, not ESCALATED); `VERIFICATION NOT RUN` non-terminal and does not consume the 5-iteration budget; after 5 failed iterations a structured gate with fields (component, Figma URL, remaining mismatches, attempts per iteration, suspected root cause) and exactly 3 choices (continue with N extra iterations / stop and accept as acknowledged `ESCALATED` / custom instruction); after any fix a fresh capture; ESCALATED needs the user's explicit acknowledgement; type-check/build/code review never substitute; do not infer a Figma MCP blocker from the caller's own tools; UI scope rule (any visual/layout change on a Figma-backed screen) | "read and follow `tsh-review-ui` command skill" (reviewer follows `tsh-verifying-ui` by preload), `tsh-ui-engineer` unless ported, path references | large |
| `internal/tsh-implement-ui-common-task` (+4) | section "UI tasks (Figma)" of `tsh-implement-task` | the hard gate: before the first UI code edit for a Figma-backed component, resolve the exact node and inspect it through a real Figma tool call; URL in the plan is not enough; add to setup checklist. Delegated + missing/unresolvable node -> `NEEDS_INPUT` (already there for missing link) | PREREQUISITE paragraph about resolving the base skill by path/name (our section is inside the same skill) | small |
| `commands/tsh-review-ui` (+68) | `tsh-review-ui` | requirement that a verdict is never empty; `VERIFICATION NOT RUN` when artifacts or tools missing; input list (Figma URL or node link, user-confirmed full dev URL, component name, artifact directory); never fix code | "delegate-only / caller must not perform verification itself" prose duplicated from the loop, command-level body of workflow steps (commands are thin: keep steps in `tsh-verifying-ui`) | small to medium |
| `workflows/tsh-implementing-frontend` (+10) | `tsh-implementing-frontend` | new Step 0 "Fetch and review Figma design" hard gate (resolve node, export image via Figma MCP, extract layout, spacing, typography, colors, dimensions, variants, states; missing/unresolvable -> ask via the caller / return `NEEDS_INPUT`); Step 1 begins after Step 0; clarify that pre-implementation design review is distinct from post-implementation verification | wording "ask the user through the calling agent" -> neutral status text | small |

Decision G (UI reviewer artifacts): see table end.

## 6. `tsh-resolving-skill-references` (new, 130 lines)

### 6.1 Problem it solves (verified from the file and from the commits)
In the old layout (a) internal and command skills carry `disable-model-invocation: true`, so the Skill tool refuses them by name; (b) layers (`agents/ commands/ workflows/ internal/`) are present in the repo but flat in an installed root (`~/.cursor/skills/<name>`), so any hard-coded `.cursor/skills/<layer>/...` path breaks somewhere; (c) skill names inside generated plans reach workers who have no resolution rule. The skill defines a 5-step resolution order (project collection in 4 shapes, derive installed root from the executing skill's directory, search by name, Skill tool, hard stop) plus a narrow "degraded mode" carve-out and path-traversal hygiene for names.

### 6.2 Is it still needed in the refactor?
**No, as a skill.** The problem is removed by construction:
- D6 removed `disable-model-invocation` from internal/orchestrator skills (Claude `user-invocable: false`; spike `claude-code.spike.md` row 1 verified loading by name from main thread and subagent); knowledge skills are auto-invocable; commands are never loaded by delegates (their bodies moved into knowledge skills, D6 dual-use table).
- Generated trees are flat (`.agents/skills/tsh-*`, `.claude/skills/tsh-*`); no layer segment exists.
- AGENTS.md bans path references and `check-refs`/`no-path-refs` lint enforce it, so there is no path to resolve.
- Cursor loading by name from a subagent: evidence in `cursor.spike.md` (a subagent lists and loads a same-name skill once). Codex behaviour for hidden skills **(unverified)**.
Porting it would also contradict the rule "reference by name only; no file lookup instructions", because the skill instructs agents to glob the filesystem, including `~/.*/skills/**` home directories (extra attack surface, wider read scope than our agents' `access` model).

### 6.3 What to carry over instead (small items, no new skill)
1. **Fail-loud rule**: add to the `agent-modes` partial (one sentence): "If a skill you were told to load cannot be loaded, do not continue from general knowledge. Interactive: tell the user. Delegated: return `BLOCKED` naming the skill." For orchestrators/commands: same wording in `caller-status-handling` ("a missing skill is a stop, not a skip"). Agent/partial analyst owns the edit.
2. **Cost command degraded mode** (from `tsh-analyze-aws-costs` / `-gcp-costs` diffs; our merged `tsh-analyze-cloud-costs` currently has neither): if `tsh-optimizing-cloud-cost` (with `references/tagging-standards.md`) cannot be loaded, the audit may use the Core 5 tag names (`CostCenter, Environment, Service, Owner, DataClass`; GCP labels `cost_center, environment, service, owner, data_class`) for presence/absence only, must state the substitution in the Executive Summary, and may issue no finding or recommendation from the defaults. Port into `tsh-analyze-cloud-costs` (command) or, better, into `tsh-optimizing-cloud-cost` references. Also port: `tsh-managing-secrets` is a gate for the security section: if unavailable, stop and ask (or re-scope to exclude security) instead of noting a gap. Our `tsh-audit-infrastructure` lists it as required; `tsh-analyze-cloud-costs` lists it "conditional": align both to the gate rule. Size small.
3. **Untrusted name hygiene**: a skill name or `VERIFICATION_ID` taken from a generated plan is a single path segment; refuse `/`, `..`. Applies to the UI verification root (section 4.5). No skill-name path substitution exists in our flow.
4. Do not add "resolved per `tsh-resolving-skill-references`" to plan task templates, migration rules or `tsh-creating-*` checklists. The checklist line "delegation text references skills by backticked name, not by `.cursor/skills/<layer>/` path" in `tsh-creating-agents/commands/skills` is already enforced by `no-path-refs` (AGENTS.md "Reference other skills by name"); nothing to add except confirming each creating-skill checklist has the by-name item (grep: verify in src **(unverified for `tsh-creating-skills` validation list)**).
Size of this port: **small**. Needs user decision: yes (confirm "not ported").

## 7. Documentation: `tsh-writing-documentation` (new, 100 lines) and `internal/tsh-write-documentation` (new, 35 lines)

- **Intent**: Technical Writer agent (PR #69). Skill owns doc authoring conventions (README, CHANGELOG, in-repo `/docs`, the published docs site): accuracy over volume, mirror neighbour structure, internal links must resolve, "busy reader" craft rules (Rogers and Lasky-Fink), a 5-step workflow, write-vs-review boundary. The internal skill is a delegation handoff wrapper (execution contract: inputs, scope, procedure, escalation, plan synchronization, output format).
- **Target**: one knowledge skill `src/skills/tsh-writing-documentation/` (`type: skill`, name already matches gerund-first). **Do not create `tsh-write-documentation`**: our rule is that agents carry the handoff contract and loaded knowledge skills hold the procedure; `internal` wrappers were folded for devops/e2e/prompt (D6/plan rows 39-45). Move the wrapper's content into the new agent `tsh-technical-writer` body (Inputs, Scope, Escalation, Output) with `preload-skills: [tsh-writing-documentation]`. Layout: `SKILL.md` about 80 lines, optional `references/busy-reader-craft.md` is not needed.
- **Port**: principles, targets table, workflow checklist, write-vs-review boundary, Connected Skills (`tsh-discovering-technical-context`, `tsh-analyzing-codebase`, `tsh-creating-rules`).
- **Do not port**: "reuse the established page shape for that section (agent pages, skill pages, command pages)" is specific to this repo's website, not to consumer projects (rewrite to "match sibling pages"); frontmatter `sidebar_position`/`title` as universal (only if the docs site is Docusaurus; say "follow the existing frontmatter of sibling pages"); "tsh-codebase-analysing" and "technical-context-discovering" old names (use renamed). Replace "stop and report the dependency" with delegated STATUS `NEEDS_INPUT/BLOCKED`.
- **Conflicts**: the writer needs the human-approval precondition like other owners; documentation-only work with no plan (README tweak) is blocked by it -> falls under Decision A. Upstream routes docs requests to the writer from the manager: add the row (1.4).
- Size: **small** for the skill, **medium** including the new agent (agent analyst).
- Needs user decision: no (agent adoption is decision F).

## 8. Smaller changes

| Upstream skill | Intent | Target | Port | Do not port | Size |
|---|---|---|---|---|---|
| `workflows/tsh-code-reviewing` (+12) | recall: report every evidence-backed finding before filtering; missing integration coverage is a substantive finding where correctness depends on a real DB/transactions/migrations/queues; high-risk anti-patterns (N+1, in-memory pagination/filtering/aggregation, missing integration tests at service boundaries) | `tsh-reviewing-code` | Add a "Findings reporting" sentence; add the anti-pattern list to the quality step; add the integration-coverage rule to the testing step | upstream severity words (`blocker/major/minor/nit`): we use `critical/warning/suggestion` (verified in `## Findings format`); keep ours | small |
| `workflows/tsh-creating-agents` (+3/-3) | XML tag section table additions (`<approach>`), agent-specific tags allowed, by-name checklist item, drop "Recommended model/tools" lines in template | `tsh-creating-agents` | none (by-name rule already in AGENTS.md; `Recommended model` lines already absent, verified by grep) | XML tags: our agents use Markdown headings (D1) | none |
| `workflows/tsh-creating-commands` (+2/-1) | checklist: skills referenced resolve to real directories; do not write the path; by-name item | `tsh-creating-commands` | none (covered by refs lint) | `.cursor/skills/workflows/<name>/` check | none |
| `workflows/tsh-creating-skills` (+1) | validation checklist line: by-name references | `tsh-creating-skills` | confirm the line exists; if absent add one bullet | | small |
| `commands/tsh-create-custom-command` (+1/-1) | fixes false claim "routing and model in frontmatter": routing is in the body, model is session-level | `tsh-create-custom-command` | already fixed by plan row 29 (routing via `routes-to`, no model claim; grep found no "model" mention) | | none |
| `workflows/tsh-migrating-copilot-to-cursor` (+56) | lessons from the #65-#74 port: drop model/tools; add `name:`; "Porting a PR of changes" (fetch diff with `gh pr diff`, apply semantic delta, port in merge order, one commit per PR, match target structure); "Divergence from upstream" (README/docs, commands do not bind models); update counts and changelogs | `tsh-migrating-copilot-customizations` | add two short sections: "Porting a PR (not a fresh conversion)" and "Divergence from upstream" generalized to `src/` (apply delta onto the neutral source, not the generated trees; run `npm run generate`; fold command model changes into agent `model-tier`) | counts script names `scripts/count-skills.sh`, `website/src/pages/changelog.md` unless they exist here **(unverified)**, checklist step numbering, `user-invocable:false -> disable-model-invocation` mapping | small |
| `commands/tsh-analyze-aws-costs`, `-gcp-costs`, `tsh-audit-infrastructure` | path -> name conversion (already done by refactor) plus the degraded-mode carve-out and the `tsh-managing-secrets` gate | `tsh-analyze-cloud-costs`, `tsh-audit-infrastructure` | see 6.3 item 2 | `resolution order` mentions | small |
| `internal/tsh-deploy-kubernetes`, `-implement-observability`, `-implement-pipeline`, `-implement-terraform` | only path -> "name + resolve per `tsh-resolving-skill-references`" in "Related" sections | deleted/folded into `tsh-delivering-infrastructure` | nothing (the diff is only the resolving note) | | none |

## 9. Rules: `.cursor/rules/**`

Upstream changes (verified by diff):
- `tsh-naming-conventions.mdc` rewritten and copied to `.cursor/rules/imported/cursor-collections/` (generated import).
- `cursor-instructions.md` Naming and When-Editing sections extended.
What they say, and whether our AGENTS.md covers it:
| Upstream rule content | Our AGENTS.md | Carry over? |
|---|---|---|
| `tsh-` prefix applies to skill **directory names** and rule filenames, not to the literal `SKILL.md`, support files (`references/`, `assets/`, `examples/`, `*.template.md`, `*.example.md`) or config files | "Everything uses the `tsh-` prefix; frontmatter `name` equals the directory"; support files named `assets/<name>.template.md` (topic-named) | Yes, 1 sentence: "The `tsh-` prefix applies to skill directory names, agent file names and rule file names; support files under `references/`, `assets/` and `scripts/` are named for their topic." Prevents a reviewer demanding `tsh-` on `plan.template.md`. |
| Support files are not skills and have no frontmatter `name` in every layer | implied by the layout rule | Optional (covered by support-file layout paragraph) |
| Two named exceptions (vendored `playwright-cli`; `cursor-instructions.md`) | none; AGENTS.md is the constitution, no Cursor-specific `.cursor/rules/cursor-instructions.md` in `src/` | **No**; do not add a vendored-name exception (we rename to `tsh-using-playwright-cli`). If the owner prefers upstream diffability, add the exception to AGENTS.md AND `scripts/lint.mjs` and `schema.mjs` (changes listed in 4.2). Decision E. |
| Cross-references use prefixed names, "load the @tsh-architect skill" example | AGENTS.md: reference by name, no `@tsh-...` mentions in `src/` | No (ours is stricter, tool-neutral) |
| "Delegation-time skill references use backticked skill name plus `tsh-resolving-skill-references`; `.cursor/skills/<layer>/` paths are for authoring guidance only" | no-path-refs rule | No (see section 6) |
| "Command references (not skills): `tsh-<action>/references/<topic>.md`" | `references/` allowed in any skill dir | No |
| "Commands route to agents; agents load workflows; no domain knowledge in commands" | Layering paragraph | Already covered |
| "Do not add Copilot paths to active skills" | "No Copilot paths" section | Already covered |
| Imported rule copy under `imported/cursor-collections/` | `.cursor/rules` is not a generated target here | No |
Net: carry over only the "prefix scope" clarification (one sentence), optional.
Size: **small**. Needs user decision: Decision E (vendored exception) only if the owner insists on keeping the name `playwright-cli`.

## 10. Decisions required (summary of questions)

- **A. Quick flow and plan-less work.** Upstream abolished it and requires an approved plan before any file change, including direct invocation. Our `/tsh-implement` recommends Quick for small work; `/tsh-debug` routes fixes to the engineer without a plan. Options: (1) port upstream strictly (remove Quick flow, `No plan provided` section in `tsh-implement-task`; `/tsh-debug` must produce a minimal plan or stay read-only); (2) keep Quick flow, scope the approval gate and the owner precondition to plan-based delegations (delegation names a `*.plan.md`), plan-less runs are explicitly marked "no plan" by the caller. Recommendation: (2); (1) is a product-behaviour change that breaks `/tsh-debug` and the smoke tests **(unverified: check `specifications/unified-agent-structure/smoke-tests.md`)**.
- **B. One approval gate or two.** Recommendation: one, owned by the manager in the main thread (delegated architect cannot ask); the architect records in interactive mode too. Confirm.
- **C. Implementation Discussion Boundary.** Upstream forces a stop after planning if approval was recorded in the same chat ("implementation begins only in a new discussion") and admits it cannot be enforced (no conversation id). Recommendation: do not port; the single gate in the manager already makes the human read and approve the plan before any file change. Confirm.
- **D. `tsh-resolving-skill-references`.** Recommendation: do not port (section 6); carry the fail-loud sentence and the cost-command degraded mode. Confirm.
- **E. Vendored skill name.** `tsh-using-playwright-cli` (recommended) vs keeping `playwright-cli` as a lint exception.
- **F. New upstream agents** (`tsh-plan-implementor`, `tsh-ui-engineer`, `tsh-ui-capture-worker`, `tsh-technical-writer`): the capture worker and writer are required by sections 4/7; `plan-implementor` and `ui-engineer` are splits of the software engineer. Recommendation: adopt capture worker and technical writer; do not adopt plan-implementor and ui-engineer in this port (the model-tier split is a cost optimisation that needs separate evaluation; routing keeps `tsh-software-engineer` with `tsh-implement-task`). Owned by the agents analysis; flagged here because the routing table and plan template depend on it.
- **G. Reviewer artifacts and standalone `/tsh-review-ui`.** Reviewer is read-only; who writes `report.md`; whether the command runs capture itself in the main thread. Recommendation: command body tells the main thread to delegate capture then review (command stays thin via text in `tsh-verifying-ui`), manager persists the report.

## 11. Summary table

| Upstream skill | Target | Size | Needs user decision |
|---|---|---|---|
| workflows/tsh-orchestrating-implementation | merge into `tsh-engineering-manager` (+ `references/task-routing.md`, `references/plan-approval.md`) | large | yes: A, B, C |
| commands/tsh-implement | unchanged thin command; manager gets the gate | small | yes (A) |
| workflows/tsh-creating-implementation-plans (+ plan.example.md) | merge into `tsh-designing-architecture` (SKILL.md rules + `assets/plan.template.md`) | medium | no (name only if split: `tsh-writing-implementation-plans`) |
| workflows/tsh-architecture-designing | `tsh-designing-architecture` (already merged) | medium | no |
| internal/tsh-plan | already folded into `tsh-designing-architecture` | small | no |
| human approval gate / execution-owner precondition | `src/partials/human-approval-precondition.md` + manager `references/plan-approval.md` + template | large | yes: A, B, C |
| workflows/tsh-resolving-skill-references | not ported; fail-loud sentence in `agent-modes`/`caller-status-handling`; cost-command degraded mode | small | yes: D |
| workflows/playwright-cli (+10 references) | new `tsh-using-playwright-cli` (skill, `references/` x10 with `## Contents`) | medium | yes: E |
| workflows/tsh-ui-verifying | `tsh-verifying-ui` + `references/cli-capture-flow.md`, `references/authenticated-capture.md`, richer report template; `requires-mcp: [figma]` | large | yes: G |
| internal/tsh-implement-ui | `tsh-orchestrate-ui-verification` | large | yes: F, G |
| internal/tsh-implement-ui-common-task | "UI tasks (Figma)" in `tsh-implement-task` | small | no |
| commands/tsh-review-ui | `tsh-review-ui` (capture-first wording) | small | yes: G |
| workflows/tsh-implementing-frontend | `tsh-implementing-frontend` Step 0 | small | no |
| workflows/tsh-writing-documentation | new `tsh-writing-documentation` skill | small | no |
| internal/tsh-write-documentation | folded into new `tsh-technical-writer` agent body | small | yes: F |
| workflows/tsh-code-reviewing | `tsh-reviewing-code` additions | small | no |
| workflows/tsh-creating-agents, -commands, -skills | none or one checklist bullet | small | no |
| commands/tsh-create-custom-command | none (already fixed) | small | no |
| workflows/tsh-migrating-copilot-to-cursor | `tsh-migrating-copilot-customizations` (two short sections) | small | no |
| commands/tsh-analyze-aws-costs, -gcp-costs | `tsh-analyze-cloud-costs` degraded mode + secrets gate | small | no |
| commands/tsh-audit-infrastructure | `tsh-audit-infrastructure` secrets gate wording | small | no |
| internal/tsh-deploy-kubernetes, -implement-observability, -implement-pipeline, -implement-terraform | none (folded; diffs are path notes only) | small | no |
| rules/tsh-naming-conventions.mdc, cursor-instructions.md, imported copy | one sentence on prefix scope in AGENTS.md, optional | small | yes: E (only if vendored name kept) |

Open verification items: Codex handling of hidden skills and `allowed-tools`; whether Cursor/Codex honour the playwright-cli dashboard/extension commands; whether `smoke-tests.md` covers plan-less flows; whether `tsh-creating-skills` validation list already has the by-name bullet.
