---
sidebar_position: 8
title: Cursor Engineer
---

# Cursor Engineer Agent

**File:** `.cursor/skills/agents/tsh-cursor-engineer/SKILL.md`

The Cursor Engineer agent specializes in designing, creating, reviewing, and improving all Cursor customization artifacts — custom agents, skills, prompts, and instructions.

## Responsibilities

- Creating, reviewing, and improving custom agents (`SKILL.md`), skills (`SKILL.md`), prompt files (`/SKILL.md`), and instruction files (`.rules.mdc`).
- Applying prompt engineering best practices: clarity, structure, token efficiency, progressive disclosure.
- Designing context architecture: what information flows where, at which layer, and with what priority.
- Enforcing strict separation of concerns between customization types.
- Advising on tool and MCP server configuration for agents and prompts.
- Optimizing the signal-to-noise ratio within context windows.

## Separation of Concerns

The Cursor Engineer enforces a strict boundary model:

| Artifact | Role | Contains |
|---|---|---|
| **Agent** (`SKILL.md`) | WHO | Persona, behavior, responsibilities, tool access |
| **Skill** (`SKILL.md`) | HOW | Reusable workflows, domain knowledge, step-by-step processes |
| **Prompt** (`/SKILL.md`) | WHAT | Workflow trigger, task starter, routes to agent + model |
| **Instructions** (`.rules.mdc`) | RULES | Coding standards, project conventions, always-applied |

When any artifact crosses these boundaries, the Cursor Engineer identifies and corrects the violation.

## Key Design Principles

- **Token efficiency** — Every token competes for context window space. Only add context the LLM doesn't already have.
- **Progressive disclosure** — Discovery (~100 tokens): name + description. Activation (&lt;5000 tokens): full body. Resource (on demand): templates, examples.
- **Structural parsing reliability** — XML-like tags for content with explicit boundaries; Markdown for sequential content.

## Tool Access

| Tool | Usage |
|---|---|
| **Context7** | Research Cursor customization docs, agent skill format, MCP server docs |
| **Sequential Thinking** | Design agent architecture, analyze multi-artifact interactions, evaluate trade-offs |
| **Web Fetch** | Fetch external documentation and reference materials |
| **Mermaid Diagrams** | Render architecture and workflow diagrams |
| **File Read/Edit/Search** | Read, modify, and search workspace files |
| **Terminal commands** | Execute shell commands and run project tasks |
| **Sub-agents** | Delegate subtasks to specialized agents |
| **Todo** | Track task progress with structured checklists |

## Skills Loaded

- `tsh-creating-agents` — Agent file creation workflow, templates, and validation checklist.
- `tsh-creating-skills` — Naming conventions, body structure, progressive disclosure patterns.
- `tsh-creating-commands` — Command skill creation workflow, templates, and validation checklist.
- `tsh-creating-rules` — Templates, decision framework for instruction vs. skill placement.
- `tsh-migrating-copilot-to-cursor` — Port Copilot customization artifacts to Cursor equivalents.
- `tsh-technical-context-discovering` — Understand existing customization patterns in the project.
- `tsh-codebase-analysing` — Analyze existing customization files and identify patterns.
