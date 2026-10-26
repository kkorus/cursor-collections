---
sidebar_position: 9
title: tsh-write-documentation
---

# tsh-write-documentation

**Source:** `src/skills/tsh-write-documentation/SKILL.md`  
**Kind:** internal step. Loaded (preloaded) by the Technical Writer when the Engineering Manager delegates a documentation task.

The working procedure of the [Technical Writer](../../agents/technical-writer): it turns a bounded documentation task into accurate changes to README files, CHANGELOG entries, in-repo `/docs` and documentation-site pages.

## What it does

Not invoked directly by you. To get documentation written, use [`/tsh-implement`](../implement); the [Engineering Manager](../../agents/engineering-manager) delegates documentation work to the Technical Writer, which follows this step.

1. Reads the inputs of the task (the documentation files in scope, and the plan when there is one) and confirms the change is documentation-only.
2. Gathers the source facts from the code and existing pages, so every claim is verified before it is written.
3. Matches the sibling pages and writes only the files named in the task.
4. Runs the documentation build and link validation, and fixes broken internal links instead of inventing targets.
5. Escalates with `NEEDS_INPUT` when it needs input only you have, or `BLOCKED` when the documentation depends on a code change.
6. Keeps the plan in sync: checks the boxes of the delegated scope.
7. Returns the changed files (one line each), the build or link-check result and any open dependency.

## Skills loaded

- `tsh-writing-documentation` - documentation conventions and the write-versus-review boundary
