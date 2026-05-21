---
sidebar_position: 2
title: Architecture Design
---

# Architecture Design

**Folder:** `.cursor/skills/workflows/tsh-architecture-designing/`  
**Used by:** Architect

Provides a structured 5-step process for designing solution architecture and creating detailed implementation plans.

## Process

### Step 1: Understand the Business Goal

Analyze the task requirements and business context to ensure the solution addresses the actual problem.

### Step 2: Analyse the Codebase

Use the `tsh-codebase-analysing` and `tsh-implementation-gap-analysing` skills to understand existing architecture and identify what needs to change.

### Step 3: Ask Clarifying Questions

Identify ambiguities and missing information before committing to a design.

### Step 4: Design the Solution

Create the architecture following established patterns and principles.

### Step 5: Document the Plan

Produce a structured implementation plan (`plan.example.md` template) with phased, checklist-style tasks.

## Enforced Patterns

| Category | Patterns |
|---|---|
| **Software Design** | DRY, KISS, DDD, TDD, CQRS, SOLID |
| **Architecture** | Hexagonal, Layered, Modular |
| **UI/UX** | Atomic Design, WCAG |
| **Security** | OWASP TOP10 |

## Plan Requirements

- Each phase is independently runnable with quality gates.
- Tasks have `[CREATE]`, `[MODIFY]`, or `[REUSE]` action types.
- Every task has a clear definition of done.
- A code review phase is mandatory at the end.
- No deployment plans or manual QA steps.

## Connected Skills

- `tsh-codebase-analysing` — Understand existing architecture.
- `tsh-implementation-gap-analysing` — Focus on necessary changes only.
- `tsh-technical-context-discovering` — Establish project conventions.
- `tsh-sql-and-database-understanding` — Database schema and data model design.
