---
sidebar_position: 2
title: Installation
---

# Installation

Follow these steps to install Cursor Collections and make it available across all your projects.

## Option 1 — GitHub Import (recommended)

The fastest way to get started — no cloning required.

1. Open **Cursor Settings** (`Cmd/Ctrl + Shift + J`)
2. Navigate to **Rules**
3. In the **Project Rules** section, click **Add Rule → Remote Rule (GitHub)**
4. Enter: `https://github.com/kkorus/cursor-collections`

Skills are imported globally and available in every workspace immediately.

:::tip
Cursor's GitHub import keeps skills in sync with the repository. You can re-import to pick up updates.
:::

---

## Option 2 — Clone + Symlink (recommended for teams who want full control)

This approach lets you pin a specific version, review changes before updating, and contribute back.

### 1. Clone the repository

```bash
git clone https://github.com/kkorus/cursor-collections ~/cursor-collections
```

### 2. Link skills globally

```bash
mkdir -p ~/.cursor/skills

# Agent skills
for d in ~/cursor-collections/.cursor/skills/agents/*/; do
  ln -sf "$d" ~/.cursor/skills/
done

# Workflow skills
for d in ~/cursor-collections/.cursor/skills/workflows/*/; do
  ln -sf "$d" ~/.cursor/skills/
done

# Slash command skills
for d in ~/cursor-collections/.cursor/skills/commands/*/; do
  ln -sf "$d" ~/.cursor/skills/
done

# Internal skills (delegate-only orchestration steps)
for d in ~/cursor-collections/.cursor/skills/internal/*/; do
  ln -sf "$d" ~/.cursor/skills/
done
```

Skills at `~/.cursor/skills/` are available globally in every Cursor workspace.

To update later:

```bash
git -C ~/cursor-collections pull
```

---

## MCP Server Configuration

MCP servers unlock Jira, Figma, code search, and browser automation.

### User Profile (recommended — global across all projects)

1. Open **Cursor Settings → MCP**
2. Click **Add MCP Server**
3. Copy the contents of [`.cursor/mcp.json`](https://github.com/kkorus/cursor-collections/blob/main/.cursor/mcp.json) into your user MCP configuration

### Workspace (project-specific)

Copy `.cursor/mcp.json` to your project's `.cursor/mcp.json`.

---

## Using in Your Projects

Once installed:

1. Open your project in **Cursor**
2. Open **Agent chat** (`Cmd/Ctrl + Shift + I`, switch to Agent mode)
3. Type `/` to see available slash commands
4. Start with `/tsh-implement` to implement a task, or `/tsh-review` to review changes

All skills leverage context from your project while respecting your own code patterns.

:::info
Skills work in **Agent mode** only, not Ask mode. Make sure Agent mode is selected in the chat panel.
:::
