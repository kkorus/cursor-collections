# Review: per-skill change table, Agents / Commands / Internal / New artifacts

Summary: 0 critical, 3 warning, 3 suggestion. `npm run check` passes (338 files, 0 errors).

Scope checked: all 21 agent rows, 17 command rows, 11 internal rows and the 10 new-artifact rows. Every artifact exists under its new name and type (17 agents, 3 orchestrators, 16 commands, 2 internal steps; deleted and merged items are gone from `src/`; the 3 partials and 10 new skills exist, with the listed `references/` and `assets/`). For each row 2-3 listed changes were opened and confirmed in the current text. The rows below are the ones that are not, or only partly, fulfilled.

## Warnings

### W1. Row 9 / #40 (`tsh-prompt-engineer`) is not fulfilled: the absorbed 5-step loop and output format do not exist, and the persona prose is not trimmed
- File: `src/agents/tsh-prompt-engineer.md:17-53` (no Workflow or Output format section)
- Evidence: the plan (Task 3.14) says "move the 5-step loop and output format into the agent" and its DoD says "The agent has 'Workflow' and 'Output format' sections". `grep -n "^## " src/agents/tsh-prompt-engineer.md` lists only "Agent Role and Responsibilities", "Skills Usage Guidelines" and "Tool Usage Guidelines". `grep -rn "Design Decisions\|Security Assessment\|Integration Example"` over `src/` finds nothing. In `324d2fd:.cursor/skills/internal/tsh-engineer-prompt/SKILL.md` these are the five deliverable sections (Tech Stack, Prompt Template, Integration Example, Security Assessment, Design Decisions) and the 5-step loop (gather, analyze, optimize/create, security check, return). The deleted skill's content was dropped rather than moved. The four persona paragraphs ("Meta-Cognitive LLM Analysis" at :35 through "Iterative Refinement" at :41) are still there, although the row says "Trim the persona prose (`:27-41`)".
- Failure scenario: EM delegates a prompt audit. The agent has no defined deliverable structure (no vulnerability table, no security assessment, no integration example), so the output varies from run to run. The agent also returns no fixed shape for the caller to check.
- Fix: add `## Workflow` (the 5 steps) and `## Output format` (the 5 sections) to the agent, and reduce the four technique paragraphs to about 3 lines.

### W2. Row 8 (`tsh-ui-reviewer`): the "one blocker policy" contradicts the agent's own read-only rule and its tool set
- File: `src/agents/tsh-ui-reviewer.md:23` and `:36`
- Evidence: `:23` says "you never fix code and never write files". `:36` says "In delegated mode, write the partial report to the path your caller gave you and return `NEEDS_INPUT`...". The generated `.claude/agents/tsh-ui-reviewer.md` disallows `Write`, `Edit` and `Bash`. Neither `tsh-orchestrate-ui-verification` nor `/tsh-review-ui` passes a report path. The BA workers resolve the same conflict with "Read-only: you cannot write files. Return the complete result in the reply... `ARTIFACTS: none`". The shared `partials/agent-modes.md:24` ("Persist partial work... Write drafts, findings and reports to files") has the same conflict for the read-only `tsh-ai-customization-researcher` and `-reviewer`, which have no override.
- Failure scenario: the dev server redirects to a login page while the reviewer is in delegated mode. It follows `:36`, tries to write, the write is refused (the smoke test already saw a rejected write), and the partial report is lost. EM gets `NEEDS_INPUT` with nothing to show the user, and the verification gate then has no report to judge.
- Fix: replace `:36` with "return the partial report in the reply body before the status block, `ARTIFACTS: none`", the BA-worker wording. Add the same line to the two read-only AI-customization workers, or qualify `agent-modes.md:24` with "if you have write access".

### W3. Rows 36 and 38 (`/tsh-review`, `/tsh-review-ui`): the command promises next steps that a delegated agent does not produce
- File: `src/skills/tsh-review/SKILL.md:14`
- Evidence: `/tsh-review` says "end with the agent's suggested next steps". The agent runs with `MODE: delegated`, and `src/partials/agent-modes.md:15` shows "Suggested next steps" only in interactive mode. The reply then ends with the status block. `tsh-ui-reviewer` has no next-steps section at all (correctly, per row 8), and `/tsh-review-ui` has no closing step.
- Failure scenario: the user runs `/tsh-review`. The agent returns findings plus the status block and no next steps. The command's last instruction has no source, so the model invents a next step or omits it, and the user is not told to run `/tsh-implement ...` to fix the findings.
- Fix: put the next step text into the command itself ("Show the user: run `/tsh-implement Implement changes requested after code review` to fix the findings"), in the style of `/tsh-audit-codebase`.

## Suggestions

### S1. Row 1 (and SE, code-reviewer, context-engineer, e2e, ui-reviewer): Figma and Playwright usage blocks are still inline
- Files: `src/agents/tsh-architect.md:83`, `tsh-code-reviewer.md:58`, `tsh-software-engineer.md:70,86`, `tsh-context-engineer.md:52`, `tsh-e2e-engineer.md:66,92`, `tsh-ui-reviewer.md:56,67`.
- Evidence: row 1 says "MCP blocks → `tsh-using-mcp-servers`", and audit AG-X5 lists duplicated MCP blocks. The context7, pdf-reader, atlassian and sequential-thinking blocks were replaced by the shared skill. The Figma block ("This tool is provided by the Figma MCP server...") is still copied, in different words, into 6 agents even though `tsh-using-mcp-servers/references/figma.md` and `playwright.md` exist. Task 3.4's DoD only names the context7, pdf-reader and Atlassian blocks, so this is within the DoD but still leaves the duplication AG-X5 described.
- Fix: optional. Keep only the role-specific "MUST/SHOULD NOT" lines and point to the reference files.

### S2. Row 27 (`/tsh-commit`) and the command template: the step format was not aligned
- File: `src/skills/tsh-commit/SKILL.md:19` (`## Workflow` / `### 1.`), 116 lines.
- Evidence: row 27 says "Step format aligned with the command template". `tsh-creating-commands/SKILL.md` requires a body with Route, Inputs, Required Skills, Steps, Output and Guardrails and a size of about 40 lines. Only the 4 `tsh-create-custom-*` commands have `## Route`. 12 of 16 commands use `## Workflow`/`## Constraints` instead (audit "Step-format inconsistency" is still true), and `npm run check` does not enforce it. Task 3.40's DoD does not mention the step format, so this is not a DoD failure.
- Fix: either align `/tsh-commit` (and ideally the other commands) or relax the checklist in `tsh-creating-commands` to match what the commands do.

### S3. Small leftovers from audit cross-cutting items 11 and 12 and row 28
- `src/skills/tsh-audit-infrastructure/SKILL.md` step 2 saves the report to `specifications/infrastructure-audit-<yyyy-mm-dd>.md`, a flat file. The other commands use `specifications/<folder>/` (cost-audits, code-quality, decisions). Audit item 11 asked for one convention.
- `tsh-ask`, `tsh-debug` and `tsh-refactor` descriptions do not end with "Routes to the X ..." as the other routed commands do (audit item 12).
- Row 28 lists "Requires `npm run check` where available" for `/tsh-create-custom-agent`. The command text does not say it (`grep "npm run" src/skills/tsh-create-custom-*` is empty). The creator agent and the orchestrator quick mode do run it, so behavior is covered.

## Rows verified as fulfilled (no finding)
Agents 1-8, 10-21 except as noted above. Checked items include: tiers and access in frontmatter for all 17 agents; devops 84 lines with the Zero-Deletion Policy defined (`tsh-devops-engineer.md`), the architect spawn replaced by `NEEDS_ARCHITECT_DECISION`, and its skill-loading table moved to `tsh-delivering-infrastructure`; e2e without `atlassian`, standards removed, summary template in `tsh-writing-e2e-tests/assets`; plan-reviewer 57 lines and no "send to architect"; context-engineer without the copy-pasted line and with `NEEDS_INPUT`; BA orchestrator 102 lines with Gate 1.5 in the description, worker tiers, `references/parallel-processing.md`, protected statuses in `tsh-guarding-jira-statuses`; EM with the code-reviewer block, artifact-path table, plan-review loop, refactor mode and a single pointer to `tsh-orchestrate-ui-verification`; AI-customization orchestrator with quick mode and no A/B note.
Commands 22-38: cost merge (checklists, tagging label mapping and report template in `tsh-optimizing-cloud-cost`, the step bug gone), thin routing with `routes-to` and `argument-hint` on all that need them, ADR template, `tsh-debugging`, `tsh-refactoring`, audit-codebase checklists and report template in `tsh-analyzing-codebase`.
Internal 39-49: all deletions and merges done, with summary templates in the domain skills' `assets/`, `tsh-implement-task` with "No plan provided" and "UI tasks (Figma)" sections, the single verify-fix loop in `tsh-orchestrate-ui-verification`, planning procedure in `tsh-designing-architecture`, research merged into `tsh-analyzing-requirements` (delegated-mode section).
New artifacts: all 10 rows present, including the 8 MCP reference files.
