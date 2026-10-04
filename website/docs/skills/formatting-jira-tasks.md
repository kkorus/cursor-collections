---
sidebar_position: 6
title: Jira Task Formatting
---

# Jira Task Formatting

**Skill name:** `tsh-formatting-jira-tasks`  
**Source:** `src/skills/tsh-formatting-jira-tasks/`  
**Used by:** BA Formatting Worker, Business Analyst (orchestrator)

Transform extracted epics and user stories into Jira-ready format following a benchmark template. Handles field mapping, Markdown storage with conversion to Jira markup at push, two-gate user review, and guidance for Jira issue creation via Atlassian tools.

**Use when** an approved task list needs to be formatted for Jira.

## What it covers

- Jira Task Formatting Process
- Delegated mode
- Per-Change Modification Flow
- Storage format and Jira conversion
- Import Mode

## Support files

- `assets/`: `jira-task.template.md`, `task-baseline.template.md`
- `references/`: `import-mode.md`

## Connected skills

- [`tsh-extracting-tasks`](./extracting-tasks)
- [`tsh-guarding-jira-statuses`](./guarding-jira-statuses)
