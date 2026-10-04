---
sidebar_position: 1
title: Commands Overview
---

# Commands Overview

TSH AI Collections includes **16 slash commands** that trigger specific workflow actions across the full product lifecycle, plus 2 internal steps that commands and orchestrators load. Commands are skills with `type: command`. They are generated for Cursor, Claude Code and Codex and are available as `/tsh-<name>` in Cursor and Claude Code. The Codex invocation syntax is not yet verified.

## How commands work

A command is a thin entry point. It contains no domain knowledge. It does one of three things:

- **Loads an orchestrator skill** that runs in the main conversation and delegates to subagents (`/tsh-implement`, `/tsh-refactor`, `/tsh-analyze-materials`, `/tsh-explore-materials`, `/tsh-create-custom-*`).
- **Delegates to one subagent** (`/tsh-review`, `/tsh-review-ui`, `/tsh-audit-infrastructure`, `/tsh-analyze-cloud-costs`), or investigates in the main thread and delegates the work (`/tsh-ask`, `/tsh-debug`, `/tsh-audit-codebase`).
- **Runs standalone** in the main thread (`/tsh-commit`).

Commands are hidden from automatic model invocation, so they run only when you type them. Everything after the command name is passed as the input.

## Commands

### Product ideation

| Command | Routes to | Description |
|---------|-----------|-------------|
| [/tsh-explore-materials](./explore-materials) | Business Analyst (orchestrator) | Explore workshop materials before backlog extraction |
| [/tsh-analyze-materials](./analyze-materials) | Business Analyst (orchestrator) | Turn workshop materials into Jira-ready epics and stories |

### Development

| Command | Routes to | Description |
|---------|-----------|-------------|
| [/tsh-implement](./implement) | Engineering Manager (orchestrator) | Implement a task end to end: research, plan, plan review, implementation, review |
| [/tsh-refactor](./refactor) | Engineering Manager (orchestrator), refactor mode | Behavior-preserving structural refactoring |

### Quality

| Command | Routes to | Description |
|---------|-----------|-------------|
| [/tsh-review](./review) | Code Reviewer | Review an implementation against the plan, or the current diff |
| [/tsh-review-ui](./review-ui) | UI Reviewer | Single-pass Figma versus implementation comparison |
| [/tsh-audit-codebase](./audit-codebase) | Architect (fan-out per layer) | Code quality audit: dead code, duplication, improvements |

### Developer utilities

| Command | Routes to | Description |
|---------|-----------|-------------|
| [/tsh-ask](./ask) | Architect | Architectural Q&A recorded as a decision record in `specifications/decisions/` |
| [/tsh-debug](./debug) | Software Engineer | Systematic root-cause debugging |
| [/tsh-commit](./commit) | none (standalone) | Conventional Commits message with an approval gate |

### AI customization

| Command | Routes to | Description |
|---------|-----------|-------------|
| [/tsh-create-custom-agent](./create-custom-agent) | AI Customization Orchestrator | Create a new custom agent |
| [/tsh-create-custom-skill](./create-custom-skill) | AI Customization Orchestrator | Create a new skill |
| [/tsh-create-custom-command](./create-custom-command) | AI Customization Orchestrator | Create a new slash command |
| [/tsh-create-custom-rules](./create-custom-rules) | AI Customization Orchestrator | Create project instructions and scoped rules |

### Infrastructure and cost

| Command | Routes to | Description |
|---------|-----------|-------------|
| [/tsh-audit-infrastructure](./audit-infrastructure) | DevOps Engineer | Audit infrastructure for security gaps, cost waste and best-practice violations |
| [/tsh-analyze-cloud-costs](./analyze-cloud-costs) | DevOps Engineer | AWS or GCP cost optimization and tagging compliance audit |

## Internal steps

Internal steps are not commands you type. Orchestrators load them by name. Cursor and Codex may list them anyway; their descriptions start with "Internal step of ...".

| Step | Loaded by | Description |
|------|-----------|-------------|
| [tsh-implement-task](./internal/implement-task) | Software Engineer (delegated by the Engineering Manager) | Implement a feature from a plan or a task description |
| [tsh-orchestrate-ui-verification](./internal/orchestrate-ui-verification) | Engineering Manager | The verify-fix loop for UI tasks with Figma designs |

## Delegation via /tsh-implement

When you run [`/tsh-implement`](./implement), the [Engineering Manager](../agents/engineering-manager) handles the full development cycle. It gathers context and creates a plan if they are missing, then delegates tasks to subagents.

| Phase | Delegated to |
|-------|--------------|
| Research | [Context Engineer](../agents/context-engineer) |
| Planning | [Architect](../agents/architect) |
| Plan validation | [Plan Reviewer](../agents/plan-reviewer) |
| Backend and general code | [Software Engineer](../agents/software-engineer) (with `tsh-implement-task`) |
| Frontend with Figma | Software Engineer, then [UI Reviewer](../agents/ui-reviewer) in a loop (`tsh-orchestrate-ui-verification`) |
| E2E tests | [E2E Engineer](../agents/e2e-engineer) |
| LLM application prompts | [Prompt Engineer](../agents/prompt-engineer) |
| Kubernetes, Terraform, CI/CD, observability | [DevOps Engineer](../agents/devops-engineer) |
| Final review | [Code Reviewer](../agents/code-reviewer) |

## Input format

Commands accept free text after the command name. For example, `/tsh-implement` takes a Jira ticket ID (`/tsh-implement PROJ-123`) or a task description (`/tsh-implement Add pagination to the user list API`). Jira and Confluence are read only when you give a key. Each command page lists its own arguments.

Commands do not start other commands. At the end they suggest follow-up commands as text, for example `/tsh-review` after an implementation.
