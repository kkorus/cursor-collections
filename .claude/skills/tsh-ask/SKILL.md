---
name: tsh-ask
description: Answer a technical or architectural question about the codebase and record the decision as a structured decision record (ADR). Use when the user types /tsh-ask, asks 'why does X work this way', needs a quick architectural consultation, wants to evaluate trade-offs between approaches, or needs a decision documented for future reference.
disable-model-invocation: true
metadata:
  short-description: Answer architecture questions and record decisions as ADRs
---
<!-- Generated from src/skills/tsh-ask/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-ask

Answer a technical or architectural question by researching the codebase, evaluating options, and recording the decision as `specifications/decisions/{topic}.decision.md`. You run in the main thread and talk to the user directly. You delegate only the analysis to the `tsh-architect` subagent.

## Workflow

1. **Understand the question.** Identify what is asked: a "why" question (explain an existing decision), a "should we" question (evaluate options) or a "what is the right pattern" question (prescribe an approach). Ask the user for clarification yourself if the question is ambiguous.
2. **Delegate the analysis.** Delegate to `tsh-architect` with the delegation prompt template below. The `TASK` states the question and its type, and tells the architect to:
   - load the `tsh-analyzing-codebase`, `tsh-discovering-technical-context` and `tsh-designing-architecture` skills
   - research the codebase, prior decisions and the project instructions (`AGENTS.md`, `CLAUDE.md`, rules files)
   - for "should we" and "pattern" questions, evaluate 2-3 concrete options with their trade-offs and consistency with existing patterns, then pick one; if the answer is "it depends", name the exact conditions
   - save the record as `specifications/decisions/{topic}.decision.md` (kebab-case topic) using the decision record template of the `tsh-designing-architecture` skill
3. **Handle the status** as described below. Put the user's follow-up questions into `USER_ANSWERS` on re-delegation.
4. **Present the answer.** Give the user a 3-5 sentence summary and the path of the decision file. Offer to go deeper on any option.

## Constraints

- Always produce a `.decision.md` file, even when the answer is obvious; it becomes reference documentation.
- Do NOT implement anything. This command researches and writes one file.

## Suggested next steps

Show the user, where they apply: run `/tsh-implement` to implement the decision, `/tsh-debug` if the answer reveals a bug, `/tsh-refactor` if it reveals a structural improvement.

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
