---
name: tsh-refactoring
description: Behavior-preserving refactoring guidance - scoping, characterization tests, small verifiable steps and outcome verification. Use when restructuring code without changing external behavior, extracting shared logic, reducing complexity, or cleaning up technical debt.
type: skill
metadata:
  short-description: Refactor safely with characterization tests and small steps
---

# Refactoring

Refactoring changes **structure**, not **behavior**. If a task adds functionality, it is a feature. If it fixes a bug, it is debugging (load the `tsh-debugging` skill). Keep the two separate, also in commits.

## Scope the refactoring

Define exactly what will and will not change:

- Which files, modules or layers are in scope?
- Which structural problem is solved (high complexity, duplication, unclear boundaries, inconsistent patterns)?
- What is explicitly out of scope?

## Characterize current behavior

Before touching code, document what the system does today:

- Run the existing test suite and confirm it passes.
- Identify the public interfaces, exported functions and API contracts that must remain unchanged.
- Note implicit contracts: shared state, event order, timing dependencies.

### Characterization tests

If the coverage of the area is insufficient, add characterization tests **first**, before any structural change. A characterization test records what the code does now, without asserting that this behavior is correct.

1. Call the code with representative inputs, including edge cases and error paths.
2. Record the actual outputs and side effects as the expected values.
3. Run the tests and confirm they pass on the unchanged code.
4. Commit them separately from the refactoring.

Never refactor code that has no test coverage without adding characterization tests first. If one of them exposes a bug, document it and handle it separately; do not fix it inside the refactoring.

## Steps

Break the refactoring into small, atomic, independently verifiable steps:

- Each step keeps the test suite green when applied alone.
- State the sequence and the dependencies between steps.
- Give each step a definition of done: what changes and what stays the same.
- Run the full test suite after each step and do not proceed while it fails. Do not batch risky steps.
- Do not change behavior and structure in the same commit.
- Do large refactorings spanning many files in a separate branch.

## Verify the outcome

- The full test suite passes (unit, integration, E2E).
- The build succeeds and no new linter warnings appear.
- Public interfaces are unchanged (diff the exported API where applicable).
- Performance-sensitive paths are not regressed (run benchmarks where applicable).
- Remove characterization tests that only described the old structure and are no longer meaningful. Keep tests that assert correct behavior.

## Connected Skills

- `tsh-analyzing-codebase` - to understand the current structure and scope the refactoring
- `tsh-discovering-technical-context` - for the conventions the refactored code must follow
- `tsh-analyzing-implementation-gaps` - to identify what changes and what stays the same
- `tsh-reviewing-code` - the post-refactoring quality gate
- `tsh-debugging` - when the refactoring uncovers a bug
