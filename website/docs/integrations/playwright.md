---
sidebar_position: 5
title: Playwright
---

# Playwright MCP

**Server key:** `playwright`  
**Type:** stdio  
**Package:** `@playwright/mcp@latest`

Provides browser automation capabilities for interactive debugging and E2E test work. It is **not** the capture tool of the Figma UI verification loop; that uses the `playwright-cli` command line (see below).

## Capabilities

- Navigate to pages and interact with elements (click, fill, hover).
- Capture the accessibility tree for structured page analysis.
- Take screenshots for visual comparison.
- Inspect element state and properties.
- Simulate real user behavior.

## Which Agents Use It

| Agent | When |
|---|---|
| **E2E Engineer** | Exploring UI to discover locators and understand DOM structure |

Any agent or user may also use it for ad hoc interactive exploration of a running page. The Software Engineer, UI Engineer and UI Reviewer do not use it.

## Configuration

```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"],
    "type": "stdio"
  }
}
```

## Playwright MCP versus `playwright-cli`

| | `playwright` MCP | `playwright-cli` |
|---|---|---|
| Kind | MCP server (configured in `mcpServers`, or `[mcp_servers.playwright]` for Codex) | Command-line tool, called from the shell |
| Used for | Interactive exploration and E2E locator discovery | Figma UI verification capture (screenshot, computed styles, accessibility snapshot) |
| Used by | E2E Engineer, ad hoc use | UI Capture Worker only |
| Install | Generated MCP config | `npx playwright-cli` or `npm install -g @playwright/cli@latest` |

## Prerequisites

- Local development server must be running.
- Target page must be accessible (authentication handled if needed).
- For UI verification you also need `playwright-cli` (see [Prerequisites](../getting-started/prerequisites)).

## Official Documentation

- [Playwright MCP on GitHub](https://github.com/microsoft/playwright-mcp)

## Usage Notes

- Primarily operates on the **accessibility tree**, which is often more reliable than visual screenshots for verification.
- Used for **real-time interaction** — clicking buttons, filling forms, navigating pages.
- In UI verification, the UI Reviewer pairs Figma MCP (EXPECTED) with the capture files that `playwright-cli` produced (ACTUAL); it does not call this MCP server.
- **Not used for running test suites** — use the terminal for that. Playwright MCP is for interactive exploration and verification.
