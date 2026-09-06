---
sidebar_position: 1
title: Commands Overview
---

# Commands Overview

Cursor Collections includes **17 slash commands** that trigger specific workflow actions across the full product lifecycle. Commands are stored in `.cursor/skills/commands/` as `SKILL.md` files with `disable-model-invocation: true`, and become available as `/tsh-<name>` shortcuts in Cursor Agent chat.

## How Commands Work

Each command skill defines:

- **Trigger** — The slash command name (e.g., `/tsh-implement`)
- **Target agent** — Which agent skill to invoke (or self-contained workflow)
- **Workflow** — Step-by-step instructions, required skills, and output format

When you type `/tsh-implement`, `/tsh-review`, etc. in Cursor Agent chat, the corresponding skill is loaded and executed.

## Public Commands

### Product Ideation Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-explore-materials](./public/explore-materials) | tsh-business-analyst | Explore workshop materials before backlog extraction |
| [/tsh-analyze-materials](./public/analyze-materials) | tsh-business-analyst | Process workshop materials into Jira-ready epics and stories |

### Development Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-implement](./public/implement) | tsh-engineering-manager | Orchestrate the full cycle: research/context gathering if needed → plan → implementation |
| [/tsh-refactor](./public/refactor) | tsh-software-engineer | Structural refactoring without behavior change |

### Quality Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-review](./public/review) | tsh-code-reviewer | Review implementation against plan and standards |
| [/tsh-review-ui](./public/review-ui) | tsh-ui-reviewer | Single-pass Figma vs implementation comparison |
| [/tsh-review-codebase](./public/review-codebase) | tsh-architect | Comprehensive code quality analysis |

### Developer Utilities

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-ask](./public/ask) | (self-contained) | Architectural Q&A → ADR in `specifications/decisions/` |
| [/tsh-debug](./public/debug) | tsh-software-engineer | Systematic root-cause debugging |
| [/tsh-commit](./public/commit) | (self-contained) | Conventional Commits with approval gate |

### Cursor Customization Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-create-custom-agent](./public/create-custom-agent) | tsh-cursor-orchestrator | Create a new Cursor agent skill |
| [/tsh-create-custom-skill](./public/create-custom-skill) | tsh-cursor-orchestrator | Create a new workflow skill |
| [/tsh-create-custom-command](./public/create-custom-command) | tsh-cursor-orchestrator | Create a new slash command skill |
| [/tsh-create-custom-rules](./public/create-custom-rules) | tsh-cursor-orchestrator | Create Cursor rules (`.cursor/rules/*.mdc`) |

### Infrastructure & Cost Analysis Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-audit-infrastructure](./public/audit-infrastructure) | tsh-devops-engineer | Audit infrastructure for security gaps, cost waste, and best practices |
| [/tsh-analyze-aws-costs](./public/analyze-aws-costs) | tsh-devops-engineer | AWS cost optimization and tagging compliance audit |
| [/tsh-analyze-gcp-costs](./public/analyze-gcp-costs) | tsh-devops-engineer | GCP cost optimization and labeling compliance audit |

## Delegation via /tsh-implement

When you run [`/tsh-implement`](./public/implement), the Engineering Manager automatically handles the full development cycle. Its four primary inputs are a task description, Jira ID, standalone `*.research.md`, or `*.plan.md`. A missing research or plan companion triggers preparation and never authorizes implementation without a current actionable plan. Before the first file-changing delegation, a Human approval of the exact current plan revision must already be recorded. The Architect normally records it at its own plan-authoring gate (`Approve plan`, `I have comments`); the Engineering Manager validates that record and reuses a valid one rather than asking you again, and presents its own `Approve current plan` / `Request changes` / `Stop` gate only as fail-closed recovery when no valid current-revision record exists. Automated Reviewer approval is readiness evidence only, not permission to implement.

| Phase | Delegated To |
|-------|-------------|
| Research (context gathering) | Context Engineer (via internal `tsh-research` skill) |
| Planning (architecture) | Architect (via internal `tsh-plan` skill) |
| Plan validation | Plan Reviewer final reality check (`agents/tsh-plan-reviewer`) |
| Backend / general code (actionable, low-risk seam) | Plan Implementor — DEFAULT |
| Backend / general code (complex, non-UI) | Software Engineer — EXCEPTION |
| Frontend with Figma | UI Engineer (via internal `tsh-implement-ui` skill) |
| E2E tests | E2E Engineer (via internal `tsh-implement-e2e` skill) |
| LLM application prompts | Prompt Engineer |
| Kubernetes, Terraform, CI/CD, observability | DevOps Engineer |
| Repository documentation | Technical Writer |
| UI verification | UI Reviewer |

## Input Format

Most commands accept either:

- A **Jira ticket ID**: `/tsh-implement PROJ-123`
- A **task description**: `/tsh-implement Add pagination to the user list API`

`/tsh-implement` additionally accepts a standalone `*.research.md` file or a `*.plan.md` implementation plan as a primary input. A missing research or plan companion routes to preparation; it never authorizes implementation without a current actionable plan.

The agent adapts its behavior based on the input type — pulling context from Jira/Confluence for ticket IDs, or working from the description and codebase for free-form text.
