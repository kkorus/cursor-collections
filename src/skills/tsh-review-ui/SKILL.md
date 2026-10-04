---
name: tsh-review-ui
description: Single-pass UI verification comparing implementation against Figma design. Use when the user types /tsh-review-ui, asks to verify a UI component, or wants to compare the running app against Figma. Routes to the tsh-ui-reviewer agent.
type: command
routes-to: tsh-ui-reviewer
argument-hint: "<figma-url> <dev-url> [component]"
metadata:
  short-description: Verify a UI implementation against its Figma design
---
# /tsh-review-ui

Delegate to the `tsh-ui-reviewer` subagent. Perform a single verification pass comparing the current implementation against the Figma design. Report all differences found — do not fix code.

Arguments: the Figma URL, the running dev server URL and optionally the component or section name. Pass them to the subagent. If one is missing, ask the user before delegating.

## Workflow

The subagent loads the `tsh-verifying-ui` skill (process, criteria, tolerances, severity definitions, report format) and follows its 5-step verification process:

1. Validate inputs (Figma URL + running dev server)
2. Get EXPECTED from Figma via `figma`
3. Get ACTUAL from implementation via `playwright` — structure, actual rendered dimensions, and visual screenshot
4. Compare following the skill's verification categories and tolerances
5. Generate structured report following the skill's report format

The Figma design is the **source of truth** for every comparison. When in doubt, the design wins.

**Enumerate ALL differences in a single pass.** Do not stop at the first critical finding — complete every verification category (Structure, Layout, Dimensions, Visual, Components) and report every difference found. The goal is to give the engineer a complete list so all fixes can be applied at once, minimizing the number of verify-fix iterations.

<!-- include: caller-status-handling -->
