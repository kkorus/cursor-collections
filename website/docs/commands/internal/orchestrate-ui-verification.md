---
sidebar_position: 8
title: tsh-orchestrate-ui-verification
---

# tsh-orchestrate-ui-verification

**Source:** `src/skills/tsh-orchestrate-ui-verification/SKILL.md`  
**Kind:** internal step. Loaded by the Engineering Manager for every UI task that has a Figma reference.

The single verify-fix loop for UI tasks with Figma designs. It runs in the main thread until the implementation matches the design within the agreed tolerances. This is the only place that defines the loop. The same step also serves `/tsh-review-ui` in single-pass mode.

## What it does

Not invoked directly by you. It runs inside [`/tsh-implement`](../implement) when the plan contains UI tasks with Figma references, and behind [`/tsh-review-ui`](../review-ui).

**Setup, once per session**

1. Lists all UI tasks and Figma references from the plan and research files. This inventory is the checklist for the gate below.
2. Asks you to confirm the full dev server URL. It does not guess it from running processes or configuration. The confirmed URL is reused unchanged for the whole session.
3. If a component has no Figma URL, it stops for that component and asks you for the link. Verification is never skipped.

**The loop, per UI component** (the manager delegates every step; agents never delegate)

1. **Implement:** delegates the UI task to the [UI Engineer](../../agents/ui-engineer) with the Figma URLs and the plan section.
2. **Capture:** deletes the three ACTUAL files of the iteration, then delegates the [UI Capture Worker](../../agents/ui-capture-worker) to collect `actual.png`, `computed-styles.json` and `a11y-snapshot.yml` in `<UI_VERIFICATION_DIR>/<component-slug>/iteration-<n>/`. There is never a review without a fresh capture.
3. **Verify:** delegates the [UI Reviewer](../../agents/ui-reviewer) with the Figma URL and the iteration directory. The reply must hold the verification result, the component, the artifact directory, a status per file and a confidence level. An empty reply is re-run once; a missing confidence counts as LOW.
4. **PASS:** checks the task in the plan and moves to the next component. **FAIL:** delegates the fix to the UI Engineer with the complete report and the artifact paths, requires every listed difference to be fixed, and starts the next iteration.
5. **`VERIFICATION NOT RUN`:** does not count as an iteration. The manager shows you the reason and asks what to do; where the host cannot open images, the loop stops instead of continuing blind.
6. **Iteration cap:** at most 5 FAIL iterations per component. Then a 3-choice gate: continue for N more iterations, stop and mark `ESCALATED` (only with your explicit acknowledgement), or custom guidance, with the remaining mismatches, what each iteration tried and the suspected root cause.

**Confidence levels:** HIGH means fix exactly as reported; MEDIUM means fix the obvious differences and ask about unclear ones; LOW means pause and ask you before changing anything (not an iteration).

**Single-pass mode (`/tsh-review-ui`):** the manager receives `UI_TASKS`, `FIGMA_URLS`, `DEV_SERVER_URL`, `UI_VERIFICATION_DIR` and `SINGLE_PASS: true`, then runs one capture and one review per component with no fixes, no cap, no plan and no gate. `UI_VERIFICATION_DIR` defaults to `<specs>/<task>/ui-verification`, and the capture worker gets the per-component directory as `ITERATION_DIR`.

**Gate before code review:** every UI verification task must have passed, or been escalated with your explicit approval. Type-check, build and code review never substitute for it. The manager then produces a UI verification summary: components verified, iterations per component, design gaps and deviations.

If the reviewer keeps returning LOW confidence, `BLOCKED` or tool errors, the manager asks whether you can verify manually and records the issue in the plan's Changelog.

## Output

A UI verification summary for the Engineering Manager, and updated verification checkboxes in the plan. See also the [UI Verification Flow](../../workflow/ui-verification-flow).
