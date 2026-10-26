---
sidebar_position: 9
title: Reviewing Plans
---

# Reviewing Plans

**Skill name:** `tsh-reviewing-plans`  
**Source:** `src/skills/tsh-reviewing-plans/`  
**Used by:** Plan Reviewer, Architect (for the pre-submission self-check)

Adversarial review of implementation plans (.plan.md) that finds likely failure modes, hidden assumptions and costly rework risks before coding begins, and produces a plan-review report with an APPROVED or REVISIONS NEEDED verdict.

**Use when** a plan has just been produced or revised and must be validated before implementation, or when asked to stress-test, challenge or review a plan.

## BLOCKER categories

The skill is the single home of the **six** BLOCKER categories. A finding outside them is at most a WARNING. The Architect runs the same list as a self-check before it submits a plan, so the review is a lightweight final reality check and `APPROVED` is the common outcome. The report states the `REVIEWED_PLAN_REVISION` it applies to, which the Engineering Manager compares with the `Plan Revision` of the plan before it opens the approval gate. A reviewer verdict is not human approval.

## What it covers

- Approach
- Challenge Domains
- Severity Levels
- Approval Guidance
- Workflow
- Review Requirements
- Key Principles

## Support files

- `assets/`: `plan-review.template.md`

## Connected skills

- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-analyzing-implementation-gaps`](./analyzing-implementation-gaps)
- [`tsh-designing-architecture`](./designing-architecture)
- [`tsh-designing-databases`](./designing-databases)
- [`tsh-discovering-technical-context`](./discovering-technical-context)
