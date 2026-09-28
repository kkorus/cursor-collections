# Plan Review: unified-agent-structure.plan.md

| Field | Value |
|---|---|
| Reviewed plan | `specifications/unified-agent-structure/unified-agent-structure.plan.md` |
| Research | `specifications/unified-agent-structure/unified-agent-structure.research.md` (+ `audit/{agents,commands-internal,workflows}.audit.md`) |
| Review date | 2026-09-27 |
| Iteration | 1 |
| Verdict | **REVISIONS NEEDED** |

**Severity mapping.** The caller asked for BLOCKER/MAJOR/MINOR. These map to the reviewer skill's BLOCKER/WARNING/SUGGESTION: MAJOR = WARNING (must be fixed, but does not block by itself), MINOR = SUGGESTION.

**Summary counts:** 2 BLOCKERS, 7 MAJOR, 8 MINOR.

**Overall assessment.** The architecture is sound: a neutral `src/`, a generator, committed native outputs, main-thread orchestrators, and leaf subagents with a return contract. The per-skill table is complete; I verified all 83 rows against `find .cursor/skills -name SKILL.md` and got an exact match. The inventory math also checks out (83 − 11 + 7 = 79; 18 agent files + 65 skill dirs in Phase 2). Two things block approval:

1. The plan has no migration path for existing consumers. Today's documented install symlinks into `.cursor/skills/<category>/`, and this plan deletes that folder.
2. Critical-path naming decisions are still marked open, even though Task 2.1 hard-codes them into every file.

The MAJOR findings cluster around three areas:

- the status loop for commands that route directly to a subagent
- spike coverage of Cursor subagent skill loading
- a Phase 2 check that cannot pass

---

## Challenge Domains

| Domain | Finding |
|---|---|
| **Technology and stack decisions** | No blocking issue. Node ≥ 22 ESM plus `yaml`/`smol-toml` is justified: Node is already present for Docusaurus and `npx` MCP. Bash was rightly rejected. One problem: the installer's `--mode link` reintroduces symlinks, which D2 rejected as unverified for Cursor (R-OQ2). See M7. |
| **Irreversible or high-cost decisions** | **Issue (B2).** The 13 knowledge-skill renames, 2 command renames and 1 command merge are applied mechanically in Task 2.1 and then propagated into every file, the website and the CHANGELOG. OQ3 and OQ4 are still "❓ Open". Reversing them after Phase 3 means redoing the rename pass across about 80 skills and more than 86 doc files. |
| **Contradictions with research / prior context** | **Issue (M1).** D5 says "Claude subagents cannot spawn subagents (AG-X1)". The current Claude docs say the opposite: subagents nest up to 3 layers by default (v2.1.219+, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`). Cursor docs allow one level of nesting since 2.5. Depth 1 is still a valid lowest-common-denominator choice, but the rationale is wrong. The plan also fails to use the native control that follows from the correct facts (`Agent` in Claude `disallowedTools`). The D8 `CLAUDE.md` fallback also contradicts the research on Cursor always applying `CLAUDE.md` (m1). |
| **Scope gaps and silent omissions** | **Issue (B1, M2, M6).** There is no consumer migration or cleanup. Status handling is unspecified for thin commands that route straight to a subagent. Six cross-cutting audit IDs (AG-X7, CI-CC3, CI-CC5, CI-CC8, CI-CC9, CI-CC10, WF-CC5 partially) have no explicit mapping. Most are addressed implicitly, but there is no traceability list, and WF-CC5 (configurable `specifications/` output convention for consumers) is silently dropped. |
| **Cross-cutting decisions that propagate** | **Issue (M3, M4).** The return contract ("never ask the user") is baked into every agent body. It also applies when a user runs the agent as a main-thread persona (`claude --agent`, Cursor `/tsh-architect`), which kills today's interactive persona use. Cursor subagent skill access, on which every leaf agent depends in Cursor, is not in the spike. |
| **Build vs buy vs reuse** | Mostly no issue. Writing a small generator is right, because no existing tool does format translation (the hutchic research shows symlinks only). There is minor over-building in a one-off migration script with idempotency tests, and in lint-baseline machinery that is built in Task 1.11 and deleted in Task 5.2 (m7). Partials (2) and model tiers (4 entries) are justified: the contract is included in 17 agents × 3 outputs, and the tiers are a small table. Hooks are correctly out of scope. |

---

## Decision and Revision History

| Date | Iteration | Decision / Topic | Problem / Challenge | Plan Decision / Change | Status |
|---|---|---|---|---|---|
| 2026-09-27 | 1 | D1 `src/` flat source + `type:` | Checked vs R§1/R§5 (nested discovery, Claude flat layout) | Kept, sound | kept |
| 2026-09-27 | 1 | D2 identical `.agents/skills` + `.claude/skills` | Cursor dup unverified (R-OQ1) | Spike 1.1 + installer minimal-tree; acceptable | kept |
| 2026-09-27 | 1 | Consumer upgrade path | Old `~/.cursor/skills/tsh-*` symlinks dangle, stale old-name skills remain | None in plan → B1 | open |
| 2026-09-27 | 1 | OQ3/OQ4 renames | Open decision on critical path of Task 2.1 | None → B2 | open |
| 2026-09-27 | 1 | D5 depth-1 rationale | Claude docs: nesting allowed (3 layers); Cursor 1 level | Rationale wrong; add native `Agent` deny → M1 | open |
| 2026-09-27 | 1 | Return-contract loop | Only EM specifies NEEDS_INPUT; thin→subagent commands don't | Needs command-side handling → M2 | open |
| 2026-09-27 | 1 | Direct persona use | Contract forbids asking even in main-thread mode | Needs mode clause + docs → M3 | open |
| 2026-09-27 | 1 | Cursor subagent skill access | Leaf agents in Cursor rely on load-by-name inside subagent; not spiked | Add spike question + fallback → M4 | open |
| 2026-09-27 | 1 | Phase 2 "check green" | `check-refs` has no baseline; `../` links survive until 3.47 | Sequencing fix → M5 | open |

---

## Top Failure Modes

1. **Every existing Clone+Symlink consumer breaks on `git pull`, and nothing guides the upgrade (B1).** `website/docs/getting-started/installation.md` and `README.md:82-97` tell users to `ln -sf ~/cursor-collections/.cursor/skills/<cat>/*/ ~/.cursor/skills/`. Task 2.2 deletes `.cursor/skills/`. Those consumers are then left with dozens of dangling `~/.cursor/skills/tsh-*` symlinks. Consumers who copied instead are left with old-name skills: `tsh-code-reviewing` next to the new `tsh-reviewing-code`, and persona skills such as `tsh-architect` whose names now collide with the new `tsh-architect` subagent. That is exactly the skill/subagent clash AG-X6 warns about. The installer "writes and removes only `tsh-*` entries" in the **new** target dirs. It never inspects `~/.cursor/skills` or `<project>/.cursor/skills`. GitHub-import users (today's "recommended" option) silently get whatever Cursor makes of the new layout, possibly nothing.
2. **Commands that route directly to a subagent have no specified status loop (M2).** `/tsh-review`, `/tsh-review-ui`, `/tsh-ask`, `/tsh-debug` and `/tsh-audit-codebase` are thin commands (≤ 30–50 lines) routing to `tsh-code-reviewer`, `tsh-ui-reviewer`, `tsh-architect` or `tsh-software-engineer`. Those agents now return `NEEDS_INPUT`/`BLOCKED` instead of asking. Only EM (Task 3.6) and the cost/infra commands (`NEEDS_ARCHITECT_DECISION`) define what the main thread does next. The BA orchestrator (Tasks 3.20/3.21) and the AI-customization orchestrator (Task 3.26) have no DoD item for handling worker statuses. Re-delegation is also underspecified: Cursor and Claude subagents start with a clean context, so "ask the user, re-delegate" must pass the previous `SUMMARY`/`ARTIFACTS` and the answers. Otherwise the rerun repeats the work from scratch.
3. **Rename churn if OQ3/OQ4 are answered "no" after Phase 2 (B2).** The rename map drives the directories, every body reference, `agent-metadata.json`, the website page renames (Task 4.5) and the CHANGELOG. A late reversal means a full second rename pass.
4. **Phase 2 cannot reach "`npm run check` green" as specified (M5).** Only `lint.mjs` has a baseline. `check-refs` scope A treats `../` links and unresolved names as errors. Migration step 6 rewrites only `../<cat>/<name>/SKILL.md` and category paths. The `../tsh-implementing-frontend/references/react-patterns.md` links (`tsh-writing-hooks:217`, `tsh-reviewing-frontend:217`, `tsh-optimizing-frontend:186`, `tsh-creating-skills/references/common-patterns.md:108`) and the `../../tsh-*/SKILL.md` links in the multi-cloud references (`service-comparison.md:169-170`, `multi-cloud-patterns.md:315`) survive until Task 3.47 or later. Placeholder tokens such as `tsh-my-command`, `tsh-cursor-` and `tsh-copilot-` also fail name resolution.
5. **The Cursor leaf-agent design has an unverified dependency (M4).** In Cursor, `preload-skills` renders nothing: the Cursor agent schema has no `skills` field. Every Cursor subagent must therefore load `tsh-designing-architecture`, `tsh-reviewing-code` and the others by name from inside the subagent. The Cursor docs say only that subagents "inherit all tools… including MCP" and "start with a clean context"; they say nothing about skills. Spike 1.1 Q8 tests loading by name in the **main thread** only. If Cursor subagents cannot see skills, every Cursor delegate runs without its governing knowledge.

## Unproven Assumptions

- **Cursor subagents can discover or load skills.** Not documented, and not in spike 1.1 (M4).
- **Cursor's main agent reliably delegates to a named `.cursor/agents` subagent when a skill instructs it to.** The docs describe `/name` and natural mention. This is only smoke-tested in Task 5.3, not spiked before Phase 2 commits to 17 subagents (M4).
- **"Claude subagents cannot spawn subagents."** This is false per https://code.claude.com/docs/en/sub-agents: the default is 3 layers, and `Agent` must be removed via `disallowedTools` to prevent spawning (M1).
- **The Claude `user-invocable: false` semantics.** The research only states that it "hides from `/`". I checked the Claude docs directly and they confirm the plan's claims: "Subagents can still invoke unlisted project, user, and plugin skills through the Skill tool". Preload cannot target `disable-model-invocation: true` skills, and the plan never does that. D6 is supported, so spike 1.2 Q1/Q2 are confirmations only. The plan should cite the docs.
- **The Claude MCP deny syntax.** It is documented (`disallowedTools: mcp__atlassian` or `mcp__atlassian__*`). The Task 3.23 "only if spike confirms" hedge can become unconditional (m4).
- **Codex.** Subagents are enabled by default (`agents.enabled = true`). The docs say local Codex "delegate[s] when… skill instructions request it", and subagents inherit `skills.config`. This supports D5 for Codex. The docs state no name-format rule, and the examples are snake_case, so spike 1.3 Q1 remains necessary.
- **Codex skill listing budget.** 62 skills against an 8,000-char/2% budget works out to about 130 chars per description. Truncation is near certain. The plan only warns above 500 chars, and assumes `metadata.short-description` is used in the listing, which the research documents only as "parsed" (m5).
- **Codex project `.codex/config.toml` MCP.** Trust gating is supported by the research (R§1) and documented in the Security section. It is fine, but the Task 4.2 `mcp-setup.md` must say it explicitly.
- **Claude `.mcp.json` `type`.** Supported by the research (R§1: "An entry with `url` but no `type` is rejected"). Always emitting `type` is correct.
- **`CLAUDE.md` = `@AGENTS.md`.** Supported by the research as the recommended pattern. Whether Cursor expands the import is correctly spiked (R-OQ4), but the fallback is incoherent (m1).
- **`.cursor/agents` precedence over `.claude/`/`.codex/`.** Supported by the research and the current Cursor docs.

## Most Likely Rework Triggers

1. Consumer bug reports after release: dangling symlinks, duplicate or stale skills, and a persona skill shadowing a subagent (B1).
2. User rejects gerund-first or the command renames after Phase 2 (B2).
3. Spike 1.1 shows Cursor subagents do not see skills. D1's `preload-skills` would then need a Cursor rendering, such as inlining or a body instruction, or the leaf-agent model changes (M4).
4. The first real `/tsh-review` run returns `NEEDS_INPUT` and the thin command has nothing to do with it (M2).
5. Phase 2 PR cannot go green, and the baseline design is patched ad hoc (M5).

## Questions the Architect Must Answer Before Coding

1. What does an existing consumer run to upgrade? Will the installer detect and remove legacy `tsh-*` entries (symlinks or dirs) in `~/.cursor/skills` and `<project>/.cursor/skills`, and old-name `tsh-*` entries in all target dirs?
2. Are OQ3 and OQ4 (and ideally OQ2) confirmed by the user? If not, which parts of Phase 2 can proceed?
3. Are deprecated aliases kept for `/tsh-review-codebase`, `/tsh-analyze-aws-costs` and `/tsh-analyze-gcp-costs` for one release, or is it a hard break?
4. Which component owns `NEEDS_INPUT`/`BLOCKED` handling for commands that route directly to a subagent, and how is prior subagent output carried into the re-delegation?
5. How does an agent behave when it runs as the main conversation rather than as a subagent?
6. What is the `lint-baseline.json` and `check-refs` baseline identity key (rule + file + normalized detail, no line numbers)?

---

## BLOCKERS

### B1. No consumer migration or cleanup for the old layout

- **Evidence:**
  - `README.md:82-97` and `website/docs/getting-started/installation.md` (Option 2) symlink `~/cursor-collections/.cursor/skills/{agents,workflows,commands,internal}/*/` into `~/.cursor/skills/`.
  - Task 2.2 deletes `.cursor/skills/`.
  - Task 2.7 only manages `tsh-*` entries in the new target dirs.
  - `grep` of the plan for `~/.cursor/skills`, "cleanup" and "legacy" finds nothing relevant.
  - Old command names get no alias (OQ3), and website redirects are out of scope.
- **Why blocking:** this is a breaking release for every current user. The failure is silent: dangling symlinks, duplicate old and new skills, and old persona skills with the same names as the new subagents. That last case recreates the AG-X6 clash the plan explicitly designs out.
- **Action:**
  - Add an installer `--migrate` (or default) step that detects legacy entries in `~/.cursor/skills` and `<project>/.cursor/skills`: dangling or old-target symlinks, and dirs whose names are in the rename or delete map. It removes them (with `--dry-run` support) and reports.
  - Add an "Upgrading from ≤ current version" section to `installation.md` and the CHANGELOG, covering the manual `find ~/.cursor/skills -name 'tsh-*' -maxdepth 1 -delete` equivalent and GitHub-import re-import steps.
  - Decide on aliases or deprecation stubs for the renamed commands.
  - Add a smoke check (Task 5.3) that installs over an old-layout fixture.

### B2. Execution-critical open decisions (OQ3, OQ4) sit on the Phase 2 critical path

- **Evidence:**
  - The Open Questions table marks OQ3 (command renames/merge) and OQ4 (13 gerund-first renames) "❓ Open".
  - Task 2.1 hard-codes them in `rename-map.json`, and they propagate into every later task, the website (Task 4.5) and the CHANGELOG (Task 4.8).
- **Why blocking:** the reviewer skill treats unresolved decisions that lock in downstream work as blockers. Reversal cost is very high after Phase 2.
- **Action:**
  - Get explicit user confirmation for OQ3 and OQ4 before Task 2.1, and record it in the Changelog.
  - Alternatively, split Task 2.1 so the move and frontmatter conversion run first, and the rename map is applied only after confirmation.
  - OQ2 (delete cursor-engineer) should also be confirmed before Task 3.26. OQ1 can stay deferred, since it only affects Phase 4.

---

## MAJOR (WARNING)

### M1. The D5 nesting rationale is factually wrong, and no native control is used

- **Evidence:**
  - https://code.claude.com/docs/en/sub-agents: "By default, a subagent can spawn subagents of its own, up to three layers below the main conversation… To keep one subagent from spawning… omit `Agent` from its tools list or add it to `disallowedTools`."
  - https://cursor.com/docs/subagents: nesting allowed, one level, since 2.5.
  - The plan inherited the wrong claim from audit AG-X1.
- **Impact:** depth 1 is still the right portable choice, but the plan relies only on prose (the lint `agent-no-delegation` rule) to stop leaf agents spawning. In Claude, leaf agents can nest by default.
- **Action:**
  - Correct the D5 rationale: depth 1 is chosen as the lowest common denominator, and Codex depth is unknown.
  - Render `Agent` into Claude `disallowedTools` for every agent.
  - Note that Cursor has no equivalent switch.

### M2. The status loop is unspecified outside EM

- **Evidence:**
  - Task 3.6 is the only DoD requiring all four statuses to be handled.
  - The thin commands `/tsh-review`, `/tsh-review-ui`, `/tsh-ask`, `/tsh-debug` and `/tsh-audit-codebase` (Tasks 3.34–3.38) have line caps but no status-handling DoD.
  - The BA (Tasks 3.20/3.21) and AI-customization orchestrator (Task 3.26) rows do not mention `NEEDS_INPUT`/`BLOCKED` from workers.
- **Action:**
  - Add a second partial, for example `caller-status-handling`, that every command with a subagent `routes-to` and every orchestrator must include. It should cover: ask the user on `NEEDS_INPUT`; re-delegate with the prior SUMMARY/ARTIFACTS plus the answers; a max-iteration cap; surface `BLOCKED`; and `NEEDS_ARCHITECT_DECISION` delegating to the architect.
  - Add a lint rule, for example `command-status-handling`, and a DoD item to Tasks 3.21, 3.26 and 3.34–3.38.
  - Require subagents to persist partial work to files in `ARTIFACTS` so re-delegation does not start over.

### M3. The return contract breaks direct and main-thread persona use

- **Evidence:**
  - D5 says "Direct persona use… invoke the subagent directly (`claude --agent tsh-architect`)".
  - With `--agent`, the agent body becomes the main-thread system prompt. The contract still says "never ask the user, return NEEDS_INPUT", so the user gets STATUS blocks instead of a conversation.
  - In Cursor, `/tsh-architect` spawns a subagent that cannot converse at all. Today `@tsh-architect` is an interactive persona, which is a consumer-visible regression.
- **Action:**
  - Add a mode clause to the contract: "If you are the main conversation (no caller), ask the user directly; the STATUS format applies only when delegated."
  - Document the per-tool limitation in `supported-tools.md` (Task 4.2).
  - Consider keeping `/tsh-ask` as the interactive architect entry point, running in the main thread and loading `tsh-designing-architecture`, instead of routing to the subagent.

### M4. The spikes miss the load-bearing Cursor subagent questions

- **Evidence:**
  - Spike 1.1 Q7 covers direct invocation syntax, and Q8 covers loading by name in the main thread only.
  - Nothing tests whether (a) a Cursor subagent can see or load skills by name, or (b) the main agent, following an orchestrator skill, reliably delegates to a *named* `.cursor/agents` subagent.
  - `preload-skills` has no Cursor rendering (the D2 Cursor agent fields are `name`, `description`, `model` and `readonly`).
  - These are checked only in smoke test 5.3, after Phases 2–4.
- **Action:**
  - Add Q10/Q11 to spike 1.1, and a Codex equivalent to spike 1.3 Q8: "from inside a subagent".
  - Define the fallback before Phase 2. For example, if Cursor subagents cannot load skills, the Cursor agent renderer inlines the `preload-skills` bodies or emits an explicit "read `.agents/skills/<name>/SKILL.md`" line in the Cursor rendering only.

### M5. Phase 2 "`npm run check` green" is unreachable as sequenced, and the baseline design is underspecified

- **Evidence:** `check-refs` has no baseline (Task 1.12), and its scope A errors on `../` links and unresolved names. The following survive migration step 6:
  - `../tsh-implementing-frontend/references/react-patterns.md` in 4 files
  - `../../tsh-*/SKILL.md` in 3 multi-cloud reference lines
  - placeholder tokens `tsh-my-command`, `tsh-cursor-` and `tsh-copilot-`
- **Additional gaps:**
  - The lint baseline identity key is not defined. If `detail` or keys include line numbers, every Phase 3 edit makes unrelated entries "stale" and fails the check.
  - A single `lint-baseline.json` edited by about 55 tasks is a merge-conflict hotspot if tasks are parallelized.
- **Action:**
  - Either extend migration step 6 to rewrite all cross-skill `../` links to "the `<name>` skill" (the react-patterns target can point to `tsh-implementing-frontend` until Task 3.47), or give `check-refs` the same baseline mechanism.
  - Add a placeholder allowlist (`tsh-<…>`, `tsh-my-*`, prefix mentions such as `tsh-cursor-`).
  - Specify the baseline key as `{rule, file, normalized detail}` with no line numbers.

### M6. There is no explicit audit-finding traceability

- **Evidence:**
  - The plan references AG-X1–X6 and X8, CI-CC1/2/4/6/7/11/12, and WF-CC1–6.
  - It never names AG-X7, CI-CC3, CI-CC5, CI-CC8, CI-CC9 or CI-CC10.
  - Most are covered implicitly (D5 covers CC3, `routes-to`/`standalone` covers CC5, the D2 `$ARGUMENTS` rule covers CC8, Task 3.33 and the README cover CC9, OQ11 and Task 2.5 cover X7/CC10).
  - WF-CC5 (the hardcoded `specifications/` output paths should be a named, configurable convention for consumers) has no task. Task 3.x instead adds more fixed paths (`specifications/cost-audits/`, `specifications/code-quality/`).
- **Action:**
  - Add a short "Audit cross-cutting → task / dropped (reason)" table.
  - Either handle WF-CC5 (for example, one sentence in AGENTS.md or `tsh-discovering-technical-context`: "default `specifications/`, override if the project has its own convention") or drop it explicitly with a reason.

### M7. The installer `--mode link` contradicts the D2 symlink rejection

- **Evidence:**
  - D2 rejects symlinks because Cursor symlink handling is unverified (R-OQ2) and Windows `core.symlinks=false`.
  - D3 and Task 2.7 still offer `--mode link` as the "keep today's `git pull` workflow" path, without gating it on spike 1.1(b).
  - Today's broken-upgrade problem (B1) is itself a symlink problem.
- **Action:**
  - Gate `link` mode on the spike 1.1(b) result. Make `copy` the default.
  - Add an `install.mjs --update` that re-copies and prunes, so copy-mode users also get a one-command update.

---

## MINOR (SUGGESTION)

- **m1. The D8 fallback is incoherent.** The fallback "`.cursor/rules/tsh-agents.mdc` with `alwaysApply: false`, and `CLAUDE.md` inlining the content" guarantees double application in Cursor. Cursor reads AGENTS.md natively and always applies CLAUDE.md (R§1). If Cursor does *not* expand `@AGENTS.md`, the one-line CLAUDE.md is harmless. If it does, the duplicate is about 150 lines. Accept the duplication, or use Claude's `claude-md-and-agents-md` setting / AGENTS.md-only reading as the fallback.
- **m2. The Codex hyphen → underscore fallback (OQ6) breaks name references.** `.agents/skills` bodies are shared with Cursor and say "the `tsh-code-reviewer` subagent". If Codex names become `tsh_code_reviewer`, orchestrator instructions in Codex point at a non-existent agent. The fallback must also render a Codex-specific body, or add a mapping line in AGENTS.md.
- **m3. The Codex limitations are not documented.** Codex cannot hide internal or orchestrator skills (D6: implicit allowed), so they show in `$`/`/skills` and can be auto-invoked. Task 4.2 lists only the Cursor `/` visibility limitation. Add Codex. Also consider "Load only when instructed by a `tsh-*` command" wording in orchestrator descriptions, to limit auto-invocation in Cursor and Codex.
- **m4. The least-privilege claims overreach.** Claude `disallowedTools: [Write, Edit, NotebookEdit]` still leaves `Bash` for read-only agents with `shell: true` (`tsh-ai-customization-reviewer`), so they can write via the shell. Codex `sandbox_mode = "read-only"` and Cursor `readonly` do not obviously restrict MCP write tools. The Claude `mcp__atlassian` deny syntax is documented, so make the BA-worker Atlassian deny unconditional. Soften the Security section for Cursor and Codex MCP.
- **m5. The Codex listing budget is not enforced.** Make `metadata.short-description` required, not just added in Task 3.2, and add a lint budget check: the sum of descriptions against about 8,000 chars. Spike 1.3 Q7 should record which field Codex actually lists.
- **m6. The `agent-no-delegation` lint will false-positive.** It forbids "subagent" in agent bodies, but `tsh-ai-customization-{creator,reviewer,researcher}` and `tsh-prompt-engineer` legitimately discuss subagents as subject matter. Add a per-rule allowlist like `no-tool-syntax` has.
- **m7. There is minor over-building.** The one-off migration script carries idempotency tests. The lint baseline code path is built (Task 1.11) and then removed (Task 5.2). A simpler path is a baseline file only, deleted in Task 3.55, with the "stale entry" check kept permanently, since it costs nothing once the baseline is empty. This is survivable and not blocking.
- **m8. There are forward dependencies inside Phase 3.**
  - Task 3.26 deletes `tsh-cursor-engineer` "after moving the SoC model to 3.28/3.29", but 3.26 runs first.
  - Task 3.15 moves the LLM heuristic that "lands in 3.34".
  - Task 3.1 rewrites `@tsh-x` to "the `tsh-x` subagent", which is wrong for the 3 orchestrators (they are skills).
  - Fix: reorder (3.28/3.29 before 3.26) or merge the dependent tasks, and special-case orchestrator names in the 3.1 script.

---

## Verdict

**REVISIONS NEEDED.** Resolve B1 (the consumer migration path) and B2 (confirm OQ3/OQ4 before Task 2.1). Address M1–M7 in the same revision; M2, M4 and M5 are cheap now and expensive after Phase 2. The per-skill coverage, the inventory math, and the MCP, root-instruction and precedence decisions are well grounded, and they need no rework.

---

# Iteration 2

| Field | Value |
|---|---|
| Reviewed plan | `unified-agent-structure.plan.md` (Revision 1, 2423 lines) |
| Review date | 2026-09-27 |
| Iteration | 2 of max 3 |
| Verdict | **APPROVED** |

**Summary counts (iteration 2):** 0 BLOCKERS, 2 MAJOR (new, non-blocking), 5 MINOR (new). All iteration-1 findings are resolved; see below.

The user decisions recorded in Revision 1 are authoritative and are not challenged here:

- OQ3: renames and merge, with no aliases
- OQ4: gerund-first names
- OQ12: dual mode for agents
- OQ1: the product name "TSH AI Collections"
- OQ2: delete `tsh-cursor-engineer`

## Verification of iteration-1 findings

| ID | Iteration-1 finding | Where addressed in Revision 1 | Result |
|---|---|---|---|
| B1 | No consumer migration | D3 legacy cleanup: scans `~/.cursor/skills`, `<project>/.cursor/skills` and the target dirs. Rule (a) removes dangling or old-category symlinks. Rule (b) matches names in `scripts/legacy-names.json`: old names, deleted names and the 17 personas. Real dirs are moved to a backup, never deleted; `--dry-run` and `--migrate-legacy` are supported. The docs add `upgrading.md` plus README and CHANGELOG sections. Task 2.7 adds an old-layout fixture test, and spike 1.1 Q13 covers ghost entries. | **Resolved** for the documented symlink install. A residual gap for copied dirs with unchanged names is raised as N1. |
| B2 | OQ3 and OQ4 open on the critical path | Open Questions 1–4 are resolved by the user, and the Changelog records them. | **Resolved** |
| M1 | Wrong nesting rationale; no native control | D5 rationale corrected with the Claude docs URL. Claude `disallowedTools` always includes `Agent` (D2, Task 1.8 test). Spike 1.2 Q9 and spike 1.3 Q10 cover Claude and Codex enforcement. | **Resolved** |
| M2 | No status loop outside EM | The `caller-status-handling` partial covers the delegation template, per-status handling, a missing-status rule, `PRIOR_OUTPUT`/`USER_ANSWERS` and a cap of 3. It is included by the 3 orchestrators and the 7 agent-routed commands, and a lint rule enforces it. | **Resolved** |
| M3 | Contract breaks persona use | The `agent-modes` partial: interactive by default, delegated only when the first line is exactly `MODE: delegated`. `/tsh-ask` runs in the main thread. Spike 1.1 Q12 checks Cursor multi-turn use. | **Resolved** (see N4 for one edge) |
| M4 | Cursor subagent skill access not spiked | Spike 1.1 Q10/Q11 (skills inside a subagent, named handoff, verbatim `MODE` line) and spike 1.3 Q9. Adds the "Required skills" body line and the `inlinePreload` fallback. | **Resolved**; the fallback has a defect (N2) |
| M5 | Phase 2 check unreachable; baseline key | Migration step 6 rewrites every `../` link, and Task 2.8 asserts `refs.jsonl` has no `../` entries. A placeholder allowlist is added. `refs.jsonl` gets a baseline. Keys are `{rule, file, key}` with no line numbers, and a test proves that inserting lines above a finding does not invalidate its entry. | **Resolved** (see N5) |
| M6 | No audit traceability | The "Audit cross-cutting findings → resolution" table (plan §682). WF-CC5 is handled in Tasks 3.52 and 3.6. | **Resolved** |
| M7 | `--mode link` vs the D2 symlink rejection | Copy is the default. `--mode` ships only if spike 1.1(b) approves it, with a test asserting the error otherwise. `--update` with a manifest is added. | **Resolved** |
| m1 | D8 fallback incoherent | The fallback is now "delete CLAUDE.md", relying on Claude's native AGENTS.md reading. | Resolved |
| m2 | Codex `_` mapping breaks references | Codex `description` says "referred to as `tsh-x`", and the bodies are unchanged. | Resolved (acceptable) |
| m3 | Codex visibility not documented | D6 limitation for both tools, plus an "Internal step of …" description prefix. | Resolved |
| m4 | Least-privilege overclaims | The limits are stated, and the Atlassian deny is unconditional. | Resolved |
| m5 | Listing budget | Required `short-description`, plus a `listing-budget` lint tuned by spike 1.3 Q7. | Resolved |
| m6 | `agent-no-delegation` false positives | A per-rule allowlist. | Resolved |
| m7 | Baseline build-then-remove | Task 3.55 deletes the baseline files, and the code stays. | Resolved |
| m8 | Phase 3 forward dependencies | Reordered to 3.26 creating-skills → 3.27 creating-agents (+SoC) → 3.28 orchestrator + engineer deletion → 3.29 workers. The LLM heuristic moves in 3.15. The per-skill "Tasks" columns (rows 9, 17–21, 54, 57) and the traceability table match the new numbering. | Resolved (verified) |

## Challenge Domains (iteration 2)

| Domain | Finding |
|---|---|
| Technology and stack | No issue. Unchanged and sound. |
| Irreversible or high-cost decisions | No issue. The rename decisions are confirmed by the user, so the reversal risk is gone. |
| Contradictions with research | No issue. The D5 and D6 claims now cite the docs, and I found no new contradiction. |
| Scope gaps | **N1:** legacy cleanup misses copied dirs whose names did not change. |
| Cross-cutting propagation | **N2:** the `inlinePreload` fallback hard-codes the `.agents/skills` path, but the installer may not install that tree. **N4:** interactive mode inside a Claude subagent. |
| Build vs buy | No issue. The manifest and backup logic is proportionate to the upgrade problem. |

## New findings

### MAJOR (non-blocking)

**N1. Legacy cleanup does not catch copied old-layout dirs whose names are unchanged.**

- **What the rule does:** rule (b) matches only names in `legacy-names.json` (old, deleted and persona names). Rule (a) matches only symlinks.
- **What it misses:** a user who **copied** (rather than symlinked) the old tree into `~/.cursor/skills/`, or who has a live symlink into another stale clone. Unchanged names such as `tsh-committing` or `tsh-implementing-backend` survive as real dirs with the old content, including the `.cursor/skills/...` path references.
- **Why it matters:** Cursor then lists both `~/.cursor/skills/tsh-committing` (stale) and `~/.agents/skills/tsh-committing` (new).
- **Action:** the new layout never installs anything into a `.cursor/skills` dir. So treat **every** `tsh-*` entry directly under `~/.cursor/skills` and `<project>/.cursor/skills` as legacy: back it up if it is a real dir, remove it if it is a symlink. Keep rule (b) only for the target dirs (`.agents/skills`, `.claude/skills`).
- **Also:** scan one level of category subfolders (`<project>/.cursor/skills/{agents,commands,workflows,internal}/tsh-*`) for projects that copied the whole `.cursor/` tree. Report them, and move them only with `--migrate-legacy`.
- **Test:** add a copied `tsh-committing` to the Task 2.7 old-layout fixture.

**N2. The `inlinePreload` fallback rewrites links to `.agents/skills/<name>/references/...`, a tree the installer may not install.**

- **Why it breaks:** for the recommended "cursor + claude" combination, D2 installs `.claude/skills` only. User scope uses `~/`, not relative paths. So if spike 1.1 Q10 triggers the fallback for Cursor, every inlined reference link in `.cursor/agents/*.md` dangles in that install.
- **Side effect:** the fallback also reintroduces path-based loading, which D6 bans.
- **Action (either works):**
  - Inline the referenced `references/*` content as well, which keeps the agent self-contained.
  - Or make the installer rewrite the link prefix to the tree it actually installed, with a test for the cursor+claude row.
- **Also:** state that `no-path-refs` is exempt only for generated inline renderings.

### MINOR

- **N3. `--update` pruning and `--force` overwrite delete real dirs without a backup.** Only the legacy cleanup backs up. A user who edited an installed copy loses the edits on prune or force. Route both through the same backup move.
- **N4. Interactive mode inside a Claude subagent.** Claude removes `AskUserQuestion` from subagents (sub-agents docs). If a user says "use the tsh-architect agent", Claude spawns it as a subagent without the `MODE` line, so it is "interactive" but cannot ask. Add to `agent-modes`: "If you have no way to ask the user, end your reply with your questions and stop." Codex and Cursor subagents may behave the same way, per spike Q12.
- **N5. Baseline counts are ambiguous.** "Repeated identical matches collapse into one entry with a count" does not say whether the count is compared. Specify that a lower count rewrites the entry (the shrink is allowed and must be committed), and that a higher count is an error. Otherwise partial fixes either fail as "stale" or new duplicates slip through.
- **N6. The backup move is not portable.** Moving to `~/.tsh-ai-collections-backup/` fails across filesystems (`EXDEV`) when a project is on another volume. Implement copy-then-remove with verification, and add a test.
- **N7. The `MODE` marker is not verified for Codex.** Spike 1.3 Q9 checks the named spawn, but not that the delegation prompt reaches the agent verbatim with `MODE: delegated` as the first line. Cursor Q11 asks this; mirror it for Codex.

## Decision and Revision History (iteration 2 rows)

| Date | Iteration | Decision / Topic | Problem / Challenge | Plan Decision / Change | Status |
|---|---|---|---|---|---|
| 2026-09-27 | 2 | Consumer upgrade (B1) | Old symlink layout breaks | Installer legacy cleanup + backup + upgrade docs | resolved |
| 2026-09-27 | 2 | OQ3/OQ4 (B2) | Open on the critical path | User confirmed; no aliases | resolved |
| 2026-09-27 | 2 | D5 nesting (M1) | Wrong rationale | Corrected; Claude `Agent` deny | resolved |
| 2026-09-27 | 2 | Status loop (M2) | Only EM handled statuses | `caller-status-handling` partial + lint | resolved |
| 2026-09-27 | 2 | Persona use (M3) | Contract blocked conversation | `MODE: delegated` dual mode | resolved |
| 2026-09-27 | 2 | Cursor subagent skills (M4) | Not spiked | Spike Q10/Q11 + `inlinePreload` fallback | resolved; fallback path gap → N2 |
| 2026-09-27 | 2 | Phase 2 check (M5) | refs had no baseline | jsonl baselines, line-free keys, `../` rewrite | resolved |
| 2026-09-27 | 2 | Legacy copies (N1) | Same-name copied dirs survive | Treat all `tsh-*` under `.cursor/skills` as legacy | open (major) |
| 2026-09-27 | 2 | inlinePreload links (N2) | Hard-coded `.agents/skills` path | Inline refs or installer-side rewrite | open (major) |

## Verdict (iteration 2)

**APPROVED.** No blockers remain, and no execution-critical decision is open. OQ5 and OQ6 are spike-gated in Phase 1 with defined fallbacks. N1 and N2 are local to Task 2.7 and to a conditional renderer fallback, so fix them while implementing those tasks. N1 must be fixed before the installer ships.
