---
sidebar_position: 4
title: UI Verification Flow
---

# UI Verification Flow

This page explains the post-implementation UI verification loop for Figma-backed UI work: who does what, which artifacts are produced, when the flow blocks, and how the fix, capture, review loop closes. The loop is owned by the Engineering Manager, which runs in your main conversation. Every agent in it is a leaf that does one job and reports back.

The loop is reached through `/tsh-implement`. For plan-based work it starts only after the plan has a valid human approval record (see the [approval gate](./standard-flow#approval-gate)). The same capture and review steps run once, without fixes, when you use [`/tsh-review-ui`](../commands/review-ui).

## Why this flow exists

Build, lint, unit tests and code review do **not** prove that the UI matches Figma. This flow adds a separate UI gate based on:

- **EXPECTED** from the Figma MCP, fetched by the UI Reviewer.
- **ACTUAL** from a live capture of the running app, collected by the UI Capture Worker with `playwright-cli`.
- A structured reviewer pass that compares structure, layout, dimensions, visuals and component usage.

An item is done only when the UI gate returns `PASS`, or when you explicitly acknowledge a blocker and the item is marked `ESCALATED`.

## The loop

```text
Engineering Manager (main conversation)
  |
  |  1. UI Engineer          implements or fixes the UI (never captures or reviews)
  |  2. Manager              deletes the three ACTUAL files of the iteration
  |  3. UI Capture Worker    collects actual.png, computed-styles.json, a11y-snapshot.yml
  |  4. UI Reviewer          fetches EXPECTED from Figma, compares it with the files
  |
  +--> PASS                      the item is cleared
  +--> FAIL                      back to step 1 with the full report (iteration + 1)
  +--> VERIFICATION NOT RUN      no iteration is consumed; the manager asks you
  +--> after 5 FAIL iterations   gate: continue N more / stop as ESCALATED / custom
```

Capture always happens before review, and a review always reads the files of the current iteration. Deleting the three ACTUAL files before each capture means that their existence proves they are fresh.

## Step by step

### 1. The workflow starts in `/tsh-implement`

The manager checks whether research and plan artifacts exist, fills the gaps through the Context Engineer and the Architect, runs the plan review and the approval gate, and collects the UI inventory: every UI task with a Figma URL. It then asks you to confirm the **exact full dev server URL**. The URL is a pinned input and is forwarded unchanged to every capture and review pass.

### 2. UI Engineer implements the UI slice

The [UI Engineer](../agents/ui-engineer) fetches and reviews the Figma design before it writes markup, layout or styles, implements the slice and runs local validation (lint, build, tests). A clean build is never UI verification: it names the components that need verification and returns.

### 3. UI Capture Worker collects ACTUAL evidence

The [UI Capture Worker](../agents/ui-capture-worker) is a mechanical evidence collector. It never judges visual correctness and never exports a Figma image in the default flow. It writes three artifacts into the iteration directory:

- `actual.png`
- `computed-styles.json`
- `a11y-snapshot.yml`

The layout is one sub-root per component:

```text
specifications/<task>/ui-verification/
  <component-slug>/
    iteration-<N>/
      actual.png
      computed-styles.json
      a11y-snapshot.yml
```

If even one artifact is missing, the verification is invalid.

### 4. Authentication and access gates are hard blockers

Nobody in the loop may bypass login or access control. If the page needs a login, the capture worker follows the rules of the [`tsh-verifying-ui`](../skills/verifying-ui) skill: credentials come only from the environment of the launching shell, or from a session you logged in to once in a headed browser. If they are missing, the worker returns `NEEDS_INPUT` and the manager asks you. If the worker notices that an access gate is trivially bypassable, it reports that as a potential security issue and never exploits it. See [Prerequisites](../getting-started/prerequisites) and the [FAQ](../getting-started/faq).

### 5. UI Reviewer compares EXPECTED against ACTUAL

The [UI Reviewer](../agents/ui-reviewer) fetches EXPECTED from the Figma MCP, reads the three artifacts and compares them in a fixed order: structure, layout, dimensions, visual, components. This order matters because a visually similar screen can still be structurally wrong. Content, data or state differences come back as clarification questions, not as defects.

### 6. The reviewer returns one of three states

- `PASS` - the item matches Figma within tolerance and no Critical or Major difference remains.
- `FAIL` - there are actionable differences to fix.
- `VERIFICATION NOT RUN` - the review could not be done on trustworthy evidence, for example because artifacts are missing or stale, the Figma node cannot be reached, or the host cannot open images. It is never a PASS. It does not consume an iteration; the manager shows you the reason and asks what to do.

:::info Tool support
Where the host cannot open the images, the result is `VERIFICATION NOT RUN` and the loop asks you instead of guessing. Support for opening images and for passing credentials to the capture worker differs per tool and is listed in [Supported Tools](../getting-started/supported-tools).
:::

### 7. FAIL starts another iteration

The manager passes the full report and the artifact paths to the UI Engineer, which fixes **all** reported differences. Then a new capture and a new review run on fresh files. A low-confidence review pauses before any fix, and that pause is not an iteration either.

### 8. The 5-iteration limit

After 5 FAIL iterations the manager stops and offers three choices: continue for an explicit number of extra iterations, stop and mark the item `ESCALATED`, or give a custom instruction. `ESCALATED` is recorded only with your explicit acknowledgement.

### 9. Code review starts after the UI gate clears

Code review is a separate gate. It starts only after every Figma-backed item is `PASS` or acknowledged as `ESCALATED`. Build success, lint, tests and code review never substitute for UI verification.

## Who produces what

| Owner | Input | Output |
| --- | --- | --- |
| Engineering Manager | task, plan, UI inventory, pinned URL | routing, gates, user questions, iteration directories |
| UI Engineer | plan task, Figma design, report of the previous pass | code changes, list of components to verify |
| UI Capture Worker | pinned URL, iteration directory, optional credential variable names | the three ACTUAL artifacts and a capture summary |
| UI Reviewer | Figma URL, iteration directory | `PASS`, `FAIL` or `VERIFICATION NOT RUN` report |

## Invariants

- The pinned full dev server URL never changes during the loop.
- Capture always happens before review, and review uses the files of the current iteration only.
- EXPECTED always comes from the Figma MCP.
- Auth and access gates are never bypassed.
- `VERIFICATION NOT RUN` never counts as `PASS`.
- Code review never starts before the UI gate clears.

## Source of truth

This page summarizes the canonical definitions in the [`tsh-verifying-ui`](../skills/verifying-ui) skill (criteria, capture flow, report format) and the [`tsh-orchestrate-ui-verification`](../commands/internal/orchestrate-ui-verification) step (the loop).
