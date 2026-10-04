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
