---
sidebar_position: 9
title: /tsh-audit-codebase
---

# /tsh-audit-codebase

**Source:** `src/skills/tsh-audit-codebase/SKILL.md`  
**Routes to:** [Architect](../agents/architect) subagent (`tsh-architect`), delegated from the main thread (one per layer, in parallel)

A code quality audit covering dead code, duplications and improvement opportunities. The command runs in the main thread and fans out Architect subagents, one per layer or app.

## Usage

```text
/tsh-audit-codebase
```

## What it does

1. Loads the `tsh-discovering-technical-context` skill and identifies the repository type. For a monorepo, it lists every app, package and shared library, and analyzes each separately.
2. Delegates one Architect subagent per layer or app, in parallel. Each uses the `tsh-analyzing-codebase` and `tsh-reviewing-code` skills and writes `specifications/code-quality/<layer>.findings.md`.
3. Delegates one more Architect for the architecture review, with the findings files as input.
4. Compiles the findings, prioritizes them by severity and writes `specifications/code-quality/code-quality-report.md`, keeping the layers separate.

## Suggested next steps

`/tsh-implement` to fix the critical findings, `/tsh-refactor` for the duplications.
