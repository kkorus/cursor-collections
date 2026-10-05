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
   ↳ ✅ Confirm the approved plan aligns with Figma structure
   ↳ 💻 Engineering Manager delegates UI tasks to Software Engineer
   ↳ 📖 Review code changes and UI Verification Summary
   ↳ ✅ Manually verify critical UI elements in browser
   ↳ 🔄 Engineering Manager runs the UI verify-fix loop (tsh-ui-reviewer) until PASS or escalation

2️⃣ /tsh-review       <JIRA_ID or task description>
   ↳ 📖 Review findings – code quality, a11y, performance
   ↳ ✅ Address all blockers before merging
```

## How the Verification Loop Works

1. The Engineering Manager loads the internal `tsh-orchestrate-ui-verification` step, which owns the whole loop, and delegates a UI component implementation to the Software Engineer.
2. After the Software Engineer completes, the Engineering Manager delegates **single-pass verification** (read-only) to the `tsh-ui-reviewer` subagent.
3. The UI Reviewer uses **Figma MCP** (EXPECTED) + **Playwright MCP** (ACTUAL) → returns PASS or FAIL with diff table. You can run the same single-pass check yourself with `/tsh-review-ui`.
4. If FAIL → the Engineering Manager delegates the fix to the Software Engineer and verifies again.
5. Repeats until PASS or max **5 iterations** (then escalates to the developer).

## What `/tsh-review-ui` Does

- Single-pass, **read-only** verification — does not modify code.
- Uses **Figma MCP** to extract design specifications (spacing, typography, colors, dimensions).
- Uses **Playwright MCP** to capture the current implementation state.
- Returns a structured report: **PASS/FAIL** + difference table with exact values.
- Covers: structure (containers, nesting), dimensions (width, height, spacing), visual (typography, colors, radii), and components (variants, tokens, states).

## What `tsh-orchestrate-ui-verification` Does

:::info Internal step
`tsh-orchestrate-ui-verification` is an internal step, not a command. The Engineering Manager loads it automatically when `/tsh-implement` reaches UI tasks with Figma references. The Cursor IDE and Codex may still list it in their menus (Cursor supports hiding it in the CLI only); you do not need to run it. See [Supported Tools](../getting-started/supported-tools).
:::

- Run by the **Engineering Manager** in your main conversation, which delegates to the Software Engineer and UI Reviewer.
- Implements UI components following the plan.
- Runs an **iterative verification loop**, delegating to the `tsh-ui-reviewer` subagent after each component.
- **Fixes mismatches** by delegating fixes back to the Software Engineer based on subagent reports.
- Escalates after 5 failed iterations with a detailed report.
- Produces a **UI Verification Summary** before handing off to code review.

## Required Skills

The frontend flow loads these specialized skills:

- **tsh-implementing-frontend** — Component patterns, design system usage, composition, and performance guidelines.
- **tsh-verifying-ui** — Verification criteria, tolerances, severity definitions, and what constitutes PASS/FAIL.
- **tsh-ensuring-accessibility** — WCAG 2.2 AA compliance, semantic HTML, ARIA, keyboard navigation.
- **tsh-discovering-technical-context** — Project conventions and coding standards.

:::warning Important
The automated Figma verification loop helps catch visual mismatches, but it does not replace manual review. Always visually inspect the implemented UI in the browser, test interactions, and verify responsive behavior yourself.
:::
