# Docs review (README, AGENTS.md, CHANGELOG, website)

Summary: 2 critical, 8 warning, 3 suggestion. Baseline 324d2fd..HEAD 1dcd92e. Read-only review.

Verified OK (no finding): all installer flags in README and installation.md match `install.mjs --help`; counts (17 subagents, 3 orchestrators, 16 commands, 2 internal, 41 skills, 62 skills, 11 MCP servers) match `generate.mjs --check`; the 16 commands and their `routes-to` match commands/overview.md; the CHANGELOG migration tables list every entry of `scripts/legacy-names.json` (22 renamed, 11 deleted, 17 subagents) and every base-commit artifact is mapped; the 7 "new skills" in the CHANGELOG are exactly the skills absent from 324d2fd; AGENTS.md generated-paths list equals `targets.json` `owned`; install-tree table in installation.md matches real `--dry-run` output for cursor, cursor+claude, cursor+codex, claude+codex; `check-refs --docs` reports 0 errors and `docusaurus build` succeeds with no broken links or anchors; no non-existent `tsh-*` names in README, AGENTS.md or website/docs outside the migration tables; spot-checked 14 pages against src (commands ask, debug, implement, refactor, review-ui, analyze-cloud-costs; agents ui-reviewer, plan-reviewer, overview; skills overview and verifying-ui; workflow frontend-flow; integrations atlassian and overview); skill-page support-file lists and links are correct.

## Critical

### C1. integrations/overview.md shows a config that Cursor does not load, and names removed agents
- File: website/docs/integrations/overview.md:32-36 (also 8, 12, 20, 22)
- Problem: "All servers are configured in `.cursor/mcp.json`" followed by a snippet with top-level `"servers"`. The generated `.cursor/mcp.json` uses `mcpServers`; CHANGELOG "Fixed" and mcp-setup.md say `servers` is wrong, and Cursor spike Q5 (headless) confirmed `servers` does not load. Table rows 20 and 22 list "Cursor Engineer" and "Cursor Orchestrator" (deleted / renamed to `tsh-ai-customization-orchestrator`). Lines 8 and 12 say integrations are only for "Cursor Agent sessions" / "Cursor agents", while the product now targets 3 tools. The file was touched by one line only in the refactor.
- Failure scenario: a user copies the snippet into `~/.cursor/mcp.json`; no server loads.
- Fix: replace the snippet with `mcpServers` (or just link to mcp-setup.md and drop the inline JSON), point to all three generated files, remove the two removed agents, make the intro tool-neutral.

### C2. Homepage "Getting started" tells users to use the Remote Rule import that README and upgrading.md declare unsupported
- File: website/src/components/GettingStartedSection/index.tsx:9-17 (also 24-26, 67-68)
- Problem: step 1 "Open Cursor Settings -> Rules -> Add Rule -> Remote Rule (GitHub) -> enter kkorus/cursor-collections. Skills are available globally across every workspace immediately." README.md:97 says this path is "not verified ... not a supported install path"; upgrading.md says it "is no longer documented"; spike Q9 is NOT TESTABLE. The component also names only Cursor and never mentions `node scripts/install.mjs`, Claude Code or Codex. Line 67 repeats "Import once via Cursor Settings".
- Failure scenario: a new user follows the landing page, imports the repo as a Remote Rule, and gets no skills or agents (or the old layout) with no error.
- Fix: rewrite the four steps around `git clone` + `node scripts/install.mjs --tools ...`, then MCP merge, then `/tsh-implement`.

## Warning

### W1. Homepage card advertises "12 Specialized AI Agents" including "Copilot Engineer" and "Copilot Orchestrator"
- File: website/src/components/HomepageFeatures/index.tsx:28-30
- Problem: the product has 17 subagents + 3 orchestrators; neither Copilot artifact exists. Line 70-71 ("just a set of prompts") is fine.
- Fix: "17 subagents and 3 orchestrators", list the real roles.

### W2. Hero title still reads "Copilot Collections"
- File: website/src/components/HeroSection/index.tsx:11
- Problem: product was renamed "TSH AI Collections" (config title, README, CHANGELOG "Product renamed").
- Fix: "TSH AI Collections".

### W3. QuickWins component uses Copilot and prompt wording
- File: website/src/components/QuickWins/index.tsx:27, 59, 95
- Problem: "a single Copilot chat session" (27); "The /tsh-implement prompt triggers the Engineering Manager" (59; it is a command that loads an orchestrator); "dedicated agents, prompts, and workflows" (95).
- Fix: "a single chat session"; "The /tsh-implement command loads the Engineering Manager"; "agents, commands and workflows".

### W4. ui-reviewer.md says the Software Engineer calls the UI Reviewer
- File: website/docs/agents/ui-reviewer.md:11
- Problem: "called ... as a subagent by the Software Engineer during the UI implementation loop". Subagents are leaves (AGENTS.md, same page line 45); `src/agents/tsh-software-engineer.md` never mentions the UI reviewer; the caller is the Engineering Manager via `tsh-orchestrate-ui-verification` (same page line 54, frontend-flow.md:34).
- Fix: "called directly by a user, by `/tsh-review-ui`, or by the Engineering Manager during the UI verify-fix loop".

### W5. atlassian.md lists agents that do not use the Atlassian MCP
- File: website/docs/integrations/atlassian.md:29-30 (and the "Used By" cell for Atlassian in integrations/overview.md:16)
- Problem: lists E2E Engineer and Software Engineer. `src/agents/tsh-e2e-engineer.md` and `tsh-software-engineer.md` have no `atlassian` in `requires-mcp`; only architect, code-reviewer and context-engineer (plus the BA orchestrator) use it. Unchanged from the old layout.
- Fix: derive the "Which agents use it" tables from `requires-mcp` (also incomplete for context7: plan-reviewer, prompt-engineer, devops-engineer, researcher are missing).

### W6. supported-tools.md implies consumers receive AGENTS.md / CLAUDE.md
- File: website/docs/getting-started/supported-tools.md:18
- Problem: under "What each tool receives" the row "Always-on instructions: AGENTS.md / CLAUDE.md (imports AGENTS.md) / AGENTS.md". The installer writes only `tsh-*` skills/agents and a manifest (install.mjs header; smoke-tests.md Finding 2: "docs should not imply consumers get the import"). Those files exist only in this repo.
- Fix: delete the row or label it "this repository only; the installer does not copy it".

### W7. "Visible in the menu" for Cursor and "cannot hide" for Codex are stated as fact without verification
- File: website/docs/getting-started/supported-tools.md:69 (also agents/overview.md:86, workflow/frontend-flow.md:50)
- Problem: "Entries such as `tsh-engineering-manager` ... therefore show up in the menu". Cursor spike Q2 records "whether `tsh-spike-internal` shows in `/` ... NOT CHECKED" and smoke-tests says the `/` palette is NOT TESTABLE headlessly. What was tested is only that they are in the model's skill list (46 entries). The Codex half comes from documentation only, and the page's legend reserves "docs" and "not yet verified" labels for exactly this.
- Fix: say "are in the model's skill list (tested in cursor-agent); whether the IDE `/` menu shows them is not yet verified", and tag the Codex part "docs".

### W8. Codex specifics stated without the "not yet verified" label
- File: website/docs/getting-started/supported-tools.md:23 (also agents/overview.md:36-38, getting-started/mcp-setup.md:79)
- Problem: Codex models `gpt-5.4` (high/medium) and `gpt-5.4-mini` are presented as what Codex "gets"; codex.spike.md Q3 (model ids) is blank/unrun. mcp-setup.md:79 tells users to run `codex mcp list`; the command comes from the unrun spike plan. The Codex CLI was never installed in any test.
- Fix: add "(not yet verified)" to the Codex model mapping and the `codex mcp list` instruction.

### W9. frontend-flow.md still says WCAG 2.1 AA
- File: website/docs/workflow/frontend-flow.md:66
- Problem: `tsh-ensuring-accessibility` now targets WCAG 2.2 AA (src/skills/tsh-ensuring-accessibility/SKILL.md:3, 11; skills page says 2.2; CHANGELOG "Fixed" lists the 2.2 change). `src/agents/tsh-software-engineer.md:58` has the same stale "2.1".
- Fix: "WCAG 2.2 AA" in both.

## Suggestion

### S1. README install table is not what the installer does for tool combinations
- File: README.md:91-95
- Problem: table says Cursor -> `.agents/skills/`, but `--tools cursor,claude` installs only `.claude/skills` (verified with `--dry-run`), and "When both trees are installed" is true only for claude+codex or all three. installation.md has the correct combination table.
- Fix: link to the combination table or add the rule "if claude is selected with cursor, only `.claude/skills` is written".

### S2. Cursor direct-subagent invocation under-claimed, "tested" over-claimed
- File: README.md:141, website/docs/getting-started/supported-tools.md:33
- Problem: cursor.spike.md Q7 shows `/name`, `@name` and "Use the X subagent" all spawn a custom subagent (headless); README and supported-tools say "not yet verified". Conversely "`/tsh-implement PROJ-123` (tested)" was observed only in `cursor-agent -p`, while README says "in Agent chat".
- Fix: mark these as "tested in cursor-agent CLI; IDE not yet verified".

### S3. `--source` row omits the `scripts/legacy-names.json` requirement
- File: website/docs/getting-started/installation.md:62
- Problem: `--help` was fixed after the smoke test to say the source needs `scripts/legacy-names.json`; the docs table was not.
- Fix: copy the `--help` wording.
