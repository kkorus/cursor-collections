---
name: tsh-debugging
description: Systematic debugging process - reproduce, hypothesize, isolate, state the root cause, fix, verify. Use when investigating a bug, error, failing test or unexpected behavior, or when you need a root-cause analysis before changing code.
metadata:
  short-description: "Debug systematically: reproduce, isolate, fix, verify"
---
<!-- Generated from src/skills/tsh-debugging/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Debugging

Always fix root causes, never symptoms. Work through the steps in order.

```
Debugging progress:
- [ ] Step 1: Reproduce
- [ ] Step 2: Hypothesize
- [ ] Step 3: Isolate
- [ ] Step 4: State the root cause
- [ ] Step 5: Fix
- [ ] Step 6: Verify
```

**Step 1: Reproduce**

Confirm the bug is reproducible and document the exact conditions:

- Input or state that triggers the issue
- Expected behavior
- Actual behavior
- Environment (browser, runtime version, OS) if relevant
- Error message and stack trace, in full

If the bug cannot be reproduced, stop and ask for more details (when you cannot ask the user, report what is missing).

**Step 2: Hypothesize**

From the symptoms, form 2-3 ranked hypotheses. For each state what you think is wrong, which part of the code is suspect and what evidence would confirm or refute it. Rank by probability and investigate the most likely one first; do not investigate all at once.

**Step 3: Isolate**

Narrow down to a minimal reproducible case and verify or refute each hypothesis:

- Read the suspect code paths.
- Search for related patterns, recent changes and similar bugs.
- Add temporary logging or trace points if needed, and note where, so they can be removed.
- Stop when you can pinpoint the exact line(s) or condition.

**Step 4: State the root cause**

Before writing any fix, state it in one sentence: "The bug is caused by X in file Y because Z." If you cannot, you have not isolated the issue yet; go back to step 3.

**Step 5: Fix**

Change the code so that the root cause is gone. Do not add null checks or defensive code around broken logic without fixing the logic. The fix includes the files and lines to change, the intended behavior afterwards and the edge cases to handle.

**Step 6: Verify**

- Confirm the original bug no longer reproduces.
- Run the existing test suite; there must be no regressions.
- Write a regression test that would have caught this bug.
- Remove the temporary logging added in step 3.

## Constraints

- Do not skip the reproduction step: fixing an unconfirmed bug wastes time and adds unneeded changes.
- If the root cause is a design flaw that needs significant restructuring, stabilize the bug first and recommend `/tsh-refactor` for the rest.
- If the bug is in a third-party dependency, document the workaround and note the upgrade as follow-up work.

## Connected Skills

- `tsh-analyzing-codebase` - to trace execution paths and understand the affected code
- `tsh-discovering-technical-context` - for test patterns and conventions before writing the regression test
- `tsh-writing-e2e-tests` - for debugging failing or flaky Playwright tests
