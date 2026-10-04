---
name: tsh-reviewing-code
description: Structured code review of an implementation against a plan or, without a plan, against the task description and the diff, covering correctness, quality, security, testing, best practices and scalability, with a fixed findings format. Use when reviewing implementations, running quality gates, verifying code against a plan, or doing a post-implementation review.
metadata:
  short-description: "Structured code review: correctness, security, quality"
---
<!-- Generated from src/skills/tsh-reviewing-code/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Reviewing Code

Structured process to verify that implemented code follows best practices and quality standards and that it delivers what was planned. Review not only the code and its acceptance criteria, but also security, code quality, test coverage and documentation.

## Contents

- Code Review Process
- No plan available
- Findings format
- When tests cannot run
- LLM-integrated code
- Connected Skills

## Code Review Process

Use the checklist below and track your progress:

```
Review progress:
- [ ] Step 1: Understand the task and project context
- [ ] Step 2: Understand the plan
- [ ] Step 3: Compare the implementation with the task and the plan
- [ ] Step 4: Verify that the necessary tests exist
- [ ] Step 5: Run the quality gates (unit, integration, e2e, static analysis, formatting, build)
- [ ] Step 6: Verify the best practices
- [ ] Step 7: Validate security
- [ ] Step 8: Validate scalability
- [ ] Step 9: Verify the definition of done and the acceptance criteria
- [ ] Step 10: Report the findings
```

**Step 1: Understand the task and project context**

Look for the `*.research.md` file to understand the business goal. If the task lives in a task management tool, use it to get more context. Without a research file, follow the conversation. Read the project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`) for project-specific guidelines and coding standards.

**Step 2: Understand the plan**

Look for the `*.plan.md` file to understand the planned solution. Without one, follow "No plan available" below.

**Step 3: Compare the implementation with the task and the plan**

Compare what was built with the task description and the plan. Look not only at the files that were changed or added, but also at the ones the plan claims are already implemented.

**Step 4: Verify that the necessary tests exist**

All critical paths must be covered by a combination of unit, integration and e2e tests.

**Step 5: Run the quality gates**

Find and run the unit tests, the integration tests and the e2e tests, and make sure they pass. Run linters, static analysis and formatting tools. Check that the application builds, and that the docker build works where one exists. If something cannot be run, see "When tests cannot run".

**Step 6: Verify the best practices**

Check that the solution follows the project standards and practices like SOLID, SRP, DDD, DRY, KISS and Atomic Design. It must not be over-engineered, and the cognitive complexity should stay low.

**Step 7: Validate security**

Check for OWASP Top 10 issues and for critical issues that would let a user take control over the system.

**Step 8: Validate scalability**

Check that the solution can scale horizontally, has no needlessly stateful components and has no code with high computational complexity.

**Step 9: Verify the definition of done and the acceptance criteria**

With a plan: go through the definition of done of each task and the acceptance criteria checklist one by one. Check a box in the plan only when the item is verified. Never change the text of those sections.

**Step 10: Report the findings**

Write the findings in the format below. With a plan, add them to the end of the plan file in a new section named "Code Review Findings" and add a changelog entry saying that a code review was performed. Give the caller a short summary with the counts per severity.

## No plan available

Without a plan file (for example after the Quick implementation flow), review the change itself:

1. Get the task description from the caller or the conversation. If it is unclear what the change should do, ask (in delegated mode return `NEEDS_INPUT`).
2. Determine the diff: the base branch or commit range the caller gave you, otherwise the uncommitted changes, otherwise the latest commit.
3. Review the diff and the code around it. There is no definition of done or acceptance checklist; derive the expected behavior from the task description and judge the change against it.
4. Do all quality gates in Step 5 and the checks in Steps 6 to 8.
5. Return the findings in your reply. Do not create a plan file; write a report file only if the caller named a path.

## Findings format

Group the findings by severity, most severe first. Other review skills (for example `tsh-reviewing-frontend`) reuse this format and define no severities of their own.

| Severity | Meaning | Action |
|---|---|---|
| `critical` | Bug, security hole, data loss risk or a broken requirement | Must fix before merge |
| `warning` | Likely problem, missing test, maintainability risk | Should fix |
| `suggestion` | Improvement that is optional | Consider |

Write each finding as:

```
### [critical|warning|suggestion] <short title>
- Location: `path/to/file.ext#L10-L24`
- Issue: <what is wrong and why it matters>
- Fix: <the concrete change that resolves it>
```

End the findings with a verdict line: `No critical findings` or `Critical findings must be fixed` and the counts.

## When tests cannot run

If tests, the build or linters cannot be run (missing environment, services, credentials or tooling), do not report them as passing and do not skip the gate silently:

1. Say which gate was not run and why.
2. Review the related tests and configuration statically, and compensate by reading the code paths more closely.
3. Add a `warning` finding for each gate that was not run.
4. In delegated mode, return `BLOCKED` only when nothing meaningful can be reviewed without running it. Otherwise return `DONE` with the warnings.

## LLM-integrated code

Detect whether the change touches LLM-integrated code: search the changed files and their neighbors for prompt or template files (for example a `prompts/` directory or `*.prompt.txt` files) and for LLM client usage (`openai`, `anthropic`, `bedrock`, `converse`, `langchain`). If you find any, also load the `tsh-engineering-prompts` skill and verify in the review:

- prompt injection defenses for untrusted input
- delimiter separation between instructions and data
- an explicit output format specification
- no hardcoded role or persona inside user prompts

Report these findings together with the other review findings.

## Connected Skills

- `tsh-analyzing-implementation-gaps` - to compare the implementation with the plan and verify completeness
- `tsh-discovering-technical-context` - for the project conventions and standards to review against
- `tsh-designing-databases` - for SQL quality, index coverage, query performance, schema design and ORM usage
- `tsh-engineering-prompts` - for LLM prompt code: structure, injection defenses, delimiter separation, output format and anti-patterns
- `tsh-reviewing-frontend` - for frontend changes, in addition to this review
- `tsh-ensuring-accessibility` - when the change affects user-facing UI
- `tsh-writing-e2e-tests` - to judge the quality of e2e tests
