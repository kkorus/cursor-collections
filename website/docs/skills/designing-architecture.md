---
sidebar_position: 8
title: Designing Architecture
---

# Designing Architecture

**Skill name:** `tsh-designing-architecture`  
**Source:** `src/skills/tsh-designing-architecture/`  
**Used by:** Architect, Plan Reviewer, `/tsh-ask`, Engineering Manager (orchestrator)


Designs the architecture that solves a given task and produces the implementation plan (.plan.md) that engineers follow step by step.

**Use when** a feature needs a technical design or an implementation plan before coding starts, when a plan must be revised after a plan review, or when an architectural decision needs a decision record.

## What it covers

- Architecture Design Process
- Planning rules, including the plan contract: a `Plan Revision`, a `## Human Approval` record (`PENDING` until you decide), task-level `Files`, a runnable Definition of Done and a Stop Rule, so that executors can work from the plan alone
- Material and non-material changes to a plan, and the seam test that tells the manager which executor a task goes to
- Decision records

The skill documents a plan; it does not ask you for approval. The Architect never asks you to approve a plan: the Engineering Manager runs the one gate and has the approval recorded in the plan.

## Support files

- `assets/`: `decision.template.md`, `plan.template.md`

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-analyzing-implementation-gaps`](./analyzing-implementation-gaps)
- [`tsh-designing-databases`](./designing-databases)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
- [`tsh-reviewing-code`](./reviewing-code)
- [`tsh-verifying-ui`](./verifying-ui)
