---
sidebar_position: 11
title: tsh-architect-reviewer (plan review)
---

# Plan review (Architect Reviewer)

:::info
Not invoked directly by users. To trigger plan validation, use [`/tsh-implement`](../public/implement) — the [Engineering Manager](../../agents/engineering-manager) delegates to the [Architect Reviewer](../../agents/architect-reviewer) after the Architect produces or updates a plan.
:::

**Agent:** Architect Reviewer  
**File:** `.cursor/skills/agents/tsh-architect-reviewer/SKILL.md`

Reviews the architect's implementation plan for correctness, feasibility, and simplicity before proceeding to implementation.

## How It's Triggered

```text
/tsh-implement <JIRA_ID or task description>
```

After the Architect produces or updates a `.plan.md`, the Engineering Manager automatically invokes the Architect Reviewer to validate it.

## What It Does

1. **Reads the research file** — Establishes the full set of requirements, acceptance criteria, and constraints the plan must satisfy.
2. **Reads the plan file** — Understands the proposed architecture, phases, tasks, and definitions of done.
3. **Requirements coverage pass** — Verifies every research requirement has a corresponding plan task.
4. **Over-engineering pass** — Evaluates the plan for unnecessary abstractions, speculative features, and premature generalization.
5. **Codebase alignment pass** — Searches and reads every file, component, and pattern the plan references to verify it exists and behaves as assumed.
6. **Feasibility pass** — Checks that the proposed sequence is technically realistic and dependencies are ordered sensibly.
7. **Pattern consistency pass** — Verifies the plan follows project conventions from `*.mdc rules`.
8. **Quality pass** — Verifies security, test plan coverage, and definition-of-done verifiability.
9. **Produces review report** — Saves the structured report as `{task-name}.plan-review.md` with verdict `APPROVED` or `REVISIONS NEEDED`.

## Skills Loaded

- `tsh-architecture-designing` — Evaluate architectural shape, phase coherence, and trade-offs against the requirements.
- `tsh-codebase-analysing` — Verify plan references against actual codebase state.
- `tsh-technical-context-discovering` — Check pattern consistency against established conventions.
- `tsh-implementation-gap-analysing` — Validate what exists vs. what the plan proposes to build.
- `tsh-sql-and-database-understanding` — When the plan includes database schema, migration, indexing, or query changes.

## Output

A `.plan-review.md` file placed alongside the plan in `specifications/<task-name>/`:

```text
specifications/
  user-authentication/
    user-authentication.research.md
    user-authentication.plan.md
    user-authentication.plan-review.md    ← new
```

The report includes verdict, BLOCKER/WARNING/SUGGESTION findings, requirement coverage, codebase verification notes, simplicity assessment, and pattern consistency notes.

:::tip
If the verdict is `REVISIONS NEEDED`, the Engineering Manager will send the report back to the Architect and request a revised plan. This loop repeats up to 3 times before escalating to the user.
:::
