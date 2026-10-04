# Import Mode: Jira to Local

This is an alternative entry point for the skill. Instead of formatting extracted tasks, the orchestrator fetches existing Jira issues and converts them into the `jira-tasks.md` format with Jira keys pre-populated. This enables iterating on existing Jira backlogs using the agent's skills.

## Import process

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

Convert each fetched issue into the benchmark template format. Jira descriptions may contain Jira wiki markup; convert it to standard Markdown so that `jira-tasks.md` keeps a single storage format.

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

After import, the user can modify the local file. For each change, the agent asks whether to push it to Jira immediately (using the Per-Change Modification Flow in the skill). The user can also batch-push all local changes later using the standard push flow (Step 8 and Step 9 of the skill).
