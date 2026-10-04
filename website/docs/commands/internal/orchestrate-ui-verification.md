---
sidebar_position: 8
title: tsh-orchestrate-ui-verification
---

# tsh-orchestrate-ui-verification

**Source:** `src/skills/tsh-orchestrate-ui-verification/SKILL.md`  
**Kind:** internal step. Loaded by the Engineering Manager for every UI task that has a Figma reference.

The single verify-fix loop for UI tasks with Figma designs. It runs in the main thread until the implementation matches the design within the agreed tolerances. This is the only place that defines the loop.

## What it does

Not invoked directly by you. It runs inside [`/tsh-implement`](../implement) when the plan contains UI tasks with Figma references.

**Setup, once per session**

1. Lists all UI tasks and Figma references from the plan and research files. This inventory is the checklist for the gate below.
2. Asks you for the dev server URL. It does not guess it from running processes. The confirmed URL is reused for the whole session.
3. If a component has no Figma URL, it stops for that component and asks you for the link. Verification is never skipped.

**The loop, per UI component**

1. **Implement:** delegates the UI task to the [Software Engineer](../../agents/software-engineer) with the Figma URLs and the plan section.
2. **Verify:** delegates the [UI Reviewer](../../agents/ui-reviewer) with the Figma URL, the dev server URL and the component name.
3. **Check the report.** It is valid only if it holds data from Figma, data from the running app and a structured EXPECTED versus ACTUAL comparison. Otherwise the manager finds the cause, asks you to resolve the blocker and verifies again.
4. **PASS:** checks the task in the plan and moves to the next component. **FAIL:** delegates the fix with the complete report, requires every listed difference to be fixed, and verifies again.
5. **Iteration cap:** at most 5 verify-fix iterations per component. Then it escalates with the remaining mismatches, what each iteration tried and the suspected root cause, and asks you for guidance.

**Confidence levels:** HIGH means fix exactly as reported; MEDIUM means fix the obvious differences and ask about unclear ones; LOW means ask you before changing anything.

**Gate before code review:** every UI verification task must have passed, or been escalated with your explicit approval to skip. The manager then produces a UI verification summary: components verified, iterations per component, design gaps and deviations.

If the reviewer keeps returning LOW confidence, `BLOCKED` or tool errors, the manager asks whether you can verify manually and records the issue in the plan's Changelog.

## Output

A UI verification summary for the Engineering Manager, and updated verification checkboxes in the plan.
