---
name: tsh-creating-skills
description: Guides creating and reviewing skills (SKILL.md) for Cursor, Claude Code and Codex, from the neutral source schema in `src/skills/` or as native Agent Skills files. Covers skill types, naming, descriptions, body structure, support-file layout, per-tool output and validation. Use when creating, reviewing or updating a skill, command, orchestrator or internal step, or when discussing skill design and organization.
type: skill
metadata:
  short-description: Schema, naming, layout and templates for writing skills
---

# Creating Skills

Creates well-structured, reusable skills that work in Cursor, Claude Code and Codex. All three tools read the Agent Skills format (a folder with `SKILL.md`), so one well-written skill serves every tool.

## Core Design Principles

<principles>

<what-is-a-skill>
A skill is a folder containing a `SKILL.md` file with YAML frontmatter and Markdown instructions. Skills provide **procedural knowledge** (workflows, domain context, templates, reference material) that an agent loads on demand.

- **Skills** define HOW to perform a task. They never define who the agent is.
- **Agents** (subagents) define WHO: role, responsibilities, access. They load skills by name. See the `tsh-creating-agents` skill.
- **Commands** are skills with `type: command`: thin user entry points that route to an agent or orchestrator. See the `tsh-creating-commands` skill.
- **Project instructions** (`AGENTS.md`, rule files) define RULES that always apply. See the `tsh-creating-rules` skill.
</what-is-a-skill>

<conciseness>
The context window is shared with the conversation, other skills and the user's request. Assume the model is already smart: add only context it does not have. For each paragraph ask whether it justifies its token cost.
</conciseness>

<progressive-disclosure>
1. **Discovery** (~100 tokens): only `name` and `description` are loaded for every skill. This is how the agent decides what to activate.
2. **Activation** (under 5000 tokens recommended): the `SKILL.md` body loads when the skill triggers.
3. **Resources** (on demand): `references/`, `assets/` and `scripts/` load only when the workflow needs them.

Keep the `SKILL.md` body at or under **500 lines**. Move detail into support files.
</progressive-disclosure>

<reference-by-name>
Refer to other skills by name ("load the `tsh-reviewing-code` skill"). Never by path, never with a `SKILL.md` link, never with a `../` link. The tools resolve names; paths differ per tool and break when a skill is installed elsewhere.
</reference-by-name>

</principles>

## Where Skills Live

### Source of truth

- **The repository has a `src/skills/` directory and `scripts/generate.mjs`:** `src/` is the only source. Create `src/skills/<name>/SKILL.md` with the neutral frontmatter below, then run `npm run generate` and `npm run check`. Never edit the generated trees by hand (`.agents/skills/tsh-*`, `.claude/skills/tsh-*`); the next generation overwrites them and `npm run check` fails on drift.
- **No neutral source:** write native Agent Skills files directly (see the matrix below).

### Source layout

```
src/skills/<name>/
├── SKILL.md              # Required: frontmatter + instructions
├── references/           # Optional: reading material, worked examples (*.example.md)
├── assets/               # Optional: fill-in output templates (*.template.md)
└── scripts/              # Optional: executable code
```

- A skill directory contains only `SKILL.md`, `references/`, `assets/` and `scripts/`. Any other entry fails `npm run check`.
- Fill-in templates go to `assets/<name>.template.md`. Worked examples go to `references/<name>.example.md`.
- Link only to the skill's own support files, one level deep (`references/x.md`, not `references/sub/x.md`).
- A file in `references/` or `assets/` longer than 100 lines starts with a `## Contents` section.
- No cross-skill file references. Load the other skill by name instead.
- Name files descriptively (`form-validation-rules.md`, not `doc2.md`) and use forward slashes.

### Native output per tool

The generator renders every source skill into two byte-identical trees, so each tool finds it natively.

| Tool | Skill location | Notes |
|---|---|---|
| Cursor | `.agents/skills/<name>/` (also reads `.claude/skills/`) | Dedupes by name; a same-name skill resolves to `.claude/skills` |
| Claude Code | `.claude/skills/<name>/` | Reads only this tree |
| Codex | `.agents/skills/<name>/` | Reads only this tree; per-skill policy in `agents/openai.yaml` |

How the neutral `type` is rendered:

| `type` | Cursor | Claude Code | Codex |
|---|---|---|---|
| `skill` | auto-invocable | auto-invocable | implicit invocation allowed |
| `command` | `disable-model-invocation: true` | `disable-model-invocation: true` | `agents/openai.yaml` with `policy.allow_implicit_invocation: false` |
| `internal`, `orchestrator` | plain skill (cannot be hidden from the `/` menu) | `user-invocable: false` (hidden, still loadable by name) | plain skill |

Without a generator, write the native frontmatter yourself: the Agent Skills fields (`name`, `description`, `license`, `compatibility`, `metadata`, experimental `allowed-tools`) work everywhere. Tool-specific keys are additive: `disable-model-invocation` and `paths` (Cursor and Claude), `user-invocable`, `argument-hint`, `model`, `effort` (Claude). For Codex, invocation policy and UI metadata go into `agents/openai.yaml`. Unknown keys are ignored by tools that do not support them, but verify against the tool's documentation before relying on one.

## Skill Source Schema

Exact frontmatter of `src/skills/<name>/SKILL.md`. Unknown keys fail `npm run check`.

```yaml
---
name: tsh-implement            # REQUIRED. == folder name. ^tsh-[a-z0-9]+(-[a-z0-9]+)*$, <= 64 chars
description: >-                # REQUIRED. <= 1024 chars (lint warns > 500). Third person: what it does + "Use when ...".
  Implements a task end to end from a Jira ID or description ... Use when ...
type: command                  # REQUIRED. skill | command | internal | orchestrator
routes-to: tsh-engineering-manager   # command only. REQUIRED unless standalone: true. Must name an existing agent or orchestrator.
standalone: false              # command only. true = runs in the main thread without routing (tsh-commit only).
argument-hint: "<task-id | description>"   # optional, command only
paths: ["**/*.tf"]             # optional, type skill only. File-glob activation (Cursor + Claude).
requires-mcp: [atlassian, figma]     # optional. Each must exist in src/mcp/servers.json.
license: MIT                   # optional (Agent Skills standard)
metadata:                      # optional, string -> string (Agent Skills standard)
  short-description: "Implement a task end to end"   # REQUIRED by lint, <= 120 chars; Codex skill listing
targets:                       # optional escape hatch, merged LAST into the rendered output
  cursor: {}                   # extra SKILL.md keys (e.g. icon, color)
  claude: {}                   # extra SKILL.md keys (e.g. allowed-tools, model, effort)
  codex: {}                    # extra agents/openai.yaml keys (commands only, e.g. interface.*)
---
<body: Markdown. May contain <!-- include: <partial-name> --> lines. Skills are referenced by name only.>
```

- `type`, `routes-to`, `standalone`, `requires-mcp` and `targets` never appear in the generated output. `requires-mcp` becomes `compatibility: "Requires MCP servers: a, b"`.
- `<!-- include: <partial> -->` pulls in shared text from `src/partials/<partial>.md` at build time. Use it instead of copying shared blocks.
- Bodies never use `$ARGUMENTS`. Say "the user's input after the command".

### Choosing the type

| Type | Use for | Who invokes it |
|---|---|---|
| `skill` | Knowledge or a reusable procedure | Any agent, by name, or auto-matched by `description` |
| `command` | A `/tsh-<verb>` entry point: thin, no domain knowledge, `routes-to` an agent or orchestrator | The user only |
| `orchestrator` | A main-thread workflow that delegates to subagents; loaded by name from a command | A command |
| `internal` | A step loaded by an orchestrator or agent by name | An orchestrator or agent |

For `internal` and `orchestrator`, start the description with "Internal step of `/tsh-...`: load only when a tsh command or orchestrator instructs it." Cursor and Codex cannot hide these skills, and this prefix limits accidental auto-invocation.

Layering: commands (thin) route to orchestrators (main thread) or subagents (one delegation level), and both load knowledge skills by name. If a command and an agent both need the same procedure, move the procedure into a knowledge skill.

## Skill Creation Process

```
Creation progress:
- [ ] Step 1: Define the skill's purpose and type
- [ ] Step 2: Choose the name
- [ ] Step 3: Write the description
- [ ] Step 4: Write the body
- [ ] Step 5: Create supporting files (if needed)
- [ ] Step 6: Assemble, generate and validate
```

**Step 1: Define the skill's purpose and type**

Clarify with the user, in a single batch, only what is missing:

1. **What task does the skill perform?** The core activity.
2. **What triggers it?** Which requests or contexts should match.
3. **What does it produce?** A document, code changes, a report.
4. **What makes it distinct?** Compare against the existing skills (list them).
5. **Which type?** Use the table above.

If the conversation already answers these, proceed without asking.

**Step 2: Choose the name**

<naming-conventions>

| Type | Formula | Examples |
|---|---|---|
| `skill` | `tsh-<gerund>-<object>`, gerund first; a single gerund is fine | `tsh-reviewing-code`, `tsh-analyzing-codebase`, `tsh-committing` |
| `command`, `internal` | `tsh-<verb>[-<object>]`, imperative | `tsh-implement`, `tsh-implement-task`, `tsh-create-custom-skill` |
| `orchestrator` | `tsh-<role>`, noun | `tsh-engineering-manager`, `tsh-business-analyst` |

| Rule | Requirement |
|---|---|
| Prefix | Starts with `tsh-` (project prefix; use your own project prefix in other repositories) |
| Characters | Lowercase letters, digits and single hyphens; no leading, trailing or double hyphens |
| Length | At most 64 characters; shorter names are easier to type as `/<name>` |
| Spelling | American (`analyzing`, `optimizing`) |
| Directory | Equals the folder name exactly |
| Collisions | No skill name may equal an agent name |

Avoid vague names (`helper`, `utils` after the prefix), overly generic ones (`data`, `files`), and noun phrases for knowledge skills (`task-analysis` instead of `analyzing-requirements`). Keep one form across the collection. When several valid names exist, offer two or three to the user and mark the clearest.

</naming-conventions>

**Step 3: Write the description**

<description-guidelines>

The `description` is the primary discovery mechanism: the agent reads every description to choose a skill.

| Rule | Requirement |
|---|---|
| Length | 1-1024 characters, non-empty; aim for 500 or fewer |
| Point of view | Third person; never "I", "you" or "we" |
| Content | What the skill does AND when to use it; `skill` and `command` types contain "Use when" |
| Keywords | Specific trigger terms that distinguish it from neighbors |

Formula: `{What it does, core capabilities}. Use when {triggers and contexts}.`

```yaml
# Good
description: Extracts text and tables from PDF files, fills PDF forms, and merges PDFs. Use when working with PDF documents or when the user mentions forms or document extraction.

# Too vague: the agent cannot tell when to activate it
description: Helps with documents.

# Wrong point of view
description: I can help you process Excel files.
```

Also set `metadata.short-description` (120 characters or fewer). Codex shows it in the skill listing.

</description-guidelines>

**Step 4: Write the body**

Use the `assets/skill.template.md` template.

| Section | Required | Purpose |
|---|---|---|
| Introduction | Yes | One or two sentences on what the skill does |
| Principles | No | Foundational rules, in `<principles>` tags |
| Process / Workflow | Yes | Trackable checklist plus detailed steps |
| Reference tables | No | Quick-reference rules or conventions |
| Connected Skills | Yes | Related skills by name, with the reason to load each |

Guidelines:

- Use examples rather than explanations; see `references/reviewing-code.example.md` for a complete, concise skill.
- Provide a default approach, not a menu of options. Add alternatives only when a condition requires them.
- Choose one term per concept and keep it.
- No dates or version-dependent guidance; put deprecated approaches in an "Old patterns" section.
- For complex tasks give a numbered checklist; for quality-critical tasks add a validate, fix, repeat loop.
- Use XML-like tags for principles, rules and specifications; use Markdown for steps, tables and lists.
- Use no tool-specific syntax in the body of a neutral source skill: no `@agent` mentions, tool-call names or model names. Say "ask the user", "search the codebase", "the `tsh-<name>` subagent".
- Match specificity to fragility:

| Freedom | Use when | Example |
|---|---|---|
| High (text instructions) | Several approaches are valid | Code review guidelines |
| Medium (templates, pseudocode) | A preferred pattern exists | Report with customizable sections |
| Low (exact scripts) | The operation is fragile | Database migrations |

**Step 5: Create supporting files**

| File type | Location | Purpose |
|---|---|---|
| Fill-in template | `assets/<name>.template.md` | Output format the agent fills in |
| Worked example | `references/<name>.example.md` | Input/output example |
| Reading material | `references/<topic>.md` | Specs, domain knowledge, loaded when needed |
| Script | `scripts/<name>` | Executed, not read into context |

Say whether the agent should **run** a script or **read** a file. For patterns of workflows, checklists and feedback loops, see [common-patterns](references/common-patterns.md).

**Step 6: Assemble, generate and validate**

1. Present the proposed `name`, `description`, `type` and workflow summary to the user and ask to confirm.
2. Write the file (`src/skills/<name>/SKILL.md`, or the native path for the chosen tools).
3. With a neutral source: run `npm run generate && npm run check`, then fix every error. Do not add baseline entries.
4. Walk through the checklist.

```
Validation:
- [ ] `name` matches the folder and the naming rules of its type, and starts with the project prefix
- [ ] `type` is set; a command has `routes-to` (or `standalone: true`)
- [ ] `description` says what and when, in third person, with trigger keywords ("Use when")
- [ ] `metadata.short-description` is set (120 characters or fewer)
- [ ] `requires-mcp` lists only servers defined in `src/mcp/servers.json`
- [ ] Body is at most 500 lines and starts with a one or two sentence introduction
- [ ] Process has a trackable checklist
- [ ] Only context the model lacks; consistent terminology; no dates
- [ ] No tool syntax, no path references to other skills, no `../` links
- [ ] Support files sit in `references/`, `assets/` or `scripts/`, one level deep; long ones start with `## Contents`
- [ ] Connected Skills section names existing skills
- [ ] `npm run check` passes (where a generator exists)
- [ ] Tested with a realistic request
```

## Anti-Patterns to Avoid

| Anti-pattern | Why it is harmful | Fix |
|---|---|---|
| Over-explaining known concepts | Wastes tokens | Explain only project or domain knowledge |
| Many options | The agent picks the wrong one | One default, escape hatch for edge cases |
| Deeply nested references | Files at depth 2 or more get partially read | Keep links one level deep |
| Loading another skill by path | Paths break per tool and per install | "Load the `tsh-<name>` skill" |
| Editing generated trees | Overwritten; `npm run check` fails | Edit `src/`, run the generator |
| Domain knowledge in a command | Commands become untestable and duplicated | Move it into a knowledge skill |
| Persona in a skill | Blurs agent and skill roles | Put the role in the agent |
| Vague file names | `doc2.md`, `helpers.md` | Descriptive names |
| Magic numbers in scripts | The agent cannot pick the value | Document each: `TIMEOUT = 30  # requests finish within 30s` |

## Connected Skills

- `tsh-creating-agents` - to decide what belongs in an agent instead of a skill and to design agents that load this skill
- `tsh-creating-commands` - to write the thin `type: command` entry point for a skill
- `tsh-creating-rules` - to decide whether guidance belongs in project instructions instead of a skill
- `tsh-discovering-technical-context` - to discover existing skill conventions in the project before creating one
- `tsh-analyzing-codebase` - to analyze existing skills and the conventions to follow
