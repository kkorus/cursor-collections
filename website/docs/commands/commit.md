---
sidebar_position: 20
title: /tsh-commit
---

# /tsh-commit

**Agent:** (self-contained)  
**File:** `.cursor/skills/commands/tsh-commit/SKILL.md`

Drafts a [Conventional Commits](https://www.conventionalcommits.org/) message from git changes and commits **only after explicit user approval**.

## Usage

```text
/tsh-commit
/tsh-commit docs: README cleanup
```

## What It Does

1. Inspects `git status`, diffs, and recent log.
2. Drafts message via `tsh-committing` (type, scope, body, footers).
3. Presents proposal with exact paths to stage — waits for approval.
4. Runs `git commit` only after user confirms.

## Skills Loaded

- `tsh-committing`

:::warning
Never commits without explicit approval. Never stages secret or credential files.
:::
