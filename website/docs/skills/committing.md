---
sidebar_position: 20
title: Committing
---

# Committing

**Folder:** `.cursor/skills/workflows/tsh-committing/`  
**Used by:** `/tsh-commit` command

Procedural rules for drafting [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) messages: type/scope inference, format rules, secret-file checks, and split recommendations. The workflow skill does not run `git commit` — the `/tsh-commit` command handles inspection, user approval, and execution.

## Key Guidelines

- Subject line: imperative mood, lowercase after the colon, no trailing period, max ~72 characters.
- Body: explain **why**, not **what** (the diff shows what changed).
- Never commit files that likely contain secrets (`.env`, credentials, keys).
- Recommend splitting unrelated changes into separate commits.

## Connected Skills

- [`/tsh-commit`](../prompts/public/commit) — User-facing slash command that loads this workflow.
