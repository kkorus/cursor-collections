---
sidebar_position: 17
title: /tsh-ask
---

# /tsh-ask

**Source:** `src/skills/tsh-ask/SKILL.md`  
**Routes to:** [Architect](../agents/architect) subagent (`tsh-architect`), delegated from the main thread

Answers a technical or architectural question about the codebase and records the decision. The command runs in the main thread and talks to you directly; only the analysis is delegated.

## Usage

```text
/tsh-ask <question>
```

## What it does

1. Identifies the question type: a "why" question (explain an existing decision), a "should we" question (evaluate options) or a "what is the right pattern" question. Asks you when the question is ambiguous.
2. Delegates the analysis to the Architect, which researches the codebase, prior decisions and project instructions (`AGENTS.md`, `CLAUDE.md`, rule files). For "should we" questions it evaluates 2-3 options with trade-offs and picks one.
3. Saves a decision record to `specifications/decisions/<topic>.decision.md`.
4. Gives you a 3-5 sentence summary and the file path.

This command only researches and writes one file. It implements nothing.

## Suggested next steps

`/tsh-implement` to implement the decision, `/tsh-debug` if the answer reveals a bug, `/tsh-refactor` if it reveals a structural improvement.
