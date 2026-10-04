---
name: tsh-explore-materials
description: Explore workshop materials for business context before any backlog extraction and get a readiness recommendation. Use when the user types /tsh-explore-materials or wants to understand likely scope before committing to epics and stories. Not for creating Jira-ready tasks (use /tsh-analyze-materials). Routes to the tsh-business-analyst orchestrator.
disable-model-invocation: true
metadata:
  short-description: Explore workshop materials for business context first
---
<!-- Generated from src/skills/tsh-explore-materials/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-explore-materials

Load and follow the `tsh-business-analyst` skill and run its **Explore Mode** on the provided materials (transcripts, Figma or FigJam designs, PDFs, codebase context, other documents). Use an existing project baseline as continuity context when one exists.

Explore Mode ends with a business context summary and a readiness recommendation. Do not create epics, stories or Jira-ready items unless the user explicitly asks to continue; continuing hands over to the standard workflow of `/tsh-analyze-materials`.

## Output folder

Save the result as `specifications/<topic>/workshop-context-summary.md`, where `<topic>` is the workshop topic in kebab-case.
