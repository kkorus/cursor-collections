# CLI capture flow

## Contents

- Inputs
- Flow
- Computed styles payload
- Render stabilization rules
- Exit codes and escalation
- Optional: Figma image on disk

The capture worker collects ACTUAL evidence with `playwright-cli` (command reference: the `tsh-using-playwright-cli` skill). Capture is mechanical evidence collection only; the reviewer judges. Never read code as a substitute for live capture.

## Inputs

- The confirmed full page URL, used unchanged. Never discover, normalize or replace it, never inspect project configuration for a port, never start or switch a server. A missing URL is a blocker returned immediately.
- `ITERATION_DIR`: `<UI_VERIFICATION_DIR>/<component-slug>/iteration-<N>/`, validated per the artifact directory contract in the skill (single-segment slug, inside the specifications tree, git-ignored).
- The Figma frame width from the caller, used as the capture viewport width (default 1440 when none is given).
- Optional `AUTH_FIELDS` and the authorized origin, see [authenticated-capture.md](authenticated-capture.md).

## Flow

0. **Prepare.** `mkdir -p "$ITERATION_DIR"`. Every command writes to an explicit path under it; never rely on default output locations (`playwright-cli` writes to `.playwright-cli/` by default, which is wrong for these artifacts). Keep any `state-save` file outside the working tree (see the authenticated-capture reference).
1. **Open a named session.** `playwright-cli open -s=<session>` with a name unique to this pass.
2. **Resize.** `playwright-cli resize <figma-width> 1080 -s=<session>`.
3. **Navigate** to the full target URL including query parameters: `playwright-cli goto "<full-url>" -s=<session>`. Non-zero exit: stop and escalate.
4. **Check the page.** Read the origin after all redirects (`playwright-cli --raw eval "window.location.origin" -s=<session>`) and compare it with the authorized origin. A login redirect or an unexpected page is handled by the authenticated-capture reference or escalated; do not continue silently.
5. **Stabilize.** Run the fixed stabilize snippet from the `tsh-using-playwright-cli` skill verbatim. It is bounded best-effort; a settle that does not complete is recorded as degraded stabilization and never a blocker.
6. **Screenshot.** `playwright-cli screenshot --filename="$ITERATION_DIR/actual.png" -s=<session>` (full page when supported). Only if that command fails, use the fixed screenshot-fallback snippet of the same skill.
7. **Accessibility snapshot.** `playwright-cli --raw snapshot -s=<session> > "$ITERATION_DIR/a11y-snapshot.yml"`.
8. **Computed styles.** `playwright-cli --raw eval "<expression>" -s=<session> > "$ITERATION_DIR/computed-styles.json"` where the expression returns `JSON.stringify(...)` of the payload below.
9. **Confirm.** `ls -la "$ITERATION_DIR"` shows `actual.png`, `a11y-snapshot.yml` and `computed-styles.json`. A file that landed in `.playwright-cli/` or the working directory is moved or recaptured to the explicit path. Anything missing: not `DONE`.
10. **Clean up.** `playwright-cli close -s=<session>`; also attempt it after any failure, and note a cleanup failure in the output.

## Computed styles payload

Cover the major containers and controls being verified: bounding boxes, computed width and height, max-width, min-height, padding, margin, gap, display, flex or grid direction, justify and align properties, and any targeted style values (font, color, background, radius, shadow) needed to explain differences. Keep it a plain JSON string; do not include cookies, storage or environment values.

## Render stabilization rules

- Settle the page as a bounded best-effort: reduced motion, then the load state, then network idle with an explicit short timeout that is caught. Capture proceeds either way.
- Mask dynamic regions only when unavoidable; mocking is not used (it is forbidden while authenticated).
- Different image heights or sizes between Figma and the implementation are evidence for the reviewer, not a failure of the capture.

## Exit codes and escalation

- `open` or `goto` non-zero: escalate immediately.
- Redirect to login, an auth wall or unexpected content: escalate immediately (`NEEDS_INPUT`), or run the authenticated flow when its inputs are ready.
- Component missing at the confirmed URL: escalate.
- Stabilization degraded: not a blocker, not an escalation; record it and continue.
- Session cleanup failure: note it, then attempt explicit cleanup.
- A second failure of the same command stops the flow with the blocker.

Pre-verification blockers cost no iteration of the verify-fix loop and end in `VERIFICATION NOT RUN`.

## Optional: Figma image on disk

The default flow has the reviewer fetch EXPECTED itself through `figma`. A file-based variant exists upstream: a shared `figma-expected.png` written next to the iteration directories by a worker that has the design tool. It is enabled only if the host can write a Figma export to disk, which was not verified; it is not implemented here. Do not save any browser, login or error screenshot under that name.

## Verification status per tool

Measured 2026-10-26 in headless runs.

| Tool | Reviewer opens PNG files | Capture worker sees a variable exported in the launching shell |
| --- | --- | --- |
| Claude Code | verified (2.1.308) | verified |
| Cursor | verified (cursor-agent 2026.10.22) | verified in the CLI with `--force`; a GUI-launched Cursor does not inherit shell exports (documented caveat, not measured) |
| Codex | not verified (CLI not installed) | not verified |

Not yet verified in any tool: the reviewer fetching the design through an authenticated Figma MCP, and the hardened `playwright-cli` worker flow (`playwright-cli` was not installed on the build machine). Where an image cannot be opened or the design cannot be fetched, the result is `VERIFICATION NOT RUN` and the loop asks the user.
