---
name: tsh-ask
description: "Answer a technical or architectural question about the codebase and record the decision as a structured ADR (Architecture Decision Record). Use when the user types /tsh-ask, asks 'why does X work this way', needs a quick architectural consultation, wants to evaluate trade-offs between approaches, or needs a decision documented for future reference."
disable-model-invocation: true
---

# /tsh-ask

Answer a technical or architectural question by researching the codebase, evaluating options, and recording the decision as a `{topic}.decision.md` file in `specifications/decisions/`.

## Required Skills

- `tsh-codebase-analysing` — to understand the current implementation context relevant to the question
- `tsh-technical-context-discovering` — to establish project conventions and patterns before evaluating options

## Workflow

1. **Understand the question** — Identify what is being asked: a "why" question (explain existing decision), a "should we" question (evaluate options), or a "what is the right pattern" question (prescribe approach).

2. **Research context** — Search the codebase for relevant files, patterns, and prior decisions. Read `*.mdc rules` for existing constraints.

3. **Evaluate options** — For "should we" and "pattern" questions, identify 2–3 concrete options. For each:
   - What problem does it solve?
   - What are the trade-offs (complexity, performance, maintainability, consistency with existing patterns)?
   - What does this codebase's existing pattern suggest?

4. **Form a recommendation** — Pick one option. State the decision clearly. If the answer is "it depends", specify the exact conditions that determine the choice — do not leave the decision open.

5. **Save the decision record** — Create `specifications/decisions/{topic}.decision.md` using the output format below. Use kebab-case for the filename (e.g., `optimistic-vs-pessimistic-locking.decision.md`).

6. **Summarize inline** — After saving, provide a brief inline summary (3–5 sentences) so the user sees the answer without opening the file.

## Output Format

```markdown
# Decision: {topic}

**Status:** PROPOSED | ACCEPTED | SUPERSEDED  
**Date:** {date}

## Context

{1-2 paragraphs describing the situation, constraints, and why this decision was needed}

## Options Considered

### Option 1: {name}
- **Pros:** ...
- **Cons:** ...

### Option 2: {name}
- **Pros:** ...
- **Cons:** ...

## Decision

{Clear statement of what was decided and why — one paragraph}

## Consequences

- {What becomes easier}
- {What becomes harder or requires attention}

## Rationale

{Why this option over the others — reference project conventions, existing patterns, team constraints}
```

## Constraints

- Always produce a `.decision.md` file — the artifact is the point, not just the chat answer.
- If the answer is obvious and requires no trade-off analysis, still save it — it becomes reference documentation.
- Do NOT implement anything. This command is read-only + write-one-file only.
- If the question requires implementation work, recommend `/tsh-implement` after answering.

## Connected Skills

- `tsh-codebase-analysing` — loaded during research to understand existing implementation
- `tsh-technical-context-discovering` — loaded to establish conventions before evaluating options
- `tsh-debug` — if the answer reveals a bug, escalate there instead of implementing inline
- `tsh-refactor` — if the answer reveals a structural improvement, escalate there for planned execution
