---
name: tsh-review
description: Review an implementation against the plan and feature context, or review the current diff when there is no plan. Use when the user types /tsh-review, asks to review code, or wants a quality check on the implementation. Reviews a change; for a whole-codebase audit use /tsh-audit-codebase. Routes to the tsh-code-reviewer agent.
argument-hint: "[plan path | task description]"
disable-model-invocation: true
metadata:
  short-description: Review an implementation against the plan or the diff
---
<!-- Generated from src/skills/tsh-review/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-review

Delegate to the `tsh-code-reviewer` subagent and tell it to follow the `tsh-reviewing-code` skill. Pass the plan and research paths if the user gave them or they exist for the task. Without a plan, pass the task description and tell the agent that there is no plan, so it reviews the current diff.

The agent returns its findings in the format of the skill. Show them to the user and end with the next step: run `/tsh-implement Implement changes requested after code review` to fix the findings, or `/tsh-commit` when there are none.

## Delegating and Handling Agent Status

Delegation goes one level deep. You delegate from the main thread, and the agents you delegate to never delegate further. Delegated agents start with a clean context and do not see this conversation, so put everything they need into the delegation prompt.

### Delegation prompt template

```
MODE: delegated
CALLER: <name of your skill or command>
TASK: <what to do, stated specifically>
INPUT_ARTIFACTS:
- <explicit path of each file the agent needs>
PRIOR_OUTPUT: <re-delegation only: the previous STATUS block, verbatim; when ARTIFACTS was "none", the complete previous reply body including the block>
USER_ANSWERS: <re-delegation only: the user's answers, numbered like the questions>
```

- The first line must be exactly `MODE: delegated`. Without it the agent runs in interactive mode and will ask the user instead of returning a status.
- Pass artifact paths explicitly. Never ask the agent to search for them.
- Read-only agents cannot save files, so their partial result lives in the reply body. Keep the full reply of every read-only delegate and pass it as `PRIOR_OUTPUT` on re-delegation, otherwise the agent restarts from zero.
- Omit `PRIOR_OUTPUT` and `USER_ANSWERS` on the first delegation.

### Reading the returned status

Every delegated agent ends its reply with a `STATUS:` block (`STATUS`, `ARTIFACTS`, `SUMMARY`, `QUESTIONS`, `DECISION_NEEDED`, `BLOCKER`). Some tools return the block on a single line (`STATUS: DONE SUMMARY: ...`), so parsing must not depend on line breaks:

- Find the last `STATUS:` followed by one of the four values.
- Read each field as the text after its capitalized name and colon, up to the next field name or the end of the reply.

### Handling each status

| Status | What you do |
|---|---|
| `DONE` | Continue with the workflow. Use the paths in `ARTIFACTS`. If `QUESTIONS` is present, these are open points the agent worked around: ask the user (or apply the answers at the matching gate of your workflow) and apply the answers yourself or pass them on to the next step. Do not re-delegate just for them. |
| `NEEDS_INPUT` | Ask the user the listed `QUESTIONS` in the main thread, all at once and numbered. Then delegate to the same agent again with `PRIOR_OUTPUT` and `USER_ANSWERS`. |
| `NEEDS_ARCHITECT_DECISION` | Delegate to the `tsh-architect` subagent with `DECISION_NEEDED` as the task. Then delegate to the original agent again, with the status block followed by the architect's decision in `PRIOR_OUTPUT`. |
| `BLOCKED` | Show the `BLOCKER` to the user and stop that branch of the work. |
| Missing or unparsable | Treat it as `BLOCKED` and show the raw output to the user. |

### Iteration cap

Re-delegate to the same agent at most 3 times per task. After that, stop and escalate to the user with the latest output. Loops that a workflow defines with their own caps (plan review, code review and fix, UI verification) keep those caps.
