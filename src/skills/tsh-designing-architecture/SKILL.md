---
name: tsh-designing-architecture
description: Designs the architecture that solves a given task and produces the implementation plan (.plan.md) that engineers follow step by step. Use when a feature needs a technical design or an implementation plan before coding starts, when a plan must be revised after a plan review, or when an architectural decision needs a decision record.
type: skill
metadata:
  short-description: Design the architecture and implementation plan for a task
---

# Designing Architecture

Design the architecture that follows best practices and solves the actual business goal, then turn it into a detailed implementation plan a software engineer can follow step by step.

## Contents

- Architecture Design Process
- Planning rules
- Decision records
- Connected Skills

## Architecture Design Process

Use the checklist below and track your progress:

```
Design progress:
- [ ] Step 1: Understand the goal of the task
- [ ] Step 2: Analyze the current codebase and persist the technical context
- [ ] Step 3: Ask questions about ambiguous parts
- [ ] Step 4: Design a solution
- [ ] Step 5: Create the implementation plan document
```

**Step 1: Understand the goal of the task**

Process the conversation history and the task's `*.research.md` file to fully understand the business goal. Cross-check the requirements with industry, domain and company best practices, and identify the project's tech stack, industry and domain.

If the task or research file references PDF documents (technical specifications, API documentation, architecture documents, compliance requirements), use a PDF reading tool to extract and review their content.

**Step 2: Analyze the current codebase and persist the technical context**

Perform a current codebase analysis to get the full picture of the system in the context of the task. Use code search to find components, functions, hooks, utilities and files related to the requirements. Separate what is already implemented and functional, what exists but needs modification or extension, and what must be created from scratch. Record the result in the "Current Implementation Analysis" section of the plan, using the terms of the `tsh-analyzing-implementation-gaps` skill (To Be Reused, To Be Modified, To Be Created).

While doing this, capture the project conventions, coding standards, architecture patterns, tech stack details, testing patterns (including the commands for tests, linters and build) and the relevant project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`). Save them in the **Technical Context** section of the plan. Downstream agents read that section instead of re-scanning the codebase, so be thorough: framework conventions, naming patterns, test commands, linting rules and project-specific standards.

**Step 3: Ask questions about ambiguous parts**

After you have the full picture of the codebase and the task, ask the remaining questions and do not continue until they are answered. Update the plan whenever new information arrives.

**Step 4: Design a solution**

Design the solution architecture from your findings. Follow the best security and software design patterns. The solution must not be over-engineered and must be easy for developers to understand, while staying scalable, secure and maintainable.

Patterns to check (not limited to these):

- Don't repeat yourself
- Keep it simple
- Domain-Driven Design
- Test-Driven Development
- Modular, hexagonal or layered architecture
- Queue and messaging systems
- Single responsibility
- CQRS

For UI work follow the best UI/UX patterns (Atomic Design, accessibility patterns per WCAG) and for everything follow security best practices such as the OWASP Top 10. The design has to meet the quality assurance criteria, which means it has to be fully testable with a combination of E2E, unit and integration tests. Do not duplicate any work.

**Step 5: Create the implementation plan document**

Before you hand the plan over, load the `tsh-reviewing-plans` skill by name and check your own plan against its blocker categories.

Save the plan following [assets/plan.template.md](assets/plan.template.md). Do not add or remove sections from the template, and follow its structure and naming conventions. Save it at the path the caller gave you. Without one, use `<specs>/<task>/<task>.plan.md`, where `<task>` is the Jira ID or a short kebab-case task name and `<specs>` is resolved by the "Resolve the Project Output Locations" step of the `tsh-discovering-technical-context` skill.

## Planning rules

- **Phases and tasks**: divide the plan into small phases. Each phase has a `Goal`, a `Description` and a `Verification` line of fast checks (unit and integration tests, static analysis, linters, formatting check and the project build), and a checklist with a place to mark finished tasks.
- **Tasks**: give each task a clear title, a description, an action type (`[CREATE]`, `[MODIFY]` or `[REUSE]`), a `Files` line (each file marked create, modify or reuse; a modified file created earlier names that task), a `Stop Rule` and a definition of done as a checkbox list. A definition of done has at least one check a reviewer can verify: a runnable command copied verbatim from Technical Context for code tasks, a grep-style assertion for docs and config tasks. It must not include deployment steps, manual QA steps, or anything a code reviewer cannot verify from the code (for example "tests failed before the change").
- **Executable slots gate**: no angle-bracket placeholder and no assumed-default command (for example `npm test` when Technical Context does not say so) may remain in a Verification, Definition of Done or Files slot.
- **Open Questions gate**: a plan is not dispatchable while any Open Questions row is `❓ Open`. Resolve it, or ask the user, before the plan goes to review.
- **No real code**: the plan holds no implementation code. Pseudo-code is allowed only for a genuinely complicated algorithm; signatures, types and API shapes are allowed when they clarify a task boundary.
- **Human Approval**: every plan has a `## Human Approval` section. You record only the literal decision of the user when your task is `record_human_approval`, and never infer consent from silence, praise or a reviewer verdict (never infer it). A legacy plan without the section gets one, starting as `PENDING`.
- **Plan governance**: mark per task whether it is an actionable low-risk seam, and classify every revision of an approved plan, by the definitions below.

<!-- include: plan-governance -->

- **Code review phase**: the plan ends with a code review phase, performed through the engineering manager by the `tsh-code-reviewer` subagent, which follows the `tsh-reviewing-code` skill. Pass the E2E execution to that agent as part of its task and do not run those tests yourself. Do not include instructions for pushing code or for reviewing in the repository (pull request steps); the review phase itself is required.
- **UI verification**: for features with UI based on Figma designs, follow each UI implementation task with a `[REUSE]` UI verification task that carries the Figma URL and a `UI Verification Status` block (component, iterations used, final status `PASSED`, `ESCALATED` or `VERIFICATION NOT RUN`). The engineering manager runs the verify-fix loop (capture worker, `tsh-ui-reviewer`, fixes by `tsh-ui-engineer`, at most 5 iterations) with the `tsh-orchestrate-ui-verification` skill. Non-visual tasks need no verification task.
- **LLM prompts**: for features with LLM application prompts (system prompts, RAG templates, tool-calling instructions, classification or extraction prompts), add a `[REUSE]` prompt engineering task delegated to the `tsh-prompt-engineer` subagent. Separate the prompt design from the application code. Include the use case, the target model and any existing drafts in the task description.
- **Scope control**: plan only changes specific to THIS task. Do not plan prerequisite work (assume it is done) and do not plan features outside the requirements; list them in the Improvements section.
- **Avoid duplication**: never plan components, functions or utilities that already exist. Plan to reuse or modify them.
- **Security**: include the security considerations relevant to the implementation.
- **Bug fixes**: include steps to reproduce, the root cause analysis and a fix verified by tests.
- **Deployment**: do not provide deployment plans.

## Decision records

When the question is an architectural or pattern decision rather than a feature plan (for example "should we use optimistic or pessimistic locking"), evaluate two or three concrete options with their trade-offs against the existing codebase patterns, pick one, and save the record as `{topic}.decision.md` using [assets/decision.template.md](assets/decision.template.md). If the answer depends on conditions, state the exact conditions.

## Connected Skills

- `tsh-analyzing-codebase` - for analyzing the existing architecture, components and patterns
- `tsh-analyzing-implementation-gaps` - for verifying what was already implemented and what should be added
- `tsh-discovering-technical-context` - for establishing project conventions and existing patterns before designing
- `tsh-designing-databases` - for schemas, data models, normalization and indexing when the feature involves database changes, migrations or query-heavy work
