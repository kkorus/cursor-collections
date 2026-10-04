---
sidebar_position: 2
title: Installation
---

# Installation

TSH AI Collections is installed with a small Node script that copies the generated skills and agents into the folders your tools read. It works for **Cursor**, **Claude Code** and **Codex**, in your user profile (all projects) or in a single project.

:::info Upgrading from an earlier version?
The installer cleans up the old `~/.cursor/skills/` layout for you. Read [Upgrading](./upgrading) first and run a dry run.
:::

## 1. Clone the repository

```bash
git clone https://github.com/kkorus/cursor-collections ~/cursor-collections
```

## 2. Run the installer

Choose the tools with `--tools` (a comma list of `cursor`, `claude`, `codex`) and the place with `--scope`.

```bash
# Preview every action, change nothing
node ~/cursor-collections/scripts/install.mjs --tools cursor,claude,codex --dry-run

# User scope (default): installs into your home directory, available in every project
node ~/cursor-collections/scripts/install.mjs --tools cursor,claude,codex

# Project scope: installs into one project
node ~/cursor-collections/scripts/install.mjs --tools claude --scope project --project-dir ~/code/my-app
```

### What gets installed where

The installer writes only `tsh-*` entries and a manifest file (`.tsh-install-manifest.json`) in each target root. Your other skills and agents are never touched.

| Tools selected | Skills installed into | Agents installed into |
|---|---|---|
| `cursor` | `.agents/skills` | `.cursor/agents` |
| `claude` | `.claude/skills` | `.claude/agents` |
| `codex` | `.agents/skills` | `.codex/agents` (TOML) |
| `cursor,claude` | `.claude/skills` only | `.cursor/agents`, `.claude/agents` |
| `cursor,codex` | `.agents/skills` only | `.cursor/agents`, `.codex/agents` |
| `claude,codex` | `.claude/skills` and `.agents/skills` | `.claude/agents`, `.codex/agents` |
| `cursor,claude,codex` | `.claude/skills` and `.agents/skills` | all three agent folders |

With user scope these folders are under your home directory (`~/.agents/skills`, `~/.claude/skills`, and so on; `$TSH_HOME` overrides the home directory). With project scope they are under the project root.

Cursor also reads `.claude/skills`, which is why `cursor,claude` needs only one skills folder.

### Installer flags

These are the flags printed by `node scripts/install.mjs --help`.

| Flag | Meaning |
|---|---|
| `--tools <list>` | Comma list of `cursor`, `claude`, `codex`. Required for an install. |
| `--scope user\|project` | Where to install. Default `user` (home directory). |
| `--project-dir <dir>` | Project root for `--scope project`. Default: the current directory. |
| `--source <dir>` | Repository root that holds the generated trees and `scripts/legacy-names.json`. Default: the clone the script lives in. The install target must not be inside it. |
| `--mode copy\|link` | `copy` (default), or symlink to the clone so `git pull` updates it. On Windows symlinks need Developer Mode or admin rights, so prefer `copy`. |
| `--update` | Reinstall the tools recorded in the manifests and prune `tsh-*` entries that no longer exist in the source. Pruned entries are backed up, not deleted. |
| `--migrate-legacy` | Run only the legacy cleanup (old `.cursor/skills` layout), then exit. |
| `--dry-run` | Print what would happen and change nothing. The output is grouped by folder; add `--verbose` for one line per entry. |
| `--verbose`, `-v` | One line per entry instead of grouped summaries. |
| `--force` | Replace an unmanaged `tsh-*` entry. It is moved to the backup first. |
| `--help` | Show the help text. |

Legacy cleanup runs before every install and update. Symlinks are removed; real directories are moved to `~/.tsh-ai-collections-backup/<timestamp>/` and never hard-deleted.

:::note Link mode
`--mode link` is implemented, but how Cursor treats symlinked skill folders was only partly checked (a symlinked skill loaded on macOS). If you use Cursor on Windows, use the default `copy` mode.
:::

## 3. Configure MCP servers

The installer **never writes MCP configuration**. At the end it prints which generated file to merge into each tool's config. Follow [MCP Setup](./mcp-setup).

## 4. Updating

```bash
git -C ~/cursor-collections pull
node ~/cursor-collections/scripts/install.mjs --update
```

`--update` reads the manifests, so you do not need to repeat `--tools`. Add `--scope project --project-dir <dir>` to update a project install.

## Cursor shows skills twice

If you install for all three tools, Cursor can read the same skills from `.agents/skills` and `.claude/skills`. In a check with identical copies, Cursor listed one skill once (it deduplicated by name). If you still see duplicates, turn off **Settings → "Include Third-Party Plugins, Skills, and Other Configs"**. Cursor then reads only `.agents/skills` and `.cursor/agents`. The effect of that setting was not yet verified in the spikes.

## Using it

1. Open your project in Cursor, Claude Code or Codex.
2. Type `/` (Cursor, Claude Code) to see the installed `tsh-*` entries. In Codex, type `$` or run `/skills` (not yet verified).
3. Start with `/tsh-implement` to implement a task, or `/tsh-review` to review changes.

How each command, orchestrator and agent is invoked in each tool is described in [Supported Tools](./supported-tools).

:::info
In Cursor, skills work in **Agent mode**, not Ask mode.
:::
