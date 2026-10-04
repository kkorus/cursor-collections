---
sidebar_position: 6
title: tsh-implement-task
---

# tsh-implement-task

**Source:** `src/skills/tsh-implement-task/SKILL.md`  
**Kind:** internal step. Loaded by the Software Engineer (preloaded) when the Engineering Manager delegates a task.

Implements a feature from a plan and feature context, or from a plain task description when no plan exists, including UI tasks based on Figma designs.

## What it does

Not invoked directly by you. To implement a task, use [`/tsh-implement`](../implement): the [Engineering Manager](../../agents/engineering-manager) delegates the task to the [Software Engineer](../../agents/software-engineer), which follows this step.

1. Reviews the implementation plan and feature context, and reads the plan's **Technical Context** section as the primary source of project conventions.
2. Finds the commands for tests, linting and build, and runs tests and linters before starting and after each phase.
3. Implements only what the plan contains, step by step, and checks the plan's boxes after each task step. It asks (in delegated mode: returns `NEEDS_INPUT`) before deviating from the plan, and records changes in the plan's Changelog.
4. Before handing over, makes sure every task in its scope is complete and updates the acceptance criteria checklist.

**No plan (Quick flow):** restates the goal and acceptance criteria, discovers the technical context itself, follows existing patterns, keeps the change small, adds tests and reports what changed.

**UI tasks (Figma):** also loads `tsh-implementing-frontend` and `tsh-ensuring-accessibility`. Finds the Figma URLs in the research and plan files. If a component has no Figma link, it stops and asks for one. It does not verify the UI itself; verification belongs to the [UI Reviewer](../../agents/ui-reviewer) through [`tsh-orchestrate-ui-verification`](./orchestrate-ui-verification).

## Skills loaded

- `tsh-discovering-technical-context` - project conventions, coding standards and patterns
- `tsh-analyzing-implementation-gaps` - verify the current state before changing it
- `tsh-designing-databases` - when implementing schemas, migrations, queries or ORM access
- `tsh-implementing-backend` - when implementing backend API features
