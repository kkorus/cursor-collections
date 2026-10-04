---
sidebar_position: 3
title: MCP Setup
---

# MCP Setup

To unlock the full workflow (Jira, Figma, code search, browser automation), configure the MCP (Model Context Protocol) servers. TSH AI Collections provides a ready-to-use template for each tool, generated from one source (`src/mcp/servers.json`).

The installer does **not** write MCP configuration. It prints the generated file to merge for each tool. Merge the entries into your existing config, so you keep servers you already have.

## Per-tool setup

| Tool | Generated file in the repository | User scope (all projects) | Project scope |
|---|---|---|---|
| **Cursor** | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `<project>/.cursor/mcp.json` |
| **Claude Code** | `.mcp.json` | `~/.claude.json`, key `mcpServers` | `<project>/.mcp.json` |
| **Codex** | `.codex/config.toml` | `~/.codex/config.toml` | `<project>/.codex/config.toml` |

:::caution Not yet verified
The user-scope locations for Claude Code (`~/.claude.json`) and Codex (`~/.codex/config.toml`) are the paths the installer prints. They have not been confirmed in a real install yet. If a server does not show up, check the tool's own MCP documentation.
:::

### Cursor

1. Open **Cursor Settings** (`Cmd/Ctrl + Shift + J`) and go to **MCP**.
2. Merge the `mcpServers` entries of [`.cursor/mcp.json`](https://github.com/kkorus/cursor-collections/blob/main/.cursor/mcp.json) into `~/.cursor/mcp.json` (all projects) or into your project's `.cursor/mcp.json`.

The top-level key must be `mcpServers`. An earlier version of this repository used `servers`, which is wrong; see [Upgrading](./upgrading).

### Claude Code

Merge the entries of [`.mcp.json`](https://github.com/kkorus/cursor-collections/blob/main/.mcp.json) into your project's `.mcp.json`, or add servers one by one with `claude mcp add` (see the [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)). Claude Code asks you to approve servers from a project `.mcp.json` the first time. Remote servers need `"type": "http"`, which the generated file already sets.

:::info Keep the server name `atlassian`
The business analyst sub-workers must not write to Jira. For Claude Code, that is enforced by denying the tools of the MCP server named `atlassian`. If you add Atlassian as a claude.ai connector instead, Claude Code names its tools `mcp__claude_ai_<server>__*`, and the deny does not match them. The exact connector name is not yet verified. Use the generated `.mcp.json` entry named `atlassian`.
:::

### Codex

Merge the tables of [`.codex/config.toml`](https://github.com/kkorus/cursor-collections/blob/main/.codex/config.toml) into `~/.codex/config.toml`, or into `<project>/.codex/config.toml`.

:::warning Trusted projects only
Codex loads a project-level `.codex/config.toml` (and `.codex/agents`) **only in trusted projects**. Trust the project in Codex first, or use the user-level file.
:::

Server names that contain dots, such as `awslabs.aws-api-mcp-server`, are written with quoted table keys (`[mcp_servers."awslabs.aws-api-mcp-server"]`). Whether Codex accepts them is not yet verified.

## MCP Server Reference

| MCP Server | Purpose | Used By |
|------------|---------|---------|
| **Atlassian** | Access Jira issues and Confluence pages | Business Analyst, Context Engineer, Architect, Engineering Manager, Code Reviewer |
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

## After Installation

Once you've copied the configuration, here's what to do:

1. **Start a chat** — open Agent chat in Cursor, or start Claude Code or Codex, and send a message. The tool starts the MCP servers when a tool call needs them.
2. **Authenticate when prompted** — for **Atlassian** and **Figma**, your browser may open asking you to log in and authorize access. Follow the prompts.
3. **(Optional) Add a Context7 API key** — Context7 works out of the box with rate limits. For higher limits, see [Configuring Context7 API Key](#configuring-context7-api-key) below.

That's it — no extra commands or manual wiring needed.

## Verify Your Setup

To confirm all MCP servers are running correctly:

1. **Cursor:** open **Cursor Settings → MCP**. **Claude Code:** run `/mcp`. **Codex:** run `codex mcp list` (not yet verified).
2. Confirm each configured server appears in the list with a **connected** or **running** status. You should see all 11 servers from [MCP Server Reference](#mcp-server-reference) above (Atlassian, Figma, Context7, Playwright, Sequential Thinking, AWS API, AWS Documentation, GCP Gcloud, GCP Observability, GCP Storage, PDF Reader).
3. Send a test message in Agent chat that uses an MCP tool (for example, ask the agent to look up a Jira issue or search Context7 documentation) and confirm the tool call succeeds.

If any server shows an error or disconnected status, restart your tool or check the [Authentication Requirements](#authentication-requirements) section below.

## Configuring Context7 API Key

To get higher rate limits, provide a Context7 API key. Get your key at [context7.com/dashboard](https://context7.com/dashboard).

Add the `--api-key` argument to the `context7` entry.

Cursor (`mcp.json`) and Claude Code (`.mcp.json`):

```json
{
  "mcpServers": {
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

Codex (`config.toml`):

```toml
[mcp_servers.context7]
command = "npx"
args = [ "-y", "@upstash/context7-mcp@latest", "--api-key", "YOUR_API_KEY_HERE" ]
```

Do not commit a real key to a shared repository.

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
