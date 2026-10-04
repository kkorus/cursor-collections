---
name: tsh-review
description: Review an implementation against the plan and feature context, or review the current diff when there is no plan. Use when the user types /tsh-review, asks to review code, or wants a quality check on the implementation. Reviews a change; for a whole-codebase audit use /tsh-audit-codebase. Routes to the tsh-code-reviewer agent.
type: command
routes-to: tsh-code-reviewer
argument-hint: "[plan path | task description]"
metadata:
  short-description: Review an implementation against the plan or the diff
---
# /tsh-review

Delegate to the `tsh-code-reviewer` subagent and tell it to follow the `tsh-reviewing-code` skill. Pass the plan and research paths if the user gave them or they exist for the task. Without a plan, pass the task description and tell the agent that there is no plan, so it reviews the current diff.

The agent returns its findings in the format of the skill. Show them to the user and end with the agent's suggested next steps.

<!-- include: caller-status-handling -->
