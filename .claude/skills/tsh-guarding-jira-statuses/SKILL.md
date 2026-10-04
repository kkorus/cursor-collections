---
name: tsh-guarding-jira-statuses
description: Defines which Jira statuses make a task protected (immutable) and the rules for handling protected tasks in local files, quality review, formatting, import and push. The status list is configurable; the default is Done, Cancelled and PO APPROVE. Use when a workflow reads, edits, reviews, formats, imports or pushes Jira tasks and must decide whether a task may be changed.
metadata:
  short-description: Protected Jira status policy for BA and Jira workflows
---
<!-- Generated from src/skills/tsh-guarding-jira-statuses/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Guarding Jira Statuses

This skill is the single source of truth for the protected status policy. The BA orchestrator and the skills that touch Jira tasks load it by name instead of keeping their own copy.

## Protected status list

The default list of protected statuses is:

- **Done**
- **Cancelled**
- **PO APPROVE**

The list is configurable. If the user, the task or the project baseline names a different list (for example a team that protects "Released" and "In Production"), use that list instead and tell the user which list is active before you apply it. Compare statuses case-insensitively and by exact name. When a task without a Jira key (never pushed) has no status, treat it as not protected and say so. A task with a Jira key and a missing or unknown status is not safe to change: fetch its current status before any update, and skip the task if you cannot (workers cannot fetch; they skip it and report it).

A task (epic or story) whose status is on the list is **immutable**.

## Rules

1. **No local edits:** do not edit a protected task in `jira-tasks.md` or `extracted-tasks.md`. Its content is frozen.
2. **No Jira updates:** never update a protected task in Jira. No field may change.
3. **No quality-review suggestions:** quality-review passes exclude protected tasks. A protected task may still be referenced as a dependency of other tasks. Drop any suggestion that targets one, and record it in the report as "Skipped - task has protected status".
4. **Formatting and push:** preserve the content of a protected task exactly as imported, mark it with `🔒`, and skip it in every formatting, validation, question and push step. List every skipped task with its status in the summary for the user.
5. **Import:** protected tasks **are** imported so the user sees the full backlog. Mark them read-only with `🔒`. Never modify them or push them back.
6. **User override requests:** if the user asks to edit a protected task, refuse and explain: "This task has a protected status ([status]). Tasks with a protected status cannot be modified. If this status is incorrect, please update it in Jira first, then re-import." Name the active protected statuses in the message.
7. **Baseline continuity:** the baseline entry of a protected task is read-only. Rewrite it only after Jira itself changed the task and a valid import or push cycle picked that up.

## Where to apply the checks

| Workflow step | Check |
|---|---|
| Quality review: before the passes | Filter protected tasks out of the analysis |
| Quality review: before presenting and before applying | Drop or skip any suggestion that targets a protected task |
| Formatting: each epic and story | Keep protected tasks as imported and skip the formatting steps |
| Push: before each update | Re-check the current status (always fetch it for keyed tasks with a missing status) and skip protected tasks, or tasks whose status cannot be fetched |
| Per-task change request | Refuse the change (rule 6) |

## Delegated mode

Workers only prepare content and never call Atlassian, so the status of each task comes from the task files or the payload in `INPUT_ARTIFACTS`. Apply rules 1, 3, 4 and 7 to that data. The orchestrator applies rules 2, 5 and 6 and the re-check before each push.
