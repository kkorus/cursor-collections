---
name: tsh-analyze-materials
description: Turn discovery workshop materials (transcripts, Figma designs, PDFs) into Jira-ready epics and user stories, or iterate on an existing Jira backlog. Use when the user types /tsh-analyze-materials or provides workshop materials for backlog creation. Not for exploration only (use /tsh-explore-materials). Routes to the tsh-business-analyst orchestrator.
type: command
routes-to: tsh-business-analyst
metadata:
  short-description: Turn workshop materials into Jira-ready epics and stories
---

# /tsh-analyze-materials

Load and follow the `tsh-business-analyst` skill. It owns the whole workflow, the review gates and every Jira action. This command only decides the entry point and the output folder.

## Entry point

Detect what the user provided:

- **Workshop materials** (transcripts, Figma or FigJam links, PDFs, notes, other documents): run the standard workflow from the start. If no raw transcript exists (structured notes or direct requirements), skip the transcript step.
- **Jira issue keys, epic keys or a project key** instead of materials: import the issues and iterate on the existing backlog.
- **Materials that are too ambiguous to extract from**, or an explicit request to explore first: suggest `/tsh-explore-materials`, or start with Explore Mode if the user agrees.

If the input is unclear, ask the user one question to choose the entry point.

## Output folder

Save all artifacts in `specifications/<topic>/`, where `<topic>` is the workshop or project topic in kebab-case (for example `specifications/user-onboarding/`). Project-level continuity files live in `specifications/projects/<project-name>/`.
