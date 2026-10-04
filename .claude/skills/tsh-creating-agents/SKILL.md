---
name: tsh-creating-agents
description: Guides creating and reviewing custom agents (subagents) for Cursor, Claude Code and Codex, from the neutral source schema in `src/agents/` or as native agent files. Covers the agent schema, per-tool output, separation of concerns, dual-mode behavior, the no-delegation rule and the orchestrator-versus-subagent decision. Use when creating, reviewing or updating an agent, or when deciding whether a role should be an agent, an orchestrator or a skill.
metadata:
  short-description: Schema, mapping and rules for writing agents
---
<!-- Generated from src/skills/tsh-creating-agents/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Creating Agents

Creates well-structured custom agents that run as subagents in Cursor, Claude Code and Codex. An agent defines WHO does the work; the workflows it follows live in skills.

## Core Design Principles

<principles>

<separation-of-concerns>
Each customization type has one job. When content crosses a boundary, move it.

| Type | Defines | Lives in |
|---|---|---|
| **Agent** | WHO: role, responsibilities, behavior, access level, which skills to load | `src/agents/<name>.md` |
| **Knowledge skill** | HOW: workflows, domain knowledge, step-by-step processes, templates | `src/skills/<name>/SKILL.md` (`type: skill`) |
| **Command** | WHAT: the user's entry point (`/tsh-<verb>`), routes to an agent or orchestrator | `src/skills/<name>/SKILL.md` (`type: command`) |
| **Orchestrator** | Main-thread workflow that delegates to agents and owns the loop | `src/skills/<name>/SKILL.md` (`type: orchestrator`) |
| **Project instructions** | RULES: coding standards, conventions, always-applied guidance | `AGENTS.md`, rule files |

Consequences:

- Agents **load workflows** by name; they never embed workflow steps. An agent that needs a procedure names the skill and says when to load it.
- An agent carries no coding standards. Those belong in project instructions.
- A command carries no domain knowledge, and project instructions never trigger workflows.
- A skill never defines a persona.
</separation-of-concerns>

<leaf-agents>
Agents are leaves: **they never delegate**. The delegation depth is one level everywhere (command or orchestrator in the main thread, then agent), which is the lowest common denominator of the three tools. If an agent needs a decision from another role, it returns a status (see Dual Mode) and the caller routes it.
</leaf-agents>

<minimal-scope>
Describe only what the role needs. Do not duplicate skill content or project rules in the agent body.
</minimal-scope>

</principles>

## Where Agents Live

- **The repository has `src/agents/` and `scripts/generate.mjs`:** write `src/agents/<name>.md` with the neutral frontmatter below, then run `npm run generate` and `npm run check`. Never edit the generated agent files by hand.
- **No neutral source:** write the native files for each tool the project uses (see the matrix).

## Agent Source Schema

Exact frontmatter of `src/agents/<name>.md`. Unknown keys fail `npm run check`.

```yaml
---
name: tsh-code-reviewer        # REQUIRED. == file name without .md. Same charset rule.
description: >-                # REQUIRED. When to delegate to this agent. <= 1024 chars.
  Reviews a change or implementation plan ... Use when ...
type: agent                    # REQUIRED
model-tier: balanced           # REQUIRED. deep | balanced | fast | inherit (mapped via src/config/targets.json)
access: read-write             # REQUIRED. read-only | read-write
shell: true                    # optional, default true
requires-mcp: [atlassian, context7, figma, sequential-thinking]   # optional, must exist in servers.json
preload-skills: [tsh-reviewing-code]   # optional, <= 2 entries. Claude `skills:` preload. Must also be named in the body.
targets:                       # optional escape hatch, merged LAST
  cursor: {}                   # e.g. { model: "...", is_background: true }
  claude: {}                   # e.g. { color: blue, disallowedTools: [...] }
  codex: {}                    # e.g. { model_reasoning_effort: "high" }
---
<body: the agent prompt. MUST include <!-- include: agent-modes -->.>
```

| Field | Choose by |
|---|---|
| `model-tier` | `deep` for design, analysis and hard reasoning; `balanced` for most reviewing and implementing; `fast` for mechanical or high-volume work; `inherit` to follow the caller |
| `access` | `read-only` if the agent must never change files; `read-write` otherwise (also when it writes only a report) |
| `shell` | `false` when the role needs no command execution |
| `requires-mcp` | Only servers the role really uses; each must be defined in `src/mcp/servers.json` |
| `preload-skills` | The one or two skills that define the agent's main workflow; never a command. Name them in the body too |

## Native Output per Tool

| Tool | File | Generated content |
|---|---|---|
| Cursor | `.cursor/agents/<name>.md` | `name`, `description`, `model` (only if the tier maps to one), `readonly` for `read-only`; the body starts with a generated "Required skills" line from `preload-skills` |
| Claude Code | `.claude/agents/<name>.md` | `name`, `description`, `model`, `disallowedTools` (always includes `Agent`; adds `Write`, `Edit`, `NotebookEdit` for `read-only` and `Bash` for `shell: false`), `skills` from `preload-skills` |
| Codex | `.codex/agents/<name>.toml` | `name`, `description`, `developer_instructions` (body plus the "Required skills" line), `model`, `model_reasoning_effort`, `sandbox_mode = "read-only"` for `read-only` |

- Claude uses a deny-list so that MCP tools stay inherited. Cursor and Codex have no shell switch, so `shell: false` is also stated in the body there.
- Cursor `readonly` and Codex `sandbox_mode` are not documented to block MCP write tools. State the restriction in the body as well.
- Cursor and Codex have no preload field. The generated "Required skills" line asks the agent to load the skills by name, so keep them named in the body.
- Without a generator, write the equivalent native file by hand for each tool, using the fields above. Keep the body identical across tools.

## Dual Mode and Callers

Every agent runs in two modes. Interactive mode is the default (a user talks to the agent directly). Delegated mode starts only when the first line of the task is exactly `MODE: delegated`; the agent then never asks the user and ends with a `STATUS:` block.

- The agent body MUST include the `agent-modes` partial: `<!-- include: agent-modes -->`. It defines both modes and the status block.
- Inside the body, write instructions as for an interactive conversation ("ask the user", "present the plan"). The partial overrides them in delegated mode. Do not write mode-specific branches of your own.
- An agent with no ask-user tool ends an interactive reply with a numbered "Questions for you" list. The partial covers this.
- Interactive mode ends with a `## Suggested next steps` list naming commands (for example "run `/tsh-review`"). Handoffs are text, never automatic invocations of other agents.
- **Callers** (orchestrators and commands whose `routes-to` is an agent) MUST include the `caller-status-handling` partial: `<!-- include: caller-status-handling -->`. It defines the delegation prompt, the handling of each status and the re-delegation cap.
- A command or orchestrator delegates by naming the agent ("delegate to the `tsh-code-reviewer` subagent") and passing explicit artifact paths.

## Orchestrator, Subagent or Skill

| Need | Choose | Why |
|---|---|---|
| A role with its own context, access level or model tier that does a bounded task | **Agent** (subagent) | Clean context, least-privilege access, parallelizable |
| A multi-step workflow that must delegate to several agents, ask the user between steps or own a loop | **Orchestrator** (skill, `type: orchestrator`) | Only the main thread can delegate and ask |
| Procedure or domain knowledge shared by several roles | **Knowledge skill** | Loaded by name; no duplication |
| A single small change that needs no isolation | Do it in the main thread; no new artifact | A subagent costs a cold start |

If the role needs to delegate, it is not an agent: make it an orchestrator and let the roles it coordinates be agents.

## Creation Process

```
Creation progress:
- [ ] Step 1: Define the agent's purpose
- [ ] Step 2: Decide agent, orchestrator or skill
- [ ] Step 3: Write the role and responsibilities
- [ ] Step 4: Choose access, model tier, shell and MCP servers
- [ ] Step 5: Choose the skills to load
- [ ] Step 6: Add constraints and output format (if needed)
- [ ] Step 7: Assemble from the template
- [ ] Step 8: Generate and validate
```

**Step 1: Define the agent's purpose.** Clarify: the role, the problems it solves, its focus area, which existing agents it works with, and what makes it distinct from them. Skip questions the conversation already answers.

**Step 2: Decide agent, orchestrator or skill.** Use the table above. Stop here if the answer is not an agent.

**Step 3: Write the role and responsibilities.** A role statement ("Role: You are a ... responsible for ..."), the responsibilities, and how the agent approaches work. No workflow steps; those belong in skills.

**Step 4: Choose access, model tier, shell and MCP servers.** Apply least privilege: `read-only` for reviewers and researchers, `shell: false` without a need for commands, only the MCP servers the role uses. In the body, add one short guideline per MCP server (when to use it, when not), and say when the agent should ask the user.

**Step 5: Choose the skills to load.** List them under "Skills Usage Guidelines" as `` `tsh-<name>` - when to load it ``. Put the one or two defining skills in `preload-skills`. Confirm every named skill exists.

**Step 6: Add constraints and output format.** Only when the role has limits or a fixed deliverable: what it must not produce, scope boundaries, and the escalation path ("return `NEEDS_ARCHITECT_DECISION`" rather than "ask the architect").

**Step 7: Assemble from the template.** Use `assets/agent.template.md`. Write `src/agents/<name>.md`, or the native files.

**Step 8: Generate and validate.** With a neutral source run `npm run generate && npm run check` and fix every error without adding baseline entries. Then walk through the checklist.

```
Validation:
- [ ] Frontmatter has name (== file name), description ("Use when ..."), type: agent, model-tier and access
- [ ] requires-mcp names only servers in src/mcp/servers.json
- [ ] preload-skills has at most 2 existing non-command skills, each named in the body
- [ ] Body includes <!-- include: agent-modes -->
- [ ] Body uses Markdown headings only; no tool-specific syntax (no @mentions, tool-call names or model names)
- [ ] No delegation: the body never tells the agent to delegate, spawn or hand over to another agent
- [ ] No workflow steps and no coding standards embedded
- [ ] Every skill referenced in the body exists; references are by name, never by path
- [ ] Follow-ups are a "Suggested next steps" list of commands
- [ ] Role is distinct from existing agents
- [ ] Connected Skills section present at the end
```

## Body Structure

Use Markdown headings for every section. One body format for all agents.

| Section | Required | Purpose |
|---|---|---|
| `# <Role Title>` | Yes | Title |
| `## Agent Role and Responsibilities` | Yes | Role statement, responsibilities, behavior |
| `<!-- include: agent-modes -->` | Yes | Dual-mode contract |
| `## Skills Usage Guidelines` | Yes | Skills to load and when |
| `## Tool Usage Guidelines` | Yes | Per MCP server and for asking the user: when to use, when not |
| `## Domain Standards` | No | Role-specific rules not covered by skills |
| `## Constraints` | No | Limits and anti-patterns |
| `## Output Format` | No | Shape of the deliverable |
| `## Suggested next steps` | No | Commands to show the user at the end of interactive mode |
| `## Connected Skills` | Yes | Related skills by name with the reason to load each |

## Connected Skills

- `tsh-creating-skills` - to write the skills the agent loads and to apply the shared naming and layout rules
- `tsh-creating-commands` - to write the command that routes to the agent
- `tsh-creating-rules` - to decide whether a standard belongs in project instructions instead of the agent
- `tsh-discovering-technical-context` - to discover existing agent patterns in the project before creating one
- `tsh-analyzing-codebase` - to analyze existing agents and the conventions to follow
