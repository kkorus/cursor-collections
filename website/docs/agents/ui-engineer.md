---
sidebar_position: 18
title: UI Engineer
---

# UI Engineer Agent

**Source:** `src/agents/tsh-ui-engineer.md`  
**Kind:** subagent, model tier `balanced`, read-write access

The UI Engineer implements everything that renders: UI components, forms, hooks, accessibility and UI performance, and the visual correctness of all of it. It takes every UI task, regardless of complexity. The [Software Engineer](./software-engineer) and the [Plan Implementor](./plan-implementor) never edit UI.

## Responsibilities

- Fetch and review the Figma design through the Figma MCP **before** it writes markup, layout or styles. A missing Figma link is `NEEDS_INPUT` in delegated mode; a missing Figma MCP is `BLOCKED`. It never opens figma.com in a browser.
- Implement the UI following the plan and the project's design system, and run local validation (lint, build, tests).
- Fix verification findings: a fix pass addresses **all** differences in the report it receives, not only the first.
- Name the components that need verification and return `DONE`. A clean build is never UI verification, and the agent never claims `PASS`.

## Key behaviors

- The dev server URL is a fixed input; the agent does not discover or change it.
- It never bypasses, seeds or injects authentication state. Credentials never go into plans, specs or commits.
- It does not capture or review the UI itself. The Engineering Manager runs the loop around it: the [UI Capture Worker](./ui-capture-worker) captures and the [UI Reviewer](./ui-reviewer) compares. See the [UI Verification Flow](../workflow/ui-verification-flow).
- Like the other executors, it validates the plan's approval record before changing files in plan-based work; see the [approval gate](../workflow/standard-flow#approval-gate).

## Tool access

- **Read-write**, with shell access.
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Figma, Sequential Thinking.

## Skills loaded

- `tsh-implement-task` (preloaded) - Implement a feature from a plan or a task description
- `tsh-implementing-frontend` (preloaded) - Component patterns, design tokens and the Figma-to-code workflow
- `tsh-implementing-forms` - Form architecture, validation and accessible patterns
- `tsh-writing-hooks` - Custom React hook patterns
- `tsh-ensuring-accessibility` - Accessibility: semantic HTML, ARIA, keyboard, contrast
- `tsh-optimizing-frontend` - Frontend rendering, bundle and memory optimization
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-analyzing-implementation-gaps` - Compare a plan with the current state
- `tsh-analyzing-codebase` - Analyze a codebase: dependencies, business logic, duplications

## Invocation and modes

- **Delegated by:** the `tsh-engineering-manager`, for implementation and for fix passes.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
