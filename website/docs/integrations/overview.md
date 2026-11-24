---
sidebar_position: 1
title: Integrations Overview
---

# Integrations Overview

TSH AI Collections integrates with **11 external services** via the **Model Context Protocol (MCP)**. These integrations bring Jira, Figma, documentation, browser automation, structured reasoning, document reading, and cloud provider APIs directly into your Cursor, Claude Code and Codex sessions — enabling the end-to-end product engineering workflow.

## What is MCP?

The Model Context Protocol allows AI agents to call external tools as part of their workflow. Each MCP server exposes specific capabilities (search, navigate, execute) that agents can use to gather information or perform actions.

## Configured Servers

| Server | Type | Purpose | Used By |
|---|---|---|---|
| [Atlassian](./atlassian) | HTTP | Jira & Confluence integration | BA, Architect, CR, CE |
| [Figma](./figma) | HTTP | Design extraction and verification | BA, Architect, UI Engineer, UI Reviewer, CR, E2E |
| [Context7](./context7) | stdio | Library documentation search | Architect, SE, UI Engineer, CR, UI Reviewer, E2E, Plan Reviewer, Prompt Engineer, Researcher, DevOps |
| [Playwright](./playwright) | stdio | Interactive browser automation and E2E test exploration | E2E (and ad hoc use) |
| [Sequential Thinking](./sequential-thinking) | stdio | Structured reasoning for complex problems | BA, Architect, SE, UI Engineer, CR, E2E, UI Reviewer, CE, Plan Reviewer, Prompt Engineer, DevOps |
| [PDF Reader](./pdf-reader) | stdio | PDF document extraction | BA, CE, Architect |
| [AWS API](./aws-api) | stdio | AWS infrastructure automation and resource management | DevOps |
| [AWS Documentation](./aws-documentation) | stdio | AWS service documentation and reference | DevOps |
| [GCP Gcloud](./gcp-gcloud) | stdio | Google Cloud operations and management | DevOps |
| [GCP Observability](./gcp-observability) | stdio | Google Cloud monitoring and observability | DevOps |
| [GCP Storage](./gcp-storage) | stdio | Google Cloud Storage integration | DevOps |

## Configuration

All servers are defined once in `src/mcp/servers.json` and generated for each tool:

| Tool | Generated file | Top-level key |
|---|---|---|
| Cursor | `.cursor/mcp.json` | `mcpServers` |
| Claude Code | `.mcp.json` | `mcpServers` |
| Codex | `.codex/config.toml` | `[mcp_servers.<name>]` |

The installer does not write MCP configuration. See [MCP Setup](../getting-started/mcp-setup) for how to merge the generated file into your own config (note that Cursor expects `mcpServers`, not `servers`).

## MCP versus `playwright-cli`

The `playwright` MCP server is for interactive exploration and E2E work. Figma UI verification does **not** use it: the UI Capture Worker collects the evidence with the `playwright-cli` command line, which is a command to install on your machine (`npx playwright-cli` or `npm install -g @playwright/cli@latest`), not an MCP server. See [Prerequisites](../getting-started/prerequisites) and the [Playwright page](./playwright).

## Server Types

- **stdio** — Runs locally via `npx` or `uvx`. The MCP server starts as a child process.
- **HTTP** — Connects to a remote API endpoint. Requires authentication (handled by the service).
