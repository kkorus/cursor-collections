---
name: tsh-audit-codebase
description: Comprehensive code quality audit covering dead code, duplications and improvement opportunities, with a report saved to the project's code-quality location (default specifications/code-quality/). Use when the user types /tsh-audit-codebase, asks for a codebase audit, or wants a code quality report. Routes to the tsh-architect agent.
disable-model-invocation: true
metadata:
  short-description: "Audit code quality: dead code, duplication, improvements"
---
<!-- Generated from src/skills/tsh-audit-codebase/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-audit-codebase

Audit the code quality of this repository and save the report to `<specs>/code-quality/code-quality-report.md`. Resolve `<specs>` first with the "Resolve the Project Output Locations" step of the `tsh-discovering-technical-context` skill (default `specifications/`) and pass it in every `TASK`. You run in the main thread and fan out `tsh-architect` subagents, one per layer or app. The subagents never fan out further.

## Workflow

1. **Discover.** Load the `tsh-discovering-technical-context` skill. Identify the repository type. For a monorepo, list every app, package and shared library; each is analyzed and reported separately. Note the tech stack of each.
2. **Fan out.** Delegate to one `tsh-architect` subagent per layer or app, all in parallel, using the delegation prompt template below. The `TASK` names the layer path and tech stack and tells the subagent to load the `tsh-analyzing-codebase` skill (`references/audit-checklists.md`) and the `tsh-reviewing-code` skill, and to write its findings to `<specs>/code-quality/<layer>.findings.md` in the report's per-layer format. Apply the status handling below to each subagent on its own.
3. **Architecture review.** Delegate one more `tsh-architect` subagent for the architecture review checklist, with the findings files as `INPUT_ARTIFACTS`.
4. **Report.** Compile the findings, prioritize them by severity and write the report with the code quality report template of the `tsh-analyzing-codebase` skill. Keep the layers separate.

## Suggested next steps

Show the user: run `/tsh-implement` to fix the critical findings, or `/tsh-refactor` for the duplications.

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
