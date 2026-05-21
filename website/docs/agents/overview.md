---
sidebar_position: 1
title: Agents Overview
---

# Agents Overview

Cursor Collections provides **12 specialized agent skills** (plus 4 internal sub-agents) that together form an AI product engineering team covering the full delivery lifecycle — from product ideation through development, infrastructure, and quality assurance. Agent skills are stored in `.cursor/skills/agents/` as `SKILL.md` files. Cursor loads them automatically based on context.

## How Agent Skills Work

Each agent skill has:

- **A defined role** — What the agent specializes in and what it should/shouldn't do.
- **Recommended tools** — Which MCP integrations and tools work best for this agent.
- **Workflow skills** — Which domain skills it loads for specialized knowledge.
- **Delegation logic** — When and how to hand off to other agent skills.

Agent skills are automatically invoked by Cursor when relevant, or manually via `/agent-name` in chat.

## Agent Delegation Diagram

```
┌──────────────────────┐
│  Business Analyst     │
│  /tsh-analyze-materials│
└──────┬───────────────┘
       │ Delegates to Engineering Manager
       ▼
┌─────────────────────────┐
│   Engineering Manager    │  ← Orchestrates the full cycle
│   /tsh-implement         │
└──────┬──────────────────┘
       │ Delegates to specialized agents
       ├────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
       ▼            ▼            ▼            ▼            ▼            ▼            ▼
  Context       Architect    Software      DevOps        E2E         Prompt      UI Reviewer
  Engineer       (plan)      Engineer      Engineer    Engineer     Engineer    /tsh-review-ui
  (research)        │        (app code)    (infra)     (tests)     (prompts)
                    ▼
             Architect Reviewer
             (plan validation)
                    │ APPROVED
                    ▼
              Code Reviewer
              /tsh-review
```

## Agent Summary

### Product Ideation Agents

| Agent | Skill path | Role | Key Tools |
|-------|-----------|------|-----------|
| [Business Analyst](./business-analyst) | `agents/tsh-business-analyst/` | Converts workshop materials into Jira-ready epics and stories | Atlassian, Figma, PDF Reader, Sequential Thinking |

### Development Agents

| Agent | Skill path | Role | Key Tools |
|-------|-----------|------|-----------|
| [Context Engineer](./context-engineer) | `agents/tsh-context-engineer/` | Gathers requirements, builds context, identifies gaps | Atlassian, Figma, PDF Reader, Sequential Thinking |
| [Architect](./architect) | `agents/tsh-architect/` | Designs solutions, creates implementation plans | Atlassian, Context7, Figma, PDF Reader, Sequential Thinking |
| [Engineering Manager](./engineering-manager) | `agents/tsh-engineering-manager/` | Orchestrates implementation by delegating to specialized agents | Atlassian, Sequential Thinking |
| [Software Engineer](./software-engineer) | `agents/tsh-software-engineer/` | Implements code against the plan | Context7, Figma, Playwright, Sequential Thinking |
| [Prompt Engineer](./prompt-engineer) | `agents/tsh-prompt-engineer/` | Designs, optimizes, and secures LLM application prompts | Context7, Sequential Thinking |

### Infrastructure & DevOps Agents

| Agent | Skill path | Role | Key Tools |
|-------|-----------|------|-----------|
| [DevOps Engineer](./devops-engineer) | `agents/tsh-devops-engineer/` | Infrastructure automation, CI/CD, cloud governance, cost optimization | Context7, Sequential Thinking, AWS API, AWS Docs, GCP Gcloud, GCP Observability, GCP Storage |

### Quality Agents

| Agent | Skill path | Role | Key Tools |
|-------|-----------|------|-----------|
| [Code Reviewer](./code-reviewer) | `agents/tsh-code-reviewer/` | Reviews code quality, security, correctness | Atlassian, Context7, Figma, Sequential Thinking |
| [UI Reviewer](./ui-reviewer) | `agents/tsh-ui-reviewer/` | Verifies UI matches Figma design | Figma, Playwright, Context7 |
| [E2E Engineer](./e2e-engineer) | `agents/tsh-e2e-engineer/` | Creates and maintains Playwright E2E tests | Playwright, Context7, Figma, Sequential Thinking |

### Cursor Customization Agents

| Agent | Skill path | Role | Key Tools |
|-------|-----------|------|-----------|
| [Cursor Engineer](./copilot-engineer) | `agents/tsh-cursor-engineer/` | Designs, creates, reviews Cursor customization artifacts | Context7, Sequential Thinking |
| [Cursor Orchestrator](./cursor-orchestrator) | `agents/tsh-cursor-orchestrator/` | Coordinates complex multi-step Cursor customization tasks | Sequential Thinking |

### Internal Sub-Agents

These agent skills are not invoked directly by users. They are delegated to automatically by the Engineering Manager or Cursor Orchestrator.

| Agent | Skill path | Role |
|-------|-----------|------|
| [Architect Reviewer](./architect-reviewer) | `agents/tsh-architect-reviewer/` | Validates implementation plans before implementation begins |
| [Cursor Researcher](./cursor-researcher) | `agents/tsh-cursor-researcher/` | Analyzes codebases and documentation, extracts patterns |
| [Cursor Artifact Creator](./copilot-artifact-creator) | `agents/tsh-cursor-artifact-creator/` | Creates and modifies Cursor customization artifacts |
| [Cursor Artifact Reviewer](./copilot-artifact-reviewer) | `agents/tsh-cursor-artifact-reviewer/` | Validates quality and consistency of artifacts |
