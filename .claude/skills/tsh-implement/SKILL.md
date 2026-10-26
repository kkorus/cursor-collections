---
name: tsh-implement
description: Implement a feature according to the plan or task description. Use when the user types /tsh-implement, asks to implement a task, or references a Jira ticket for implementation. Routes to the tsh-engineering-manager orchestrator.
argument-hint: <task-id | description>
disable-model-invocation: true
metadata:
  short-description: Implement a task end to end via the engineering manager
---
<!-- Generated from src/skills/tsh-implement/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-implement

Load the `tsh-engineering-manager` skill and run it with the user's input (a task ID, a plan path or a description).

Pass along one line: when the input is a plan path, the flow is Full and nothing is asked. Otherwise recommend the Quick flow for small, obvious changes and the Full flow for multi-component, unclear or UI work, and let the user confirm the choice once.

Plan-based work is approved by the user before any file change; the Quick flow has no plan and no such gate.
