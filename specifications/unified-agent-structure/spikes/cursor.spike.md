# Spike 1.1: Cursor discovery and compatibility

| Field | Value |
|---|---|
| Cursor version (Help → About) | IDE: manual run, version not recorded (2026-10-04) |
| `cursor-agent --version` (if used) | 2026.10.01-14929f9 (headless, logged in, Pro, model Auto; `agent update` offers 2026.10.01-e373342, not applied) |
| OS + version | macOS, Darwin 25.6.0 (arm64) |
| Date | 2026-10-04 |
| Tester | Konrad (IDE, manual) · Claude Sonnet 5.5 (headless `cursor-agent`) |

**Setup.** Build one fixture per variant outside the repo, then open `<dir>/project` as the Cursor workspace (Agent mode, new chat per question):

```bash
K=specifications/unified-agent-structure/spikes/make-fixture.sh
bash $K /tmp/tsh-spike-copies --legacy          # default: copies, mcpServers
bash $K /tmp/tsh-spike-symlinks --variant symlinks
bash $K /tmp/tsh-spike-differing --variant differing --cursor-mcp servers
```

Markers: skills `SKILL-KNOWLEDGE-M1` (Claude-tree variant `-CLAUDE-VARIANT-M2`), `SKILL-INTERNAL-M3`, `SKILL-COMMAND-M4`, `SKILL-LOADER-M5`, `SKILL-DELEGATE-M6`, `.claude`-only skill `SKILL-CLAUDE-ONLY-M7`; agents `AGENT-CE-CURSOR-A1` / `AGENT-CE-CLAUDE-A3` (name clash), `AGENT-ARCH-CURSOR-A2`, `.claude`-only `AGENT-CLAUDE-ONLY-A5`; codeword `AGENTS-MD-MARKER-7Q4`; MCP `MCP-MARKER-5T2`. Every agent reply starts with `FIRST-LINE-ECHO:` and `AGENT-MARKER:`.

**Phase 2 impact.** BLOCKING = changes generated output (Q1, Q2, Q10, Q11). All others are informational (docs, installer, smoke tests).

**Outcome summary** (DoD): skills-tree strategy: keep both trees; Cursor dedupes by name and prefers `.claude/skills` (headless, 3 variants) · CLAUDE.md strategy: D8 default (`@AGENTS.md` import, codeword seen once headless) · `--mode link` ships (Q1b): yes (symlinks load) · `inlinePreload: ["cursor"]` (Q10): no (subagent loaded the skill, headless 4/4)

**Headless method (2026-10-04).** `cursor-agent -p --trust --force [--approve-mcps] [--output-format stream-json] --workspace /private/tmp/tsh-cs-<copies|symlinks|differing>/project "<prompt>"`, model Auto, fixtures from `make-fixture.sh` (`copies --legacy`, `symlinks`, `differing --cursor-mcp servers`). `--approve-mcps` was used only in the two Q5 runs (local spike server; other configured servers were not called). About 25 model runs. Caveats: (1) real `$HOME` was used, so user-level Cursor/Claude plugin skills (superpowers, datadog) also appear in listings; (2) print mode has no Settings, `/` menu, Output logs or agents picker; (3) counts and paths are mostly model-reported from its context, but tool traces in `stream-json` confirm Q7, Q8 and Q11; (4) `/name` in print mode works and is wrapped as `The user invoked /<name> with the message: "..."`.

---

### Q1. Duplicate skills (R-OQ1, R-OQ2) — BLOCKING

- **Steps:** in each fixture type `/tsh-spike` in chat; also check Cursor Settings → Rules/Skills. In `differing`, ask: `Load the tsh-spike-knowledge skill and print its marker.`
- **Observe:** number of `tsh-spike-knowledge` entries per variant; in (b) whether symlinked entries appear and load; in (c) which marker (M1 = `.agents`, M2 = `.claude`) wins, and whether both are listed.
- **Expected (plan default):** (a) one entry, or two identical entries (acceptable); (b) symlinks listed and loadable; (c) informational only.
- **Fallback:** (a) confusing duplicates → docs tell users of Cursor + Claude + Codex to turn off the third-party toggle (Q6); (b) broken/ignored → `--mode link` is not shipped.
- **Result / Evidence:** (a) PARTIAL (2026-10-04, `copies` only): `SKILLS-VISIBLE` seen by a subagent lists `tsh-spike-knowledge` once, although it exists in both `.agents/skills` and `.claude/skills`; it loaded from the `.claude/skills` path. The `/` menu and Settings count were not checked. (b) PARTIAL (2026-10-04, `symlinks`): `/tsh-spike` resolved to `tsh-spike-command` and ran (`COMMAND-MARKER: SKILL-COMMAND-M4`) while `.claude/skills/*` are symlinks to `../../.agents/skills/*`, so symlinked skills load. Typing `/tsh-spike` executes the command instead of listing entries, The agent then reported exactly ONE `tsh-spike-knowledge` entry in `<available_skills>`, registered under the `.claude/skills/...` path (the symlink), not `.agents/skills/...`. So Cursor dedupes by name here and appears to prefer `.claude/skills`; symlinks work on macOS (model-reported). (c) PASS (2026-10-04, `differing`): the skill loaded with `SKILL-KNOWLEDGE-CLAUDE-VARIANT-M2`, i.e. the `.claude/skills` copy wins over `.agents/skills` on a same-name clash (model-reported; entry count not measured in this variant).

**Headless (TESTED, cursor-agent 2026.10.01-14929f9, prompt "List every entry named tsh-spike-knowledge in your available skills list with its registered path"):** `copies`: 1 entry, `.claude/skills/tsh-spike-knowledge/SKILL.md`. `symlinks`: 1 entry, `.claude/skills/...` (the symlink path), and `/tsh-spike-command hello` ran. `differing`: 1 entry, `.claude/skills/...`, loaded marker `SKILL-KNOWLEDGE-CLAUDE-VARIANT-M2`. **Agrees with the manual results** (dedupe by name, `.claude/skills` wins, symlinks work). Still not measured: `/` menu and Settings counts (IDE only).

### Q2. Unknown frontmatter keys (R-OQ3) — BLOCKING

- **Steps:** in `copies`, check Settings → Rules/Skills and View → Output (Cursor logs) for warnings; type `/tsh-spike-`; run `/tsh-spike-command hello` and `/tsh-spike-loader`.
- **Observe:** errors/warnings on `user-invocable`, `argument-hint`, `compatibility`, `metadata.short-description`; whether `tsh-spike-internal` (`user-invocable: false`) shows in `/` (expected: yes, D6); whether `argument-hint` is shown.
- **Expected:** all keys tolerated, all skills load.
- **Fallback:** split renderings: Claude-only keys go only into `.claude/skills` (D2, `render-skills.mjs`); record in the Changelog.
- **Result / Evidence:** PARTIAL (2026-10-04, `copies`): `/tsh-spike-command hello` ran and returned `COMMAND-MARKER: SKILL-COMMAND-M4` and `ARGS-RECEIVED: hello`; the subagent saw `tsh-spike-internal` (`user-invocable: false`) and loaded `tsh-spike-knowledge`. No load error reported. NOT CHECKED: View → Output warnings, whether `tsh-spike-internal` shows in `/`, `argument-hint` display.

**Headless (TESTED, `copies`):** `/tsh-spike-command hello` -> `COMMAND-MARKER: SKILL-COMMAND-M4` / `ARGS-RECEIVED: hello`; `/tsh-spike-loader` and `/tsh-spike-delegate` ran; `tsh-spike-internal` (`user-invocable: false`) is in the model's skill list (registered under `.claude/skills`) and loaded by the loader. No error or warning appeared in stdout/stderr for `user-invocable`, `argument-hint`, `compatibility`, `metadata`. Skills with `disable-model-invocation: true` (command, loader, delegate) are absent from the model's list but reachable via `/name`. NOT TESTABLE headlessly: Output-log warnings, whether `tsh-spike-internal` shows in the `/` menu, `argument-hint` display.

### Q3. `.codex/agents/*.toml` (R-OQ6) — informational

- **Steps:** open the agents list (Settings → Agents / subagent picker) and the Output logs.
- **Observe:** errors about TOML; phantom agents such as `tsh_spike_context_engineer` or `tsh-spike-fast` (they exist only in `.codex`).
- **Expected:** ignored silently.
- **Fallback:** document the noise; if it is harmful, the installer skips `.codex/agents` for Cursor-only installs.
- **Result / Evidence:** **Headless (TESTED, `copies`):** subagent list = Cursor built-ins + `tsh-spike-architect`, `tsh-spike-context-engineer`, `tsh-spike-claude-only`. No `tsh_spike_context_engineer`, no `tsh-spike-fast` (the `.codex`-only agents), no TOML error on stdout/stderr. `.codex/agents` is ignored. (Output-log and picker not checked.)

### Q4. `@AGENTS.md` in CLAUDE.md (R-OQ4) — informational

- **Steps:** ask `What is the spike codeword? Quote every passage in your context that contains it and say how many times it appears.` Check the context/rules indicator of the chat.
- **Observe:** codeword found; seen once or twice; whether CLAUDE.md is listed as applied.
- **Expected:** found; once or twice (both acceptable, D8).
- **Fallback:** if duplication causes real problems, delete `CLAUDE.md` (D8).
- **Result / Evidence:** **Headless (TESTED, `copies`, root `CLAUDE.md` = `@AGENTS.md`):** codeword `AGENTS-MD-MARKER-7Q4` found; the model quoted one passage and said it appears **1** time. Consistent with D8 default; CLAUDE.md applied-indicator not visible headlessly.

### Q5. MCP `servers` key — informational

- **Steps:** in `differing` (`servers`) and `copies` (`mcpServers`) open Settings → MCP; ask `Call the spike_marker tool and print its result.`
- **Observe:** whether `tsh.spike-marker` is listed/connected and returns `MCP-MARKER-5T2`. (No root `.mcp.json` exists on purpose.)
- **Expected:** `servers` does not load; `mcpServers` loads. The fix ships either way.
- **Fallback:** none.
- **Result / Evidence:**

**Headless (TESTED, `--approve-mcps`, local spike server only):** `mcpServers` (`copies`): `cursor-agent mcp list` shows `tsh.spike-marker` and the tool call returned `MCP-MARKER-5T2`. `servers` (`differing`): not in `mcp list`, and the agent reports no `tsh.spike-marker` server (only `cursor`, datadog namespaces). **Matches the expected result**: `servers` does not load, `mcpServers` does. Without `--approve-mcps` the server shows `not loaded (needs approval)`.

### Q6. "Include Third-Party Plugins, Skills, and Other Configs" — informational

- **Steps:** in `copies`, toggle the setting ON then OFF (reload window each time). Each time: type `/tsh-spike`, open the agents list, send any prompt, ask for the codeword, then run `ls project/.spike-claude-hook-fired`.
- **Observe:** ON vs OFF: `tsh-spike-claude-only` skill (M7), `tsh-spike-claude-only` agent (A5), CLAUDE.md applied, Claude hook file created, which `tsh-spike-context-engineer` marker wins (A1 vs A3).
- **Expected:** OFF hides all `.claude/*` items; `.agents/skills` and `.cursor/agents` still load; `.cursor` agent (A1) wins when ON.
- **Fallback:** adjust the installer tree table and docs (D2).
- **Result / Evidence:**

**NOT TESTABLE headlessly:** the toggle is an IDE setting; the CLI has no equivalent flag. Observation only: in print mode `.claude/skills`, `.claude/agents` (`tsh-spike-claude-only` agent and skill) were loaded, and `.spike-claude-hook-fired` was NOT created (Claude hooks from `.claude/settings.json` are not run by cursor-agent).

### Q7. Direct subagent invocation syntax — informational

- **Steps:** try in turn: `/tsh-spike-architect hi`, `@tsh-spike-architect hi`, `Use the tsh-spike-architect subagent: hi`.
- **Observe:** which form runs the custom subagent (reply shows `AGENT-MARKER: AGENT-ARCH-CURSOR-A2`).
- **Expected:** `/name` works (per D5 examples).
- **Fallback:** document the working form in Task 4.2.
- **Result / Evidence:** **Headless (TESTED, stream-json tool trace):** all three forms spawn the custom subagent, trace `subagentType: {custom: {name: tsh-spike-architect}}` and reply `AGENT-MARKER: AGENT-ARCH-CURSOR-A2`: `/tsh-spike-architect hi`, `@tsh-spike-architect hi`, `Use the tsh-spike-architect subagent: hi`. With `/name` the subagent's `FIRST-LINE-ECHO` is not `hi` but `The user invoked /tsh-spike-architect with the message: "hi"` (the main agent rewrites the task). For an explicit prompt the subagent received only the task text (`report your markers.`), without the `Use the ... subagent` prefix.

### Q8. Main-thread loading by name — informational

- **Steps:** run `/tsh-spike-loader`.
- **Observe:** `SKILL-LOADED: SKILL-KNOWLEDGE-M1`, `INTERNAL-LOADED: SKILL-INTERNAL-M3`, and `LOAD-METHOD` (and whether the tool trace shows a skill load or a raw file read).
- **Expected:** both load by name.
- **Fallback:** if loading by name fails, stop Phase 2 and revisit D6 (path refs are banned).
- **Result / Evidence:** **Headless (TESTED, stream-json):** `/tsh-spike-loader` printed `SKILL-LOADED: SKILL-KNOWLEDGE-M1`, `INTERNAL-LOADED: SKILL-INTERNAL-M3`, `LOAD-METHOD: file read`. The trace shows no skill tool: the main agent ran `glob **/tsh-spike-*/**`, a grep, and then `read` of `.claude/skills/tsh-spike-{knowledge,internal}/SKILL.md`. So in the CLI "load by name" works but is implemented as a path discovery plus file read (a skill with the same name elsewhere could be read instead). Both skills loaded. The IDE may use a real skill tool (not checked).

### Q9. GitHub import (Remote Rule) — informational

- **Steps:** push `project/` to a throwaway private GitHub repo. In a different empty workspace: Settings → Rules → Add Remote Rule (GitHub) → that repo. Type `/tsh-spike`, open the agents list, ask for the codeword.
- **Observe:** which of `.agents/skills`, `.cursor/agents`, `AGENTS.md` arrive.
- **Expected:** unknown.
- **Fallback:** if skills and agents are not imported, remove GitHub import from the docs (D3).
- **Result / Evidence:** **NOT TESTABLE headlessly:** Remote Rule (GitHub) import is an IDE setting; the CLI exposes no equivalent (`cursor-agent plugin` manages plugins/marketplaces, which is a different mechanism and was not tried).

### Q10. Skills inside a subagent (M4) — BLOCKING

- **Steps:** `Use the tsh-spike-context-engineer subagent with this task: report your markers.`
- **Observe:** `SKILL-LOADED: SKILL-KNOWLEDGE-M1` (not NONE) and the `SKILLS-VISIBLE` list.
- **Expected:** the subagent loads the skill by name.
- **Fallback:** add `"inlinePreload": ["cursor"]` to `src/config/targets.json` (D2).
- **Result / Evidence:** PASS, 1 run (2026-10-04): `SKILL-LOADED: SKILL-KNOWLEDGE-M1`, `SKILLS-VISIBLE` includes `tsh-spike-knowledge`, `tsh-spike-internal`, `tsh-spike-claude-only`. Caveat: this is the subagent's own report. Decision: no `inlinePreload` for Cursor unless a smoke test contradicts it.

**Headless re-run (TESTED, 4 runs: 1 direct prompt + 3 via `/tsh-spike-delegate`):** 4/4 `SKILL-LOADED: SKILL-KNOWLEDGE-M1`, `SKILLS-VISIBLE` includes `tsh-spike-knowledge`, `tsh-spike-internal`, `tsh-spike-claude-only`. **Agrees with the manual PASS**; decision stands (no `inlinePreload`).

### Q11. Named handoff with `MODE: delegated` (M4) — BLOCKING

- **Steps:** run `/tsh-spike-delegate` 3 times (new chat each).
- **Observe:** the spawned subagent's name in the UI; `AGENT-MARKER: AGENT-CE-CURSOR-A1` (not a generic agent, not A3); `FIRST-LINE-ECHO: MODE: delegated` exactly; a `STATUS: DONE` block and no question.
- **Expected:** 3/3 named spawns, prompt verbatim.
- **Fallback (not fixed in the plan, decide here):** unreliable naming → strengthen the `caller-status-handling` wording (explicit subagent name/type); first line altered → loosen `agent-modes` detection (for example `MODE: delegated` on any of the first lines). Record in the Changelog.
- **Result / Evidence:** run 1 PASS (2026-10-04): subagent `tsh-spike-context-engineer` spawned by name, `AGENT-MARKER: AGENT-CE-CURSOR-A1` (not A3), `FIRST-LINE-ECHO: MODE: delegated`, `STATUS: DONE`, no question. run 2 PASS, run 3 PASS (2026-10-04): same result each time (A1 marker, `FIRST-LINE-ECHO: MODE: delegated` verbatim, `STATUS: DONE`, no question). **3/3.** Note: the STATUS block is printed on one line (`STATUS: DONE SUMMARY: ...`), so the `caller-status-handling` parser must not depend on line breaks.

**Headless re-run (TESTED, stream-json, 3 runs of `/tsh-spike-delegate`):** 3/3 trace `subagentType: {custom: {name: tsh-spike-context-engineer}}`, `AGENT-MARKER: AGENT-CE-CURSOR-A1` (never A3), `FIRST-LINE-ECHO: MODE: delegated` verbatim, `STATUS: DONE` + `SUMMARY:` in a fenced block, no question. **Agrees with the manual 3/3.** Extra observation: the subagent's output is prefixed by a progress sentence glued to the first marker line (`Wczytuję skill ... markery.FIRST-LINE-ECHO: ...`), so `MODE: delegated` detection and the STATUS parser must not assume the reply starts at a line boundary. Also in the direct run `Use the tsh-spike-context-engineer subagent with this task: report your markers.` the subagent received only `report your markers.` and, lacking `MODE: delegated`, asked `Which colour should I use?` (interactive branch).

### Q12. Interactive direct use (M3) — informational

- **Steps:** invoke `tsh-spike-architect` directly with the form from Q7 and task `hi`. When it asks "Which colour should I use?", answer `blue`.
- **Observe:** whether `INTERACTIVE-TURN-2: blue (AGENT-ARCH-CURSOR-A2)` comes from the same subagent, or the main agent answers / the subagent had already returned.
- **Expected:** unknown; either outcome is handled.
- **Fallback:** document the limitation in `supported-tools.md`; consultative use goes through `/tsh-ask` (D5).
- **Result / Evidence:** **Headless (TESTED, partial):** `/tsh-spike-architect hi` -> subagent replied with markers and `Which colour should I use?` and the turn ended. Next, `cursor-agent -p --continue "blue"` answered `INTERACTIVE-TURN-2: blue (AGENT-ARCH-CURSOR-A2)`, with a `subagentType: tsh-spike-architect` task in the trace, i.e. the architect answered (a new or resumed spawn, which stream-json does not distinguish). In print mode a direct subagent call is a single return to the main agent, then the user answers in a new turn; whether the IDE keeps the subagent attached was not shown. Consistent with D5: consultative use through `/tsh-ask`.

### Q13. Legacy dangling symlinks (B1) — informational

- **Steps:** in `copies` (built with `--legacy`), `project/.cursor/skills/tsh-spike-legacy-workflow` is dangling. Type `/tsh-spike-legacy` and check Output logs. For the user-level case, either start Cursor with the fake home (`HOME=/tmp/tsh-spike-copies/fake-home /Applications/Cursor.app/Contents/MacOS/Cursor /tmp/tsh-spike-copies/project`, may require login) or, at your own discretion, copy the two links from `fake-home/.cursor/skills/` into `~/.cursor/skills/` and delete them afterwards.
- **Observe:** errors, warnings or ghost `tsh-spike-legacy-*` entries.
- **Expected:** errors or ghost entries (confirms the installer cleanup); silent ignore is also fine.
- **Fallback:** none; cleanup ships either way.
- **Result / Evidence:**

**project-level (TESTED, `copies --legacy`):** dangling `project/.cursor/skills/tsh-spike-legacy-workflow` produced no error or warning on stdout/stderr and no ghost `tsh-spike-legacy-*` entry in the skill or subagent list; silent ignore. **user-level: NOT TESTABLE headlessly:** the CLI has no env/config to relocate its config dir, and starting it with `HOME=fake-home` would drop the login (credentials were not touched); the real `~/.cursor` was not modified. Installer cleanup ships either way.