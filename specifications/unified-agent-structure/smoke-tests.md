# Smoke tests: unified agent structure (Task 5.3)

Run on 2026-10-04 against branch `refactor/unified-agent-structure` (HEAD d9c7783 plus the installer fixes of the same day). Every test installed the collection into a scratch project under `/private/tmp` with `scripts/install.mjs` and a scratch `TSH_HOME`. Nothing was approved or connected for MCP servers that need credentials.

## Summary

| Tool | Version | PASS | FAIL | NOT TESTABLE | How |
|---|---|---|---|---|---|
| Claude Code | 2.1.285 | 12 | 0 | 0 | `claude -p` (print mode), 7 model runs |
| Cursor | `cursor-agent` 2026.10.01-14929f9 | 9 | 0 | 0 | `cursor-agent -p`, 6 model runs. The IDE `/` palette and settings UI are not reachable in print mode |
| Upgrade path (all tools) | installer at d9c7783 | 15 | 0 | 0 | no model runs |
| Codex | not installed | 0 | 0 | all | NOT TESTED: the `codex` CLI is not installed here |

### Codex (not tested)

| Check | Result | Note |
|---|---|---|
| `$tsh-implement` works and is not implicitly invoked | NOT TESTED | `codex` CLI not installed |
| `.codex/agents` subagents load | NOT TESTED | includes the open spike 1.3 questions (hyphenated names, `developer_instructions`, read-only sandbox) |
| MCP servers from `.codex/config.toml` load | NOT TESTED | needs a trusted project; dotted server names unverified (spike 1.3 Q6) |
| Skill listing is not truncated beyond usefulness | NOT TESTED | 62 skills, short-description total 3,235 chars (lint budget 6,000) |

Codex output is generated and schema-checked (TOML round-trips in the tests), but its runtime behavior is unverified. The docs mark it "not yet verified".

## Findings

- No check failed and nothing contradicts the plan.
- Print mode tests, not the IDE: the Cursor `/` palette, the agents picker and the MCP approval UI were not exercised; Claude print mode does not show the interactive MCP approval prompt (`claude mcp list` shows the servers as pending approval).
- The installer does not install `CLAUDE.md` or `AGENTS.md` into a consumer project. The `CLAUDE.md` -> `AGENTS.md` import was therefore verified in this repository only.
- The Atlassian deny for the BA workers matches a server named `atlassian`; a connector under another name is not denied.
- Fixed from the upgrade test: emptied legacy category folders are now removed, and `upgrading.md` documents the backup layout and that `--scope project` also cleans `~/.cursor/skills`; `--help` for `--source` now mentions `scripts/legacy-names.json`.
- Second installer run is idempotent but not silent (it re-copies every entry).
- `cursor-agent` wrote its own project state under `~/.cursor/projects/private-tmp-tsh-smoke-cursor-*`; the installer created nothing under the real home.

## Smoke test: Claude Code

Tool: Claude Code 2.1.285 (`/opt/homebrew/bin/claude`). Repo HEAD d9c7783. Scratch consumer: `/private/tmp/claude-smoke/proj` (git repo, one-line diff `a=1` to `a=2`), scratch home `TSH_HOME=/private/tmp/claude-smoke/home`.
Install: `node scripts/install.mjs --tools claude --scope project --project-dir /private/tmp/claude-smoke/proj` (after `--dry-run`): 17 agents and all skills copied. Model runs: 7 (print mode, `--setting-sources project`).

| # | check | result | evidence / note |
|---|---|---|---|
| 1a | Orchestrator/internal skills hidden from slash menu | PASS | `claude -p --output-format stream-json` init event: `slash_commands` and `skills` contain 59 `tsh-*` entries and omit `tsh-engineering-manager`, `tsh-business-analyst`, `tsh-ai-customization-orchestrator`, `tsh-implement-task`, `tsh-orchestrate-ui-verification` (all `user-invocable: false` in the generated SKILL.md). |
| 1b | Hidden skill loads by name | PASS | Prompt "load tsh-engineering-manager with Skill tool": trace `Skill {"skill":"tsh-engineering-manager"}` -> `Launching skill: tsh-engineering-manager`; model echoed `# Engineering Manager`. |
| 2 | `/tsh-review` delegates `tsh-code-reviewer` | PASS | `claude -p "/tsh-review"` trace: `Agent {"subagent_type":"tsh-code-reviewer","prompt":"MODE: delegated\nCALLER: /tsh-review ..."}`; review of the one-line diff returned and summarized, next steps offered. |
| 3 | Delegated subagent returns NEEDS_INPUT instead of asking | PASS | `Agent tsh-architect`, prompt `MODE: delegated\nDesign the architecture for the new system.` -> report ends with `STATUS: NEEDS_INPUT`, `ARTIFACTS: none`, `SUMMARY`, numbered `QUESTIONS`. No wait for user, no plan file. |
| 4 | `.mcp.json` servers need approval | PASS | `.mcp.json` copied into scratch project; `claude mcp list`: all 11 project servers `⏸ Pending approval (run claude to approve)` (awslabs x2, gcp x3, playwright, context7, sequential-thinking, figma, atlassian, pdf-reader). Nothing approved, no credentials used. See Finding 3 for print-mode behavior. |
| 5 | `CLAUDE.md` imports `AGENTS.md` | PASS | Repo `CLAUDE.md` is exactly `@AGENTS.md`. In a scratch dir with only those two files, `claude -p` (no tools) quoted the first heading "TSH AI Collections - Repository Constitution" and a sentence from AGENTS.md. |
| 6a | `claude --agent tsh-architect` converses interactively | PASS | `claude -p "Design the architecture for a new system." --agent tsh-architect`: inspected repo, then asked 7+ numbered questions in prose; no `STATUS:` block. |
| 6b | Same agent delegated by EM returns STATUS block | PASS | Skill `tsh-engineering-manager` -> `Agent tsh-architect` with `MODE: delegated\nCALLER: tsh-engineering-manager ...`; hand-back ended with `STATUS: NEEDS_INPUT / ARTIFACTS / SUMMARY / QUESTIONS`. |
| 7a | Delegated subagents cannot spawn (`Agent` denied), static | PASS | All 17 `.claude/agents/*.md` have `disallowedTools` starting with `- Agent`. |
| 7b | Same, runtime | PASS | Delegated `tsh-code-reviewer` diagnostic: "No. I have no tool named Agent or Task. My tools are Bash, Edit, ListAgents, Read, ReportFindings, Skill, ToolSearch, Write ..." |
| 8 | Atlassian deny for BA workers | PASS (static only) | All 5 `tsh-ba-*-worker.md` have `disallowedTools: [Agent, Write, Edit, NotebookEdit, Bash, mcp__atlassian]`; `mcp__atlassian` matches the server name `atlassian` in `.mcp.json`. Not exercised at runtime (server needs auth; not connected). |
| 9 | Real HOME untouched | PASS | No `~/.agents`, `~/.codex`, `~/.tsh-ai-collections-backup`; no `tsh-*` created under `~/.claude` or `~/.cursor` by this run; repo only gains this file. |

### Findings

1. No FAIL. Everything in Task 5.3 (Claude Code list) behaves as the plan describes.
2. The installer does not install `CLAUDE.md`/`AGENTS.md` into a consumer project (expected per D3: only `tsh-*` entries). Check 5 therefore verifies the repo's own dogfooding, not the consumer install. Not a plan contradiction, but docs should not imply consumers get the import.
3. Print-mode observation (tool behavior, not repo): with `.mcp.json` present, `claude -p` does not prompt and its init event showed some project servers already `connected` (awslabs docs), `failed` (gcp-gcloud) or `needs-auth` (figma, atlassian), the rest `pending`. The interactive approval gate shown by `claude mcp list` is for interactive use only. I did not authenticate anything. Worth a note in the docs if CI/headless use is mentioned.
4. `user-invocable: false` skills are still loadable by name through the `Skill` tool (model-initiated), as the plan expects; they are absent from `slash_commands`.
5. `mcp__atlassian` only denies a server named `atlassian`. A user-level Atlassian connector under another name (for example a claude.ai connector) would not be denied; the worker prompts also say "Never call Atlassian" as a second layer.
6. Delegated subagents used `Bash` on `tsh-architect` (allowed by design: only `Agent` is denied); no issues.


## Smoke test: Cursor (cursor-agent CLI)

- Tool: `cursor-agent` 2026.10.01-14929f9 (logged in, model Auto), macOS Darwin 25.6.0, 2026-10-04. Repo HEAD d9c7783.
- Scratch dirs: `/private/tmp/tsh-smoke-cursor/{proj,proj2,proj3}`, `TSH_HOME=/private/tmp/tsh-smoke-cursor/home`. Model runs: 6.
- Install: `node scripts/install.mjs --tools cursor --scope project --project-dir <proj>` (dry-run first) gave `.agents/skills` (62) and `.cursor/agents` (17). `--tools cursor,claude,codex` gave `.agents/skills` 62, `.claude/skills` 62, `.cursor/agents` 17, `.claude/agents` 17, `.codex/agents` 17.
- Caveat: print mode cannot show the `/` palette or Settings. cursor-agent uses the real HOME, so user-level plugin skills (superpowers) exist in its context. Listings were filtered to `tsh-*`.

| # | Check | Result | Evidence / note |
|---|---|---|---|
| 0a | Cursor-only install prints tree selection | PASS | Only `.agents/skills` + `.cursor/agents`; MCP line: `cursor: merge .../.cursor/mcp.json into <project>/.cursor/mcp.json` |
| 0b | 3-tool install tree selection + Cursor guidance | PASS | 5 trees listed as above; prints "Cursor reads .agents/skills and .claude/skills, so skills may be listed twice ... turn off Settings > Include Third-Party Plugins..." |
| 1 | Each tsh-* skill appears once | PASS (CLI) | 62 dirs on disk (41 skill, 16 command, 2 internal, 3 orchestrator). Agent list in `proj`: 46 entries, 46 distinct = 41+2+3; the 16 commands carry `disable-model-invocation: true` and are absent from the model list (reachable via `/name`). In `proj2` (both `.agents` and `.claude` trees): 46 total, 46 distinct, all registered under `.claude/skills` (dedupe by name, consistent with spike Q1). The `/` palette count is NOT TESTABLE headlessly. |
| 2 | `/tsh-implement` loads tsh-engineering-manager by name | PASS (file read) | stream-json: first tool call `readToolCall .agents/skills/tsh-engineering-manager/SKILL.md` (181 lines). CLI loading by name is a file read. |
| 3 | EM delegates tsh-context-engineer as a `.cursor/agents` subagent | PASS | `taskToolCall subagentType {"custom":{"name":"tsh-context-engineer"}}`, prompt began `MODE: delegated`, reply ended `STATUS: DONE`. |
| 4 | tsh-ui-reviewer read-only | PASS | Generated `.cursor/agents/tsh-ui-reviewer.md` has `readonly: true`. Write attempt via subagent: rejected ("You are in ask mode and cannot run non read-only tools"), `WRITE-TEST.txt` not created. |
| 5 | MCP servers load from `.cursor/mcp.json` | PASS (listing only) | `cursor-agent mcp list` shows all 11: awslabs.aws-api, awslabs.aws-documentation, gcp-gcloud, gcp-observability, gcp-storage, playwright, context7, sequential-thinking, figma, atlassian, pdf-reader, each "not loaded (needs approval)". Nothing approved; connections and tools not tested. |
| 6 | Delegated subagent loads required skill | PASS (file read) | `tsh-ui-reviewer` ("Required skills: load `tsh-verifying-ui` by name") reported it loaded it by reading its skill file, H1 "Verifying UI". Not inlined; the by-name instruction works through a file read in the CLI. |
| 7 | `/tsh-architect` direct is interactive | PASS (print mode) | Clear request ("add subtraction/multiplication"): no question, wrote a plan. Ambiguous request ("add authentication"): ran in the main thread and ended its turn with "### Questions for you" (6 questions), no plan. Print mode shows only the first question round; the answer needs a follow-up turn. |

### Findings

1. No FAILs. Totals: PASS 9 (0a, 0b, 1 to 7), FAIL 0, NOT TESTABLE 0 overall; parts not testable headlessly are the `/` palette (check 1), the IDE agents picker and MCP approval and connection (check 5).
2. `/tsh-architect` is not a registered skill or command in the CLI. The model globbed `**/*architect*`, found `.cursor/agents/tsh-architect.md` and read it as a file, and also loaded `tsh-designing-architecture` (the agent's workflow). It behaved as intended, but only via model improvisation. Whether the IDE `/` menu exposes `.cursor/agents` entries is unverified.
3. Parent prompts to subagents in the CLI are passed correctly (`MODE: delegated` header, CALLER, TASK, INPUT_ARTIFACTS, PRIOR_OUTPUT, USER_ANSWERS), which matches `src/partials/caller-status-handling.md`.
4. The STATUS block from the subagent was passed back to the user text joined to the previous sentence in the final result (known from spike).
5. Contradictions with the plan: none. Plan line "every tsh-* skill appears once in `/`" can only be checked as "once in the model skill list" in the CLI, and only 46 of 62 are listed there by design (commands hidden from the model).
6. Real HOME: no `~/.tsh-ai-collections-backup`, `~/.agents`, `~/.codex` created; no `tsh-*` entries created under `~/.cursor` or `~/.claude`. cursor-agent itself created its own state at `~/.cursor/projects/private-tmp-tsh-smoke-cursor-*`.


## Smoke test: upgrade path (B1), all tools

Scratch dir: /private/tmp/upg2 (homes h1..h5 via TSH_HOME; old-clone = `git archive 324d2fd .cursor/skills`). Installer `scripts/install.mjs` at HEAD d9c7783. No model runs.
Old layout built exactly as the old README: `for d in old-clone/.cursor/skills/{agents,workflows,commands,internal}/*/; do ln -sf "$d" ~/.cursor/skills/; done` (83 symlinks). h1 additionally: tsh-architect replaced by an edited real copy, a copied category tree `.cursor/skills/workflows/tsh-writing-hooks`, dangling `tsh-code-reviewing` (target in a deleted clone), unrelated `my-skill`, dangling `.claude/skills/tsh-dangling-new`, unrelated `.claude/skills/my-claude-skill`.

| check | result | evidence / note |
|---|---|---|
| Dry-run (user scope, cursor,claude,codex) writes nothing | PASS | `find h1 proj` listing identical before/after; no `.agents`, no backup dir created; output "[dry-run] no changes will be made ... Legacy cleanup: 85 entries would be handled." |
| Dry-run (project scope) writes nothing | PASS | project tree listing identical; h3 (TSH_HOME) still empty |
| Real install user scope: no legacy/dangling tsh-* under ~/.cursor/skills | PASS | `find h1/.cursor/skills -name 'tsh-*'` empty; only `my-skill` and an empty `workflows/` remain |
| Copied dir backed up | PASS | `h1/.tsh-ai-collections-backup/2026-10-04T16-20-42-334Z/private/tmp/upg2/h1/.cursor/skills/tsh-architect` (user edit preserved) |
| Copied category tree backed up | PASS | same backup: `.../.cursor/skills/workflows/tsh-writing-hooks` |
| Unrelated skills untouched | PASS | my-skill sha1 identical (dbb33b91...), `.claude/skills/my-claude-skill` present; `.agents/skills/mine` survived `--migrate-legacy` in h4 |
| Dangling symlinks removed (old clone deleted) | PASS | h4: 83 of 83 symlinks dangling; `--migrate-legacy` -> "Legacy cleanup: 85 entries handled", `.cursor/skills` removed (was empty). Dangling `.claude/skills/tsh-dangling-new` removed (h1) |
| New-layout legacy entries | PASS | `.agents/skills/tsh-architect` (name in legacy-names.json) moved to backup; symlink `.claude/skills/tsh-oldlink` into old layout removed (h4) |
| Install results (user) | PASS | .agents/skills 62, .claude/skills 62, .cursor/agents 17, .claude/agents 17, .codex/agents 17; `.tsh-install-manifest.json` in all 5 roots (tools, mode, sourceCommit d9c7783, names) |
| Second run is a no-op | PASS (with note) | "Legacy cleanup: nothing to do."; file list and sha1 of every file in h1 identical, no new backup dir. Not silent: it re-copies every entry (mtime of tsh-commit changed) and logs each `copied` line |
| `--update` prunes removed skill/agent (--source temp copy) | PASS | src2 lacking skill tsh-ask and cursor agent tsh-ai-customization-reviewer: dry-run printed `would move ... (pruned: no longer in source)`, nothing changed; real run moved `.agents/skills/tsh-ask`, `.claude/skills/tsh-ask`, `.cursor/agents/tsh-ai-customization-reviewer.md` to a new backup dir; manifest no longer lists tsh-ask |
| Project scope: legacy project `.cursor/skills` | PASS | symlink, dangling symlink, copied `tsh-architect`, copied `commands/tsh-implement` handled ("4 entries handled"); `own` kept; backup in `<TSH_HOME>/.tsh-ai-collections-backup/...`; project got .agents/.claude/.cursor/.codex trees + 5 manifests; empty `commands/` left behind |
| Project-scope run also cleans home legacy | PASS (matches plan) | h5: `--scope project` removed `h5/.cursor/skills/tsh-ask` symlink |
| Manual equivalent in upgrading.md | PASS | h2: `find ... -maxdepth 1 -name 'tsh-*' -type l -delete` removed symlinks incl. dangling; moving real `tsh-architect` and `workflows/` by hand left only `own`; installer then printed "Legacy cleanup: nothing to do" and installed 62/62/17/17/17 |
| Real HOME untouched | PASS | no ~/.agents, ~/.codex, ~/.tsh-ai-collections-backup, ~/.cursor/skills, ~/.claude/skills. Only new `~/.cursor/projects/private-tmp-tsh-smoke-cursor-proj{,2}` appeared; from other parallel smoke agents, not this test |

### Findings
1. Backup layout: entries are stored under `<ts>/<full original absolute path>/` (e.g. `<ts>/private/tmp/.../tsh-architect`), not directly in `<ts>/`. Docs/plan say only "`~/.tsh-ai-collections-backup/<timestamp>/`"; worth one sentence in upgrading.md. Project-scope backups go to the home backup dir, not the project.
2. Empty category folders (`.cursor/skills/workflows/`, project `commands/`) remain after their tsh-* content is backed up. Cosmetic. (An empty `.cursor/skills` itself is removed.)
3. `--source` needs `<source>/scripts/legacy-names.json` (error: "Cannot read .../scripts/legacy-names.json"). `--help` only says "repo root holding the generated trees".
4. Second run is idempotent but rewrites everything; not a literal no-op.
5. Project-scope install also cleans legacy entries in the home dir (matches plan); upgrading.md could say so.
6. No contradiction with Task 2.7/N1/N3/N6. Not tested: `--mode link`, `--force`, EXDEV fallback.

Counts: PASS 14, FAIL 0, NOT TESTABLE 0.
