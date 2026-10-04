---
name: tsh-ask
description: Answer a technical or architectural question about the codebase and record the decision as a structured ADR (Architecture Decision Record). Use when the user types /tsh-ask, asks 'why does X work this way', needs a quick architectural consultation, wants to evaluate trade-offs between approaches, or needs a decision documented for future reference.
disable-model-invocation: true
metadata:
  short-description: Answer architecture questions and record decisions as ADRs
---
<!-- Generated from src/skills/tsh-ask/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-ask

Answer a technical or architectural question by researching the codebase, evaluating options, and recording the decision as a `{topic}.decision.md` file in `specifications/decisions/`.

## Required Skills

- `tsh-analyzing-codebase` — to understand the current implementation context relevant to the question
- `tsh-discovering-technical-context` — to establish project conventions and patterns before evaluating options

## Workflow

1. **Understand the question** — Identify what is being asked: a "why" question (explain existing decision), a "should we" question (evaluate options), or a "what is the right pattern" question (prescribe approach).

2. **Research context** — Search the codebase for relevant files, patterns, and prior decisions. Read project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`) for existing constraints.

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

## Connected Skills

- `tsh-analyzing-codebase` — loaded during research to understand existing implementation
- `tsh-discovering-technical-context` — loaded to establish conventions before evaluating options
- `tsh-debug` — if the answer reveals a bug, escalate there instead of implementing inline
- `tsh-refactor` — if the answer reveals a structural improvement, escalate there for planned execution
