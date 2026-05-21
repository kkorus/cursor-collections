---
name: tsh-creating-prompts
description: "Create Cursor command skills (.cursor/skills/commands/<name>/SKILL.md) that act as slash-command entry points. Covers naming, routing decisions (which agent handles the workflow), required skills selection, workflow step design, and validation. Use when creating, reviewing, or updating command entry-point skills, or when deciding whether a new workflow should be a command, workflow skill, or agent."
---

# Creating Prompts

Creates well-structured command skills that serve as slash-command entry points in Cursor. Enforces the command pattern: `disable-model-invocation: true`, clear workflow steps, and explicit skill references.

## When to Create a Command vs. Other Artifact Types

| Situation | Create this |
|---|---|
| User explicitly triggers a workflow (`/tsh-implement`, `/tsh-debug`) | **Command** in `.cursor/skills/commands/` |
| Agent loads reusable domain knowledge automatically | **Workflow skill** in `.cursor/skills/workflows/` |
| Defining who an agent is, its persona and responsibilities | **Agent** in `.cursor/skills/agents/` |
| Enforcing coding standards or project conventions | **Rule** in `.cursor/rules/` |

A command is appropriate when: the workflow is user-initiated, has a clear start and end, and should NOT trigger automatically from context.

## Creation Process

```
Creation progress:
- [ ] Step 1: Define the command's purpose
- [ ] Step 2: Choose the routing agent
- [ ] Step 3: Select required workflow skills
- [ ] Step 4: Design the workflow steps
- [ ] Step 5: Define output expectations (if applicable)
- [ ] Step 6: Assemble and validate
```

**Step 1: Define the command's purpose**

Answer before writing:
- What workflow does this command trigger?
- What input does it accept (Jira ID, file path, description)?
- What does it produce (a file, code changes, a report)?
- Is it distinct from existing commands? (Check `.cursor/skills/commands/`)

**Step 2: Choose the routing agent**

Most commands route to an existing agent. Pick the agent whose role matches the workflow:

| Workflow type | Route to |
|---|---|
| Feature implementation | `tsh-engineering-manager` |
| Architecture / planning | `tsh-architect` |
| Code review | `tsh-code-reviewer` |
| UI verification | `tsh-ui-reviewer` |
| Infrastructure / DevOps | `tsh-devops-engineer` |
| Cursor customization | `tsh-cursor-orchestrator` |
| General analysis | `tsh-architect` |
| Consultation / architectural decision | `tsh-ask` (self-contained, no agent routing needed) |

State the routing at the top of the command body: "Load and follow the `{agent}` agent skill."

**Step 3: Select required workflow skills**

List only skills directly used in the workflow steps. Do not list skills the agent already loads by default.

**Step 4: Design the workflow steps**

Write numbered steps. Each step must be:
- A clear action ("Read X", "Delegate to Y", "Save result as Z")
- Free of domain knowledge (domain belongs in workflow skills)
- Specific about when to branch or make decisions

**Step 5: Define output expectations**

Specify if the command produces a file:
- File naming convention (e.g., `{topic}.decision.md`)
- Output location (e.g., `specifications/decisions/`)
- Document structure (reference a template in a workflow skill if one exists)

Omit this step if the output is self-evident (e.g., implemented code changes).

**Step 6: Assemble and validate**

Required frontmatter:

```yaml
---
name: tsh-{command-name}
description: "What it does. Use when..."
disable-model-invocation: true
---
```

Validation checklist:
```
- [ ] `name` matches the directory name
- [ ] `description` includes "Use when..." trigger language
- [ ] `disable-model-invocation: true` is present
- [ ] All referenced workflow skills exist in `.cursor/skills/workflows/`
- [ ] No domain knowledge embedded in the command body
- [ ] No coding standards embedded (belongs in `.cursor/rules/`)
- [ ] Workflow steps are numbered and actionable
- [ ] Command is distinct from existing commands
```

## Connected Skills

- `tsh-creating-commands` — canonical reference for command skill structure and the command vs. workflow skill distinction
- `tsh-creating-skills` — general skill creation process, naming conventions, description guidelines
- `tsh-creating-agents` — when deciding whether the workflow needs a new agent vs. routing to an existing one
- `tsh-technical-context-discovering` — to check existing commands and conventions before creating a new one
