---
sidebar_position: 44
title: Using Playwright CLI
---

# Using Playwright CLI

**Skill name:** `tsh-using-playwright-cli`  
**Source:** `src/skills/tsh-using-playwright-cli/`  
**Used by:** UI Capture Worker

Knowledge for driving a browser through the `playwright-cli` command line: opening named sessions, taking screenshots and accessibility snapshots, reading computed styles and saving or loading session state.

**Use when** driving a browser through `playwright-cli` to capture screenshots, snapshots and computed styles.

`playwright-cli` is a command you install yourself (`npx playwright-cli` or `npm install -g @playwright/cli@latest`), not an MCP server. The `playwright` MCP server stays for interactive exploration and E2E work. See [Prerequisites](../getting-started/prerequisites#figma-backed-ui-verification) and the [Playwright integration](../integrations/playwright).

## What it covers

- A quick start, the command groups, raw output and named sessions.
- Storage state: saving and reusing a login session safely (private temporary file, restricted permissions, kept outside the working tree, never committed).
- A "restricted use" rule: while a session is authenticated, tracing, video, request mocking and free-form code execution are not allowed. Two fixed, reviewed snippets are the only exception: one stabilizes the page before capture (reduced motion, wait for load), the other is a screenshot fallback.
- The rules for authenticated capture are not repeated here; they are owned by [`tsh-verifying-ui`](./verifying-ui).

## Support files

- `references/`: element attributes, session management, storage state, running code, tracing, video recording, request mocking, test generation, Playwright tests and spec-driven testing
- `assets/`: the two fixed snippets (`stabilize` and `screenshot-fallback`)

## Connected skills

- [`tsh-verifying-ui`](./verifying-ui)
