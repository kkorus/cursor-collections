---
sidebar_position: 4
title: UI Verification Flow
---

This page explains the exact post-implementation UI verification loop for Figma-backed UI work. It covers who does what, which artifacts are produced, when the flow blocks, and how the fix -> capture -> review loop closes.

This loop is reached through the canonical `/tsh-implement` workflow. A missing research or plan companion triggers preparation and never authorizes implementation without a current actionable plan. Both Quick and Full routes require Human approval of the exact current plan revision before the first file-changing delegation; automated Reviewer approval is not permission to implement. A material revision after Human approval requires Reviewer re-review and renewed Human approval before work resumes.

On every delegated or direct UI execution-owner entry path, the owner validates the referenced plan from disk before changing implementation or capture/verification-related artifacts. If validation fails, it fails closed, names the exact failed field, condition, or file, and asks the user in chat which next step to take, spelling out the recovery choices: point to the correct plan path, obtain Human approval for an existing plan, start plan preparation, or, for a delegated subagent, hand back to `tsh-engineering-manager`. The answer is never Human approval; only Human Approval of the exact current plan revision authorizes implementation.

:::info Mermaid Rendering
The diagrams below are authored in Mermaid. They render correctly in GitHub-flavored Markdown and many Markdown viewers. In the current documentation-site configuration, Mermaid support is not enabled yet, so these blocks may appear as code blocks on the published site until Mermaid is enabled there.
:::

## Why This Flow Exists

Build, lint, unit tests, and code review do **not** prove that the UI matches Figma. This flow exists to enforce a separate UI gate based on:

- **EXPECTED** from Figma MCP
- **ACTUAL** from live CLI capture against the running app
- A structured reviewer pass that compares structure, layout, dimensions, visuals, and component usage

The item is done only when the UI gate returns `PASS`, or when the user explicitly acknowledges a blocker and the item is marked `ESCALATED`.

## User-Friendly Graph

```mermaid
flowchart TD
    A[User runs /tsh-implement] --> B[Engineering Manager starts the implementation workflow]
    B --> C[Research and planning happen if needed]
    C --> C2[UI inventory captured and Figma reference readiness confirmed]
    C2 --> D[User confirms the exact full dev server URL]
    D --> GATE{Engineering Manager: Human approval gate}
    GATE -- Request changes --> C
    GATE -- Stop --> STOP[Flow stops, no implementation]
    GATE -- Approve current plan --> E[UI Engineer implements or updates the UI]
    E --> F[Code-level validation runs: lint, build, tests]
    F --> G[Capture Worker opens the running app and collects fresh evidence]
    G --> H{Was capture successful?}
    H -- No --> I[Blocker goes back to the orchestrator]
    I --> J[Orchestrator asks the user what to do]
    J --> G
    H -- Yes --> K[UI Reviewer gets Figma EXPECTED and ACTUAL artifacts]
    K --> L{Review result}
    L -- PASS --> M[UI gate cleared for this item]
    L -- FAIL --> N[UI Engineer fixes the reported differences]
    N --> G
    L -- VERIFICATION NOT RUN --> I
    M --> O{Are all UI items cleared?}
    O -- No --> G
    O -- Yes --> P[Code review can start]
```

## Step-by-Step Flow

### 1. The Workflow Starts in `/tsh-implement`

The entrypoint is `/tsh-implement`, which runs the Engineering Manager through the canonical orchestration skill.

The orchestrator:

- checks whether research and plan artifacts already exist
- fills missing context through Context Engineer and Architect when needed
- captures the UI inventory — every `[REUSE]` UI task and every Figma URL — and confirms Figma reference readiness
- asks for the **exact full dev server URL** once the UI inventory is non-empty, after UI/Figma readiness is confirmed and before the Human approval gate
- presents the Human approval gate for the exact current plan revision, offering exactly `Approve current plan`, `Request changes`, `Stop`
- delegates UI implementation to the UI Engineer only after `Approve current plan`

The URL is a **pinned session input**. Once confirmed, it must be forwarded unchanged through every capture and review pass.

### 2. UI Engineer Implements the UI Slice

The UI Engineer owns implementation work only. It can:

- implement the requested UI changes
- run local code validation such as lint, build, or tests
- delegate capture and review after each UI pass

It does **not** close the item just because the code compiles.

### 3. Capture Worker Collects ACTUAL Evidence

The Capture Worker is a mechanical evidence collector. It never judges visual correctness.

It must collect all three ACTUAL artifacts into the current iteration directory:

- `actual.png`
- `computed-styles.json`
- `a11y-snapshot.yml`

The canonical artifact directory is:

```text
specifications/<verification-id>/ui-verification/          # $UI_VERIFICATION_DIR
  figma-expected.png                                       # $FIGMA_EXPECTED
  iteration-<N>/                                           # $ARTIFACT_DIR
```

`<verification-id>` is the task ID when available, otherwise a stable page/component slug. Capture, review, and the PASS gate must all use the same `$UI_VERIFICATION_DIR`.

The capture flow is:

1. create the iteration directory
2. open a named Playwright CLI session
3. resize to the Figma frame width
4. go to the pinned full URL
5. stabilize the render
6. save screenshot, accessibility snapshot, and computed styles
7. confirm the files exist in the iteration directory
8. clean up the session

If even one required artifact is missing, the verification is invalid.

### 4. Authentication and Access Gates Are Hard Blockers

Neither the orchestrator nor the capture/review workers may bypass login or access control.

If the page requires authentication or a specific access level:

- the worker returns a blocker to the caller
- the caller asks the user how authentication should happen
- the user must decide the login method and provide what is needed
- the flow resumes only after the blocker is resolved

If the worker notices that the gate is trivially bypassable, it must report that as a **potential security vulnerability** in the blocker notes. It may never exploit that weakness.

### 5. Reviewer Collects EXPECTED from Figma

The Reviewer is the design judge. It must obtain EXPECTED from Figma MCP, not from a browser screenshot.

On every pass it ensures the current iteration directory contains:

- `figma-expected.png`

If the export is missing, it exports it from Figma MCP before comparing. If Figma MCP is unavailable or the node cannot be resolved, the result is `VERIFICATION NOT RUN`.

### 6. Reviewer Compares in a Fixed Order

The reviewer compares the implementation against Figma in this order:

1. Structure
2. Layout
3. Dimensions
4. Visual
5. Components

It uses:

- multimodal comparison of `figma-expected.png` and `actual.png`
- `computed-styles.json` for measured sizes and layout values
- `a11y-snapshot.yml` for structure and grouping

This order matters because a visually similar screen can still be structurally wrong.

### 7. Reviewer Returns One of Three States

The reviewer returns exactly one of these outcomes:

- `PASS` — the item matches Figma within the allowed tolerances
- `FAIL` — there are actionable mismatches to fix
- `VERIFICATION NOT RUN` — the review could not be completed on trustworthy evidence

`VERIFICATION NOT RUN` is a blocker state, not a visual verdict.

### 8. FAIL Starts Another Iteration

If the reviewer returns `FAIL`:

1. UI Engineer applies fixes
2. Capture Worker runs again on a fresh iteration
3. Reviewer runs again on the fresh artifacts

This loop repeats until:

- the item becomes `PASS`, or
- the flow reaches the 5-iteration budget and moves to a structured user gate

### 9. The 5-Iteration Limit

After 5 full FAIL iterations, the flow must stop and ask the user what to do next.

The user gate offers:

- continue with an explicit extra iteration count
- stop and accept the item as `ESCALATED`
- provide a custom instruction

This prevents infinite loops and keeps the user in control of tradeoffs.

### 10. Code Review Starts Only After the UI Gate Clears

Code review is a separate gate. It starts only after every Figma-backed UI item is either:

- `PASSED`, or
- explicitly acknowledged as `ESCALATED`

Build success, lint success, tests, and code review do not substitute for UI verification.

## Artifacts and Outputs

### Required Files Per Iteration

```text
specifications/<verification-id>/ui-verification/   # $UI_VERIFICATION_DIR
  figma-expected.png                                  # $FIGMA_EXPECTED (shared across iterations)
  iteration-<N>/                                      # $ARTIFACT_DIR
    actual.png
    computed-styles.json
    a11y-snapshot.yml
    report.md
```

### Who Produces What

| Owner               | Input                           | Output                                                                     |
| ------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| Engineering Manager | task description, Jira ID, standalone `*.research.md`, or `*.plan.md` | routing, gates, user questions |
| UI Engineer         | plan + UI task slice            | code changes                                                               |
| UI Capture Worker   | pinned full URL + iteration dir | `actual.png`, `computed-styles.json`, `a11y-snapshot.yml`, capture summary |
| UI Reviewer         | Figma URL + iteration dir       | `PASS`, `FAIL`, or `VERIFICATION NOT RUN` report                           |

## Invariants

These rules are never optional:

- The pinned full dev server URL never changes during the loop.
- Capture always happens before review.
- Review always uses fresh artifacts from the current iteration.
- EXPECTED always comes from Figma MCP.
- Auth and access gates are never bypassed.
- `VERIFICATION NOT RUN` never counts as `PASS`.
- Code review never starts before the UI gate clears.

## Source of Truth

This page summarizes the flow defined in these canonical files:

- `.cursor/skills/commands/tsh-implement/SKILL.md`
- `.cursor/skills/workflows/tsh-orchestrating-implementation/SKILL.md`
- `.cursor/skills/workflows/tsh-ui-verifying/SKILL.md`
- `.cursor/skills/agents/tsh-ui-engineer/SKILL.md`
- `.cursor/skills/agents/tsh-ui-capture-worker/SKILL.md`
- `.cursor/skills/agents/tsh-ui-reviewer/SKILL.md`
