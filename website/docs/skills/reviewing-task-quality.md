---
sidebar_position: 5
title: Task Quality Review
---

# Task Quality Review

**Skill name:** `tsh-reviewing-task-quality`  
**Source:** `src/skills/tsh-reviewing-task-quality/`  
**Used by:** BA Quality Worker, Business Analyst (orchestrator)

Analyze extracted epics and user stories for quality gaps, missing edge cases, and improvement opportunities. Runs domain-agnostic analysis passes, optionally enriches findings with Jira board context, and produces accept/reject suggestions that refine the task list before Jira formatting.

**Use when** an extracted task list needs a quality review before formatting.

## What it covers

- What This Skill Produces
- What This Skill Does NOT Do
- Task Quality Review Process
- Delegated mode
- Analysis Categories Reference

## Support files

- `assets/`: `quality-review.template.md`
- `references/`: `analysis-passes.md`

## Connected skills

- [`tsh-extracting-tasks`](./extracting-tasks)
- [`tsh-formatting-jira-tasks`](./formatting-jira-tasks)
- [`tsh-guarding-jira-statuses`](./guarding-jira-statuses)
- [`tsh-using-mcp-servers`](./using-mcp-servers)
