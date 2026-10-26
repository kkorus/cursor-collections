---
name: tsh-review-ui
description: Single-pass UI verification comparing implementation against Figma design. Use when the user types /tsh-review-ui, asks to verify a UI component, or wants to compare the running app against Figma. Routes to the engineering manager (UI-only mode).
argument-hint: <figma-url> <dev-url> [component]
disable-model-invocation: true
metadata:
  short-description: Verify a UI implementation against its Figma design
---
<!-- Generated from src/skills/tsh-review-ui/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-review-ui

Load the `tsh-engineering-manager` skill and run it in UI-only mode: one capture and one review per component, no fixes, no plan, no gate.

Pass along these inputs (the contract is owned by the manager):

- `UI_TASKS`: the component or section names (one entry per component)
- `FIGMA_URLS`: one Figma URL per component
- `DEV_SERVER_URL`: the full dev server URL, confirmed by the user
- `UI_VERIFICATION_DIR`: the verification root; each component gets its own sub-root `<component-slug>/iteration-<n>/`, handed on as `ITERATION_DIR`
- `SINGLE_PASS: true`

The arguments are the Figma URL, the running dev server URL and optionally the component or section name. If one is missing, ask the user before delegating; never guess the dev server URL.

Rules:

- Never fix code. Report every difference found, across all verification categories, so all fixes can be applied at once.
- The verdict is never empty: `PASS`, `FAIL` or `VERIFICATION NOT RUN`.
- Report `VERIFICATION NOT RUN`, with the reason, when artifacts or tools are missing (capture could not run, the image cannot be opened, the Figma node cannot be fetched). It is never a pass.
