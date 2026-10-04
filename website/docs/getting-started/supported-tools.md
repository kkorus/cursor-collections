---
sidebar_position: 5
title: Supported Tools
---

# Supported Tools

TSH AI Collections is written once (in `src/`) and generated for Cursor, Claude Code and Codex. This page shows what each tool receives, how you invoke things, and the limits you should know about.

Status legend: **tested** means it was observed in a real run during development, **docs** means it follows the tool's official documentation, and **not yet verified** means neither.

## What each tool receives

| Artifact | Cursor | Claude Code | Codex |
|---|---|---|---|
| Skills (knowledge skills, commands, orchestrators, internal steps) | `.agents/skills/` | `.claude/skills/` | `.agents/skills/` |
| Subagents (17) | `.cursor/agents/*.md` | `.claude/agents/*.md` | `.codex/agents/*.toml` |
| Always-on instructions | `AGENTS.md` | `CLAUDE.md` (imports `AGENTS.md`) | `AGENTS.md` |
| MCP servers (11) | `.cursor/mcp.json` | `.mcp.json` | `.codex/config.toml` |

The collection has 41 knowledge skills, 16 commands, 3 orchestrators and 2 internal steps (62 skills in total), plus 17 subagents. See [Installation](./installation) for which folders the installer fills for each tool combination.

Subagent models are chosen by tier. Claude Code gets `opus`, `sonnet` or `haiku`, and Codex gets `gpt-5.4` (high or medium reasoning) or `gpt-5.4-mini`. Cursor subagents inherit your selected model.

## How things are invoked

### Commands

Commands are user-only entry points such as `/tsh-implement`, `/tsh-review` or `/tsh-ask`. They are never started by the model on its own.

| Tool | Syntax |
|---|---|
| Cursor | `/tsh-implement PROJ-123` (tested) |
| Claude Code | `/tsh-implement PROJ-123` (tested) |
| Codex | `$tsh-implement PROJ-123` (docs; not yet verified) |

Arguments are the text after the command. Commands that run an agent (`/tsh-review`, `/tsh-ask`, `/tsh-debug`, ...) hand the work to a subagent. `/tsh-implement` and `/tsh-refactor` load the Engineering Manager; `/tsh-analyze-materials` and `/tsh-explore-materials` load the Business Analyst; `/tsh-create-custom-*` load the AI Customization Orchestrator. Orchestrators run in your main conversation, so they can ask you questions and keep the gates.

### Using an agent directly

You can talk to a persona such as the Architect without a command.

| Tool | Syntax | Status |
|---|---|---|
| Cursor | "Use the `tsh-architect` subagent to ..." | Named spawn tested. Typing `/tsh-architect` or `@tsh-architect` is not yet verified. |
| Claude Code | `claude --agent tsh-architect` runs the agent as the main conversation (multi-turn). | tested |
| Claude Code | `@agent-tsh-architect` inside a session runs the agent once as a subagent. | docs |
| Codex | Ask Codex to spawn the custom agent `tsh-architect`. | not yet verified |

### Interactive mode and delegated mode

Every agent has two modes.

- **Interactive** (default): you invoked the agent directly. It talks to you, asks questions and shows a "Suggested next steps" list.
- **Delegated**: an orchestrator or command started it, and the first line of its task is exactly `MODE: delegated`. The agent never asks you anything. It ends with a status block (`STATUS: DONE`, `NEEDS_INPUT`, `NEEDS_ARCHITECT_DECISION` or `BLOCKED`) and the caller asks you on its behalf, then delegates again. There is at most one delegation level, and agents never delegate further.

Multi-turn use of a directly invoked agent depends on the tool:

| Tool | Multi-turn conversation with a directly invoked agent |
|---|---|
| Claude Code | Yes with `claude --agent <name>` (tested). A subagent started with `@agent-<name>` cannot ask you questions; it only returns a result (docs). |
| Cursor | Not yet verified whether a subagent stays in the conversation after its first reply. |
| Codex | Not yet verified. |

If you want to discuss a design and your tool does not keep a subagent conversational, use `/tsh-ask`. It runs in the main conversation, talks to you, and delegates only the analysis.

## Known limitations

- **Internal steps and orchestrators are visible in Cursor and Codex.** Neither tool can hide a skill from its `/` or `$` menu and still let the model load it. Entries such as `tsh-engineering-manager` or `tsh-implement-task` therefore show up in the menu and could be started by the model. Their descriptions begin with "Internal step of `/tsh-...`: load only when a tsh command or orchestrator instructs it." to discourage that. Claude Code hides them from the `/` menu (`user-invocable: false`) while the model can still load them.
- **Cursor may list skills twice** when you install for Cursor, Claude Code and Codex together. See [Installation](./installation#cursor-shows-skills-twice).
- **Read-only agents and Claude Code personas.** Agents with read-only access (for example the UI Reviewer, the AI customization reviewer and the BA workers) have `Write` and `Edit` disabled. With `claude --agent <name>` this also applies to the main conversation, so a read-only persona cannot write files there. These agents return their result in the reply instead of saving a file.
- **Read-only is strongest in Claude Code.** Cursor `readonly` and Codex `sandbox_mode` are not documented to block MCP write tools. The agent instructions, and the rule that only the Engineering Manager writes to Jira, remain the main control. The AI customization reviewer also has shell access in Claude Code, so it could write through the shell.
- **Jira writes by BA workers.** On Claude Code, the BA workers are denied the MCP server named `atlassian`. This does not match an Atlassian connector added through claude.ai, see [MCP Setup](./mcp-setup).
- **Codex is not yet verified.** The Codex output (`.agents/skills`, `.codex/agents/*.toml`, `.codex/config.toml`) follows the Codex documentation, but it has not been run in a real Codex session. Open questions: whether hyphenated agent names load, how the skill listing is truncated, and how `MODE: delegated` arrives in a spawned agent. Project-level `.codex/config.toml` and `.codex/agents` load only in trusted projects.
- **Status blocks may be one line.** In Cursor, a subagent's `STATUS:` block can arrive on a single line. The callers do not depend on line breaks.
