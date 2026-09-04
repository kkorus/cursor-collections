---
name: tsh-implement
description: Implement a feature according to the plan or task description. Use when the user types /tsh-implement, asks to implement a task, or references a Jira ticket for implementation. Routes to the tsh-engineering-manager agent.
disable-model-invocation: true
---
# /tsh-implement

<goal>
Start implementation delivery for a feature based on a task description, Jira item, or implementation plan. This command is a thin trigger that routes execution through the canonical orchestration workflow rather than defining that workflow inline.
</goal>

<required-skills>
<skill name="tsh-orchestrating-implementation">
Required because it contains the canonical implementation-orchestration workflow, including Step 0 flow selection and the delivery process that this command must trigger without duplicating.
</skill>
</required-skills>

<input-requirements>
Provide at least one of the following: a task description, a Jira ID, or a `*.plan.md` implementation plan. Related context such as a `*.research.md` file may also be included when available.
</input-requirements>

<workflow>
Load and follow the `tsh-engineering-manager` agent skill, then read and follow the `tsh-orchestrating-implementation` workflow skill, start at Step 0, and follow the canonical workflow defined there for the rest of the implementation delivery. `tsh-orchestrating-implementation` carries `disable-model-invocation: true`, so it must be located and **read** — a Skill-tool invocation by name is rejected and is not a reason to proceed without it.

Resolve the skill reference with the `tsh-resolving-skill-references` resolution order, and stop and ask the user if the workflow skill cannot be located.
</workflow>
