---
sidebar_position: 10
title: /tsh-explore-materials
---

# /tsh-explore-materials

**Source:** `src/skills/tsh-explore-materials/SKILL.md`  
**Routes to:** [Business Analyst](../agents/business-analyst) orchestrator skill (`tsh-business-analyst`) in Explore Mode

Explores workshop materials for business context before any backlog extraction and gives a readiness recommendation. Use it when you want to understand the likely scope before committing to epics and stories.

## Usage

```text
/tsh-explore-materials <transcripts, Figma links, PDFs, notes>
```

## What it does

1. Loads the Business Analyst and runs its **Explore Mode** on the materials (transcripts, Figma or FigJam designs, PDFs, codebase context, other documents). An existing project baseline is used as continuity context.
2. Ends with a business context summary and a readiness recommendation.
3. Creates no epics, stories or Jira-ready items unless you ask to continue. Continuing hands over to the standard workflow of [`/tsh-analyze-materials`](./analyze-materials).

## Output

`specifications/<topic>/workshop-context-summary.md`, where `<topic>` is the workshop topic in kebab-case.
