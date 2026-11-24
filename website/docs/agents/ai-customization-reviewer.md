---
sidebar_position: 12
title: AI Customization Reviewer (internal)
---

# AI Customization Reviewer Agent

**Source:** `src/agents/tsh-ai-customization-reviewer.md`  
**Kind:** subagent, model tier `deep`, read-only access

Review specialist that evaluates AI-customization artifacts (skills, commands, agents, project rules) against best practices, portability, workspace consistency and structural correctness. Read-only; returns findings by severity with actionable recommendations.

## Responsibilities

- Evaluate AI-customization artifacts against quality criteria provided in the delegation prompt.
- Compare artifacts against existing workspace patterns for consistency in naming, structure, formatting, and tool configuration.
- Identify separation of concerns violations — flag when artifacts cross their defined boundaries.
- Produce structured review findings categorized by severity with specific, actionable recommendations.

## Review Dimensions

| Dimension | What It Checks |
|---|---|
| **Structural Correctness** | Valid YAML frontmatter, required sections present, proper tag usage |
| **Best Practice Adherence** | Token efficiency, progressive disclosure, no redundant content |
| **Workspace Consistency** | Naming conventions, tool arrays, section ordering, formatting |
| **Separation of Concerns** | Agent (WHO), workflow skill (HOW), command skill (WHAT), Instructions (RULES) boundaries |
| **Tool Configuration** | Tools match stated role, appropriate access boundaries |

## Boundaries

- Does not modify any files — reports findings only.
- Does not propose alternative designs or architectures.
- Does not limit findings based on fixability — reports all issues found.

## Tool access

- **Read-only.** The agent cannot edit or create files, so it returns its results in the reply.
- **Leaf agent.** It never delegates to other agents.

## Skills loaded

- `tsh-creating-skills` - Schema, naming, layout and templates for writing skills
- `tsh-creating-agents` - Schema, mapping and rules for writing agents
- `tsh-creating-commands` - Schema, mapping and template for writing commands
- `tsh-creating-rules` - Placement, fields and templates for project instructions and rules

## Invocation and modes

- **Delegated by:** the `tsh-ai-customization-orchestrator` skill. In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
- **Read-only persona:** when run as a main-thread persona on Claude Code (`claude --agent`), the agent keeps its restrictions and cannot write files there either.
