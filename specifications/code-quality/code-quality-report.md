# Code Quality Report - cursor-collections (TSH AI Collections)

## Overview

| Field | Value |
|---|---|
| Repository | cursor-collections (`tsh-ai-collections`) |
| Repository Type | Monorepo (three layers, no application: a generator-based distribution repo plus a docs site) |
| Date | 2026-11-12 |
| Layers/Apps Analyzed | `scripts/` (generator, lint, refs, installer, tests), `src/` (skills, agents, partials, MCP, config), `website/` (Docusaurus site and docs), cross-layer architecture review |

Detail per layer is in `scripts.findings.md`, `src.findings.md`, `website.findings.md` and `architecture.findings.md` in this directory. Finding IDs (S-, F-, W-, A-) refer to those files. Severity mapping from the findings files: high -> Critical, medium -> Important, low -> Nice to Have. This report replaces the previous report of 2026-10-26.

## Executive Summary

The repository is in good health. Generation is one-way and deterministic (`src/` -> owned outputs), ownership is enforced in code, CI gates drift, lint, refs, tests and the site build, and there are no circular imports. `lint`, `refs` and `refs --docs` report 0 errors and nothing is baselined, so there is no recorded debt. The installer is defensive (no hard deletes, atomic registry, validated git input) and covered by about 104 tests.

The problems sit at the seams. One real bug: the installer runs the legacy cleanup before it validates its arguments (S-01), so a plain usage error such as `node scripts/install.mjs` can move or unlink legacy entries under `$HOME`. It is raised to Critical in this report because it is the only finding that can change a user's machine by mistake. The other two Critical items are content problems: two rules that contradict each other about a skill that fails to load (F-01), and website copy that describes the code-review verdict with the plan-review vocabulary (W-01).

The recurring theme is rules that are written down but not checked by code: no lint rule exists for "No Copilot paths", `--write-baseline` can overwrite the baseline, contract tests pin today's set of 21 agents instead of the rule (so the safety fix F-07 would fail `npm test`), the generator/installer output paths are declared in five unlinked places, and artifact counts and verdict vocabularies are copied by hand into about nine places that the docs check does not fully scan (`website/src/**`). Three policy decisions are open and need an owner (see Architecture Observations).

---

## Findings by Layer/App

### scripts (`scripts/`)

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | Nice to Have | Unreachable branch | `scripts/install.mjs:480` | `if (oldNames.has(n)) keep.add(n)` over `result.skipped` can never add anything (an entry is skipped only when `!oldNames.has(n)`). |
| 2 | Nice to Have | Unreachable branch | `scripts/install.mjs:879` | Project scope without `projectDir` cannot happen, `makeCtx` (855) always sets it. |
| 3 | Nice to Have | Dead fallback | `scripts/install.mjs:219` | The `\|\| '.'` fallback is never taken (operator precedence). |
| 4 | Nice to Have | Unused exports | `scripts/install.mjs` | `CATEGORIES`, `TOOLS`, `HELP`, `parseArgs`, `loadLegacyNames`, `loadUnprefixedNames`, `cleanupLegacy`, `targetRoot`, `makeCtx`, `copyDereferenced` are used only inside the module. |
| 5 | Nice to Have | Unused exports | `scripts/lib/*`, `lint.mjs`, `check-refs.mjs`, `generate.mjs` | About 15 exports referenced only in their own file (`NAME_RE`, `aggregate`, `renderCursorAgent`, `listOwnedFiles`, `STRUCTURAL_RULES`, ...). Un-export or cover with direct tests. |
| 6 | Nice to Have | Stale doc | `scripts/lib/baseline.mjs:48-50` | JSDoc omits the `writeInitial` option. |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Important | Regex | `lint.mjs:47`, `check-refs.mjs:17`, `lib/render-agents.mjs:94` | Markdown link regex in three variants; the third has no title support (causes S-11). | One shared `LINK` in `scripts/lib/`. |
| 2 | Nice to Have | Constant | `generate.mjs:14`, `lint.mjs:12`, `check-refs.mjs:12`, `test/helpers.mjs:7` | `REPO_ROOT` declared four times. | Export once from `lib/`. |
| 3 | Nice to Have | Boilerplate | `generate.mjs:78-83`, `lint.mjs:200-208`, `check-refs.mjs:166-177` | CLI startup code (also carries S-07, S-08). | A `runCli` helper. |
| 4 | Nice to Have | Error handling | `generate.mjs:33-37`, `lint.mjs:182-187`, `check-refs.mjs:150-155` | Same `loadSource` try/catch. | `loadOrFail(root)` in `lib/load-source.mjs`. |
| 5 | Nice to Have | Constants | `install.mjs:12,15-16,840-842`, `lib/render-*.mjs`, `lib/schema.mjs:7`, `test/port-contracts.test.mjs:22` | Tool list, skill trees, agent dirs, MCP paths. Duplication in the installer is by design (zero dependencies), the missing piece is a contract test (S-13). | Contract test, see A-01. |
| 6 | Nice to Have | Helper | `install.mjs:204,541` | Same timestamp stamp expression. | Local `stamp(ctx)`. |
| 7 | Nice to Have | Helper | `install.mjs:366,471,639,728,831` | Ad hoc plurals next to `plural()` (720). | Use `plural()`. |
| 8 | Nice to Have | Write path | `install.mjs:553-570` vs `494` | Atomic write for the registry, plain write for the manifest (S-03). | One `writeJsonAtomic` helper. |
| 9 | Nice to Have | Walkers | `lib/load-source.mjs:122-128`, `check-refs.mjs:138-146`, `lint.mjs:170-178`, `lib/write-or-check.mjs:88-92` | Four directory walkers; three follow symlinks (a loop overflows the stack). | One `walk()` or `lstatSync` in the three. |
| 10 | Nice to Have | Tooling | `lib/render-skills.mjs:5`, `lib/render-agents.mjs:17,51` | Three `TODO(spike ...)` markers (S-15, A-13). | Resolve or turn into decision records. |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Critical | Correctness (S-01) | `scripts/install.mjs:885-894` | `cleanupLegacy` runs before the `--tools` check and the `--update` no-manifest check. A usage error moves or unlinks legacy entries under `$HOME` and the project dir, then exits 2. The test at `install.test.mjs:477` runs on a home with no legacy entries, so it misses this. Raised from medium by the compiler (see Summary). | Throw every `UsageError` before `cleanupLegacy`. Add a test that seeds a legacy entry, runs `go([])` and `go(['--update'])` and asserts the entry is untouched. |
| 2 | Important | Complexity (S-02) | `scripts/install.mjs:1-920` | 920-line module with 9 responsibilities; `installTree` (406-497) and `updateAll` (723-808) have about 90 lines each and deep nesting. | Split into built-ins-only modules under `scripts/lib/install/`; extend the zero-dependency guard test (`install.test.mjs:652`) to them. |
| 3 | Important | Data safety (S-03) | `install.mjs:494`, `136-141` | Manifest written in place; an interrupted write makes `readManifest` return `null` silently, and the next `--update` skips every entry as "not managed". | Atomic write like the registry; warn on invalid JSON; test a truncated manifest. |
| 4 | Important | Data retention (S-04) | `install.mjs:519-534`, `573-591` vs `812-829` | `registerInstall` silently drops registry entries it does not recognise; `forgetMissing` keeps them. Conflicting rules for one file. | Rewrite from the raw array and replace only the matching entry. |
| 5 | Nice to Have | Security (S-05) | `install.mjs:644-648` | Printed update command is double-quoted (`$`, backticks still expand) and omits `--source`. Display only. | POSIX single-quote; add `--source` when non-default. |
| 6 | Nice to Have | Scope (S-06) | `install.mjs:315-316,855` | Cleanup always scans home and project dir; `--scope user --project-dir X` is accepted. See policy P-3. | Document in `HELP`, reject the combination. |
| 7 | Nice to Have | Robustness (S-07) | `generate.mjs:78`, `lint.mjs:200`, `check-refs.mjs:166` | Main guard throws `ERR_INVALID_ARG_TYPE` when `argv[1]` is undefined; does nothing through a symlink. | Shared `isMain()` with `realpathSync`. |
| 8 | Nice to Have | Consistency (S-08) | same three files | Unknown flag gives a stack trace and exit 1 (same as "out of date"); installer uses exit 2. | Catch parse errors, exit 2. |
| 9 | Nice to Have | Robustness (S-09) | `lint.mjs:126-127` | Unescaped regex from `preload-skills` crashes lint. | Escape or skip invalid names. |
| 10 | Nice to Have | Correctness (S-10) | `lib/write-or-check.mjs:63-67` | A directory where a file is expected gives `EISDIR` in `writeOutputs`. | Remove the directory or report the path. |
| 11 | Nice to Have | Correctness (S-11) | `lib/render-agents.mjs:94` | Titled links are not rewritten when skills are inlined. | Shared `LINK` regex; add a test. |
| 12 | Nice to Have | Robustness (S-12) | `lib/baseline.mjs:60,78-85` | Baseline entries are not validated; `lib/baseline.mjs` has no direct tests. | Validate entries; add unit tests. |
| 13 | Nice to Have | Test coverage (S-13) | `install.mjs:15-16,840-842` vs `lib/render-*.mjs` | No test ties installer path constants to the generator. | See A-01. |
| 14 | Nice to Have | Test quality (S-14) | `test/helpers.mjs:12`, `install.test.mjs:10` | Tests leave their `mkdtemp` directories behind. | Clean up in `t.after`. |
| 15 | Nice to Have | Maintainability (S-15) | `lib/render-skills.mjs:5`, `lib/render-agents.mjs:17,51` | Possibly stale `TODO(spike ...)` comments. | See A-13. |

### src (`src/`)

Lint, refs and refs `--docs` report 0 errors; every `tsh-` name, `preload-skills` entry and `routes-to` resolves; no `SKILL.md` exceeds 400 lines. The findings below are semantic and invisible to the linters.

#### Dead Code

None. No unreferenced support files, no dangling `tsh-` references. `tsh-migrating-copilot-customizations` has no inbound reference by design; naming it in `tsh-creating-skills` or the AI-customization orchestrator would make it deterministic to find (optional).

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Important | Checklist | `tsh-implementing-react/SKILL.md#L139-L156`, `tsh-writing-hooks/SKILL.md#L202-L213`, `tsh-reviewing-frontend/SKILL.md#L62-L80` | Hooks review checklist written three times. | Neutral checklist in `tsh-writing-hooks`, React additions in `tsh-implementing-react`, the reviewer points to both. |
| 2 | Nice to Have | Guidance | `tsh-implementing-react/SKILL.md#L103-L125`, `tsh-optimizing-frontend/SKILL.md#L74,#L127-L136` | Memoization guidance; the optimizing table reads as "memoize by default". | Add "measure first / not with the Compiler" or move the table. |
| 3 | Nice to Have | Loop | `tsh-designing-architecture/SKILL.md#L85`, `tsh-review-ui/SKILL.md#L24-L28` | UI verification loop restated although `tsh-orchestrate-ui-verification` says it is the only owner. | Reference by name. |
| 4 | Nice to Have | Workflow | `tsh-write-documentation/SKILL.md#L37-L39` vs `partials/plan-progress.md` | Plan synchronisation duplicated. | Remove from the step. |
| 5 | Nice to Have | Rule | `partials/agent-modes.md#L20`, `partials/caller-status-handling.md#L43`, `tsh-analyze-cloud-costs/SKILL.md#L22` | Skill-load failure rule, third variant contradicts (see F-01). | Keep the two partials. |
| 6 | Nice to Have | Rule | `partials/caller-status-handling.md#L41,#L45` | Iteration caps stated twice. | Merge. |
| 7 | Nice to Have | Procedure | `tsh-audit-infrastructure/SKILL.md#L26`, `tsh-analyze-cloud-costs/SKILL.md#L34` | `NEEDS_ARCHITECT_DECISION` handling restated. | Keep command-specific triggers only. |
| 8 | Nice to Have | Security rule | `tsh-ui-engineer.md#L42`, `tsh-ui-capture-worker.md#L50`, `tsh-verifying-ui/references/authenticated-capture.md#L77` | Auth no-bypass rule x3; acceptable as defense in depth. | Optional `ui-auth-safety` partial. |
| 9 | Nice to Have | Rule | `tsh-architect.md#L68-L80` vs `plan-governance` partial | Approval and revision rules repeated. | Keep only `record_human_approval` mechanics in the agent. |

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Critical | Contradiction (F-01) | `tsh-analyze-cloud-costs/SKILL.md#L22` vs `partials/agent-modes.md#L20`, `partials/caller-status-handling.md#L43` | The command's "degraded mode" continues without `tsh-optimizing-cloud-cost`; the delegate returns `BLOCKED` and the caller stops. The paragraph can never run (A-14). | Delete the degraded-mode paragraph; state that partials override command text. |
| 2 | Important | Rendering (F-02) | `tsh-designing-architecture/SKILL.md#L82` | `plan-governance` include sits mid-list, so later Planning-rules bullets render under the wrong heading. | Move after the last bullet or into its own section; list in `## Contents`. |
| 3 | Important | Layering (F-03) | `tsh-analyze-cloud-costs/SKILL.md#L15-L41` | Command carries domain knowledge (tag standards, guardrails, IaC globs). | Move into `tsh-optimizing-cloud-cost` or `tsh-delivering-infrastructure`. |
| 4 | Important | Layering (F-04) | `tsh-audit-codebase/SKILL.md#L12-L19`, `tsh-debug/SKILL.md#L13-L20` | Commands run workflows in the main thread; `routes-to` misdescribes them. See policy P-1. | Option C: codify, keep domain knowledge out, add a `command-size` warn rule. |
| 5 | Important | Hard-coded path (F-05) | `tsh-analyze-cloud-costs/SKILL.md#L31`, `tsh-audit-infrastructure/SKILL.md#L25` | Literal `specifications/...` instead of resolved `<specs>`. | Add the "Resolve `<specs>`" step. |
| 6 | Important | Safety (F-07) | `tsh-devops-engineer.md#L32-L38`, `tsh-e2e-engineer.md#L38-L42`, `tsh-prompt-engineer.md#L50-L54` | Read-write agents lack `version-control-safety`. Blocked by the snapshot test in `port-contracts.test.mjs` (A-06). | Add the include and replace the snapshot test with a rule. |
| 7 | Important | Overlap (F-08) | `tsh-write-documentation/SKILL.md#L23-L41` vs `tsh-writing-documentation/SKILL.md#L23-L38` | Two numbered documentation workflows with near-identical names; `task-routing.md#L27` names the wrong one. | Keep the procedure in the step only. |
| 8 | Important | Repo-specific wording (F-09) | `tsh-write-documentation/SKILL.md#L21`, `tsh-engineering-manager/references/task-routing.md#L20` | "Skills and agents under `src/`" is wrong in consumer projects where `src/` is application code (see A-09). | Describe by artifact type. |
| 9 | Important | Tool-neutrality (F-10) | `tsh-ba-*-worker.md` (5 files, `## Tools`) | Copilot-style tool ids (`read`, `search`, `figma/*`); no `tsh-using-mcp-servers` line. | Server names and capabilities; add the standard line; add a `TOOL_SYNTAX` pattern. |
| 10 | Important | Constitution (F-11) | `tsh-discovering-technical-context/SKILL.md#L47` | Lists `.github/copilot-instructions.md`, against "No Copilot paths". No lint rule exists (A-02). See policy P-2. | Narrow, lint-enforced exception (Option B). |
| 11 | Important | Vocabulary (F-12) | `tsh-reviewing-code`, `audit-checklists.md`, `code-quality-report.template.md#L26-L38` | Three severity scales in one audit workflow (confirmed in practice: this audit's layer files all used a fourth form). | One mapping in `audit-checklists.md`; require it in the fan-out `TASK` (A-12). |
| 12 | Important | Supply chain (F-14) | `src/mcp/servers.json` | Every stdio server resolves `@latest` or unversioned at startup, with the user's AWS/GCP credentials. | Pin versions, update through a scheduled PR. |
| 13 | Important | Startup (F-15) | `src/mcp/servers.json` `playwright`, `pdf-reader` | `npx` without `-y` can hang on a prompt. | Add `-y`. |
| 14 | Important | Deprecated (F-16) | `src/mcp/servers.json`, `tsh-devops-engineer.md`, `tsh-using-mcp-servers/references/aws.md` | AWS API MCP server is entering end of development. | Plan the migration to the AWS MCP Server in one change. |
| 15 | Nice to Have | Cross-skill ref (F-06) | `tsh-audit-codebase/SKILL.md#L16` | Names another skill's `references/audit-checklists.md`. | Reference the skill by name. |
| 16 | Nice to Have | Vocabulary (F-13) | plan template vs `tsh-ui-reviewer.md#L28`, `tsh-review-ui`, `tsh-verifying-ui` | `PASSED` vs `PASS`. | One word, or state the mapping once. |
| 17 | Nice to Have | MCP (F-17) | `servers.json` `awslabs.aws-documentation-mcp-server` | Hard-coded stale browser user agent. | Remove or use an honest identifier. |
| 18 | Nice to Have | Frontmatter (F-18) | `tsh-using-mcp-servers/SKILL.md#L7-L13` | `requires-mcp` omits AWS and GCP servers. | Add or document. |
| 19 | Nice to Have | Agent skills (F-19) | `tsh-ui-engineer.md#L56-L66` | Does not list `tsh-implementing-react`. | Add on-demand entry. |
| 20 | Nice to Have | Agent skills (F-20) | `tsh-software-engineer.md#L54-L61` | Does not list `tsh-refactoring`, `tsh-debugging`. | Add on-demand entries. |
| 21 | Nice to Have | MCP guidance (F-21) | `tsh-ai-customization-researcher.md`, `tsh-plan-reviewer.md`, `tsh-ui-reviewer.md` | Missing the `tsh-using-mcp-servers` load line. | Add; candidate lint rule. |
| 22 | Nice to Have | Description (F-22) | `tsh-business-analyst/SKILL.md#L3` | Orchestrator reads like a user-triggerable skill. | Add the "Internal step of ..." guard. |
| 23 | Nice to Have | Description (F-23) | `tsh-debug/SKILL.md#L7`, `tsh-debugging/SKILL.md` | Identical `short-description`. | Differentiate. |
| 24 | Nice to Have | Spelling (F-24) | about 40 places, e.g. `tsh-designing-databases/SKILL.md#L3` | British spelling against the American-spelling rule. | Normalize; start with the model-visible description. |
| 25 | Nice to Have | Verbosity (F-25) | `tsh-architect.md#L120-L157` | About 40 lines of tool boilerplate; "never execute test suites" conflicts with `/tsh-audit-codebase`. | Trim to role deltas. |
| 26 | Nice to Have | Size (F-26) | `tsh-using-playwright-cli/SKILL.md` (400), `tsh-implementing-backend/SKILL.md` (395) | Near the 500-line cap. | Move catalogs to `references/`. |
| 27 | Nice to Have | Docs (F-27) | `AGENTS.md` | Describes baseline files that do not exist. | Note "currently empty" (A-10). |

### website (`website/`)

`tsc --noEmit` passes; `tsc --strict` shows 9 errors, all in `AnimationCanvas.tsx`; `refs --docs` is clean. Every `src/` command, knowledge skill, internal step, orchestrator, non-worker agent and MCP server has a docs page.

#### Dead Code

| # | Severity | Type | Location | Description |
|---|---|---|---|---|
| 1 | Nice to Have | Unused CSS | `components/SdlcDiagram/styles.module.css:208-213` | `.innerConn` is never used. |
| 2 | Nice to Have | Unreachable styles | `src/css/custom.css:18-39,460,547,600-603` | Light-theme values never apply (`disableSwitch: true`, dark default). Remove or comment as intentional. |
| 3 | Nice to Have | Placeholder | `website/static/img/.gitkeep` | Directory has real assets. |

#### Duplications

| # | Severity | Type | Locations | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Nice to Have | Component | `HeroSection/index.tsx:22-32`, `GettingStartedSection/index.tsx:72-82`, `docusaurus.config.ts:157,182` | Same CTA button pair; GitHub URL hard-coded four times. | `CtaButtons` component; one repo URL constant. |
| 2 | Nice to Have | CSS | `HomepageFeatures`, `QuickWins`, `SocialProof`, `WorkflowShowcase`, `GettingStartedSection`, `pages/index.module.css` | Same section wrapper CSS repeated. | Shared `.tsh-section` class or variables. |
| 3 | Nice to Have | Markup | `SdlcDiagram/index.tsx:32-142` | Eight copies of the card block. | Data array plus `DiagramCard`; makes W-01 a one-line fix. |

The changelog copy (W-09) and the admonition defaults (W-18) are listed under Improvements.

#### Improvement Opportunities

| # | Severity | Category | Location | Description | Recommendation |
|---|---|---|---|---|---|
| 1 | Critical | Docs stale vs `src/` (W-01) | `SdlcDiagram/index.tsx:132`, `QuickWins/index.tsx:35`, `docs/getting-started/quick-wins.md:193`, `docs/agents/code-reviewer.md:35-38` | Code review verdict shown as `PASS / BLOCKER / SUGGESTION`; `tsh-reviewing-code` uses critical / warning / suggestion. BLOCKER is the plan-review vocabulary. | Replace the four occurrences; list the severities in `docs/skills/reviewing-code.md`. |
| 2 | Important | Docs consistency (W-02) | `HomepageFeatures/index.tsx:28` | "17 Subagents"; there are 21. | Fix; add the count check (A-04). |
| 3 | Important | Accessibility 1.4.3 (W-03) | `custom.css:67,505,523,528` | Dark `--text-muted: #62686A` is about 3.3:1 on the page and 2.9:1 on the footer. | Raise to about `#8A9093`; verify with axe. |
| 4 | Important | Accessibility 2.4.7 (W-04) | `custom.css:301-323` | Search input `outline: none`, weak replacement, low text contrast. | `:focus-visible` outline; raise text color. |
| 5 | Important | Accessibility / perf (W-05) | `HeroSection/AnimationCanvas.tsx:104-150` | Canvas ignores `prefers-reduced-motion`, runs off screen, unthrottled resize. | `matchMedia`, `IntersectionObserver`, throttled resize. |
| 6 | Important | Bug (W-06) | `AnimationCanvas.tsx:119-128,161` | Above 1440px the buffer and the clamped CSS box disagree, the animation is squeezed. | Size from the clamped box; stop overwriting style width/height. |
| 7 | Important | TypeScript (W-07) | `website/tsconfig.json:1-8` | Strict mode off; 9 errors under `--strict`, all in `AnimationCanvas.tsx`. | Enable `strict`, fix with `const` bindings. |
| 8 | Important | CI (W-08) | `website/package.json:5-10`, `.github/workflows/validate.yml:26-27` | No typecheck step; the build strips types. | `typecheck` script and CI step. |
| 9 | Important | Duplication / drift (W-09) | `website/src/pages/changelog.md` vs `CHANGELOG.md` | Hand-kept 660-line copy, nothing checks drift. | Generate at build time or compare in `check-refs --docs`. |
| 10 | Important | Config (W-10) | `docusaurus.config.ts:9` | `url` is still the Copilot-era host; feeds canonical URLs and sitemap. Production host unconfirmed. | Confirm the host (open question). |
| 11 | Nice to Have | Config (W-11) | `docusaurus.config.ts:12` | Broken anchors and Markdown links only warn. | `onBrokenAnchors: 'throw'`, markdown hook `throw`. |
| 12 | Nice to Have | Deploy (W-12) | `vercel.json:2-4` | `npm install` twice instead of `npm ci`; no security headers; `trailingSlash` unset. | `npm ci`, headers block, explicit `trailingSlash`. |
| 13 | Nice to Have | Config (W-13) | `website/package.json:37-39` | Engines `>=18`, Docusaurus 3.9.2 needs `>=20`. | Set `>=20` or `22.x`. |
| 14 | Nice to Have | Accessibility (W-14) | `HomepageFeatures/index.tsx:64-77`, `GettingStartedSection/index.tsx:93` | Heading levels skipped; features section has no heading. | `h2` label, `h3` step titles. |
| 15 | Nice to Have | Fonts (W-15) | `SdlcDiagram/styles.module.css:11,89,145,296` | `DM Mono` / `Syne` never loaded. | Use the loaded font variables. |
| 16 | Nice to Have | Docs (W-16) | `SocialProof/index.tsx:27-32` vs `docusaurus.config.ts:186` | "Methodology" links to two different pages. | Point both to `/docs/workflow/overview`. |
| 17 | Nice to Have | Accessibility (W-17) | `SdlcDiagram/index.tsx:7-11` | `role="img"` hides the whole diagram content from screen readers. | Drop it or add a text alternative. |
| 18 | Nice to Have | Config (W-18) | `docusaurus.config.ts:26-28` | Admonition keywords repeat the defaults. | `keywords: ['brand']`. |
| 19 | Nice to Have | SEO (W-19) | `src/pages/index.tsx:17-18` | Title "TSH AI Collections \| TSH AI Collections". | Omit `title` or use the tagline. |
| 20 | Nice to Have | Consistency (W-20) | `QuickWins/index.tsx:78-80` | Card labeled Infrastructure gets the Development color. | Add an `infra` track or relabel. |
| 21 | Nice to Have | Dependencies (W-21) | `website/package.json:11-24` | Docusaurus 3.10.2 and search plugin 0.55.3 available. | Update in one PR, verified by CI. |

---

## Architecture Observations

The architecture is sound: one-way generation from `src/`, ownership enforced in code (`assertOwned`, `owned` globs in `src/config/targets.json`), no cycles (the installer imports only `node:` built-ins), model names only in `targets.json`, and CI gates everything. The weak points are where the layers meet, each resting on a rule that no code checks. The architecture review (A-01 to A-14) re-examines several layer findings from the cross-layer side; A-07 overlaps S-01/S-06, A-08 overlaps W-01/F-12/F-13, A-09 overlaps F-09/F-25, A-14 overlaps F-01, so some items appear in both tables.

Corrections to the per-layer audits found during the review: no Copilot-path lint rule exists (the `src` audit assumed it did and "did not flag" F-11); the real counts are 16 commands, 3 orchestrators, 3 internal steps, 43 knowledge skills (65 skills) and 21 agents (not 64 skills); the severity totals in the header of `src.findings.md` do not match its table (the table has 13 medium and 13 low, this report uses the table).

| ID | Severity | Category | Location | Finding | Recommendation |
|---|---|---|---|---|---|
| A-01 | Important | Generator/installer contract | `targets.json`, `lib/render-*.mjs`, `install.mjs:12,15-16,840-842`, `lib/schema.mjs:7`, `test/port-contracts.test.mjs:21-22` | Output layout declared in five unlinked places; all agree today, but a rename silently stops the installer from installing a tree. | Export the constants and add one contract test (installer == `lib/` == `owned` globs). |
| A-02 | Important | Constitution enforcement | `AGENTS.md`, `scripts/lint.mjs:19-43` | No `no-copilot-paths` rule; F-10 is in the same family and uncaught. | Add the rule with an allow-list; add `` `<server>/*` `` to `TOOL_SYNTAX`; never baseline. |
| A-03 | Important | Layering enforcement | `tsh-audit-codebase`, `tsh-debug`, `tsh-analyze-cloud-costs`, `tsh-creating-agents:111`, `lint.mjs:120-124` | By the repo's own criterion these commands are orchestrators; `routes-to` is not rendered into any output, so only docs and readers are misled. | Decide P-1; add warn-level `command-size` rule. |
| A-04 | Important | Drift: counts | README, 5 website docs, `HomepageFeatures/index.tsx:28`, `changelog.md:37`, `port-contracts.test.mjs:38` | Counts are hand-copied to about 9 places; `refs --docs` checks names, not numbers, and skips `website/src/**`. | Count check in `check-refs --docs` that also scans `website/src/**`. |
| A-05 | Important | Baseline guarantee | `scripts/lib/baseline.mjs:51-57` | `--write-baseline` overwrites an existing baseline; hand-added lines pass. Trivially safe today because `scripts/baseline/` does not exist. | Refuse when the file exists; validate entries (S-12). |
| A-06 | Important | Test design | `test/port-contracts.test.mjs:36,38,43-61` | Tests pin the current set (exactly 21 agents, exactly 4 with `version-control-safety`); fix F-07 fails `npm test`. | Assert the rule: every read-write agent with `plan-progress` includes `version-control-safety`. |
| A-07 | Important | Installer scope and docs | `install.mjs:885-894,315-316,51-52`, `README.md:111`, `upgrading.md:54` | S-01 confirmed; three user-facing texts describe the cleanup differently. | Fix the order first; then P-3; one text in `HELP`, README and upgrading page. |
| A-08 | Important | Drift: vocabulary | `tsh-reviewing-code`, `tsh-reviewing-plans`, `audit-checklists.md`, `tsh-verifying-ui`, website TSX and docs | Verdict and severity vocabularies have no single owner; the site copies them by hand. | One owner per vocabulary plus a `repo-contracts` test; fix the four website occurrences. |
| A-09 | Important | Repo-specific leakage | `tsh-write-documentation/SKILL.md:21`, `task-routing.md:20`, `tsh-architect.md:133` | Shipped artifacts assume the consumer is this repo. | Describe by type, not path; optional warn rule for literal `src/` paths. |
| A-10 | Nice to Have | Constitution text | `AGENTS.md`, `package.json` | AGENTS.md understates `npm run check` (it already runs `refs --docs`) and describes absent baseline files. | Update the text. |
| A-11 | Nice to Have | Non-generated copies | `website/src/pages/changelog.md`, `docusaurus.config.ts:9` | A second hand-made copy chain outside the single-source rule. | Generate or compare; confirm `url`. |
| A-12 | Nice to Have | Audit severity scale | `tsh-audit-codebase`, `audit-checklists.md`, report template | No scale named in the fan-out; this audit's layer files used `high/medium/low`. | Define the scale and mapping; fix the column set in the `TASK`. |
| A-13 | Nice to Have | Renderer decisions | `lib/render-agents.mjs:17,51`, `lib/render-skills.mjs:5` | Open spike TODOs decide the Codex name mapping and are tracked only in comments. | Record as decision files and pin with render tests. |
| A-14 | Nice to Have | Contradicting rules | `tsh-analyze-cloud-costs/SKILL.md:22` vs partials | The degraded-mode paragraph can never run; shows partials are not treated as binding over command text. | Remove it; say in `tsh-creating-commands` that partials override. |

### Policy decisions needed (owner: you)

These were raised by the layer audits and analyzed in `architecture.findings.md`; none has been decided or applied.

- **P-1 (F-04): commands that fan out or loop in the main thread.** Recommended: Option C. Accept the main-thread workflow for agent-routed commands, move domain knowledge out of commands, and add a warn-level `command-size` lint rule. Alternatives: only codify (A), or extract orchestrators (B).
- **P-2 (F-11): Copilot instruction files as context.** Recommended: Option B. Allow reading a consumer's existing `.github/copilot-instructions.md` only in `tsh-discovering-technical-context`, through an explicit, lint-enforced allow. Alternatives: remove the line (A) or generalize without a path (C).
- **P-3 (S-06): legacy cleanup scope.** Recommended: Option C. Keep scanning both roots now, document it in `HELP`, reject `--scope user` with `--project-dir`, and limit to the target scope in the next major release. The ordering bug (S-01) must be fixed under every option.
- **Open question (W-10):** is `https://copilot-collections.tsh.io` still the production host, or should `url` move?

## Summary

Severity mapping: high -> Critical, medium -> Important, low -> Nice to Have. S-01 is raised from medium to Critical by the compiler. Improvements include the 14 architecture findings (A-01 to A-14), which partly overlap layer findings (see Architecture Observations).

| Category | Critical | Important | Nice to Have | Total |
|---|---|---|---|---|
| Dead Code | 0 | 0 | 9 | 9 |
| Duplications | 0 | 2 | 20 | 22 |
| Improvements | 3 | 34 | 40 | 77 |
| **Total** | **3** | **36** | **69** | **108** |

Per layer, improvements: scripts 15 (1 / 3 / 11), src 27 (1 / 13 / 13), website 21 (1 / 9 / 11), architecture 14 (0 / 9 / 5).

## Recommended Action Plan

### Immediate (Critical)
1. S-01 / A-07: resolve `tools` and throw every `UsageError` before `cleanupLegacy`; add the seeded-legacy regression test for `go([])` and `go(['--update'])`.
2. F-01 / A-14: delete the degraded-mode paragraph in `/tsh-analyze-cloud-costs`.
3. W-01 / A-08: replace `PASS / BLOCKER / SUGGESTION` with `critical / warning / suggestion` in the four website locations; fix W-02 (17 -> 21 subagents) in the same change.

### Short-term (Important)
1. A-01 / S-13: export the installer constants and add the generator/installer layout contract test.
2. A-06 with F-07: replace the snapshot assertions in `port-contracts.test.mjs` with the rule, then add `version-control-safety` to the DevOps, E2E and prompt-engineer agents.
3. A-02 with P-2: add the `no-copilot-paths` rule and the `` `<server>/*` `` tool-syntax pattern; resolve F-10 and F-11.
4. A-05 with S-12: make `--write-baseline` refuse an existing file and validate baseline entries.
5. A-04 / A-08: add the count check (also scanning `website/src/**`) and one owner per verdict/severity vocabulary; define the audit scale (A-12/F-12).
6. P-1 and F-03/F-05: decide P-1, move cost-audit domain knowledge out of the command, resolve `<specs>` in the two infrastructure commands.
7. S-03, S-04, S-02: atomic manifest write, registry retention, then split `install.mjs` behind the existing tests.
8. F-14, F-15, F-16: pin MCP versions, add `-y`, plan the AWS MCP Server migration together.
9. F-02, F-08, F-09/A-09: fix the `plan-governance` include position, merge the two documentation workflows, remove `src/`-specific wording.
10. Website: W-03 to W-08 (contrast, focus, reduced motion, canvas bug, strict mode plus CI typecheck), W-09/A-11 changelog sync, W-10 production host.

### Long-term (Nice to Have)
1. Low-severity installer and CLI hardening: S-05 to S-11, S-14 (test cleanup), shared `LINK`, `REPO_ROOT`, `runCli`, `walk` helpers.
2. Dead code and unused exports in `scripts/`; light-theme CSS, `.innerConn`, `.gitkeep` in `website/`.
3. American spelling normalization (F-24), trimming `tsh-architect` boilerplate (F-25), moving catalogs out of the two files near 500 lines (F-26).
4. Remaining website items W-11 to W-21 and the CTA, section-CSS and diagram-card duplications; dependency updates (W-21).
5. Resolve or record the spike TODOs (S-15/A-13) and consolidate the duplicated checklists (hooks, memoization) in `src/`.
