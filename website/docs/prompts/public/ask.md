---
sidebar_position: 17
title: /tsh-ask
---

# /tsh-ask

**Agent:** (self-contained — uses codebase analysis skills)  
**File:** `.cursor/skills/commands/tsh-ask/SKILL.md`

Answers a technical or architectural question by researching the codebase and recording the decision as `{topic}.decision.md` in `specifications/decisions/`.

## Usage

```text
/tsh-ask <question or topic>
```

## What It Does

1. Classifies the question (why / should we / what pattern).
2. Researches codebase and `*.mdc` rules.
3. Evaluates options with trade-offs when applicable.
4. Saves an ADR-style decision file and summarizes inline.

## Skills Loaded

- `tsh-codebase-analysing`
- `tsh-technical-context-discovering`

## Output

`specifications/decisions/<topic>.decision.md`
