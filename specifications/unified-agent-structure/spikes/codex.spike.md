# Spike 1.3: Codex CLI behavior

| Field | Value |
|---|---|
| `codex --version` | |
| Auth (ChatGPT plan / API key) | |
| OS + version | |
| Date | |
| Tester | |

**Setup.**

```bash
K=specifications/unified-agent-structure/spikes/make-fixture.sh
bash $K /tmp/tsh-spike-codex            # copies, 5 shared skills
bash $K /tmp/tsh-spike-codex62 --many 57 # 62 skills for Q7
P=/tmp/tsh-spike-codex/project; cd "$P"
```

- Trust the project: run `codex` once in `$P` and accept the trust prompt (or add `[projects."/private/tmp/tsh-spike-codex/project"] trust_level = "trusted"` to your own `~/.codex/config.toml`). Project `.codex/config.toml` and `.codex/agents` load only in trusted projects.
- If subagents are behind a feature flag in your version, enable it (check `codex features list`) and record the flag.
- Evidence: add `--json` to `codex exec` and/or grep the session log: `grep -l <MARKER> ~/.codex/sessions/*/*/*/rollout-*.jsonl`.

Markers: skills `SKILL-KNOWLEDGE-M1`, `SKILL-INTERNAL-M3`, `SKILL-COMMAND-M4`, `SKILL-LOADER-M5`, `SKILL-DELEGATE-M6`; agents `AGENT-CE-CODEX-A6` (`tsh-spike-context-engineer`, read-only), `AGENT-CE-CODEX-UNDERSCORE-A7` (`tsh_spike_context_engineer`), `AGENT-ARCH-CODEX-A8` (`gpt-5.4` high), `AGENT-FAST-CODEX-A9` (`gpt-5.4-mini`); MCP `MCP-MARKER-5T2`. Every agent reply starts with `FIRST-LINE-ECHO:` and `AGENT-MARKER:`.

**Phase 2 impact.** BLOCKING = changes generated output (Q1, Q2, Q6, Q10). All others are informational. Exception: if Q9 fails, `inlinePreload: ["codex"]` changes output too.

**Outcome summary** (DoD): agent name form: ___ · `targets.json` Codex tiers confirmed/corrected: ___ · listing field + budget (Q7): ___ · leaf key (Q10): ___ · `inlinePreload: ["codex"]`: yes/no

---

### Q1. Hyphenated agent names (R-OQ10) — BLOCKING

- **Steps:** `codex exec --json "Spawn the custom agent tsh-spike-context-engineer with the task 'MODE: delegated' and show its reply verbatim."`, then the same with `tsh_spike_context_engineer`. Check startup output and `~/.codex/log/` for TOML/name errors.
- **Observe:** both load without error; the reply marker (A6 vs A7) proves which file ran.
- **Expected:** hyphenated names valid (A6 returned).
- **Fallback:** emit underscore names (and file names) for Codex only; docs map `tsh-x-y` → `tsh_x_y`.
- **Result / Evidence:**

### Q2. `developer_instructions` multi-line + `sandbox_mode = "read-only"` — BLOCKING

- **Steps:** `codex exec --full-auto --json "Spawn tsh-spike-context-engineer with the task: MODE: delegated WRITE-TEST"`; then `ls "$P/sandbox-probe.txt"`.
- **Observe:** all instruction lines are honored (markers, `STATUS: DONE` block from the last paragraph); `WRITE-RESULT: DENIED` and no probe file.
- **Expected:** both work.
- **Fallback:** multi-line fails → emit a single-line escaped string; sandbox ignored → read-only stays prose, documented as a limitation (D2 honest limits).
- **Result / Evidence:**

### Q3. Model ids — informational

- **Steps:** `codex exec -m gpt-5.4 -c model_reasoning_effort=high "say ok"`; `codex exec -m gpt-5.4-mini "say ok"`; `codex exec "Spawn tsh-spike-fast with the task: hi"`.
- **Observe:** accepted or "unknown model" errors; the model shown in the session header / `--json` events.
- **Expected:** all valid.
- **Fallback:** correct the Codex values in `src/config/targets.json` and record them here.
- **Result / Evidence:**

### Q4. Subagent nesting depth — informational

- **Steps:** `codex exec --json "Spawn tsh-spike-context-engineer with the task: MODE: delegated SPAWN-TEST"`. Check the config reference for a depth setting (for example under `[agents]`).
- **Observe:** `NESTED-SPAWN: OK AGENT-ARCH-CODEX-A8` or `FAILED <reason>`; documented default depth.
- **Expected:** unknown (D5 enforces one level regardless).
- **Fallback:** none; record the depth.
- **Result / Evidence:**

### Q5. Command skills via `agents/openai.yaml` — informational

- **Steps:** in interactive `codex`: type `$` and run `/skills`. Then `codex exec "I need the spike command marker."` (implicit) and `codex exec '$tsh-spike-command hello there'` (explicit).
- **Observe:** `tsh-spike-command` is listed; implicit run does NOT print `SKILL-COMMAND-M4`; explicit run prints it plus `ARGS-RECEIVED: hello there`.
- **Expected:** as observed above; invocation is `$tsh-spike-command`.
- **Fallback:** document the actual invocation syntax (Task 4.2).
- **Result / Evidence:**

### Q6. MCP keys: quoted dotted names, `url` — BLOCKING

- **Steps:** `codex mcp list` in `$P`; `codex exec "Call the spike_marker tool of the tsh.spike-marker MCP server and print the result."`; `codex exec "Use the spike.http-context7 MCP server to resolve the library id for react."`
- **Observe:** both servers listed; `MCP-MARKER-5T2` returned; the HTTP server connects.
- **Expected:** both work.
- **Fallback:** dotted keys fail → sanitize names for Codex (`.` → `-`); `url` fails → wrap HTTP servers with a stdio bridge (for example `npx mcp-remote <url>`).
- **Result / Evidence:**

### Q7. Skill listing budget, `metadata.short-description` (R-OQ11) — informational

- **Steps:** `cd /tmp/tsh-spike-codex62/project` (trust it), run `codex exec "List every skill available to you with its description exactly as shown to you."`, then grep the rollout log: `grep -o 'DESC-TAIL-FILLER-[0-9]*' <rollout>.jsonl | sort -u | wc -l` and `grep -o 'SHORT-FILLER-[0-9]*' <rollout>.jsonl | sort -u | wc -l`.
- **Observe:** how many of 62 skills appear in the injected list; whether descriptions are truncated (missing `DESC-TAIL-*`); whether `SHORT-*` replaces the description. Measure the listing size in characters.
- **Expected:** unknown; drives the `description` / `short-description` lint limits.
- **Fallback:** tighten description lint limits (Task 1.11).
- **Result / Evidence:** field shown ___ budget ___ chars / ___ skills

### Q8. Loading a skill by name — informational

- **Steps:** `codex exec '$tsh-spike-loader'`.
- **Observe:** `SKILL-LOADED: SKILL-KNOWLEDGE-M1`, `INTERNAL-LOADED: SKILL-INTERNAL-M3`, `LOAD-METHOD`.
- **Expected:** both load by name.
- **Fallback:** if loading by name fails, stop Phase 2 and revisit D6.
- **Result / Evidence:**

### Q9. Skills inside a subagent, named spawn, `MODE: delegated` verbatim (M4, N7) — informational (see exception)

- **Steps:** `codex exec --json '$tsh-spike-delegate'` (3 runs). In the `--json` output / rollout log, find the spawn event and its prompt text.
- **Observe:** the spawned agent is the custom one (`AGENT-MARKER: AGENT-CE-CODEX-A6`); `SKILL-LOADED: SKILL-KNOWLEDGE-M1` (not NONE); **N7:** `FIRST-LINE-ECHO: MODE: delegated` exactly, and the spawn prompt in the log starts with the line `MODE: delegated` (no prefix or wrapper added before it).
- **Expected:** named spawn, skill loaded, first line verbatim.
- **Fallback:** skill not loaded → `"inlinePreload": ["codex"]` (BLOCKING then); generic agent spawned → strengthen `caller-status-handling` wording; first line altered → loosen `agent-modes` detection. Record in the Changelog.
- **Result / Evidence:** run 1 ___ run 2 ___ run 3 ___ N7 log excerpt ___

### Q10. Leaf enforcement key (M1) — BLOCKING

- **Steps:** search the Codex config reference / `codex --help` for a per-agent key that disables spawning. Add each candidate to a copy of `.codex/agents/tsh-spike-context-engineer.toml`, rerun the Q4 command.
- **Observe:** `NESTED-SPAWN: FAILED` with the key and OK without it; whether unknown keys make the TOML fail to load.
- **Expected:** a key exists → the generator emits it.
- **Fallback:** no key → prose + `agent-no-delegation` lint only (D2).
- **Result / Evidence:** key ___
