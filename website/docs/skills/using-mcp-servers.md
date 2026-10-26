---
sidebar_position: 42
title: Using MCP Servers
---

# Using MCP Servers

**Skill name:** `tsh-using-mcp-servers`  
**Source:** `src/skills/tsh-using-mcp-servers/`  
**Used by:** Architect, Code Reviewer, Context Engineer, DevOps Engineer, E2E Engineer, Prompt Engineer, Software Engineer, UI Engineer, Business Analyst (orchestrator)

Shared usage rules for the MCP servers of this collection (context7, pdf-reader, atlassian, figma, playwright, sequential-thinking, AWS and GCP). Covers when to use each server, how to use it correctly and what to do when it is unavailable, including the rule that delegated subagents never write to Jira.

**Use when** an agent, command or orchestrator is about to call an MCP server tool or needs to decide whether to.

## Playwright MCP versus `playwright-cli`

The `playwright` MCP server is for interactive exploration, ad hoc debugging and E2E locator discovery. It is **not** used for Figma UI verification: that capture is done with the `playwright-cli` command line by the UI Capture Worker (see [`tsh-using-playwright-cli`](./using-playwright-cli) and [`tsh-verifying-ui`](./verifying-ui)).

## What it covers

- General Rules
- Delegated Mode Caveat
- Servers

## Support files

- `references/`: `atlassian.md`, `aws.md`, `context7.md`, `figma.md`, `gcp.md`, `pdf-reader.md`, `playwright.md`, `sequential-thinking.md`

## Connected skills

- [`tsh-discovering-technical-context`](./discovering-technical-context)
- [`tsh-using-playwright-cli`](./using-playwright-cli)
- [`tsh-verifying-ui`](./verifying-ui)
