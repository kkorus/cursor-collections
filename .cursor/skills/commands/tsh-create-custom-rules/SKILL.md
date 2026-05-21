---
name: tsh-create-custom-rules
description: Create custom Cursor rules (.cursor/rules/*.mdc or cursor-instructions.md). Analyzes existing project conventions, determines appropriate rule type and scope, creates the rules file, and validates against best practices. Use when the user types /tsh-create-custom-rules or asks to create coding rules or instructions for Cursor.
disable-model-invocation: true
---
# /tsh-create-custom-rules

Load and follow the tsh-cursor-orchestrator agent skill. Create custom rules for Cursor. There are two types: repository-level rules (`cursor-instructions.md`) that apply to all Cursor interactions, and file-scoped rules (`.mdc` files with `applyTo` glob patterns in `.cursor/rules/`) that target specific files or directories. The user's message following this skill may contain specific requirements or conventions to encode.

## Required Skills

Before starting, load and follow these skills:
- `tsh-creating-rules` - for rules file creation workflow, type selection, scope decisions, and validation checklist
- `tsh-technical-context-discovering` - for discovering project conventions and workspace patterns before creating
- `tsh-codebase-analysing` - for analyzing workspace for existing coding conventions and patterns

## Workflow

1. **Research workspace conventions**: Analyze the workspace for existing coding standards and conventions:
   - Project structure and technology stack
   - Existing coding patterns and standards
   - Any existing rule files (`.cursor/rules/*.mdc` or `cursor-instructions.md`)
   - Note: this repository currently has NO rule files of either type
2. **Determine rule type**: Help the user choose the appropriate rule type:
   - **Repo-level** (`cursor-instructions.md`): applies to all Cursor interactions in the workspace
   - **File-scoped** (`.mdc` files in `.cursor/rules/` with `applyTo` glob patterns): applies only to interactions involving matching files
   - Guide the decision based on the user's needs and scope
3. **Clarify requirements**: Determine what conventions, standards, or behaviors to encode:
   - Coding standards and style preferences
   - Framework-specific patterns and conventions
   - Behavioral guidelines for Cursor in this workspace
   - If the user's message already contains requirements, confirm understanding before proceeding
4. **Create the rules file**: Create the rules file with appropriate type, scope, and content. Apply the `tsh-creating-rules` skill workflow for structure and validation.
5. **Review and validate**: Review the created rules against best practices:
   - Verify scope is appropriate for the rule type
   - Confirm guidelines are clear and actionable for Cursor
   - Check that file-scoped `applyTo` patterns match intended files (if applicable)

## Guidelines

- **Repo-level rules** (`cursor-instructions.md`): Place in `.cursor/` directory. Apply to all Cursor interactions — use for project-wide coding standards, naming conventions, architecture decisions.
- **File-scoped rules** (`.mdc` files with `applyTo`): Place in `.cursor/rules/` directory. Use `applyTo` glob patterns to target specific files or directories.
- This repository currently has NO rule files — the user is starting from scratch. Communicate this context during the research step.

If the user attaches files or provides a description, use them as input for rule design.

When in doubt about the rule type or scope, ask the user for clarification rather than guessing.
