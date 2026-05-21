---
sidebar_position: 3
title: MCP Setup
---

# MCP Setup

To unlock the full workflow (Jira, Figma, code search, browser automation), configure the MCP (Model Context Protocol) servers. Cursor Collections provides a ready-to-use template in `.cursor/mcp.json`.

## Installation Options

### Option 1: User Profile (Recommended)

This enables the MCP tools globally across all your projects.

1. Open **Cursor Settings** (`Cmd/Ctrl + Shift + J`)
2. Navigate to **MCP**
3. Click **Add MCP Server**
4. Copy the contents of [`.cursor/mcp.json`](https://github.com/TheSoftwareHouse/cursor-collections/blob/main/.cursor/mcp.json) from this repository

### Option 2: Workspace Configuration

Use this if you want to enable these tools only for a specific project.

1. Copy the `.cursor/mcp.json` file from this repository.
2. Paste it into the `.cursor` folder of your target project (e.g., `my-project/.cursor/mcp.json`).

## MCP Server Reference

| MCP Server | Purpose | Used By |
|------------|---------|---------|
| **Atlassian** | Access Jira issues and Confluence pages | Business Analyst, Architect, Software Engineer, Code Reviewer |
| **Figma** | Pull design details, components, and variables | Software Engineer (UI), UI Reviewer |
| **Context7** | Semantic search in external documentation | All agents |
| **Playwright** | Browser automation and E2E testing | Software Engineer, E2E Engineer, UI Reviewer |
| **Sequential Thinking** | Advanced reasoning for complex analysis | All agents (for complex tasks) |
| **AWS API** | Live AWS infrastructure inspection | DevOps Engineer |
| **AWS Documentation** | AWS service documentation lookup | DevOps Engineer |
| **GCP Gcloud** | Live GCP infrastructure inspection | DevOps Engineer |
| **GCP Observability** | GCP monitoring and logging | DevOps Engineer |
| **GCP Storage** | GCP Cloud Storage audit | DevOps Engineer |
| **PDF Reader** | Extract content from PDF documents | Business Analyst, Context Engineer |

## Configuring Context7 API Key

To get higher rate limits, provide a Context7 API key. Get your key at [context7.com/dashboard](https://context7.com/dashboard).

Modify your `mcp.json` to use the `--api-key` argument:

```json
{
  "servers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest",
        "--api-key",
        "YOUR_API_KEY_HERE"
      ]
    }
  }
}
```

## Authentication Requirements

- **Atlassian** — Requires Atlassian account authentication. The HTTP MCP endpoint handles OAuth automatically via your browser.
- **Figma** — Requires Figma account access. The HTTP MCP endpoint handles authentication via your browser.
- **Context7** — Works without an API key (with rate limits). Optional API key for higher limits.
- **Playwright** — No authentication required. Runs locally via npx.
- **Sequential Thinking** — No authentication required. Runs locally via npx.
- **AWS MCPs** — Requires AWS credentials configured locally (`aws configure` or environment variables).
- **GCP MCPs** — Requires GCP credentials configured locally (`gcloud auth application-default login`).

## Official Documentation

- [Atlassian MCP](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/)
- [Context7 MCP](https://github.com/upstash/context7)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Figma MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Sequential Thinking MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
