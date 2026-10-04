---
sidebar_position: 18
title: /tsh-debug
---

# /tsh-debug

**Source:** `src/skills/tsh-debug/SKILL.md`  
**Routes to:** [Software Engineer](../agents/software-engineer) subagent (`tsh-software-engineer`), delegated from the main thread

Debugs a bug or unexpected behavior systematically. The command investigates in the main thread and delegates only the fix.

## Usage

```text
/tsh-debug <bug description, error message or failing test>
```

## What it does

1. Loads the `tsh-debugging` skill and follows steps 1-4: reproduce, hypothesize, isolate, state the root cause. Asks you if the bug cannot be reproduced.
2. Delegates the fix to the Software Engineer with the root cause, the exact files and lines, the intended behavior and the edge cases. The engineer adds a regression test.
3. Verifies: the original bug no longer reproduces, the test suite passes, the regression test exists and temporary logging is removed.

The command never fixes the bug itself and never skips reproduction.

## Suggested next steps

`/tsh-refactor` if the root cause is structural, `/tsh-ask` if the bug raises an architectural question.
