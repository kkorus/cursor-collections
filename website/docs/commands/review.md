---
sidebar_position: 6
title: /tsh-review
---

# /tsh-review

**Source:** `src/skills/tsh-review/SKILL.md`  
**Routes to:** [Code Reviewer](../agents/code-reviewer) subagent (`tsh-code-reviewer`), delegated from the main thread

Reviews an implementation against the plan and feature context, or reviews the current diff when there is no plan. For a whole-codebase audit use [`/tsh-audit-codebase`](./audit-codebase).

## Usage

```text
/tsh-review [plan path | task description]
```

## What it does

1. Delegates to the Code Reviewer and tells it to follow the `tsh-reviewing-code` skill.
2. Passes the plan and research paths if you gave them or they exist for the task. Without a plan it passes the task description and the reviewer checks the current diff.
3. Shows you the findings and the agent's suggested next steps.

## Output

Findings grouped by severity, with acceptance criteria checked one by one when a plan exists. The reviewer also runs the project's tests and linters.
