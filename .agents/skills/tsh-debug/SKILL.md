---
name: tsh-debug
description: Systematically debug a bug, error, or unexpected behavior by reproducing, isolating the root cause, fixing it and verifying with tests. Use when the user types /tsh-debug, reports a bug, describes unexpected behavior, needs to track down a failing test, or wants a structured root-cause analysis before fixing.
disable-model-invocation: true
metadata:
  short-description: "Debug systematically: reproduce, isolate, fix, verify"
---
<!-- Generated from src/skills/tsh-debug/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-debug

Debug the bug or unexpected behavior the user describes. You investigate in the main thread and delegate the fix to the `tsh-software-engineer` subagent.

## Workflow

1. Load the `tsh-debugging` skill and follow steps 1-4 (reproduce, hypothesize, isolate, root cause statement). Ask the user if the bug cannot be reproduced.
2. Delegate the fix (step 5) to `tsh-software-engineer` with the delegation prompt template below. The `TASK` holds the root cause statement, the exact files and lines, the intended behavior, the edge cases, and the instruction to add a regression test and to load the `tsh-debugging` skill.
3. Handle the returned status as described below.
4. Verify (step 6): the original bug no longer reproduces, the test suite passes, the regression test exists, temporary logging is removed.

## Constraints

- Never implement the fix yourself; the fix always goes to `tsh-software-engineer`.
- Never skip reproduction.

## Suggested next steps

Show the user, where they apply: run `/tsh-refactor` if the root cause is structural, `/tsh-ask` if the bug raises an architectural question.

## Delegating and Handling Agent Status

Delegation goes one level deep. You delegate from the main thread, and the agents you delegate to never delegate further. Delegated agents start with a clean context and do not see this conversation, so put everything they need into the delegation prompt.

### Delegation prompt template

```
MODE: delegated
CALLER: <name of your skill or command>
TASK: <what to do, stated specifically>
INPUT_ARTIFACTS:
- <explicit path of each file the agent needs>
PRIOR_OUTPUT: <re-delegation only: the previous STATUS block, verbatim>
USER_ANSWERS: <re-delegation only: the user's answers, numbered like the questions>
```

- The first line must be exactly `MODE: delegated`. Without it the agent runs in interactive mode and will ask the user instead of returning a status.
- Pass artifact paths explicitly. Never ask the agent to search for them.
- Omit `PRIOR_OUTPUT` and `USER_ANSWERS` on the first delegation.

### Reading the returned status

Every delegated agent ends its reply with a `STATUS:` block (`STATUS`, `ARTIFACTS`, `SUMMARY`, `QUESTIONS`, `DECISION_NEEDED`, `BLOCKER`). Some tools return the block on a single line (`STATUS: DONE SUMMARY: ...`), so parsing must not depend on line breaks:

- Find the last `STATUS:` followed by one of the four values.
- Read each field as the text after its capitalized name and colon, up to the next field name or the end of the reply.

### Handling each status

| Status | What you do |
|---|---|
| `DONE` | Continue with the workflow. Use the paths in `ARTIFACTS`. |
| `NEEDS_INPUT` | Ask the user the listed `QUESTIONS` in the main thread, all at once and numbered. Then delegate to the same agent again with `PRIOR_OUTPUT` and `USER_ANSWERS`. |
| `NEEDS_ARCHITECT_DECISION` | Delegate to the `tsh-architect` subagent with `DECISION_NEEDED` as the task. Then delegate to the original agent again, with the status block followed by the architect's decision in `PRIOR_OUTPUT`. |
| `BLOCKED` | Show the `BLOCKER` to the user and stop that branch of the work. |
| Missing or unparsable | Treat it as `BLOCKED` and show the raw output to the user. |

### Iteration cap

Re-delegate to the same agent at most 3 times per task. After that, stop and escalate to the user with the latest output. Loops that a workflow defines with their own caps (plan review, UI verification) keep those caps.
