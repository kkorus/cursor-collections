---
name: tsh-implement-ui
description: Implement a UI feature orchestrating iterative Figma verification until the implementation matches within agreed tolerances. Internal skill used by tsh-engineering-manager. Not user-invokable.
disable-model-invocation: true
---
# tsh-implement-ui

> **Orchestration:** The Engineering Manager and `/tsh-implement` delegate UI implementation and verification to this internal skill. Use this file as the source of truth for UI-specific steps; do not duplicate its verify-fix loop in other orchestration skills.

Your goal is to implement the UI feature according to the provided implementation plan and feature context, orchestrating iterative verification against Figma designs until the implementation matches within agreed tolerances.

## Design References from Research & Plan

Before delegating tasks, open the research file (`*.research.md`) and plan file (`*.plan.md`) to find all Figma URLs:

- In the **research file**, look for:
  - Figma URLs in the `Relevant Links` section.
  - Specific component/node links mentioned in `Gathered Information`.
- In the **plan file**, look for:
  - Figma URLs and design references in `Task details`.
  - A structured "Design References" subsection mapping views/components to Figma URLs or node IDs.

Use these URLs when delegating to both `tsh-ui-engineer` (implementation context) and `tsh-ui-reviewer` (verification target).

### When Figma link is missing

If you cannot find a Figma URL for a component/section that needs verification:

1. **Stop** — do not delegate implementation or verification for that component
2. **Ask the user** to provide the Figma link for the specific section
3. **Wait for the link** before proceeding
4. **Add the link** to the plan file once provided (in `Task details` or `Design References`)

Do NOT skip verification or delegate without a Figma reference.

## Workflow

> **Skill references:** every skill named in the steps below is a skill reference, not a location — resolve each one with the `tsh-resolving-skill-references` resolution order: the project skill collection, then the installed skills root (flat, no layer segment), then a search by name; internal and command skills are **read**, not invoked, and a skill that cannot be located is a **stop and ask the user**, never a step you skip.

1. **Review the plan** — Review the implementation plan and feature context thoroughly. Identify which tasks are UI implementation tasks (need Figma verification) and which are non-visual tasks. Extract all Figma URLs from the research/plan files.

2. **Delegate codebase analysis (if needed)** — Check if the plan file (`*.plan.md`) contains a populated **"Technical Context"** section. If it does, skip this step — the context was already captured during planning. If the section is missing or empty, use `tsh-architect` agent to perform codebase analysis and technical context discovery to establish project conventions, coding standards, architecture patterns, and existing codebase patterns before implementing.

3. **Confirm dev server URL** — Ask the user now for the exact full dev server URL that should be used for verification (e.g., "What exact URL should UI verification use for this page?"). Do not defer this to later — you need the confirmed URL before any verification can start. Do not guess from running processes, project config, or port scans — multiple services may run on different ports. Once confirmed, treat that full URL as a pinned session input and use it unchanged for all subsequent verifications in this session.

4. **Delegate UI implementation** — For each UI implementation task, instruct `tsh-ui-engineer` to read and follow the `tsh-implement-ui-common-task` skill. Pass the relevant Figma URLs, component context, and plan section. For non-Figma frontend and backend tasks, use the `tsh-implement-common-task` skill.

5. **Delegate UI verification** — After each UI implementation task completes, first delegate capture to `tsh-ui-capture-worker` using the pinned user-confirmed full dev server URL from step 3, the Figma URL, the shared verification root, and the current iteration artifact directory. Require the capture worker to prepare or ensure the shared `figma-expected.png` before ACTUAL browser capture starts. Then delegate verification by instructing `tsh-ui-reviewer` to read and follow the `tsh-review-ui` command skill. Pass: the Figma URL, the same pinned full dev server URL, the component/section name, and the exact artifact directory produced by `tsh-ui-capture-worker`. Forward that exact URL unchanged through every delegate, retry, and capture pass. The ui-reviewer will compare the Figma design against the running implementation and return a structured report. **Note:** The reviewer consumes the shared Figma EXPECTED reference plus caller-provided ACTUAL live-capture artifacts (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`) produced earlier by `tsh-ui-capture-worker`. No agent in this loop may launch, start, or switch to another local app/server or port once the URL is confirmed.

- In every delegation, explicitly require the reviewer response to include: `Verification Result`, `Component`, exact `Artifact Directory`, per-file artifact status, and blocker-resolution guidance. Treat an empty response or a response missing any of those fields as an invalid verification result and re-run the reviewer once with the same pinned URL, the same fresh artifact directory, and a stricter handoff.
- The caller/orchestrator must not treat its own lack of `figma` tool access as a Figma blocker for UI verification. If a Figma URL is available, delegate review first and let `tsh-ui-reviewer` determine whether `figma` MCP is actually unavailable in its own runtime.

- This step is **delegate-only**. The main/orchestrating agent must not perform UI verification itself and must not substitute code review, type checks, or browser inspection for the delegated `tsh-ui-capture-worker` + `tsh-ui-reviewer` flow.
- If `tsh-ui-reviewer` cannot be invoked, if `figma` is unavailable to the reviewer, or if `tsh-ui-capture-worker` cannot be invoked by the caller, treat that as a blocker in the UI gate and report `VERIFICATION NOT RUN`. Do not self-execute a fallback verification path in the caller.

6. **Read the confidence level before dispatching anything** — every verification report carries a confidence level, and it is read **before** any fix is delegated, because it decides whether the FAIL branch in step 7 may run at all:
   - **HIGH** confidence → enter the verify-fix loop and fix exactly as reported
   - **MEDIUM** confidence → enter the verify-fix loop, fix the obvious issues, and ask the user about the unclear ones
   - **LOW** confidence → do NOT enter the loop and do NOT delegate a fix; take the LOW-confidence pause in step 7 first, because the tool data behind the report may be incomplete

7. **Handle verification results**:
   - If **PASS** → mark the task and its verification step as complete in the plan. Move to the next task.

- If **FAIL** with **HIGH** or **MEDIUM** confidence → this is NOT a stopping point. Delegate the fix to `tsh-ui-engineer` — pass the **complete** verification report and explicitly instruct the engineer to fix **ALL** listed differences, not just the first one. After the fix, delegate a **fresh capture** to `tsh-ui-capture-worker` using the same pinned full URL and the same Figma URL to ensure the shared `figma-expected.png` still exists (or refresh it if the node changed) and to regenerate `actual.png`, `computed-styles.json`, and `a11y-snapshot.yml`, and only then re-delegate verification to `tsh-ui-reviewer` on those new artifacts. Re-verification must never run on stale artifacts. Then loop again: a single FAIL pass never ends the loop — keep running fix → fresh capture → re-verify until the result is PASS or you have completed **5 full iterations** for this component. Only after 5 completed iterations with remaining mismatches do you open the structured gate below.
- If **FAIL** with **LOW** confidence → **LOW-confidence pause.** Change nothing. Do not delegate a fix to `tsh-ui-engineer`, do not re-capture, and do not edit any file — LOW confidence means the reviewer's own tool data may be incomplete, so a fix would be made on weak evidence. Report the mismatches the reviewer listed, say plainly which evidence is weak and why, and ask the user how to proceed before anything is changed. This pause is not a verdict and not a status: it does **not** consume the 5-iteration budget (nothing was changed and nothing was re-captured), it is **not** `VERIFICATION NOT RUN` (verification did run and returned a verdict), and it is **not** `ESCALATED` (that state needs the user's explicit acknowledgement of a blocker, per the gate below). It is a transient loop state that resolves the moment the user answers; then re-enter the FAIL branch above with the user's direction. It is a consent gate about changing code on weak evidence only — do not treat it as plan approval, do not record it as an approval, and do not offer plan-approval options in it.
- If **VERIFICATION NOT RUN** → treat it as a **pre-verification blocker**, not as a failed verification iteration. Resolve the blocker with the user (missing confirmed URL, auth, wrong page state, unreachable page, incomplete artifacts). Regenerate capture via `tsh-ui-capture-worker` using the same pinned full URL, and re-run verification. This state does **not** consume the 5-iteration budget and does **not** enter the post-5-iteration continue/stop/custom gate. Only treat it as `ESCALATED` if the user explicitly acknowledges an unresolved blocker.
- If **VERIFICATION NOT RUN** because `tsh-ui-reviewer` reported `figma` MCP unavailability, only then may the caller ask the user to enable Figma MCP or provide an exported reference image. The caller must not raise that blocker based on its own tool availability.
- If **VERIFICATION NOT RUN** because the reviewer step itself was not delegated or could not access its required tools/subagents, that is an orchestration blocker. Resolve it by asking the user; do not let the main agent attempt the verification step directly.
- After 5 failed iterations with remaining mismatches → pause behind a **structured** user-confirmation gate. Present a structured summary containing exactly these fields: component or section name, Figma URL, remaining mismatches, what was attempted in each iteration, suspected root cause.
- The user-confirmation gate must offer exactly 3 choices: `continue-with` an explicit additional iteration count, stop and accept the current state as acknowledged `ESCALATED`, or provide a custom instruction.
- Record the user's decision and the resulting outcome in the plan's Changelog.
- If the extra iteration budget is exhausted and gaps remain, run the same structured user-confirmation gate again.
- Code review cannot start for that item until it resolves as `PASSED` or explicitly acknowledged `ESCALATED`.

8. **Update the plan** — After completing each task step, update the plan to reflect progress (check the box). Note the verification result (PASS, number of iterations, or escalation).

9. **Run quality checks after each phase** — Run static code analysis, build the project, run unit and integration tests to verify nothing is broken.

10. **Before code review — UI Verification Summary** — Before delegating code review, compile:

- Components/sections verified by `tsh-ui-reviewer`
- Number of verification iterations per component
- Design gaps discovered and how they were handled
- Any deviations from design with rationale

11. **Delegate code review** — Instruct `tsh-code-reviewer` to read and follow the `tsh-review` command skill. Include E2E test execution as part of the review. The code reviewer runs all quality gates (unit, integration, E2E tests, linting, build).

## Verification Loop (MANDATORY — never stop after one pass)

For each UI component, run this loop explicitly:

```text
iteration = 0
while iteration < 5:
    if latest report is FAIL with LOW confidence:
        pause and ask the user BEFORE any fix; change nothing
        this is NOT an iteration, NOT VERIFICATION NOT RUN, NOT ESCALATED
        resume this branch with the user's direction once they answer
    iteration += 1
    fix ALL differences from the latest report (skip on the very first pass)
    fresh capture via tsh-ui-capture-worker -> ensure shared figma-expected.png + actual.png + computed-styles.json + a11y-snapshot.yml
    fresh verification via tsh-ui-reviewer on those new artifacts
    if PASS: component done, exit loop
    if FAIL: continue loop (do NOT stop, do NOT accept the current state)
    if VERIFICATION NOT RUN: resolve the blocker by asking the user; this does NOT count as one of the 5 iterations
after 5 completed FAIL iterations with remaining mismatches:
    open the structured user-confirmation gate (continue-with-N / stop-as-ESCALATED / custom)
```

Hard rules for weaker models:

- A single FAIL is never terminal and never "good enough" — keep iterating.
- Never report the component complete while the latest result is FAIL.
- Every iteration regenerates fresh ACTUAL artifacts and ensures the shared `figma-expected.png` exists (refresh only if the Figma node changed); never reuse pre-fix ACTUAL evidence.
- `VERIFICATION NOT RUN` (capture / auth / URL blocker) does not consume the 5-iteration budget.
- A FAIL at LOW confidence pauses for the user **before** any fix is delegated; that pause does not consume the 5-iteration budget and never becomes `ESCALATED` on its own.

## Verification Rules

1. Every UI component must be verified by `tsh-ui-reviewer` — minimum once per component, no exceptions
2. Fix all reported differences — do not skip or rationalize
3. Re-delegate verification after every fix — never assume a fix worked
4. Maximum 5 iterations per component — after 5 completed FAIL iterations open the structured user-confirmation gate; only the user's explicit acknowledgement there produces `ESCALATED`
5. Check the confidence level **before** dispatching a fix — LOW confidence means tool data may be incomplete, so pause and ask the user before changing anything; that pause is not an iteration and never becomes `ESCALATED` by itself

## Verification Gate — Do Not Proceed Without Real Verification

**Default to asking (judgment rule, not a checklist):** the blocker cases named in this skill are only examples. Whenever anything is missing, broken, ambiguous, inconsistent, or unexpected — including situations not listed here — and you cannot complete a real verification with the full artifact base, stop and resolve it by asking the user. Do not guess, improvise, fabricate, or proceed on partial evidence. Think about whether the evidence actually supports the verdict before continuing.

Before proceeding from a UI verification step to the next task or to code review, confirm that the `tsh-ui-reviewer` actually performed a **real Figma comparison with live-capture artifacts**. A valid verification report must contain:

- Data extracted from Figma via `figma` (design specifications)
- Data captured from the running app via `tsh-ui-capture-worker` producing `actual.png`, `computed-styles.json`, and `a11y-snapshot.yml`
- A structured comparison with EXPECTED vs ACTUAL values

**If the report is missing either side of the comparison** (e.g., the reviewer only read source code files, or skipped capture because of a blocker), the verification is **INVALID**. Do not accept it. Instead:

1. Identify why verification failed (wrong URL? auth blocker? tool error?)
2. Ask the user to resolve the blocker (provide correct URL, credentials, or manual verification)
3. Re-delegate capture to `tsh-ui-capture-worker`, then re-delegate verification to `tsh-ui-reviewer` once the blocker is resolved
4. Only proceed when you have a valid verification report or the user explicitly instructs you to skip

If `tsh-ui-reviewer` was never actually invoked, if `tsh-ui-capture-worker` was never actually invoked for the current pass, or if the caller attempted to approximate either step itself, treat that exactly like an invalid verification report: the UI gate did not run.

If `tsh-ui-reviewer` returns an empty response, or omits the explicit verdict or artifact-directory contract, treat that exactly like an invalid verification report: rerun once with the same pinned URL and a stricter handoff demanding those fields; if it still fails, keep the item at `VERIFICATION NOT RUN` and resolve the orchestration blocker by asking the user.

**Never proceed to code review with unverified UI components.** UI verification is a separate gate that must clear first, and it must be reported separately from code review. If verification cannot be completed for a component, document it in the plan's Changelog and get explicit user approval before moving to code review. Type checks, build, unit/integration tests, and code review are NOT UI verification and never substitute for the live-capture + Figma comparison — a layout/CSS/sizing change is not "done" just because it compiles or because code review found the code clean.

After every UI fix, repeat the capture and reviewer pass on fresh artifacts before treating the item as done. Do not reuse stale evidence, and do not merge the UI gate into the code-review step.

## Fallback: When `tsh-ui-reviewer` Returns Errors

If `tsh-ui-reviewer` consistently returns LOW confidence or tool errors:

1. Do not continue the loop blindly, and do not delegate a fix on LOW-confidence evidence
2. Ask the user if they can verify manually (open Figma + app side-by-side)
3. Document the issue in the plan's Changelog
4. Continue only from the user's answer — moving on to another component is a choice the user makes, not a default. Repeated LOW confidence is still the LOW-confidence pause of step 6: it never becomes `ESCALATED` by itself. A tool error that prevents verification altogether stays `VERIFICATION NOT RUN`, and `ESCALATED` still requires the user's explicit acknowledgement
