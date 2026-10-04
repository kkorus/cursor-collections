---
sidebar_position: 5
title: UI Reviewer
---

# UI Reviewer Agent

**Source:** `src/agents/tsh-ui-reviewer.md`  
**Kind:** subagent, model tier `deep`, read-only access

The UI Reviewer agent performs read-only verification comparing implemented UI against Figma designs and reports differences. It is called directly by a user, by `/tsh-review-ui`, or by the Engineering Manager during the UI verify-fix loop. It does **not** fix code.

## Responsibilities

- Getting the **EXPECTED** design state from Figma via the Figma MCP.
- Getting the **ACTUAL** implementation state from the running app via Playwright.
- Comparing both using measured data — never by reading code or comparing mentally.
- Producing a structured report with differences found following the verification order.
- Reporting tool failures transparently with LOW confidence when data is incomplete.

## What It Verifies

| Category       | Checks                                          |
| -------------- | ----------------------------------------------- |
| **Structure**  | Containers, nesting, grouping                   |
| **Dimensions** | Width, height, spacing, gaps                    |
| **Visual**     | Typography, colors, radii, shadows, backgrounds |
| **Components** | Correct variants, tokens, states                |

## How It Works

1. Extracts design specifications from Figma (fileKey + nodeId from URL).
2. Captures current implementation state via Playwright accessibility tree.
3. Compares expected vs actual values.
4. Produces a **PASS/FAIL** report with a difference table showing exact values.

:::info Read-Only
The UI Reviewer never modifies code. It only reports differences so the Software Engineer (via `/tsh-implement`) can fix them. When called in a loop, each call is an independent verification pass.
:::

## Tool access

- **Read-only.** The agent cannot edit or create files, so it returns its results in the reply.
- **No shell.** Shell access is denied on Claude Code.
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Figma, Playwright, Sequential Thinking.

## Skills loaded

- `tsh-verifying-ui` (preloaded) - UI verification criteria and report format against Figma

## Invocation and modes

- **Delegated by:** `/tsh-review-ui` and the `tsh-orchestrate-ui-verification` step of the `tsh-engineering-manager`. In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
- **Read-only persona:** when run as a main-thread persona on Claude Code (`claude --agent`), the agent keeps its restrictions and cannot write files there either.
