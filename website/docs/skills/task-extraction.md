---
sidebar_position: 13
title: Task Extraction
---

# Task Extraction

**Folder:** `.cursor/skills/workflows/tsh-task-extracting/`  
**Used by:** Business Analyst

Identifies and structures epics and user stories from workshop materials (cleaned transcripts, Figma designs, codebase analysis, and other documents). Produces a business-oriented task breakdown with dependencies, assumptions, and open questions.

## What It Produces

- **Epics** — High-level work streams with business descriptions and success criteria.
- **User Stories** — Discrete deliverables in "As a… I want… So that…" format with acceptance criteria.
- **Dependencies** — Relationships between epics and stories.
- **Assumptions & Open Questions** — Gaps that need stakeholder input.

## What It Does NOT Produce

- Technical architecture or implementation details.
- Story point estimates (left for team estimation sessions).
- Sprint or release planning.

## Process

### Step 1: Gather Input Materials

Review all available workshop materials:
- Cleaned transcript (`cleaned-transcript.md`)
- Figma/FigJam designs
- Existing codebase (via `tsh-codebase-analysing`)
- Other reference documents (Confluence, emails, etc.)

### Step 2: Identify Epics

Identify distinct work streams representing major deliverables:
- Each epic is a cohesive business capability (e.g., "User Authentication", "Payment Processing").
- Aim for 3–10 epics per workshop.
- Draft a business-oriented title, 2–3 sentence description, and success criteria.

### Step 3: Break Down into User Stories

For each epic, identify individual stories:
- Each story represents a single, deliverable piece of user-facing functionality.
- Stories should be small enough to be completed in a single sprint.

### Step 4: Write Business-Oriented Descriptions

For each story, write:
- **Title** — Short, descriptive, action-oriented.
- **User story** — "As a [role], I want [capability] so that [benefit]."
- **Acceptance criteria** — Checklist of verifiable conditions.
- **Priority suggestion** — Critical / High / Medium / Low.

:::tip
Keep descriptions in business language. Avoid implementation jargon. The goal is for any stakeholder to understand what will be delivered without technical knowledge.
:::

### Step 5: Map Dependencies

Identify relationships:
- **Blocked by** — Story A cannot start until Story B is complete.
- **Related to** — Stories that share context but don't block each other.
- **Epic dependencies** — When one epic must be delivered before another.

### Step 6: Identify Assumptions and Out-of-Scope Items

Document assumptions made during extraction and items explicitly excluded from scope.

### Step 7: Clarify Ambiguities

Flag conflicting information between materials, unclear scope, and missing details. Ask the user for clarification.

### Step 8: User Validation (Gate 1)

Present each story individually for user validation. This is a mandatory review gate — the user must approve before proceeding.

### Step 9: Save Output

Save the extracted tasks to `specifications/<workshop-name>/extracted-tasks.md`.

## Connected Skills

- `tsh-transcript-processing` — Provides the cleaned transcript used as primary input.
- `tsh-codebase-analysing` — For understanding existing system context when analyzing scope.
