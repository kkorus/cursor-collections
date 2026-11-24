---
name: tsh-creating-commands
description: >-
  Guides creating and reviewing slash commands for Cursor, Claude Code and Codex, from the neutral source (`type: command` skills with `routes-to` and `argument-hint`) or as native command skills. Covers the command schema, per-tool rendering, naming, the thin-router rule and the command template. Use when creating, reviewing or updating a user-invoked command, or when deciding whether a workflow belongs in a command.
type: skill
metadata:
  short-description: Schema, mapping and template for writing commands
---

# Creating Commands

Creates thin, user-invoked slash commands that work in Cursor, Claude Code and Codex. A command names WHAT the user wants and hands the work to an agent or orchestrator. It carries no domain knowledge.

## Core Design Principles

<principles>

<what-is-a-command>
A command is a skill with `type: command` (a `SKILL.md` that only the user can invoke by typing `/<name>`). Tools never load it on their own.

| Aspect | Command | Knowledge skill |
|---|---|---|
| `type` | `command` | `skill` |
| Invocation | User types `/<name>` | The agent recognizes the task, or loads it by name |
| Purpose | Entry point that routes work | Reusable domain knowledge and procedures |
| Body | Route, inputs, skills to load, short steps, output, guardrails | The actual procedure |
| Naming | `tsh-<verb>[-<object>]`, imperative | `tsh-<gerund>-<object>` |
</what-is-a-command>

<separation-of-concerns>
- **Command** = WHAT: the trigger, the route, the inputs and the expected outcome.
- **Agent** or **orchestrator** = WHO: the role that does the work. See the `tsh-creating-agents` skill.
- **Knowledge skill** = HOW: the procedure and domain knowledge, loaded by name. See the `tsh-creating-skills` skill.
- **Project instructions** = RULES: coding standards and conventions. See the `tsh-creating-rules` skill.

A command never embeds domain knowledge or coding standards. If a procedure is needed by a command and by agents, move it into a knowledge skill and load it by name. If it is used by exactly one command and must not appear in the `/` menu, put it in the command's own `references/` folder.
</separation-of-concerns>

<thin-router>
Keep a command short (about 40 lines). Its steps say what to hand over and what to return, not how to think. A command without `routes-to` must be `standalone: true`, which is reserved for commands that run in the main thread by design (for example a commit command).
</thin-router>

</principles>

## Where Commands Live

- **The repository has `src/skills/` and `scripts/generate.mjs`:** write `src/skills/<name>/SKILL.md` with `type: command`, then run `npm run generate && npm run check`. Never edit the generated trees by hand.
- **No neutral source:** write a native command skill for each tool (see the matrix).

## Command Source Schema

A command uses the skill schema of the `tsh-creating-skills` skill, with these command-only keys. Unknown keys fail `npm run check`.

```yaml
---
name: tsh-review               # REQUIRED. == folder name. Imperative verb form.
description: >-                # REQUIRED. Third person, with "Use when ...".
  Reviews a change set or an implemented plan ... Use when the user types /tsh-review or ...
type: command                  # REQUIRED
routes-to: tsh-code-reviewer   # REQUIRED unless standalone: true. An existing agent or orchestrator.
standalone: false              # true = runs in the main thread without routing (tsh-commit only).
argument-hint: "[task-id | plan path | free-text scope]"   # optional. Hint shown after the command name.
requires-mcp: [atlassian]      # optional. Servers from src/mcp/servers.json.
metadata:
  short-description: "Review an implementation against the plan"   # REQUIRED by lint, <= 120 chars
---
<body>
```

- `routes-to` names an agent (the command delegates to that subagent) or an orchestrator (the command loads that skill in the main thread). It must resolve.
- A command routed to an agent includes `<!-- include: caller-status-handling -->` so it can read the agent's status block. An orchestrator includes it itself, so a command routed to an orchestrator does not.
- The body refers to arguments as "the user's input after the command". It never uses `$ARGUMENTS`.
- Commands must not be preloaded into agents.

## Native Output per Tool

| Tool | Where | Rendered as |
|---|---|---|
| Cursor | `.agents/skills/<name>/SKILL.md` | Skill with `disable-model-invocation: true`; listed in the `/` menu |
| Claude Code | `.claude/skills/<name>/SKILL.md` | Skill with `disable-model-invocation: true` and `argument-hint` |
| Codex | `.agents/skills/<name>/SKILL.md` and `agents/openai.yaml` | Skill plus `policy.allow_implicit_invocation: false`. Custom prompts are deprecated in Codex, so a skill is the command form |

`routes-to`, `standalone`, `type` and `requires-mcp` are build-time keys and do not appear in the output; `requires-mcp` becomes a `compatibility` line. Without a generator, write the flag and the hint by hand for each tool and state the route in the body ("Delegate to the `tsh-code-reviewer` subagent", or "Load and follow the `tsh-engineering-manager` skill").

## Creation Process

```
Creation progress:
- [ ] Step 1: Define the command's purpose
- [ ] Step 2: Choose the route
- [ ] Step 3: Identify the skills to load
- [ ] Step 4: Define inputs, steps and output
- [ ] Step 5: Assemble from the template
- [ ] Step 6: Generate and validate
```

**Step 1: Define the command's purpose.** Clarify what the command triggers, the expected outcome, the inputs (task ID, plan file, description), whether it depends on another command's output, and what makes it distinct from existing commands.

**Step 2: Choose the route.** Pick the agent or orchestrator that does the work. Use an orchestrator if the work needs several agents or user confirmations between steps; an agent otherwise. If none fits, create one first (`tsh-creating-agents`). Do not create a command for a job no role owns.

**Step 3: Identify the skills to load.** List only the knowledge skills the route needs for THIS workflow, each with a reason. Reference them by name. Confirm they exist.

**Step 4: Define inputs, steps and output.** Inputs: what to collect from the user's message and what to ask for if missing. Steps: three to six numbered hand-over instructions. Output: file names and locations, document structure, and how to know the work is done. Omit the output section if the outcome is self-evident.

**Step 5: Assemble from the template.** Use `assets/command.template.md`. Name the command `tsh-<verb>[-<object>]` with an imperative verb (`tsh-review`, `tsh-create-custom-skill`). Do not use an `-ing` form; those names are for knowledge skills.

**Step 6: Generate and validate.** With a neutral source run `npm run generate && npm run check`, fix every error and add no baseline entries. Then walk through the checklist.

```
Validation:
- [ ] Frontmatter: name == folder name, imperative verb name, type: command
- [ ] routes-to resolves to an agent or orchestrator (or standalone: true)
- [ ] description says what it does and "Use when ..." in third person
- [ ] argument-hint describes the expected input (if the command takes input)
- [ ] metadata.short-description is set (120 characters or fewer)
- [ ] An agent-routed command includes the caller-status-handling partial
- [ ] Every skill it names exists and is referenced by name, not by path
- [ ] No domain knowledge and no coding standards embedded
- [ ] Body follows the recommended structure (Route, Inputs, Required Skills, Steps, Output, Guardrails) or omits a section deliberately
- [ ] Command is distinct from existing commands
- [ ] No tool-specific syntax in the body
```

## Body Structure

This is a recommended structure, not a lint rule; existing commands may omit sections. Do not report a missing section as a must-fix finding.

| Section | Status | Purpose |
|---|---|---|
| Goal line under the title | Recommended | One sentence on what the command accomplishes |
| Route | Recommended | The agent or orchestrator that does the work |
| Inputs | Recommended | What to collect from the user's input and when to ask |
| Required Skills | Recommended | Knowledge skills to load, with the reason for each |
| Steps | Recommended | Numbered hand-over steps |
| Output | No | Deliverables, locations, completion criteria |
| Guardrails | Recommended | Workflow-specific limits and scope boundaries |

## Connected Skills

- `tsh-creating-agents` - to create the agent a command routes to and keep roles out of commands
- `tsh-creating-skills` - to apply the shared skill schema, naming and layout rules
- `tsh-creating-rules` - to decide whether a standard belongs in project instructions instead of a command
- `tsh-discovering-technical-context` - to discover existing command patterns before creating one
- `tsh-analyzing-codebase` - to analyze existing commands and the conventions to follow
