---
name: tsh-discovering-technical-context
description: Discover and establish technical context before implementing any feature. Prioritize project instructions, existing codebase patterns, and external documentation in that order. Use when starting any feature or fix, before writing tests (unit, integration, E2E), before architectural decisions that affect existing code, or when onboarding to a new area of the codebase.
metadata:
  short-description: Discover project conventions and patterns before coding
---
<!-- Generated from src/skills/tsh-discovering-technical-context/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Technical Context Discovery

This skill provides a systematic approach for understanding a project's technical context before making any code changes. It ensures consistency with existing patterns and prevents introducing conflicting conventions.

## Technical Context Discovery Process

Use the checklist below and track your progress:

```
Discovery progress:
- [ ] Step 0: Check plan file for persisted context
- [ ] Step 1: Check the project instruction files
- [ ] Step 2: Analyze existing codebase patterns
- [ ] Step 3: Consult external documentation (if needed)
- [ ] Step 4: Resolve the project output locations
- [ ] Step 5: Apply the implementation rule
```

**Step 0: Check Plan File for Persisted Context**

**ALWAYS check first** whether a plan file (`*.plan.md`) exists for the current task and contains a **"Technical Context"** section.

If a "Technical Context" section exists and is populated:
- **Use it as-is** — do not re-discover conventions, patterns, or standards that are already documented there.
- Skip Steps 1-2 entirely. Proceed to Steps 4 and 5 using the persisted context.
- Only perform targeted discovery (Steps 1-2) for aspects **not covered** by the persisted context.

If no plan file exists, or the "Technical Context" section is missing/empty:
- Proceed with Steps 1-5 as normal.

**Step 1: Check the Project Instruction Files**

**ALWAYS check first** for the instruction files the project keeps for AI tools and contributors. Look in this order, and read every file that exists (nested `AGENTS.md` files apply to their directory):

1. `AGENTS.md` at the repository root and in nested directories
2. `CLAUDE.md`
3. `.claude/rules/`
4. `.cursor/rules/`
5. `.github/copilot-instructions.md`
6. `CONTRIBUTING.md`

Also look at the linter, formatter and editor configuration (for example `.editorconfig`, ESLint, Prettier, Ruff or `golangci` configs), because they encode conventions in a checkable form.

If the files conflict, prefer the one closest to the code being changed, then the more specific over the more general, and report the conflict.

If instruction files exist, they are the **primary source of truth** for:

- Coding standards and conventions
- Architecture patterns and project structure
- Technology stack specifics and version requirements
- Testing strategies and patterns
- Naming conventions and file organization
- Locator strategies (for E2E tests)
- Test data management approaches
- Environment configuration

**Step 2: Analyze Existing Codebase Patterns**

If no instruction files are found, or if they don't cover specific aspects, **analyze the existing codebase** to understand and replicate established patterns:

- **Architecture patterns**: Examine folder structure, layering (controllers, services, repositories), and module organization.
- **Code style**: Analyze existing files for naming conventions, formatting, and idioms used.
- **Error handling**: Look at how exceptions are caught, logged, and returned to clients.
- **Validation patterns**: Check how input validation is implemented (decorators, middleware, manual checks).
- **Testing patterns**: Review existing tests to understand structure, mocking strategies, assertion styles, fixtures, and test data management.
- **Database patterns**: Examine existing migrations, entities/models, and query patterns.
- **API patterns**: Analyze existing endpoints for response formats, status codes, and documentation style.
- **Configuration**: Check how environment variables, feature flags, and configuration are managed.

Use code search and find-references to locate similar implementations in the codebase and follow the same approach.

**Step 3: Consult External Documentation**

If neither instruction files nor sufficient existing codebase patterns are available (e.g., new project, greenfield feature, or first implementation of a specific pattern), **use external documentation and industry best practices**:

- **Use a documentation lookup tool (such as `context7`)** to search for official documentation of the framework/library being used (check project config for exact versions first).
- Apply **industry-standard best practices** for the technology stack.
- Follow **OWASP security guidelines** for secure coding practices.
- Apply **SOLID principles** and clean architecture patterns.
- Use **well-established design patterns** appropriate for the use case.

**IMPORTANT**: When using best practices in a greenfield scenario, document your decisions to establish patterns for future development, and propose an `AGENTS.md` entry (to the user, or in your result when delegated) that records the conventions you chose, instead of adding tool-specific rule files.

**Step 4: Resolve the Project Output Locations**

Decide where generated artifacts go before anyone writes them:

- The default is `specifications/<task>/`, where `<task>` is the Jira ID or a short kebab-case task name. Artifacts are `<task>.research.md`, `<task>.plan.md` and `<task>.plan-review.md`. Decision records go to `specifications/decisions/`, cost audits to `specifications/cost-audits/` codebase audits to `specifications/code-quality/` and the incremental codebase analysis to `specifications/codebase-analysis/`.
- If the project instructions (Step 1) define another location for specifications, plans or reports, use that location instead and say so in your result.
- Callers that delegate work (for example the engineering manager) pass the resolved location on to the agents they delegate to. A delegate that received a path uses it as given.

**Step 5: Apply the Implementation Rule**

Based on what you discovered, apply this decision hierarchy:

| Context Available | Action |
|---|---|
| Instruction files exist | Follow them strictly. Instructions take precedence over general best practices. |
| No instructions, but codebase has patterns | Mirror existing patterns exactly. Consistency with existing code > theoretical best practices. |
| No instructions, no existing patterns | Apply documentation-based best practices and industry standards. Document decisions for future reference. |

**Critical rule**: Never introduce new patterns unless explicitly requested by the user or specified in the implementation plan.

## Connected Skills

- `tsh-analyzing-codebase` — for a deeper, system-wide codebase analysis
- `tsh-designing-architecture` — for planning with the discovered context
- `tsh-reviewing-code` — for checking an implementation against the discovered conventions
- `tsh-analyzing-implementation-gaps` — for comparing the plan with what already exists
