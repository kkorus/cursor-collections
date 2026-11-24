---
name: tsh-audit-codebase
description: Comprehensive code quality audit covering dead code, duplications and improvement opportunities, with a report saved to the project's code-quality location (default specifications/code-quality/). Use when the user types /tsh-audit-codebase, asks for a codebase audit, or wants a code quality report. Routes to the tsh-architect agent.
type: command
routes-to: tsh-architect
metadata:
  short-description: "Audit code quality: dead code, duplication, improvements"
---
# /tsh-audit-codebase

Audit the code quality of this repository and save the report to `<specs>/code-quality/code-quality-report.md`. Resolve `<specs>` first with the "Resolve the Project Output Locations" step of the `tsh-discovering-technical-context` skill (default `specifications/`) and pass it in every `TASK`. You run in the main thread and fan out `tsh-architect` subagents, one per layer or app. The subagents never fan out further.

## Workflow

1. **Discover.** Load the `tsh-discovering-technical-context` skill. Identify the repository type. For a monorepo, list every app, package and shared library; each is analyzed and reported separately. Note the tech stack of each.
2. **Fan out.** Delegate to one `tsh-architect` subagent per layer or app, all in parallel, using the delegation prompt template below. The `TASK` names the layer path and tech stack and tells the subagent to load the `tsh-analyzing-codebase` skill (`references/audit-checklists.md`) and the `tsh-reviewing-code` skill, and to write its findings to `<specs>/code-quality/<layer>.findings.md` in the report's per-layer format. Apply the status handling below to each subagent on its own.
3. **Architecture review.** Delegate one more `tsh-architect` subagent for the architecture review checklist, with the findings files as `INPUT_ARTIFACTS`.
4. **Report.** Compile the findings, prioritize them by severity and write the report with the code quality report template of the `tsh-analyzing-codebase` skill. Keep the layers separate.

## Suggested next steps

Show the user: run `/tsh-implement` to fix the critical findings, or `/tsh-refactor` for the duplications.

<!-- include: caller-status-handling -->
