---
name: tsh-review
description: Review the implementation against the plan and feature context. Use when the user types /tsh-review, asks to review code, or wants a quality check on the implementation. Routes to the tsh-code-reviewer agent.
disable-model-invocation: true
metadata:
  short-description: Review an implementation against the plan
---
<!-- Generated from src/skills/tsh-review/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-review

Delegate to the `tsh-code-reviewer` subagent. Your goal is to review the implementation against the provided implementation plan and feature context.

Make sure to review not only the code and its acceptance criteria but also consider security aspects, code quality, testing coverage, and documentation.

## Required Skills

Before starting, load and follow these skills:

- `tsh-reviewing-code` — structured code review process (correctness, quality, security, testing, best practices, scalability)
- `tsh-analyzing-implementation-gaps` - to compare the implemented solution against the plan and verify completeness
- `tsh-discovering-technical-context` - to understand project conventions and coding standards to review against
- `tsh-designing-databases` - when reviewing database-related changes: schema design, migration safety, query performance, index coverage, and ORM usage
- `tsh-engineering-prompts` - when reviewing LLM prompt code: verify prompt structure, injection defenses, delimiter separation, output format specification, anti-patterns, and optimization opportunities

## Workflow

1. **Understand context**: Load the `*.research.md` and `*.plan.md` files to understand the task requirements and implementation plan. Ensure to review project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`) for project-specific guidelines.
2. **Review implementation**: Focus on code correctness, code quality, security, testing, and documentation.
3. **Verify definition of done**: Check each item from the tasks' definition of done defined in the plan phases. When the definition of done is met, check the box for the completed item in the plan document.
4. **Verify acceptance criteria**: Check each item from the acceptance criteria checklist in the plan file. When the acceptance criteria is met, check the box for the completed item.
5. **Verify quality gates**: Run all relevant tests (unit, integration, E2E) and ensure they pass. Run static code analysis tools, linters, and formatting tools to ensure code quality. Make sure to check app build and docker build if applicable.
6. **Summarize findings**: Provide a summary of findings, including any issues identified and recommendations for improvement.
7. **Document results**: Add findings to the plan file at the end in a new section named "Code Review Findings".
8. **Update changelog**: Add information that code review was performed to the changelog section of the plan file.

When it comes to updating the definition of done and acceptance criteria checklist, you can only update those by checking the box for completed items. Do not modify the text of those sections.

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
