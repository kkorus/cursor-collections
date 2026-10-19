---
sidebar_position: 5.2
title: Plan Implementor
---

# Plan Implementor Agent

**File:** `.cursor/skills/agents/tsh-plan-implementor/SKILL.md`

The Plan Implementor agent is an internal-only, strict single-task worker. It executes one delegated plan task exactly as written, reuses the shared `tsh-implement-common-task` internal skill, and does not broaden scope beyond the assigned seam. It is the default route for approved, actionable, low-risk plan seams.

Before any file change, validate from disk a plan whose current Human Approval record satisfies exactly `Human Decision=APPROVED`, `Approved Revision=current Plan Revision`, and a valid ISO 8601 UTC `Decision Timestamp` ending in `Z`. Fail closed when a field is missing, stale, mismatched, inferred, based only on Reviewer approval, or when the plan cannot be located or read; retry an unreadable or ambiguous reference once and resolve relative paths against the workspace root. Name the exact failed field, condition, or file, then ask the user in chat which next step to take on every applicable entry path, spelling out the options: point at the correct plan path, obtain Human approval for the existing plan, start plan preparation, or, when delegated, hand back to `tsh-engineering-manager`. Continue only from the user's explicit choice, which is never Human approval and can never bypass validation.

## Responsibilities

- Execute exactly one delegated plan task at a time.
- Follow the plan literally and stop when the seam is missing or the task is ambiguous.
- Ask the user for approval-precondition recovery and genuine blockers, never to negotiate scope; an answer does not authorize a file change.
- Keep edits minimal and bounded to the delegated task.
- Update plan checkboxes only for the delegated scope.

## Outputs

- Completed implementation for the delegated plan task.
- A precise blocker report when the task cannot be executed safely.
- Updated plan checkboxes for the delegated task and its definition of done.

## Non-goals

- Not user-invocable.
- No dedicated skill file; it reuses `tsh-implement-common-task`.
- No plan rewriting, task expansion, or adjacent follow-on fixes.
- Does not take on UI work or broader implementation orchestration.
- Does not discard, revert, stash, or clean uncommitted changes outside the delegated task — it treats the working tree as intentional and reports blockers instead of wiping them.

## Tool Access

| Tool                      | Usage                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| **Terminal**              | Run the command or script required by the delegated task                    |
| **File Read/Edit/Search** | Read, modify, and search workspace files                                    |
| **Todo**                  | Track the single delegated task and its checklist items                     |
| **Ask Questions**         | Stop and report blockers when the seam is missing or the plan is ambiguous  |

## Skills Loaded

- `tsh-technical-context-discovering` — Confirm plan context and repository conventions before editing.
- `tsh-implementation-gap-analysing` — Verify which seams already exist and which still need work.
- `tsh-codebase-analysing` — Understand the existing patterns around the delegated task.

## Handoffs

This agent is internal-only and does not expose user-facing handoffs. The Engineering Manager delegates to it through the shared common-task internal skill.
