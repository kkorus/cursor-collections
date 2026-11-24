---
name: tsh-orchestrate-ui-verification
description: Internal step of /tsh-implement and /tsh-review-ui. Load only when a tsh command or orchestrator instructs it. The single capture, review and fix loop for UI tasks with Figma designs, run by the engineering manager until the implementation matches within agreed tolerances.
metadata:
  short-description: Run the UI capture, Figma review and fix loop
user-invocable: false
---
<!-- Generated from src/skills/tsh-orchestrate-ui-verification/SKILL.md by scripts/generate.mjs. Do not edit. -->

# tsh-orchestrate-ui-verification

This skill is the only place that defines the UI verification loop. The `tsh-engineering-manager` loads it for every UI task that has a Figma reference, and in UI-only mode for `/tsh-review-ui`. Other skills and commands point here and must not restate the loop.

The loop runs in the main thread. You implement nothing yourself. You delegate implementation and fixes to `tsh-ui-engineer`, evidence capture to `tsh-ui-capture-worker` and the Figma comparison to `tsh-ui-reviewer`, using the delegation template of the status-handling section you already follow. You do not need Figma or browser tools yourself; the reviewer and the worker have their own.

> **Not yet verified.** Two parts of this loop were not measured when the UI spike was recorded: the capture worker's `playwright-cli` flow (the CLI was not installed) and the reviewer's Figma fetch (the Figma MCP was not authenticated). Reading image files as a read-only reviewer was measured in Claude Code and Cursor, not in Codex. Where one of these fails, the result is `VERIFICATION NOT RUN`, never a pass.

## Contract names

- `UI_TASKS`: the component names. `FIGMA_URLS`: one Figma URL per component. `DEV_SERVER_URL`: the full URL confirmed by the user. `UI_VERIFICATION_DIR`: the verification root. `SINGLE_PASS: true`: one capture and one review, no fix, no cap.
- `ITERATION_DIR` = `<UI_VERIFICATION_DIR>/<component-slug>/iteration-<n>/`, one per component and iteration, passed to both the worker and the reviewer. The default `UI_VERIFICATION_DIR` is `<specs>/<task>/ui-verification`, which you compute.
- `<component-slug>` is a single path segment derived from the component name (lowercase letters, digits and `-`). Refuse a name that cannot be reduced to that instead of passing a path on; the directory contract of `tsh-verifying-ui` applies.

## Design references

Find every Figma URL before delegating anything:

- In the research file (`*.research.md`): the Relevant Links section and the component or node links in Gathered Information.
- In the plan file (`*.plan.md`): Task Details and, if present, a Design References subsection mapping views and components to URLs or node IDs.
- In UI-only mode: `FIGMA_URLS`.

Pass the relevant URLs to the engineer (implementation context) and to the reviewer (verification target).

### Missing Figma link

If a component that needs verification has no Figma URL, stop for that component. Do not delegate its implementation or verification. Ask the user for the link, wait for it and add it to the plan (Task Details or Design References). If the engineer returned `NEEDS_INPUT` because of a missing link, this is the same case. Never skip verification and never continue without a reference.

### UI scope rule

Any visual or layout change on a Figma-backed screen counts as UI work and goes through this loop, also when the plan has no verification task for it. If the Figma reference is missing, ask the user for it.

## Setup once per session

1. List all UI tasks and all Figma references from the plan and research (in UI-only mode, `UI_TASKS` and `FIGMA_URLS`). This inventory is your checklist for the gate below.
2. Ask the user for the dev server URL (for example "What URL is the frontend app running at?") before any capture can start, unless `DEV_SERVER_URL` was passed. Do not guess it from running processes, port scans or project configuration. Reuse the confirmed URL for the whole session.
3. Fix `UI_VERIFICATION_DIR`. If the page needs a login, ask the user how to authenticate before the first capture; the rules are in the authenticated-capture reference of `tsh-verifying-ui`. Never ask for a password in chat, and never conclude that the Figma MCP is blocked from your own tool list.

## The loop, per UI component

1. **Implement** (skipped in `SINGLE_PASS`): delegate the UI task to `tsh-ui-engineer`. Pass the Figma URLs, the component context, the plan section and the confirmed dev server URL as a fixed input.
2. **Capture**: delete `actual.png`, `computed-styles.json` and `a11y-snapshot.yml` in the `ITERATION_DIR` so that existence means freshness, then delegate `tsh-ui-capture-worker` with the confirmed full URL, `ITERATION_DIR`, the Figma frame width when known and any `AUTH_FIELDS` (names only). Hard ordering: there is no review without a fresh capture of the same iteration.
3. **Review**: only when the worker returned `DONE`, delegate `tsh-ui-reviewer` with the Figma URL, the component name and `ITERATION_DIR`. It fetches EXPECTED from `figma`, reads the three files and follows `tsh-verifying-ui`. It is read-only and returns the report in its reply body. Keep the full reply: you pass it to the engineer and, after a `NEEDS_INPUT`, back to the reviewer as `PRIOR_OUTPUT`.
4. **Check the response** against the reviewer response contract below.
5. **Act on the result**:
   - **PASS** with HIGH confidence: check the task and its verification step in the plan, record the result, go to the next component.
   - **PASS** with MEDIUM or LOW confidence: treat it as a failed gate. Ask the user whether to accept it or to resolve the gap before you check the task.
   - **FAIL**: delegate the fix to `tsh-ui-engineer` with the complete report and the artifact paths, requiring all listed differences to be fixed, not only the first. Then go back to step 2 with the next iteration number. In `SINGLE_PASS` stop here and report the findings.
   - **VERIFICATION NOT RUN**: see below.
6. **Iteration cap**: at most 5 FAIL iterations per component. After that, show a 3-choice gate to the user: continue N more iterations, stop and mark the component `ESCALATED`, or custom guidance. Show the component, the Figma URL, the remaining mismatches, what each iteration tried and the suspected root cause, and record it in the plan's Changelog. Mark `ESCALATED` only with the user's explicit acknowledgement. The cap is separate from the other loop caps.

`SINGLE_PASS: true` means one capture and one review per component: no step 1, no fix, no cap, no plan and no gate. Report the verdict of each component.

### Reviewer response contract

A valid response carries: `Verification Result` (PASS, FAIL or `VERIFICATION NOT RUN`), `Component`, `Artifact Directory`, a status per file and `Confidence`. If the response is empty, re-run the reviewer once. A response without `Confidence` is treated as LOW.

### Confidence handling

- **HIGH**: fix exactly as reported.
- **MEDIUM**: fix the obvious differences and ask the user about the unclear ones.
- **LOW**: pause and ask the user before changing anything, because the evidence may be incomplete. The pause does not count as an iteration.
- Items under `Clarification Needed` are questions for the user, not fixes. Ask them before the next fix pass.

### VERIFICATION NOT RUN

It is not terminal and costs no iteration. Read the reason and act on it:

- Missing, stale or blocked artifacts: ask the user to resolve the blocker (URL, login, Figma link), then capture and review again. A worker `NEEDS_INPUT` or `BLOCKED` is handled the same way.
- The reviewer cannot open images, or the Figma fetch fails: **stop the loop and ask the user**, because a new capture does not help. Record it in the plan's Changelog and offer manual verification (Figma and app side by side). Never turn it into a pass.
- A `VERIFICATION NOT RUN` retry reuses the same `iteration-<n>` directory (the three ACTUAL files are deleted before each capture).
- A second failure of the same tool ends that branch; do not retry a third time.

## Rules

- Every UI component is verified at least once, with no exceptions.
- Fix every reported difference and never rationalize one away.
- Verify again after every fix with a fresh capture. Never assume a fix worked.
- A type check, a build, a passing test suite or a code review never substitutes for this verification.
- Never fix a UI difference yourself and never hand a UI fix to a non-UI engineer.

## Verification gate

A report is valid only if it records the Figma node id and version, names the three artifacts of this iteration and holds a structured EXPECTED versus ACTUAL comparison. If either side is missing, for example because the reviewer only read source code, the verification is invalid:

1. Find out why it failed (wrong URL, authentication, tool error).
2. Ask the user to resolve the blocker (correct URL, credentials or manual verification).
3. Run a fresh capture and review once the blocker is resolved.
4. Accept only a valid report, or an explicit instruction from the user to skip.

**Gate before code review**: compare the inventory from the setup with the processed components. Every UI verification task must have passed, or have been escalated with the user's explicit approval to skip. If one was not processed, process it now. If verification cannot be completed for a component, record that in the plan's Changelog and get the user's explicit approval before moving on. Then give the manager a short UI verification summary: the components verified, the iterations per component, the design gaps found and any deviations with their rationale. The report stays in your reply and in the plan's Changelog.

## Fallback when verification keeps failing

If the reviewer or the worker repeatedly returns LOW confidence, `BLOCKED`, `VERIFICATION NOT RUN` or tool errors, do not loop blindly. Ask the user whether they can verify manually, record the issue in the plan's Changelog and continue with the next component or escalate.
