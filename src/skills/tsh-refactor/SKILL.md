---
name: tsh-refactor
description: Plan and execute a structural refactoring without changing external behavior. Use when the user types /tsh-refactor, wants to reorganize code, extract shared logic, rename modules, reduce complexity, or clean up technical debt, when there are no new functional requirements, only structural improvements.
type: command
routes-to: tsh-engineering-manager
metadata:
  short-description: Plan and run a behavior-preserving refactoring
---

# /tsh-refactor

Plan and execute a structural change that improves the codebase without altering external behavior. Refactoring changes structure, not behavior: new functionality belongs to `/tsh-implement`, bug fixes to `/tsh-debug`.

## Workflow

1. Load the `tsh-engineering-manager` skill and run it in **refactor mode**.
2. Pass it the scope the user gave. If the scope is unclear, ask the user what is in scope, which structural problem is solved and what is out of scope.
3. Refactor mode produces a standard plan, `specifications/<topic>/<topic>.plan.md`, with `Behavior-preserving: yes` in its Task Details. The plan starts with characterization tests where coverage is insufficient (see the `tsh-refactoring` skill), then atomic steps that each keep the tests green, then a code review.
4. The manager delegates planning, implementation and review to the subagents, and follows the `tsh-refactoring` skill for the verification of the outcome.

## Constraints

- Never change behavior and structure in the same step.
- Never continue to the next step while the test suite fails.

## Suggested next steps

Show the user, where they apply: run `/tsh-debug` if the refactoring uncovered a bug, `/tsh-implement` for missing functionality, `/tsh-ask` to record an architectural question as a decision.
