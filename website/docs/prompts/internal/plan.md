---
sidebar_position: 10
title: /tsh-plan
---

# /tsh-plan

:::info
Not invoked directly by users. To trigger implementation planning, use [`/tsh-implement`](../public/implement) — the [Engineering Manager](../../agents/engineering-manager) will automatically delegate to the [Architect](../../agents/architect) when a plan is needed.
:::

**Agent:** Architect  
**File:** `.cursor/skills/internal/tsh-plan/SKILL.md`

Creates a detailed, phased implementation plan from the research context.

## How It's Triggered

```text
/tsh-implement <JIRA_ID or task description>
```

The Engineering Manager identifies that no implementation plan exists and delegates planning to the Architect automatically.

## What It Does

1. **Analyzes context** — Reviews the `.research.md` file and cross-checks with best practices.
2. **Analyzes tech stack** — Identifies domain-specific best practices.
3. **Verifies current implementation** — Searches the codebase for existing components, functions, and utilities related to the feature.
4. **Understands project standards** — Reviews `*.mdc rules` files.
5. **Prepares implementation plan** — Uses `tsh-creating-implementation-plans` to structure the plan with phases, tasks, and the owned `plan.example.md` template.
6. **Defines tasks** — Each task has a clear title, description, action type (`[CREATE]`/`[MODIFY]`/`[REUSE]`), and definition of done checklist.
7. **Addresses security** — Includes security considerations.
8. **Defines testing** — Guidelines for validation.
9. **Controls scope** — Only plans changes for THIS task; documents improvements separately.
10. **Supports validation** — The Architect invokes the Plan Reviewer as a nested subagent before handing the finished plan back for implementation.

## Skills Loaded

- `tsh-architecture-designing` — Architecture design process.
- `tsh-creating-implementation-plans` — Plan template, structure, and definition-of-done rules.
- `tsh-codebase-analysing` — Analyze existing codebase.
- `tsh-implementation-gap-analysing` — Verify what exists vs what needs to be built.
- `tsh-technical-context-discovering` — Understand project conventions and patterns.
- `tsh-sql-and-database-understanding` — When the feature involves database changes.

## Output

A `.plan.md` file placed in `specifications/<task-name-or-id>/`:

```text
specifications/
  user-authentication/
    user-authentication.research.md
    user-authentication.plan.md        ← new (Architect)
    user-authentication.plan-review.md ← new (Plan Reviewer, after validation)
```

The plan includes checklist-style phases, tasks with `[CREATE]`/`[MODIFY]`/`[REUSE]` action types, acceptance criteria, security considerations, and testing guidelines.

After the plan is produced, the Architect invokes the [Plan Reviewer](../../agents/plan-reviewer) to validate it, once per plan lifecycle. The review report is saved alongside the plan as `{task-name}.plan-review.md`.

:::tip
Review both the plan and the review report. Confirm scope, phases, and acceptance criteria before starting implementation.
:::
