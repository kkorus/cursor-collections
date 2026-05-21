---
name: tsh-create-custom-command
description: Create a new Cursor Agent Skill command (.cursor/skills/commands/<name>/SKILL.md). Analyzes existing commands for patterns, identifies the right agent to route to, creates the skill file, and validates the workflow end-to-end. Use when the user types /tsh-create-custom-command or asks to create a new Cursor command or invocation skill.
disable-model-invocation: true
---
# /tsh-create-custom-command

Load and follow the tsh-cursor-orchestrator agent skill. Create a new custom command skill for Cursor. Every command skill must specify an agent routing and model preference in its frontmatter — the orchestrator handles research of existing commands and agents, design decisions, skill file creation, and end-to-end validation. The user's message following this skill may contain specific requirements or a description of the desired command.

## Required Skills

Before starting, load and follow these skills:
- `tsh-creating-commands` - for command skill creation workflow, templates, and validation checklist
- `tsh-technical-context-discovering` - for discovering project conventions and workspace patterns before creating
- `tsh-codebase-analysing` - for analyzing existing commands for structural patterns and routing conventions

## Workflow

1. **Research existing commands**: Analyze commands in `.cursor/skills/commands/` for patterns and conventions:
   - Frontmatter format (name, description, disable-model-invocation fields)
   - Body structure (intro with agent routing, Required Skills, Workflow, optional sections)
   - Skill reference format and conventions
   - Body size and level of detail
2. **Research available agents**: Analyze agents in `.cursor/skills/agents/` to determine the best routing target for the new command:
   - Available agent names and their responsibilities
   - Which agent is best suited for the command's workflow
   - Existing agent-to-command routing patterns
3. **Clarify requirements**: Determine the command's design parameters with the user:
   - Purpose, target workflow, and expected user interaction
   - Which agent should handle the command (based on agent research)
   - Required skills the command should reference
   - If the user's message already contains requirements, confirm understanding before proceeding
4. **Create the command file**: Create the `SKILL.md` file in `.cursor/skills/commands/<name>/` with correct agent routing and skill references. Apply the `tsh-creating-commands` skill workflow for structure and validation.
5. **Review and validate**: Review the created command against best practices:
   - Verify the routing agent exists in `.cursor/skills/agents/`
   - Confirm structural consistency with existing commands
   - Validate end-to-end workflow (command → agent → skills → output)

## Important

- Every command MUST reference an agent in its body (e.g., "Load and follow the tsh-engineering-manager agent skill") — this is the established routing pattern.
- Research available agents in `.cursor/skills/agents/` before choosing the routing target for the new command.

If the user attaches files or provides a description, use them as input for command design.

When in doubt about design decisions, ask the user for clarification rather than guessing.
