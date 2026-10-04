---
sidebar_position: 7
title: E2E Engineer
---

# E2E Engineer Agent

**Source:** `src/agents/tsh-e2e-engineer.md`  
**Kind:** subagent, model tier `fast`, read-write access

The E2E Engineer agent creates, maintains, and debugs end-to-end tests using Playwright. It produces reliable, maintainable, and meaningful test suites.

## Responsibilities

- Analyzing the application and designing test scenarios.
- Implementing Page Objects with accessibility-first locators.
- Writing comprehensive test files with proper structure.
- Verifying tests pass consistently (3+ consecutive passes) in headless mode.
- Debugging flaky tests and ensuring CI readiness.
- Reporting bugs discovered during testing.

## Testing Standards

| Standard | Approach |
|---|---|
| **Locators** | Use `getByRole`, `getByLabel`, `getByText`. Avoid CSS selectors. `getByTestId` only as fallback. |
| **Synchronization** | Built-in auto-waiting assertions. No `waitForTimeout()`. No `networkidle`. |
| **Test Data** | Dynamic data with timestamps/UUIDs. No state dependency between tests. |
| **Security** | Never hardcode credentials. Use environment variables. |
| **Naming** | `should [behavior] when [condition]` pattern. |
| **Isolation** | Tests must not depend on state left by previous tests. |

## Key Behaviors

- **Non-interactive** — Makes reasonable decisions and documents them.
- **Strictly follows the plan** — Does not deviate unless explicitly instructed.
- **No dead code** — Does not create unused test helpers or future-only tests.
- **3+ consecutive passes** — Required before tests are considered stable.

## Tool access

- **Read-write.**
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Figma, Playwright, Sequential Thinking.

## Skills loaded

- `tsh-writing-e2e-tests` (preloaded) - Playwright E2E testing patterns and CI readiness
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-analyzing-requirements` - Analyze a task and build its context and research document
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** the `tsh-engineering-manager` (E2E test tasks). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).

## Suggested next steps

The agent recommends these commands as text; it never starts them itself.

- `/tsh-implement Fix the bug discovered during E2E testing` when testing uncovered a bug.
