# Content review: orchestration group

Summary: 1 critical, 6 warning, 3 suggestion. Scope: src/skills (orchestration, review, planning, debug/refactor/commit/audit skills), src/agents (architect, software-engineer, code-reviewer, plan-reviewer, context-engineer, ui-reviewer, e2e-engineer, prompt-engineer), src/partials. Checked against generated `.claude/agents/tsh-ui-reviewer.md`, `.cursor/agents/...`, `.codex/agents/...`.

## Critical

### C1. Read-only tsh-ui-reviewer is told to write files; the partial does the same
- src/agents/tsh-ui-reviewer.md:23 says "you never write files"; src/agents/tsh-ui-reviewer.md:36 says that in delegated mode it must "write the partial report to the path your caller gave you". src/partials/agent-modes.md:24 ("Persist partial work ... Write drafts, findings and reports to files") is included in the same agent. src/skills/tsh-verifying-ui/SKILL.md:61 also tells it to save screenshots to `specifications/<task-id>/screenshots/`.
- Evidence: the generated agent is `access: read-only`, `shell: false`. Claude has `disallowedTools: Agent, Write, Edit, NotebookEdit, Bash`, Cursor has `readonly: true`, Codex has `sandbox_mode = "read-only"`. No caller passes a report path. tsh-engineering-manager, tsh-orchestrate-ui-verification and /tsh-review-ui never give one.
- Failure scenario: the login page redirects, so the reviewer must return `NEEDS_INPUT` with a LOW-confidence partial report. It cannot write the file and nobody gave it a path. The partial report is lost, because `PRIOR_OUTPUT` carries only the STATUS block (caller-status-handling.md template). After the user answers, the re-delegated reviewer starts from zero. Or it breaks the read-only contract in whichever tool lets it.
- Fix: in tsh-ui-reviewer.md, replace the write instruction with "put the partial report in the reply body before the status block". Add an exception to the ui-reviewer: the partial's persist rule does not apply, so the caller must keep the reply text. Have tsh-orchestrate-ui-verification pass the report text, not a path, into `PRIOR_OUTPUT`. In tsh-verifying-ui:61 make the screenshots conditional ("if your role can write files; otherwise skip").

## Warnings

### W1. Refactor mode never reaches the architect or the code reviewer
- src/skills/tsh-engineering-manager/SKILL.md:129 and src/skills/tsh-refactor/SKILL.md:18 promise a plan with `Behavior-preserving: yes` that starts with characterization tests, and a review that "additionally verifies that behavior is unchanged". Only the software engineer is told to follow `tsh-refactoring`.
- Evidence: `grep -i refactor` over src/agents/tsh-architect.md, tsh-code-reviewer.md, tsh-plan-reviewer.md, skills/tsh-designing-architecture/SKILL.md and skills/tsh-reviewing-code/SKILL.md finds nothing. Only plan.template.md:27 has the field. The EM "Agents Delegation Guidelines" task text for the architect and the code reviewer has no refactor variant.
- Failure scenario: `/tsh-refactor` reaches the architect through the EM. The architect follows tsh-designing-architecture and produces a normal plan: no characterization-test phase and the "Behavior-preserving" row omitted. The reviewer approves it. The code reviewer checks correctness only, so a behavior change passes review.
- Fix: in the EM Refactor Mode section, give explicit task text for the architect (load `tsh-refactoring`, set the field, put the characterization tests first) and for the reviewer (load `tsh-refactoring`, verify no public behavior, contract or data shape changed).

### W2. Code-review and fix loop has no cap or exit
- src/skills/tsh-engineering-manager/SKILL.md:124: "delegate the fixes ... and review again" repeats while critical or warning findings remain.
- The partial (caller-status-handling.md:40) only caps status re-delegation and names "plan review, UI verification" as the loops with their own caps. The review-fix loop is not in that list. The reader cannot tell whether the "at most 3 times per task" rule applies or whether the loop is unbounded. implementation-flows.md:40 says "3-iteration cap per agent per task" but defines no escalation for this loop.
- Failure scenario: a reviewer keeps finding new warnings each round and the EM loops until context runs out. Or the cap silently applies to the fix engineer and leaves the branch in a half-fixed state.
- Fix: add "Code review loop (maximum 3 iterations)" next to the plan review loop. After the cap, show the remaining findings and let the user decide. Add the loop to the list of own-cap loops in the partial.

### W3. tsh-analyzing-requirements contradicts the status contract
- src/skills/tsh-analyzing-requirements/SKILL.md:63: "otherwise continue ... return `DONE` with the questions listed".
- src/partials/agent-modes.md:32 and :46: `QUESTIONS` is "only with NEEDS_INPUT", and the handling table (caller-status-handling.md) only reads `QUESTIONS` for `NEEDS_INPUT`. The EM `DONE` row says "Continue with the workflow".
- Failure scenario: the context engineer finishes the research with 4 open questions and returns `DONE`. The EM moves on to planning and the questions reach neither the user nor the architect.
- Fix: either return `NEEDS_INPUT` whenever there are unanswered questions, or write the open questions into the research file's open-questions section and say the EM must relay them before planning.

### W4. tsh-prompt-engineer lacks the plan-progress partial
- src/agents/tsh-prompt-engineer.md includes only `agent-modes`. The software, e2e and devops engineers include `plan-progress`.
- EM (SKILL.md:116) says "make sure the delegate checked the plan boxes", and tsh-designing-architecture plans `[REUSE]` prompt tasks for this agent with Definition of Done boxes. The agent is told to "strictly follow" the plan but never to tick it.
- Fix: add `<!-- include: plan-progress -->` to tsh-prompt-engineer.md (this agent has write access).

### W5. Output locations are hard-coded, but the EM says the project can override them
- src/skills/tsh-ask/SKILL.md:12,21 (`specifications/decisions/`), src/skills/tsh-audit-codebase/SKILL.md:3,11,16 (`specifications/code-quality/`), src/skills/tsh-analyzing-codebase/SKILL.md ("Large codebase" and "Code Quality Audit" sections).
- tsh-discovering-technical-context Step 4 and the EM "Artifact Paths" section say that a project can redirect specs and reports, and that callers pass the resolved location. The two commands skip that step. Step 4 also does not list `codebase-analysis/`.
- Failure scenario: a project whose AGENTS.md puts specifications under `docs/specs/` gets decision records and audit reports in a second, unexpected tree.
- Fix: in both commands, resolve `<specs>` with the "Resolve the Project Output Locations" step first and pass it in `TASK`. Add `codebase-analysis/` to Step 4.

### W6. /tsh-review asks for next steps that a delegated agent does not produce
- src/skills/tsh-review/SKILL.md:14 ("end with the agent's suggested next steps"). The agent's next steps (src/agents/tsh-code-reviewer.md, "Suggested next steps") are shown only in interactive mode (agent-modes.md:15). The delegated section is silent, and the delegated reviewer follows "Never ask"/"status block last".
- Failure scenario: the user runs `/tsh-review`. The command delegates with `MODE: delegated`, the agent returns findings and a status block, and no next steps exist to show.
- Fix: have /tsh-review state the next steps itself (as /tsh-ask and /tsh-audit-codebase do), or add a sentence to agent-modes that delegated agents put their suggested next steps before the status block.

## Suggestions

### S1. Software-engineer prompt conflicts with "Verification is not your job"
- src/agents/tsh-software-engineer.md:60 lists `tsh-verifying-ui` "when implementing UI with Figma verification", and the Playwright block says to verify its own work. src/skills/tsh-implement-task/SKILL.md:72 says verification belongs to the caller's UI reviewer. tsh-verifying-ui Step 1 asks the user to confirm the dev server URL, which the delegated engineer cannot do. Drop the `tsh-verifying-ui` line, or limit it to "read the tolerances only; do not run the process".

### S2. Name mismatches in references (check-refs does not catch them)
- src/agents/tsh-e2e-engineer.md:53 says "Change Log"; the plan template section is "Changelog".
- src/skills/tsh-reviewing-frontend/SKILL.md:157 says "framework-specific checklist from references", but the skill has no `references/`. The checklist lives in `tsh-implementing-react` ("Hooks Review Checklist").
- EM SKILL.md "Artifact Paths" cites the "Project output locations" step. The actual heading is "Resolve the Project Output Locations".

### S3. Unresolved edges in the debug and UI flows
- src/skills/tsh-debug/SKILL.md step 4: if the main-thread verification fails, no instruction says what to do or how often to re-delegate (only the generic 3-time cap applies).
- src/skills/tsh-orchestrate-ui-verification/SKILL.md "Act on the result": a `PASS` with LOW or MEDIUM confidence is not covered (the confidence rules are written for FAIL). tsh-refactoring:36,48 tell the user to "commit separately", which no agent in the chain does (commits only happen through /tsh-commit).

## Checked and found consistent
- All delegation chains are one level deep. Every orchestrating command includes the status partial directly (`tsh-review`, `tsh-review-ui`, `tsh-ask`, `tsh-debug`, `tsh-audit-codebase`) or via the EM (`tsh-implement`, `tsh-refactor`).
- Plan review loop cap (3), UI loop cap (5) and the handling of all four statuses in the EM and UI loop.
- Section references that resolve: "UI tasks (Figma)", "LLM-integrated code", "Findings format", "No plan available", "Delegating and Handling Agent Status".
- Agents without a shell (plan-reviewer, context-engineer, prompt-engineer, ui-reviewer) are not told to run commands by their skills, except the ui-reviewer screenshot write noted in C1.
