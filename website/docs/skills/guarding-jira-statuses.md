---
sidebar_position: 7
title: Guarding Jira Statuses
---

# Guarding Jira Statuses

**Skill name:** `tsh-guarding-jira-statuses`  
**Source:** `src/skills/tsh-guarding-jira-statuses/`  
**Used by:** BA Quality Worker, Business Analyst (orchestrator)

Defines which Jira statuses make a task protected (immutable) and the rules for handling protected tasks in local files, quality review, formatting, import and push. The status list is configurable; the default is Done, Cancelled and PO APPROVE.

**Use when** a workflow reads, edits, reviews, formats, imports or pushes Jira tasks and must decide whether a task may be changed.

## What it covers

- Protected status list
- Rules
- Where to apply the checks
- Delegated mode
