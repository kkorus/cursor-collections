---
name: tsh-orchestrate-ui-verification
description: Internal step of /tsh-implement. Load only when a tsh command or orchestrator instructs it. The single verify-fix loop for UI tasks with Figma designs, run by the engineering manager until the implementation matches within agreed tolerances.
type: internal
metadata:
  short-description: Run the UI implement and Figma verify loop
---
# tsh-orchestrate-ui-verification

This skill is the only place that defines the UI verify-fix loop. The `tsh-engineering-manager` loads it for every UI task that has a Figma reference. Other skills and commands point here and must not restate the loop.

The loop runs in the main thread. You implement nothing yourself: you delegate implementation and fixes to `tsh-software-engineer` and verification to `tsh-ui-reviewer`, using the delegation template of the status-handling section you already follow. You do not need Figma or browser tools yourself; the reviewer has its own.

## Design references

Find every Figma URL before delegating anything:

- In the research file (`*.research.md`): the Relevant Links section and the component or node links in Gathered Information.
- In the plan file (`*.plan.md`): Task Details and, if present, a Design References subsection mapping views and components to URLs or node IDs.

Pass the relevant URLs to both the engineer (implementation context) and the reviewer (verification target).

### Missing Figma link

If a component that needs verification has no Figma URL, stop for that component. Do not delegate its implementation or verification. Ask the user for the link, wait for it and add it to the plan (Task Details or Design References). If the engineer returned `NEEDS_INPUT` because of a missing link, this is the same case. Never skip verification and never continue without a reference.

## Setup once per session

1. List all UI tasks and all Figma references from the plan and research. This inventory is your checklist for the gate below.
2. Ask the user for the dev server URL (for example "What URL is the frontend app running at?") before any verification can start. Do not guess it from running processes or port scans, because several services may run on different ports. Reuse the confirmed URL for the whole session.

## The loop, per UI component

1. **Implement**: delegate the UI task to `tsh-software-engineer`, telling it to follow the "UI tasks (Figma)" section of the `tsh-implement-task` skill. Pass the Figma URLs, the component context and the plan section.
2. **Verify**: delegate `tsh-ui-reviewer` with the Figma URL, the confirmed dev server URL and the component or section name. It follows the `tsh-verifying-ui` skill and returns a structured report.
3. **Check the report** against the verification gate below before acting on it.
4. **Act on the result**:
   - **PASS**: check the task and its verification step in the plan, record the result, go to the next component.
   - **FAIL**: delegate the fix to `tsh-software-engineer` with the complete report, and require it to fix all listed differences, not only the first. Then verify again (step 2).
5. **Iteration cap**: at most 5 verify-fix iterations per component. After that, escalate: list the remaining mismatches with the Figma URL, describe what each iteration tried, state the suspected root cause, record it in the plan's Changelog and ask the user for guidance.

### Confidence levels

- **HIGH**: fix exactly as reported.
- **MEDIUM**: fix the obvious differences and ask the user about unclear ones.
- **LOW**: ask the user before changing anything, because the tool data may be incomplete.

### Rules

- Every UI component is verified at least once, with no exceptions.
- Fix every reported difference and never rationalize one away.
- Verify again after every fix. Never assume a fix worked.

## Verification gate

A report is valid only if it contains data extracted from Figma, data captured from the running app (screenshots, computed styles, accessibility snapshot) and a structured EXPECTED versus ACTUAL comparison. If either side is missing, for example because the reviewer only read source code or skipped the browser after a blocker, the verification is invalid:

1. Find out why it failed (wrong URL, authentication, tool error).
2. Ask the user to resolve the blocker (correct URL, credentials or manual verification).
3. Delegate the reviewer again once the blocker is resolved.
4. Accept only a valid report, or an explicit instruction from the user to skip.

**Gate before code review**: compare the inventory from the setup with the processed components. Every UI verification task must have passed, or have been escalated with the user's explicit approval to skip. If one was not processed, process it now. If verification cannot be completed for a component, record that in the plan's Changelog and get the user's explicit approval before moving on. Then give the manager a short UI verification summary: the components verified, the iterations per component, the design gaps found and any deviations with their rationale.

## Fallback when the reviewer keeps failing

If the reviewer repeatedly returns LOW confidence, `BLOCKED` or tool errors, do not loop blindly. Ask the user whether they can verify manually (Figma and app side by side), record the issue in the plan's Changelog and continue with the next component or escalate.
