---
sidebar_position: 4.5
title: Which Command Do I Use?
---

# Which Command Do I Use?

You only ever type **commands**: the 16 entries that start with `/tsh-`. Everything else in the collection (knowledge skills, orchestrators, internal steps and subagents) is loaded by the commands and the agents, not by you.

## By situation

| I want to... | Type |
|---|---|
| Implement a feature or task end to end (research, plan, code, review) | `/tsh-implement <task or plan path>` |
| Fix a bug with a reproduction and a regression test | `/tsh-debug <description of the bug>` |
| Ask an architecture question and keep the decision as a record | `/tsh-ask <question>` |
| Review my changes against a plan or the diff | `/tsh-review` |
| Check a built UI against its Figma design | `/tsh-review-ui` |
| Restructure code without changing its behavior | `/tsh-refactor <scope>` |
| Audit code quality (dead code, duplication) | `/tsh-audit-codebase` |
| Write a Conventional Commits message and commit | `/tsh-commit` |
| Turn workshop materials into Jira-ready epics and stories | `/tsh-analyze-materials` |
| Explore the business context of workshop materials first | `/tsh-explore-materials` |
| Audit infrastructure for security and best practices | `/tsh-audit-infrastructure` |
| Audit AWS or GCP cost and tagging | `/tsh-analyze-cloud-costs <aws\|gcp>` |
| Create my own skill, command, agent or project rules | `/tsh-create-custom-skill`, `/tsh-create-custom-command`, `/tsh-create-custom-agent`, `/tsh-create-custom-rules` |

If you are unsure where to start with a task, use `/tsh-implement`. It asks whether the task needs the full flow or the quick one.

## What you do not type

| Kind | Examples | Why not |
|---|---|---|
| Knowledge skills | `tsh-debugging`, `tsh-reviewing-code`, `tsh-designing-architecture` | They hold the method. A command or an agent loads the one it needs by name, and the model can load them on its own when your request matches. |
| Orchestrators | `tsh-engineering-manager`, `tsh-business-analyst` | A command starts them. They delegate to subagents and run the loops. |
| Internal steps | `tsh-implement-task`, `tsh-orchestrate-ui-verification` | Steps of a larger flow. |
| Subagents | `tsh-architect`, `tsh-code-reviewer`, `tsh-software-engineer` | Workers. Use them through a command. If you want a direct conversation with one, start it explicitly (see [Supported Tools](./supported-tools)). |

### Example: `tsh-debug` and `tsh-debugging`

`/tsh-debug` is the command. It investigates in your conversation and delegates the fix to the software engineer. `tsh-debugging` is the knowledge skill with the six debugging steps that the command and the engineer follow. You use `/tsh-debug`; you never need `tsh-debugging`.

## What you see in each tool

| Tool | Slash menu |
|---|---|
| Claude Code | Exactly the 16 commands. Everything else is hidden from the menu but can still be loaded by name (tested). |
| Cursor | The documentation does not allow hiding a skill from the menu, so knowledge skills, orchestrators and internal steps can show up next to the commands. Ignore them and use the table above. |
| Codex | Same limitation, and not yet verified in a real Codex session. |
