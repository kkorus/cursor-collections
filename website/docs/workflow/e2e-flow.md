---
sidebar_position: 5
title: E2E Testing Flow
---

# E2E Testing Flow

For features that need end-to-end test coverage, use the E2E testing workflow. This creates comprehensive, reliable Playwright test suites for critical user journeys.

The route accepts a task description, Jira ID, standalone `*.research.md`, or `*.plan.md`. A missing research or plan companion triggers preparation and never authorizes implementation without a current actionable plan. Human approval of the exact current plan revision must be recorded before the first file-changing delegation. Normally the Architect records it at its own plan-authoring gate (`Approve plan`, `I have comments`); the Engineering Manager then validates that persisted record and reuses a valid one instead of asking again, and presents its own `Approve current plan` / `Request changes` / `Stop` gate only as fail-closed recovery when no valid current-revision record exists — never as a routine second authorization. The manager never writes the record itself: it has no document-editing tools, so recording the literal decision is a narrowly scoped delegation to `tsh-architect`. An automated `tsh-plan-reviewer` `APPROVED` verdict is Reviewer approval only, not permission to implement; a material revision after Human approval halts delegation and requires renewed Human approval, and no Reviewer re-review is invoked automatically; a new review event happens only when the user explicitly directs one.

Recording plan-authoring Human approval ends the **authoring discussion** — the discussion in which the plan was authored, reviewed, and approved. The Engineering Manager reports the exact plan path, the current `Plan Revision`, the persisted `Decision Timestamp`, and the review path when present, names implementation as the next step, and delegates no file change there. E2E implementation runs in a new discussion you start, where the unchanged persisted record is reused without a duplicate approval gate. The boundary is a lifecycle stop, not an approval-validity criterion: invalid or missing states still fail closed, and a material revision still requires renewed Human approval.

On every delegated or direct E2E execution-owner entry path, the owner validates the referenced plan from disk before changing files. If validation fails, it fails closed, names the exact failed field, condition, or file, and asks the user in chat which next step to take, spelling out the recovery choices: point to the correct plan path, obtain Human approval for an existing plan, start plan preparation, or, for a delegated subagent, hand back to `tsh-engineering-manager`. The answer is never Human approval; only Human Approval of the exact current plan revision authorizes implementation.

## Command Sequence

```text
1️⃣ /tsh-implement <JIRA_ID or task description>
   ↳ 🔍 Engineering Manager delegates to Context Engineer for research
   ↳ 📖 Review research doc – understand feature scope and user journeys
   ↳ ✅ Identify critical paths that need E2E coverage
   ↳ 🧱 Engineering Manager delegates to Architect for planning
   ↳ 📖 Review plan – confirm test scenarios and acceptance criteria
   ↳ ✅ Architect asks `Approve plan` / `I have comments` and records your decision — the normal authorization gate; confirm E2E testing is included before you approve
   ↳ 🛑 Authoring discussion ends here — start a new discussion to implement; the recorded approval is reused there
   ↳ 🧪 Engineering Manager delegates E2E tasks to the E2E Engineer agent
   ↳ 📖 Implements Page Objects, test files, and fixtures
   ↳ ✅ Run tests locally, verify they pass
   ↳ 🔄 Iterate on flaky or failing tests
```

:::tip
E2E test implementation is handled by the Engineering Manager as part of the standard `/tsh-implement` workflow. When the plan contains E2E test tasks, the Engineering Manager automatically delegates them to the E2E Engineer agent using the internal `tsh-implement-e2e` prompt.
:::

## What the E2E Engineer Does

When delegated to by the Engineering Manager, the E2E Engineer:

- Analyzes the application, designs test scenarios, and implements Page Objects.
- Uses **Playwright MCP** for real-time browser interaction and test verification.
- Follows BDD-style scenarios with proper Arrange-Act-Assert structure.
- Maps acceptance criteria to test scenarios.
- Verifies tests pass consistently **(3+ consecutive passes)** in headless mode before committing.

## What It Produces

- **Page Objects** — Reusable page abstractions with accessibility-first locators.
- **Test files** — Comprehensive test suites following the `should [behavior] when [condition]` naming pattern.
- **Fixtures** — Test data and setup utilities.
- **Execution report** — Summary of coverage, results, and any issues found.

## Testing Standards

The E2E Engineer agent enforces these standards:

| Standard | Approach |
|---|---|
| **Locators** | Use `getByRole`, `getByLabel`, `getByText`. Avoid CSS selectors. Use `getByTestId` only as fallback. |
| **Synchronization** | Built-in auto-waiting assertions. No `waitForTimeout()`. No `waitForLoadState('networkidle')`. |
| **Test data** | Dynamic data for every run (timestamps/UUIDs). Tests must not depend on state from other tests. |
| **Security** | Never hardcode credentials. Use environment variables. |
| **Naming** | `should [behavior] when [condition]` pattern. |

:::warning Important
The E2E Engineer agent generates tests using Playwright MCP for real-time browser interaction. Always run the generated tests locally, review test scenarios for completeness, and verify they cover the critical user journeys identified during research.
:::
