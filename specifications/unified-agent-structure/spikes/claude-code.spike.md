# Spike 1.2: Claude Code behavior

- **Claude Code version:** 2.1.274 (`claude --version`, and `claude_code_version` in every `system/init` event)
- **Date:** 2026-09-28
- **Model used for runs:** `--model sonnet`. The behavior under test is harness behavior, not model behavior.
- **Evidence types:** TESTED = observed in a CLI run (command and output excerpt below). DOCS = official docs (URL). UNVERIFIED = neither.

## Summary

| Q | Answer | Evidence | Impact on plan |
|---|---|---|---|
| 1 Hidden skills | Yes. A `user-invocable: false` skill loads by name through the Skill tool, both from the main thread and from inside a subagent. It is missing from the `/` list, and typing `/spike-hidden` runs nothing. | TESTED (runs 1, 2, 5) + DOCS | none (confirms D6) |
| 2 Preload | Yes. `skills: [spike-hidden]` injects the full body of a `user-invocable: false` skill at subagent startup, with 0 tool uses. | TESTED (run 3) + DOCS | none (confirms D2/D6) |
| 3 Tool deny-list | `disallowedTools: [Agent, Write, Edit, NotebookEdit, mcp__atlassian]` removes those tools. MCP tools from other servers stay available and callable. One server is disallowed with `mcp__<server>` or `mcp__<server>__*`; both forms were tested and remove all of that server's tools. | TESTED (runs 2, 6, 8) + DOCS | none. Caveat: see the DoD section on claude.ai connectors. |
| 4 Asking the user | No. `AskUserQuestion` is always removed from subagents, so a subagent can only return. Permission prompts still reach the user. | DOCS (+ TESTED absence, run 2) | none (confirms D5) |
| 5 Main-thread persona | `claude --agent <name>` runs the agent as the main thread, with its body as the system prompt, its tool restrictions and its model. CLAUDE.md/AGENTS.md still load. In-session direct syntax is `@agent-<name>` (or picking `@"name (agent)"` from the typeahead). This makes Claude pick that subagent, but it still runs as a subagent. | TESTED (`--agent`, runs 6-7) + DOCS (`@agent-`) | none |
| 6 Arguments | Yes. With no `$ARGUMENTS`/`$N`/named placeholder, Claude Code appends `ARGUMENTS: <input>` to the skill content. | TESTED (run 4) + DOCS | none (confirms D2) |
| 7 Symlinks | Yes, deduped. Two symlinked dirs pointing at one target produced one skill (`spike-shared`) in the skills list and the `/` list. | TESTED (runs 1, 3) + DOCS | none |
| 8 AGENTS.md import | Yes. A `CLAUDE.md` containing only `@AGENTS.md` loads AGENTS.md in the main thread, in a `--agent` persona and in subagents. | TESTED (runs 1, 6) + DOCS | none. Note: native AGENTS.md reading needs v2.1.277+, and this machine has 2.1.274, so the import is still needed here (see D8 note). |
| 9 Leaf enforcement | Yes. With `Agent` in `disallowedTools`, a subagent has no Agent tool (`ToolSearch select:Agent` returns "No matching deferred tools found"). The same file used via `claude --agent` works as a multi-turn main-thread persona. It also has no Agent tool there, because the restrictions apply to the main thread too. That is harmless for leaf agents. | TESTED (runs 2, 6, 7) + DOCS | none. Clarification: the deny-list also applies in persona mode (see details). |
| DoD `mcp__atlassian` | `disallowedTools: [..., mcp__atlassian]` removed the `atlassian` server's tools from the subagent, while the `other` server's tool still worked. Tested with a local fake stdio server named `atlassian`, not the real Atlassian server. | TESTED (fake server) + DOCS | minor deviation, recommended: add a claude.ai-connector note (tool names `mcp__claude_ai_<server>__*` are not matched by `mcp__atlassian`) |

**Deviations from D2/D5/D6:** none that change a decision. Two small additions are recommended for the Changelog and the Honest limits:

1. **claude.ai connectors.** `mcp__atlassian` only matches a server that is configured under the name `atlassian` (`.mcp.json` or `claude mcp add`). If a user connects Atlassian as a claude.ai connector, Claude Code names its tools `mcp__claude_ai_<server>__<tool>`, and the BA-worker deny does not match them. The exact server segment for the Atlassian connector is UNVERIFIED. The fix is to either document that the BA workers assume the generated `.mcp.json` name `atlassian`, or also emit `mcp__claude_ai_Atlassian` once the name is verified.
2. **Persona mode inherits `disallowedTools`.** `claude --agent tsh-<read-only-agent>` cannot Write/Edit in the main thread either. It also cannot spawn subagents, which is consistent with D5 because leaf agents never delegate. Document this in Task 4.2.

## Fixture

- **Path:** `/tmp/cc12-claude-spike/`, a git-initialized scratch dir outside the repo.
  - The originally requested `/tmp/tsh-spike-claude/` was deleted mid-spike by a concurrent process, most likely another spike cleaning `/tmp/tsh-spike-*`. The fixture was recreated under a non-colliding name.
  - Runs 1-2 ran in the original path with an identical fixture. Their logs were lost with it; the excerpts below were captured before the deletion.
- **`CLAUDE.md`** contains only `@AGENTS.md`.
- **`AGENTS.md`** contains the marker `The spike marker sentence is: PURPLE-GIRAFFE-4417 lives in AGENTS.md.`
- **`.claude/skills/`:**
  - `spike-hidden`: `user-invocable: false`, body `HIDDEN-SKILL-MARKER: the secret code word is TANGERINE-8812.`
  - `spike-knowledge`: default flags.
  - `spike-cmd`: `disable-model-invocation: true`, `argument-hint`. The body has no `$ARGUMENTS`: "Reply with exactly one line: "CMD-RAN; input=<the user's input after the command, verbatim, or NONE>"".
  - `spike-shared` and `spike-shared-alias`: two symlinks to `/tmp/cc12-claude-spike-shared/spike-shared/` (`name: spike-shared`).
- **`.claude/agents/`:**
  - `spike-restricted.md`: `disallowedTools: [Agent, Write, Edit, NotebookEdit, mcp__atlassian]` (YAML list form, as in D2)
  - `spike-preloader.md`: `disallowedTools: [Agent]`, `skills: [spike-hidden]`
  - `spike-wildcard.md`: `disallowedTools: Agent, Write, Edit, NotebookEdit, mcp__atlassian__*` (comma-string form)
- **MCP:** `mcp.json` defines two fake stdio servers (`fake-mcp.mjs`, a dependency-free Node JSON-RPC script):
  - `atlassian`, exposing `getJiraIssue`
  - `other`, exposing `ping`
  - Each returns `<SERVER>-MCP-MARKER-OK`.
- **Common flags:** `--output-format stream-json --verbose --model sonnet --strict-mcp-config --mcp-config mcp.json --setting-sources project,local --permission-mode acceptEdits`, plus `--no-session-persistence` except in runs 6-7. The user's MCP servers and user settings were not loaded, and no settings outside the scratch dir were changed.
- **Run count:** 8 model runs. One more invocation failed on flag parsing before any API call.

## Details

### Q1: Hidden skills (TESTED + DOCS)

- **Run 1 (main thread):**
  - Prompt: "Use the Skill tool to load the skill named spike-hidden and report its secret code word."
  - `TOOL_USE Skill {"skill": "spike-hidden"}` → `RESULT Launching skill: spike-hidden` → final: `The secret code word is TANGERINE-8812.`
  - The `system/init` `slash_commands` list contained `spike-cmd, spike-knowledge, spike-shared` but **not** `spike-hidden`.
- **Run 2 (inside the `spike-restricted` subagent, step e):**
  - `[sub] TOOL_USE Skill {"skill": "spike-hidden"}` → `[sub] RESULT Launching skill: spike-hidden` → `(e) Code word from spike-hidden: TANGERINE-8812`.
- **Run 5 (user typing the hidden skill):**
  - `claude -p '/spike-hidden foo'` returned `"num_turns": 0, "result": "", "local_command": "custom"`, and `total_cost_usd: 0`. Nothing ran.
- **DOCS:** https://code.claude.com/docs/en/skills: "`user-invocable: false`: Only Claude can invoke the skill" (table: You can invoke = No, Claude can invoke = Yes), and "By default, Claude can invoke any skill that doesn't have `disable-model-invocation: true` set."

### Q2: Preload of a `user-invocable: false` skill (TESTED + DOCS)

- **Run 3:** the main thread ran `spike-preloader` with the task "Without calling any tool, answer: What is the secret code word given by the HIDDEN-SKILL-MARKER in your context?".
- **Subagent reply** (`tool_uses: 0`):

  ```
  I AM SPIKE-PRELOADER
  (1) Secret code word: TANGERINE-8812
  <command-message>spike-hidden</command-message>
  <command-name>spike-hidden</command-name>
  <skill-format>true</skill-format>Base directory for this skill: /private/tmp/cc12-claude-spike/.claude/skills/spike-hidden
  HIDDEN-SKILL-MARKER: the secret code word is TANGERINE-8812.
  ```

- **DOCS:** https://code.claude.com/docs/en/sub-agents: "The full content of each listed skill is injected into the subagent's context at startup", and "You can't preload skills that set `disable-model-invocation: true`". Only that flag blocks preload; `user-invocable` does not.

### Q3: Tool deny-list and MCP (TESTED + DOCS)

- **Run 2:** the main thread delegated to `spike-restricted` in the foreground. The subagent reported:
  - (a) its tools: `Bash, ListAgents, Read, ReportFindings, Skill, ToolSearch`, plus deferred MCP tools
  - (b) `WRITE UNAVAILABLE`; the file `restricted-was-here.txt` was not created
  - (c) `[sub] TOOL_USE mcp__other__ping {}` → `[sub] RESULT ... 'OTHER-MCP-MARKER-OK'`
  - (d) `[sub] TOOL_USE ToolSearch {"query": "select:mcp__atlassian__getJiraIssue"}` → `No matching deferred tools found` → `ATLASSIAN UNAVAILABLE`
  - The main thread in the same session had both `mcp__atlassian__getJiraIssue` and `mcp__other__ping`, and `Write`/`Edit`/`NotebookEdit`, in its `init` tools. So the removal came from the agent file only.
- **Run 6** (`--agent spike-restricted`, main-thread persona):
  - `init` tools = `Bash, CronCreate, CronDelete, CronList, EnterWorktree, ExitWorktree, ListAgents, Read, ReportFindings, ScheduleWakeup, SendMessage, Skill, TaskOutput, TaskStop, TodoWrite, ToolSearch, WebFetch, Workflow, mcp__other__ping`.
  - No `Task`/`Agent`, no `Write`/`Edit`/`NotebookEdit`, no `mcp__atlassian__*`.
- **Run 8** (`--agent spike-wildcard`, comma-string plus `mcp__atlassian__*`): identical `init` tool list to run 6. Both the YAML-list and comma-string forms work, and `mcp__atlassian` is equivalent to `mcp__atlassian__*`.
- **DOCS:** https://code.claude.com/docs/en/sub-agents: "Both fields accept MCP server-level patterns in addition to exact tool names: `mcp__<server>` or `mcp__<server>__*` grants or removes every tool from the named server. In `disallowedTools`, `mcp__*` also removes every MCP tool from any server." The example given is `disallowedTools: mcp__github`. Also: "`disallowedTools: Write, Edit` ... The subagent keeps Bash, MCP tools, and the rest of its pool."

### DoD: `mcp__atlassian` deny for the BA workers

- **Confirmed (TESTED with a fake stdio server named `atlassian`; DOCS for the syntax):** `mcp__atlassian` in `disallowedTools` blocks every tool of a server configured as `atlassian` inside a subagent. Other MCP servers stay available.
- **Not tested against the real Atlassian MCP server.** That server needs OAuth and must not be touched per the spike rules. The matching is by server name, so the real server behaves the same as long as it is registered as `atlassian`, which is what the generated `.mcp.json` does.
- **Caveat (DOCS, https://code.claude.com/docs/en/permissions):** "Tools from connectors Claude Code fetches itself appear as `mcp__claude_ai_<server>__<tool>`." A claude.ai Atlassian connector would **not** be matched by `mcp__atlassian`. The exact `<server>` segment for that connector is UNVERIFIED.

### Q4: Can a subagent ask the user? (DOCS, absence TESTED)

- **DOCS:** https://code.claude.com/docs/en/sub-agents lists what "The first filter removes ... even when listed in the `tools` field": `Agent` (at the depth limit), **`AskUserQuestion`**, `EndConversation`, `EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`), `ScheduleWakeup`, `WaitForMcpServers`, `Workflow`.
  - Permission prompts do still reach the user: "Foreground subagents ... Permission prompts are passed through to you", and background subagents surface prompts in the main session.
  - Also: in an interactive session, fork mode is on by default and subagents run in the background. With `-p`, fork mode is off.
- **Run 2 (g):** "I do not have a tool named AskUserQuestion". This is weak evidence, because `-p` sessions have no AskUserQuestion in the main thread either.
- **Conclusion:** a subagent can only return, which confirms D5's delegated-mode `NEEDS_INPUT` round-trip. The first filter applies to subagents only. A `claude --agent` persona is the main thread, so it keeps AskUserQuestion in interactive sessions. This follows from the docs; the interactive case was not tested.

### Q5: Main-thread persona and direct-invocation syntax (TESTED + DOCS)

- **Run 6:** `claude --agent spike-restricted -p 'Turn 1. Remember the number 7719 ... (a) what is the spike marker sentence ...'`. The reply started with `I AM SPIKE-RESTRICTED` (from the agent body, i.e. the persona is active) and answered `PURPLE-GIRAFFE-4417 lives in AGENTS.md.` (CLAUDE.md/AGENTS.md still load).
- **Run 7:** `claude --agent spike-restricted -p 'Turn 2. What number did I ask you to remember in turn 1? ...' --resume <session>` → `I AM SPIKE-RESTRICTED ... The number you asked me to remember in turn 1 was 7719.` So a multi-turn conversation works.
- **DOCS:** https://code.claude.com/docs/en/sub-agents:
  - "Pass `--agent <name>` to start a session where the main thread itself takes on that subagent's system prompt, tool restrictions, and model". The body replaces the default system prompt. The `agent` key in `.claude/settings.json` sets a per-project default.
  - In-session: "type the mention manually without using the picker: `@agent-<name>` for local subagents". The typeahead form is `@"code-reviewer (agent)"`. "The @-mention controls which subagent Claude invokes, not what prompt it receives." This runs a subagent, not the main thread, so it is delegated-style: no AskUserQuestion, one returned result.
- **Plan wording for Task 4.2:** use `claude --agent tsh-<role>` for a conversational persona. `@agent-tsh-<role>` means "run this subagent once".

### Q6: Arguments without `$ARGUMENTS` (TESTED + DOCS)

- **Run 4:** `claude -p '/spike-cmd hello world 42'` gave the final result `CMD-RAN; input=hello world 42`. The model's reasoning in the transcript: "The arguments provided are: hello world 42".
- **DOCS:** https://code.claude.com/docs/en/skills: "If you invoke a skill with arguments but no placeholder in the skill's content receives one, Claude Code appends `ARGUMENTS: <your input>` to the end of the skill content".

### Q7: Symlinked skill dirs (TESTED + DOCS)

- **Runs 1 and 3:** `.claude/skills/spike-shared` and `.claude/skills/spike-shared-alias` both symlink to the same external dir. `init.skills` and `slash_commands` each contained `spike-shared` exactly once, and no `spike-shared-alias`.
  - Not separated: dedupe by target versus by `name`, since both links resolve to the same `SKILL.md`.
- **DOCS:** https://code.claude.com/docs/en/skills: "a `<skill-name>` entry in the enterprise, personal, or project location can be a symlink to a directory elsewhere on disk. Claude Code reads `SKILL.md` from the target and loads the skill once even if several locations point at the same target."
- **Relevance:** the Claude side of `--mode link` (D3) is safe. Whether that mode ships still depends on spike 1.1(b) (Cursor).

### Q8: `CLAUDE.md` → `@AGENTS.md` (TESTED + DOCS)

- **Run 1** (main thread, no tools): `(1) PURPLE-GIRAFFE-4417 lives in AGENTS.md.`
- **Run 6** (`--agent` persona): same marker.
- **DOCS:** https://code.claude.com/docs/en/memory:
  - "CLAUDE.md files can import additional files using `@path/to/import` syntax."
  - Table row: "A `CLAUDE.md` that already imports `AGENTS.md` → Your `CLAUDE.md`, with `AGENTS.md` included through the import."
  - "Reading `AGENTS.md` directly requires Claude Code v2.1.277 or later". Also, on the first session after upgrading from ≤2.1.276, native reading may not apply yet.
- **Note for D8:** the D8 fallback (delete `CLAUDE.md`) only works for users on v2.1.277 or later. The installed 2.1.274 here would lose AGENTS.md entirely. So keeping `CLAUDE.md` = `@AGENTS.md` (the D8 default) is the safer choice. With both files present, the default `claude-md-or-agents-md` mode reads CLAUDE.md only, so the import causes no double load.

### Q9: Leaf enforcement (TESTED + DOCS)

- **Run 2 (subagent, step f):** `[sub] TOOL_USE ToolSearch {"query": "select:Agent"}` → `No matching deferred tools found` → `AGENT UNAVAILABLE`. No nested spawn happened.
- **Run 6 (same file via `--agent`):** `init` tools contain no `Task`/`Agent`. The persona answered `(b) AGENT UNAVAILABLE`, and the session continued normally over 2 turns (run 7).
  - So the file works as an interactive main-thread persona.
  - However, `Agent` in `disallowedTools` is **not** only "denied for spawning when a subagent". It removes the Agent tool from the main thread too when the file is used with `--agent`.
  - For D5's leaf agents this is the intended behavior: they never delegate in either mode.
- **DOCS:** https://code.claude.com/docs/en/sub-agents: "To keep one subagent from spawning while nesting is on ... omit `Agent` from its `tools` list or add it to `disallowedTools`." `--agent` "takes on that subagent's system prompt, tool restrictions, and model". The default nesting depth is 3 (v2.1.219+), and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` turns it off globally.

## Leftovers

- `/tmp/cc12-claude-spike/` and `/tmp/cc12-claude-spike-shared/` hold the fixture and the `out/run03`-`run08` JSONL logs.
- Runs 6-7 persisted one session under `~/.claude/projects/-private-tmp-cc12-claude-spike/`. That is session data, not settings.
