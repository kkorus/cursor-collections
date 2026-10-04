---
name: tsh-analyzing-requirements
description: Analyzes a task and builds its requirements context into a structured research document (.research.md), gathering information from Jira, Confluence, Figma, PDFs and the codebase and surfacing ambiguities as questions. Use when a task is missing requirements or context, before planning a feature, or when asked to research a task.
type: skill
metadata:
  short-description: Analyze a task and build its context and research document
---

# Analyzing Requirements

Gather and expand the context of a task to be developed, find the gaps in its description, and record the current state of the system in the context of the task. The result is the research document that planning starts from. Do not provide implementation details: focus on requirements, user stories, acceptance criteria and key flows.

## Analysis process

Use the checklist below and track your progress:

```
Analysis progress:
- [ ] Step 1: Determine the input source
- [ ] Step 2: Look for available external sources of information
- [ ] Step 3: Gather information from all sources
- [ ] Step 4: Identify gaps and ask clarification questions
- [ ] Step 5: Finalize the research document
```

**Step 1: Determine the input source**

Before gathering information, determine how the task context was provided:

- **Research and plan files exist** (`*.research.md`, `*.plan.md`): read them as the primary source of requirements, acceptance criteria, scope and definition of done.
- **Jira ID or task ID provided**: use it to fetch task details from external tools (Step 2).
- **Context provided directly in the prompt**: when neither files nor a task ID are referenced, extract requirements, acceptance criteria and scope from the user's message and treat the prompt as the single source of truth. If critical information is missing, go to Step 4.
- **PDF files attached or referenced**: extract their content with a PDF reading tool before analyzing them, and treat it as a primary source.

This determines how much of Steps 2 and 3 you need: if the context is already fully provided inline or in files, skip redundant external lookups.

**Step 2: Look for available external sources of information**

Check which tools are available, such as Atlassian Jira and Confluence, Notion, Linear and Trello. If GitHub tools are available, look for issues and discussions that match the task and the project.

**Step 3: Gather information**

- For each available tool, look for task-related information, by ID if one was provided and otherwise by task domain and jobs to be done. Look at the connected tasks, subtasks and the epic, not only at the current task. Include parents and subtasks to get the full picture of the requirements.
- Check all external links in the task, including the Confluence pages, knowledge base articles and designs. Read every attached or referenced PDF (requirements documents, client briefs, process descriptions, compliance documents) with a PDF reading tool and include the relevant findings.
- Unless you were asked to research only non-frontend aspects, review every linked Figma design with the Figma tool and include the relevant information. This matters a lot for UI work.
- Analyze the tech stack, industry and domain of the project to understand the best practices that apply.
- Analyze the codebase against the task requirements: look for areas related to the task and record what exists for the Current Implementation Status section.

**Step 4: Identify gaps and ask clarification questions**

From the gathered information and the task description, find ambiguities and missing information. Ask the questions and do not proceed until they are answered or you are told to continue.

**Step 5: Finalize the research document**

Write the document following [assets/research.template.md](assets/research.template.md). Include all gathered information, findings and answered questions. Do not add or remove sections. Keep the file clear, concise and tailored to the development team.

Save it at the path the caller gave you. Without one, use `<specs>/<task>/<task>.research.md`, where `<task>` is the Jira ID or a short kebab-case task name and `<specs>` is resolved by the "Project output locations" step of the `tsh-discovering-technical-context` skill (default `specifications/`). Update the file whenever new information arrives.

## Delegated mode

When your task starts with `MODE: delegated` (for example when the context engineer or a BA analysis worker runs this skill), the caller owns every question, every file write and, for the BA orchestrator, every Atlassian call. There is nobody to answer you:

- **Clarification questions:** do not ask the user. Put each question in `QUESTIONS` and mark the affected findings as open. If the missing answers block the document, return `NEEDS_INPUT`; otherwise continue with what you have and return `DONE` with the questions listed. When the caller re-delegates with `PRIOR_OUTPUT` and `USER_ANSWERS`, continue from the saved or returned document and treat the answers as authoritative.
- **External sources (Jira, Confluence and other task tools):** use only the sources you were given and the tools your role lists. A role without an Atlassian tool (such as the BA analysis worker) works from the files and text in the task, or from the payload in `INPUT_ARTIFACTS`, and does not look up Jira or Confluence. Record anything you could not look up as a question.
- **Saving the document:** write it only at the path the task names and only when you have write access. Otherwise return the complete document in the reply body, in the structure of `assets/research.template.md`, with `ARTIFACTS: none`, and let the caller save it.
- **Everything else:** keep the steps and the document structure unchanged.

## Connected Skills

- `tsh-analyzing-codebase` - for analyzing the existing codebase in the context of the task requirements
- `tsh-analyzing-implementation-gaps` - for the detailed comparison of what already exists against what must be built
- `tsh-discovering-technical-context` - for the project conventions and the output locations
