---
sidebar_position: 13
title: Task Extraction
---

# Task Extraction

**Folder:** `.cursor/skills/workflows/tsh-task-extracting/`  
**Used by:** Business Analyst (via `tsh-ba-extraction-worker` for delegated extraction phases)

Identifies and structures epics and user stories from workshop materials (cleaned transcripts, Figma designs, codebase analysis, baseline context, and other documents). Produces a business-oriented task breakdown with source traceability, scenario-based acceptance criteria, dependencies, assumptions, and open questions.

## What It Produces

- **Intent brief** — Short business-first scope brief (`intent-brief.md`) approved at Gate 0 before extraction begins.
- **Epics** — High-level work streams with business descriptions and success criteria.
- **User Stories** — Discrete deliverables in "As a… I want… So that…" format with source traceability and GIVEN/WHEN/THEN acceptance scenarios.
- **Dependencies** — Relationships between epics and stories.
- **Assumptions & Open Questions** — Gaps that need stakeholder input.

## What It Does NOT Produce

- Technical architecture or implementation details.
- Story point estimates (left for team estimation sessions).
- Sprint or release planning.

## Process

### Step 1: Gather Input Materials

Review all available workshop materials:
- `workshop-context-summary.md` (if Explore Mode was used)
- Cleaned transcript (`cleaned-transcript.md`)
- Figma/FigJam designs
- Existing codebase (via `tsh-codebase-analysing`)
- Project baseline (`specifications/projects/<project-name>/task-baseline.md`, if present)
- Other reference documents (Confluence, emails, PDFs, etc.)

### Step 2: Draft Intent Brief

Before extracting tasks, draft `intent-brief.md` capturing goal, in-scope/out-of-scope boundaries, stakeholders, likely epics, baseline overlap, and open questions. See `intent-brief.example.md` in the skill folder.

### Step 3: User Validation (Gate 0)

Present the intent brief for user approval. Do not proceed to extraction until scope, intent, and candidate epics are confirmed.

### Step 4: Identify Epics

Identify distinct work streams representing major deliverables:
- Each epic is a cohesive business capability (e.g., "User Authentication", "Payment Processing").
- Aim for 3–10 epics per workshop.
- Draft a business-oriented title, 2–3 sentence description, and success criteria.

### Step 5: Break Down into User Stories

For each epic, identify individual stories:
- Each story represents a single, deliverable piece of user-facing functionality.
- Stories should be small enough to be completed in a single sprint.

### Step 6: Write Business-Oriented Descriptions

For each story, write:
- **Title** — Short, descriptive, action-oriented.
- **User story** — "As a [role], I want [capability] so that [benefit]."
- **Source traceability** — Reference to transcript topic, Figma screen, or document section.
- **Acceptance criteria** — Scenario-style GIVEN/WHEN/THEN conditions.
- **Priority suggestion** — Critical / High / Medium / Low.

:::tip
Keep descriptions in business language. Avoid implementation jargon. The goal is for any stakeholder to understand what will be delivered without technical knowledge.
:::

### Step 7: Map Dependencies

Identify relationships:
- **Blocked by** — Story A cannot start until Story B is complete.
- **Related to** — Stories that share context but don't block each other.
- **Epic dependencies** — When one epic must be delivered before another.

### Step 8: Identify Assumptions and Out-of-Scope Items

Document assumptions made during extraction and items explicitly excluded from scope.

### Step 9: Clarify Ambiguities

Flag conflicting information between materials, unclear scope, and missing details. Ask the user for clarification.

### Step 10: User Validation (Gate 1)

Present each story individually for user validation. This is a mandatory review gate — the user must approve before quality review.

### Step 11: Save Output

Save the intent brief and extracted tasks to `specifications/<workshop-name>/intent-brief.md` and `extracted-tasks.md`.

## Connected Skills

- `tsh-task-analysing` — Provides Explore Mode context and baseline overlap analysis.
- `tsh-transcript-processing` — Provides the cleaned transcript used as primary input.
- `tsh-codebase-analysing` — For understanding existing system context when analyzing scope.
