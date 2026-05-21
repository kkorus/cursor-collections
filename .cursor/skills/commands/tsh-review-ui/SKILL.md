---
name: tsh-review-ui
description: Single-pass UI verification comparing implementation against Figma design. Use when the user types /tsh-review-ui, asks to verify a UI component, or wants to compare the running app against Figma. Routes to the tsh-ui-reviewer agent.
disable-model-invocation: true
---
# /tsh-review-ui

Load and follow the tsh-ui-reviewer agent skill. Perform a single verification pass comparing the current implementation against the Figma design. Report all differences found — do not fix code.

This skill can be used standalone (user invokes directly) or the same verification is performed when `tsh-ui-reviewer` is called as a subagent from `/tsh-implement`.

## Required Skills

Before starting, load and follow these skills:

- Read [references/ui-verifying.md](references/ui-verifying.md) — verification process, criteria, tolerances, severity definitions, report format

## Workflow

Follow the 5-step verification process in [references/ui-verifying.md](references/ui-verifying.md). The reference contains the complete workflow including:

1. Validate inputs (Figma URL + running dev server)
2. Get EXPECTED from Figma via `figma`
3. Get ACTUAL from implementation via `playwright` — structure, actual rendered dimensions, and visual screenshot
4. Compare following the skill's verification categories and tolerances
5. Generate structured report following the skill's report format

The Figma design is the **source of truth** for every comparison. When in doubt, the design wins.

**Enumerate ALL differences in a single pass.** Do not stop at the first critical finding — complete every verification category (Structure, Layout, Dimensions, Visual, Components) and report every difference found. The goal is to give the engineer a complete list so all fixes can be applied at once, minimizing the number of verify-fix iterations.
