---
sidebar_position: 1
title: Agents Overview
---

# Agents Overview

Cursor Collections provides **12 user-facing agent skills** (plus 9 internal delegate-only workers) that together form an AI product engineering team covering the full delivery lifecycle — from product ideation through development, infrastructure, and quality assurance. Agent skills are stored in `.cursor/skills/agents/` as `SKILL.md` files. Cursor discovers them with other skills under `.cursor/skills/`.

## Agent Skills vs Cursor Subagents

| | **Agent skills** (this collection) | **Cursor subagents** ([docs](https://cursor.com/docs/subagents)) |
| --- | --- | --- |
| Location | `.cursor/skills/agents/<name>/SKILL.md` | `.cursor/agents/<name>.md` |
| Purpose | Persona, responsibilities, when to load workflow skills | Isolated context window via Task tool |
| Invocation | `@tsh-architect` in chat; may auto-apply from `description` | `/verifier` or automatic Task delegation |
| Commands | `/tsh-implement`, `/tsh-review` in `.cursor/skills/commands/` | Not used for slash workflows here |

This repository uses **agent skills**, not project-level `.cursor/agents/` files. Orchestrators delegate with the **Task** tool and `@tsh-*` agent skills.

## How Agent Skills Work

Each agent skill has:

- **A defined role** — What the agent specializes in and what it should/shouldn't do.
- **Recommended tools** — Which MCP integrations and tools work best for this agent.
- **Workflow skills** — Which domain skills it loads for specialized knowledge.
- **Delegation logic** — When and how to hand off to other agent skills.

User-facing agents may be invoked with `@tsh-<role>` or loaded when relevant. Workflow entry points use `/tsh-<action>` command skills in `.cursor/skills/commands/`. Internal workers (BA workers, `tsh-architect-reviewer`, Cursor researcher/creator/reviewer) use `disable-model-invocation: true` and are meant for orchestrator delegation only.

## Agent Delegation Diagram

```
┌──────────────────────────────┐
│  Business Analyst             │
│  /tsh-explore-materials (opt) │
│  /tsh-analyze-materials       │
└──────┬───────────────────────┘
       │ Task-delegates to BA workers
       ├──────────┬──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼          ▼
  Transcript  Analysis  Extraction  Quality   Formatting
   Worker      Worker     Worker     Worker     Worker
       │ Start Implementation
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
| [Business Analyst](./business-analyst) | `agents/tsh-business-analyst/` | Orchestrates workshop analysis into Jira-ready epics and stories | Atlassian, Figma, PDF Reader, Sequential Thinking |

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
| [Cursor Engineer](./cursor-engineer) | `agents/tsh-cursor-engineer/` | Designs, creates, reviews Cursor customization artifacts | Context7, Sequential Thinking |
| [Cursor Orchestrator](./cursor-orchestrator) | `agents/tsh-cursor-orchestrator/` | Coordinates complex multi-step Cursor customization tasks | Sequential Thinking |

### Internal delegate-only agent skills

These skills have `disable-model-invocation: true`. They are delegated by the Business Analyst, Engineering Manager, or Cursor Orchestrator via the Task tool — not intended for direct `@` invocation.

| Agent | Skill path | Role |
|-------|-----------|------|
| BA Transcript Worker | `agents/tsh-ba-transcript-worker/` | Cleans and structures raw workshop transcripts |
| BA Analysis Worker | `agents/tsh-ba-analysis-worker/` | Synthesizes workshop context, baseline overlap, and open questions |
| BA Extraction Worker | `agents/tsh-ba-extraction-worker/` | Drafts intent briefs and extracts epics and stories |
| BA Quality Worker | `agents/tsh-ba-quality-worker/` | Runs Lite or Full quality-review passes |
| BA Formatting Worker | `agents/tsh-ba-formatting-worker/` | Prepares Jira-ready formatting and verification support |
| [Architect Reviewer](./architect-reviewer) | `agents/tsh-architect-reviewer/` | Stress-tests implementation plans before implementation starts |
| [Cursor Researcher](./cursor-researcher) | `agents/tsh-cursor-researcher/` | Analyzes codebases and documentation, extracts patterns |
| [Cursor Artifact Creator](./cursor-artifact-creator) | `agents/tsh-cursor-artifact-creator/` | Creates and modifies Cursor customization artifacts |
| [Cursor Artifact Reviewer](./cursor-artifact-reviewer) | `agents/tsh-cursor-artifact-reviewer/` | Validates quality and consistency of artifacts |
