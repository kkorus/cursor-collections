---
sidebar_position: 5
title: UI Reviewer
---

# UI Reviewer Agent

**Source:** `src/agents/tsh-ui-reviewer.md`  
**Kind:** subagent, model tier `deep`, read-only access

The UI Reviewer agent performs read-only verification comparing implemented UI against Figma designs and reports differences. It is called directly by a user, or by the Engineering Manager (on behalf of `/tsh-review-ui` and during the UI verify-fix loop). It does **not** fix code and does **not** capture the running UI itself: it compares the design with the capture evidence produced by the [UI Capture Worker](./ui-capture-worker).

## Responsibilities

- Getting the **EXPECTED** design state from Figma via the Figma MCP.
- Reading the **ACTUAL** implementation state from the capture artifacts (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`) in the iteration directory the caller passes.
- Comparing both using measured data — never by reading code or comparing mentally.
- Returning `VERIFICATION NOT RUN`, with a reason, when the artifacts are missing, stale or incomplete, or when the host cannot open the images. It is never PASS in that case.
- Recording the Figma node id and its version as fetched in each pass, so a design change in the middle of a loop becomes visible.
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
2. Reads the capture artifacts the caller passed (a fresh capture exists before every review pass).
3. Compares expected vs actual values.
4. Produces a **PASS/FAIL** report with a difference table showing exact values. A PASS is impossible while a Critical or Major difference remains. Content, data or state differences are returned as clarification questions instead of being counted as defects.
5. Reports `VERIFICATION NOT RUN` when it cannot verify, and says why.

:::info Read-Only
The UI Reviewer never modifies code. It only reports differences so the UI Engineer (via `/tsh-implement`) can fix them. When called in a loop, each call is an independent verification pass.
:::

## Tool access

- **Read-only.** The agent cannot edit or create files, so it returns its results in the reply.
- **No shell.** Shell access is denied on Claude Code.
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Figma, Sequential Thinking. It does not use Playwright; capture is done by the UI Capture Worker.

## Skills loaded

- `tsh-verifying-ui` (preloaded) - UI verification criteria and report format against Figma

## Invocation and modes

- **Delegated by:** the `tsh-engineering-manager`, in the `tsh-orchestrate-ui-verification` loop and in the UI-only mode behind `/tsh-review-ui`. In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
- **Read-only persona:** when run as a main-thread persona on Claude Code (`claude --agent`), the agent keeps its restrictions and cannot write files there either.
