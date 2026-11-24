---
sidebar_position: 6
title: Code Reviewer
---

# Code Reviewer Agent

**Source:** `src/agents/tsh-code-reviewer.md`  
**Kind:** subagent, model tier `balanced`, read-write access

The Code Reviewer agent performs structured code reviews against the implementation plan, requirements, and project standards.

## Responsibilities

- Verifying code **correctness** — functions as intended, meets requirements.
- Checking **code quality** — clean, efficient, maintainable, follows standards.
- Identifying **security** vulnerabilities and verifying proper security measures.
- Verifying **testing** — appropriate tests covering necessary scenarios.
- Ensuring **documentation** — well-documented code with comments.
- Checking **acceptance criteria** — verifying each item from the plan's checklist.
- Flagging **N+1** patterns (a query or remote call inside a loop over results) as part of the performance and scalability review.

## Review Process

1. Reads the project instructions (`AGENTS.md`, `CLAUDE.md`, rule files) that relate to the feature.
2. Understands project coding standards and best practices.
3. Loads relevant skills for the review domain.
4. Runs all necessary checks and tests.
5. Produces a structured review with findings categorized by severity.

## What It Produces

A structured review containing:

- Severity classification for each finding: `critical` (must fix before merge), `warning` (should fix), or `suggestion` (consider), ending with a verdict line (`No critical findings` or `Critical findings must be fixed`).
- Acceptance criteria verification (each item checked individually).
- Security, reliability, performance, and maintainability analysis.
- Recommended fix for each finding; `critical` findings must be fixed before merge.

## Tool access

- **Read-write.**
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Atlassian, Context7, Figma, Sequential Thinking.

## Skills loaded

- `tsh-reviewing-code` (preloaded) - Structured code review: correctness, security, quality
- `tsh-analyzing-implementation-gaps` - Compare a plan with the current state to find implementation gaps
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-designing-databases` - SQL and database design: schemas, indexing, queries, ORMs
- `tsh-reviewing-frontend` - Frontend code review criteria and anti-patterns
- `tsh-engineering-prompts` - LLM prompt patterns: structure, security, evaluation
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** `/tsh-review` and the `tsh-engineering-manager` (final review). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).

## Suggested next steps

The agent recommends these commands as text; it never starts them itself.

- `/tsh-implement Implement changes requested after code review` to fix the findings.
