---
name: tsh-analyzing-codebase
description: "Analyzes the whole codebase of a system: its structure, dependencies, architecture, business logic, dead code and duplications, and runs code quality audits with a report. Use when onboarding to an unfamiliar repository, mapping a system before a change, producing a codebase analysis document, or auditing code quality. NOT for per-task conventions (use tsh-discovering-technical-context)."
metadata:
  short-description: "Analyze a codebase: dependencies, business logic, duplications"
---
<!-- Generated from src/skills/tsh-analyzing-codebase/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Codebase Analysis

This skill helps you analyse the codebase in a structured way, getting the most out of it. It focuses on architecture, patterns, code style, module separation, testing approach, dependencies and infrastructure.

## Codebase Analysis Process

Use the checklist below and track your progress:

```
Analysis progress:
- [ ] Step 1: Check repository structure
- [ ] Step 2: Check dependencies
- [ ] Step 3: Check available scripts
- [ ] Step 4: Check high level architecture
- [ ] Step 5: Check backend code
- [ ] Step 6: Check frontend code
- [ ] Step 7: Check infrastructure code
- [ ] Step 8: Check third party integrations
- [ ] Step 9: Check testing approach
- [ ] Step 10: Check the security approach
- [ ] Step 11: Look for potential improvements
- [ ] Step 12: Check for deadcode and duplications
```

**Step 1: Check repository structure**

Go through the whole repository to identify and understand the structure of the repository. 
Find out what type of repository we work with. Is it monorepo or single system repository.
Find out what type of the system in contains - frontend apps, backend apps, shared packages, infrastructure etc.
Find out where dependencies and scripts files are stored.
Find out where tests are stored (e2e, unit, integration).
Find out where are the most crucial directories for each system.

**Step 2: Check dependencies**

Analyse all dependencies.
Make sure to fully understand what frameworks, libraries, authentication systems etc. are used.
Make sure to note which dependencies are out of date and could be an issue later on.

**Step 3: Check available scripts**

Check all available scripts.
Find out what app running scripts we have.
Find out what quality assurance scripts we have (tests, linting, formatting etc.)
Understand the remaining scripts.

**Step 4: Check high level architecture**

Understand how the app architecture looks like based on the services, integrations and libraries.
Create a diagram of the architecture you can figure out based on the code itself.
Make sure to understand the internal and external communication patterns and practices used.

**Step 5: Check backend code**

Check what backend technology we use.
Check what framework we use.
Check how the code architecture looks like - MVC, CQRS, DDD, Hexagonal Architecture, Layered architecture etc.
Check if the code is divided based on a module (all module related code is in a single parent directory and has its own controllers, entities etc) or based on responsibilities (or controllers in a single directory etc.)
Understand the database schema and the pattern used (is it ORM, direct SQL etc.).
Make sure to understand what library we use for database communication.
Understand how the backend is deployed.
Understand how the authentication and authorization works.

**Step 6: Check frontend code**

Check what framework we use.
Understand what communication pattern (REST, Websocket, Graphql etc) we use.
Understand what UI libraries we use.
Understand what additional libraries we use for authentication, queries and other common areas.
Understand the code architecture. Do we follow atomic design or other approach.
Understand how the app is deployed.

**Step 7: Check infrastructure code**

Check how we manage infrastructure (IaC or manual). What technology we use for infrastructure?
How the app is deployed? Cloud, on-premise etc.
Understand if app is containerised.
Make sure to understand how scalable the infrastructure is.

**Step 8: Check third party integrations**

Check what third parties we use.
List all of the 3rd party libraries and their purpose in a system.
Understand how tightly they integrate into the system and how hard it will be to exchange them in the future.

**Step 9: Check testing approach**

Check what type of tests we have (e2e, unit, integration, contract etc.)
Understand the testing strategy. Do we test everything, only controller, only endpoints, only backend, only frontend etc.
Understand the current test coverage

**Step 10: Check the security approach**

Check what security approach the repository has.
Understand how authentication and authorisation is implemented.
What type of security 3rd parties and libraries we use.
Check how secure the database and endpoints are.
Find out which endpoints are publicly accessible.
Rate the general security approach.

**Step 11: Look for potential improvements**

Based on all findings, propose potential improvements.
Divide them into Critical, To be implemented but not critical, Nice to have.

**Step 12: Check for deadcode and duplications**

Analyse imports and dependencies to find out if there are any dead code or duplications in the codebase.
Look for unused imports, functions, components, files etc.
Look for duplicated code, functions, components etc. that can be extracted to a common place and reused.
Look for components that are very similar and can be merged into one with some configuration.
Look for code that is only used in their own test files and can be moved there or removed if not used at all outside of tests.

## Large codebase

The process might take a while and because of that create a document containing a section for each step. Save it as `specifications/codebase-analysis/codebase-analysis.md` (or the path the caller gives you).

During the processing make sure to update the document over the time.

## Code Quality Audit

For a code quality audit (dead code, duplications, improvement opportunities, architecture review), use the checklists in [references/audit-checklists.md](references/audit-checklists.md) for each layer or app, and write the result with [assets/code-quality-report.template.md](assets/code-quality-report.template.md). The audit report is saved as `specifications/code-quality/code-quality-report.md`. In a monorepo, each app, package and shared library is audited and reported separately.

The `/tsh-audit-codebase` command runs this audit: it fans out one architect subagent per layer and compiles the report in the main thread.

## Report

When using this skill standalone for an analysis (or when the user explicitly requests a separate codebase-analysis report), save the analysis results as a standalone document following the `assets/codebase-analysis.template.md` template.
When this skill is invoked by another prompt or workflow that defines its own required output file/template, embed the relevant findings into that caller's required output instead of creating a separate codebase-analysis report, unless the user explicitly asks for one.

For standalone reports following `assets/codebase-analysis.template.md`, don't add or remove any sections from the template. Follow the structure and naming conventions strictly to ensure clarity and consistency.
For monorepo repositories, duplicate the relevant sections (Backend Analysis, Frontend Analysis, etc.) per app/package when they differ significantly, and clearly label each with the app/package name.

## Connected Skills

- `tsh-discovering-technical-context` — for the project conventions and patterns the analysis should respect
- `tsh-reviewing-code` — for the code quality standards applied during an audit
- `tsh-analyzing-implementation-gaps` — for comparing a plan with the analyzed current state
- `tsh-designing-architecture` — for turning analysis findings into a technical design
