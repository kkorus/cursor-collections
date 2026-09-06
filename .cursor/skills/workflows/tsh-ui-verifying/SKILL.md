---
name: tsh-ui-verifying
description: "UI verification criteria, tolerances, and report format for comparing implementations against Figma designs. Use when verifying UI components, reviewing Figma vs implementation, or running /tsh-review-ui."
---

# UI Verifying

Verification process, criteria, and tolerances for comparing UI implementations against Figma designs.

> **Default to asking when anything is off — this is a judgment rule, not a checklist.** Every specific blocker named in this skill (missing Figma, auth redirect, wrong page, missing or partial artifacts, unconfirmed URL, tool error, …) is only an EXAMPLE of one underlying rule: whenever you cannot run a real, complete verification against the full artifact base — because something is missing, broken, ambiguous, inconsistent, or simply unexpected, **including situations not listed anywhere here** — stop and ask the user. Do not guess, do not improvise a workaround, do not fabricate values, and do not proceed on partial evidence. Think about whether the evidence you actually have supports a verdict; if it does not, ask instead of pushing forward.

## Verification Process

Use the checklist below and track your progress:

```
Progress:
- [ ] Step 1: Validate inputs
- [ ] Step 2: Get EXPECTED from Figma
- [ ] Step 3: Get ACTUAL from implementation
- [ ] Step 4: Compare using verification categories
- [ ] Step 5: Generate report
```

**Step 1: Validate inputs**

Before starting verification, confirm:

- Figma URL is available for the component/section being verified
- Dev server URL is a **user-confirmed pinned session input**:
  - **Standalone verification without a caller-provided URL**: on the first verification in a session, ask the user to confirm the exact full dev server URL that should be used for verification. Do not infer it from project config, running processes, port scans, or other discovery.
  - **Delegated verification with a caller-provided user-confirmed URL**: use that exact full URL unchanged for the entire session. Do not rediscover it, normalize it, swap ports, inspect config to suggest another URL, or launch a different local app/server.
  - Once the user has confirmed the URL, every downstream verification and capture pass must treat it as pinned session state.
  - Record the origin (scheme, host, port) of that confirmed URL **once**; the recorded value is the session's **authorized origin** and it travels with the pinned URL to every capture pass.
- Dev server is running and the **target page** is reachable through the CLI capture flow using that confirmed URL:
  - **Never circumvent an authentication, login, or access/permission gate by any means or technique — proactively or reactively.** Legitimate authentication through the app's real login UI is allowed only when the user has explicitly authorized it and supplied the exact inputs required to perform it through a local env-based contract derived from the real login form, direct in-browser entry, or a real storage-state path created from a prior login. Navigate to the pinned URL only as an ordinary user would. Do not assume, fabricate, simulate, seed, inject, or manufacture any signed-in or authorized state. If you notice the gate is trivially bypassable (for example it can be satisfied entirely client-side), report it as a potential security vulnerability when you raise the blocker, so the user is made aware and can plan a fix — flag the concern, never exploit it.
  - Use the CLI capture flow to open the page at the full target URL before verification begins
  - **The origin check is a precondition of credential handling, not a follow-up.** Before deriving any field key, before reading any `TSH_UI_LOGIN_*` variable, and before any `fill`, compare the current page origin *after all redirects* against the session's authorized origin. A mismatch is a blocker: stop before all three of those actions, report the observed origin to the user, and ask the user to authorize that origin for the session. Cross-origin login is permitted **only** on that explicit authorization — that is the supported route when the redirect lands an SSO chooser, an MFA challenge, or a captcha on a different origin, so the mismatch is raised for a decision and never silently refused. On an authorized origin, read only the variables requested for the form on screen; never read any other `TSH_UI_LOGIN_*` variable. The `TSH_UI_LOGIN_` prefix is a **naming convention, not an allowlist** — the origin binding plus that request-scoping is what actually constrains which secret can be handed to a page.
  - If the capture flow reports a **redirect to a login/authentication screen** and the required login inputs were not already provided: first determine whether the redirected screen is a standard credential form. If it is, derive one repo-root `.env` var per required field from the live form using this order of precedence for the field key: `name` -> `autocomplete` -> `id` -> visible label text. Normalize the chosen key to uppercase snake case and prefix it with `TSH_UI_LOGIN_`. Examples: `email` -> `TSH_UI_LOGIN_EMAIL`, `userName` -> `TSH_UI_LOGIN_USER_NAME`, `company-code` -> `TSH_UI_LOGIN_COMPANY_CODE`. The immediate next action MUST be to ask the user to add those exact derived env vars to repo-root `.env` and confirm when the file is saved. On the next capture pass, reload `.env` and reuse those env vars without printing their values. Use a prepared storage-state path or direct manual login only when the redirected screen is not a standard credential form (for example SSO chooser, MFA challenge, or captcha), the runtime cannot derive the field keys reliably, or the user explicitly prefers one of those fallbacks. Do NOT bypass, seed, inject, or fake authentication yourself by any means or technique, and never fake an identity or assume a role, even if you can see how the auth check works.
    Use this wording pattern for the user message:
    "The page redirected to login. Add these exact vars to repo-root `.env` and tell me when the file is saved:
    - [DERIVED_ENV_VAR_1]=...
    - [DERIVED_ENV_VAR_2]=...
      After you save the file, I will rerun capture and reload `.env` automatically."
  - If the capture flow reports a **redirect to a login/authentication screen** and the required login inputs were already provided, continue through the authenticated capture pre-step below instead of treating the redirect as a manual-only blocker.
  - If the capture flow reports **unexpected content** (error page, blank page, different route): the immediate next action MUST be to ask the user, such as: "The page at [URL] shows [description]. Is this the correct URL for [component name]?"
  - If the capture flow cannot find the expected component on the confirmed page: raise the blocker to the user immediately rather than proceeding.
- If any input is missing or any blocker is encountered, stop and ask the user — do not proceed, do not fall back to code-level review, and do not skip the verification step

### Authenticated capture pre-step

- Use this only when the user has explicitly authorized a genuine login and either populated the local `.env` contract derived from the real login form, completed the redirected real login form in the open browser session, or supplied an already-authenticated storage-state path.
- A genuine login means using the application's real sign-in UI exactly as an ordinary user would. It is allowed. Bypass is not.
- Standard local env contract: in the target repo `.env` file, set one env var per required login field using the derived naming rule `TSH_UI_LOGIN_<NORMALIZED_FIELD_KEY>`, where `NORMALIZED_FIELD_KEY` comes from `name` -> `autocomplete` -> `id` -> visible label text, normalized to uppercase snake case.
- The contract is origin-scoped: those derived vars may be read only while the post-redirect page origin equals the session's authorized origin, and only for the fields of the form actually on screen. A different origin means stop, report the observed origin, and ask the user to authorize it for the session before any derivation, read, or `fill`; a different form on an authorized origin still means read nothing beyond the vars that form requires, since `TSH_UI_LOGIN_` is a naming convention rather than an allowlist.
- Default path: if the redirect lands on a standard credential form, ask the user to populate the exact derived `.env` vars and confirm when the file is saved, then rerun capture with `.env` reloaded before filling the login form. Use direct in-browser login or a prepared storage-state path only for non-standard auth flows such as SSO, MFA, or captcha or when `.env` automation is not workable.
- Never ask the user to paste the password into chat. Read the env vars only at runtime and do not echo their values back into artifacts, reports, or tool output.
- Preferred pattern: perform the real login once, `state-save` to a secret path outside `specifications/**`, then `state-load` that path for each later capture iteration so the authenticated session is reused instead of recreated.
- Never write credentials into task specs, reports, artifacts, or committed files. Never seed cookies, tokens, `localStorage`, or `sessionStorage` by hand.

### Canonical artifact root

Use **one** shared root for capture, validation, and the PASS gate. Do not invent a second path scheme for no-task-ID runs. Resolve these variables once before Step 2 and reuse them for every pass.

```bash
# Prefer task ID; otherwise a stable kebab-case page/component slug.
VERIFICATION_ID="<task-id-or-page-slug>"
UI_VERIFICATION_DIR="specifications/$VERIFICATION_ID/ui-verification"
FIGMA_EXPECTED="$UI_VERIFICATION_DIR/figma-expected.png"
ARTIFACT_DIR="$UI_VERIFICATION_DIR/iteration-<N>"
```

Rules:

- `VERIFICATION_ID` is the task ID when one exists; otherwise a stable kebab-case page or component slug (for example `checkout-summary`).
- Treat `VERIFICATION_ID` as a single path segment, never as a path. Refuse a value containing a `/`, a `\`, a `..` segment, a leading `~`, an absolute path, or a newline instead of resolving, sanitizing, or rewriting it — the value is substituted directly into `specifications/$VERIFICATION_ID/ui-verification`, and a verification instruction can reach a worker from a generated plan file, so it is untrusted input. This is the same threat model and the same remedy that `tsh-resolving-skill-references` applies to a requested skill name.
- Callers may pass an absolute or repo-relative `UI_VERIFICATION_DIR` explicitly; treat that path as canonical **only if** it still resolves inside the repo-root `specifications/` tree after normalization (resolving `.`, `..`, and symlinks), and derive `FIGMA_EXPECTED` / `ARTIFACT_DIR` from it. Refuse any other path outright rather than trimming or rebasing it; an absolute path inside that tree stays valid, so the capability is bounded, not removed. This matters because `specifications/` is gitignored (`.gitignore:6`): a root that escapes it moves screenshots of the **authenticated** application out of ignored scratch space into tracked, committable space.
- Capture, ENSURE-OR-FETCH, artifact validation, reports, and the PASS gate MUST all use the same `$UI_VERIFICATION_DIR`, `$FIGMA_EXPECTED`, and `$ARTIFACT_DIR`. Never require `specifications/<task-id>/...` when the canonical root was defined with a page slug.

**Step 2: Get EXPECTED from Figma — MANDATORY, runs BEFORE capture**

This step is mandatory and always runs before capturing the implementation. A verification without fresh Figma EXPECTED data is INVALID. **EXPECTED comes ONLY from the `figma` MCP tools** — never open a `figma.com` URL (or any Figma link) in the Playwright/CLI browser to "fetch" the design, and never screenshot the Figma web app, its login page, or an error page as the reference. The browser is for the running app (ACTUAL) only. Do these in order:

1. **Resolve the Figma node** from the supplied Figma URL (extract `fileKey` + `nodeId`). If the URL or node cannot be resolved, ask the user, report `VERIFICATION NOT RUN`, and stop. Never continue without a resolved node.
2. **Export the Figma node image via the `figma` MCP and SAVE it** to `"$FIGMA_EXPECTED"` (see [Canonical artifact root](#canonical-artifact-root) — `$UI_VERIFICATION_DIR/figma-expected.png`). Use the `figma` MCP's node-image / screenshot export — not a browser screenshot. This file is REQUIRED for the verification item and must be the real design export; it is the visual reference the comparison is judged against. Do not keep it only in memory or a tool response; it must exist on disk in the shared verification directory. If the `figma` MCP is not available in this workspace, that is a blocker: do NOT fall back to the browser and do NOT save any non-design image as `figma-expected.png` — report `VERIFICATION NOT RUN` and ask the user to enable the Figma MCP or provide an exported reference image.
3. **Extract the design specifications** to compare against:
   - Layer hierarchy and component structure
   - Layout direction, alignment, spacing
   - Frame width (use it as the capture viewport width in Step 3)
   - Typography, colors, radii, shadows
   - Component variants and states

> **ENSURE-OR-FETCH**: At the start of every pass, check whether a valid shared `figma-expected.png` (a real design export) already exists at `"$FIGMA_EXPECTED"` for the current verification item. If it is missing, export it now via the `figma` MCP (steps 1–2 above). If it already exists and the Figma URL/node is unchanged, reuse it — do not re-export it for each iteration. Only after a genuine export failure (the `figma` MCP is unavailable, Figma cannot be reached, the node cannot be resolved, or the file cannot be written) do you report `VERIFICATION NOT RUN`, ask the user, and stop. Never browser-scrape Figma, never save a browser/login/error screenshot as `figma-expected.png`, and never proceed to compare against memory, source code, or the running app while a valid shared `figma-expected.png` is absent.

**Step 3: Get ACTUAL from implementation**

Use the `tsh-ui-capture-worker` capture flow to collect ACTUAL evidence from the running implementation. CLI capture is mechanical evidence collection only. The visual judge remains the reviewer brain comparing Figma EXPECTED against CLI ACTUAL using multimodal reasoning plus computed styles.

When the caller provides a Figma URL to `tsh-ui-capture-worker`, that worker may also export or ensure the shared `figma-expected.png` before opening the app page, purely as evidence preparation. This does not transfer design judgment from the reviewer; it only guarantees the EXPECTED artifact exists even when later ACTUAL capture is blocked by auth or page reachability.

The capture worker must use only the caller-provided full URL for the current pass. It never discovers its own URL, never replaces the caller-provided URL, never inspects project config to pick another port, and never launches or switches to another local app/server. If the delegated task does not include the confirmed full URL, treat that as a blocker and return immediately.

You MUST collect **all three** ACTUAL evidence types — a verification that skips any type is incomplete:

1. **Structure & content** — element hierarchy, order, grouping via accessibility snapshot.
2. **Actual rendered dimensions** — computed widths, heights, paddings, margins, gaps, and other measured layout properties of every major container via JavaScript evaluation of computed styles. This is the most commonly missed step — without it you cannot detect sizing/layout differences.
3. **Visual appearance** — full-page screenshot for side-by-side comparison with the design.

If the three live-capture artifacts are not all present (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`), stop immediately and emit `VERIFICATION NOT RUN` with blocker-resolution guidance to recapture the missing files. Do not continue comparison, do not emit PASS/FAIL, and do not downgrade to a partial or LOW-confidence verdict. Code reading is never a substitute for live capture.

### CLI-first capture flow

Write every ACTUAL capture artifact into `"$ARTIFACT_DIR"`, never into `.playwright-cli/` or the current working directory. `playwright-cli` writes to `.playwright-cli/` by default — that default location is WRONG for these artifacts, so always pass an explicit path. The shared Figma reference remains at `"$FIGMA_EXPECTED"`. Use a named session and keep the flow explicit:

0. **Define and create the artifact directory FIRST** (using [Canonical artifact root](#canonical-artifact-root)):

- Resolve `VERIFICATION_ID`, `UI_VERIFICATION_DIR`, `FIGMA_EXPECTED`, and `ARTIFACT_DIR` once for the verification item.
- Keep any `state-save` file outside `specifications/**`, for example in a git-ignored temp path supplied by the caller.
- `mkdir -p "$ARTIFACT_DIR"`.
- Every command below writes into `"$ARTIFACT_DIR/<file>"`. Never rely on default output locations.

1. **Ensure shared Figma reference when the caller provided a Figma URL** — export or verify `"$FIGMA_EXPECTED"` before browser capture begins. If the shared reference export fails, stop as `VERIFICATION NOT RUN` before opening the app page.
2. **Open named session** — `playwright-cli open -s <session-name>`.
3. **Resize to the Figma frame width** — `playwright-cli resize <figma-width> 1080 -s <session-name>`.
4. **Navigate to the full target URL** including query params — `playwright-cli goto <full-url> -s <session-name>`.
5. **Stabilize render** before collecting evidence — a bounded best-effort, never a blocker:
   - `playwright-cli run-code -s <session-name> "async page => { await page.emulateMedia({ reducedMotion: 'reduce' }); try { await page.waitForLoadState('networkidle', { timeout: 5000 }); } catch { await page.waitForLoadState('load', { timeout: 5000 }).catch(() => {}); console.log('stabilization: degraded - networkidle did not settle within 5000ms'); } }"`
   - `networkidle` is best-effort only. It **throws** on timeout, and on an app with long-polling, SSE/streaming, or repeating timer-driven fetches it may never settle, so it MUST carry an explicit timeout (5000 ms above) and that timeout MUST be caught. On timeout, confirm the weaker bounded `load` state — which `goto` has normally already reached, so it adds no further settling — and capture the page as it stands.
   - The `console.log` line is the degradation signal, because both waits are swallowed and the command exits `0` either way. When the command prints `stabilization: degraded`, record degraded stabilization in the report and proceed to step 6 regardless — a stabilization timeout is a degradation, not a failure. See [Exit codes and escalation rules](#exit-codes-and-escalation-rules).
   - Add route mocks only when the task explicitly requires deterministic mocked data.
   - Mask dynamic regions when unavoidable so transient timestamps, avatars, ads, or animations do not dominate the evidence.
6. **Capture screenshot into the artifact directory**:
   - Preferred: `playwright-cli screenshot --filename="$ARTIFACT_DIR/actual.png" -s <session-name>` (full page when supported).
   - Required fallback: `playwright-cli run-code -s <session-name> "async page => { await page.screenshot({ path: '$ARTIFACT_DIR/actual.png', fullPage: true }); }"`.
7. **Capture accessibility snapshot** — `playwright-cli --raw snapshot -s <session-name> > "$ARTIFACT_DIR/a11y-snapshot.yml"`.
8. **Capture computed styles and measurements** — `playwright-cli --raw eval -s <session-name> "JSON.stringify(...)" > "$ARTIFACT_DIR/computed-styles.json"`.
9. **Confirm artifacts landed in the right place** — run `ls -la "$ARTIFACT_DIR"` and verify `actual.png`, `a11y-snapshot.yml`, and `computed-styles.json` exist there, then verify the shared `figma-expected.png` exists at `"$FIGMA_EXPECTED"`. If a capture artifact (`actual.png`, `a11y-snapshot.yml`, `computed-styles.json`) is missing or landed in `.playwright-cli/` or the working directory, move it into `$ARTIFACT_DIR` or re-run that command with the explicit path. If the shared `figma-expected.png` is missing, go back to Step 2 and export it before continuing — a missing reference image is fixed by fetching it, not by reporting a blocker.
10. **Clean up** — `playwright-cli close -s <session-name>` or equivalent session cleanup if the capture flow aborts.

The `JSON.stringify(...)` payload should cover the major containers and controls being verified: bounding boxes, computed width/height, max-width, min-height, padding, margin, gap, alignment-relevant properties, and any targeted style values needed to explain differences.

> **CRITICAL**: The accessibility tree does NOT contain CSS dimensions. A full-width container and a narrow centered container produce identical accessibility trees. If `computed-styles.json` is missing or you only collected structure without measuring actual rendered dimensions, stop and emit `VERIFICATION NOT RUN` — do not continue with LOW confidence or a partial comparison. Report which ACTUAL artifacts are missing and instruct the caller to rerun capture.

### Render stabilization rules

- Settle the page before capture as a **bounded best-effort**: try `networkidle` with an explicit timeout (5000 ms) and catch it. On timeout, fall back to the weaker bounded `load` state and capture the page as it stands. Capture proceeds either way — a settle that does not complete is recorded as degraded stabilization, never raised as a blocker.
- Emulate reduced motion before taking evidence.
- Use optional route mocks only to remove nondeterministic backend data, not to hide real UI defects.
- Mask dynamic regions when they are known noise sources.
- Different image heights or dimensions between Figma and the implementation are evidence for the reviewer brain; they are NOT hard failures that abort the loop.

### Artifact directory contract

Store each verification pass under the canonical root (`$UI_VERIFICATION_DIR`):

```text
specifications/<verification-id>/ui-verification/   # $UI_VERIFICATION_DIR
  figma-expected.png                                  # $FIGMA_EXPECTED
  iteration-<N>/                                      # $ARTIFACT_DIR
    actual.png
    computed-styles.json
    a11y-snapshot.yml
    pixel-gate/               # optional, phase 2 only
      report.json
      exit-code.txt
      *-diff.png
    report.md
```

`<verification-id>` is the task ID when available, otherwise a stable page/component slug — see [Canonical artifact root](#canonical-artifact-root). Required files for the core flow are the shared `figma-expected.png`, plus `actual.png`, `computed-styles.json`, `a11y-snapshot.yml`, and `report.md` for the current iteration. `pixel-gate/` is optional and only exists when the phase-2 tripwire runs. Never leave any ACTUAL capture artifacts in `.playwright-cli/` or the working directory — pass the explicit `$ARTIFACT_DIR/...` path to every capture command and confirm the files exist there.

### Exit codes and escalation rules

- `playwright-cli open` or `playwright-cli goto` non-zero: escalate immediately instead of silently continuing.
- Redirect to login, auth wall, or unexpected page content: escalate immediately instead of silently continuing.
- Missing component at the confirmed URL: escalate immediately.
- Step-5 render-stabilization timeout (the bounded `networkidle` wait did not settle): **not** a blocker and **not** an escalation. It is expected behaviour on a polling or streaming app, so it is the one named exception to this skill's default "stop and ask when anything is off" rule rather than an unexpected condition. It does **not** produce `VERIFICATION NOT RUN` and does **not** consume an iteration of the verification budget — the current pass continues to a normal verdict and is counted once, and a degraded settle is never a reason to spend an extra pass re-capturing. Record it in the report as degraded stabilization and continue with capture.
- Session cleanup failures: note them in the report, then attempt explicit cleanup.
- Phase-2 tripwire exit `0`: evidence that the render is within the loose screenshot threshold; not the final verdict.
- Phase-2 tripwire exit `1`: evidence of visual difference; not the final verdict.

If open/goto/auth fails, if the page state is wrong, or if required artifacts are missing/incomplete, stop the capture flow and raise clarification with the user. Do not use a plain-text blocker request as a substitute for stopping and asking. These are **pre-verification blockers**. Report the verification result as `VERIFICATION NOT RUN`, include blocker-resolution guidance, and rerun on fresh artifacts after the blocker is resolved. They do not consume any post-fix iteration budget and do not enter the post-5-iteration escalation gate. Do not substitute code reading for verification.

**Step 4: Compare using verification categories**

Compare EXPECTED (Figma) against ACTUAL (implementation) following the Verification Order and Categories below. The Figma design is the **source of truth** for every comparison. When in doubt, the design wins.

**IMPORTANT**: Complete ALL verification categories in a single pass. Do not stop after finding differences in one category — continue through every category and collect every difference. Go category by category (Structure → Layout → Dimensions → Visual → Components) and explicitly record, for each category, either the concrete differences found or an evidence-backed "no differences". A report that lists a single issue when more exist is an INCOMPLETE review: it wastes an iteration and forces extra loops. The report must contain ALL differences found across all categories so the engineer can fix them all at once, minimizing verification iterations.

**Step 5: Generate report**

Produce a structured report following the Report Format below. Include exact values from both Figma and implementation for every difference found.

### Optional phase-2 tripwire: `toHaveScreenshot`

Use this only as a non-blocking signal layer after the core CLI-first capture exists.

- Baseline source: the Figma PNG export is the baseline, not a self-generated app screenshot.
- Run through the project's **locked** Playwright test runner — never bare `npx playwright test`, which can fetch a different package version when Playwright is not already installed locally.
  - Prefer the repo package manager / local binary, for example: `PLAYWRIGHT_HTML_OPEN=never pnpm exec playwright test --reporter=json`, `yarn playwright test --reporter=json`, `npm exec playwright -- test --reporter=json`, or `./node_modules/.bin/playwright test --reporter=json`.
  - If you must use `npx`, pin against the installed package and block installs: `PLAYWRIGHT_HTML_OPEN=never npx --no playwright test --reporter=json`.
  - If Playwright is not a project dependency, add the same major/minor the repo already uses for E2E (or install it as a project dependency) before running the tripwire — do not rely on an ad-hoc `npx` download.
- Use `toHaveScreenshot` with a loose threshold such as `maxDiffPixelRatio`, `fullPage: true`, and masks for known dynamic regions.
- Save the runner JSON output and diff artifacts under `pixel-gate/`.
- Tripwire exit `0` or `1` is evidence for the reviewer brain. It never replaces the multimodal comparison and computed-style review.
- If dimensions differ and the screenshot assertion fails for that reason, keep the artifacts and continue the review loop. That size mismatch is itself evidence.

## Verification Order

Always verify in this order — **complete ALL categories regardless of findings**. Do not stop after finding differences in one category. The goal is to catch every difference in a single pass so all fixes can be applied at once.

1. **Structure** (CRITICAL)
2. **Layout** (CRITICAL)
3. **Dimensions** (CRITICAL)
4. **Visual** (CRITICAL)
5. **Components** (CRITICAL)

## Verification Categories

### Structure (CRITICAL)

| Check                   | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| **Container hierarchy** | Does DOM structure match Figma's layer hierarchy?        |
| **Nesting depth**       | Are elements nested at the same level as in Figma?       |
| **Grouping**            | Are related elements grouped together as in design?      |
| **Element order**       | Is the visual order of elements the same?                |
| **Wrapper elements**    | Are there extra/missing wrapper divs that change layout? |
| **Sections present**    | Are ALL sections from Figma present in implementation? |

### Layout (CRITICAL)

| Check                   | Description                                        |
| ----------------------- | -------------------------------------------------- |
| **Flex/Grid direction** | row vs column, wrap behavior                       |
| **Alignment**           | justify-content, align-items values                |
| **Distribution**        | How space is distributed between elements          |
| **Positioning**         | relative, absolute, fixed - matches design intent? |
| **Centering**           | Is content centered as in design?                  |

### Dimensions (CRITICAL)

| Check                        | Description                                  |
| ---------------------------- | -------------------------------------------- |
| **Container width**          | max-width, fixed width constraints           |
| **Card/panel boundaries**    | Does card have same width as in Figma?       |
| **Content area vs viewport** | Ratio of content width to available space    |
| **Width/Height**             | Fixed, percentage, auto, min/max constraints |
| **Spacing**                  | Padding, margin, gap between elements        |
| **Gaps**                     | Space between flex/grid children             |

> **WARNING**: Accessibility tree does NOT contain CSS dimensions. A full-width container and a narrow centered one look identical in it. You must measure actual computed styles to detect width/sizing differences.

### Visual (CRITICAL)

| Check           | Description                                            |
| --------------- | ------------------------------------------------------ |
| **Typography**  | font-family, size, weight, line-height, letter-spacing |
| **Colors**      | Text, background, border colors                        |
| **Radii**       | border-radius values                                   |
| **Shadows**     | box-shadow, drop-shadow                                |
| **Backgrounds** | Solid, gradient, image                                 |

### Components (CRITICAL)

| Check                | Description                                     |
| -------------------- | ----------------------------------------------- |
| **Correct variants** | Is the right variant of a component used?       |
| **Design tokens**    | Are correct tokens used (not hardcoded values)? |
| **States**           | hover, focus, active, disabled states           |

## Tolerances

| Category         | Tolerance       | Notes                                |
| ---------------- | --------------- | ------------------------------------ |
| Structure        | **None**        | Any structural difference = FAIL     |
| Layout direction | **None**        | row vs column must match exactly     |
| Alignment        | **None**        | Centering, justify, align must match |
| Dimensions       | **1-2px**       | Only for browser rendering variance  |
| Colors           | **Exact match** | Must use correct design tokens       |
| Typography       | **Exact match** | Font properties must match           |
| Spacing          | **1-2px**       | Only for browser rendering variance  |

## Severity Definitions

| Severity     | Description                                        | Action                            |
| ------------ | -------------------------------------------------- | --------------------------------- |
| **Critical** | Structure/layout differences, wrong component used | Must fix immediately              |
| **Major**    | Dimensions off by >2px, wrong colors/typography    | Must fix before merge             |
| **Minor**    | 1-2px browser rendering variance                   | Acceptable, document if recurring |

### Content/data clarification gate

If structure, layout, dimensions, visual styling, and component usage are otherwise acceptable, and the remaining differences are limited to content/data that may plausibly vary by environment, seed data, locale, or user state, do not treat them as automatic UI defects.

In that branch:

1. Summarize the remaining content/data differences clearly.
2. Ask the user whether those values are intentionally environment-specific or whether the UI should match Figma exactly.
3. Keep the PASS/FAIL report format. Until the user confirms those values may differ, keep the overall result as `FAIL` and represent the items under `Clarification Needed` rather than as automatic fix items.
4. Only convert them into actionable fixes after the user confirms they should be corrected.

If the content/data mismatch also changes structure, layout, or visual fidelity in a real way, report that underlying UI defect normally.

## PASS Gate (strict)

A pass is only allowed when the evidence proves it. Do NOT report `PASS` on "looks close", on a partial review, or to end the loop early.

Report `PASS` only when ALL of these hold:

- The shared `figma-expected.png` exists at `"$FIGMA_EXPECTED"` (`$UI_VERIFICATION_DIR/figma-expected.png`), and `actual.png`, `computed-styles.json`, and `a11y-snapshot.yml` for THIS pass all exist in `"$ARTIFACT_DIR"`. The PASS gate MUST accept the same canonical root used for capture — whether `$VERIFICATION_ID` is a task ID or a page/component slug.
- Every verification category — Structure, Layout, Dimensions, Visual, and Components — satisfies its documented tolerance and severity rules from the tables above. Unresolved Critical or Major findings in any category block PASS. Only documented Minor items (genuine 1–2px rendering variance) may remain.
- Structure and Layout have ZERO differences, each backed by a cited structural fact from `a11y-snapshot.yml` or measured layout evidence, not by impression.
- Dimensions and Spacing differences are within the allowed 1–2px rendering tolerance, each backed by a cited measured value from `computed-styles.json`.
- Visual properties with Exact match tolerance (colors, typography, and matching radii/shadows/backgrounds) have ZERO unresolved differences.
- Components show correct variants, design tokens, and interactive states — no wrong-component or token mismatches remain.
- The full-page `actual.png` has been compared side by side against the shared `figma-expected.png`.

If ANY of the following is true, the result is `FAIL` (or `VERIFICATION NOT RUN` when evidence is missing), never `PASS`:

- Any structural difference (missing, extra, or reordered elements; wrong nesting or grouping).
- Any layout difference (wrong flex/grid direction, wrong alignment, wrong centering, wrong distribution).
- Any dimension or spacing difference greater than the 1–2px rendering tolerance.
- Any Visual Exact-match mismatch (wrong color, typography, radius, shadow, or background).
- Any Components mismatch (wrong variant, hardcoded values instead of design tokens, or incorrect interactive states).
- The layout or visuals "look roughly right" but you have not measured them against `computed-styles.json` and compared screenshots against `figma-expected.png`.

Structure, layout, visual Exact-match, and wrong-component mismatches are CRITICAL/Major and can never be waived as "acceptable" or "close enough". Only genuine 1–2px rendering variance is Minor.

## Verification Checklist

Before reporting PASS:

- [ ] Verified ENTIRE page (scrolled from top to bottom)
- [ ] All sections from Figma are present in implementation
- [ ] Container hierarchy matches Figma layers
- [ ] Flex/grid direction is correct
- [ ] Alignment (justify/align) matches design
- [ ] Element order matches design
- [ ] No extra/missing wrapper elements that change layout
- [ ] Actual computed container widths measured (not inferred from accessibility tree)
- [ ] Colors, typography, radii, shadows, and backgrounds match Figma (Exact match)
- [ ] Correct component variants, design tokens, and interactive states
- [ ] No unresolved Critical or Major findings remain in any category
- [ ] Full-page screenshot taken and visually compared against Figma

## Report Format

```markdown
## Verification Result: [PASS | FAIL | VERIFICATION NOT RUN]

### Component: [name]

**Confidence:** [HIGH | MEDIUM | LOW]

### Differences

| Property | Expected (Figma) | Actual (Implementation) | Severity   |
| -------- | ---------------- | ----------------------- | ---------- |
| [prop]   | [expected]       | [actual]                | [severity] |

> **List ALL differences found across ALL verification categories.** Do not omit lower-severity items when critical ones exist. The engineer needs the complete list to fix everything in one iteration.

### Clarification Needed

- [content/data differences that may be intentional]
- [question asking whether the observed values should remain or match Figma exactly]

> When this section is used, keep `## Verification Result` as `FAIL` until the user confirms the content/data/state differences are acceptable, and do not promote them to `Recommended Fixes` before that confirmation.

### Recommended Fixes

- [specific fix with exact values]
```

Use `VERIFICATION NOT RUN` only when capture is missing or blocked. It is not a pass, not a clean fail, and must never be treated as a gate pass. The required action is to obtain the live-capture artifacts or escalate the blocker, then rerun verification on fresh artifacts.

`VERIFICATION NOT RUN` is a pre-verification blocker state. It is distinct from the post-5-iteration gate used for genuine exhausted verify-fix loops.

### Re-verify After Fix

After any fix prompted by a verification finding, discard stale artifacts, collect a fresh capture, and run a fresh verification pass on the new artifacts before deciding PASS or FAIL. Never reuse pre-fix evidence or assume the fix worked.

**Confidence levels:**

- **HIGH** — Both Figma and implementation data complete, comparison is reliable
- **MEDIUM** — Some values couldn't be extracted, manual review recommended
- **LOW** — Some values within otherwise complete artifacts could not be extracted reliably; manual review recommended. Missing required ACTUAL artifacts (`actual.png`, `computed-styles.json`, `a11y-snapshot.yml`) are never LOW — they are `VERIFICATION NOT RUN`.

When content/data differences are the only remaining gaps and may be intentional, ask for user confirmation before escalating them as defects. Keep the report in the normal PASS/FAIL format and treat the result as `FAIL` pending clarification.

## Connected Skills

- `tsh-implementing-frontend` - for implementing fixes following design system patterns
- `tsh-technical-context-discovering` - for understanding project's design token conventions
