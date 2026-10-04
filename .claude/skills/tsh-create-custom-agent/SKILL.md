---
name: tsh-create-custom-agent
description: Create a new Cursor Agent Skill (.cursor/skills/agents/<name>/SKILL.md). Analyzes existing agents for patterns, guides through design decisions, creates the agent file, and validates against best practices. Use when the user types /tsh-create-custom-agent or asks to create a new agent.
disable-model-invocation: true
metadata:
  short-description: Create a new custom agent definition
---
<!-- Generated from src/skills/tsh-create-custom-agent/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-create-custom-agent

Load and follow the `tsh-ai-customization-orchestrator` skill. Create a new custom agent for Cursor. The orchestrator handles research of existing agents, design decisions, agent file creation, and review against best practices. The user's message following this skill may contain specific agent requirements or a description of the desired agent.

## Required Skills

Before starting, load and follow these skills:
- `tsh-creating-agents` - for agent file creation workflow, templates, and validation checklist
- `tsh-discovering-technical-context` - for discovering project conventions and workspace patterns before creating
- `tsh-analyzing-codebase` - for analyzing existing agents for structural patterns and naming conventions

## Workflow

1. **Research existing agents**: Analyze agents in `.cursor/skills/agents/` for patterns and conventions:
   - Naming conventions and file placement
   - Structural patterns (sections, headings, formatting)
   - Tool configurations and skill references
   - Behavioral constraints and personality definitions
2. **Clarify requirements**: Determine the agent's design parameters with the user:
   - Purpose and primary responsibilities
   - Target workflows and use cases
   - Tool needs and skill references
   - If the user's message already contains requirements, confirm understanding before proceeding
3. **Design the agent**: Make design decisions based on research findings and user input:
   - Agent name, description, and personality
   - Tool list and skill references
   - Behavioral constraints and operational boundaries
   - How the agent fits within the existing agent ecosystem
4. **Create the agent file**: Create the `SKILL.md` file in `.cursor/skills/agents/<name>/` following established conventions. Apply the `tsh-creating-agents` skill workflow for structure and validation.
5. **Review and validate**: Review the created agent against best practices:
   - Verify skill and tool references point to valid targets
   - Confirm structural consistency with existing agents
   - Check that the agent integrates well with the existing ecosystem

If the user attaches files or provides a description, use them as input for agent design.

Follow the conventions established by existing agents in the workspace.

When in doubt about design decisions, ask the user for clarification rather than guessing.
