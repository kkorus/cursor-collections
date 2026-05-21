---
sidebar_position: 10
title: Technical Context Discovery
---

# Technical Context Discovery

**Folder:** `.cursor/skills/workflows/tsh-technical-context-discovering/`  
**Used by:** Architect, Code Reviewer, Software Engineer, E2E Engineer, Cursor Engineer, Context Engineer

Provides a systematic process for understanding project context before any code changes. Enforces a strict priority hierarchy to ensure consistency.

## Priority Hierarchy

```
1. Project instructions (*.mdc rules)     ← HIGHEST
2. Existing codebase patterns
3. External documentation (context7, OWASP, etc.)
4. General best practices                        ← LOWEST
```

:::warning Critical Rule
Never introduce new patterns unless explicitly requested by the user. Always replicate existing conventions.
:::

## Process

### Step 1: Discover Cursor Instructions

Search for instruction files:

- `.cursor/rules/cursor-instructions.md` — Global project instructions.
- `.cursor/rules/*.mdc` — Feature or module-specific instructions.

### Step 2: Analyse Codebase Patterns

Identify established patterns for:

| Area | What to Look For |
|---|---|
| **Architecture** | Folder structure, module boundaries, layering |
| **Code Style** | Naming conventions, formatting, imports |
| **Error Handling** | Error types, try/catch patterns, error responses |
| **Validation** | Input validation, schema validation, sanitization |
| **Testing** | Test framework, patterns, naming, coverage |
| **Database** | ORM usage, migration patterns, query styles |
| **API** | Endpoint structure, middleware, response format |
| **Configuration** | Environment variables, config files |

### Step 3: Consult External Documentation

Use Context7 tool for framework-specific documentation. Reference OWASP, SOLID, and industry standards.

### Step 4: Apply Decision Hierarchy

| Situation | Source of Truth |
|---|---|
| Instructions exist for this case | Follow instructions |
| No instructions, but pattern exists | Replicate the pattern |
| No instructions or patterns | Follow skill best practices |
| Conflict between sources | Instructions > Patterns > Best practices |

## Connected Skills

- `tsh-architecture-designing` — Design solutions following discovered conventions.
- `tsh-codebase-analysing` — Deep analysis of existing patterns.
- `tsh-sql-and-database-understanding` — Database-specific context discovery.
