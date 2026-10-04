---
name: tsh-analyzing-implementation-gaps
description: "Implementation gap analysis: verifies what has to be implemented, what is already implemented, and compares a plan with the current state of the system. Use when checking a plan against existing code or deciding what to create, modify, or reuse."
type: skill
metadata:
  short-description: Compare a plan with the current state to find implementation gaps
---

# Implementation Gap Analysis

This skill helps compare the current state of the system to expected changes. It validates what has to be implemented, what was already implemented and what has to be modified in order to deliver the feature.

## Implementation Gap Analysis Process

Use the checklist below and track your progress:

```
Analysis progress:
- [ ] Step 1: Analyse all available information about the task
- [ ] Step 2: Analyse the current system state
- [ ] Step 3: Compare the expected result to the current system
- [ ] Step 4: Prepare the report
```

**Step 1: Analyse all available information about the task**

Check the conversation history and `.research.md` files to fully understand the goal of the task. Make sure to deeply understand what we want to implement.

**Step 2: Analyse the current system state**

Go through the current codebase and look for items that are related to the current task. 

**Step 3: Compare the expected result to the current system**

Based on the current code and task information, verify which part have to be created from scratch, which have to be modified and which can be re-used as they are.

**Step 4: Prepare the report**

Prepare a analysis report following the `assets/implementation-gap-analysis.template.md` template.

Don't add or remove any sections from the template. Follow the structure and naming conventions strictly to ensure clarity and consistency.

## Connected Skills

- `tsh-analyzing-codebase` — for a broader analysis of the existing system
- `tsh-analyzing-requirements` — for the task context the gap analysis builds on
- `tsh-designing-architecture` — for the plan that consumes the gap analysis
