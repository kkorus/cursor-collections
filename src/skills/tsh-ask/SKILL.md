---
name: tsh-ask
description: Answer a technical or architectural question about the codebase and record the decision as a structured decision record (ADR). Use when the user types /tsh-ask, asks 'why does X work this way', needs a quick architectural consultation, wants to evaluate trade-offs between approaches, or needs a decision documented for future reference.
type: command
routes-to: tsh-architect
metadata:
  short-description: Answer architecture questions and record decisions as ADRs
---

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

<!-- include: caller-status-handling -->
