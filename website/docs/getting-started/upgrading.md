---
sidebar_position: 3
title: Upgrading
---

# Upgrading from an Earlier Version

This release renames the product (formerly Cursor Collections) to **TSH AI Collections**, adds Claude Code and Codex, and changes the layout of the files that are installed on your machine. If you installed the earlier version, follow this page once.

## What changed for an existing install

- The old version told you to link or copy skills into `~/.cursor/skills/` (from the `agents/`, `workflows/`, `commands/` and `internal/` category folders). The new layout never installs there. Skills go to `.agents/skills` or `.claude/skills`, and agents to `.cursor/agents`, `.claude/agents` or `.codex/agents`. See [Installation](./installation).
- Many skills, agents and commands were renamed, merged or removed, and there are **no aliases**. The full old to new name table is in the [Changelog](/changelog).
- The old persona skills (`tsh-architect`, `tsh-software-engineer` and so on) are now real subagents. An old skill with the same name would shadow the new subagent, so it must be removed.

## One-command upgrade

1. Update the clone:

   ```bash
   git -C ~/cursor-collections pull
   ```

2. Preview what the installer will do. Nothing is changed:

   ```bash
   node ~/cursor-collections/scripts/install.mjs --tools cursor,claude,codex --dry-run
   ```

   Use the tools you actually use. Add `--scope project --project-dir <dir>` to upgrade a project install.

3. Run it for real:

   ```bash
   node ~/cursor-collections/scripts/install.mjs --tools cursor,claude,codex
   ```

To run only the cleanup and install nothing, use `--migrate-legacy` (combine it with `--dry-run` to preview).

## What the legacy cleanup removes or backs up

The cleanup runs before every install and update. It touches only entries whose names start with `tsh-`; your own skills are never modified.

| Found | Action |
|---|---|
| Any `tsh-*` entry directly under `~/.cursor/skills/` or `<project>/.cursor/skills/` | Symlinks are removed. Real directories are moved to the backup. |
| Copied category folders (`agents/`, `commands/`, `workflows/`, `internal/`) under those two folders that contain `tsh-*` entries | Reported, and the `tsh-*` entries inside are moved to the backup. |
| In the new skill folders (`~/.agents/skills`, `~/.claude/skills` and project equivalents): a dangling symlink, a symlink into the old category layout, or an entry whose name is listed in `scripts/legacy-names.json` | Symlinks are removed. Real directories are moved to the backup. |

**Backup location:** `~/.tsh-ai-collections-backup/<timestamp>/`, with every entry stored under its original absolute path (for example `<timestamp>/Users/you/.cursor/skills/tsh-architect`). Backups of project-scope entries also go to this folder in your home directory. Nothing is hard-deleted. If you edited an old skill, your copy is there. Category folders that are empty after the cleanup are removed; folders that still hold other files stay.

An install with `--scope project` also cleans legacy entries in `~/.cursor/skills`, because the old layout was usually installed there.

The installer prints every action it takes.

### Manual equivalent

If you prefer to clean up by hand:

```bash
# remove the old symlinks
find ~/.cursor/skills -maxdepth 1 -name 'tsh-*' -type l -delete
```

Then move any remaining real `tsh-*` directories under `~/.cursor/skills/` (and the copied `agents/`, `commands/`, `workflows/`, `internal/` folders) somewhere else or delete them, and repeat for `<project>/.cursor/skills/` if you used project installs. Finally run the installer as above.

## If you used the Cursor GitHub import

The earlier docs recommended importing the repository as a **Remote Rule (GitHub)** in Cursor. Whether the import picks up the new `.agents/skills` and `.cursor/agents` folders was **not verified**, so this path is no longer documented.

1. Open **Cursor Settings → Rules** and remove the old Remote Rule for the repository.
2. Clone the repository and install with the installer, as described in [Installation](./installation).

## Future updates

After the first install, updating is two commands:

```bash
git -C ~/cursor-collections pull
node ~/cursor-collections/scripts/install.mjs --update
```

`--update` reinstalls the tools recorded in the manifests and prunes `tsh-*` entries that the installer put there earlier but that no longer exist in the source. Installed copies you did not edit (their checksum in the manifest still matches) are replaced or removed without a backup. Copies you edited, and copies from an older installer without a recorded checksum, go to the backup folder first.

## After upgrading

- Command names changed. The most common ones are below; the full table is in the [Changelog](/changelog).

<!-- migration-table -->
| Old command | New command |
|---|---|
| `/tsh-review-codebase` | `/tsh-audit-codebase` |
| `/tsh-analyze-aws-costs`, `/tsh-analyze-gcp-costs` | `/tsh-analyze-cloud-costs` (takes `aws` or `gcp` as the first argument) |

- The MCP file fixed a wrong key for Cursor (`servers` is now `mcpServers`). Re-merge the generated MCP file, see [MCP Setup](./mcp-setup).
- Restart your tool so it rediscovers skills and agents.
