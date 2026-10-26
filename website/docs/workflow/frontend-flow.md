---
sidebar_position: 3
title: Frontend Flow
---

# Frontend Flow

For UI-heavy tasks with Figma designs, use the specialized frontend workflow. This extends the standard flow with iterative Figma verification to ensure the implementation matches the design within tolerance.

## Command Sequence

```text
1️⃣ /tsh-implement <JIRA_ID or task description>
   ↳ 🔍 Engineering Manager delegates to Context Engineer for research
   ↳ 📖 Review research doc – verify Figma links, requirements
   ↳ ✅ Confirm to proceed to planning
   ↳ 🧱 Engineering Manager delegates to Architect for planning
   ↳ 🧪 Engineering Manager delegates to Plan Reviewer for plan validation
   ↳ 📖 Review plan and review summary – check component breakdown, design references
   ↳ ✅ Confirm the plan aligns with Figma structure, then choose Approve plan
   ↳ ✅ Confirm the full dev server URL (pinned for the whole loop)
   ↳ 💻 Engineering Manager delegates UI tasks to the UI Engineer
   ↳ 📸 Engineering Manager has the UI Capture Worker capture the running UI
   ↳ 🔄 UI Reviewer compares Figma with the capture; fixes loop until PASS or escalation
   ↳ 📖 Review code changes and UI Verification Summary
   ↳ ✅ Manually verify critical UI elements in browser

2️⃣ /tsh-review       <JIRA_ID or task description>
   ↳ 📖 Review findings – code quality, a11y, performance
   ↳ ✅ Address all blockers before merging
```

## How the Verification Loop Works

The full description is on the [UI Verification Flow](./ui-verification-flow) page. In short:

1. The Engineering Manager loads the internal `tsh-orchestrate-ui-verification` step, which owns the whole loop, and delegates the UI implementation to the **UI Engineer**.
2. Before each review the **UI Capture Worker** captures the running app with `playwright-cli` (screenshot, computed styles, accessibility snapshot) at the pinned full URL.
3. The **UI Reviewer** (read-only) fetches EXPECTED from the Figma MCP, compares it with the capture and returns `PASS`, `FAIL` with a diff table, or `VERIFICATION NOT RUN` with a reason. You can run the same single-pass check yourself with `/tsh-review-ui`.
4. On `FAIL` the manager sends the full report to the UI Engineer, then captures and reviews again.
5. This repeats until `PASS` or at most **5 iterations** (then a gate lets you continue, stop as `ESCALATED`, or give custom guidance). `VERIFICATION NOT RUN` does not consume an iteration; where the host cannot open images the loop stops and asks you.

## What `/tsh-review-ui` Does

- Routes to the **engineering manager** in UI-only mode: one capture and one review per component, with no fixes, no iteration cap, no plan and no approval gate. It never modifies code.
- Asks you for any missing component name, Figma URL or full dev server URL first.
- The reviewer uses the **Figma MCP** to extract design specifications (spacing, typography, colors, dimensions); the capture worker collects the current implementation state.
- Returns a structured report: **PASS/FAIL** (or `VERIFICATION NOT RUN`) plus a difference table with exact values.
- Covers: structure (containers, nesting), dimensions (width, height, spacing), visual (typography, colors, radii), and components (variants, tokens, states).

## What `tsh-orchestrate-ui-verification` Does

:::info Internal step
`tsh-orchestrate-ui-verification` is an internal step, not a command. The Engineering Manager loads it automatically when `/tsh-implement` reaches UI tasks with Figma references. The Cursor IDE and Codex may still list it in their menus (Cursor supports hiding it in the CLI only); you do not need to run it. See [Supported Tools](../getting-started/supported-tools).
:::

- Run by the **Engineering Manager** in your main conversation, which delegates to the UI Engineer, the UI Capture Worker and the UI Reviewer one at a time.
- Enforces the order: no review without a fresh capture.
- **Fixes mismatches** by delegating them back to the UI Engineer with the full report.
- Escalates after 5 failed iterations with a detailed report.
- Produces a **UI Verification Summary** before handing off to code review, which starts only after the UI gate closes.

## Required Skills

The frontend flow loads these specialized skills:

- **tsh-implementing-frontend** — Component patterns, design system usage, composition, and performance guidelines.
- **tsh-verifying-ui** — Verification criteria, tolerances, severity definitions, and what constitutes PASS/FAIL.
- **tsh-using-playwright-cli** — Command-line browser capture, used by the UI Capture Worker.
- **tsh-ensuring-accessibility** — WCAG 2.2 AA compliance, semantic HTML, ARIA, keyboard navigation.
- **tsh-discovering-technical-context** — Project conventions and coding standards.

:::warning Important
The automated Figma verification loop helps catch visual mismatches, but it does not replace manual review. Always visually inspect the implemented UI in the browser, test interactions, and verify responsive behavior yourself.
:::
