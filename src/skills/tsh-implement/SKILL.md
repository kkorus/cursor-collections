---
name: tsh-implement
description: Implement a feature according to the plan or task description. Use when the user types /tsh-implement, asks to implement a task, or references a Jira ticket for implementation. Routes to the tsh-engineering-manager orchestrator.
type: command
routes-to: tsh-engineering-manager
argument-hint: "<task-id | description>"
metadata:
  short-description: Implement a task end to end via the engineering manager
---
# /tsh-implement

Load the `tsh-engineering-manager` skill and run it with the user's input (a task ID, a plan path or a description).

Pass along one line: recommend the Quick flow for small, obvious changes and the Full flow for multi-component, unclear or UI work, and let the user confirm the choice.

Plan-based work is approved by the user before any file change; the Quick flow has no plan and no such gate.
