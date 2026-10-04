---
sidebar_position: 7
title: /tsh-review-ui
---

# /tsh-review-ui

**Source:** `src/skills/tsh-review-ui/SKILL.md`  
**Routes to:** [UI Reviewer](../agents/ui-reviewer) subagent (`tsh-ui-reviewer`), delegated from the main thread

A single verification pass that compares the running implementation with the Figma design. It reports every difference and does not fix code.

## Usage

```text
/tsh-review-ui <figma-url> <dev-url> [component]
```

## What it does

1. Takes the Figma URL, the running dev server URL and optionally a component or section name. If one is missing, asks you before delegating.
2. Delegates to the UI Reviewer, which follows the `tsh-verifying-ui` skill:
   - validates the inputs
   - reads EXPECTED values from Figma
   - reads ACTUAL values from the running app with Playwright (structure, rendered dimensions, screenshot)
   - compares them by category: Structure, Layout, Dimensions, Visual, Components
   - writes a structured PASS/FAIL report
3. The design is the source of truth. The reviewer lists all differences in one pass, so the engineer can fix them together.

Requires the Figma and Playwright MCP servers. See [MCP setup](../getting-started/mcp-setup).

For the verify-fix loop that implements and verifies UI in one flow, use [`/tsh-implement`](./implement).
