# UI verification spike (Task 4.0)

Measured 2026-10-26 on the owner machine, headless, 5 model runs in total. Scratch project: `/private/tmp/tsh-spike-ui/proj` (not committed). Fixtures: a locally generated `actual.png` (200x100, left red, right blue) and a stand-in design `figma-stand-in.png` (200x100, top green, bottom yellow), a static `site/index.html`, and the harmless variable `TSH_UI_LOGIN_PROBE` (checked by presence only, value never printed).

Versions: Claude Code 2.1.308 (`claude --version`), cursor-agent 2026.10.22-27dcf5f, Codex CLI not installed, `playwright-cli` not installed (`which playwright-cli` finds nothing), Figma MCP not authenticated, Node v26.12.1.

Throwaway agents (reviewer-shaped: read-only, `disallowedTools` Agent, Write, Edit, NotebookEdit, Bash; worker-shaped: shell, `haiku`) were written by hand into `.claude/agents` of the scratch project; no generator output was produced inside the repository. Cursor loads `.claude/agents` natively.

## Results (4 cells x 3 tools)

| Cell | Claude Code | Cursor (cursor-agent) | Codex |
| --- | --- | --- | --- |
| (1) Read-only reviewer opens PNG files | PASS. Run 1 (`claude -p --agent spike-reviewer`) and run 2 (same agent as a subagent of the main thread): both PNGs described correctly (200x100, red/blue vertical split; green/yellow horizontal split) | PASS. Run 4 (`cursor-agent -p --trust --workspace <dir>`, subagent `spike-reviewer`): same correct description | unverified: CLI not installed |
| (2) Figma MCP exports an image to a file (optional path) | unverified: needs an authenticated Figma MCP | unverified: needs an authenticated Figma MCP | unverified: CLI not installed |
| (3) Hardened worker flow with `playwright-cli` (three artifacts, fixed snippets, cleanup) | blocked: playwright-cli not installed | blocked: playwright-cli not installed | unverified: CLI not installed |
| (4) Worker sees a probe variable exported in the launching shell | PASS. Run 3: delegated shell worker (`haiku`) printed `SET` for `TSH_UI_LOGIN_PROBE` exported in the launching shell | PASS. Run 5 (`--force`): subagent `spike-worker` printed `SET` | unverified: CLI not installed |

Also not measured: the Figma-node fetch by the reviewer (needs an authenticated Figma MCP), and Cursor started from the GUI (a GUI-launched Cursor does not inherit shell exports; the documented caveat stands, it was not measured here).

## Gate decision

Gate sentence (a), quoted: "the gate passes when Claude Code is PASS on the measurable cells (reviewer opens PNG; and (3) once `playwright-cli` is installed); if Claude Code FAILS either, G3's dependent tasks stop and the owner is asked. If `playwright-cli` is missing when 4.0 starts, 4.0 records `blocked: playwright-cli not installed` for (3) and the dependent G3 tasks wait for the owner while every other task and group continues."

Decision: Claude Code PASS on the reviewer-opens-PNG cell; cell (3) is `blocked: playwright-cli not installed`. The gate is therefore OPEN for the design (no redesign needed) but the dependent tasks 4.3, 4.5, 4.6 (and S1.5) wait until the owner installs `playwright-cli` and authorizes the Figma MCP, then cells (2) and (3) are measured.

Outcome rules applied so far: (b) Cursor PASS on (1), no "not verified" marking needed there; Codex stays unverified. (d) shell exports reach the worker in Claude Code and cursor-agent when the tool is started from that shell; the authenticated-capture documentation keeps the "start the tool from the shell with the variables exported" rule and the headed-login `state-save` default.
