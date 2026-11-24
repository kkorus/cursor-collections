---
sidebar_position: 32
title: Reviewing Code
---

# Reviewing Code

**Skill name:** `tsh-reviewing-code`  
**Source:** `src/skills/tsh-reviewing-code/`  
**Used by:** Code Reviewer, Prompt Engineer, `/tsh-audit-codebase`, Engineering Manager (orchestrator), `/tsh-review`

Structured code review of an implementation against a plan or, without a plan, against the task description and the diff, covering correctness, quality, security, testing, best practices and scalability, with a fixed findings format.

**Use when** reviewing implementations, running quality gates, verifying code against a plan, or doing a post-implementation review.

## What it checks beyond the basics

The review also looks for **N+1** query and call patterns (a query or remote call inside a loop over results), and when the plan has executor tasks it checks the work against the plan's definition of done.

## Severities

Each finding is classified by severity, indicating the action required:

| Severity | Meaning | Action |
|---|---|---|
| `critical` | Bug, security hole, data loss risk or a broken requirement | Must fix before merge |
| `warning` | Likely problem, missing test, maintainability risk | Should fix |
| `suggestion` | Improvement that is optional | Consider |

Every review ends with a verdict line: `No critical findings` (no action needed) or `Critical findings must be fixed` (with the counts of critical findings), indicating whether the review is ready to merge or needs remediation.

## What it covers

- Code Review Process
- No plan available
- Findings format
- When tests cannot run
- LLM-integrated code

## Connected skills

- [`tsh-analyzing-implementation-gaps`](./analyzing-implementation-gaps)
- [`tsh-designing-databases`](./designing-databases)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
- [`tsh-engineering-prompts`](./engineering-prompts)
- [`tsh-ensuring-accessibility`](./ensuring-accessibility)
- [`tsh-reviewing-frontend`](./reviewing-frontend)
- [`tsh-writing-e2e-tests`](./writing-e2e-tests)
