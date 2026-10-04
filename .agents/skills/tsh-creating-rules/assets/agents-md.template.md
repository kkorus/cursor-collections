<!--
  Project Instructions (AGENTS.md)
  ================================
  The project constitution: architecture, stack and fundamental conventions.
  Place at the repository root as AGENTS.md. Cursor and Codex read it natively.
  Claude Code reads CLAUDE.md, so create CLAUDE.md with the single line: @AGENTS.md
  Monorepos and packages with their own conventions may add a nested AGENTS.md in the subdirectory.

  Guidelines:
  - Keep it short and self-contained; every line competes for context in every session
  - Give the reason behind non-obvious rules
  - Show preferred and avoided patterns with code examples
  - Cover what linters and formatters do not enforce
  - Update it when the architecture or stack changes
  - Delete this comment block and every placeholder before finishing
-->

# <Project Name> Instructions

> This file is the project constitution. The rules below are hard constraints for AI assistants working in this repository.

## Architecture

<!-- Overall pattern (monorepo, modular monolith, ...), directory structure, responsibility of each top-level directory -->

## Technology Stack

<!-- Languages, frameworks and key libraries with exact versions -->

## Coding Conventions

<!-- Conventions NOT enforced by linters or formatters; architectural rules such as "business logic must not import from the UI layer" -->

## Error Handling

<!-- The project's error handling strategy -->

## Testing Strategy

<!-- Unit, integration and end-to-end frameworks and patterns -->

## Development Workflow

<!-- Task runners and the commands to build, test, lint, migrate; use these scripts instead of raw commands -->
