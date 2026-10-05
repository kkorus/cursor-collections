---
sidebar_position: 1
title: Agents Overview
---

# Agents Overview

TSH AI Collections provides **17 subagents** and **3 orchestrator skills** that together form an AI product engineering team covering the full delivery lifecycle, from product ideation through development, infrastructure and quality assurance. The same roles are generated for Cursor, Claude Code and Codex from one source in `src/`.

## Subagents, orchestrators and skills

| | **Subagent** | **Orchestrator skill** | **Knowledge skill** |
| --- | --- | --- | --- |
| What it is | A role with its own context window, model tier and tool access | A workflow that runs in the main conversation | Reusable domain knowledge |
| Source | `src/agents/<name>.md` | `src/skills/<name>/SKILL.md` (`type: orchestrator`) | `src/skills/<name>/SKILL.md` (`type: skill`) |
| Talks to you | In interactive mode (direct use) | Yes, at every gate | Through the agent that loads it |
| Delegates | Never (leaf agent) | To subagents, one level deep | Never |

The orchestrators are the [Engineering Manager](./engineering-manager), the [Business Analyst](./business-analyst) and the [AI Customization Orchestrator](./ai-customization-orchestrator). They run in the main thread because a subagent cannot ask you questions when it is delegated. Commands such as `/tsh-implement` load them.

Agents are generated as `.cursor/agents/`, `.claude/agents/` (Markdown) and `.codex/agents/` (TOML). Skills are generated into `.agents/skills/` and `.claude/skills/`. See [Supported tools](../getting-started/supported-tools) for what each tool receives.

## Two modes: interactive and delegated

Every subagent runs in one of two modes:

- **Interactive** (default): you invoke the agent directly. It asks you clarifying questions, explains its reasoning and ends with suggested next steps.
- **Delegated**: an orchestrator or command starts it with a task whose first line is exactly `MODE: delegated`. It never asks you anything. It saves its work to files and ends its reply with a status block (`DONE`, `NEEDS_INPUT`, `NEEDS_ARCHITECT_DECISION` or `BLOCKED`). The caller asks you any open questions and delegates again with your answers.

## Model tiers and access

Each subagent declares a model tier and an access level. The tiers map to models per tool:

| Tier | Claude Code | Codex | Cursor |
| --- | --- | --- | --- |
| `deep` | opus | gpt-5.4, high reasoning effort (not yet verified) | inherits the model you selected |
| `balanced` | sonnet | gpt-5.4, medium reasoning effort (not yet verified) | inherits |
| `fast` | haiku | gpt-5.4-mini (not yet verified) | inherits |

Read-only agents cannot edit files, so they return results in the reply. Agents marked "no shell" cannot run shell commands on Claude Code. Every agent is a leaf: it cannot start other agents.

## Invoking an agent directly

| Tool | Conversation with the agent | Run the agent once |
| --- | --- | --- |
| Cursor | Invoke the `tsh-<role>` subagent by name, for example `tsh-architect` (multi-turn behavior not yet verified) | Ask Cursor to use the `tsh-<role>` subagent |
| Claude Code | `claude --agent tsh-<role>` starts a session with the agent as the main thread | `@agent-tsh-<role>` in a session, or ask Claude to use the agent by name |
| Codex | Not yet verified | Not yet verified |

On Claude Code, an agent started with `--agent` keeps its tool restrictions. A read-only agent cannot write files in that session either, and no agent can start subagents.

Most people do not invoke agents directly. They run a command (for example [`/tsh-implement`](../commands/implement)) and the orchestrator or command delegates to the right agent.

## Delegation

At most one delegation level exists. Commands and orchestrators run in the main thread and delegate to subagents. The subagents never delegate further. When an agent needs a decision outside its role, it returns a status (`NEEDS_INPUT` or `NEEDS_ARCHITECT_DECISION`) and the caller routes it.

```
/tsh-analyze-materials ──> Business Analyst (orchestrator)
                             ├─ tsh-ba-transcript-worker
                             ├─ tsh-ba-analysis-worker
                             ├─ tsh-ba-extraction-worker
                             ├─ tsh-ba-quality-worker
                             └─ tsh-ba-formatting-worker

/tsh-implement ──> Engineering Manager (orchestrator)
                     ├─ tsh-context-engineer   (research)
                     ├─ tsh-architect          (plan)
                     ├─ tsh-plan-reviewer      (plan review, max 3 iterations)
                     ├─ tsh-software-engineer  (app code)
                     ├─ tsh-devops-engineer    (infrastructure)
                     ├─ tsh-e2e-engineer       (E2E tests)
                     ├─ tsh-prompt-engineer    (LLM prompts)
                     ├─ tsh-ui-reviewer        (Figma verification loop)
                     └─ tsh-code-reviewer      (final review)

/tsh-create-custom-* ──> AI Customization Orchestrator
                           ├─ tsh-ai-customization-researcher
                           ├─ tsh-ai-customization-creator
                           └─ tsh-ai-customization-reviewer
```

Some commands route straight to one agent: `/tsh-ask` and `/tsh-audit-codebase` to the Architect, `/tsh-debug` to the Software Engineer, `/tsh-review` to the Code Reviewer, `/tsh-review-ui` to the UI Reviewer, and `/tsh-audit-infrastructure` and `/tsh-analyze-cloud-costs` to the DevOps Engineer. See the [commands overview](../commands/overview).

:::note Known limitation
Claude Code hides internal and orchestrator skills from its `/` menu. Cursor hides them in the CLI but not yet in the IDE (according to a Cursor developer), and Codex is not yet verified. In every tool the model may still list them, so it could auto-invoke one. The descriptions of these skills start with "Internal step of ..." to discourage that. See [Supported tools](../getting-started/supported-tools).
:::

## Agent summary

### Product ideation

| Agent | Kind | Role |
|-------|------|------|
| [Business Analyst](./business-analyst) | Orchestrator skill | Turns workshop materials into Jira-ready epics and stories, with four review gates |

### Development

| Agent | Tier / access | Role |
|-------|---------------|------|
| [Context Engineer](./context-engineer) | deep, read-write | Gathers requirements, builds context, identifies gaps |
| [Architect](./architect) | deep, read-write | Designs solutions, creates implementation plans |
| [Plan Reviewer](./plan-reviewer) | deep, read-write | Stress-tests implementation plans before implementation starts |
| [Engineering Manager](./engineering-manager) | Orchestrator skill | Orchestrates implementation by delegating to subagents |
| [Software Engineer](./software-engineer) | deep, read-write | Implements code against the plan |
| [Prompt Engineer](./prompt-engineer) | deep, read-write | Designs, optimizes and secures LLM application prompts |

### Infrastructure and DevOps

| Agent | Tier / access | Role |
|-------|---------------|------|
| [DevOps Engineer](./devops-engineer) | balanced, read-write | Infrastructure automation, CI/CD, cloud governance, cost optimization |

### Quality

| Agent | Tier / access | Role |
|-------|---------------|------|
| [Code Reviewer](./code-reviewer) | balanced, read-write | Reviews code quality, security and correctness |
| [UI Reviewer](./ui-reviewer) | deep, read-only | Verifies that the UI matches the Figma design |
| [E2E Engineer](./e2e-engineer) | fast, read-write | Creates and maintains Playwright E2E tests |

### AI customization

| Agent | Kind | Role |
|-------|------|------|
| [AI Customization Orchestrator](./ai-customization-orchestrator) | Orchestrator skill | Coordinates research, creation and review of skills, commands, agents and rules |
| [AI Customization Researcher](./ai-customization-researcher) | balanced, read-only | Gathers facts about artifacts and tool documentation |
| [AI Customization Creator](./ai-customization-creator) | fast, read-write | Creates and modifies artifacts from a specification |
| [AI Customization Reviewer](./ai-customization-reviewer) | deep, read-only | Validates quality and consistency of artifacts |

### BA workers

Internal subagents of the Business Analyst, not meant for direct use: `tsh-ba-transcript-worker` (fast), `tsh-ba-analysis-worker` (deep), `tsh-ba-extraction-worker` (balanced), `tsh-ba-quality-worker` (deep) and `tsh-ba-formatting-worker` (fast). All are read-only and have no shell.
