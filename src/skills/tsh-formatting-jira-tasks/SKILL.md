---
name: tsh-formatting-jira-tasks
description: Transform extracted epics and user stories into Jira-ready format following a benchmark template. Handles field mapping, formatting for Jira markdown compatibility, two-gate user review, and guidance for Jira issue creation via Atlassian tools. Use when an approved task list needs to be formatted for Jira.
type: skill
metadata:
  short-description: Format epics and stories as Jira-ready tasks
---

# Jira Task Formatting

This skill helps you transform an extracted task list (epics and user stories) into a Jira-ready format that can be directly pushed to Jira. It applies a consistent benchmark template to every task, preserves source traceability, validates completeness, and manages a two-gate review process before any issues are created.

## Jira Task Formatting Process

Use the checklist below and track your progress:

```
Formatting progress:
- [ ] Step 1: Load the benchmark template and extracted tasks
- [ ] Step 2: Format each epic for Jira
- [ ] Step 3: Format each story for Jira
- [ ] Step 4: Validate completeness against benchmark
- [ ] Step 5: Flag uncertain fields and ask user
- [ ] Step 6: Formatting Review — User reviews formatted markdown
- [ ] Step 7: Save the Jira-ready tasks document
- [ ] Step 8: Push Approval — User approves Jira push
- [ ] Step 9: Create or update issues in Jira
- [ ] Step 10: Post-push verification against Jira
- [ ] Step 11: Archive session artifacts and refresh the project baseline
```

**Step 1: Load the benchmark template and extracted tasks**

Load two inputs:
- The **benchmark template** (`assets/jira-task.template.md`) which defines the expected structure and fields for Jira epics and stories
- The **extracted tasks document** (`extracted-tasks.md`) produced by the `tsh-extracting-tasks` skill

Review the benchmark template to understand:
- Required fields for epics and stories
- Formatting conventions
- How to handle optional fields
- The example tasks for reference quality and tone

**Step 2: Format each epic for Jira**

For each epic in the extracted tasks document, create a Jira-ready epic entry with:

> **Protected tasks**: Load the `tsh-guarding-jira-statuses` skill. A protected epic is kept exactly as imported, marked with `🔒`, and skipped by all formatting steps below.

- **Summary** (title): Follow the naming convention from the benchmark template
- **Description**: Structured using the benchmark epic description format, including:
  - Business overview
  - Business value statement
  - Success metrics / criteria
- **Acceptance criteria**: Transferred from extracted tasks, formatted for Jira compatibility
- **Labels**: Suggest relevant labels based on the epic's domain (do not hardcode project-specific values)
- **Priority**: Map from the extracted task priority (Critical → Highest, High → High, Medium → Medium, Low → Low)

**Step 3: Format each story for Jira**

For each user story, create a Jira-ready story entry with:

> **Protected tasks**: A protected story is kept exactly as imported, marked with `🔒`, and skipped by all formatting steps below.

- **Summary** (title): Follow the naming convention from the benchmark template
- **Description**: Structured using the benchmark story description format, including:
  - Context paragraph linking to the parent epic
  - Source Context section that preserves traceability from extracted tasks
  - User story in "As a… I want… So that…" format
  - Requirements as a numbered list
  - High-level technical notes (only if present in extracted tasks)
- **Acceptance criteria**: Formatted as a checklist compatible with Jira markdown; scenario-style `GIVEN / WHEN / THEN` criteria are valid and should remain readable after formatting
- **Story points guidance**: Include a sizing suggestion (e.g., Small / Medium / Large) based on scope complexity — but note this is a suggestion, not an estimate. The team should estimate during refinement.
- **Labels**: Consistent with the parent epic's labels plus any story-specific labels
- **Parent epic**: Reference to the parent epic by title (will be linked by ID after creation)
- **Priority**: Mapped from extracted task priority

**Step 4: Validate completeness against benchmark**

> **Protected tasks**: Skip completeness validation for protected tasks.

Cross-check every formatted task against the benchmark template:
- Are all required fields populated?
- Do descriptions follow the expected structure?
- Are acceptance criteria written as verifiable conditions?
- Is the language business-oriented (not technical jargon)?
- Are priorities and labels consistent across related tasks?

Create a summary table showing completeness status for each task.

**Step 5: Flag uncertain fields and ask user**

> **Protected tasks**: Do not flag or ask about fields of protected tasks.

For any task where:
- A required field could not be confidently filled from the source materials
- The priority is ambiguous
- The scope of a story is unclear
- Labels or categorisation is uncertain

Ask questions to the user to get user input. Ask exactly **one question per question**, each scoped to a single epic or story. The question must identify which task has the uncertain field and what field is missing (e.g., "[Epic 2: Payment Processing > Story 2.1: User can checkout] The priority for this story could not be determined from the workshop materials. Should it be High (core MVP) or Medium (post-MVP)?"). Do not proceed to the review gate until all flags are resolved.

**Step 6: Formatting Review — User reviews formatted markdown**

Present the formatted output to the user for review. If changes were made during formatting (e.g., rewording, priority adjustments), present each changed task individually using one question per task, identifying the specific epic/story and the change made. Ask: "Is this change acceptable?"

After all individual changes are reviewed, ask one workflow-level question: "All formatting is complete. Are you happy with these tasks? Any final changes before I proceed to save and push?"

The user must explicitly approve before proceeding. If changes are requested, update and re-present the affected tasks individually.

**Step 7: Save the Jira-ready tasks document**

Generate the final output following the `assets/jira-task.template.md` template format.

Include the `Jira Key` field for every epic and story. For newly formatted tasks (not yet pushed to Jira), set the Jira Key to `—` as a placeholder. For tasks imported from Jira or previously pushed, preserve their existing Jira key.

Save the file to `specifications/<workshop-name>/jira-tasks.md`.

**Step 8: Push Approval — User approves Jira push**

Before creating any issues in Jira, confirm with the user:
- Target Jira project key (e.g., "PROJ")
- Target board or backlog
- Whether to create all tasks at once or in batches
- Any final adjustments

This is the final gate — after this, issues will be created in Jira.

**Step 9: Create or update issues in Jira**

Before pushing, present a **sync summary** to the user:
- **(a)** Tasks to be **CREATED** (Jira Key is `—`) — list titles and count
- **(b)** Tasks to be **UPDATED** (Jira Key is populated, e.g., `PROJ-123`, and status is NOT protected) — list titles, keys, and count
- **(c)** Tasks **SKIPPED** (Jira Key is populated and status is protected) — list titles, keys, statuses, and count
- Get explicit user approval before proceeding.

Using the Atlassian tools, process issues based on their Jira Key:

**For tasks without a Jira Key (create):**
1. Create all **epics** first (to get their Jira IDs)
2. After creating each epic, **immediately** update the corresponding entry in `jira-tasks.md` with the returned Jira issue key — do not wait until all issues are created
3. Create all **stories** linked to their parent epics
4. After creating each story, **immediately** update `jira-tasks.md` with its Jira key
5. Add any **links** between stories (blocked-by, related-to relationships)

**For tasks with an existing Jira Key (update):**
1. First, check the task's Status field. If the status is protected, **skip this task** — do not send any update to Jira. It was already counted in the sync summary under category (c).
2. Update the existing Jira issue with the local content
3. Fields to update: Summary, Description, Acceptance Criteria, Priority, Labels
4. Fields NOT to update: Issue Type, Parent link (unless the user explicitly requests re-linking)
5. If an update fails because the issue no longer exists in Jira, inform the user and offer to create a new issue instead

After all issues are processed, report the final state back to the user — showing all Jira keys in `jira-tasks.md` and confirming which were created, updated, and skipped (with their statuses).

**Step 10: Post-push verification against Jira**

After the Jira sync succeeds, read back the created or updated issues and verify at least the following for each task:
- Summary/title
- Parent epic linkage for stories
- Acceptance criteria presence
- Relevant description sections
- Current status capture

If verification finds mismatches, surface them clearly and do not claim the push is fully verified until the differences are resolved or explicitly acknowledged by the user.

**Step 11: Archive session artifacts and refresh the project baseline**

When verification succeeds, archive the current session artifacts under `specifications/projects/<project-name>/sessions/<YYYY-MM-DD>-<workshop-name>/`.

- Use the workshop name as the fallback project key when no explicit project name exists
- Refresh `specifications/projects/<project-name>/task-baseline.md`
- Treat `Jira Key` as the primary identity when merging baseline entries
- Replace same-key entries with the latest synced content and status
- Add new entries for newly pushed tasks
- Preserve Jira as the external source of truth

If any issue creation or update fails, inform the user immediately and ask how to proceed.

## Delegated mode

When you run as a delegated worker (the task starts with `MODE: delegated`), you only prepare content. The orchestrator owns every question, every file write and every Atlassian call:

- **Steps 1-4 (load, format epics and stories, validate):** run unchanged.
- **Step 5 (ask about uncertain fields):** skipped. Put each uncertain field in `QUESTIONS` and mark it in the output.
- **Steps 6 and 8 (user review and push approval), Step 9 (push) and the Per-Change Modification Flow:** skipped. Never call an Atlassian tool.
- **Step 7 (save):** skipped. Return the Jira-ready document in the reply body, in the structure of the template. The orchestrator saves `jira-tasks.md`.
- **Step 10 (verification):** compare the read-back payload supplied in `INPUT_ARTIFACTS` with the local tasks and return the discrepancies. Do not fetch the issues yourself.
- **Step 11 (archive and baseline):** return the computed baseline content. Do not write files.
- **Import Mode:** not available. The orchestrator fetches the issues and runs it.

## Per-Change Modification Flow

When the user requests a change to a specific task outside of the main formatting workflow (e.g., "add acceptance criteria to Story 2.3" or "change the priority of Epic 1"):

0. **Check the task's Status field**. If it is protected, refuse the change as the `tsh-guarding-jira-statuses` skill describes and stop here.
1. **Update the local `jira-tasks.md` first** — apply the requested change to the file
2. **Ask the user**: "Do you want to push this change to Jira now?" (using one question)
3. **If yes** — use the task's Jira key to update the specific issue via Atlassian MCP. If the task has no Jira key (`—`), inform the user that the task has not been pushed yet and offer to create it
4. **If no** — the change remains local in `jira-tasks.md` until the next batch push

## Jira Markdown Compatibility

When formatting descriptions and acceptance criteria for Jira:
- Use `h2.`, `h3.` for headings (not `##`, `###`)
- Use `*bold*` for bold text (not `**bold**`)
- Use `_italic_` for italic text (not `*italic*`)
- Use `* item` for bullet lists (with space after asterisk)
- Use `# item` for numbered lists
- Use `{noformat}` or `{code}` blocks for preformatted text
- Acceptance criteria should use `(/) criterion` for checklist items (Jira checkbox format)
- Scenario-style acceptance criteria remain valid when expressed as `(/) GIVEN ... WHEN ... THEN ...`

Note: The markdown file saved locally uses standard markdown. The Jira-specific formatting is applied only when creating the actual issues.

## Import Mode: Jira → Local

This is an alternative entry point for the skill. Instead of formatting extracted tasks, the agent fetches existing Jira issues and converts them into the `jira-tasks.md` format with Jira keys pre-populated. This enables iterating on existing Jira backlogs using the agent's skills.

### Import Process

```
Import progress:
- [ ] Step I-1: Identify import target
- [ ] Step I-2: Fetch issues from Jira
- [ ] Step I-3: Map Jira fields to benchmark template
- [ ] Step I-4: Generate jira-tasks.md
- [ ] Step I-5: Present imported tasks for user review
- [ ] Step I-6: Save to specifications directory
```

**Step I-1: Identify import target**

Ask the user to specify what to import. Accept any of these:
- A **Jira project key** (e.g., `PROJ`) — imports all epics and their linked stories
- **Specific epic keys** (e.g., `PROJ-10, PROJ-15`) — imports those epics and their child stories
- A **JQL query** — imports issues matching the query

Ask one question to determine the import scope if the user hasn't specified it.

**Step I-2: Fetch issues from Jira**

Using the Atlassian MCP tools:
1. Fetch the targeted epics and stories from Jira
2. For each epic, fetch its child stories (linked via parent field)
3. Collect all fields: Summary, Description, Acceptance Criteria, Priority, Labels, Issue Key, Parent link

**Step I-3: Map Jira fields to benchmark template**

Convert each fetched issue into the benchmark template format:

| Jira Field | Template Field | Notes |
|---|---|---|
| Summary | Title (Summary) | Direct mapping |
| Description | Description sections | Parse into structured sections (Overview/Value/Metrics for epics; Context/User Story/Requirements/Technical Notes for stories). If the Jira description does not follow a structured format, restructure it to match the template as closely as possible. |
| Priority | Priority | Direct mapping (Highest/High/Medium/Low) |
| Labels | Labels | Direct mapping |
| Issue Key | Jira Key | Populate directly (e.g., `PROJ-123`) |
| Parent link | Parent epic reference | Map to parent epic title |
| Story Points | Story Points / Sizing Guidance | If estimated, include; otherwise mark as TBD |
| Status | Status | Direct mapping of the Jira workflow status (e.g., To Do, In Progress, Done). Used to enforce the protected status rules. |

If an imported description cannot be cleanly restructured into the benchmark format, flag it for user review using one question per flagged task.

> **Protected tasks**: After mapping, mark every task with a protected status with `🔒` and preserve its content exactly as fetched. It is never modified locally or pushed back.

**Step I-4: Generate jira-tasks.md**

Create the `jira-tasks.md` file with all imported tasks in the benchmark template format. Every task must have its `Jira Key` field populated with the actual Jira issue key.

**Step I-5: Present imported tasks for user review**

Present each imported task to the user for review using one question per task. Highlight any descriptions that were restructured or fields that could not be mapped cleanly. Ask: "Does this imported task look correct?"

**Step I-6: Save to specifications directory**

Save the final file to `specifications/<project-or-topic>/jira-tasks.md`.

After import, the user can modify the local file. For each change, the agent asks whether to push it to Jira immediately (using the Per-Change Modification Flow above). The user can also batch-push all local changes later using the standard push flow (Step 8 → Step 9).

## Connected Skills

- `tsh-extracting-tasks` - provides the extracted tasks used as input for formatting
- `tsh-guarding-jira-statuses` - defines the protected Jira statuses and how protected tasks are handled
