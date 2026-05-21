---
name: tsh-refactor
description: "Plan and execute a structural refactoring without changing external behavior. Use when the user types /tsh-refactor, wants to reorganize code, extract shared logic, rename modules, reduce complexity, or clean up technical debt — when there are no new functional requirements, only structural improvements."
disable-model-invocation: true
---

# /tsh-refactor

Plan and execute a structural code change that improves the codebase without altering external behavior. Delegates implementation to `tsh-software-engineer`. Every step must keep tests green.

## Required Skills

- `tsh-codebase-analysing` — to understand the current structure, identify coupling, and scope the refactoring
- `tsh-technical-context-discovering` — to establish project conventions that the refactored code must follow
- `tsh-implementation-gap-analysing` — to verify what exists, what must change, and what must stay the same
- `tsh-code-reviewing` — for the post-refactor quality gate (step 5): verify no regressions, code quality standards met, no new smells introduced

## Key Distinction

Refactoring changes **structure**, not **behavior**. If a task adds new functionality, use `/tsh-implement` instead. If a task fixes a bug, use `/tsh-debug` instead.

## Workflow

1. **Scope the refactoring** — Define exactly what will and will not change:
   - Which files, modules, or layers are in scope?
   - What structural problem are we solving? (high complexity, duplication, unclear boundaries, inconsistent patterns)
   - What is explicitly out of scope?

2. **Characterize current behavior** — Before touching any code, document what the system currently does:
   - Run the existing test suite and confirm it passes
   - Identify the public interfaces, exported functions, and API contracts that must remain unchanged
   - Note any implicit contracts (shared state, event order, timing dependencies)

   If test coverage for the area being refactored is insufficient, add characterization tests first (tests that describe current behavior without asserting it is correct). Do this before the refactoring.

3. **Create the refactoring plan** — Save `{topic}.refactor-plan.md` in `specifications/refactoring/`. The plan must:
   - Break the refactoring into small, atomic, independently-verifiable steps
   - Each step must keep the test suite green when applied alone
   - Include the sequence order and any dependencies between steps
   - Define a "definition of done" for each step: what changes, what stays the same

4. **Execute step by step** — Delegate each step to `tsh-software-engineer`. After each step:
   - Run the full test suite — must pass before proceeding
   - If a step breaks tests, fix it before moving to the next step
   - Do not batch multiple risky steps together

5. **Verify the outcome** — After all steps are complete:
   - Full test suite passes (unit, integration, E2E)
   - Build succeeds
   - No new linter warnings introduced
   - Public interfaces are unchanged (diff the exported API if applicable)
   - Performance-sensitive paths are not regressed (run benchmarks if applicable)

6. **Clean up** — Remove any characterization tests added in step 2 that only described old structure and are no longer meaningful. Keep tests that assert correct behavior.

## Constraints

- Do NOT change behavior and structure in the same commit — separate concerns.
- Do NOT proceed to the next step if the current step breaks tests.
- Do NOT refactor code that has no test coverage without adding characterization tests first.
- If the refactoring reveals a bug, document it and handle it separately via `/tsh-debug`.
- If the refactoring reveals missing functionality, document it and handle it separately via `/tsh-implement`.
- Large refactorings spanning many files should be done in a separate git branch.

## Connected Skills

- `tsh-codebase-analysing` — loaded to understand current structure and scope
- `tsh-technical-context-discovering` — loaded to establish conventions the refactored code must follow
- `tsh-implementation-gap-analysing` — loaded to identify what changes vs. what stays the same
- `tsh-code-reviewing` — loaded for the post-refactor quality gate
- `tsh-debug` — when the refactoring uncovers a bug; handle it separately before continuing
- `tsh-ask` — when the refactoring raises an architectural question worth recording as a decision
