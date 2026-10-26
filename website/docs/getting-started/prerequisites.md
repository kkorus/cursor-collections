---
sidebar_position: 1
title: Prerequisites
---

# Prerequisites

Before installing TSH AI Collections, make sure you meet the following requirements.

## An AI coding tool

The collection works with any of these tools. You can install it for one, two or all three.

| Tool | What you need |
|---|---|
| **Cursor** | Cursor with Agent mode. Download it from [cursor.com](https://cursor.com). |
| **Claude Code** | The `claude` CLI, see [code.claude.com](https://code.claude.com). |
| **Codex** | The `codex` CLI. Support for Codex is **not yet verified** in a real Codex session, see [Supported Tools](./supported-tools). |

Each tool needs its own subscription or API access. Complex multi-step workflows such as `/tsh-implement` make many model calls, so plan for a plan or key with enough quota.

## Node.js 22 or later

The installer (`scripts/install.mjs`) is a dependency-free Node script and requires **Node.js 22+**. Several MCP servers also run through `npx`.

```bash
node --version    # v22 or later
```

## Git

You clone the repository to install and to update the collection.

```bash
git --version
```

## Tools required by MCP servers

Some MCP servers need extra tooling. Install only what you use.

- **Node.js** — Playwright, Context7, Sequential Thinking and PDF Reader run through `npx`.
- **Python 3.10+ with `uvx`** — the AWS MCP servers run through `uvx` (install with `pip install uv`).
- **AWS or GCP credentials** — only for the DevOps cloud servers, see [MCP Setup](./mcp-setup#authentication-requirements).

```bash
python --version  # 3.10+
uvx --version
```

## Figma-backed UI verification

The UI verification loop (`/tsh-implement` with a Figma URL, and `/tsh-review-ui`) needs extra setup. Skip this section if you do not verify UI against Figma.

- **`playwright-cli`.** The UI Capture Worker captures the running app with this command. Run it through `npx playwright-cli` or install it globally with `npm install -g @playwright/cli@latest`. It is a command, not an MCP server; the `playwright` MCP stays for interactive and E2E use.
- **The Figma MCP**, authorized in your tool (see [MCP Setup](./mcp-setup)).
- **A running app and its full URL**, for example `http://localhost:5173/dashboard`. You confirm the exact URL once and it is used unchanged for the whole loop.

### Pages behind a login

The worker never reads `.env` files and never prints the environment. It gets credentials only from variables in the environment of the shell that launched your tool, named `TSH_UI_LOGIN_<FIELD>`. The common ones are:

```bash
export TSH_UI_LOGIN_EMAIL='...'
export TSH_UI_LOGIN_USERNAME='...'
export TSH_UI_LOGIN_PASSWORD='...'   # TSH_UI_LOGIN_PASSWORD
```

Export them **before** you start your tool, in the same shell. A running tool cannot receive new environment variables, and a GUI-launched application (for example Cursor started from the dock) does not see exports from your shell: start it from a shell where the variables are exported, which means restarting it. Whether the variables reach the capture worker in each tool is **not yet verified** for Codex and is listed in [Supported Tools](./supported-tools).

For single sign-on or multi-factor login, use the default instead: log in once in a headed (visible) browser session and the worker reuses the saved session state. If the variables are missing, the worker asks you for the exact names instead of continuing. Use a dedicated test account, never a personal one.

### Verified status per tool

| Tool | Reviewer opens PNG files | Capture worker sees a variable exported in the launching shell |
| --- | --- | --- |
| Claude Code | verified (2.1.308) | verified |
| Cursor | verified (cursor-agent 2026.10.22) | verified in the CLI with `--force`; a GUI-launched Cursor does not inherit shell exports (documented caveat, not measured) |
| Codex | not verified (CLI not installed) | not verified |

Not yet verified in any tool: the reviewer fetching the design through an authenticated Figma MCP, and the hardened `playwright-cli` worker flow (`playwright-cli` was not installed on the build machine). Where an image cannot be opened or the design cannot be fetched, the result is `VERIFICATION NOT RUN` and the loop asks the user.

See [Supported Tools](./supported-tools).
