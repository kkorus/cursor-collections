---
sidebar_position: 1
title: Skills Overview
---

# Skills Overview

TSH AI Collections includes **43 knowledge skills**: modules that provide specialized domain expertise, structured processes and quality templates. They encode tested best practices for every phase of the product lifecycle.

The same skills are installed for Cursor, Claude Code and Codex from one neutral source (`src/skills/`). Cursor and Codex read them from `.agents/skills/`, Claude Code from `.claude/skills/`. Agents load a skill when its description matches the current task. You can also ask for one by name in chat. Codex behavior is not yet verified.

## How Skills Work

Each skill folder contains a `SKILL.md` file with:

- **Domain-specific guidelines**: best practices, checklists and processes.
- **Templates**: example output formats in `assets/`.
- **Deep-dive material**: longer references in `references/`, loaded only when needed.
- **Connected skills**: references by name to skills that complement this one.

Skills reference each other by name, never by path. Commands, orchestrators and internal workflow steps are not knowledge skills and are documented in the Commands section.

## Available Skills

### Product ideation

| Skill | Description | Used by |
|-------|-------------|---------|
| [tsh-analyzing-requirements](./analyzing-requirements) | Analyze a task and build its context and research document | BA Analysis Worker, Context Engineer, E2E Engineer |
| [tsh-processing-transcripts](./processing-transcripts) | Clean and structure raw workshop transcripts | BA Transcript Worker, Business Analyst (orchestrator) |
| [tsh-extracting-tasks](./extracting-tasks) | Extract epics and user stories from workshop materials | BA Extraction Worker, Business Analyst (orchestrator) |
| [tsh-reviewing-task-quality](./reviewing-task-quality) | Review extracted tasks for quality gaps and edge cases | BA Quality Worker, Business Analyst (orchestrator) |
| [tsh-formatting-jira-tasks](./formatting-jira-tasks) | Format epics and stories as Jira-ready tasks | BA Formatting Worker, Business Analyst (orchestrator) |
| [tsh-guarding-jira-statuses](./guarding-jira-statuses) | Protected Jira status policy for BA and Jira workflows | BA Quality Worker, Business Analyst (orchestrator) |

### Development

| Skill | Description | Used by |
|-------|-------------|---------|
| [tsh-designing-architecture](./designing-architecture) | Design the architecture and implementation plan for a task | Architect, Plan Reviewer, `/tsh-ask`, Engineering Manager (orchestrator) |
| [tsh-reviewing-plans](./reviewing-plans) | Stress-test an implementation plan and write a plan-review report | Plan Reviewer |
| [tsh-discovering-technical-context](./discovering-technical-context) | Discover project conventions and patterns before coding | Architect, Code Reviewer, DevOps Engineer, E2E Engineer, Plan Reviewer, Prompt Engineer, Software Engineer, `/tsh-analyze-cloud-costs`, `/tsh-ask`, `/tsh-audit-codebase`, `/tsh-audit-infrastructure`, `/tsh-create-custom-agent`, `/tsh-create-custom-command`, `/tsh-create-custom-rules`, `/tsh-create-custom-skill`, Engineering Manager (orchestrator), `tsh-implement-task` (step) |
| [tsh-analyzing-codebase](./analyzing-codebase) | Analyze a codebase: dependencies, business logic, duplications | Architect, BA Analysis Worker, Context Engineer, DevOps Engineer, Plan Reviewer, Software Engineer, `/tsh-analyze-cloud-costs`, `/tsh-ask`, `/tsh-audit-codebase`, `/tsh-audit-infrastructure`, `/tsh-create-custom-agent`, `/tsh-create-custom-command`, `/tsh-create-custom-rules`, `/tsh-create-custom-skill` |
| [tsh-analyzing-implementation-gaps](./analyzing-implementation-gaps) | Compare a plan with the current state to find implementation gaps | Architect, Code Reviewer, Plan Reviewer, Software Engineer, `tsh-implement-task` (step) |
| [tsh-designing-databases](./designing-databases) | SQL and database design: schemas, indexing, queries, ORMs | Architect, Code Reviewer, Plan Reviewer, Software Engineer, `tsh-implement-task` (step) |
| [tsh-implementing-frontend](./implementing-frontend) | Frontend components, design tokens and Figma-to-code | UI Engineer, `tsh-implement-task` (step) |
| [tsh-implementing-react](./implementing-react) | React hooks, effects, memoization and safe rendering | any agent |
| [tsh-implementing-forms](./implementing-forms) | Form architecture, validation and accessible patterns | Software Engineer |
| [tsh-writing-hooks](./writing-hooks) | Custom React hook patterns | Software Engineer |
| [tsh-ensuring-accessibility](./ensuring-accessibility) | WCAG accessibility: semantic HTML, ARIA, keyboard, contrast | Software Engineer, `tsh-implement-task` (step) |
| [tsh-optimizing-frontend](./optimizing-frontend) | Frontend rendering, bundle and memory optimization | Software Engineer |
| [tsh-implementing-backend](./implementing-backend) | Backend patterns: APIs, auth, testing, integrations | Software Engineer, `tsh-implement-task` (step) |
| [tsh-debugging](./debugging) | Debug systematically: reproduce, isolate, fix, verify | `/tsh-debug` |
| [tsh-refactoring](./refactoring) | Refactor safely with characterization tests and small steps | Engineering Manager (orchestrator), `/tsh-refactor` |
| [tsh-engineering-prompts](./engineering-prompts) | LLM prompt patterns: structure, security, evaluation | Architect, Code Reviewer, Prompt Engineer |

### Cloud and infrastructure

| Skill | Description | Used by |
|-------|-------------|---------|
| [tsh-delivering-infrastructure](./delivering-infrastructure) | Infrastructure delivery workflow, skill routing and escalation rules | DevOps Engineer, `/tsh-audit-infrastructure`, Engineering Manager (orchestrator) |
| [tsh-implementing-ci-cd](./implementing-ci-cd) | CI/CD pipeline design and deployment strategies | Architect, DevOps Engineer |
| [tsh-implementing-kubernetes](./implementing-kubernetes) | Kubernetes deployments, Helm charts and scaling | Architect, DevOps Engineer |
| [tsh-implementing-terraform-modules](./implementing-terraform-modules) | Reusable Terraform modules for AWS, Azure and GCP | Architect, DevOps Engineer, `/tsh-analyze-cloud-costs` |
| [tsh-implementing-observability](./implementing-observability) | Logging, monitoring, alerting and tracing patterns | Architect, DevOps Engineer |
| [tsh-managing-secrets](./managing-secrets) | Secrets storage, rotation and CI/CD authentication | Architect, DevOps Engineer, `/tsh-analyze-cloud-costs`, `/tsh-audit-infrastructure` |
| [tsh-optimizing-cloud-cost](./optimizing-cloud-cost) | Cloud cost rightsizing, tagging and governance | Architect, DevOps Engineer, `/tsh-analyze-cloud-costs`, `/tsh-audit-infrastructure` |
| [tsh-designing-multi-cloud-architecture](./designing-multi-cloud-architecture) | Choose and integrate services across AWS, Azure and GCP | Architect, DevOps Engineer |

### Quality

| Skill | Description | Used by |
|-------|-------------|---------|
| [tsh-reviewing-code](./reviewing-code) | Structured code review: correctness, security, quality | Code Reviewer, Prompt Engineer, `/tsh-audit-codebase`, Engineering Manager (orchestrator), `/tsh-review` |
| [tsh-reviewing-frontend](./reviewing-frontend) | Frontend code review criteria and anti-patterns | Code Reviewer |
| [tsh-verifying-ui](./verifying-ui) | UI verification criteria and report format against Figma | UI Engineer, UI Capture Worker, UI Reviewer, `tsh-orchestrate-ui-verification` (step), `/tsh-review-ui` |
| [tsh-writing-e2e-tests](./writing-e2e-tests) | Playwright E2E testing patterns and CI readiness | E2E Engineer |

### Collection authoring and tooling

| Skill | Description | Used by |
|-------|-------------|---------|
| [tsh-creating-agents](./creating-agents) | Schema, mapping and rules for writing agents | AI Customization Creator, AI Customization Reviewer, AI Customization Orchestrator (orchestrator), `/tsh-create-custom-agent` |
| [tsh-creating-skills](./creating-skills) | Schema, naming, layout and templates for writing skills | AI Customization Creator, AI Customization Reviewer, AI Customization Orchestrator (orchestrator), `/tsh-create-custom-skill` |
| [tsh-creating-commands](./creating-commands) | Schema, mapping and template for writing commands | AI Customization Creator, AI Customization Reviewer, AI Customization Orchestrator (orchestrator), `/tsh-create-custom-command` |
| [tsh-creating-rules](./creating-rules) | Placement, fields and templates for project instructions and rules | AI Customization Creator, AI Customization Reviewer, AI Customization Orchestrator (orchestrator), `/tsh-create-custom-rules` |
| [tsh-migrating-copilot-customizations](./migrating-copilot-customizations) | Convert Copilot customizations to the neutral source or native files | any agent |
| [tsh-committing](./committing) | Draft Conventional Commits messages from git changes | `/tsh-commit` |
| [tsh-using-playwright-cli](./using-playwright-cli) | Drive a browser with the `playwright-cli` command and capture evidence | UI Capture Worker |
| [tsh-writing-documentation](./writing-documentation) | Craft rules for README, CHANGELOG, in-repo docs and docs-site pages | Technical Writer |
| [tsh-using-mcp-servers](./using-mcp-servers) | When and how to use the collection's MCP servers | Architect, Code Reviewer, Context Engineer, DevOps Engineer, E2E Engineer, Prompt Engineer, Software Engineer, Business Analyst (orchestrator) |

## Loading Priority

Skills follow a strict priority hierarchy:

1. **Project instructions and rules** (`AGENTS.md`, `CLAUDE.md`, Cursor `.mdc` rules): highest priority.
2. **Existing codebase patterns**: replicate established conventions.
3. **Skill guidelines**: domain best practices and templates.
4. **External documentation**: framework docs, OWASP, industry standards.

This ensures consistency: existing patterns are never overridden unless explicitly requested.
