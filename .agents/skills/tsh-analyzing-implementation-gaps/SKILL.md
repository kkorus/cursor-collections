---
name: tsh-analyzing-implementation-gaps
description: Compares a planned or expected change with the current state of the system and sorts the work into what is To Be Created, To Be Modified and To Be Reused, with file paths. Use when checking a plan against existing code, deciding what to create, modify or reuse before implementing, or verifying how much of a plan is already implemented.
metadata:
  short-description: Compare a plan with the current state to find implementation gaps
---
<!-- Generated from src/skills/tsh-analyzing-implementation-gaps/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Analyzing Implementation Gaps

Compare the current state of the system with the expected changes. The analysis validates what has to be created, what already exists and what has to be modified to deliver the feature.

## Implementation Gap Analysis Process

Use the checklist below and track your progress:

```
Analysis progress:
- [ ] Step 1: Analyze all available information about the task
- [ ] Step 2: Analyze the current system state
- [ ] Step 3: Compare the expected result with the current system
- [ ] Step 4: Prepare the report
```

**Step 1: Analyze all available information about the task**

Check the conversation history and the `.research.md` and `.plan.md` files to understand the goal of the task. Make sure you understand what is to be implemented.

**Step 2: Analyze the current system state**

Go through the current codebase and look for items related to the task.

**Step 3: Compare the expected result with the current system**

From the code and the task information, decide which parts have to be created from scratch, which have to be modified and which can be reused as they are.

**Step 4: Prepare the report**

Write the analysis following [assets/implementation-gap-analysis.template.md](assets/implementation-gap-analysis.template.md). Do not add or remove sections from the template, and use its terms exactly: **To Be Created**, **To Be Modified** and **To Be Reused**. The "Current Implementation Analysis" section of the plan template uses the same three terms.

## Connected Skills

- `tsh-analyzing-codebase` - for a broader analysis of the existing system
- `tsh-analyzing-requirements` - for the task context the gap analysis builds on
- `tsh-discovering-technical-context` - for the project conventions that decide what counts as reusable
- `tsh-designing-architecture` - for the plan that consumes the gap analysis
- `tsh-reviewing-code` - which uses the analysis to verify that a plan was fully implemented
