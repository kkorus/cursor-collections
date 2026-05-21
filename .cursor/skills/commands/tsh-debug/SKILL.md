---
name: tsh-debug
description: "Systematically debug a bug, error, or unexpected behavior by reproducing, isolating root cause, implementing a fix, and verifying with tests. Use when the user types /tsh-debug, reports a bug, describes unexpected behavior, needs to track down a failing test, or wants a structured root-cause analysis before fixing."
disable-model-invocation: true
---

# /tsh-debug

Systematically reproduce, isolate, fix, and verify a bug or unexpected behavior. Delegates the fix implementation to `tsh-software-engineer`. Always fixes root causes — never symptoms.

## Required Skills

- `tsh-codebase-analysing` — to trace execution paths and understand the affected code
- `tsh-technical-context-discovering` — to establish test patterns and project conventions before writing regression tests

## Workflow

1. **Reproduce** — Confirm the bug is reproducible. Document the exact conditions:
   - Input / state that triggers the issue
   - Expected behavior
   - Actual behavior
   - Environment (browser, Node version, OS, etc. — if relevant)
   - Error message / stack trace (full, not truncated)

   If the bug cannot be reproduced, stop and ask the user for more details.

2. **Hypothesize** — Based on the symptoms, form 2–3 ranked hypotheses for the root cause. For each:
   - State what you think is wrong
   - State which part of the code is suspect
   - State what evidence would confirm or refute it

   Rank by probability. Do not investigate all hypotheses simultaneously — start with the most likely.

3. **Isolate** — Narrow to a minimal reproducible case. Verify or refute each hypothesis:
   - Read the suspect code paths
   - Search for related patterns, recent changes, or similar bugs
   - Add temporary logging or trace points if needed (note where you added them so they can be removed)
   - Stop when you can pinpoint the exact line(s) or condition causing the issue

4. **Root cause statement** — Before writing any fix, state the root cause in one sentence:
   > "The bug is caused by X in file Y because Z."

   If you cannot state this clearly, you have not isolated the issue yet — go back to step 3.

5. **Fix** — Delegate the fix implementation to `tsh-software-engineer`. Provide:
   - The root cause statement
   - The exact files and lines to change
   - The intended behavior after the fix
   - Any edge cases to handle

   The fix must address the root cause, not mask the symptom. Do not add null checks around broken logic without fixing the logic.

6. **Verify** — After the fix is applied:
   - Confirm the original bug no longer reproduces
   - Run the existing test suite — no regressions
   - Write a regression test that would have caught this bug
   - Remove any temporary logging added in step 3

## Constraints

- Do NOT skip the reproduction step — fixing an unconfirmed bug wastes time and introduces unneeded changes.
- Do NOT implement fixes directly — always delegate to `tsh-software-engineer`.
- Do NOT add defensive code around broken logic without fixing the logic itself.
- If the root cause turns out to be a design flaw requiring significant refactoring, recommend `/tsh-refactor` instead of patching inline.
- If the bug is in a third-party dependency, document the workaround and create a ticket to upgrade.

## Connected Skills

- `tsh-codebase-analysing` — loaded to trace execution paths and understand the affected code
- `tsh-technical-context-discovering` — loaded to establish test patterns before writing regression tests
- `tsh-refactor` — when root cause is a structural problem; use after the immediate bug is stabilized
- `tsh-ask` — when the bug reveals an architectural question worth recording as a decision
