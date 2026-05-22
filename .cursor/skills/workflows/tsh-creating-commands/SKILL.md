---
name: tsh-creating-commands
description: "Create Cursor entry-point command skills (.cursor/skills/commands/<name>/SKILL.md) with disable-model-invocation: true. These act as slash-command workflow triggers that route work to the right context and agents. Use when creating, reviewing, or updating command entry-point skills."
---

# Creating Commands

Creates well-structured command skills for Cursor. Commands are SKILL.md files placed in `.cursor/skills/commands/` with `disable-model-invocation: true`, which prevents auto-invocation and makes them available as explicit slash-command entry points.

## Core Design Principles

<principles>

<separation-of-concerns>
A command skill (SKILL.md with `disable-model-invocation: true`) defines WHAT workflow to execute. It must NOT define WHO the agent is.

- **Command** = workflow trigger, workflow steps, tool configuration, expected outcome
- **Agent skills** = behavior, personality, responsibilities, and problem-solving approach (SKILL.md files in `.cursor/skills/agents/`)
- **Workflow skills** = reusable domain knowledge, step-by-step processes, templates (SKILL.md files in `.cursor/skills/workflows/`)

A command routes work to a context and configures the workflow. It must never embed domain knowledge that belongs in workflow skills or coding standards that belong in rules.
</separation-of-concerns>

<command-vs-workflow>
The key difference between a command and a workflow skill:

| Aspect | Command (`.cursor/skills/commands/`) | Workflow Skill (`.cursor/skills/workflows/`) |
|---|---|---|
| `disable-model-invocation:` | `true` — must be explicit slash command | `false` (or omitted) — auto-invoked based on context |
| Purpose | Entry point, user-triggered workflow start | Reusable process loaded by agents on demand |
| Trigger | User types `/command-name` | Agent recognizes the task context |
| Body | Workflow steps + skill references | Domain knowledge + patterns + procedures |

Use a command when the workflow is user-initiated and should not trigger automatically. Use a workflow skill when the agent should auto-detect when to apply it.

<slash-menu-clutter>
When a command has a **1:1 backing** process used only by that command, never auto-loaded elsewhere, and must not appear in `/`, put it in `commands/<name>/references/<topic>.md`.

When the process is domain knowledge loaded by a command or agents (e.g. `tsh-committing`, `tsh-code-reviewing`, `tsh-ui-verifying`), keep it as a **workflow skill** and reference it by name. Users invoke `/tsh-commit`, `/tsh-review`, or `/tsh-review-ui` — not the workflow directly. See `specifications/decisions/slash-menu-visibility-policy.decision.md`.
</slash-menu-clutter>

<workflow-focus>
A command skill must:

- Have `disable-model-invocation: true` in frontmatter
- Describe the **workflow steps** for the specific task
- Reference **workflow skills** the agent should load, or **`references/*.md`** under the command when the content must not appear as a separate slash entry
- Define the **expected outcome** of the workflow
- Optionally configure which agent context or tools apply

A command must NOT:

- Embed domain knowledge (that belongs in workflow skills)
- Duplicate coding standards (that belongs in `.cursor/rules/*.mdc`)
- Contain generic instructions not specific to the workflow
</workflow-focus>

</principles>

## Creation Process

Use the checklist below and track your progress:

```
Creation progress:
- [ ] Step 1: Define the command's purpose
- [ ] Step 2: Identify required workflow skills
- [ ] Step 3: Design the workflow steps
- [ ] Step 4: Define output expectations
- [ ] Step 5: Assemble the command skill using the template
- [ ] Step 6: Validate the command skill
```

**Step 1: Define the command's purpose**

Answer these questions before writing anything:
- What specific workflow does this command trigger? (e.g., research a task, implement a feature, run e2e tests)
- What is the expected outcome? (e.g., a research document, implemented code, test suite)
- What inputs does the workflow require? (e.g., Jira ID, plan file, feature description)
- Does this command depend on output from another command?
- What makes this workflow distinct from existing commands?

**Step 2: Identify required workflow skills**

Determine which workflow skills the command depends on:
- Review existing skills in `.cursor/skills/workflows/` to find relevant ones
- Each referenced skill will provide domain knowledge for the workflow
- List skills with a brief explanation of why they are needed for THIS workflow
- Do not reference skills that are not directly used in the workflow steps

**Step 3: Design the workflow steps**

Outline the workflow as a numbered sequence:
- Each step should be a clear, actionable instruction
- Steps should reference workflow skills where appropriate
- Include decision points and branching logic if the workflow is not purely linear
- Keep steps focused on WHAT to do, not HOW to think about it

**Step 4: Define output expectations**

Specify the expected deliverables of the workflow:
- File name conventions and output locations
- Document structure or template to follow (reference skill templates where applicable)
- Summary format if the workflow produces a report
- Success criteria — how to know the workflow is complete
- This step is optional if the workflow outcome is self-evident (e.g., implemented code)

**Step 5: Assemble the command skill using the template**

Create a new directory in `.cursor/skills/commands/` with the command name (gerund form, kebab-case), and create a `SKILL.md` file inside it. Use [`command.template.md`](./command.template.md) as the starting point (not the deprecated `prompt.template.md`).

The command skill MUST include `disable-model-invocation: true` in the frontmatter:

```yaml
---
name: tsh-my-command
description: "Brief description shown in slash command menu. Use when..."
disable-model-invocation: true
---
```

**Step 6: Validate the command skill**

Verify the command skill against this checklist:
- [ ] YAML frontmatter is valid and parseable
- [ ] `name` matches the directory name
- [ ] `description` is present and concise — shown in the slash command menu
- [ ] `disable-model-invocation: true` is present
- [ ] All workflow skills referenced exist in `.cursor/skills/workflows/`
- [ ] No domain knowledge embedded (reference workflow skills instead)
- [ ] No coding standards embedded (reference `.cursor/rules/*.mdc` instead)
- [ ] Workflow steps are clear, sequential, and actionable
- [ ] The command is distinct from existing commands and does not duplicate their workflows
- [ ] Connected Skills section present and references existing skills

## Command Skill Structure Reference

### Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `name` | **Yes** | Slash command identifier. Must match the directory name. |
| `description` | **Yes** | Short description shown in the slash command menu. Include "Use when..." trigger language. |
| `disable-model-invocation:` | **Yes** | Must be `true` for command skills. Prevents auto-invocation. |

### Body Sections

| Section | Required | Purpose |
|---|---|---|
| Goal statement | **Yes** | 1-2 sentences describing what the command accomplishes. |
| Required Skills | **Yes** | Workflow skills to load, with brief rationale for each. |
| Workflow | **Yes** | Numbered steps defining the workflow sequence. |
| Output expectations | No | File naming, document structure, success criteria. |
| Constraints | No | Workflow-specific limitations, anti-patterns, or scope boundaries. |
| Connected Skills | **Yes** | Links to related skills with brief rationale for each. |

## Connected Skills

- `tsh-creating-agents` - to understand agent skill patterns and ensure commands don't overlap with agent responsibilities
- `tsh-creating-skills` - to ensure command skill structure follows the canonical skill creation requirements
- `tsh-technical-context-discovering` - to understand existing command patterns and project conventions before creating a new one
- `tsh-codebase-analysing` - to analyze existing commands and identify patterns to follow
- `tsh-creating-rules` - to understand when coding standards belong in rule files rather than command definitions
