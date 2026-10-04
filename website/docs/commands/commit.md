---
sidebar_position: 20
title: /tsh-commit
---

# /tsh-commit

**Source:** `src/skills/tsh-commit/SKILL.md`  
**Routes to:** none. The command is standalone and runs in the main thread.

Drafts a [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) message from the current git changes and commits only after you approve it.

## Usage

```text
/tsh-commit [type(scope): subject]
```

## What it does

1. Inspects the repository state: `git status`, `git diff`, `git diff --staged` and the last 10 commits. Stops when there is nothing to commit.
2. Loads the `tsh-committing` skill and drafts the message. It checks for secret and sensitive files before proposing anything. If the changes belong to unrelated domains, it offers a single commit (Option A) or a split into several commits (Option B).
3. Shows the proposed message and the exact paths to stage, and waits for `approve`, `edit: <your message>` or `cancel`.
4. After approval it stages only the approved paths, commits and reports the result and the new commit SHA.

## Constraints

- No `git add` or `git commit` before you approve.
- It never pushes, never uses `--no-verify`, and never amends unless you ask for it.
- Hints after the command (a type, a scope, `Refs: PROJ-123`) influence the draft but do not skip the approval.
