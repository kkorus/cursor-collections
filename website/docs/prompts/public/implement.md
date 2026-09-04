---
sidebar_position: 4
title: /tsh-implement
---

**Agent:** Engineering Manager  
**File:** `.cursor/skills/commands/tsh-implement/SKILL.md`

A thin trigger that starts implementation delivery. It routes execution to the [Engineering Manager](../../agents/engineering-manager) agent and hands off to the canonical orchestration workflow — it does not define that workflow inline.

## Usage

```text
/tsh-implement <JIRA_ID, task description, *.research.md, or *.plan.md>
```

The four primary inputs are a task description, a Jira ID, a standalone `*.research.md` file, and a `*.plan.md` implementation plan. If a research or plan companion is missing, the workflow prepares it; it never authorizes implementation without a current actionable plan.

## What It Does

The command routes to the Engineering Manager, which loads the `tsh-orchestrating-implementation` skill and starts at **Step 0** of that workflow. From there, the skill — not the command — owns:

- **Step 0 execution todos** — creates the todos needed for delivery before any delegation begins.
- **Step 1 Full Flow establishment and planning readiness** — Full Flow is the only implementation route; no alternative route may be offered, recommended, accepted, or honored as an override.
- **Full Flow** — planning readiness, plan review, todo and UI inventory, upfront execution plan, delegated execution routing, and the UI-verification and code-review gates. For app-code tasks specifically, Plan Implementor is the default for actionable, low-risk seams and Software Engineer is the exception for complex non-UI work. Any Figma or UI-verification involvement always brings in the UI-verification gate, even when the rest of the change looks narrow.

Full Flow requires Human approval of the exact current plan revision before the first file-changing delegation. The automated `tsh-plan-reviewer` `APPROVED` verdict is Reviewer approval only; it is not permission to implement.

## Key Behaviors

- **Thin trigger** — contains no workflow steps; the workflow lives in `tsh-orchestrating-implementation`.
- **Routes to one seat** — always hands off to the Engineering Manager. Model selection is a session-level concern in Cursor — it is handled per worker at delegation time and is not bound by the artifact.
- **Starts at Step 0** — execution todos are created first, then Step 1 establishes Full Flow as the only implementation route inside the skill.

## Output

- Code changes applied by delegated specialist agents.
- Updated plan checkboxes and Changelog entries.
- Code review findings from the delegated `tsh-code-reviewer` run.
