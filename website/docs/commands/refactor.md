---
sidebar_position: 19
title: /tsh-refactor
---

# /tsh-refactor

**Source:** `src/skills/tsh-refactor/SKILL.md`  
**Routes to:** [Engineering Manager](../agents/engineering-manager) orchestrator skill (`tsh-engineering-manager`) in refactor mode

Plans and executes a structural change that improves the codebase without changing external behavior. New functionality belongs to [`/tsh-implement`](./implement), bug fixes to [`/tsh-debug`](./debug).

## Usage

```text
/tsh-refactor <scope or description>
```

## What it does

1. Loads the Engineering Manager in **refactor mode** and passes it your scope. If the scope is unclear, it asks what is in scope, which structural problem is solved and what is out of scope.
2. Produces a standard plan, `specifications/<topic>/<topic>.plan.md`, with `Behavior-preserving: yes` in its Task Details. The plan starts with characterization tests where coverage is insufficient (see the `tsh-refactoring` skill), then atomic steps that each keep the tests green, then a code review.
3. The manager delegates planning, implementation and review to the subagents.

## Constraints

- Behavior and structure never change in the same step.
- No step starts while the test suite fails.

## Suggested next steps

`/tsh-debug` if the refactoring uncovered a bug, `/tsh-implement` for missing functionality, `/tsh-ask` to record an architectural question as a decision.
