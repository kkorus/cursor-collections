---
sidebar_position: 14
title: Task Quality Review
---

# Task Quality Review

**Folder:** `.cursor/skills/workflows/tsh-task-quality-reviewing/`  
**Used by:** Business Analyst (via `tsh-ba-quality-worker` for delegated review passes)

Performs a systematic quality analysis on an approved task list (epics and user stories) to identify gaps, missing edge cases, and improvement opportunities. Supports **Lite** and **Full** review modes, optionally enriches findings with existing Jira board context, and produces structured suggestions the user can individually accept or reject at Gate 1.5.

## What It Produces

- **Suggestions** — Structured improvement proposals, each individually accept/reject.
- **Domain model** — An intermediate actor–entity–lifecycle map derived from the task list.
- **Quality review report** — Audit trail of all suggestions and decisions (`quality-review.md`).
- **Updated task list** — Accepted suggestions applied to `extracted-tasks.md` in-place.

## Review Modes

| Mode | When to Use | Passes |
|------|-------------|--------|
| **Lite** | Default for small, low-risk workshops (roughly ≤3 epics and ≤12 stories) unless the user requests Full | A, B, E, H, I |
| **Full** | Larger workshops, regulated domains, high-risk scope, or when the user requests a deeper pass | A, B, C, D, E, F, G, H, I, J |

Record the chosen mode in the review output before running passes.

## Analysis Passes

| Pass | Category | What It Checks | Confidence |
|---|---|---|---|
| A | Entity Lifecycle Completeness | CRUD operations for every business entity | High |
| B | Cross-Feature State Validation | State checking when features consume shared entities | High |
| C | Bulk Operation Idempotency | Pre-existing data and partial failure handling | High |
| D | Actor Dashboard Completeness | Metrics, configuration, and history for management UIs | Medium |
| E | Precondition Guards | Feature unlock dependencies and prerequisite enforcement | High |
| F | Third-Party Boundary Clarity | External integration points and failure modes | Medium |
| G | Platform Operations Perspective | Admin/operator tooling and monitoring | Medium |
| H | Error State & Edge Case Coverage | Failure, empty, and boundary conditions | High |
| I | Notification & Communication Gaps | Missing notifications for cross-actor state changes | High |
| J | Domain-Specific Research | Industry patterns and compliance requirements | Low–Medium |

## Suggestion Types

Each finding is classified into one of these action types:

| Action Type | Description |
|---|---|
| `ADD_ACCEPTANCE_CRITERION` | Add a missing condition to an existing story |
| `MODIFY_STORY` | Expand an existing story's scope |
| `ADD_TECHNICAL_NOTE` | Add clarity or documentation to a story |
| `NEW_STORY` | Create a new story for uncovered functionality |
| `NEW_EPIC` | Create a new epic for a major capability gap |

## Process

### Step 1: Load Inputs

Collect the Gate 1-approved `extracted-tasks.md`, cleaned transcript, and any other source materials.

### Step 2: Select Review Mode

Choose Lite or Full based on task size, risk, and user direction.

### Step 3: Gather Jira Context (Optional)

If Atlassian tools are available, optionally fetch existing board context to cross-reference against.

### Step 4: Build Domain Model

Construct a lightweight domain model from the task list: actors, entities (with lifecycle mapping), and relationships.

### Step 5: Run Analysis Passes

Execute the active passes for the chosen mode against the domain model and task list. Each pass produces zero or more findings. Skip tasks with protected Jira statuses (Done, Cancelled, PO APPROVE).

### Step 6: Classify Suggestions

Transform findings into structured suggestions with confidence levels, action types, and proposed changes.

### Step 7: User Review (Gate 1.5)

Present suggestions one at a time for individual accept/reject decisions. Each suggestion is self-contained with full context.

### Step 8: Apply Accepted Changes

Apply accepted suggestions to `extracted-tasks.md` and save the quality review report to `quality-review.md`.

## Connected Skills

- `tsh-task-extracting` — Provides the extracted tasks used as primary input.
- `tsh-jira-task-formatting` — Consumes the updated task list after quality review.
