---
sidebar_position: 11
title: Codebase Analysis
---

# Codebase Analysis

**Skill name:** `tsh-analyzing-codebase`  
**Source:** `src/skills/tsh-analyzing-codebase/`  
**Used by:** Architect, BA Analysis Worker, Context Engineer, DevOps Engineer, Plan Reviewer, Software Engineer, `/tsh-analyze-cloud-costs`, `/tsh-ask`, `/tsh-audit-codebase`, `/tsh-audit-infrastructure`, `/tsh-create-custom-agent`, `/tsh-create-custom-command`, `/tsh-create-custom-rules`, `/tsh-create-custom-skill`

Analyzes the whole codebase of a system: its structure, dependencies, architecture, business logic, dead code and duplications, and runs code quality audits with a report.

**Use when** onboarding to an unfamiliar repository, mapping a system before a change, producing a codebase analysis document, or auditing code quality. NOT for per-task conventions (use tsh-discovering-technical-context).

## What it covers

- Codebase Analysis Process
- Large codebase
- Code Quality Audit
- Report

## Support files

- `assets/`: `code-quality-report.template.md`, `codebase-analysis.template.md`
- `references/`: `audit-checklists.md`

## Connected skills

- [`tsh-analyzing-implementation-gaps`](./analyzing-implementation-gaps)
- [`tsh-designing-architecture`](./designing-architecture)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
- [`tsh-reviewing-code`](./reviewing-code)
