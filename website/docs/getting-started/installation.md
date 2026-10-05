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
| `--update` | Reinstall the tools recorded in the manifests and prune `tsh-*` entries that no longer exist in the source. Copies you did not edit are replaced or removed without a backup; edited copies are backed up first, never deleted. |
| `--migrate-legacy` | Run only the legacy cleanup (old `.cursor/skills` layout), then exit. |
| `--list` | List the recorded installs with path, scope, tools, mode, installed commit and status (`up to date`, `N commits behind`, `ahead or diverged`, `unknown` or `missing`). Takes only `--source`; writes nothing. |
| `--update-all` | Preview an `--update` of every recorded install and what it would change; writes nothing. Takes only `--yes`, `--dry-run`, `--verbose` and `--source`. See [Update everything](#update-everything). |
| `--yes` | With `--update-all`: apply the updates. Valid only with `--update-all`. |
| `--forget-missing` | Remove the registry entries of installs that are `missing`. Never touches a project; with `--dry-run` it only prints them. |
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

In copy mode the manifest records a SHA-256 checksum of every installed entry. On update, an entry whose checksum still matches was not edited, so it is replaced (or, if it is gone from the source, removed) without a backup. An entry you edited is moved to `~/.tsh-ai-collections-backup/<timestamp>/` first. Entries installed by an older installer have no checksum and are backed up to be safe, once; the update records their checksums.

### Where tsh is installed

Every install and update that really runs (not `--dry-run`) is recorded in `~/.tsh-ai-collections/installs.json` (under `$TSH_HOME` if set). The file lists the paths of your projects, so it is readable only by you, and it never leaves your machine. It is only an index: the manifests in the installed folders stay the source of truth. You may delete it at any time; the next install or `--update` rebuilds the entry for that install. To record an install made by an older installer, run `--update` in it once.

```bash
node ~/cursor-collections/scripts/install.mjs --list
```

`--list` prints one line per install with its status: `up to date`, `N commits behind` (compared with `HEAD` of the clone, or of `--source`), `ahead or diverged` (the installed commit is in the clone but not in the history of its `HEAD`, for example installed from another branch), `unknown` (the installed commit is not recorded or not in the clone) or `missing` (the folder or its manifests are gone). It ends with the `--update` command for the first install that needs a refresh (`N commits behind`, then `unknown`, then `ahead or diverged`).

### Update everything

```bash
git -C ~/cursor-collections pull
node ~/cursor-collections/scripts/install.mjs --update-all
node ~/cursor-collections/scripts/install.mjs --update-all --yes
```

`--update-all` reads the registry and shows, for every recorded install, its status and what an `--update` would change: copies replaced because you did not edit them, edited copies that would be backed up first, pruned entries, new entries and legacy entries cleaned up. It writes nothing. Add `--yes` to apply: each install is updated one after another with its recorded scope, tools and mode (a link install stays a link install), exactly like a single `--update`. Unmodified copies are replaced without a backup; edited ones go to `~/.tsh-ai-collections-backup/<timestamp>/` first. A failing install is reported and does not stop the others; the exit code is then 1. Installs marked `ahead or diverged` are updated only when their files differ from the clone.

Installs marked `missing` are skipped; remove them from the registry with `--forget-missing`. Installs without changes are left alone. `--force` is never used in bulk: an unmanaged `tsh-*` entry is skipped. The preview marks such an install with `will skip N unmanaged entries (exit 1)` and ends with the command to resolve it; with `--yes` the install is updated apart from those entries and reported as `updated with skipped entries`, counted separately from failed installs, and the exit code is 1 (as for a single `--update` that skips an entry). Resolve it with a single `--update --force` in that install, which moves the entry to the backup first. Warnings of the individual updates are listed under the install's path after the table; an install whose registry entry could not be refreshed reads `updated (registry not refreshed)`. Add `--verbose` to see the full output of each update.

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
