# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 2026-09-06 (follow-up to the CodeRabbit PR #1 review response — the naming rule still asserted the prefix absolutely in two places)

### Fixed

- **Two statements in the naming rule still asserted the `tsh-` prefix absolutely, after an earlier fix in the same batch had already carved out exactly two exemptions** (A15, `.cursor/rules/tsh-naming-conventions.mdc` and its byte-identical mirror `.cursor/rules/imported/cursor-collections/tsh-naming-conventions.mdc`). The `description` frontmatter said the rule "Ensures all skills, rules, and commands use the tsh- prefix"; it now reads `The tsh- prefix applies to skill directory names and rule filenames, with named exceptions recorded in this rule.` The section heading `## Cross-references must use prefixed names` now reads `## Cross-references use prefixed names, except for the named exceptions`, so the carve-out is visible at the heading rather than only inside a bullet of a different section. **Both edits refer to the exceptions generically**, so the exception list stays single-sourced in `## Named exceptions`, which is unchanged. Both copies changed together and remain byte-identical (`md5sum` `cc8cbd17fae64f06b30d1acbe1d79074` on each), and nothing was renamed — the `30c1d60e7dc7cff6d5f7f8740a5264d9` published for A12 was the hash of both copies at that commit and is superseded by this change rather than contradicted by it
- **Why a `description` line is load-bearing here rather than cosmetic, and this is the point of the entry.** The rule carries `globs: .cursor/**` with `alwaysApply: false`, so it is auto-attached whenever a `.cursor/` file is in context, and Cursor surfaces a rule's `description` as the summary an agent uses to decide relevance — this repository's own `tsh-creating-rules` documents both mechanisms. An agent could therefore act on the description alone, never read down to `## Named exceptions`, conclude that the vendored `playwright-cli` skill violated the rule, and "fix" it by renaming the directory or prefixing its `name:` frontmatter — the exact rename this whole review response exists to prevent, and the remedy the user explicitly declined. The failure mode of leaving it was a rule that instructs a future agent to undo an earlier fix in the same batch. **This finding came from this repository's own code review of the batch rather than from CodeRabbit**, so it closes none of CodeRabbit's findings and leaves the disposition arithmetic in the entry below untouched

## 2026-09-05 (CodeRabbit PR #1 review response — the 17 accepted findings, closed by 14 plan items)

### Fixed

- **Credential and path handling — five items (A8, A9, A10, A11, A14), and the reason this batch was prioritized ahead of everything deferred.** These five are the security-relevant ones: two of them put live credentials at risk of execution or of being committed, one handed a secret to a page whose origin was never checked, one could relocate screenshots of the signed-in application out of ignored scratch space into tracked space, and one shipped a copy-paste example carrying both defects to any project that copied it. Nothing here is a product-code change — this repository ships instruction text, so a defect in the text is the defect
- **`.env` was *executed* rather than parsed** (A8, `.cursor/skills/workflows/playwright-cli/SKILL.md`). The documented loader was `set -a` / `source .env` / `set +a`. `source` runs the file as shell, so a command substitution or a function definition sitting in a credential file would execute with the worker's privileges — the documented threat model was disclosure only, which is why the hole was there at all. The file is now read as **data**: a `while IFS='=' read` loop over `grep -E '^TSH_UI_LOGIN_[A-Z0-9_]+='`, exporting only that contract and nothing else. Its five limitations are written down rather than implied away — surrounding quotes are not stripped, multi-line values are unsupported, an `export ` prefix is skipped, no escape processing happens, and the process-substitution form needs `bash` — and a credential that needs any of them is directed to the storage-state path instead of silently arriving truncated
- **`.gitignore` did not cover `.env` at all** (A10), while four files in the auth chain instruct the user to fill that exact file with live login credentials. The only env rule present was `.env*.local`, which matches neither `.env` nor `.env.production`. Ignore rules now cover `.env` and `.env.*`, plus the authenticated-session / storage-state artifacts the same documentation tells users to create — `auth.json`, `*-auth.json`, `*auth-state.json`, `*session.json`, and `storage-state-*.json`. Verified with `git check-ignore -q` on each of `.env`, `.env.production`, `.env.local`, `auth.json`, `my-auth.json`, `my-auth-state.json`, `my-session.json`, and `storage-state-1730000000000.json`, and `git ls-files | git check-ignore --stdin | wc -l` is `0`, so no tracked file became ignored as a side effect. Separately, `references/storage-state.md` told readers to add `*.auth-state.json`, which matches **none** of the filenames used on that same page; it now tells a consuming project to add rules that actually match the state filenames it uses, and says outright that the old narrower rule must not be relied on
- **Secret selection had no origin binding whatsoever** (A9). The env var name is derived from page-controlled fields (`name` → `autocomplete` → `id` → visible label text) and the value is handed back to the page through `fill`, with the login page reached by an unchecked redirect — so the skill's existing "only credentials the user provided **for this task**" rule had nothing to make it satisfiable. The origin (scheme, host, port) of the user-confirmed URL is now recorded once per session as the **authorized origin**, and the current page origin *after all redirects* is compared against it **before** deriving any field key, **before** reading any `TSH_UI_LOGIN_*` variable, and **before** any `fill`. A mismatch is a blocker raised to the user with the observed origin, not a silent refusal, so a cross-origin SSO chooser, MFA challenge, or captcha stays reachable — but only on explicit authorization recorded for the session. The rule that makes this necessary is stated in the text: `TSH_UI_LOGIN_` is a **naming convention, not an allowlist**, so the origin binding plus per-form request-scoping is what actually constrains which secret can reach a page. Landed in four coupled files — `playwright-cli/SKILL.md`, `tsh-ui-verifying/SKILL.md`, `tsh-ui-capture-worker/SKILL.md`, and `tsh-orchestrating-implementation/SKILL.md` — and the four-step derivation precedence is unchanged
- **The verification artifact root was built by string concatenation from an untrusted identifier, with a documented caller override that bypassed the prefix entirely** (A11, `tsh-ui-verifying/SKILL.md`). `VERIFICATION_ID` is substituted straight into `specifications/$VERIFICATION_ID/ui-verification` and can reach a worker from a generated plan file. It is now treated as a single path segment and **refused** — not sanitized, not rewritten — when it contains a `/`, a `\`, a `..` segment, a leading `~`, an absolute path, or a newline, which is the same threat model and the same remedy `tsh-resolving-skill-references` already applies to a requested skill name. A caller-supplied `UI_VERIFICATION_DIR` is canonical only if it still resolves inside the repo-root `specifications/` tree after normalization; an absolute path inside that tree stays valid, so the capability is bounded rather than removed. This matters because `specifications/` is gitignored: a root that escapes it moves screenshots of the **authenticated** application into tracked, committable space
- **A copy-paste login example hardcoded two literal credential values and wrote the authenticated session into the working directory** (A14, `references/running-code.md`). That snippet was the file's only `.fill(` site and passed a literal string at each of its two calls, then called `storageState` with a bare relative filename resolved against whatever directory the reader happened to run from. Both `.fill(` calls now read from the `TSH_UI_LOGIN_*` contract the same skill already mandates, the session file is written outside the repository working tree, and a closing line points the reader at the corrected consuming-project ignore guidance. The two literal credential values in that copy-paste login example are removed, and they are named nowhere in this entry. This half was live even after the ignore fix above, because `running-code.md` is guidance a consuming project copies and this repository's `.gitignore` does not travel with it
- **Control flow that contradicted itself — five items (A4, A5, A6, A7, A13),** each a pair of instructions in one lineage that could not both be followed. **A4:** `networkidle` was forbidden outright by the e2e lineage while the capture path mandated it. Resolved by scoping both statements rather than picking a winner, because they govern different mechanisms — authored test code has auto-waiting assertions that retry, one-shot evidence capture across arbitrary pages has no assertion to retry and no page-independent readiness signal. The capture path keeps `networkidle` but demoted to a **bounded, non-fatal best-effort**: an explicit 5000 ms timeout, the throw caught, a fall-through to the weaker bounded `load` state, and a `stabilization: degraded` log line as the signal, since both waits are swallowed and the command exits `0` either way. The exit-code table now names a step-5 stabilization timeout as neither a blocker nor an escalation — it does not produce `VERIFICATION NOT RUN` and does not consume an iteration of the verification budget. `spec-driven-testing.md` gained the scope qualifier so its prohibition no longer reads as a global ban the capture path violates; the three e2e mirror sites are deliberately unchanged, each already being scoped by the test-standards table it sits in. `running-code.md` also stops listing `networkidle` **first** inside the single `## Wait Strategies` fence, because first position there reads as the default. **A5:** the confidence gate in `tsh-implement-ui` was defined *after* the step that had already dispatched the fix; it is now read before dispatch, and a LOW-confidence pause is explicitly not an iteration, not `VERIFICATION NOT RUN`, and not `ESCALATED` — the old "continue with next component or escalate" fallback would have authorized exactly that. `ESCALATED` still requires the user's explicit acknowledgement at the five-iteration gate. **A6:** "report first" and "ask first" were mutually exclusive in `tsh-ui-reviewer` and `tsh-review-ui`; the report is now always emitted and never withheld pending an answer, the question travels inside its `### Blocker Resolution` section, and invocation mode decides who the question is put to — direct-user mode asks and records `User asked: yes`, subagent mode returns the identical report to the caller and records `User asked: no`. The content/data/state clarification gate got the same mode split and stays `FAIL` pending clarification rather than being downgraded to `VERIFICATION NOT RUN`. **A7:** `tsh-devops-engineer` carried a default fallback that selected a stack when `tsh-architect` was unavailable — the exact decision three other lines in the same file reserve for the architect. It now names the failed condition, selects no stack, and asks, spelling out the options. **A13:** `spec-driven-testing.md` called the scenario loop "safe to parallelise due to unique generated session names" while two other lines in the same file forbid parallelism and name the shared seed session and the single CLI session as the reason. Unique session names bound session-name collision, not shared state, so the outlier was corrected toward wording the file already carried twice
- **Text that was factually wrong — three items (A1, A2, A3).** **A1:** the generated-test template in `spec-driven-testing.md` imported `from './fixtures'`, a specifier that cannot resolve from a test at `tests/<group>/<name>.spec.ts`; it is now `'../fixtures'`, and the rule states the fixture file's path so the specifier is derivable rather than memorized. **A2:** four published pages described this repository's own Cursor artifacts as Copilot files and named an artifact type that does not exist here — a "Prompt" row with a `/SKILL.md` shape, and an `.rules.mdc` extension nothing carries. They now name command skills at `commands/<name>/SKILL.md` and `.mdc` rules. **A3:** the Figma reference image path was stated two incompatible ways, the iteration directory on the published pages against the shared verification root (`$FIGMA_EXPECTED`) in the skill that actually writes it; the pages now match the skill

### Changed

- **The naming rule was corrected rather than the tree renamed** (A12). The rule's heading claimed a `tsh-` prefix on "all artifact filenames" while all five of its own bullets prefix the *directory* and leave the filename bare, and a large number of tracked `.md` files under `.cursor/` violate it as literally written. Per the user's decision the rule was fixed, not the tree: the prefix applies to skill **directory** names in all four layers and to rule **filenames**, and not to the literal `SKILL.md` (fixed by Cursor), not to in-skill support files (`references/`, `assets/`, `examples/`, `*.template.md`, `*.example.md`), and not to config files. A new `## Named exceptions` section names exactly two and says a third requires editing the rule: **`playwright-cli`, recorded as a vendored third-party skill retained at its upstream name so upstream syncs stay diffable** — the exception covers its directory, its `name: playwright-cli` frontmatter, and its unprefixed `references/*.md` — and `.cursor/rules/cursor-instructions.md`, whose name is fixed by convention. **No directory was renamed and no `git mv` was run:** `git diff --name-status` contains no `R` entry. The rule exists in two copies and both changed together, still byte-identical afterwards (`md5sum` `30c1d60e7dc7cff6d5f7f8740a5264d9` on `.cursor/rules/tsh-naming-conventions.mdc` and `.cursor/rules/imported/cursor-collections/tsh-naming-conventions.mdc`), and `cursor-instructions.md`'s own `## Naming` section was brought into line and now points at the exceptions

### Notes

- **Disposition of all 43 findings CodeRabbit filed on PR #1 at `7dc0d1a`, stated at both count levels because merging the two levels is what made the plan wrong once already.** A **finding** is one CodeRabbit inline comment; a **plan item** is one unit of work. The two numbers are not the same number and are not interchangeable. **17 findings accepted**, closed by **14 plan items** (A1-A14) — they differ by three because three items each close two findings: A4 closes the same `networkidle` split twice over, once as the mandate on the capture path and once as the token presented as the default wait strategy; A6 closes both the report-vs-ask ordering and the subagent clarification route, since the single report-plus-embedded-question emission settles both; and A12 closes both the prefix rule contradicting its own exceptions and the request that `playwright-cli` be renamed — that second one closed with an alternate remedy, the named vendored-third-party exception, rather than with the rename it asked for, recorded as accepted-with-alternate-remedy so the count is auditable in both directions. **7 invalid**, each with its premise falsified by the very file the finding cited. **2 refused** by explicit user decision. **17 deferred** — real, but not this delivery. **17 + 7 + 2 + 17 = 43.** The 43 comprise 29 Major, 13 Minor, and 1 Trivial, numbered in the order they appear in the review body. The per-finding rationale — which file falsifies which premise, what was refused and why, and what each deferred finding still needs — lives in the implementation plan rather than being reproduced here, one entry per finding. That plan is gitignored, so **these four numbers are the only public record of how the 43 were dispatched**, which is exactly why they are copied from the plan's canonical disposition table and were not recomputed while writing this entry
- **What was actually verified, and what was not.** `npm --prefix website run build` succeeds. `bash scripts/count-skills.sh` still reports 25 agents / 17 commands / 39 workflows / 12 internal / 93 total, all five compared individually — and that script counts directories without inspecting their names, so it is an add/remove guard and says nothing about renames; the no-rename claim above rests on `git diff --name-status` instead. The `disable-model-invocation` inventory is unchanged at **43 keys over the glob `.cursor/skills/*/*/SKILL.md` and 44 over the glob `.cursor/**/*.md`**, both by frontmatter-block extraction with the pattern `^disable-model-invocation:`; the same extraction yields `0` for each of `^model:`, `^tools:`, and `^agents:`. None of `README.md`, `code-quality-report.md`, or `.cursor/skills/workflows/tsh-migrating-copilot-to-cursor/SKILL.md` was touched. **There is no test framework, no e2e suite, no linter, and no CI in this repository:** the documentation-site build is the only executable gate, so no tests were run and none are claimed — everything else is a deterministic text or tree assertion. **No credential value, real or example, is introduced by this delivery, and none is named in either changelog entry** — the only place any such value appears in the diff is the deletion side of the hunk that removes it

## 2026-09-05 (record correction — upstream is reachable, so two published notes and one closed finding were wrong)

### Added

- Two Cursor-customization rows in `tsh-orchestrating-implementation`'s `## Task-to-Owner Routing` table, closing the item the entry below published as **"Open, not fixed"**. A bounded change to a single customization artifact routes to `tsh-cursor-engineer` as the DEFAULT; work spanning several artifacts, or needing research → create → review phases, routes to `tsh-cursor-orchestrator` as the EXCEPTION. Both name `tsh-creating-agents`, `tsh-creating-skills`, `tsh-creating-commands`, or `tsh-creating-rules`, matched to the artifact type, and both describe the artifacts by type — agent, workflow, command, and internal skill files, and project rule files — never by layer path, because the routing table is delegation text. The table goes from 12 to 14 data rows and the two `[REUSE]` rows are still last. **This is a deliberate fork divergence and is recorded as one so the next upstream sync reads it as intentional rather than as drift to reconcile away:** upstream's routing table has no Copilot-artifact row either — read at upstream `main` through `gh api`, it carries the same 12 data rows and the word "customization" appears nowhere in the file — so the gap is inherited, and closing it is a fork decision rather than a fidelity fix
- An escalation pointer in `tsh-cursor-orchestrator` — one sentence stating that work needing an implementation plan, a plan review, or Human approval is routed to the implementation-delivery route through `tsh-engineering-manager` rather than delegated from there. This is the **`option (iii)`** branch of the PR #77 roster question, chosen by the user at the plan-authoring approval gate; the roster note below records what was declined and why

### Fixed

- Two surfaces still asserted a model binding their source does not have — the two residuals of PR #77's "a prompt routes to an agent; model selection is inferred from that agent" reframing **that the sweep's pattern could reach**, not the last such residuals: an exhaustive enumeration over the token `\bmodels?\b`, hand-classified line by line, puts the family at three surviving sites, and the bullet below names all three. The #77 port commit `321c149` applied that reframing to some sites and not others. `tsh-create-custom-command` instructed every future command author that "Every command skill must specify an agent routing and model preference in its frontmatter", where **both halves were false**: frontmatter across all 17 command skills carries exactly `name`, `description`, and `disable-model-invocation`, so there is no model preference *and* no agent routing there — and line 41 of that same file already stated the opposite about routing ("Every command MUST reference an agent in its **body**"). `website/docs/agents/engineering-manager.md` said `/tsh-implement` routes to the agent "using the same shared model array", thirteen lines after the same page had already published the ratified statement that model selection is a session-level concern in Cursor, handled per worker at delegation time and not bound by the artifact — so the page contradicted itself. Both now carry the ratified wording, and the sweep `grep -rno 'model array\|model preference' --include='*.md' .cursor website/docs README.md | wc -l` goes from `2` to `0`
- **That `0` is true and incomplete, and the shortfall is disclosed rather than quietly closed — but the first disclosure of it was itself built the wrong way, and that is the finding.** **Three** surfaces in this family survive, not one — the family being a surface that asserts a model binding its own source disclaims. Two of the three are semantically identical to each other, the *same taxonomy bullet* asserting the same false artifact–model coupling in different words: `.cursor/skills/agents/tsh-cursor-engineer/SKILL.md:47` ("routes work to a specific agent and model") and `.cursor/skills/agents/tsh-cursor-orchestrator/SKILL.md:77` ("routes to agent + model"). The third is the same defect in a different construct — where those two bind an *artifact* to a model, it binds *workers* to models — and that difference is exactly why a pattern built for the other two could not see it: `.cursor/skills/commands/tsh-analyze-materials/SKILL.md:62` tells every reader that "The BA orchestrator may route transcript cleanup, analysis, extraction, quality review, and formatting to internal model-specialized BA workers" — a model binding the agent it describes disclaims in terms, because `.cursor/skills/agents/tsh-business-analyst/SKILL.md:20` reads "Model selection is handled at the Cursor session level per worker — do not hardcode model names here." The sweep's pattern sees **none of the three** — `grep -o 'model array\|model preference'` reports `0` on each of those three files — so the `0` that certifies the fix above is blind to all of them. All three are pre-existing, verified at `c814d78`, so **none is a regression of this round**; all three are deliberately left in place, the same disposition for each, because fixing any of them would widen an already-approved scope — and all three are recorded as out of scope in the plan's `## Improvements`, the latter two added after the independent review found them (the plan numbers them the **third, fourth, and fifth** model-coupling sites of the round because it counts the two this round *fixed* as well; this entry counts only the three left unrepaired). That plan is untracked and gitignored, so this entry is the only record of the three that ships. **The original disclosure named only the first because that was the instance someone stumbled over while working, not the output of a sweep derived from the concept** — which is why it missed the second, sitting seventy lines below the sentence this round inserted into that very file. The sweep that replaced it is **not** generated from the concept either, and saying so is the point: it is the same instance-derived pattern widened to the wordings by then known to be defective — four alternations for four known phrasings — which is precisely why it returns exactly four hits and no more. `grep -rniE 'routes? (work )?to [^.]{0,40}\bmodels?\b|agent (and|\+) model|model preference|model array' --include='*.md' .cursor website/docs README.md` reports `:47`, `:77`, the now-corrected `website/docs/agents/engineering-manager.md:23`, and one legitimate non-target, `website/docs/getting-started/faq.md:241` ("avoid needless agent and model switching" — advice about the user's own model picker, not a claim that an artifact declares a model). It reports `0` on `.cursor/skills/commands/tsh-analyze-materials/SKILL.md:62`, and the mechanism is worth stating precisely, because the obvious diagnosis is the wrong one: the `[^.]{0,40}` bound is not what fails. `routes? (work )?to` requires `route` or `routes` followed immediately by `to`, or by `work to`, and on that line **74 characters** of list sit between them — `' transcript cleanup, analysis, extraction, quality review, and formatting '` — so the alternation never engages at all; `model-specialized` then matches none of the other three alternatives either. **What did find it was an enumeration, and that enumeration is the only check here generated from the concept rather than from known instances, because it does no phrase matching at all:** `grep -rniE '\bmodels?\b' --include='*.md' .cursor website/docs README.md code-quality-report.md | grep -v 'disable-model-invocation' | wc -l` reports **130**, and all 130 lines were then classified by hand; three are of this family — `:47`, `:77`, `:62`. **Its limits belong in the same breath, or one overclaim has merely replaced another.** The enumeration is exhaustive over the token `\bmodels?\b` in those four paths, so a coupling claim that never uses the word "model" would still escape it; and the classification of the 130 is judgement, not measurement. So "three" is the count that survived a hand pass over every line containing the token — a materially stronger basis than a pattern's `0`, but not a machine-checkable invariant. **So this is the note below's own lesson recurring inside the bullet that teaches it, three times over: once in the sweep that certifies the fix, once in the first disclosure that named a single stumbled-over site, and once in this bullet's own earlier claim that its widened pattern had been generated from the concept when it had not — and each time it was the independent review of this entry that caught it, not the round that wrote the bullet**

### Notes

- **Upstream is reachable from this machine, which falsifies the premise both notes in the entry below were bounded by.** `gh` reaches `TheSoftwareHouse/copilot-collections` through its own authenticated session: `gh pr view <n> --repo TheSoftwareHouse/copilot-collections` and `gh api repos/…/pulls/<n>` with the diff media type both return data for PRs #76, #77, and #79, and **no git remote was added** — `origin` still points only at this fork. The three checks the old premise rested on were each individually correct, and all three still hold: `TSH_COPILOT_COLLECTIONS` is unset, there is no sibling `copilot-collections` clone beside the workspace, and `git remote -v` lists only `origin`. **The defect was the inference, not the checks** — the capability's absence was concluded from the absence of three specific mechanisms for it, and none of those three is the mechanism that actually works
- **PR #77's roster hunk: the disposition survives, its stated basis does not.** Diffed against upstream, the hunk is a single frontmatter line in `.github/agents/tsh-copilot-orchestrator.agent.md` — `agents: [tsh-copilot-researcher, tsh-copilot-artifact-creator, tsh-copilot-artifact-reviewer, tsh-copilot-engineer]` gaining `tsh-plan-reviewer` and `tsh-architect`. `agents:` is a Copilot frontmatter key that **no artifact in this repository carries** — `^agents:` occurs in `0` files across `.cursor/**/*.md`, as do `^model:`, `^tools:`, and `^user-invokable:` — so non-applicability rests on **artifact shape**: there is no key here to port it into. That claim is deliberately about *this repository's artifacts*, not about Cursor's schema, which was never measured here: this repository's own authoring guidance documents the key at `.cursor/skills/workflows/tsh-creating-agents/SKILL.md:136`, under `## Agent File Structure Reference` → `### Frontmatter Fields`, as "`agents` | No | Array of agent names available as subagents. Use `*` for all, `[]` for none." Whether that surface is accurate is a separate, pre-existing question and is not decided here — the disposition holds either way, because nothing here carries the key to port into. The note below justified it instead with a prose-roster *completeness* check, paraphrased here rather than quoted because an earlier draft of this bullet put quotation marks around a paraphrase: it verified that all four workers exist as agent directories and that the only other `cursor-*` agent directory is the orchestrator itself, so no fifth worker is missing from the list (the landed wording is at `CHANGELOG.md:45`). That answers a different question than the hunk asks — the hunk adds two agents from outside the `cursor-*` family, so a check looking for a missing fifth `cursor-*` worker could not have found the defect. On completeness grounds the roster was in fact *not* complete relative to upstream's: `tsh-plan-reviewer` and `tsh-architect` occur zero times in that file, before this round and after it. The hunk's *semantics* were a real architectural question and were settled separately as **`option (iii)`** — decline the semantic port, add an escalation pointer — because `tsh-architect` and `tsh-plan-reviewer` are gate-bearing rather than generic workers, and `tsh-cursor-orchestrator` carries no `<human-approval-precondition>` and no `Plan Revision` awareness, so a delegation edge would give the approval gate a second, ungoverned entrance. The strongest argument against that choice is preserved in the plan rather than dropped
- **The commit-order claim is false on verification, and three surfaces said three different things about it.** Upstream merge timestamps, read through `gh`: #76 `2026-07-28T10:45:05Z`, #77 `2026-07-29T12:37:27Z`, #79 `2026-08-05T07:49:45Z`. Upstream merge order is therefore **#76 → #77 → #79** — precisely the ascending numbering the landed note goes out of its way to rule out. The port landed #76 → #79 → #77, so it did **not** follow upstream merge order, and it broke `tsh-migrating-copilot-to-cursor` L79: "**Port PRs in merge order.** Later PRs build on earlier ones … Do one commit per PR, in the order they merged, so dependencies resolve." The three surfaces differ, and flattening them into one error would misstate the record. The **old plan** is the origin of the assertion; its Description row claims "upstream merge order" outright. **`CHANGELOG.md:22` is the mildest form and deserves credit for flagging its own basis** — it says "**The plan asserts that this is** upstream merge order" and then states outright "but that is the plan's assertion, not an independent check", so it reached a wrong conclusion while being honest that it had not verified one. **The commit message of `c814d78` is the worst form:** it states flatly that "the commit order #76 -> #79 -> #77 was both the planned phase order and the order the migration skill mandates" and **closes the finding as a not-defect with no hedge at all**. Its first half is true — that was the planned phase order. Its second half is false. **Nothing is rewritten:** no commit is amended, so that message is immutable here, which is itself the argument for the correction living in a new changelog entry — the only surface still reachable. **The mechanism is the transferable part.** The false unreachability premise *shielded* this claim: because upstream had been declared unreadable, "this is merge order" was settled by reading the plan's own assertion instead of running the check. And the premise contradicted an explicit instruction in the very skill the port was executing, two lines above the rule it caused the port to break — L77: "**Fetch the diff, don't guess:** `gh pr diff <n> --repo <upstream>`. Read the whole diff before touching anything."
- **The reusable lesson, and it now has three instances rather than two.** In each, a check was built as a *pattern derived from an assumption about the shape of the defect* instead of being run against the thing itself, and its clean result was then read as proof. (1) The port's `## 2026-09-04`-absence criterion, and the naive `grep -o 'tsh-resolving-skill-references'` that replaced it, whose `0` was reachable only by deleting the gap notes the criterion's own intent required. (2) The `disable-model-invocation` "43" figure, stated without the glob it measures or the pattern it matches, so it could not distinguish a real invariant from three different higher numbers. (3) **New, and found while executing the very task whose definition of done it evades:** the `model array\|model preference` sweep that certifies this round's model-coupling fix cannot see *any* of the three surviving sites named under **Fixed** above, all of which make the same false claim in different words — and disclosing that blindness reproduced the lesson twice more before it settled. The first attempt named only one site, because it too was written from a stumbled-over instance rather than from the concept. The second widened the pattern to the wordings then known and claimed the result had been generated from the concept, which it had not: a wider instance-derived pattern still cannot see a wording nobody has looked for, and it duly reported `0` on the third site, `.cursor/skills/commands/tsh-analyze-materials/SKILL.md:62`. Both misses were caught by the independent review of this entry, not by the round that wrote the bullet. The false unreachability premise is the same shape one level up — three mechanisms were probed and the capability was inferred absent from their absence. The lesson is not any of the individual corrections: a check meant to *discover* must be generated from the concept, not from the instances already known to be defective, and a `0` from such a pattern bounds nothing on its own
- **Process deviation, disclosed rather than omitted.** `tsh-orchestrating-implementation`'s `## Implementation Discussion Boundary` states that implementation begins only in a new discussion. This round executed in the plan-authoring discussion, on the user's explicit re-invocation after the boundary was raised and the user overrode it. **The sentence that was actually crossed is stated here rather than left out.** `tsh-orchestrating-implementation/SKILL.md:145` reads: "In the authoring discussion, after a current-revision recorded `APPROVED`, the manager reports the exact plan path, current `Plan Revision`, persisted `Decision Timestamp`, and review path when present, names implementation as the next step, and MUST NOT perform any file-changing delegation there." That is the prohibition this round crossed. Crossing it did not invalidate the approval, and the skill says why on its own terms: the boundary "is a lifecycle stop, never an approval-validity criterion" (`:147`), and it "does not detect or enforce any editor or chat conversation identifier" (`:149`). The persisted record still satisfies the validity predicate unchanged — `APPROVED`, `Approved Revision` equal to `Plan Revision`, and a `Decision Timestamp` that is valid ISO 8601 UTC ending in `Z`. It is nonetheless a deviation from the canonical flow, so it is recorded here rather than left silent
- **Independent code review of this round returned PASS with no blocking findings — and how the PASS was reached matters more than the verdict.** Six earlier findings from that review were closed **by correction, not by justification**, and the reviewer re-verified each against the tree rather than against this round's own summary: an undisclosed fourth model-coupling site; an exhaustivity overclaim; a global schema claim drawn from a local measurement; a non-sequitur that read `scripts/count-skills.sh` output as evidence about files it says nothing about; a paraphrase presented as a quotation; and a mirror heading that understated the entry's scope. A seventh, selective quotation in the process-deviation bullet above, was closed the same way. The two MINOR items the review raised — the mislabelled sweep and the third surviving site — were **folded into the Fixed bullets above rather than deferred to the plan's `## Improvements`**, because both are about this entry's own accuracy. **One detail is independent corroboration rather than self-congratulation, so it is recorded:** the reviewer's own first attempt to confirm the four non-changelog files unchanged ran `grep -E '^[+-][^+-]'` over the diff, and it **silently dropped** the `website/docs/agents/engineering-manager.md` bullet replacement, because the removed line is a Markdown bullet and so reads as `--`. That is the exact trap this plan's own Definition of Done documents and bans, reproducing itself inside the review tooling built to check the work; the reviewer caught it and re-read the hunk instead. **There is no test framework, no e2e suite, no linter, and no CI in this repository:** no tests were run and none are claimed. The gates are the `grep`/`awk` assertions, `scripts/count-skills.sh`, and `npm --prefix website run build`, which passed
- No `.cursor/skills` artifact was added or removed: `scripts/count-skills.sh` still reports 25 agents / 17 commands / 39 workflows / 12 internal / 93 total. The four hardcoded count surfaces — `README.md:405`, `README.md:429-432`, `website/docs/skills/overview.md:8`, `website/docs/intro.md:23` — are untouched **on a check that actually covers them**, because the script's output says nothing about those files: `git diff --numstat -- README.md website/docs/skills/overview.md website/docs/intro.md` is empty, so none of the three files changed at all. The `disable-model-invocation` inventory is unchanged at **43 keys over the glob `.cursor/skills/*/*/SKILL.md` and 44 over the glob `.cursor/**/*.md`**, both measured by frontmatter-block extraction with the pattern `^disable-model-invocation:` — stated with both the glob and the pattern, because a bare "43" is exactly the imprecision the entry below left open. Nothing was committed, staged, or pushed by this round, and no remote was added

## 2026-09-05 (follow-up — the MINOR findings left open after the #76/#79/#77 port)

### Fixed

- The `Implementation Discussion Boundary` is now published on all five workflow flow pages — it sat on 2 agent pages (`website/docs/agents/architect.md`, `website/docs/agents/engineering-manager.md`) and **zero** flow pages, so the pages a reader follows to run the workflow never said where implementation starts. `website/docs/workflow/overview.md`, `standard-flow.md`, `e2e-flow.md`, `frontend-flow.md`, and `ui-verification-flow.md` now each carry the same four-part contract from `tsh-orchestrating-implementation`'s `## Implementation Discussion Boundary`, reusing phrasing that is already published rather than inventing new wording — the report-duty clause tracks `website/docs/agents/engineering-manager.md:16`, while the load-bearing **lifecycle stop, not an approval-validity criterion** appears on neither agent page and is taken from the ratified source itself: recording plan-authoring Human approval ends the **authoring discussion** — the discussion in which the plan was authored, reviewed, and approved; the Engineering Manager there reports the exact plan path, the current `Plan Revision`, the persisted `Decision Timestamp`, and the review path when present, names implementation as the next step, and delegates no file change; implementation runs in a new discussion the user starts, where the unchanged persisted record is reused without a duplicate approval gate; and the boundary is a **lifecycle stop, not an approval-validity criterion** — invalid or missing states still fail closed, and a material revision still requires renewed Human approval
- Each of the five pages also carries the boundary inside its own step sequence, not only in prose — `standard-flow.md`, `frontend-flow.md`, and `e2e-flow.md` gained a `🛑 Authoring discussion ends here — start a new discussion to implement` step, and the two that already showed the manager validating the record now say it validates *in the new discussion*; `standard-flow.md`'s Plan Validation Phase **Your action** now ends by naming that boundary; `ui-verification-flow.md` gained an `Authoring discussion ends` node between `Approval recorded in the plan` and the manager's validation in its Mermaid diagram, one further never-optional rule ("When the Architect's plan-authoring gate recorded the approval, implementation runs in a new discussion, never in that authoring discussion."), and a split of its orchestrator bullet so the stop-and-report step and the validate-and-reuse step are separate. `website/docs/workflow/overview.md` additionally carries the low-risk-exemption exclusion: where reviewer readiness rests on the initial-plan low-risk automated-review exemption, the Architect's plan-authoring gate never ran, so there is no authoring discussion to close and the manager's gate is the only user-facing gate
- `website/docs/prompts/overview.md:71` published a wrong approval model and a route that no longer exists, in one sentence — it attributed the routine approval gate to the Engineering Manager ("the manager requires Human approval of the exact current plan revision") and said "in either flow", the last reference anywhere in `website/docs` or `README.md` to the second implementation route this port abolished. Both were regressions of the PR #76 port commit `7bea710`, not pre-existing staleness. The sentence now states the recorded-approval model — approval must already be recorded before the first file-changing delegation, the Architect normally records it at its own plan-authoring gate (`Approve plan`, `I have comments`), and the Engineering Manager validates and reuses a valid record, presenting its own `Approve current plan` / `Request changes` / `Stop` gate only as fail-closed recovery — and names no route count at all. The clause that automated Reviewer approval is readiness evidence only, not permission to implement, is unchanged

### Changed

- `tsh-orchestrating-implementation`'s `### Preservation coverage` gained one clarifying sentence: checklist items 5-8 covered the delegation-and-review branch of the abolished second implementation route, the gap is deliberate, and the surviving numbers are not renumbered so they stay traceable to the plan's original preserved-branch identifiers. **The finding behind this — that the table "no longer covers checklist items 5-8" — was miscalibrated, and it is closed as not a defect rather than fixed.** `git show 097bbc0` shows the pre-port table carried a row reading `| … delegation and review | 5-8 |` for exactly that branch, and this port abolished the route it named, so deleting the row was correct and no coverage is missing. Renumbering the surviving identifiers would have destroyed the traceability the section exists to provide, so the gap was documented instead. Only the sentence was added

### Notes

- **Two** pages still published the single-gate model after `7dc0d1a` corrected the other four, and the reason both were missed is the round's most transferable lesson. `website/docs/workflow/e2e-flow.md` kept its single-gate sentence ("the Engineering Manager requires Human approval of the exact current plan revision") and named the Architect's gate nowhere, so the boundary prose layered on top of it introduced the term "plan-authoring Human approval" with no owner on the page; it now states the same model as its four siblings, and its `✅` approval step is attributed to the Architect's gate. `website/docs/prompts/overview.md:71` carried **two** defects in one sentence — the same single-gate attribution, plus "in either flow", the last surviving reference anywhere in `website/docs` or `README.md` to the second implementation route this port abolished. Both were written by `7bea710` rather than inherited: `git show 097bbc0:website/docs/prompts/overview.md` matches neither `Human approval` nor `either flow`. That sentence now attributes the gate as the flow pages do and states no flow count at all. **The lesson is about verification design.** Two independently calibrated sweeps both reported clean on that one sentence: the two-gate sweep matched the literal `must obtain Human approval` while the page reads `requires Human approval`, and the abolished-route sweep matched the literal `Quick Flow` while the page says `either flow`. Each pattern had been built from the sites already known to be defective, so neither could find a variant nobody had seen yet — and passing two independent checks made the sentence look doubly verified when in truth nothing had examined it. A sweep meant to *discover* has to be generated from the concept rather than from the known instances — here, every site that mentions Human approval at all, and every site that implies more than one route — with each hit read in context instead of a count of `0` being treated as proof
- Commit order, disclosed now rather than rewritten — the port landed as **#76 → #79 → #77**. **The plan asserts that this is upstream merge order**, the order `tsh-migrating-copilot-to-cursor` requires ("Port PRs in merge order… Do one commit per PR, in the order they merged, so dependencies resolve") — but that is the plan's assertion, not an independent check: upstream is unreachable on this host, for the reasons stated in the PR #77 roster note below, so no upstream merge order could be read here. What *is* independently verifiable, and holds: the shipped sequence `7bea710` (#76) → `78e1ddc` (#79) → `321c149` (#77) matches this plan's Phase 1 / Phase 2 / Phase 3 order exactly. It is **not** the ascending `#76, #77, #79` numbering suggested by the batch name `port-copilot-prs-76-79` and by the plan's Jira ID and Title rows; the plan's Description row states "upstream merge order" outright. Neither changelog stated the order or its rationale at the time, and that is what is being recorded here. The commits are already published, so the ordering itself is not being rewritten
- The round produced **five commits, not the planned three**, and that stands unamended deliberately. The three port commits (`7bea710` PR #76, `78e1ddc` PR #79, `321c149` PR #77) are followed by two docs-fix commits (`ddb58f5`, `7dc0d1a`) that repaired regressions the port itself introduced into `website/docs`. Amending them away would rewrite history that has already been independently verified, break the one-commit-per-upstream-PR fidelity the three port commits exist to provide, and hide the fact that the extra commits were needed because the port shipped regressions
- The PR #77 roster hunk at `.cursor/skills/agents/tsh-cursor-orchestrator/SKILL.md` line 11 was neither ported nor recorded as non-applicable at the time. **Disposition: non-applicable — with a stated limitation, not a clean verification.** The limitation bounds the claim, so it comes first: the hunk **cannot be diffed against upstream on this host**. `TSH_COPILOT_COLLECTIONS` is unset, there is no sibling `copilot-collections` clone beside the workspace, and the only configured git remote is the user's own fork (`origin` → `github.com/kkorus/cursor-collections`). What *was* verified locally: line 11 delegates to exactly `tsh-cursor-researcher`, `tsh-cursor-artifact-creator`, `tsh-cursor-artifact-reviewer`, and `tsh-cursor-engineer`; all four exist as `.cursor/skills/agents/<name>/SKILL.md`; and the only other `cursor-*` agent directory is `tsh-cursor-orchestrator` itself, the roster's own owner, so no fifth worker is missing from the list. The roster is complete and accurate **for this repository**, and that is what makes the hunk non-applicable here — it is not an upstream comparison
- One of the port's own verification criteria was false, and **one** ticked box rested on it. The criterion appears at two Definition-of-Done sites: one was ticked, and the other stays unticked on purpose because its stated command-and-value pair is untrue as written; a third site is ticked but carries the **corrected** criterion, not the false one. It required the published changelog snapshot to contain no `## 2026-09-04` entry — unsatisfiable the moment the port wrote its own dated entries into that file, and it is the reason those headings had earlier been inverted to a non-native shape purely to make a substring check pass. The naive replacement was **also** false: `grep -o 'tsh-resolving-skill-references' website/src/pages/changelog.md | wc -l` reports `4`, and three of those four are the pre-existing-gap notes the criterion's own intent mandates, so `0` was reachable only by deleting the notes that were required — the same "delete the gate to pass the gate" shape as the `no-plan` floor of `1` already recorded for this port. The surviving intent is narrower and still holds: no entry may backfill or describe the `097bbc0` work. It is now a stated human check over the enumerated mention sites, with the occurrence count demoted to a drift tripwire rather than a proof. The transferable lesson is that no substring or occurrence count can express "no entry *describes* X", because the prose that records the gap necessarily *mentions* X
- **Open, not fixed — the `disable-model-invocation` invariant was stated imprecisely as "43" throughout this work.** Precisely: **43 across `.cursor/**/SKILL.md`**, **44 across `.cursor/**/*.md`**. The 44th carrier is `.cursor/skills/workflows/tsh-creating-commands/command.template.md`, an authoring template rather than a skill, whose own frontmatter legitimately carries the key. File-level greps are higher, and *how much* higher depends on the pattern, which is why the pattern belongs in the criterion alongside the glob: `grep -rlE '^disable-model-invocation:'` reports **44** and **45** files for the same two globs, because `tsh-creating-commands/SKILL.md` shows the key at column 0 inside a fenced `yaml` example; a plain file-level grep for the bare string reports **50** and **53**, because several skills discuss the key in prose. Only frontmatter-block extraction expresses this invariant. Nothing drifted: the extracted count is identical at `097bbc0`, at `HEAD`, and in the working tree. Only the wording was imprecise, and a future criterion should state both the glob it measures and the pattern it matches
- **Open, not fixed — the task-to-owner routing table has no row for Cursor customization artifacts.** `.cursor/skills/**/SKILL.md` files are this repository's primary product, yet they match neither the `LLM prompts` row (`tsh-prompt-engineer` / `tsh-engineer-prompt`) nor the `documentation` row (`tsh-technical-writer` / `tsh-write-documentation`), and `tsh-prompt-engineer` excludes them by name: "You do NOT handle Cursor customization files (agent/workflow/command `SKILL.md`, `.mdc` rules). Those belong to `tsh-cursor-engineer`." This port was routed as plan seams, which works but bypasses the specialist. Changing the ratified routing table is outside this round, so this is recorded as an open gap rather than repaired
- **Open, not fixed — the pinned dev-server URL is collected before the approval gate**, that is, in the authoring discussion, while UI capture runs in the implementation discussion. The ratified source has the same ordering — planning-sequence step 6 ("Ask for the dev server URL when UI tasks exist") precedes step 9 ("Pass the Human approval gate before execution") — so it was left alone rather than inventing a re-confirmation rule the source does not state. Recorded as a latent question for a future round
- No `.cursor/skills` artifact was added or removed: `scripts/count-skills.sh` still reports 25 agents / 17 commands / 39 workflows / 12 internal / 93 total, the frontmatter `disable-model-invocation` inventory is unchanged, and the abolished-route sweep across `.cursor` and `website/docs` still reports zero occurrences

## 2026-09-04 (docs fix — approval gate separation)

### Fixed

- Published flow pages described one authorization gate where the source ratifies two — `website/docs/workflow/overview.md`, `standard-flow.md`, `frontend-flow.md`, and `ui-verification-flow.md` presented the Engineering Manager's `Approve current plan` / `Request changes` / `Stop` as the single gate that authorizes implementation ("Only the Engineering Manager's Human approval gate … authorizes or halts execution", "the only step that authorizes implementation", "the only gate that authorizes implementation"). `tsh-orchestrating-implementation`'s `## Approval Gate Separation` ratifies two distinct gates that "must not duplicate each other": the Architect's plan-authoring gate (`Approve plan`, `I have comments`), which fires immediately after a settled review event and writes the `## Human Approval` record, and the manager's execution authorization, which is "fail-closed recovery only, never a second normal authorization when a valid current-revision record already exists, including one recorded by `tsh-architect`". All four pages now name the Architect's gate as the normal one and the manager's as recovery that does not fire when a valid current-revision record exists; the wording reuses what `website/docs/agents/engineering-manager.md` and `website/docs/agents/architect.md` already publish rather than inventing new phrasing. **This is a regression introduced by commit `7bea710`:** `website/docs/workflow/overview.md` contained zero "Human approval" mentions at `097bbc0`, so every one of those sentences was written by that commit
- Three sites gave the Plan Reviewer loop to the wrong owner — `website/docs/workflow/standard-flow.md` listed the Plan Validation Phase as "**Delegated to:** Plan Reviewer", and both it and `website/docs/workflow/frontend-flow.md` showed "Engineering Manager delegates to Plan Reviewer for plan validation". The source gives that loop to the architect: `tsh-orchestrating-implementation` states "The architect owns producing a finished reviewed plan with one reviewer invocation per plan lifecycle", and `website/docs/agents/architect.md` and `website/docs/agents/plan-reviewer.md` already publish it correctly. All three now attribute the invocation to the Architect, once per plan lifecycle, with no loop language reintroduced. **This one is pre-existing, not a port regression** — verified present at `097bbc0`, then at `standard-flow.md` lines 36 and 71. It is the same misattribution class that decision D5 already fixed at `website/docs/prompts/internal/plan.md`, so correcting it here extends a ratified decision rather than making a new one
- `website/docs/agents/cursor-engineer.md` — the artifact-boundary table said a prompt "routes to agent + model"; it now says it routes to the owning agent and the skill it follows. Per decision D2, model selection is a session-level concern in Cursor and is not bound by the artifact. Also **pre-existing**: no model-mention sweep caught it, because the cell names no model

### Changed

- The four workflow flow pages now state one identical re-review contract — `website/docs/workflow/standard-flow.md`, `frontend-flow.md`, and `e2e-flow.md` gained the "a new review event happens only when the user explicitly directs one" clause that `ui-verification-flow.md` already carried, matching `tsh-architect`'s "a new review occurs only through an explicitly user-directed new review event"

### Notes

- One further site in the same class was corrected inside a file already in scope: `website/docs/workflow/standard-flow.md` said the Engineering Manager "must obtain Human approval of the exact current plan revision" before the first file-changing delegation. The manager validates a persisted record and reuses a valid one, gating only on recovery, so the sentence now states the requirement as a recorded approval rather than a manager-run gate
- Two further single-gate statements sat on the agent pages and are corrected in the same commit: `website/docs/agents/overview.md` ("The manager owns the Human approval gate for the exact current plan revision before the first file-changing delegation") and `website/docs/agents/architect.md` ("Both **Start Implementation** and **Start Infrastructure Implementation** pass through the Engineering Manager and its Human approval gate"). The second contradicted line 83 of its own page, which already described the two-gate model correctly, so the page disagreed with itself. Both are **regressions of `7bea710`, not pre-existing text** — `git show 097bbc0` finds no "Human approval" mention in either file. Both now state that the manager validates and reuses the persisted record and gates only as fail-closed recovery
- No `.cursor/` file was touched. `scripts/count-skills.sh` still reports 25 agents / 17 commands / 39 workflows / 12 internal / 93 total, and the frontmatter `disable-model-invocation` inventory still extracts 43 keys with zero diff against `097bbc0`

## 2026-09-04 (docs fix)

### Fixed

- Published pages no longer advertise the abolished second implementation route — `website/docs/workflow/overview.md` said "Quick and Full routes both require Human approval…" and `website/docs/workflow/ui-verification-flow.md` said "Both Quick and Full routes require…", while the ratified source states that Full Flow is the only implementation-orchestration route and that "No alternative flow may be offered, recommended, accepted, recorded, or honored as an override". Both now state the single route. **This is a regression introduced by the PR #76 commit and missed by the PR #79 commit:** #76 wrote these two sentences, and #79's docs sweep grepped the literal string `Quick Flow`, which neither sentence contains. It is the same failure mode already recorded for `Quick vs Full Flow`, recurring in text this port itself authored — the sweep was rerun as `grep -rniE 'quick (and|vs) full' README.md website/docs`, which now reports zero
- Published pages no longer publish the pre-#79 re-review contract — `website/docs/workflow/standard-flow.md`, `e2e-flow.md`, `frontend-flow.md`, and `ui-verification-flow.md` each said a material revision "requires Reviewer re-review and renewed Human approval". The ratified source says the opposite about re-review: `tsh-orchestrating-implementation` states "No re-review is invoked automatically", `tsh-architect` states "It does not automatically invoke `tsh-plan-reviewer`; a new review occurs only through an explicitly user-directed new review event", and `tsh-creating-implementation-plans` states "it never triggers a reviewer invocation on its own". Renewed Human approval is still required and is unchanged on all four pages; only the automatic Reviewer re-review is removed. **This is a regression introduced by the PR #76 commit and left standing by the PR #79 commit:** #76 wrote the sentences faithfully (its own `## Material Revision Handling` did mandate re-review), #79 removed that mandate from the source, and #79's docs task swept `automatic re-review` in the orchestration skill only — no assertion swept `re-review` across `website/docs`, and its own analysis had concluded `website/docs/workflow/**` needed no Quick Flow change, which was true for Quick Flow and false for this contract
- `website/docs/agents/architect.md` — "on the low-risk-exemption path **no plan**-authoring gate runs" reworded to "the plan-authoring gate does not run". The meaning is unchanged; the phrase was a coincidental `no plan` substring that tripped the abolished-route guard, and it was the one reason `website/docs` did not report zero `no-plan` / "no plan" occurrences

### Changed

- `website/src/pages/changelog.md` — the two port entries use this file's native date-first heading shape again, `## 2026-09-04 (PR #NN port)`, matching its eight pre-existing headings and `CHANGELOG.md`. They had been inverted to `## PR #NN port (2026-09-04)` purely to satisfy a verification assertion that forbade any heading beginning `## 2026-09-04` — a substring check whose intent was only that the missing `tsh-resolving-skill-references` entry must not be backfilled here. That intent still holds: this snapshot still carries no entry describing that work

## 2026-09-04 (PR #77 port)

### Fixed

- Model-name drift removed (exposed by copilot-collections PR #77) — Seven fork-local sites asserted a model binding the source does not have. Two were deletions in `.cursor/`: the `**IMPORTANT**` roster bullet in `tsh-engineering-manager` ("The orchestrator selects `GPT-5.3-Codex` or `Gemini 3.5 Flash` at delegation time.") and the model clause in the `app code (complex)` routing-row Notes cell in `tsh-orchestrating-implementation`. Five were replaced in `website/docs` with one accurate statement per page — `agents/software-engineer.md`, `agents/engineering-manager.md`, and `prompts/public/implement.md`, whose three sites collapse into a single statement rather than being triplicated; the labelled `**Model array (from the agent):**` metadata line there was removed whole, because deleting only its value would have left a dangling label. The replacement wording reuses what `01d6351` ratified in `.cursor/`: model selection is handled at the Cursor session level per worker and is not bound by the artifact
- The removed claims were false as written, not merely stale — Frontmatter-block extraction across all 93 artifacts finds zero `model:` and zero `tools:` keys, so `website/docs/agents/software-engineer.md`'s "matching the current source frontmatter" and `website/docs/agents/engineering-manager.md`'s "The agent declares a shared model array of …" both described frontmatter that does not exist. Two of them also published mutually contradictory arrays for the same seat: the Engineering Manager page named **GPT-5.6 Luna** and **Claude Sonnet 5**, while the agent skill it documents named `GPT-5.3-Codex` and `Gemini 3.5 Flash`

### Notes

- Upstream #77 itself was **not applicable** to this fork. It standardized `model:` and `tools:` frontmatter across the upstream agent set; this collection carries neither key on any of its 93 artifacts, and `tsh-migrating-copilot-to-cursor` mandates dropping both at conversion time and never carrying them into the body, so #77's frontmatter hunks had no target here. Its value was diagnostic — going to look for that frontmatter is what proved the seven prose claims above were wrong
- Per the batch decision record (D4), one of the seven — the routing-row model clause in `tsh-orchestrating-implementation` — was deleted in the **PR #79** commit rather than this one. That single line is touched by #76, by #79, and by `097bbc0`, and a fourth pass over it would have been a needless conflict surface. This knowingly relaxes strict one-commit-per-PR purity for one line, and it is recorded here rather than obscured
- Five model mentions are legitimate and were deliberately **not** swept: `tsh-designing-multi-cloud-architecture/references/service-comparison.md` (cloud provider service names), `tsh-optimizing-cloud-cost/references/tagging-standards.md` (`gpt-4-finetune` as an example resource tag), `tsh-migrating-copilot-to-cursor/SKILL.md` (`model: "GPT-5.4"` as the frontmatter example the conversion rule drops), `README.md`'s Recommended Thinking Effort table, and `code-quality-report.md`'s audit findings. Historical changelog prose naming past model arrays is untouched for the same reason
- Pre-existing gaps carried rather than silently repaired (D5): `website/src/pages/changelog.md` still lacks the `2026-09-04` entry that this file carries for the `tsh-resolving-skill-references` work, and `tsh-write-documentation` still has an internal skill with no `website/docs/prompts/internal/` page — the mirror image of the `review-plan` orphan the #79 commit deleted. Backfilling either inside a port commit would misattribute it to this port
- No `.cursor/skills` artifact was added or removed: `scripts/count-skills.sh` still reports 25 agents / 17 commands / 39 workflows / 12 internal / 93 total, and the frontmatter `disable-model-invocation` inventory is byte-identical to `097bbc0`

## 2026-09-04 (PR #79 port)

### Changed

- Plan review is now a lightweight final reality check, invoked once per plan lifecycle (ported from copilot-collections PR #79) — `tsh-plan-reviewer` no longer stress-tests the plan adversarially or hunts a findings quota. It runs one high-level gate: if the plan is coherent, feasible, and correctly sequenced, it approves. The report carries only BLOCKERs, drawn from six canonical categories (missing critical context, infeasible approach, wrong sequencing, contradicted project reality, unresolved open question, and unverifiable definition of done). The architect invokes it once per plan lifecycle; a further review event happens only when the user explicitly directs one
- Report schema — `reviewed-plan-revision` was added so a review is bound to the exact plan revision it examined, and `architect-action-required` is now `true|false` rather than a free-form field. `tsh-architect` gained a `<pre-submission-self-check>` and a `<plan-authoring-approval-gate>` that fails closed on an ambiguous response by stopping and asking rather than guessing
- The 3-iteration escalation loop and the `Decision and Revision History` table are gone — the loop was the mechanism behind the adversarial framing, and the history table duplicated the `## Human Approval` record that PR #76 made canonical. Both are removed from the agent skill and from every page that documented them
- **Quick Flow is removed, so after this port there is exactly one implementation route and unplanned implementation is no longer offered at all.** `tsh-orchestrating-implementation` states that Full Flow is the only implementation-orchestration route and that no alternative flow may be offered, recommended, accepted, recorded, or honored as an override; both flow-selection decision tables, the `## Quick Flow` section, and the flow recommendation are deleted, as is `website/docs/prompts/public/implement.md`'s "with the user able to override the recommendation". Step 0 now creates execution todos and Step 1 establishes Full Flow and assesses planning readiness
- New canonical sections in `tsh-orchestrating-implementation` — `## Approval Gate Separation` distinguishes the architect's plan-authoring gate (`Approve plan` / `I have comments`) from the manager's recovery-only gate (`Approve current plan` / `Request changes` / `Stop`), and `## Implementation Discussion Boundary` requires delivery to begin in a new discussion, reporting the plan path, current `Plan Revision`, persisted `Decision Timestamp`, and review path, then stopping before any file-changing delegation
- Material revision handling no longer triggers an automatic re-review — a material change after an earlier Human approval halts further file-changing delegation and requires renewed Human approval; it never invokes a reviewer on its own. Updated in `tsh-orchestrating-implementation`, `tsh-creating-implementation-plans`, its `plan.example.md`, and `website/docs/skills/creating-implementation-plans.md`
- Website — 10 pages updated (`README.md`, `agents/architect.md`, `agents/plan-reviewer.md`, `agents/overview.md`, `agents/engineering-manager.md`, `prompts/overview.md`, `prompts/public/implement.md`, `prompts/internal/plan.md`, `skills/creating-implementation-plans.md`, `workflow/standard-flow.md`) for the reality-check framing, the single route, the one-invocation contract, and the new report schema. Per the batch decision record, `prompts/internal/plan.md` also stops misattributing the reviewer invocation to the Engineering Manager — the Architect owns that loop

### Removed

- `website/docs/prompts/internal/review-plan.md` — Deleted as an orphan page documenting a `tsh-review-plan` internal skill this fork does not have (there is no `.cursor/skills/internal/tsh-review-plan/`); it also republished the findings target, the `Decision and Revision History` table, and the 3-iteration loop that #79 removes. Its one live inbound link, in `website/docs/skills/creating-implementation-plans.md`, was fixed in the same commit; the two historical changelog mentions are untouched prose

### Notes

- Upstream #79's changes to its `.github/prompts/tsh-review-plan.prompt.md` were merged into `.cursor/skills/agents/tsh-plan-reviewer/SKILL.md`, because this fork folded that internal prompt into the agent skill rather than keeping a separate prompt artifact
- Three `.github/skills/tsh-orchestrating-implementation/SKILL.md` path citations that a mechanical port would have introduced — one in `tsh-architect`'s `<human-approval-boundary>` and two in `tsh-engineering-manager`'s `<human-approval-ownership>` — were converted to backticked skill names with the `resolved per tsh-resolving-skill-references` clause, so the delegation text keeps working in a consuming project
- `097bbc0`'s `<delegation-economy>` bullet in `tsh-engineering-manager` was rewritten rather than dropped: upstream's Quick Flow removal deleted the bullet outright, but the delegation-economy principle is fork-local and survives, re-expressed without any flow reference
- The replacement `**UI-verification scope:**` paragraph keeps this fork's richer breadth definition from the PR-#72 CLI port — layout, spacing, sizing, width/height caps, flex/grid, alignment, typography, colors, and component structure on a Figma-backed screen all count, even with no `[REUSE]` task or Figma URL in hand. The definition only stops acting as a flow gate; none of its breadth was lost
- No `.cursor/skills` artifact was added or removed: `scripts/count-skills.sh` still reports 25 agents / 17 commands / 39 workflows / 12 internal / 93 total, and the frontmatter `disable-model-invocation` inventory is byte-identical to `097bbc0`

## 2026-09-04 (PR #76 port)

### Added

- `## Human Approval` plan record (ported from copilot-collections PR #76) — `tsh-creating-implementation-plans` and its `plan.example.md` now carry a persisted approval record (`Plan Revision`, `Human Decision`, `Approved Revision`, `Decision Timestamp`, `Note`) placed immediately after `## Open Questions` and before `## Technical Context`, plus a `<human-approval-protocol>` block defining validity — `Human Decision=APPROVED`, `Approved Revision=current Plan Revision`, and a `Decision Timestamp` in ISO 8601 UTC ending in `Z` — and the material-change reset that increments the revision, returns the decision to `PENDING`, and clears the approved revision
- `<human-approval-precondition>` in all seven execution owners — One structurally uniform, byte-identical block in `tsh-plan-implementor`, `tsh-software-engineer`, `tsh-ui-engineer`, `tsh-e2e-engineer`, `tsh-devops-engineer`, `tsh-prompt-engineer`, and `tsh-technical-writer`. Each owner reads the referenced plan from disk before any file change and fails closed when a field is missing, stale, mismatched, inferred, or based only on Reviewer approval, and when the plan cannot be located or read after one bounded resolution attempt. Direct invocation never bypasses the check, and the owner never dead-ends: it names the exact failed field, condition, or file and asks the user which next step to take. `tsh-ui-engineer` keeps the sanctioned UI scope qualifier (`including UI implementation or capture/verification-related artifacts`); `tsh-e2e-engineer` gained a `<constraints>` block so all owners stay structurally consistent
- `<human-approval-boundary>` in `tsh-architect` and `<human-approval-ownership>` in `tsh-engineering-manager` — The manager owns the user-facing gate and offers exactly `Approve current plan`, `Request changes`, or `Stop` before the first file-changing delegation; the architect owns plan revisions and records only the user's literal response, never inferring consent from context or from Reviewer approval. `tsh-plan-reviewer` `APPROVED` stays Reviewer approval only
- `## Material Revision Handling` in `tsh-orchestrating-implementation` — A material revision of an already Human-approved plan immediately halts further file-changing delegation, increments the revision, requires mandatory Reviewer re-review with no low-risk exemption, and then renewed Human approval. Routine checkbox, progress, and execution-recording updates are explicitly non-material
- Planning readiness now tracks `Reviewer readiness` and `Human approval state` as separate rows, replacing the single `Plan approval state` row
- `website/docs/skills/creating-implementation-plans.md` — New `## Human Approval` section documenting the record table and the `Plan Revision` binding

### Changed

- Unplanned implementation is no longer offered anywhere — `tsh-orchestrating-implementation` routes a missing research or plan artifact to the preparation sequence instead of selecting an implementation owner, and states "Do not offer or authorize no-plan implementation."; the routing row that read `app code (complex or no-plan)` is now `app code (complex)`. The five "when no plan is provided, apply your own technical judgment" clauses in `tsh-software-engineer`, `tsh-ui-engineer`, `tsh-e2e-engineer`, `tsh-prompt-engineer`, and `tsh-plan-implementor` are gone; the sixth site, `tsh-architect`, is deliberately left to the #79 commit that deletes the surrounding paragraph
- Roster and routing wording — `tsh-engineering-manager` de-scopes `tsh-software-engineer` to the complex NON-UI exception path, with `tsh-plan-implementor` as the default owner for a Human-approved plan revision's actionable, low-risk plan seams; documentation-target routing and the `tsh-technical-writer` scope wording are now conditional on those targets existing in the project
- `/tsh-implement` — Names its four primary inputs (task description, Jira ID, standalone `*.research.md`, `*.plan.md`), states that missing companion artifacts trigger preparation rather than authorizing implementation without a current actionable plan, and points at the canonical Human approval gate that precedes the first file-changing delegation
- Guided recovery — Upstream's `vscode/askQuestions` call sites are ported as natural chat questions with the options spelled out in prose, matching this collection's convention of carrying no `tools:` frontmatter. `tsh-devops-engineer` and `tsh-technical-writer` gained the matching `<user-confirmation>` bullets, and their website pages gained an **Ask Questions** tool row
- Website — 19 pages under `website/docs/` updated: nine agent pages for the precondition and ownership carriers, plus `plan-reviewer.md`, `agents/overview.md`, `prompts/overview.md`, `prompts/public/implement.md`, and the five workflow pages (`overview`, `standard-flow`, `e2e-flow`, `frontend-flow`, `ui-verification-flow`). Research and plan reviews are now described as quality checkpoints rather than authorization gates; the Engineering Manager's Human approval gate is the only step that authorizes or halts execution. The delegation tables gained Plan Implementor, UI Engineer, and Technical Writer rows

### Notes

- Upstream #76's Quick Flow step 1 ("Pass the Human approval gate") is ported **as written**, in `tsh-orchestrating-implementation` and on `website/docs/prompts/public/implement.md`, so this commit stays faithful to its own PR — even though the next commit in this port batch removes Quick Flow entirely per the batch decision record
- No `.cursor/skills` artifact was added or removed, so all four count surfaces are untouched: `scripts/count-skills.sh` still reports 25 agents / 17 commands / 39 workflows / 12 internal / 93 total, the frontmatter `disable-model-invocation` inventory is byte-identical to `097bbc0`, and `git diff --name-status 097bbc0 -- .cursor/skills` shows no added or deleted path
- Pre-existing gap, recorded rather than backfilled: `website/src/pages/changelog.md` never received the `2026-09-04` entry that this file carries for the `tsh-resolving-skill-references` change. The published snapshot's lag stays visible instead of being silently repaired inside a port commit

## 2026-09-04

### Added

- `tsh-resolving-skill-references` workflow skill — Shared rule for locating a referenced skill file at delegation time. Defines a five-step resolution order (project skill collection → installed skills root, derived from the directory containing the executing skill rather than named → search by name → Skill tool by name → hard stop), the Read-not-invoke rule (a Skill-tool rejection means locate and read the file, and is never a reason to change or remove the layer flag that caused the rejection), a hard stop when nothing resolves, and a bounded degraded-mode carve-out. Frontmatter is `name` + `description` only — deliberately no `disable-model-invocation`, so the rule stays reachable by name through the Skill tool in any project

### Changed

- Delegation-time skill references now name the skill instead of pathing to it — 68 references across 18 files: `tsh-orchestrating-implementation` (25, including the whole Task-to-Owner routing table), four command entry points (`/tsh-implement`, `/tsh-analyze-aws-costs`, `/tsh-analyze-gcp-costs`, `/tsh-audit-infrastructure`, 16), five agents (`tsh-engineering-manager`, `tsh-software-engineer`, `tsh-ui-engineer`, `tsh-context-engineer`, `tsh-ui-reviewer`, 6), six internal skills (`tsh-implement-ui-common-task`, `tsh-implement-ui`, `tsh-implement-terraform`, `tsh-implement-pipeline`, `tsh-deploy-kubernetes`, `tsh-implement-observability`), and both plan-authoring surfaces (`tsh-creating-implementation-plans` and its `plan.example.md`). A project-relative `.cursor/skills/<layer>/<name>/SKILL.md` path does not resolve in a consuming project — that was the root cause, not the layer flag, and no frontmatter was changed anywhere
- `.cursor/rules/cursor-instructions.md` — One new `## When Editing This Repo` bullet stating that delegation-time references use skill names while project-relative paths stay correct for authoring guidance, plus one matching authoring-checklist item each in `tsh-creating-agents`, `tsh-creating-commands`, and `tsh-creating-skills`
- `/tsh-analyze-aws-costs` and `/tsh-analyze-gcp-costs` — Pre-existing degradation clauses bounded. The "use hardcoded defaults if the skill file cannot be found" and "proceed with available skills" clauses now require the resolution order to be exhausted first and the substitution to be announced in the report's Executive Summary; the Core 5 tag/label defaults supply names only and may not produce any cost finding, security finding, or remediation recommendation; and `tsh-managing-secrets` is carved out entirely as a security gate — a security-scoped audit stops and asks the user rather than emitting a security section produced without its governing skill
- Published skill counts — `README.md` (workflow-skills heading and repository-structure tree), `website/docs/skills/overview.md`, and `website/docs/intro.md` now state 39 workflow skills, matching `scripts/count-skills.sh` (93 total); `tsh-resolving-skill-references` was added to the README workflow catalogue and to the website skills table as an unlinked row
- Website agent docs — The `ui-engineer`, `context-engineer`, and `plan-reviewer` pages named a `.cursor/` delegation path verbatim and now name the skill instead, matching the source they mirror; each page's `**File:**` location header keeps its path

- Code review hardened three points before landing — `tsh-resolving-skill-references` now treats a requested skill name as untrusted input and refuses a name containing `/` or a `..` segment rather than substituting it into `<root>/<name>/SKILL.md` (a delegation instruction can reach a worker from a generated plan file); its degraded-mode section now describes both shapes a documented fallback can take, substitution and omission, because the broad "proceed with the skills that did load" clause in the two cost commands is the omission shape and the section previously claimed the Core 5 defaults were the only qualifying case; and `tsh-creating-commands`'s validation checklist no longer asks the author to confirm a referenced skill "exists in `.cursor/skills/workflows/`" four lines above the item telling them not to write that path into a command

### Fixed

- `website/docs/workflow/ui-verification-flow.md` — The six "Source of Truth" entries were Markdown links escaping the docs root (`../../../.cursor/…`), which Docusaurus resolved to `/.cursor/…` and rejected as broken, failing `npm --prefix website run build`. They are now backticked paths, matching how every other page states a file location. The break predates this change and was already present at `01d6351`

### Notes

- `website/docs/intro.md` — The agent-skill count was corrected from a pre-existing, already-stale `21` (with a "12 user-facing plus 9 internal" breakdown) to `25` (13 user-facing + 12 internal), so a future audit does not read that drift as a regression introduced by this change

## 2026-07-30

### Changed

- Opus 5 prompting overlay (selective, per `specifications/decisions/claude-opus-5-prompting-vs-cursor-collections.decision.md`): user-facing cadence + Task/delegation economy on `tsh-orchestrating-implementation`, `tsh-engineering-manager`, and `tsh-cursor-orchestrator`; report-all-then-classify on code/plan review; scope reinforce on `tsh-plan-implementor`. Process gates (UI verify-fix, plan/code review) unchanged.

## 2026-07-11 (docs)

### Notes

- Reviewed copilot-collections PR #74 (README path adjustments): not applicable to Cursor Collections. Upstream #74 fixed hardcoded `/Users/adampolak/...` absolute paths, a `<this-repo-url>` clone placeholder, and a settings trailing comma that existed only in the upstream slimmed README. This fork's README is the richer diverged version and already uses relative `.cursor/mcp.json` links and a real clone URL, so no changes were needed.

## 2026-07-11

### Changed

- Recommended model arrays updated across agents and prompts (ported from copilot-collections PR #73):
  - `tsh-architect`, `tsh-business-analyst`, `tsh-context-engineer`, `tsh-prompt-engineer`, and `tsh-ba-quality-worker` now use `GPT-5.6 Terra` with `GPT-5.4`.
  - `tsh-ba-formatting-worker`, `tsh-ba-transcript-worker`, `tsh-cursor-artifact-creator`, and `tsh-technical-writer` now use `GPT-5.6 Luna` with `GPT-5.4 mini`.
  - `tsh-cursor-artifact-reviewer` and `tsh-plan-reviewer` now use `GPT-5.6 Sol` with `GPT-5.5`.
  - `tsh-cursor-orchestrator` now uses `GPT-5.6 Terra` with `Claude Sonnet 5`; `tsh-engineering-manager` (and `/tsh-implement`) now use `GPT-5.6 Luna` with `Claude Sonnet 5`.
  - `tsh-ba-extraction-worker`, `tsh-code-reviewer`, `tsh-cursor-engineer`, `tsh-cursor-researcher`, `tsh-devops-engineer`, and `tsh-ui-engineer` now use `Claude Sonnet 5`.
  - Cost/analysis and review commands (`/tsh-analyze-aws-costs`, `/tsh-analyze-gcp-costs`, `/tsh-analyze-materials`, `/tsh-explore-materials`, `/tsh-audit-infrastructure`, `/tsh-review-codebase`, `/tsh-review`) fold the upstream `GPT-5.6 Terra` / `Claude Sonnet 5` model changes into the delegated agents' Recommended model lines (Cursor commands do not bind models in frontmatter).
  - `tsh-software-engineer` now lists `Kimi K2.7 Code`, `GPT-5.3-Codex`, and `Gemini 3.5 Flash`; `tsh-plan-implementor` now lists `qwen3-coder-30b-a3b-instruct (customendpoint)`, `MAI-Code-1-Flash`, and `GPT-5.4 mini`.
- Website docs — Synced the Engineering Manager, Software Engineer, and `/tsh-implement` pages to the current model arrays.
- README — Added a Recommended Thinking Effort Settings table for manually configuring per-model thinking effort in the Cursor model picker (`GPT-5.6 Sol` medium, `GPT-5.6 Terra` medium/high, `GPT-5.6 Luna` high/xhigh, `Sonnet 5` high, `MAI-Code-1-Flash` high).

## 2026-07-10

### Added

- `playwright-cli` workflow skill (+ 10 reference guides) — CLI-first browser automation and capture skill (session management, storage state, tracing, request mocking, test/video generation, spec-driven testing) that replaces the Playwright MCP for UI verification (ported from copilot-collections PR #72)
- `tsh-ui-capture-worker` agent — Internal worker that performs CLI-based UI capture and optional screenshot-tripwire evidence collection for the verification loop; exports the shared `figma-expected.png` reference, writes per-iteration artifacts, and escalates blockers without judging visual correctness
- `ui-verification-flow` website doc — Documents the capture → review UI verification loop end to end

### Changed

- UI verification reworked from Playwright MCP to CLI capture — `tsh-ui-reviewer` now reviews CLI-captured ACTUAL evidence against a Figma EXPECTED export and delegates capture to `tsh-ui-capture-worker`; `tsh-ui-engineer` runs an explicit implement → capture → review loop (Figma-before-code gate, pinned dev-server URL, up to 5 iterations); `/tsh-review-ui`, `tsh-ui-verifying`, and `tsh-implement-ui` updated to the CLI capture contract with a strict PASS gate and `VERIFICATION NOT RUN` reporting
- `tsh-orchestrating-implementation` skill — Broadened the UI-verification hard-exclusion (any rendered-UI change on a Figma-backed screen triggers the verification gate, even without a `[REUSE]` task or Figma URL in hand)
- `tsh-creating-implementation-plans` skill and `plan.example.md` — Added a per-task UI Verification Status tracking convention
- `tsh-implementing-frontend` skill — Added a Step 0 Figma-fetch gate before UI implementation
- `.gitignore` — Ignore `.playwright-cli` capture output and the `specifications/` artifact tree
- Website docs — Reworked UI Engineer, UI Reviewer, UI Verification, frontend/e2e flow, Playwright integration, MCP setup, prerequisites, and quick-wins pages for the CLI capture workflow

## 2026-06-22

### Added

- `tsh-ui-engineer` agent — New UI-specialized implementor (Recommended model `Claude Sonnet 4.6`) that owns frontend and user-interface implementation. Carries the full UI toolset (Figma, Playwright, Context7, Sequential Thinking), the frontend skill bundle (`tsh-implementing-frontend`, `tsh-implementing-forms`, `tsh-writing-hooks`, `tsh-ensuring-accessibility`, `tsh-optimizing-frontend`, `tsh-ui-verifying`), delegates verification to `tsh-ui-reviewer`, and confirms scope before proceeding without a plan (ported from copilot-collections PR #70)
- `tsh-plan-implementor` agent — New internal-only (`disable-model-invocation: true`) strict implementor that executes one plan task at a time exactly as written, with a minimal toolset and a stop-and-report path for missing seams or ambiguous plans. Reuses the shared `tsh-implement-common-task` internal skill; Recommended model array `qwen3-coder-30b-a3b-instruct (customendpoint)` / `GPT-5.4 mini`
- Website docs pages for the UI Engineer and Plan Implementor agents

### Changed

- Software Engineer agent (`tsh-software-engineer`) — Refactored into the standard non-UI implementor: removed the Figma and Playwright tools and the UI skill bundle, switched to a `GPT-5.3-Codex` / `Gemini 3.5 Flash` Recommended model array, restructured into canonical XML sections, and added an explicit no-plan confirmation step. UI work now routes to `tsh-ui-engineer`
- `tsh-orchestrating-implementation` skill — Split the single implementor route into three: UI with Figma to `tsh-ui-engineer`, approved low-risk plan seams to `tsh-plan-implementor` (DEFAULT), and complex/no-plan non-UI work to `tsh-software-engineer` (EXCEPTION); added the no-plan confirmation gate and the software-engineer delegation-time model-selection note
- Engineering Manager agent (`tsh-engineering-manager`) — Registered `tsh-ui-engineer` and `tsh-plan-implementor` in the delegation roster, narrowed the `tsh-software-engineer` entry to the complex/no-plan non-UI exception path, and reconciled the constraints and delegation list
- Reference reconciliation — Repointed UI ownership to `tsh-ui-engineer` across `tsh-ui-reviewer`, `plan.example.md`, and the `tsh-implement-ui` internal skill, while keeping `tsh-software-engineer` as the default non-UI fix target in `tsh-code-reviewer` and `tsh-e2e-engineer` with an explicit UI exception
- Website docs — Reframed the Software Engineer page as non-UI, updated the agents overview table and handoff diagram to include the three implementors, and added the new agent pages

## 2026-06-19

### Added

- `tsh-technical-writer` agent — Internal worker agent that owns repository documentation, authoring and updating README, CHANGELOG, in-repo `/docs`, and website docs pages. Delegated to by the Engineering Manager for documentation-only work; never writes or edits product code (ported from copilot-collections PR #69)
- `tsh-writing-documentation` workflow skill — Canonical documentation-writing skill covering README, CHANGELOG, in-repo `/docs`, and the website docs site; includes documentation scope rules, accuracy-over-volume, structure-mirrors-neighbors, broken-link policy, and reader-centered craft guidelines from *Writing for Busy Readers*
- `tsh-write-documentation` internal skill — Worker handoff that delegates a bounded documentation task to `tsh-technical-writer` and loads `tsh-writing-documentation` before authoring begins
- Website docs pages for the Technical Writer agent and Writing Documentation skill

### Changed

- Engineering Manager agent (`tsh-engineering-manager`) — Added `tsh-technical-writer` to the delegation roster with documentation-only rules; tightened the "never writes product code" constraint to "never edits any file directly"; added read/search guardrails (routing decisions only, never for research or solving)
- `tsh-orchestrating-implementation` skill — Renamed the `never-writes-product-code` principle to `never-edits-files-directly` (all file types), added `read-search-routing-only` and `last-resort-stop-or-ask` principles, added documentation as a first-class routed work type, and tightened the handoff and fix-routing rules
- Website agents overview — Added the Technical Writer to the delegation diagram and the internal delegate-only agents table

## 2026-06-18

### Added

- Open-questions dispatch gate for implementation plans — plans with any `❓ Open` rows now block execution until `tsh-architect` resolves them (ported from copilot-collections PR #68)
- Executable-slot dispatch gate — plans can't be dispatched if any verification field, DoD command, or file path still contains placeholder/default values
- Planning-readiness gate in `tsh-orchestrating-implementation` — execution now checks that open questions are cleared before proceeding

### Changed

- `tsh-creating-implementation-plans` skill — hardened the plan contract: Wildly Important Goal now requires `Goal`, `Success Measure`, and `Do NOT touch / do NOT add`; phases require a `Verification` field with exact fast-running checks; tasks require `Files:` entries with `create`/`modify`/`reuse` labels and an optional `Stop Rule`; DoD distinguishes code tasks from docs/config tasks and requires stack-specific runnable checks or deterministic file assertions; UI verification clarified as distinct from full e2e
- `plan.example.md` template — updated to match the stricter plan contract (goal hierarchy, per-phase Verification, per-task Files/Stop Rule, docs-only task pattern, comment-wrapped implementation note)
- Plan Reviewer agent (`tsh-plan-reviewer`) — now blocks review when `## Open Questions` still contains `❓ Open`
- Website docs for Creating Implementation Plans — synced to the new template and workflow rules

## 2026-06-15

### Added

- `tsh-creating-implementation-plans` workflow skill — Centralized plan-structure ownership: the plan template (`plan.example.md`), phase/task ordering, Wildly Important Goal, per-task Clues, and definition-of-done rules (ported from copilot-collections PR #67)
- Direct architect/plan-reviewer nesting — `tsh-architect` now invokes `tsh-plan-reviewer` directly via the Task tool with a strict `<plan-review-report>` verdict schema, owning the review loop end to end

### Changed

- Architect agent (`tsh-architect`) — Tightened into a WHO-only architecture role, restructured into XML sections, delegated plan-structure ownership to `tsh-creating-implementation-plans`, and added the nested review contract (append-only `.plan-review.md`, mandatory review with low-risk exemptions, 3-iteration cap with structured user escalation)
- Plan Reviewer agent (`tsh-plan-reviewer`) — Returns a structured `<plan-review-report>` assessment to its invoker instead of self-routing to the architect; dropped the `todo` tool and added `tsh-creating-implementation-plans` to its skills
- Engineering Manager agent — Removed `tsh-plan-reviewer` from its delegation roster; plan review is now owned by the architect
- `tsh-orchestrating-implementation` skill — Step 2 now plans task order (not a binding call sequence); the planning sequence delegates the reviewed-plan handoff (including the nested review loop) to the architect
- `tsh-plan` internal skill and `tsh-architecture-designing` skill — Removed duplicated plan-authoring rules and moved them into `tsh-creating-implementation-plans`
- `tsh-creating-agents` skill — Documented the optional `<approach>` section and justified agent-specific domain tags
- Website docs — Updated architect, plan reviewer, engineering manager, architecture-design, skills overview, and internal plan/research/review-plan pages for the refactored flow

## 2026-06-11

### Added

- `tsh-orchestrating-implementation` workflow skill — Added the canonical implementation orchestration workflow with flow selection, delegation routing (Task-to-Owner table), todo control, and review/UI-verification gates (ported from copilot-collections PR #66)

### Changed

- Engineering Manager agent (`tsh-engineering-manager`) — Reworked into a WHO-only orchestrator that delegates implementation work through `tsh-orchestrating-implementation`; restructured into role, delegation roster, skills usage, tool usage, and constraints sections
- `/tsh-implement` command — Reduced to a thin trigger that hands off to the orchestration skill
- Website documentation — Updated the Engineering Manager and `/tsh-implement` docs to reflect the new orchestration flow

## 2026-06-09

### Added

- FAQ & Best Practices documentation — New `getting-started/faq.md` page capturing TSH team working habits: session sizing, when to start a new `/tsh-implement`, using `research.md`/`plan.md` vs. durable docs, spec folder organization, and model-switching guidance (ported from copilot-collections PR #65)

### Changed

- Engineering Manager agent (`tsh-engineering-manager`) — Repositioned as architect-advised orchestrator: added mandatory architect-consultation triggers, an explicit "never first writer of product code" boundary, and a `## Constraints` section; removed the `edit` tool so implementation work is always delegated (ported from copilot-collections PR #65)
- `/tsh-implement` command — Added orchestration-only guardrails requiring delegation before any source-code modification in both Quick and Full flows
- Code review workflow (`tsh-code-reviewing`) and Code Reviewer agent (`tsh-code-reviewer`) — Added a high-risk anti-pattern checklist (N+1 access patterns, in-memory pagination/filtering/aggregation) and treat missing integration coverage as a substantive finding when correctness depends on a real database or external service boundary
- Plan Reviewer agent (`tsh-plan-reviewer`) — Recommended model bumped to GPT-5.5

## 2026-06-04

### Changed

- Plan reviewer agent — Renamed `tsh-architect-reviewer` to `tsh-plan-reviewer`; added `edit` tool, REVISIONS NEEDED handoff to `tsh-architect`, and updated Engineering Manager and `/tsh-implement` delegation references (ported from copilot-collections PR #62)

## 2026-06-01

### Added

- `/tsh-explore-materials` command — Business Analyst exploration mode for ambiguous workshop inputs; produces `workshop-context-summary.md` before backlog extraction begins
- Internal BA worker agent skills — `tsh-ba-transcript-worker`, `tsh-ba-analysis-worker`, `tsh-ba-extraction-worker`, `tsh-ba-quality-worker`, `tsh-ba-formatting-worker` for model-specialized orchestration phases
- `intent-brief.example.md` and `task-baseline.example.md` — Example artifacts for Gate 0 intent brief and project baseline continuity

### Changed

- Business Analyst agent (`tsh-business-analyst`) — Reworked into an orchestrator that delegates transcript cleanup, context synthesis, extraction, quality review, and Jira formatting to internal BA workers while retaining all user-facing gates and Jira mutations
- `/tsh-analyze-materials` command — Added Gate 0 intent-brief approval, Explore Mode support, Lite/Full quality review with Gate 1.5, post-push Jira verification, and project baseline refresh after verified sync
- Task extraction, quality review, and Jira formatting workflow skills — Expanded for intent briefs, source traceability, GIVEN/WHEN/THEN acceptance criteria, Lite/Full review modes, and baseline refresh
- Product ideation documentation — Updated README, changelog, and website docs to reflect the new BA orchestration flow, optional exploration, expanded artifact set, and verified Jira sync process
- MCP setup documentation — Added post-installation steps and MCP verification checklist (ported from copilot-collections PR #64)

## 2026-05-17

### Changed

- Cost optimization — Switched default model from Claude Opus 4.6 to GPT-5.4 across implementation and infrastructure agents (`tsh-architect`, `tsh-engineering-manager`) and public prompts (`/tsh-implement`, `/tsh-analyze-aws-costs`, `/tsh-analyze-gcp-costs`, `/tsh-audit-infrastructure`, `/tsh-review-codebase`)
- `tsh-e2e-engineer` agent — Changed model from Claude Sonnet 4.6 to GPT-5.4 mini
- Internal prompts — Removed YAML frontmatter (agent, model, description) from all internal prompts (`tsh-deploy-kubernetes`, `tsh-implement-common-task`, `tsh-implement-e2e`, `tsh-implement-observability`, `tsh-implement-pipeline`, `tsh-implement-terraform`, `tsh-implement-ui-common-task`, `tsh-implement-ui`, `tsh-plan`, `tsh-research`); internal prompts now fully inherit context from the delegating agent

## 2026-05-15

### Changed

- Copilot customization agents — Updated model assignments: `tsh-copilot-engineer` and `tsh-copilot-orchestrator` switched from Claude Opus 4.6 to GPT-5.4; added explicit model to `tsh-copilot-artifact-creator` (GPT-5.4 mini), `tsh-copilot-artifact-reviewer` (Gemini 3.1 Pro), and `tsh-copilot-researcher` (Claude Sonnet 4.6)
- Copilot customization prompts (`/tsh-create-custom-agent`, `/tsh-create-custom-instructions`, `/tsh-create-custom-prompt`, `/tsh-create-custom-skill`) — Removed `model` field from frontmatter; prompts now inherit the model from the routed agent (`tsh-copilot-orchestrator`) instead of overriding it

## 2026-04-10

### Changed

- `/tsh-implement` prompt — Fixed chronic UI verification skipping: added mandatory UI task inventory at plan review (step 2), proactive dev server URL collection before implementation (step 3), elevated `[REUSE]` UI verification to a prominent task type with explicit delegation instructions (step 6), added mandatory UI Verification Gate before code review (step 8), and explicit code review delegation step (step 9); references `tsh-implement-ui.prompt.md` for full verification workflow instead of duplicating it
- Engineering Manager agent (`tsh-engineering-manager`) — Added "UI Verification Enforcement" subsection with 4-point checklist (inventory at plan review, early dev server URL collection, process in order, gate code review); strengthened `tsh-ui-reviewer` delegation with mandatory emphasis and "never skip" guardrail
- UI Reviewer agent (`tsh-ui-reviewer`) — Added "Tool-to-URL mapping" rule clarifying that all Figma data (URLs, node IDs, file keys) must go through `figma` tool and Playwright is only for dev server navigation

## 2026-04-01

### Changed

- Renamed Figma MCP server key from `figma-mcp-server` to `figma` across all agents, prompts, skills, MCP configuration, and documentation — aligns with Figma's recommended server naming in their official docs

## 2026-03-30

### Added

- Backend development skill `tsh-implementing-backend`

### Changed

- Updated `tsh-implementing-backend` skill reference in `tsh-software-engineer` agent
- Updated `tsh-implementing-backend` as a conditional skill in `implement` prompt for backend API tasks

## 2026-03-20

### Changed

- `/tsh-implement` prompt — Now auto-detects missing context and missing plan; delegates to `tsh-context-engineer` for research and `tsh-architect` for planning before implementation, with user confirmation between phases
- `/tsh-plan` prompt — Moved from public `.github/prompts/` to internal `.github/internal-prompts/`; no longer invoked directly by users — the Engineering Manager delegates to the Architect automatically when a plan is needed
- `/tsh-research` prompt — Moved from public `.github/prompts/` to internal `.github/internal-prompts/`; no longer invoked directly by users — the Engineering Manager delegates to the Context Engineer automatically when research is needed
- Engineering Manager agent (`tsh-engineering-manager`) — Added `tsh-context-engineer` to subagents; added structured workflow to decide between research, planning, and implementation phases; added delegation rules for `tsh-context-engineer` (missing context) and `tsh-architect` (missing plan); added Sequential Thinking usage for phase routing decisions
- Business Analyst agent (`tsh-business-analyst`) — Replaced "Deep-dive Research per Task" and "Prepare Implementation Plan" handoff buttons with single "Start Implementation" handoff routing to Engineering Manager
- Context Engineer agent (`tsh-context-engineer`) — Replaced "Prepare Implementation Plan" handoff button with "Start Implementation" handoff routing to Engineering Manager
- Updated website documentation: moved `/tsh-plan` and `/tsh-research` prompt pages from public to internal section; updated agents overview, prompts overview, workflow docs, and getting started pages

## 2026-03-17

### Added

- Engineering Manager agent (`tsh-engineering-manager`) — Orchestrates the implementation phase by delegating tasks to specialized agents (Software Engineer, E2E Engineer, DevOps Engineer, Architect, Code Reviewer, UI Reviewer) based on the implementation plan; uses Sequential Thinking for ambiguous routing; auto-triggers code review if no review phase is defined; tracks progress via plan checkboxes
- Internal prompts directory (`.github/internal-prompts/`) — Agent-only prompts not visible in the slash command menu, used exclusively for sub-agent delegation by the Engineering Manager
- Internal prompt `tsh-implement-common-task` — Base implementation workflow for Software Engineer delegated tasks (backend and non-Figma frontend)
- Internal prompt `tsh-implement-ui-common-task` — Extends `tsh-implement-common-task` with UI-specific behaviors for Figma-based frontend tasks
- Internal prompt `tsh-implement-ui` — Full UI implementation + verification loop orchestration for the Engineering Manager
- Documentation page for the Engineering Manager agent on the website
- Documentation pages for all new internal prompts on the website

### Changed

- `/tsh-implement` prompt — Rewritten to route through the Engineering Manager agent instead of Software Engineer; now delegates tasks to specialized agents based on plan task types (`[CREATE]`, `[MODIFY]`, `[REUSE]`)
- Architect agent (`tsh-architect`) — Handoff now routes to Engineering Manager instead of Software Engineer; removed "Start UI Implementation" handoff button (consolidated into single "Start Implementation"); reformatted tools list YAML; updated plan template to include `[REUSE]` UI verification tasks delegated to `tsh-ui-reviewer`
- Architecture Designing skill (`tsh-architecture-designing`) — Updated plan phases to run only fast tests/checks per phase (unit, integration, linters, build); added code review phase requirement using `tsh-code-reviewer` with `tsh-review.prompt.md`; added `[REUSE]` UI verification task pattern for Figma-based features
- UI Reviewer agent (`tsh-ui-reviewer`) — Removed "Start UI Implementation" and "Implement UI Fixes" handoff buttons (Engineering Manager now owns the verify-fix loop); added explicit dev server URL confirmation requirement; added authentication/login screen detection and escalation; added "reading source code is NOT verification" guardrail
- Code Reviewer agent (`tsh-code-reviewer`) — Added explicit mention of e2e tests alongside unit and integration tests in verification requirements
- Software Engineer agent (`tsh-software-engineer`) — Removed `atlassian/search` from tool access (Atlassian context now gathered by Engineering Manager)
- `/tsh-plan` prompt — Minor update
- `/tsh-review-ui` prompt — Minor update
- `/tsh-review` prompt — Minor update
- Prompts reorganized into public and internal categories on the documentation website with separate sidebar sections
- Moved 7 infrastructure/DevOps prompts from public `.github/prompts/` to internal `.github/internal-prompts/` (`tsh-deploy-kubernetes`, `tsh-implement-e2e`, `tsh-implement-observability`, `tsh-implement-pipeline`, `tsh-implement-terraform`)
- Updated agents overview documentation with Engineering Manager in the handoff diagram and agent summary table
- Updated prompts overview documentation with public/internal prompt distinction and delegation table
- Updated workflow documentation (standard flow, frontend flow, e2e flow) to reflect Engineering Manager orchestration

### Removed

- `/tsh-implement-ui` public prompt — Consolidated into `/tsh-implement`; UI implementation is now handled internally by the Engineering Manager's delegation to Software Engineer + UI Reviewer
- `/tsh-clean-transcript` prompt — Removed (functionality available through `/tsh-analyze-materials`)
- `/tsh-create-jira-tasks` prompt — Removed (functionality available through `/tsh-analyze-materials`)

## 2026-03-08

### Added

- Ensuring Accessibility skill (`tsh-ensuring-accessibility`) — WCAG 2.1 AA compliance, semantic HTML, ARIA patterns, keyboard navigation, focus management, screen reader support, and color contrast requirements
- Implementing Forms skill (`tsh-implementing-forms`) — Form architecture, schema-based validation, field composition, error handling, multi-step form flows, and accessible form patterns
- Frontend Optimization skill (`tsh-optimizing-frontend`) — Rendering optimization, code splitting, memoization strategies, bundle size control, asset optimization, and memory management with React-specific reference patterns
- Frontend Review skill (`tsh-reviewing-frontend`) — Frontend-specific code review criteria: component anti-patterns, hooks quality, rendering correctness, accessibility and performance spot-checks, module organization with React-specific reference checklist
- Writing Hooks skill (`tsh-writing-hooks`) — Custom hook and composable patterns: naming, composition, stable return shapes, lifecycle cleanup, and testing strategies with React-specific reference patterns
- React-specific reference files (`references/react-patterns.md`) for implementing-frontend, optimizing-frontend, reviewing-frontend, and writing-hooks skills
- Documentation pages for all 5 new skills on the website

### Changed

- Software Engineer agent (`tsh-software-engineer`) — Added 4 new frontend skills to skills list (`tsh-implementing-forms`, `tsh-writing-hooks`, `tsh-ensuring-accessibility`, `tsh-optimizing-frontend`); added `tsh-ui-reviewer` as subagent for verification delegation; reformatted tools list
- Code Reviewer agent (`tsh-code-reviewer`) — Added `tsh-reviewing-frontend` skill for frontend-specific review criteria
- UI Reviewer agent (`tsh-ui-reviewer`) — Rewritten to emphasize subagent usage pattern, mandatory tool-based verification (never mental comparison), transparent error reporting with LOW confidence; reformatted tools list
- Frontend Implementation skill (`tsh-implementing-frontend`) — Refactored to focus on component patterns and composition, moved accessibility to dedicated `tsh-ensuring-accessibility` skill; added React-specific reference file
- UI Verification skill (`tsh-ui-verifying`) — Rewritten with 5-step verification process, verification order (stop on first CRITICAL failure), and improved report format
- `/tsh-implement-ui` prompt — Rewritten to use `tsh-ui-reviewer` as subagent (not `/tsh-review-ui` prompt call); added `tsh-ensuring-accessibility` skill; clarified that SE must never verify UI itself
- `/tsh-review-ui` prompt — Simplified to delegate entirely to `tsh-ui-verifying` skill workflow; fixed "all differences" wording to align with skill's stop-on-critical-failure rule
- Updated website documentation for Software Engineer, Code Reviewer, UI Reviewer agents and `/tsh-implement-ui`, `/tsh-review-ui` prompts
- Updated skills overview: skill count 25 → 30, added new skills to Development and Quality tables, updated agent–skill matrix
- Fixed Architect agent docs — added 7 missing skills (multi-cloud, cloud cost, CI/CD, Terraform, secrets, Kubernetes, observability)
- Fixed DevOps Engineer agent docs — added missing `tsh-codebase-analysing` skill
- Fixed Frontend Flow workflow docs — added `tsh-ensuring-accessibility` to required skills, updated subagent terminology

## 2026-03-06

### Added

- DevOps Engineer agent (`tsh-devops-engineer`) — Senior DevOps Engineer and Consultant persona specializing in Golden Paths, automation, and Cloud governance; mandatory architect sub-agent delegation for all design decisions; multi-cloud guardrails with FinOps alerts (>10% cost increase triggers alert); three-option output strategy (Golden Path, Cost-Optimized, Velocity); mandatory skill-loading chains for 8 task types; tools include AWS API MCP, AWS Docs MCP, GCP gcloud/observability/storage MCPs, Context7, Sequential Thinking
- Multi-Cloud Architecture skill (`tsh-designing-multi-cloud-architecture`) for selecting and integrating services across AWS, Azure, and GCP with service comparison and multi-cloud pattern references
- CI/CD Implementation skill (`tsh-implementing-ci-cd`) for pipeline design patterns and deployment strategies
- Kubernetes Implementation skill (`tsh-implementing-kubernetes`) for deployment patterns, Helm charts, and cluster management
- Observability Implementation skill (`tsh-implementing-observability`) for logging, monitoring, alerting, and distributed tracing patterns
- Terraform Modules skill (`tsh-implementing-terraform-modules`) for reusable Terraform modules across AWS, Azure, and GCP with per-cloud module references
- Secrets Management skill (`tsh-managing-secrets`) for secrets management patterns in cloud and Kubernetes environments
- Cloud Cost Optimization skill (`tsh-optimizing-cloud-cost`) for rightsizing, tagging strategies, and spending analysis with tagging standards reference
- AWS cost analysis prompt (`/tsh-analyze-aws-costs`) for cost optimization and tagging compliance audit with hybrid IaC + live API approach
- GCP cost analysis prompt (`/tsh-analyze-gcp-costs`) for cost optimization and labeling compliance audit with hybrid IaC + live API approach
- Infrastructure audit prompt (`/tsh-audit-infrastructure`) for multi-scope audit (AWS/Azure/GCP/K8s/CI-CD) covering security, cost, and best practices
- Kubernetes deployment prompt (`/tsh-deploy-kubernetes`) for deployments, Helm charts, and workload configurations
- CI/CD pipeline prompt (`/tsh-implement-pipeline`) for pipelines with deployment stages and environment protection
- Terraform implementation prompt (`/tsh-implement-terraform`) for Terraform modules and cloud infrastructure provisioning
- Observability implementation prompt (`/tsh-implement-observability`) for metrics, logs, traces, and alerting solutions

### Changed

- Updated Architect agent (`tsh-architect`) with handoff to DevOps Engineer for infrastructure implementation
- Renamed 7 new infrastructure skill directories with `tsh-` prefix (continuation of 2026-03-05 prefix migration)
- Renamed 7 new infrastructure prompt files with `tsh-` prefix
- Updated all skill cross-references in architect agent, devops engineer agent, and all 7 infrastructure SKILL.md files
- Updated all skill references in 7 infrastructure prompt files

## 2026-03-05

### Changed

- Added `tsh-` prefix to all Copilot customization artifacts to prevent naming collisions when used alongside project-specific customizations
- Renamed all 18 skill directories to include `tsh-` prefix (e.g., `code-reviewing` → `tsh-code-reviewing`, `creating-agents` → `tsh-creating-agents`)
- Renamed all 15 prompt files to include `tsh-` prefix (e.g., `/create-custom-agent` → `/tsh-create-custom-agent`, `/implement` → `/tsh-implement`)
- Renamed worker agents to include `tsh-` prefix: `copilot-researcher` → `tsh-copilot-researcher`, `copilot-artifact-creator` → `tsh-copilot-artifact-creator`, `copilot-artifact-reviewer` → `tsh-copilot-artifact-reviewer`
- Updated all cross-references between artifacts to use prefixed names

### Added

- Naming convention instruction (`.github/instructions/naming-conventions.instructions.md`) enforcing `tsh-` prefix on all artifact filenames, frontmatter names, and cross-references
- `tsh-` prefix explanation note in README for external users

## 2026-03-02

### Added

- Custom agent creation prompt (`/create-custom-agent`) for creating new `.agent.md` files via the orchestrator — researches existing patterns, guides design decisions, creates and validates the agent file
- Custom skill creation prompt (`/create-custom-skill`) for creating new `SKILL.md` files via the orchestrator — enforces gerund naming, creates supporting resources alongside the skill file
- Custom prompt creation prompt (`/create-custom-prompt`) for creating new `.prompt.md` files via the orchestrator — identifies correct agent routing, ensures prompt follows established patterns
- Custom instructions creation prompt (`/create-custom-instructions`) for creating new `.instructions.md` or `copilot-instructions.md` files via the orchestrator — helps decide between repo-level and file-scoped instructions

### Changed

- Creating Agents, Creating Skills, Creating Prompts, and Creating Instructions skills marked as internal (agent-only) — hidden from the slash command menu via `user-invokable: false` in SKILL.md frontmatter while remaining accessible to agents
- New `/create-custom-*` prompts serve as the recommended user-facing entry points for Copilot customization workflows, replacing direct skill invocation

## 2026-03-01

### Changed

- Restructured README around the full product development lifecycle: Product Ideation → Development → Quality
- Reorganized Agents, Skills, and Prompts sections into lifecycle phase groups (Product Ideation, Development, Quality)
- Moved Context Engineer from Product Ideation to Development agents
- Renamed "Backlog" phase to "Product Ideation" across the entire README
- Updated workflow examples to show `/research` under Development (not Product Ideation)
- Replaced flat prompt/agent listings with per-phase tables in "Using This Repository" section
- Updated Summary to reflect full lifecycle framing
- Renamed agent: `tsh-workshop-analyst` → `tsh-business-analyst`
- Renamed agent: `tsh-business-analyst` → `tsh-context-engineer` (old Business Analyst became Context Engineer)
- Renamed prompt: `/workshop-analyze` → `/analyze-materials`
- Renamed prompt: `/transcript-clean` → `/clean-transcript`
- Renamed prompt: `/code-quality-check` → `/review-codebase`
- Renamed prompt: `/e2e` → `/implement-e2e`
- Renamed skill: `task-extraction` → `task-extracting`
- Renamed skill: `task-quality-review` → `task-quality-reviewing`
- Renamed skill: `frontend-implementation` → `implementing-frontend`
- Renamed skill: `ui-verification` → `ui-verifying`
- Renamed skill: `architecture-design` → `architecture-designing`
- Renamed skill: `code-review` → `code-reviewing`
- Renamed skill: `codebase-analysis` → `codebase-analysing`
- Renamed skill: `implementation-gap-analysis` → `implementation-gap-analysing`
- Renamed skill: `task-analysis` → `task-analysing`

## 2026-02-27

### Added

- Copilot Engineer agent (`tsh-copilot-engineer`) for designing, creating, reviewing, and improving all GitHub Copilot customization artifacts — custom agents, skills, prompts, and instructions
- Copilot Orchestrator agent (`tsh-copilot-orchestrator`) for coordinating complex, multi-step Copilot engineering tasks by decomposing work into focused subtasks and delegating to specialized workers
- Copilot Researcher worker agent (`copilot-researcher`) for gathering, analyzing, and summarizing information from codebases and documentation — read-only research specialist for orchestrator delegation
- Copilot Artifact Creator worker agent (`copilot-artifact-creator`) for building and modifying Copilot customization artifacts based on detailed specifications — creation specialist for orchestrator delegation
- Copilot Artifact Reviewer worker agent (`copilot-artifact-reviewer`) for evaluating Copilot customization artifacts against best practices, workspace consistency, and structural correctness — review specialist for orchestrator delegation
- Orchestrator pattern documentation (`docs/orchestrator-pattern.md`) describing the orchestrator + specialized workers architecture as an alternative to monolithic agents, addressing context window degradation in complex multi-step tasks
- Creating Agents skill (`creating-agents`) with agent file template, structural conventions, and validation checklist for building `.agent.md` files
- Creating Skills skill (`creating-skills`) with naming conventions, body structure guidelines, progressive disclosure patterns, templates, and examples for building `SKILL.md` files
- Creating Prompts skill (`creating-prompts`) with prompt file template, workflow focus guidelines, and validation checklist for building `.prompt.md` files
- Creating Instructions skill (`creating-instructions`) with templates for repository-level and granular instruction files, decision framework for instruction vs. skill placement

### Changed

- Adopted gerund-form naming convention (`verb-ing` + `object`) as the standard for all skill directories, documented in README and enforced by the Creating Skills skill
- Existing skills will be adapted to follow the new gerund-form naming convention in separate upcoming pull requests

## 2026-02-24

### Added

- Workshop Analyst agent (`tsh-workshop-analyst`) for converting discovery workshop materials (transcripts, designs, codebase context) into Jira-ready epics and user stories
- Transcript Processing skill (`transcript-processing`) for cleaning raw workshop/meeting transcripts and extracting structured business-relevant content
- Task Extraction skill (`task-extraction`) for identifying and structuring epics and user stories from workshop materials
- Task Quality Review skill (`task-quality-review`) for analyzing extracted tasks for quality gaps, missing edge cases, and improvement opportunities
- Jira Task Formatting skill (`jira-task-formatting`) for transforming extracted tasks into Jira-ready format with field mapping and markdown compatibility
- Workshop analysis prompts: `/workshop-analyze`, `/transcript-clean`, `/create-jira-tasks`

## 2026-02-18

### Added

- SQL & Database engineering skill covering schema design (naming conventions, primary key strategies, data types, normalisation), performant SQL writing, indexing strategies, join optimisation, locking mechanics, transactions, query debugging with EXPLAIN ANALYZE, and ORM integration (TypeORM, Prisma, Doctrine, Eloquent, Entity Framework, Hibernate, GORM). Applies to PostgreSQL, MySQL, MariaDB, SQL Server, and Oracle

## 2026-02-17

### Added

- Frontend Implementation skill (`frontend-implementation`) for accessibility, design system usage, component patterns, and performance guidelines
- UI Verification skill (`ui-verification`) for verification criteria, tolerances, checklists, and severity definitions

### Changed

- Consolidated `tsh-frontend-software-engineer` agent into `tsh-software-engineer` - frontend capabilities are now handled via skills
- Updated `tsh-software-engineer` tool guidelines with frontend-specific scenarios (Figma, Playwright, design tokens)
- Made skills tool-agnostic by removing hardcoded tool names
- Refactored `implement-ui.prompt.md` and `review-ui.prompt.md` to reference skills instead of duplicating content

### Removed

- `tsh-frontend-software-engineer` agent (replaced by `tsh-software-engineer` + frontend skills)

## 2026-02-15

### Added

- Code quality check prompt (`/code-quality-check`) for comprehensive repository analysis covering dead code detection, duplication identification, improvement opportunities, and architecture review

## 2026-02-08

### Added

- Technical context discovery skill for codebase exploration and understanding

### Changed

- Refactored agents, prompts, and skills to follow a consistent standard
- Improved architecture-design plan example with expanded detail
- Updated implementation-gap-analysis and task-analysis examples
- Streamlined agent definitions by extracting workflow logic into prompts and skills

## 2026-02-07

### Added

- Skills support for modular, domain-specific agent capabilities (architecture-design, code-review, codebase-analysis, e2e-testing, implementation-gap-analysis, task-analysis)

### Changed

- Cleaned up repository structure

## 2026-02-05

### Changed

- Switched default model to Claude Opus 4.6
- Updated documentation for VS Code 1.109 compatibility

## 2026-02-03

### Removed

- GitHub MCP integration
- Copilot Spaces usage from agents

## 2026-01-29

### Fixed

- Updated tool names to follow new VS Code naming pattern

## 2026-01-21

### Fixed

- Updated Atlassian MCP URL to new recommended endpoint

## 2026-01-15

### Changed

- Removed "(Preview)" label from model names in all prompt files for consistency

## 2026-01-08

### Changed

- Updated package name

## 2026-01-07

### Changed

- Updated agent tools for improved functionality and testing capabilities

## 2025-12-18

### Added

- Frontend Software Engineer agent with UI implementation workflow
- UI implementation prompt with iterative UI verification process

## 2025-12-16

### Changed

- Standardized tool names across all agents

## 2025-12-15

### Changed

- Separated workflow instructions from agent identity definitions

## 2025-12-12

### Added

- Language consistency guidelines for agents

### Changed

- Code reviewer now runs automatically after implementation

## 2025-12-11

### Added

- Copilot Pro license requirement documentation

## 2025-12-10

### Changed

- Updated review prompt model to Claude Opus 4.5

## 2025-12-08

### Added

- Domain-specific Copilot Spaces support for agents
- Code reviewer as a subagent of the software engineer

## 2025-12-02

### Added

- VS Code version requirement documentation (1.99+)

### Changed

- Generalized software engineer agent (previously backend-specific)
- Standardized agent descriptions and enforced instructions usage
- Switched agents to use Claude Opus

## 2025-11-28

### Added

- Figma MCP Server integration for UI verification
- Git-committer agent with automated commit message generation

## 2025-11-26

### Added

- `tsh-` prefix for all agent names for namespace consistency
- Atlassian resource accessibility checks

## 2025-11-23

### Added

- Detailed MCP tool usage guidelines for all agents (Context7, Playwright, Figma, Atlassian)

## 2025-11-21

### Added

- Sequential Thinking MCP integration for complex problem-solving
- Data Engineer agent

## 2025-11-20

### Added

- MCP server configurations (Playwright, Context7, Figma Dev Mode, Atlassian)
- UI/Figma verification agent and review workflow
- Frontend Software Engineer agent (initial base)

## 2025-11-19

### Added

- MCP configuration for workspace and user-level setups
- LICENSE file and updated README

## 2025-11-14

### Added

- Agent-based architecture with handoffs (Architect, Business Analyst, Software Engineer, Code Reviewer)

### Changed

- Updated models to GPT-5.1 across prompts
- Specified Figma MCP usage in research workflow

## 2025-11-05

### Changed

- Planning prompt now focuses on tasks only, excluding improvements

## 2025-11-03

### Added

- New operational mode and additional tools

## 2025-10-31

### Changed

- Narrowed Atlassian/Jira access scope
- Enhanced planning and research prompts with implementation analysis guidelines

## 2025-10-29

### Added

- Plan prompt with task-specific implementation focus

## 2025-10-28

### Added

- Initial project setup with EditorConfig, Prettier, Husky, and Copilot configurations
- Automated commit message generation prompt
- Security review configuration and documentation
