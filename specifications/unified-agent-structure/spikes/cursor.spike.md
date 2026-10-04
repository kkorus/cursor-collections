# Spike 1.1: Cursor discovery and compatibility

| Field | Value |
|---|---|
| Cursor version (Help → About) | |
| `cursor-agent --version` (if used) | |
| OS + version | |
| Date | |
| Tester | |

**Setup.** Build one fixture per variant outside the repo, then open `<dir>/project` as the Cursor workspace (Agent mode, new chat per question):

```bash
K=specifications/unified-agent-structure/spikes/make-fixture.sh
bash $K /tmp/tsh-spike-copies --legacy          # default: copies, mcpServers
bash $K /tmp/tsh-spike-symlinks --variant symlinks
bash $K /tmp/tsh-spike-differing --variant differing --cursor-mcp servers
```

Markers: skills `SKILL-KNOWLEDGE-M1` (Claude-tree variant `-CLAUDE-VARIANT-M2`), `SKILL-INTERNAL-M3`, `SKILL-COMMAND-M4`, `SKILL-LOADER-M5`, `SKILL-DELEGATE-M6`, `.claude`-only skill `SKILL-CLAUDE-ONLY-M7`; agents `AGENT-CE-CURSOR-A1` / `AGENT-CE-CLAUDE-A3` (name clash), `AGENT-ARCH-CURSOR-A2`, `.claude`-only `AGENT-CLAUDE-ONLY-A5`; codeword `AGENTS-MD-MARKER-7Q4`; MCP `MCP-MARKER-5T2`. Every agent reply starts with `FIRST-LINE-ECHO:` and `AGENT-MARKER:`.

**Phase 2 impact.** BLOCKING = changes generated output (Q1, Q2, Q10, Q11). All others are informational (docs, installer, smoke tests).

**Outcome summary** (DoD): skills-tree strategy: ___ · CLAUDE.md strategy (D8 default / delete CLAUDE.md): ___ · `--mode link` ships (Q1b): yes/no · `inlinePreload: ["cursor"]` (Q10): yes/no

---

### Q1. Duplicate skills (R-OQ1, R-OQ2) — BLOCKING

- **Steps:** in each fixture type `/tsh-spike` in chat; also check Cursor Settings → Rules/Skills. In `differing`, ask: `Load the tsh-spike-knowledge skill and print its marker.`
- **Observe:** number of `tsh-spike-knowledge` entries per variant; in (b) whether symlinked entries appear and load; in (c) which marker (M1 = `.agents`, M2 = `.claude`) wins, and whether both are listed.
- **Expected (plan default):** (a) one entry, or two identical entries (acceptable); (b) symlinks listed and loadable; (c) informational only.
- **Fallback:** (a) confusing duplicates → docs tell users of Cursor + Claude + Codex to turn off the third-party toggle (Q6); (b) broken/ignored → `--mode link` is not shipped.
- **Result / Evidence:** (a) PARTIAL (2026-10-04, `copies` only): `SKILLS-VISIBLE` seen by a subagent lists `tsh-spike-knowledge` once, although it exists in both `.agents/skills` and `.claude/skills`; it loaded from the `.claude/skills` path. The `/` menu and Settings count were not checked. (b) PARTIAL (2026-10-04, `symlinks`): `/tsh-spike` resolved to `tsh-spike-command` and ran (`COMMAND-MARKER: SKILL-COMMAND-M4`) while `.claude/skills/*` are symlinks to `../../.agents/skills/*`, so symlinked skills load. Typing `/tsh-spike` executes the command instead of listing entries, The agent then reported exactly ONE `tsh-spike-knowledge` entry in `<available_skills>`, registered under the `.claude/skills/...` path (the symlink), not `.agents/skills/...`. So Cursor dedupes by name here and appears to prefer `.claude/skills`; symlinks work on macOS (model-reported). (c) PASS (2026-10-04, `differing`): the skill loaded with `SKILL-KNOWLEDGE-CLAUDE-VARIANT-M2`, i.e. the `.claude/skills` copy wins over `.agents/skills` on a same-name clash (model-reported; entry count not measured in this variant).

### Q2. Unknown frontmatter keys (R-OQ3) — BLOCKING

- **Steps:** in `copies`, check Settings → Rules/Skills and View → Output (Cursor logs) for warnings; type `/tsh-spike-`; run `/tsh-spike-command hello` and `/tsh-spike-loader`.
- **Observe:** errors/warnings on `user-invocable`, `argument-hint`, `compatibility`, `metadata.short-description`; whether `tsh-spike-internal` (`user-invocable: false`) shows in `/` (expected: yes, D6); whether `argument-hint` is shown.
- **Expected:** all keys tolerated, all skills load.
- **Fallback:** split renderings: Claude-only keys go only into `.claude/skills` (D2, `render-skills.mjs`); record in the Changelog.
- **Result / Evidence:** PARTIAL (2026-10-04, `copies`): `/tsh-spike-command hello` ran and returned `COMMAND-MARKER: SKILL-COMMAND-M4` and `ARGS-RECEIVED: hello`; the subagent saw `tsh-spike-internal` (`user-invocable: false`) and loaded `tsh-spike-knowledge`. No load error reported. NOT CHECKED: View → Output warnings, whether `tsh-spike-internal` shows in `/`, `argument-hint` display.

### Q3. `.codex/agents/*.toml` (R-OQ6) — informational

- **Steps:** open the agents list (Settings → Agents / subagent picker) and the Output logs.
- **Observe:** errors about TOML; phantom agents such as `tsh_spike_context_engineer` or `tsh-spike-fast` (they exist only in `.codex`).
- **Expected:** ignored silently.
- **Fallback:** document the noise; if it is harmful, the installer skips `.codex/agents` for Cursor-only installs.
- **Result / Evidence:**

### Q4. `@AGENTS.md` in CLAUDE.md (R-OQ4) — informational

- **Steps:** ask `What is the spike codeword? Quote every passage in your context that contains it and say how many times it appears.` Check the context/rules indicator of the chat.
- **Observe:** codeword found; seen once or twice; whether CLAUDE.md is listed as applied.
- **Expected:** found; once or twice (both acceptable, D8).
- **Fallback:** if duplication causes real problems, delete `CLAUDE.md` (D8).
- **Result / Evidence:**

### Q5. MCP `servers` key — informational

- **Steps:** in `differing` (`servers`) and `copies` (`mcpServers`) open Settings → MCP; ask `Call the spike_marker tool and print its result.`
- **Observe:** whether `tsh.spike-marker` is listed/connected and returns `MCP-MARKER-5T2`. (No root `.mcp.json` exists on purpose.)
- **Expected:** `servers` does not load; `mcpServers` loads. The fix ships either way.
- **Fallback:** none.
- **Result / Evidence:** servers: ___ mcpServers: ___

### Q6. "Include Third-Party Plugins, Skills, and Other Configs" — informational

- **Steps:** in `copies`, toggle the setting ON then OFF (reload window each time). Each time: type `/tsh-spike`, open the agents list, send any prompt, ask for the codeword, then run `ls project/.spike-claude-hook-fired`.
- **Observe:** ON vs OFF: `tsh-spike-claude-only` skill (M7), `tsh-spike-claude-only` agent (A5), CLAUDE.md applied, Claude hook file created, which `tsh-spike-context-engineer` marker wins (A1 vs A3).
- **Expected:** OFF hides all `.claude/*` items; `.agents/skills` and `.cursor/agents` still load; `.cursor` agent (A1) wins when ON.
- **Fallback:** adjust the installer tree table and docs (D2).
- **Result / Evidence:** ON: ___ OFF: ___

### Q7. Direct subagent invocation syntax — informational

- **Steps:** try in turn: `/tsh-spike-architect hi`, `@tsh-spike-architect hi`, `Use the tsh-spike-architect subagent: hi`.
- **Observe:** which form runs the custom subagent (reply shows `AGENT-MARKER: AGENT-ARCH-CURSOR-A2`).
- **Expected:** `/name` works (per D5 examples).
- **Fallback:** document the working form in Task 4.2.
- **Result / Evidence:**

### Q8. Main-thread loading by name — informational

- **Steps:** run `/tsh-spike-loader`.
- **Observe:** `SKILL-LOADED: SKILL-KNOWLEDGE-M1`, `INTERNAL-LOADED: SKILL-INTERNAL-M3`, and `LOAD-METHOD` (and whether the tool trace shows a skill load or a raw file read).
- **Expected:** both load by name.
- **Fallback:** if loading by name fails, stop Phase 2 and revisit D6 (path refs are banned).
- **Result / Evidence:**

### Q9. GitHub import (Remote Rule) — informational

- **Steps:** push `project/` to a throwaway private GitHub repo. In a different empty workspace: Settings → Rules → Add Remote Rule (GitHub) → that repo. Type `/tsh-spike`, open the agents list, ask for the codeword.
- **Observe:** which of `.agents/skills`, `.cursor/agents`, `AGENTS.md` arrive.
- **Expected:** unknown.
- **Fallback:** if skills and agents are not imported, remove GitHub import from the docs (D3).
- **Result / Evidence:**

### Q10. Skills inside a subagent (M4) — BLOCKING

- **Steps:** `Use the tsh-spike-context-engineer subagent with this task: report your markers.`
- **Observe:** `SKILL-LOADED: SKILL-KNOWLEDGE-M1` (not NONE) and the `SKILLS-VISIBLE` list.
- **Expected:** the subagent loads the skill by name.
- **Fallback:** add `"inlinePreload": ["cursor"]` to `src/config/targets.json` (D2).
- **Result / Evidence:** PASS, 1 run (2026-10-04): `SKILL-LOADED: SKILL-KNOWLEDGE-M1`, `SKILLS-VISIBLE` includes `tsh-spike-knowledge`, `tsh-spike-internal`, `tsh-spike-claude-only`. Caveat: this is the subagent's own report. Decision: no `inlinePreload` for Cursor unless a smoke test contradicts it.

### Q11. Named handoff with `MODE: delegated` (M4) — BLOCKING

- **Steps:** run `/tsh-spike-delegate` 3 times (new chat each).
- **Observe:** the spawned subagent's name in the UI; `AGENT-MARKER: AGENT-CE-CURSOR-A1` (not a generic agent, not A3); `FIRST-LINE-ECHO: MODE: delegated` exactly; a `STATUS: DONE` block and no question.
- **Expected:** 3/3 named spawns, prompt verbatim.
- **Fallback (not fixed in the plan, decide here):** unreliable naming → strengthen the `caller-status-handling` wording (explicit subagent name/type); first line altered → loosen `agent-modes` detection (for example `MODE: delegated` on any of the first lines). Record in the Changelog.
- **Result / Evidence:** run 1 PASS (2026-10-04): subagent `tsh-spike-context-engineer` spawned by name, `AGENT-MARKER: AGENT-CE-CURSOR-A1` (not A3), `FIRST-LINE-ECHO: MODE: delegated`, `STATUS: DONE`, no question. run 2 PASS, run 3 PASS (2026-10-04): same result each time (A1 marker, `FIRST-LINE-ECHO: MODE: delegated` verbatim, `STATUS: DONE`, no question). **3/3.** Note: the STATUS block is printed on one line (`STATUS: DONE SUMMARY: ...`), so the `caller-status-handling` parser must not depend on line breaks.

### Q12. Interactive direct use (M3) — informational

- **Steps:** invoke `tsh-spike-architect` directly with the form from Q7 and task `hi`. When it asks "Which colour should I use?", answer `blue`.
- **Observe:** whether `INTERACTIVE-TURN-2: blue (AGENT-ARCH-CURSOR-A2)` comes from the same subagent, or the main agent answers / the subagent had already returned.
- **Expected:** unknown; either outcome is handled.
- **Fallback:** document the limitation in `supported-tools.md`; consultative use goes through `/tsh-ask` (D5).
- **Result / Evidence:**

### Q13. Legacy dangling symlinks (B1) — informational

- **Steps:** in `copies` (built with `--legacy`), `project/.cursor/skills/tsh-spike-legacy-workflow` is dangling. Type `/tsh-spike-legacy` and check Output logs. For the user-level case, either start Cursor with the fake home (`HOME=/tmp/tsh-spike-copies/fake-home /Applications/Cursor.app/Contents/MacOS/Cursor /tmp/tsh-spike-copies/project`, may require login) or, at your own discretion, copy the two links from `fake-home/.cursor/skills/` into `~/.cursor/skills/` and delete them afterwards.
- **Observe:** errors, warnings or ghost `tsh-spike-legacy-*` entries.
- **Expected:** errors or ghost entries (confirms the installer cleanup); silent ignore is also fine.
- **Fallback:** none; cleanup ships either way.
- **Result / Evidence:** project-level ___ user-level ___
