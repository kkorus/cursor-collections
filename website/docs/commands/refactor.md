---
sidebar_position: 19
title: /tsh-refactor
---

# /tsh-refactor

**Agent:** Software Engineer  
**File:** `.cursor/skills/commands/tsh-refactor/SKILL.md`

Plans and executes structural refactoring without changing external behavior. Keeps tests green after each step.

## Usage

```text
/tsh-refactor <refactoring goal>
```

## What It Does

1. Scopes the refactoring and documents current behavior.
2. Creates `{topic}.refactor-plan.md` in `specifications/refactoring/`.
3. Executes step-by-step via software engineer with tests after each step.
4. Runs post-refactor quality gate via `tsh-code-reviewing`.

## Skills Loaded

- `tsh-codebase-analysing`
- `tsh-technical-context-discovering`
- `tsh-implementation-gap-analysing`
- `tsh-code-reviewing`

:::tip
Use `/tsh-implement` for new features; use `/tsh-debug` for bugs.
:::
