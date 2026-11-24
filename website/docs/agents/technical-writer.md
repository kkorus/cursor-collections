---
sidebar_position: 16
title: Technical Writer
---

# Technical Writer Agent

**Source:** `src/agents/tsh-technical-writer.md`  
**Kind:** subagent, model tier `fast`, read-write access

The Technical Writer owns repository documentation: it writes and updates it from a bounded documentation task. README files, CHANGELOG entries, in-repo `/docs` and the published documentation site are its targets when they exist in the project. It writes documentation only and never touches product code, generated outputs, or the skills and agents under `src/` (those stay with the AI customization flow).

## Responsibilities

- Authoring and updating README files, CHANGELOG entries, in-repo `/docs` markdown and documentation-site pages.
- Verifying every factual claim (file paths, command names, versions, link targets) against the repository before writing it.
- Matching sibling pages: frontmatter, heading order, link conventions.
- Keeping documentation accurate to what the system actually does, and adding only what the reader cannot infer.

## What it does not do

- Does not write or edit product code, tests or infrastructure.
- Does not perform formal code or design review.
- Does not invent link targets: internal documentation links must resolve, and a build failure counts as a failure.
- Does not expand scope beyond the documentation files named in the task. A documentation task that needs a code change returns `BLOCKED` and names the dependency.

## Approved plan precondition

For plan-based work, the agent validates the plan's `## Human Approval` record before it changes any file, exactly as the other executors do. Without a valid record, interactive mode offers you the options and delegated mode returns `BLOCKED`. Work without a plan is not affected. See the [approval gate](../workflow/standard-flow#approval-gate).

## Tool access

- **Read-write**, with shell access, used for the documentation build and link validation, never to change the environment.
- **Leaf agent.** It never delegates to other agents.
- **No MCP servers required.**

## Skills loaded

- `tsh-write-documentation` (preloaded) - The internal step: inputs, scope, procedure, escalation and output format
- `tsh-writing-documentation` (preloaded) - Documentation conventions and the write-versus-review boundary
- `tsh-discovering-technical-context` - Confirm conventions and existing documentation patterns
- `tsh-analyzing-codebase` - Read the code or artifacts a page must describe
- `tsh-creating-rules` - Keep declarative project rules in rule files rather than narrative documentation

## Invocation and modes

- **Delegated by:** the `tsh-engineering-manager`, for documentation work. The task starts with `MODE: delegated`; the agent returns the changed files, the build or link-check result and any open dependency.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).
