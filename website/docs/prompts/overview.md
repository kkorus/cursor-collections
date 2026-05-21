---
sidebar_position: 1
title: Commands Overview
---

# Commands Overview

Cursor Collections includes **12 slash commands** that trigger specific workflow actions across the full product lifecycle. Commands are stored in `.cursor/skills/commands/` as `SKILL.md` files with `disable-model-invocation: true`, and become available as `/command` shortcuts in Cursor Agent chat.

## How Commands Work

Each command skill defines:

- **Trigger** — The slash command name (e.g., `/tsh-implement`)
- **Target agent** — Which agent skill to invoke
- **Workflow** — Step-by-step instructions, required skills, and output format

When you type `/tsh-implement`, `/tsh-review`, etc. in Cursor Agent chat, the corresponding skill is loaded and executed.

## Public Commands

### Product Ideation Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-analyze-materials](./public/analyze-materials) | tsh-business-analyst | Process workshop materials into Jira-ready epics and stories |

### Development Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-implement](./public/implement) | tsh-engineering-manager | Orchestrate the full cycle: research → plan → implementation |

### Quality Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-review](./public/review) | tsh-code-reviewer | Review implementation against plan and standards |
| [/tsh-review-ui](./public/review-ui) | tsh-ui-reviewer | Single-pass Figma vs implementation comparison |
| [/tsh-review-codebase](./public/review-codebase) | tsh-architect | Comprehensive code quality analysis |

### Cursor Customization Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-create-custom-agent](./public/create-custom-agent) | tsh-cursor-orchestrator | Create a new Cursor agent skill |
| [/tsh-create-custom-skill](./public/create-custom-skill) | tsh-cursor-orchestrator | Create a new workflow skill |
| [/tsh-create-custom-rules](./public/create-custom-instructions) | tsh-cursor-orchestrator | Create Cursor rules (`.cursor/rules/*.mdc`) |

### Infrastructure & Cost Analysis Commands

| Command | Agent Skill | Description |
|---------|------------|-------------|
| [/tsh-audit-infrastructure](./public/audit-infrastructure) | tsh-devops-engineer | Audit infrastructure for security gaps, cost waste, and best practices |
| [/tsh-analyze-aws-costs](./public/analyze-aws-costs) | tsh-devops-engineer | AWS cost optimization and tagging compliance audit |
| [/tsh-analyze-gcp-costs](./public/analyze-gcp-costs) | tsh-devops-engineer | GCP cost optimization and labeling compliance audit |

## Delegation via /tsh-implement

When you run [`/tsh-implement`](./public/implement), the Engineering Manager automatically handles the full development cycle. It first gathers context and creates an implementation plan (if needed), then delegates tasks to specialized agents.

| Phase | Delegated To |
|-------|-------------|
| Research (context gathering) | Context Engineer (via internal `tsh-research` skill) |
| Planning (architecture) | Architect (via internal `tsh-plan` skill) |
| Plan validation | Architect Reviewer (via internal `tsh-review-plan` skill) |
| Backend / general code | Software Engineer |
| Frontend with Figma | Software Engineer (via internal `tsh-implement-ui` skill) |
| E2E tests | E2E Engineer |
| LLM application prompts | Prompt Engineer |
| Kubernetes, Terraform, CI/CD, observability | DevOps Engineer |
| UI verification | UI Reviewer |

## Input Format

All commands accept either:

- A **Jira ticket ID**: `/tsh-implement PROJ-123`
- A **task description**: `/tsh-implement Add pagination to the user list API`

The agent adapts its behavior based on the input type — pulling context from Jira/Confluence for ticket IDs, or working from the description and codebase for free-form text.
