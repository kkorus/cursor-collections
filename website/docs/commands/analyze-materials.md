---
sidebar_position: 11
title: /tsh-analyze-materials
---

# /tsh-analyze-materials

**Source:** `src/skills/tsh-analyze-materials/SKILL.md`  
**Routes to:** [Business Analyst](../agents/business-analyst) orchestrator skill (`tsh-business-analyst`)

Turns discovery workshop materials (transcripts, Figma designs, PDFs) into Jira-ready epics and user stories, or iterates on an existing Jira backlog. The command only picks the entry point and the output folder; the Business Analyst owns the workflow, the review gates and every Jira action.

## Usage

```text
/tsh-analyze-materials <materials | Jira issue keys | project key>
```

## What it does

The command detects what you provided:

- **Workshop materials:** runs the standard workflow from the start. Without a raw transcript it skips the transcript step.
- **Jira issue keys, epic keys or a project key:** imports the issues and iterates on the existing backlog.
- **Materials too ambiguous to extract from**, or a request to explore first: suggests [`/tsh-explore-materials`](./explore-materials), or starts with Explore Mode if you agree.

If the input is unclear, it asks you one question to choose the entry point.

The workflow has four review gates (Gate 0 intent brief, Gate 1 breakdown, Gate 1.5 quality suggestions, Gate 2 final tasks). Nothing reaches Jira without your approval at each gate. See the [Business Analyst](../agents/business-analyst) page.

## Output

All artifacts go to `specifications/<topic>/` (kebab-case topic). Project-level continuity files live in `specifications/projects/<project-name>/`.
