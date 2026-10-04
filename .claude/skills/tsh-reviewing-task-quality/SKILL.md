---
name: tsh-reviewing-task-quality
description: Analyze extracted epics and user stories for quality gaps, missing edge cases, and improvement opportunities. Runs domain-agnostic analysis passes, optionally enriches findings with Jira board context, and produces accept/reject suggestions that refine the task list before Jira formatting. Use when an extracted task list needs a quality review before formatting.
metadata:
  short-description: Review extracted tasks for quality gaps and edge cases
user-invocable: false
---
<!-- Generated from src/skills/tsh-reviewing-task-quality/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Task Quality Review

This skill performs a systematic quality analysis on an approved task list (epics and user stories) to identify gaps, missing edge cases, and improvement opportunities. It runs Lite or Full review mode, optionally enriches findings with existing Jira board context, and produces a structured list of suggestions the user can individually accept or reject.

The output is a **quality review report** documenting all suggestions, their dispositions, and any changes applied to the task list.

## What This Skill Produces

- **Suggestions**: Structured improvement proposals, each individually accept/reject
- **Domain model**: An intermediate actor–entity–lifecycle map derived from the task list (used for analysis)
- **Quality review report**: Audit trail of all suggestions and decisions (`quality-review.md`)
- **Updated task list**: Accepted suggestions are applied to `extracted-tasks.md` in-place

## What This Skill Does NOT Do

- Does not make technical architecture decisions (that is the architect's responsibility)
- Does not add scope that is not implied by the source materials or common patterns
- Does not estimate effort or change priorities
- Does not invent domain-specific requirements without research backing
- Does not modify tasks without explicit user approval
- Does not create, modify, or delete Jira issues (read-only access for enrichment)

## Task Quality Review Process

Use the checklist below and track your progress:

```
Quality review progress:
- [ ] Step 1: Load inputs, establish context, and select review mode
- [ ] Step 2: Gather Jira board context (optional)
- [ ] Step 3: Build domain model from the task list
- [ ] Step 4: Run the active analysis passes for the selected mode
- [ ] Step 5: Classify and structure suggestions
- [ ] Step 6: Present suggestions for user review
- [ ] Step 7: Apply accepted suggestions
- [ ] Step 8: Save quality review report
```

**Review Modes**

Choose the review mode early in Step 1 and record it in the review context.

| Mode | Use When | Active Passes |
|---|---|---|
| Lite | Default for small, low-risk workshops (3 or fewer epics and 14 or fewer stories) unless the user requests Full | 5 passes: A, B, E, H, I |
| Full | 4 or more epics or 15 or more stories, regulated domains, high-risk scope, or when the user requests a deeper pass | 10 passes: A to J (J needs research tools) |

---

**Step 1: Load inputs, establish context, and select review mode**

Collect and review all available materials:

- **`extracted-tasks.md`** (mandatory): The Gate 1-approved epic and story list. This is the primary input. Imported Jira backlogs (`jira-tasks.md` only) are not reviewed by this skill.
- **`cleaned-transcript.md`** (if available): Cross-reference for details that may have been lost or simplified during task extraction.
- **Other source materials**: Figma designs, codebase analysis, documentation pages, or any other documents referenced during extraction.
- **`intent-brief.md`** and **`workshop-context-summary.md`** (if available): Use these to keep the review aligned with the approved scope and any exploration notes.

Build a complete picture of the project scope, actors, and features before proceeding to analysis.

Select Lite or Full mode based on task size, risk, and user direction. Record the chosen mode in the review output before running passes.

**Step 2: Gather Jira board context (optional)**

If Jira access is available (see the `tsh-using-mcp-servers` skill) and the user has indicated a Jira project (either in their initial message or during the workflow):

1. List the accessible Jira resources first.
2. If multiple resources exist, ask the user which one to use.
3. If the user provided a Jira project key, use it. If not, ask once: "I have access to Jira. Would you like me to check an existing board for additional context? If so, what is the project key?" If the user declines, skip this step entirely.
4. Fetch existing epics and stories from the board.
5. Note: naming conventions, label usage, priority patterns, and any existing work that relates to the extracted tasks.

This enrichment is **entirely optional**. The skill works identically without Jira access. Do not block the review process if Jira is unavailable or the user declines.

**Step 3: Build domain model from the task list**

Before running analysis passes, construct a lightweight domain model from the extracted tasks. This model is the foundation for systematic gap detection.

Identify and document:

**Actors** — Every distinct role mentioned across all stories:

| Actor | Epics Involved | Key Capabilities |
|---|---|---|
| _<role name>_ | _<epic numbers>_ | _<what this actor can do>_ |

**Entities** — Every distinct business object or concept managed by the system:

| Entity | Created In | Read In | Updated In | Deactivated/Deleted In |
|---|---|---|---|---|
| _<entity name>_ | _<story ref or "—">_ | _<story ref or "—">_ | _<story ref or "—">_ | _<story ref or "—">_ |

**Relationships** — How entities relate to each other and which features depend on which entities being in a valid state.

This model is derived entirely from the task list content. It is not a technical data model — it is a business-oriented map of what the system manages and who interacts with it.

**Step 4: Run the active analysis passes**

> **Protected tasks**: Load the `tsh-guarding-jira-statuses` skill and filter out all protected tasks before running the passes. They generate no findings or suggestions, but other tasks may still depend on them.

Execute only the analysis passes active for the selected review mode. Each pass is independent and produces zero or more findings. A finding is a potential gap or improvement that will become a suggestion.

- **Lite mode** runs five passes: A, B, E, H and I.
- **Full mode** runs all ten passes: A through J.

Load `references/analysis-passes.md` and run the passes of the selected mode. Pass J (domain research) runs in Full mode only and needs documentation or web search tools.

**Step 5: Classify and structure suggestions**

Transform each finding from the analysis passes into a structured suggestion:

1. **Assign a confidence level** based on the source:
   - **High**: The finding is based on a universal pattern (entity lifecycle, error states, notification gaps). Virtually every project benefits from addressing it.
   - **Medium**: The finding depends on business context or domain (admin panels, compliance, domain-specific regulations). Important but may not apply to all projects.
   - **Low**: The finding is based on external research or speculation. May be out of scope or irrelevant to the project's current phase.

2. **Determine the action type**:
   - `ADD_ACCEPTANCE_CRITERION`: The gap is about a missing condition in an existing story. The story's scope does not change, but a new verifiable criterion is added.
   - `MODIFY_STORY`: The gap requires expanding an existing story's scope (adding requirements or changing the description).
   - `ADD_TECHNICAL_NOTE`: The gap is about clarity or documentation, not functional scope. A note is added to an existing story.
   - `NEW_STORY`: The gap represents entirely new functionality that does not fit in any existing story.
   - `NEW_EPIC`: The gap represents a new capability area that warrants its own epic (rare — typically only for platform operations or major compliance requirements).

3. **Write the proposed change**: Draft the exact text to be added or modified. For new stories, follow the format established in `extracted-tasks.md`, including a `Source` field and scenario-style acceptance criteria. For acceptance criteria, follow the checklist format and prefer concise `GIVEN / WHEN / THEN` scenarios. Use an `Additional Acceptance Checks` subsection only when scenario format is not enough.

4. **Deduplicate**: If multiple passes produce findings that overlap, merge them into a single suggestion and note all contributing categories.

5. **Enrich with Jira context** (if available from Step 2): Cross-reference each suggestion with existing Jira issues. If a suggestion duplicates or overlaps with an existing issue, note the Jira issue key and adjust the suggestion (e.g., "This is already tracked as PROJ-123 — consider linking rather than creating a new story").

**Step 6: Present suggestions for user review**

> **Protected tasks**: Before presenting suggestions, drop any suggestion that targets a protected task. It should not exist after the Step 4 filter; this is a safety net.

Present all suggestions to the user for individual accept/reject decisions:

1. **Order suggestions**: Order by epic, then by confidence within each epic (High first, then Medium, then Low). If a suggestion proposes a new epic, present it after all existing-epic suggestions.

2. **One suggestion per question**: Ask the user about exactly one suggestion at a time. Each question must be self-contained — the user should be able to make a decision without needing context from a previous question. For each suggestion, show:
   - The parent epic title and affected story title/ID (e.g., "[Epic: User Auth > Story 1.2: User can log in]")
   - The suggestion summary and rationale
   - The confidence level (High / Medium / Low)
   - The action type (what will change if accepted)
   - Options: Accept / Reject

3. **Iterate**: Continue until all suggestions have been decided. The user may also provide feedback that modifies a suggestion before accepting it.

4. **Record decisions**: Track which suggestions were accepted and which were rejected (with any stated reason).

**Step 7: Apply accepted suggestions**

> **Protected tasks**: Before applying an accepted suggestion, re-check the target task's status. If it is protected, do not apply the change and log it in the report as "Skipped - task has protected status".

For each accepted suggestion, apply the proposed change to `extracted-tasks.md`:

- `ADD_ACCEPTANCE_CRITERION`: Add the new criterion to the specified story's acceptance criteria list.
- `MODIFY_STORY`: Update the story's description, requirements, or scope as proposed.
- `ADD_TECHNICAL_NOTE`: Append the note to the specified story's technical notes section.
- `NEW_STORY`: Add the new story under the appropriate epic, following the existing numbering convention (e.g., if Epic 2 has stories 2.1-2.7, a new story becomes 2.8).
- `NEW_EPIC`: Add the new epic at the end of the document with the proposed stories, update the Epics Overview table, and update the Dependencies section if applicable.

After applying all changes, update the Workshop Summary table in `extracted-tasks.md` (total stories count, total epics count) to reflect the additions.

**Step 8: Save quality review report**

Generate the final quality review report following the `assets/quality-review.template.md` template.

Save the file to `<specs>/<workshop-name>/quality-review.md`. `<specs>` is the project's specifications location (default `specifications/`, resolved by the "Project output locations" step of `tsh-discovering-technical-context`).

The report serves as an audit trail documenting:
- The domain model constructed during analysis
- All suggestions generated (not just accepted ones)
- The user's decision for each suggestion (accepted/rejected)
- A summary of changes applied to `extracted-tasks.md`

## Delegated mode

When you run as a delegated worker (the task starts with `MODE: delegated`), the orchestrator owns every Jira call, every user gate and every file write:

- **Step 2 (Jira board context):** skipped. Do not call any Atlassian tool and do not ask for a project key. Use the Jira context in `INPUT_ARTIFACTS` or in the task, if the orchestrator supplied it.
- **Step 6 (present to the user), Step 7 (apply) and Step 8 (save):** skipped. Do not write files and do not modify `extracted-tasks.md`. Return the structured suggestions (ID, confidence, action type, target story, finding, proposed change) in the reply body, grouped by pass or epic. Note excluded protected tasks explicitly. The orchestrator deduplicates, runs the user review, applies accepted suggestions and writes the report.
- **Research (pass J):** the quality worker has no documentation or web research tool, so pass J takes its no-research-tool branch (skip and say so) in delegated runs.
- **Passes:** run only the passes named in the task; if none are named, the passes of the selected review mode.
- **Everything else:** Steps 1, 3, 4 and 5 run unchanged.

## Analysis Categories Reference

| Pass | Category | Confidence Default | Typical Action |
|---|---|---|---|
| A | Entity Lifecycle Completeness | High | NEW_STORY or MODIFY_STORY |
| B | Cross-Feature State Validation | High | ADD_ACCEPTANCE_CRITERION or MODIFY_STORY |
| C | Bulk Operation Idempotency | High | ADD_ACCEPTANCE_CRITERION or MODIFY_STORY |
| D | Actor Dashboard Completeness | Medium | NEW_STORY |
| E | Precondition Guards | High | ADD_ACCEPTANCE_CRITERION or MODIFY_STORY |
| F | Third-Party Boundary Clarity | Medium | ADD_TECHNICAL_NOTE or MODIFY_STORY |
| G | Platform Operations Perspective | Medium | NEW_EPIC or NEW_STORY |
| H | Error State & Edge Case Coverage | High | ADD_ACCEPTANCE_CRITERION |
| I | Notification & Communication Gaps | High | NEW_STORY or ADD_ACCEPTANCE_CRITERION |
| J | Domain-Specific Research | Low–Medium | Varies |

## Connected Skills

- `tsh-extracting-tasks` — provides the extracted tasks used as primary input for the quality review
- `tsh-formatting-jira-tasks` — consumes the updated task list after quality review suggestions are applied
- `tsh-guarding-jira-statuses` — defines the protected Jira statuses whose tasks the review must exclude
