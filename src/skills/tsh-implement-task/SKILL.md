---
name: tsh-implement-task
description: Internal step of /tsh-implement. Load only when a tsh command or orchestrator instructs it. Implements a feature from a plan and feature context, or from a plain task description when no plan exists, including UI tasks based on Figma designs.
type: internal
metadata:
  short-description: Implement a feature from a plan or a task description
---
# tsh-implement-task

Your goal is to implement the feature according to the provided implementation plan and feature context. Review both thoroughly before you start, so you understand the requirements and the technical design. Use the available tools to gather what is missing and document your findings.

Don't deviate from the plan. Follow it step by step. If you have to change the original solution, get a confirmation first (in delegated mode: return `NEEDS_INPUT` with the proposed change) and record the change in the plan's Changelog section.

## Required Skills

Before starting, load and follow these skills:

- `tsh-discovering-technical-context` - to establish project conventions, coding standards and existing patterns
- `tsh-analyzing-implementation-gaps` - to verify the current state before making changes
- `tsh-designing-databases` - when implementing database schemas, migrations, SQL queries, ORM-based data access, or transactions and locking
- `tsh-implementing-backend` - when implementing backend API features: REST/GraphQL endpoints, DataGrid filtering and pagination, database handling, JWT authentication, external service adapters, logging and Docker setup

For UI tasks, also load the skills listed under "UI tasks (Figma)".

## Workflow

1. Review the implementation plan and feature context thoroughly.
2. Read the **Technical Context** section of the plan file. It holds the project conventions, coding standards, architecture patterns, tech stack, testing patterns and the relevant project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`) found during planning. Treat it as the primary source of truth and do not re-scan what it already covers. Discover only what it does not cover.
3. Gather the commands you need: tests (unit, integration, E2E), linters, build, migrations. They may already be in the Technical Context. Run tests and linters before you start and after each phase.
4. Implement only what the plan contains. Do not implement items from the plan's improvements section unless explicitly told to.
5. Work through the tasks step by step. After each task step, check its box in the plan.
6. Before handing over, make sure every task in your scope is complete and the feature meets the defined requirements. Update the acceptance criteria checklist after each verified item.

Write clean, efficient and maintainable code that follows the project's standards.

## No plan provided

When the task comes without a plan file (the Quick flow), work from the task description:

1. Restate the goal and the acceptance criteria in your own words. If they are unclear, ask (in delegated mode: return `NEEDS_INPUT` with the questions).
2. Discover the technical context yourself with the `tsh-discovering-technical-context` skill. Find the commands for tests, linting and build.
3. Find the existing code and patterns the change touches, and follow them.
4. Keep the change small and limited to the task. Add or update tests for the changed behavior.
5. Run the tests, linter and build. Report what changed and the result of each check.

There is no plan to tick off and no Changelog to update in this case.

## UI tasks (Figma)

Apply this section when the task implements UI from Figma designs; skip this section for non-UI work. The design is the source of truth for the visual result.

**Hard gate.** Before the first UI edit, resolve the exact Figma node and inspect it through a real Figma tool call. A URL in the plan is not enough. In delegated mode, if the node cannot be resolved or inspected, return `NEEDS_INPUT` naming the component.

Also load:

- `tsh-implementing-frontend` - component patterns, design system usage, composition and performance
- `tsh-ensuring-accessibility` - WCAG compliance, semantic HTML, ARIA and automated accessibility checks

Design references:

- Look in the research file (`*.research.md`) for Figma URLs under Relevant Links and Gathered Information.
- Look in the plan file (`*.plan.md`) for Figma URLs and design references in Task Details, and for a Design References subsection that maps views and components to URLs or node IDs.
- Use these URLs as the default input for every Figma call. Add missing or updated links to the plan under Task Details and note them in the Changelog.

Setup before you start coding:

- The local development server runs and you can reach the page you implement (authenticated if needed).
- You know every relevant Figma URL and the design system tokens and components the project provides.

### Missing Figma link

If you cannot find a Figma URL for the component you are about to implement, stop work on that component and ask the user for the link. In delegated mode, return `NEEDS_INPUT` naming the component. Do not guess the design, do not skip the component and do not continue without a reference. Add the link to the plan once you have it.

### Verification is not your job

Verification against Figma belongs to the caller, which runs a separate UI reviewer. If you receive a verification report, fix all listed differences, not only the first, and report back.
