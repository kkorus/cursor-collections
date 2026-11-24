---
sidebar_position: 34
title: Verifying UI
---

# Verifying UI

**Skill name:** `tsh-verifying-ui`  
**Source:** `src/skills/tsh-verifying-ui/`  
**Used by:** UI Reviewer, UI Capture Worker, `tsh-orchestrate-ui-verification` (step), `/tsh-review-ui`

UI verification criteria, tolerances, and report format for comparing implementations against Figma designs.

**Use when** verifying UI components, reviewing Figma vs implementation, or running /tsh-review-ui.

## CLI-first capture

The design side and the implementation side are collected by different roles:

- **EXPECTED** is fetched from the Figma MCP by the UI Reviewer. The capture worker never exports Figma images in the default flow.
- **ACTUAL** is captured by the UI Capture Worker with `playwright-cli` against a full dev server URL that you confirmed. It writes three artifacts into the iteration directory: `actual.png`, `computed-styles.json` and `a11y-snapshot.yml`.
- A review is valid only on a fresh capture. Missing, stale or incomplete artifacts, or a host that cannot open the images, give `VERIFICATION NOT RUN` with a reason, never `PASS`.
- There is no `PASS` while a Critical or Major difference remains. Content, data or state differences are asked about, not counted as defects.

Capture of a page behind a login is governed by the authenticated-capture rules of this skill (credential handling, origin checks, cleanup). The user-facing summary is in [Prerequisites](../getting-started/prerequisites) and the [FAQ](../getting-started/faq).

## What it covers

- Verification Process
- Verification Order
- Verification Categories
- Tolerances
- Severity Definitions
- Verification Checklist
- Report Format (with `VERIFICATION NOT RUN`, sources, artifact directory and status, clarification needed, blocker resolution, and the Figma node id and version)
- CLI capture flow and authenticated capture (support files)

## Support files

- `assets/`: `ui-verification-report.template.md`
- `references/`: `cli-capture-flow.md`, `authenticated-capture.md`

## Connected skills

- [`tsh-discovering-technical-context`](./discovering-technical-context)
- [`tsh-implementing-frontend`](./implementing-frontend)
- [`tsh-using-playwright-cli`](./using-playwright-cli)
