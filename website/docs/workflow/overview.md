---
sidebar_position: 1
title: Workflow Overview
---

# Workflow Overview

Cursor Collections is an AI product engineering framework that covers the **full product lifecycle** through a structured workflow:

> **Ideate → Implement → Review**

The Implement phase internally handles research and planning automatically. Each phase is executed by a specialized agent and produces documented artifacts. This ensures consistent, high-quality outputs across teams — from workshop materials all the way to production-ready, reviewed code.

:::tip The Relay Race Metaphor
Think of this workflow as a **relay race**. Each phase produces a deliverable — the "baton" — that is reviewed by the human and then passed to the next phase. Workshop materials feed the backlog, the Engineering Manager orchestrates research, planning, and implementation as a single flow, and the implementation feeds the review. Nothing is lost between steps, and every handoff is a documented artifact.
:::

## The Phases

### 1. Ideate

- **Agent:** Business Analyst
- **Commands:** `/tsh-explore-materials <workshop materials>` or `/tsh-analyze-materials <workshop materials>`
- Can start with exploration-only business/context synthesis before backlog extraction.
- Processes workshop materials through intent brief, extraction, quality review, Jira formatting, and verified Jira sync.
- Uses Gate 0, Gate 1, Gate 1.5, and Gate 2 as mandatory human review points.
- **Produces:** Exploration summaries, intent briefs, Jira-ready epics and stories, and refreshed backlog continuity artifacts.

### 2. Implement

- **Agent:** Engineering Manager (orchestrates specialized agents)
- **Command:** `/tsh-implement <JIRA_ID or description>`
- Automatically handles the full development cycle:
  1. **Research** — Delegates to Context Engineer to gather context from Jira, Figma, and codebase. You review the research document; this review is a quality checkpoint, not a separate authorization gate.
  2. **Plan** — Delegates to Architect to create a structured implementation plan. The Architect invokes the Plan Reviewer once per plan lifecycle, then runs its own plan-authoring approval gate (`Approve plan`, `I have comments`) and records your literal decision in the plan. That recorded approval is what authorizes implementation.
  3. **Implement** — Delegates to the owning specialist per task: Plan Implementor by default for actionable, low-risk plan seams, Software Engineer for complex non-UI work, UI Engineer for Figma/UI, E2E Engineer for end-to-end tests, DevOps Engineer for infrastructure/CI/CD/observability, Prompt Engineer for LLM prompts, or Technical Writer for repository documentation.
- Tracks progress, runs quality checks after each task, and auto-triggers code review.
- **Produces:** Research document, implementation plan, and concrete code modifications.

The command accepts a task description, Jira ID, standalone `*.research.md`, or `*.plan.md`. A missing research or plan companion triggers preparation and never authorizes implementation without a current actionable plan. Two distinct user-facing gates exist, and neither substitutes for the other. The normal one is the Architect's plan-authoring gate (`Approve plan`, `I have comments`), which fires immediately after the review event settles and writes your decision into the plan's `## Human Approval` record. The Engineering Manager's gate (`Approve current plan`, `Request changes`, `Stop`) is fail-closed recovery only: the manager validates the persisted record first and reuses a valid current-revision approval — including one the Architect recorded — without asking you again, and presents its three choices only when no valid record exists or after a material revision. Intermediate research and plan reviews inform you but are not authorization gates on their own. Full Flow is the only implementation route, and it requires a valid current-revision Human approval before the first file-changing delegation. A `tsh-plan-reviewer` `APPROVED` verdict is Reviewer approval only and is not permission to implement.

Recording that plan-authoring approval also ends the **authoring discussion** — the discussion in which the plan was authored, reviewed, and approved. There the Engineering Manager reports the exact plan path, the current `Plan Revision`, the persisted `Decision Timestamp`, and the review path when present, names implementation as the next step, and delegates no file change. You start a new discussion to implement, and the manager reuses the unchanged persisted record there without presenting a duplicate approval gate. The boundary is a lifecycle stop, not an approval-validity criterion: an invalid or missing record still fails closed, and a material revision still requires renewed Human approval. One path is excluded — when reviewer readiness rests on the initial-plan low-risk automated-review exemption, the Architect's plan-authoring gate never ran, so the manager's gate is the only user-facing gate and there is no authoring discussion to close.

Before any file change, the execution owner validates the Human Approval record from the referenced plan on disk. If validation fails, the owner fails closed, names the exact failed field, condition, or file, and asks the user in chat for guided recovery on every entry path, spelling out the options: point to the correct plan path, obtain Human approval for an existing plan, start plan preparation, or, for a delegated subagent, hand back to `tsh-engineering-manager`. The user's answer selects a next step but is never itself Human approval.

### 3. Review

- **Agent:** Code Reviewer
- **Command:** `/tsh-review <JIRA_ID or description>`
- Performs a structured code review against acceptance criteria, security, reliability, and maintainability.
- **Produces:** Structured review with clear pass/blockers/suggestions.

## Workflow Diagram

import SdlcDiagram from '@site/src/components/SdlcDiagram';

<SdlcDiagram />

## Human Review at Every Step

:::warning Important
Each step requires your review and verification. Open the generated documents, go through them carefully, and give feedback when something needs to change. AI assistance does not replace human judgment. Reviewing research and draft plans keeps quality high, but what authorizes or halts execution is the plan approval gate: normally the Architect's `Approve plan` / `I have comments`, and the Engineering Manager's `Approve current plan` / `Request changes` / `Stop` only as fail-closed recovery when no valid current-revision approval exists. Treat other reviews as checkpoints, not confirmation-to-continue rituals, and reserve your input for real ambiguity or blockers rather than a generic "continue?" prompt.
:::

## Workflow Variants

The full lifecycle has specialized variants for different task types:

- **[Workshop Analysis Flow](./workshop-flow)** — Explore workshop context with `/tsh-explore-materials` or convert materials into Jira-ready epics and stories with `/tsh-analyze-materials`.
- **[Standard Flow](./standard-flow)** — Backend/fullstack tasks using `/tsh-implement` → `/tsh-review` (research and planning happen internally).
- **[Frontend Flow](./frontend-flow)** — UI tasks with Figma verification using `/tsh-implement` (which internally uses `/tsh-implement-ui`) and `/tsh-review-ui`.
- **[E2E Testing Flow](./e2e-flow)** — End-to-end test creation delegated by the Engineering Manager to the E2E Engineer via `/tsh-implement`.
