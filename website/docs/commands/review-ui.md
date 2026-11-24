---
sidebar_position: 7
title: /tsh-review-ui
---

# /tsh-review-ui

**Source:** `src/skills/tsh-review-ui/SKILL.md`  
**Routes to:** [Engineering Manager](../agents/engineering-manager) orchestrator skill (`tsh-engineering-manager`), in UI-only mode, runs in the main thread

A single verification pass that compares the running implementation with the Figma design. It reports every difference and does not fix code. The command only loads the engineering manager in UI-only mode; the manager runs the capture and the review.

## Usage

```text
/tsh-review-ui <figma-url> <dev-url> [component]
```

## What it does

1. Takes the Figma URL, the full running dev server URL and optionally a component or section name. If one is missing, asks you before delegating. With several components, each gets its own Figma URL.
2. The engineering manager runs, for each component, one capture and one review, with no fixes, no iteration cap, no plan and no approval gate:
   - the [UI Capture Worker](../agents/ui-capture-worker) collects the running app's evidence (screenshot, computed styles, accessibility snapshot) with `playwright-cli`
   - the [UI Reviewer](../agents/ui-reviewer) reads EXPECTED values from Figma, compares them with that evidence by category (Structure, Layout, Dimensions, Visual, Components) and writes a structured report
3. The design is the source of truth. The reviewer lists all differences in one pass, so the engineer can fix them together.
4. The verdict is never empty: `PASS`, `FAIL`, or `VERIFICATION NOT RUN` with a reason when artifacts or tools are missing (for example where the host cannot open images). It never fixes code.

The evidence is stored per component in the specifications folder of the task, in `ui-verification/<component>/iteration-<n>/`.

Requires the Figma MCP and the `playwright-cli` command. For a page behind a login, see [Prerequisites](../getting-started/prerequisites) and the [FAQ](../getting-started/faq). See also [MCP setup](../getting-started/mcp-setup).

For the verify-fix loop that implements and verifies UI in one flow, use [`/tsh-implement`](./implement). The loop is described in the [UI Verification Flow](../workflow/ui-verification-flow).

## Verified status per tool

| Tool | Reviewer opens PNG files | Capture worker sees a variable exported in the launching shell |
| --- | --- | --- |
| Claude Code | verified (2.1.308) | verified |
| Cursor | verified (cursor-agent 2026.10.22) | verified in the CLI with `--force`; a GUI-launched Cursor does not inherit shell exports (documented caveat, not measured) |
| Codex | not verified (CLI not installed) | not verified |

Not yet verified in any tool: the reviewer fetching the design through an authenticated Figma MCP, and the hardened `playwright-cli` worker flow (`playwright-cli` was not installed on the build machine). Where an image cannot be opened or the design cannot be fetched, the result is `VERIFICATION NOT RUN` and the loop asks the user.

See [Supported Tools](../getting-started/supported-tools).
