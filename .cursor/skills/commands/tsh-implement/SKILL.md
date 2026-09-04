---
name: tsh-implement
description: Implement a feature according to the plan or task description. Use when the user types /tsh-implement, asks to implement a task, or references a Jira ticket for implementation. Routes to the tsh-engineering-manager agent.
disable-model-invocation: true
---
# /tsh-implement

<goal>
Start implementation delivery for a feature based on a task description, Jira item, standalone research file, or implementation plan. This command is a thin trigger that routes execution through the canonical orchestration workflow rather than defining that workflow inline.
</goal>

<required-skills>
<skill name="tsh-orchestrating-implementation">
Required because it contains the canonical implementation-orchestration workflow, including Step 0 flow selection, the canonical Human approval gate that precedes the first file-changing delegation, and the delivery process that this command must trigger without duplicating.
</skill>
</required-skills>

<input-requirements>
The four primary inputs are a task description, a Jira ID, a standalone `*.research.md` file, and a `*.plan.md` implementation plan. Missing companion research or plan artifacts trigger preparation through the canonical workflow; they never authorize implementation without a current actionable plan.
</input-requirements>

<workflow>
Load and follow the `tsh-engineering-manager` agent skill, then read and follow the `tsh-orchestrating-implementation` workflow skill, start at Step 0, and follow the canonical workflow defined there for the rest of the implementation delivery. Every route relies on that skill's canonical Human approval gate before the first file-changing delegation. `tsh-orchestrating-implementation` carries `disable-model-invocation: true`, so it must be located and **read** — a Skill-tool invocation by name is rejected and is not a reason to proceed without it.

Resolve the skill reference with the `tsh-resolving-skill-references` resolution order, and stop and ask the user if the workflow skill cannot be located.
</workflow>
