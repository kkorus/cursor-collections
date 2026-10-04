---
sidebar_position: 2
title: Business Analyst
---

# Business Analyst (orchestrator)

**Source:** `src/skills/tsh-business-analyst/SKILL.md`  
**Kind:** orchestrator skill (runs in the main thread)

The Business Analyst is an orchestrator skill, not a subagent. It runs in the main thread, so it can talk to you at every gate. [`/tsh-analyze-materials`](../commands/analyze-materials) and [`/tsh-explore-materials`](../commands/explore-materials) load it, and it turns discovery workshop materials (transcripts, Figma designs, codebase context) into structured, Jira-ready epics and user stories. It can also explore ambiguous workshop inputs before extraction and import existing Jira backlogs for local iteration.

## Responsibilities

- Exploring workshop context before commitment when the source material is still ambiguous.
- Processing raw workshop transcripts and related reference materials into business-facing backlog context.
- Drafting an `intent-brief.md` for Gate 0 approval before extraction begins.
- Extracting epics and user stories with source traceability and concise GIVEN/WHEN/THEN acceptance scenarios.
- Running Lite or Full quality-review passes and presenting suggestions at Gate 1.5.
- Formatting tasks for Jira, verifying Jira after sync, and refreshing the project baseline for continuity.
- Importing existing Jira backlogs for local iteration and improvement.

## What It Produces

A set of markdown files placed in `specifications/<workshop-name>/`:

- **`cleaned-transcript.md`** — Cleaned and structured transcript with discussion topics, key decisions, action items, and open questions.
- **`workshop-context-summary.md`** — Optional exploration summary with likely epics, overlap, ambiguities, and readiness.
- **`intent-brief.md`** — Scope brief that must be approved before extraction.
- **`extracted-tasks.md`** — Extracted epics and user stories with acceptance criteria and dependencies.
- **`quality-review.md`** — Quality review report with all suggestions and dispositions.
- **`jira-tasks.md`** — Final Jira-ready tasks formatted per the benchmark template.
- **`specifications/projects/<project-name>/task-baseline.md`** — Optional project backlog baseline refreshed after verified Jira sync.

## What It Does NOT Do

- Does not produce technical specifications or architecture decisions (use the [Architect](./architect) for that).
- Does not produce detailed requirement research or gap analysis (use the [Context Engineer](./context-engineer) for that).
- Does not create implementation plans, test plans, or deployment plans.
- Does not estimate story points (provides sizing guidance only).

## Four-Gate Review Process

The Business Analyst enforces a strict review process — no data is pushed to Jira without explicit user approval:

| Gate | When | What |
|---|---|---|
| **Gate 0** | After intent brief drafting | User reviews scope, intent, and candidate epics before extraction |
| **Gate 1** | After task extraction | User reviews the epic/story breakdown |
| **Gate 1.5** | After quality review | User accepts or rejects individual improvement suggestions |
| **Gate 2** | After Jira formatting | User reviews final formatted tasks before Jira push |

## Tool access

- **Atlassian** - only the orchestrator uses it: reads issues to import a backlog, creates and updates issues after Gate 2. Workers never get Jira access (the Atlassian tools are denied to them on Claude Code).
- **PDF Reader** - reads PDF materials in full.
- **Sequential Thinking** - conflicting materials, splitting or merging stories, dependency chains.
- On Claude Code, the worker deny-rule matches a server named `atlassian`, as in the generated `.mcp.json`. An Atlassian server added as a claude.ai connector appears as `mcp__claude_ai_<server>__*`; whether the rule covers it is not yet verified.

## Skills loaded

- `tsh-processing-transcripts`, `tsh-analyzing-requirements`, `tsh-extracting-tasks`, `tsh-reviewing-task-quality`, `tsh-formatting-jira-tasks` - the skills of the five phases, loaded by the workers.
- `tsh-guarding-jira-statuses` - the rules for protected Jira statuses, applied on import, before formatting and before every push.
- `tsh-analyzing-codebase` - existing system context when it matters for the scope.

## BA workers

The orchestrator delegates each phase to a leaf subagent. Workers are read-only and have no shell. They run in delegated mode and return a `STATUS` block; the orchestrator writes the artifacts, asks you their questions at the matching gate and re-delegates with the answers.

| Phase | Worker | Model tier |
|---|---|---|
| Transcript cleanup and structuring | `tsh-ba-transcript-worker` | fast |
| Multi-source analysis, overlap checks, open questions | `tsh-ba-analysis-worker` | deep |
| Intent brief, epic identification, story extraction | `tsh-ba-extraction-worker` | balanced |
| Lite and Full quality review passes | `tsh-ba-quality-worker` | deep |
| Jira-ready formatting, read-back comparison, baseline content | `tsh-ba-formatting-worker` | fast |

Workers are not meant for direct use.

## Suggested next steps

After the tasks are approved and pushed, run `/tsh-implement Start implementation for the current task`. The Engineering Manager then delegates research to the Context Engineer and planning to the Architect.
