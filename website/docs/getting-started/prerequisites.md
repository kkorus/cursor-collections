---
sidebar_position: 1
title: Prerequisites
---

# Prerequisites

Before using Cursor Collections, make sure you meet the following requirements.

## Cursor AI IDE

**This configuration requires Cursor IDE** (version 0.40 or later recommended).

Download the latest version from [cursor.com](https://cursor.com).

Cursor provides access to:

- Agent Skills (`.cursor/skills/`)
- Cursor Rules (`.cursor/rules/`)
- MCP server integrations
- Agent mode with subagent orchestration

## Cursor Subscription

A **Cursor Pro subscription** (or higher) is recommended to use all features:

- Agent mode with unlimited requests
- MCP server integrations
- Subagent orchestration in complex workflows

The free Cursor plan may have rate limits that affect complex multi-step workflows like `/tsh-implement`.

## Required CLI Tools

Some MCP servers require Node.js and Python:

- **Node.js 18+** — required for Playwright, Context7, Sequential Thinking MCPs
- **Python 3.10+** with `uvx` — required for AWS API MCPs

Check your versions:

```bash
node --version    # 18+
python --version  # 3.10+
uvx --version     # install via: pip install uv
```
