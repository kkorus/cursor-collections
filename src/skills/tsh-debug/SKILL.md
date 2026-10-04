---
name: tsh-debug
description: Systematically debug a bug, error, or unexpected behavior by reproducing, isolating the root cause, fixing it and verifying with tests. Use when the user types /tsh-debug, reports a bug, describes unexpected behavior, needs to track down a failing test, or wants a structured root-cause analysis before fixing.
type: command
routes-to: tsh-software-engineer
metadata:
  short-description: "Debug systematically: reproduce, isolate, fix, verify"
---

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

<!-- include: caller-status-handling -->
