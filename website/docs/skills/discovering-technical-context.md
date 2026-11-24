---
sidebar_position: 10
title: Technical Context Discovery
---

# Technical Context Discovery

**Skill name:** `tsh-discovering-technical-context`  
**Source:** `src/skills/tsh-discovering-technical-context/`  
**Used by:** Architect, Code Reviewer, DevOps Engineer, E2E Engineer, Plan Reviewer, Prompt Engineer, Software Engineer, `/tsh-analyze-cloud-costs`, `/tsh-ask`, `/tsh-audit-codebase`, `/tsh-audit-infrastructure`, `/tsh-create-custom-agent`, `/tsh-create-custom-command`, `/tsh-create-custom-rules`, `/tsh-create-custom-skill`, Engineering Manager (orchestrator), `tsh-implement-task` (step)

Discover and establish technical context before implementing any feature. Prioritize project instructions, existing codebase patterns, and external documentation in that order.

**Use when** starting any feature or fix, before writing tests (unit, integration, E2E), before architectural decisions that affect existing code, or when onboarding to a new area of the codebase.

## What it covers

- Technical Context Discovery Process

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-analyzing-implementation-gaps`](./analyzing-implementation-gaps)
- [`tsh-designing-architecture`](./designing-architecture)
- [`tsh-reviewing-code`](./reviewing-code)
