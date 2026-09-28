# Workflow Skills Audit — `.cursor/skills/workflows/`

Branch: `refactor/unified-agent-structure` · Audited: 2026-09-27 · Scope: every directory under `.cursor/skills/workflows/` plus its supporting files.

> **Count correction:** the brief said 29 skills. The directory actually holds **34** workflow skills. All 34 are covered below.

Paths in `file:line` citations are relative to `.cursor/skills/workflows/` unless stated otherwise.

## Summary Table

| # | Skill | Verdict | Severity |
|---|---|---|---|
| 1 | tsh-architecture-designing | Keep (fix refs and description) | major |
| 2 | tsh-code-reviewing | Keep | minor |
| 3 | tsh-codebase-analysing | Keep | minor |
| 4 | tsh-committing | Keep (move repo-specific parts to a rule) | minor |
| 5 | tsh-creating-agents | Rewrite for multiple tools | major |
| 6 | tsh-creating-commands | Rewrite for multiple tools, delete deprecated template | major |
| 7 | tsh-creating-rules | Rewrite for multiple tools (Cursor rules / CLAUDE.md / AGENTS.md) | major |
| 8 | tsh-creating-skills | Rewrite around the neutral source format | major |
| 9 | tsh-designing-multi-cloud-architecture | Keep (refresh data, rename) | minor |
| 10 | tsh-e2e-testing | Keep (expand into a proper process) | minor |
| 11 | tsh-engineering-prompts | Keep (update outdated guidance, move templates out) | major |
| 12 | tsh-ensuring-accessibility | Keep (move to WCAG 2.2) | minor |
| 13 | tsh-implementation-gap-analysing | Keep | minor |
| 14 | tsh-implementing-backend | Split (over 500 lines) | major |
| 15 | tsh-implementing-ci-cd | Keep (fix bugs, move IaC section out) | major |
| 16 | tsh-implementing-forms | Keep | minor |
| 17 | tsh-implementing-frontend | Keep (complete the React reference) | minor |
| 18 | tsh-implementing-kubernetes | Keep (replace retired ingress-nginx guidance) | major |
| 19 | tsh-implementing-observability | Keep | minor |
| 20 | tsh-implementing-terraform-modules | Keep (refresh versions, take the IaC-pipeline content) | minor |
| 21 | tsh-jira-task-formatting | Keep (split Import Mode out, fix contradictions) | major |
| 22 | tsh-managing-secrets | Keep (fix removed GitLab variable, K8s claim) | major |
| 23 | tsh-migrating-copilot-to-cursor | Rewrite as Copilot → neutral source, or delete | major |
| 24 | tsh-optimizing-cloud-cost | Keep (rewrite the tagging reference) | major |
| 25 | tsh-optimizing-frontend | Keep | minor |
| 26 | tsh-reviewing-frontend | Keep (do not merge into code-reviewing) | minor |
| 27 | tsh-sql-and-database-understanding | Split (1229 lines) and rename | major |
| 28 | tsh-task-analysing | Keep (narrow the scope, remove Copilot leftover) | minor |
| 29 | tsh-task-extracting | Keep | minor |
| 30 | tsh-task-quality-reviewing | Keep (move passes to references/) | minor |
| 31 | tsh-technical-context-discovering | Keep (rewrite discovery for multiple tools) | major |
| 32 | tsh-transcript-processing | Keep | minor |
| 33 | tsh-ui-verifying | Keep | minor |
| 34 | tsh-writing-hooks | Keep | minor |

Totals: **15 major**, **19 minor**, **0 none**. No skill should be deleted outright, except possibly #23. Two skills need splitting (#14, #27). No skills need merging, though several overlaps need their boundaries tightened (see Cross-Cutting Findings §4).

---

## Cross-Cutting Findings

### 1. Supporting-file layout is inconsistent (standard: `scripts/`, `references/`, `assets/`)

| Pattern | Skills |
|---|---|
| Loose `*.example.md` in skill root (all are really **output templates** with placeholders) | architecture-designing (`plan.example.md`), codebase-analysing, implementation-gap-analysing, jira-task-formatting (×2), task-analysing, task-extracting (×2), task-quality-reviewing, transcript-processing |
| Loose `*.template.md` in skill root | creating-agents, creating-commands (×2), creating-skills |
| `assets/` (standard-compliant) | creating-rules **only** |
| Non-standard `examples/` dir | creating-skills |
| `references/` (standard-compliant) | creating-skills, designing-multi-cloud-architecture, implementing-backend, implementing-frontend, implementing-terraform-modules, optimizing-cloud-cost |

`tsh-creating-skills/SKILL.md:275,278` explicitly allows "Skill root or `assets/`", which keeps this inconsistency going.
**Recommendation:** move every fill-in template to `assets/<name>.template.md` and every worked example to `references/<name>.example.md`, and update all `./x.example.md` references. Enforce the rule in the generator or linter.

### 2. Reference files over 100 lines without a TOC (a rule in `tsh-creating-skills/SKILL.md:285`)
`plan.example.md` (158), `codebase-analysis.example.md` (218), `extracted-tasks.example.md` (105), `jira-task.example.md` (319), `quality-review.example.md` (156), `multi-cloud-patterns.md` (316), `service-comparison.md` (170), `skill.template.md` (149).

### 3. Naming inconsistencies
- **Word order.** 21 names are gerund-first (`tsh-creating-*`, `tsh-implementing-*`, `tsh-optimizing-*`, `tsh-ensuring-*`, …). 13 are object-first: `architecture-designing`, `code-reviewing`, `codebase-analysing`, `e2e-testing`, `implementation-gap-analysing`, `jira-task-formatting`, `sql-and-database-understanding`, `task-analysing`, `task-extracting`, `task-quality-reviewing`, `technical-context-discovering`, `transcript-processing`, `ui-verifying`. The rule file `.cursor/rules/tsh-naming-conventions.mdc:17` says `tsh-<gerund-subject>` and gives the object-first `tsh-technical-context-discovering` as its example. `tsh-creating-skills/SKILL.md:106-146` requires `{gerund}-{object}` and lists noun-first forms under "Avoid". **The two sources contradict each other.** The architect must pick one form.
- **Spelling.** British `analysing` sits alongside American `optimizing` and `analyze` (e.g. the `/tsh-analyze-*` commands).
- **Length.** `tsh-creating-skills/SKILL.md:120` says to aim for under 20 characters. Most names are longer, e.g. `tsh-designing-multi-cloud-architecture` (38) and `tsh-sql-and-database-understanding` (34).
- The name/dir match holds for all 34 skills. The `tsh-` prefix is present on all of them.

### 4. Overlap map (verdict: tighten boundaries, no merges)
| Cluster | Finding | Action |
|---|---|---|
| code-reviewing vs reviewing-frontend | Complementary: reviewing-frontend says "use alongside" (L8, L13). However, code-reviewing never points to it, and only reviewing-frontend defines a severity/report format. | Keep both. Move one shared severity model and finding format into code-reviewing; reviewing-frontend inherits it. Add the cross-link. |
| task-analysing vs technical-context-discovering vs codebase-analysing vs implementation-gap-analysing | Outputs differ (`research.md`; conventions for the current task; full-repo audit report; gap report). The problem is the descriptions: task-analysing claims it "performs gap analysis" (L3), which is the gap skill's job, and codebase-analysing and gap-analysing have no "Use when". | Keep all four. Rewrite the descriptions with exclusive triggers. Remove "gap analysis" from task-analysing. Standardise the gap terminology used in `plan.example.md` (see #1). |
| implementing-ci-cd vs implementing-kubernetes | Small overlap: "GitOps" is listed in ci-cd When-to-Use (L12) but covered only in kubernetes (L24-25, L315). The larger overlap is **ci-cd vs terraform**: ci-cd L92-187 is a full Terraform/Terragrunt pipeline section. | Move the IaC pipeline section to terraform (or `terraform/references/ci-pipelines.md`). Choose one GitOps owner. |
| implementing-ci-cd vs managing-secrets | The CI credentials decision table appears in both (ci-cd L45-54, secrets L42-53), with the same Bitbucket inaccuracy in each. | Keep it in secrets only; ci-cd links to it. |
| implementing-backend vs sql-and-database-understanding vs implementing-observability | Backend "Database Handling" (L230-260) repeats SQL naming, PK and soft-delete guidance. Backend "Logging & Observability" (L391-419) repeats the observability structured-logging section. | Backend keeps only app-level rules and links to the other two. |
| writing-hooks vs optimizing-frontend vs reviewing-frontend | Effect-cleanup and memoization rules appear three times (writing-hooks L125-134, optimizing-frontend L85-93, reviewing-frontend L68-72). | Keep the canonical rules in writing-hooks; the others link to it. |
| designing-multi-cloud-architecture vs optimizing-cloud-cost | Both have pricing-model tables (multi-cloud L108-125, cost L15-22). | Keep them in cost only. |

### 5. Tool-specific coupling outside the meta skills
- **MCP server / tool names used as instructions:** `context7` (ci-cd L24/68, kubernetes L27, observability L33, secrets L32/59, technical-context L80, quality-reviewing L243/253), `pdf-reader` (architecture L26, task-analysing L30/53, task-extracting L54, transcript L33), `figma`/`playwright` (ui-verifying L33/41/51), `browser_snapshot` (e2e L38), Atlassian `List accessible Resources` (quality-reviewing L75), "Atlassian MCP" (jira L185/229), `search` and `usages` (technical-context L74; `usages` is a VS Code/Copilot tool).
  **Recommendation:** describe the capability instead ("documentation lookup (e.g. Context7 MCP)", "PDF extraction tool"). Declare the dependency in the standard `compatibility` frontmatter field so the generator can map it per target.
- **Copilot "question popup" leftovers:** task-extracting L136 and task-quality-reviewing L291 say "popup". This comes from `vscode/askQuestions`. Cursor, Claude Code and Codex each render questions differently. Use "ask the user one question at a time".
- **Hardcoded repo paths:** `specifications/<…>/` output locations appear in transcript L108, task-extracting L152, jira L116/167/263, quality-reviewing L320 and ui-verifying L55. They are fine as defaults, but they should be named as a configurable convention, because consumer projects may not have `specifications/`.
- **Agent names tied to this repo's orchestration:** architecture-designing L69-73, implementing-frontend L85, task-extracting L22-23. Acceptable, because agents are generated too, but the generator must keep these names stable across targets.

### 6. Other cross-cutting issues
- **Section heading drift.** "Connected Skills" is used in most skills; "Related Skills" in multi-cloud, ci-cd, kubernetes, observability, secrets, cost and terraform; "References" in committing. The section is **missing entirely** in codebase-analysing, e2e-testing, implementation-gap-analysing and technical-context-discovering.
- **"When to Use" body sections** repeat the description (multi-cloud L14, backend L10, ci-cd L8, kubernetes L8, observability L8, secrets L8, cost L8, terraform L14, technical-context L10). Under progressive disclosure the trigger belongs in `description`. Drop these sections or fold them into the description.
- **Cross-skill file references.** `../tsh-implementing-frontend/references/react-patterns.md` is loaded by reviewing-frontend L217, optimizing-frontend L186 and writing-hooks L217. This breaks the rule that a skill is self-contained and references go one level deep. It also stops working if skills are installed selectively. Move the shared file to its own skill, or reference it by skill name.
- **Missing repo tooling:** `CLAUDE.md` refers to `scripts/sync-claude.sh`, `.claude/skills/` and `.mcp.json`, but only `scripts/count-skills.sh` exists. Out of scope here, but relevant to the generator design.

---

## Per-Skill Audit

### 1. tsh-architecture-designing
1. **Facts:** frontmatter `name`, `description`. SKILL.md 88 lines. Supporting file: `plan.example.md` (158, root).
2. **Verdict:** Keep as a model-invoked knowledge skill. It is the architect's core planning procedure.
3. **Coupling:** `plan.example.md:51` names "`.cursor/rules/*.mdc` rules"; `plan.example.md:117` hardcodes `.cursor/skills/commands/tsh-review-ui/SKILL.md`; L26 names the `pdf-reader` tool.
4. **Compliance:** the description has no "Use when" trigger (L3). The body is under 500 lines. Progressive disclosure is used (template file). The template is loose in the root. The name is object-first.
5. **Content issues:**
   - **Broken refs:** L69 `../commands/tsh-review/SKILL.md`, L71 `../commands/tsh-review-ui/SKILL.md` and L73 `../internal/tsh-engineer-prompt/SKILL.md` resolve to `workflows/commands/…`, which does not exist. They need `../../`, or better, a skill-name reference.
   - L48 says "Test Driven Design"; it should be Test-Driven Development.
   - L75 says "Don't provide … code review instructions", while L69 requires a code-review phase. The wording is ambiguous.
   - The phase headings in `plan.example.md` (L21-33: Already Implemented / To Be Modified / To Be Created) differ from the gap-analysis template (To Be Implemented / Modified / Reused). The skill's own L65 says to embed the gap result, so the terms should match.
   - Typos: L67 "phases.Each", L77 "Create a implementation".
6. **Changes:**
   - Rewrite the description as "Designs … Use when planning a feature, producing `*.plan.md` …".
   - Replace the relative links with skill names (`tsh-review`, `tsh-review-ui`, `tsh-engineer-prompt`).
   - Move `plan.example.md` to `assets/plan.template.md`, add a TOC, and replace the `.cursor/…` paths with neutral names.
   - Align the gap terms with tsh-implementation-gap-analysing.
   - Say "PDF extraction tool" instead of `pdf-reader`.

### 2. tsh-code-reviewing
1. **Facts:** `name`, `description`. 89 lines. No supporting files.
2. **Verdict:** Keep. It is the shared review process used by `/tsh-review` and the code-reviewer agent.
3. **Coupling:** none significant. L32 "task management tool" is neutral.
4. **Compliance:** the description has what and when. Under 500 lines. No output/report format. Object-first name.
5. **Content issues:**
   - No severity model or finding format. Reviewing-frontend defines one (L122-168), so general and frontend reviews produce findings in different shapes.
   - The Connected Skills list (L84-89) omits `tsh-reviewing-frontend`, `tsh-ensuring-accessibility` and `tsh-e2e-testing`.
   - Steps 5-7 say to run all tests but give no guidance for when tests cannot run (no environment).
6. **Changes:**
   - Add a "Findings format" section (critical/warning/suggestion, `file#Lx-Ly`, fix) and make reviewing-frontend reuse it.
   - Add the missing Connected Skills.
   - Add fallback guidance for when tests can't be executed.

### 3. tsh-codebase-analysing
1. **Facts:** `name`, `description`. 131 lines. Supporting file: `codebase-analysis.example.md` (218, root, no TOC).
2. **Verdict:** Keep. It is a distinct deliverable (a full-repo audit report).
3. **Coupling:** none.
4. **Compliance:** the description has no "Use when" (L3). No Connected Skills section. The template is in the root.
5. **Content issues:**
   - Overlaps with task-analysing Step 2 and technical-context Step 2. These differ in depth, but the descriptions don't say so.
   - L119-123 ("Large codebase") asks for an incremental document but doesn't say where to save it.
6. **Changes:**
   - New description: "Performs a full-repository audit … Use when onboarding to an unknown codebase, auditing architecture, or when `/tsh-review-codebase` runs; NOT for per-task convention discovery (use tsh-technical-context-discovering)."
   - Add Connected Skills.
   - Move the template to `assets/`.

### 4. tsh-committing
1. **Facts:** `name`, `description`. 121 lines. No supporting files.
2. **Verdict:** Keep, but move the parts specific to this repo out of it.
3. **Coupling:** L46-49 infer the type from `.cursor/skills/commands/`, `.cursor/skills/workflows/`, `.cursor/skills/agents/`, `.cursor/rules/`, `.mdc`. L60 says "For this repository, common scopes …". L107 is headed "Examples (this repository)".
4. **Compliance:** the description is good. Under 500 lines. Its "References" section (L119) should be "Connected Skills". Object-first name.
5. **Content issues:**
   - The skill is shipped to consumer projects, but its inference table and scopes describe cursor-collections itself. They will mis-infer in other repos.
   - The inference table also hardcodes `.cursor/` paths, which become wrong once the neutral source directory exists.
6. **Changes:**
   - Replace L44-60 and L107-117 with generic heuristics.
   - Move the rules for this repo (paths → types/scopes) into a repo rule, e.g. `.cursor/rules/tsh-commit-conventions.mdc` or its neutral equivalent.
   - Rename "References" to "Connected Skills".

### 5. tsh-creating-agents
1. **Facts:** `name`, `description`. 185 lines. Supporting file: `agent.template.md` (49, root).
2. **Verdict:** **Rewrite.** Agents are the artifact type that differs most between tools. The skill must describe the neutral agent source and how it maps to each target.
3. **Coupling:** L3 and L8 ("for Cursor"). L14, L17-18, L109 and L121 hardcode `.cursor/skills/{agents,workflows,commands}/` and `.cursor/rules/*.mdc`. `agent.template.md` L3 and L49 use `@tsh-` mentions. `agent.template.md:9` lists Copilot tool-set names (`read, search, edit, todo`).
   **Copilot leftovers:**
   - The frontmatter table L128-140 describes Copilot `.agent.md` fields: `tools`, `handoffs`, `agents`, `argument-hint`, and `user-invokable` (Copilot's own spelling). L132 says "shown as placeholder text in chat input".
   - L73 says "List each tool in the YAML frontmatter `tools` array".
   - L91-94 put handoffs "in the YAML frontmatter".
4. **Compliance:** the description is OK. Under 500 lines. The template is in the root.
5. **Content issues (contradictions):**
   - L24-27 make XML tags mandatory (`<agent-role>`, `<tool-usage>` …; body-sections table L146-153). But `agent.template.md` uses Markdown headings (`## Agent Role and Responsibilities`, L11), and so do the real agents (e.g. `.cursor/skills/agents/tsh-architect/SKILL.md`).
   - L73 (tools in frontmatter) conflicts with the template's `> Recommended tools:` body line (L9) and with `tsh-migrating-copilot-to-cursor/SKILL.md:25`.
   - L91-94 (handoffs in frontmatter) conflicts with migrating L27 (a `## Handoffs` body section).
   - L136 marks `name` as "No / defaults to filename", which contradicts the naming rule that `name` is required and must match the directory.
6. **Changes:**
   - Define a **neutral agent schema**: name, description, model hint, abstract tool capabilities, skills, handoffs/delegation, invocation mode.
   - Add a mapping table:
     - Cursor: agent-as-skill invoked with `@`, or `.cursor/agents/*.md` subagents if adopted.
     - Claude Code: `.claude/agents/<name>.md` with `name`, `description`, `tools`, `model`.
     - Codex: custom agents under `.codex/agents/*.toml`, or AGENTS.md persona (verify against current Codex docs).
   - Remove the Copilot frontmatter table.
   - Choose **one** body format (the Markdown headings already used in production, or XML) and make the template, the checklist and the real agents agree.
   - Replace tool names with abstract capabilities (read, search, edit, execute, web, MCP:<server>) that the generator maps per target.
   - Move the template to `assets/`.

### 6. tsh-creating-commands
1. **Facts:** `name`, `description`. 163 lines. Supporting files: `command.template.md` (28), `prompt.template.md` (5, deprecated stub).
2. **Verdict:** **Rewrite** for multiple tools. Delete `prompt.template.md`.
3. **Coupling:** L3 and L8 ("Cursor entry-point command skills (.cursor/skills/commands/…)"). L18-19, L27, L86, L110, L129 and L131 hardcode `.cursor/…`. `command.template.md:24` hardcodes `.cursor/rules/`. `prompt.template.md` is a Copilot-era stub (L3).
4. **Compliance:** the description is OK. Under 500 lines. Templates are in the root.
5. **Content issues:**
   - L110 says to name the command in "gerund form". This contradicts `tsh-naming-conventions.mdc:13` (`tsh-<action>`, e.g. `tsh-implement`) and every existing command.
   - L29: "`false` (or omitted)" is fine for Cursor. In Claude Code the equivalent is also `disable-model-invocation`; Codex uses a different mechanism (`agents/openai.yaml` → `policy.allow_implicit_invocation: false`; verify).
   - L39's ref to `specifications/decisions/slash-menu-visibility-policy.decision.md` exists, but that file is repo-internal and is not shipped to consumers.
6. **Changes:**
   - Describe a neutral field (e.g. `invocation: user-only`) and how each generator maps it:
     - Cursor: `disable-model-invocation: true`.
     - Claude Code: `disable-model-invocation: true` (skills and commands are unified).
     - Codex: skill plus `allow_implicit_invocation: false` (custom prompts are deprecated).
   - Fix the naming instruction to `tsh-<action>`.
   - Delete `prompt.template.md`.
   - Move `command.template.md` to `assets/`.
   - Drop the reference to the repo-internal decision doc, or inline its one-line rule.

### 7. tsh-creating-rules
1. **Facts:** `name`, `description`. 189 lines. Supporting files: `assets/cursor-instructions.template.md` (40) and `assets/custom-rules.template.md` (26). This is the only skill with a standard layout.
2. **Verdict:** **Rewrite.** Rules are native per tool and the skill covers only Cursor.
3. **Coupling:** the whole file. `.cursor/rules/cursor-instructions.md` appears at L17, 23, 27, 80, 127, 151, 171, 180; `.mdc` at L3, 19, 133-136, 172-173. "Cursor" appears at L110 and L114, and in the template text (`cursor-instructions.template.md:2,6,16,40`; `custom-rules.template.md:7,11-12`).
4. **Compliance:** the description is good. Under 500 lines. Layout is correct.
5. **Content issues:**
   - `cursor-instructions.md` is a convention of this repo, not a Cursor feature. It is presented as "Applied to ALL Cursor interactions … No frontmatter required" (L17). Verify how Cursor treats `.md` rules without `alwaysApply: true`; they may not auto-attach.
   - L25, L135 and L142 list a `name` field for `.mdc` rules. Cursor's documented fields are `description`, `globs` and `alwaysApply`; verify.
   - The priority order at L176-181 ("Personal rules highest") likely contradicts Cursor's documented precedence (Team → Project → User). Verify.
   - It never mentions `AGENTS.md`, which Cursor and Codex both read natively.
6. **Changes:**
   - Make the neutral constitution `AGENTS.md`. Codex reads it natively and hierarchically, and Cursor reads it; Claude Code uses `CLAUDE.md` with `@AGENTS.md` import.
   - Model scoped rules neutrally (description + globs + always-apply). Map them:
     - Cursor: `.cursor/rules/*.mdc`.
     - Claude Code: `.claude/rules/*.md` with `paths:`.
     - Codex: nested `AGENTS.md` per directory, or folded into the root file, since Codex has no globs.
   - Fix the `.mdc` frontmatter table and the precedence section against current docs.
   - Rename the templates to neutral names.

### 8. tsh-creating-skills
1. **Facts:** `name`, `description`. 344 lines. Supporting files: `skill.template.md` (149, root), `examples/reviewing-code.skill.md` (62, non-standard dir), `references/common-patterns.md` (112).
2. **Verdict:** **Rewrite.** This is the skill closest to the open standard, so it should *define* the neutral source format and list per-target differences.
3. **Coupling:** L3 and L8 ("for Cursor"). L18-19 hardcode `.cursor/skills/agents|commands/`. `skill.template.md:46-47` hardcodes `.cursor/skills/…`. L219 and the template's L25-33 describe `paths` (supported by Claude Code; verify Cursor support). `disable-model-invocation` (L220) is described without its Codex equivalent.
4. **Compliance:** the description is good. Under 500 lines. It uses progressive disclosure. `examples/` is not a standard directory.
5. **Content issues:**
   - The naming examples (L127-137, L154-155) have no `tsh-` prefix. `examples/reviewing-code.skill.md:2` is `name: reviewing-code` and its L61-62 reference unprefixed `codebase-analysing` / `architecture-designing`. All of these violate the repo's naming rule.
   - The "shortened" examples (`finding-gaps`, `gathering-context`) contradict the actual repo names (`tsh-implementation-gap-analysing`, `tsh-technical-context-discovering`).
   - L143 ("noun phrases: avoid") contradicts the 13 object-first repo names and `tsh-naming-conventions.mdc:17`.
   - L120: "aim for under 20 chars (used as /slash-commands)". Workflow skills are model-invoked, and most repo names exceed 20.
   - L273-278 allow templates and examples in the root, which perpetuates the layout inconsistency.
   - **Broken refs:** L282 `./references/REFERENCE.md` (illustrative) and `references/common-patterns.md:109` `./references/vue-patterns.md` (does not exist; illustrative).
   - The standard's optional fields `license`, `compatibility` and `allowed-tools` are not mentioned.
6. **Changes:**
   - Document the neutral source layout as the only authoring location, with the rule "edit source, run generator".
   - Add a per-target matrix:
     - Cursor: `.cursor/skills/`.
     - Claude Code: `.claude/skills/`, with `disable-model-invocation`, `user-invocable`, `allowed-tools` and `paths`.
     - Codex: `.agents/skills/`, with `agents/openai.yaml`. Verify these paths.
   - Mandate `assets/` for templates and `references/` for examples.
   - Rename `examples/` to `references/`.
   - Prefix every example name with `tsh-`.
   - Resolve the gerund-order contradiction together with the naming rule.
   - Add the `compatibility` field for declaring MCP/tool dependencies.
   - Mark the illustrative paths clearly, or use real ones.

### 9. tsh-designing-multi-cloud-architecture
1. **Facts:** `name`, `description`. 199 lines. Supporting files: `references/multi-cloud-patterns.md` (316) and `references/service-comparison.md` (170); neither has a TOC.
2. **Verdict:** Keep.
3. **Coupling:** none.
4. **Compliance:** the description is good. Under 500 lines. References are used, but a References section (L191) sits alongside inline mentions (L52, L127). Uses "Related Skills" (L196). The 38-character name is the longest in the set.
5. **Content issues:**
   - L29 maps ECS ↔ Azure Container Instances ↔ Cloud Run. Container Apps is the better equivalent (L32 already uses it).
   - L49 maps "Aurora | PostgreSQL/MySQL | Cloud Spanner → Distributed SQL", which is misleading. Aurora is not the counterpart of Spanner; Azure's counterpart is Cosmos DB for PostgreSQL.
   - L114 says "Preemptible". GCP now sells Spot VMs.
   - L14-20 "When to Use" duplicates the description.
   - Pricing strategies (L108-125) overlap with optimizing-cloud-cost.
6. **Changes:**
   - Fix the service tables.
   - Replace "Preemptible" with "Spot VMs".
   - Add TOCs to both references.
   - Replace the cost section with a link to tsh-optimizing-cloud-cost.
   - Consider shortening the name (e.g. `tsh-designing-multi-cloud`).
   - Rename the heading to "Connected Skills".

### 10. tsh-e2e-testing
1. **Facts:** `name`, `description`. 69 lines. No supporting files.
2. **Verdict:** Keep, and expand it into a process skill.
3. **Coupling:** L38 `DEBUG (browser_snapshot)` is a Playwright MCP tool name.
4. **Compliance:** the description has what and when. No process checklist (a requirement in tsh-creating-skills). No Connected Skills. Object-first name.
5. **Content issues:**
   - L61: `npx playwright test --headed=false` is unusual. Playwright runs headless by default, so `npx playwright test` is enough.
   - L69: "Never … CSS selectors" is too absolute; Playwright's docs rank CSS as a fallback, not forbidden.
   - Nothing covers auth state reuse (`storageState`), fixtures, trace viewer, or `webServer` config.
6. **Changes:**
   - Add a step checklist (discover config → write test → run → debug → stabilise → CI check).
   - Change the debug tool to "accessibility snapshot / trace viewer".
   - Fix the headless command.
   - Soften the CSS rule.
   - Add Connected Skills (`tsh-technical-context-discovering`, `tsh-ensuring-accessibility`).

### 11. tsh-engineering-prompts
1. **Facts:** `name`, `description`. 422 lines. No supporting files.
2. **Verdict:** Keep. Update the guidance and move the templates out for progressive disclosure.
3. **Coupling:** L3 and L15 ("NOT for Cursor skill customization — use tsh-creating-commands"). This should point to creating-skills/agents/commands generically.
4. **Compliance:** the description is good. 422 lines is under 500 but close. The whole template library sits inline.
5. **Content issues (outdated for current reasoning models):**
   - The temperature table (L176-185) ignores models where temperature is fixed or unsupported (reasoning models).
   - "Think step by step" CoT (L73-86) is counter-productive or redundant on reasoning models.
   - The agent tool-calling template (L273-291) teaches JSON-in-prompt tool calls instead of native function/tool calling.
   - "Negative prompting often works better" (L164-174) contradicts current vendor guidance, which favours positive instructions.
   - The input-sanitisation advice to reject "ignore previous" (L215) is weak as a defence and should be framed that way.
6. **Changes:**
   - Move §4 templates to `assets/prompt-templates/*.md` and §5 evaluation to `references/evaluation.md`.
   - Add a model-class note (reasoning vs. non-reasoning).
   - Replace the JSON tool-call template with native tool-schema guidance.
   - Reframe negative prompting.
   - Fix the cross-reference at L3/L15/L420.

### 12. tsh-ensuring-accessibility
1. **Facts:** `name`, `description`. 222 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** none.
4. **Compliance:** good.
5. **Content issues:**
   - It targets WCAG **2.1** AA (L3, L8); WCAG 2.2 has been a W3C Recommendation since Oct 2023. L149 says 44×44 targets are "not a WCAG 2.1 AA requirement". WCAG 2.2 adds SC 2.5.8 Target Size (Minimum) of 24×24 at AA, plus 2.4.11 Focus Not Obscured.
   - The contrast table is duplicated (L116-121 and L181-186).
   - "One h1 per page" and "never skip levels" (L58-60) are best practice, not WCAG requirements; label them as such.
6. **Changes:**
   - Upgrade to WCAG 2.2 AA, adding SC 2.4.11, 2.5.7 and 2.5.8.
   - Delete the duplicate table.
   - Update the frontend skills that say "WCAG 2.1" (implementing-frontend L148).

### 13. tsh-implementation-gap-analysing
1. **Facts:** `name`, `description`. 37 lines, no trailing newline. Supporting file: `implementation-gap-analysis.example.md` (37, root).
2. **Verdict:** Keep. It is small and focused, and the architect and architecture-designing both reuse it.
3. **Coupling:** none.
4. **Compliance:** the description is sentence fragments with no "Use when" (L3). No Connected Skills. The template is in the root.
5. **Content issues:**
   - Its terminology (To Be Implemented/Modified/Reused) differs from `plan.example.md` (Already Implemented / To Be Modified / To Be Created).
   - task-analysing's description also claims gap analysis.
6. **Changes:**
   - New description: "Compares planned changes against the current codebase to classify work as create/modify/reuse. Use when drafting or validating an implementation plan, or before implementing a phase."
   - Add Connected Skills.
   - Move the template to `assets/`.
   - Align terms with the plan template.

### 14. tsh-implementing-backend
1. **Facts:** `name`, `description`. **526 lines (over 500)**. Supporting files: `references/{nodejs,php,dotnet,java-spring-boot,go}-patterns.md`, 193-421 lines each, all with TOCs.
2. **Verdict:** **Split.** Keep the core procedure and principles in SKILL.md. Move the DataGrid standard, Docker and local dev, and logging to `references/`.
3. **Coupling:** none tool-specific. The "TSH Standard" DataGrid (L119) is an organisational rule; that's fine, but label it as such.
4. **Compliance:** the description has what and when ("Use for"). Over the line limit. L10-21 "When to Use" duplicates the description.
5. **Content issues:**
   - **Duplicate Connected Skills sections.** L510-519 are correct. L521-526 list unprefixed, non-existent names: `technical-context-discovery`, `architecture-design`, `code-review`, `e2e-testing`.
   - Outdated items:
     - Mailhog (L364) is unmaintained; use Mailpit.
     - `docker-compose up` (L366) is Compose v1 syntax; use `docker compose`.
     - `node:20-alpine` (L371 and `nodejs-patterns.md:185,193`) is past EOL as of Apr 2026.
     - `golang:1.22-alpine` (`go-patterns.md:231`) is EOL.
     - Swashbuckle (`dotnet-patterns.md:151`) was dropped from the .NET 9+ templates in favour of `Microsoft.AspNetCore.OpenApi`.
     - Google Wire (`go-patterns.md:20`): verify its maintenance status.
   - L243: "Migrations run automatically on application startup" is risky with multiple replicas; it conflicts with the horizontal-scaling guidance at L425.
   - Overlaps with SQL (L230-260) and observability (L391-419).
6. **Changes:**
   - Delete L521-526.
   - Move DataGrid (L119-191), Docker (L359-374) and logging (L391-419) to references.
   - Replace the DB best practices with a link to the SQL skill.
   - Refresh the image versions, or say "current LTS" instead of pinning numbers.
   - Change the migration guidance to a dedicated migration job or init step.

### 15. tsh-implementing-ci-cd
1. **Facts:** `name`, `description`. 194 lines. No supporting files.
2. **Verdict:** Keep. Move the Terraform pipeline section (L92-187) to tsh-implementing-terraform-modules.
3. **Coupling:** L18 detects `.github/workflows` for GitHub Actions detection; that is legitimate, not a Copilot leftover. L24/68 name `context7`.
4. **Compliance:** the description is fine but thin. Under 500 lines. Uses "Related Skills" (L191).
5. **Content issues:**
   - **Bug at L128:** `role-to-arn:` is not an input of `aws-actions/configure-aws-credentials`. The input is `role-to-assume:`.
   - L114/L182: tfsec is deprecated and merged into Trivy (`aquasecurity/trivy-action`).
   - L111/L180: "S3 + DynamoDB locking". Terraform 1.10+ supports S3-native locking (`use_lockfile = true`), and DynamoDB locking is deprecated.
   - L50: "AWS from Bitbucket: Repository variables + IAM role". Bitbucket Pipelines supports OIDC, and so does secrets L50.
   - L12 lists GitOps, but it isn't covered.
   - The whole IaC section is GitHub-Actions-only, which conflicts with the platform-neutral detection at L15-22.
6. **Changes:**
   - Fix `role-to-assume`.
   - Replace tfsec with Trivy/Checkov.
   - Switch to S3-native locking.
   - Switch Bitbucket to OIDC.
   - Move L92-187 to terraform.
   - Move the credentials table to managing-secrets.
   - Either add GitOps or drop it from the scope.

### 16. tsh-implementing-forms
1. **Facts:** `name`, `description`. 151 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** none.
4. **Compliance:** good.
5. **Content issues:**
   - L58 hides the native file input "visually" behind a styled button with `aria-label`. A visually-hidden but focusable input associated with a `<label>` is the more robust pattern; say so.
   - There are no framework references (e.g. React Hook Form/Zod, VeeValidate), although Connected Skills (L148) says implementing-frontend provides them. It doesn't.
6. **Changes:**
   - Clarify the file-input pattern.
   - Add `references/react-forms.md`, or remove the claim at L148.

### 17. tsh-implementing-frontend
1. **Facts:** `name`, `description`. 152 lines. Supporting file: `references/react-patterns.md` (64).
2. **Verdict:** Keep.
3. **Coupling:** L45 "via MCP tool if available" is fine. L85 references `tsh-ui-reviewer` and `/tsh-implement` (orchestration coupling; acceptable).
4. **Compliance:** good.
5. **Content issues:**
   - `react-patterns.md` is the shared framework reference for four skills, yet it lacks what they claim it contains:
     - rules of hooks and effect cleanup syntax (claimed by writing-hooks L217);
     - a hooks review checklist and `dangerouslySetInnerHTML` (claimed by reviewing-frontend L76 and L217).
   - There is no React 19 / React Compiler guidance, which changes the manual-memoization advice.
   - L148 says "WCAG 2.1 AA".
6. **Changes:**
   - Expand react-patterns (hooks rules, cleanup, review checklist, XSS, React 19/Compiler), or extract it into a standalone `tsh-react-patterns` skill.
   - Update to WCAG 2.2.

### 18. tsh-implementing-kubernetes
1. **Facts:** `name`, `description`. 324 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** L27 names `context7`.
4. **Compliance:** the description is OK. Under 500 lines. "When to Use" duplicates the description. Uses "Related Skills".
5. **Content issues:**
   - L226 recommends **ingress-nginx** as "General purpose, widely supported", and L231-258 give an nginx example. The Kubernetes project retired ingress-nginx (best-effort maintenance ended Mar 2026). Recommend Gateway API with a maintained controller.
   - L57: a 1:2 memory request:limit ratio is a debatable default; common guidance is memory request = limit.
   - Nothing warns against running HPA and VPA on the same metric.
   - The checklist at L299 mentions topology spread, but no example is given.
6. **Changes:**
   - Replace the ingress section with Gateway API (HTTPRoute).
   - Add the HPA/VPA conflict note.
   - Add a `topologySpreadConstraints` example.
   - Revisit the memory-limit guidance.
   - Consider moving the YAML examples to `references/`.

### 19. tsh-implementing-observability
1. **Facts:** `name`, `description`. 233 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** L33 names `context7`.
4. **Compliance:** OK. "When to Use" duplicates the description. Uses "Related Skills".
5. **Content issues:**
   - Overlaps backend logging (see §4).
   - The error-budget figure (L120, ~43 min/30d) is correct.
   - Nothing covers OTel semantic conventions or log–trace correlation setup per language.
6. **Changes:**
   - Make this the canonical owner of the logging format; backend links here.
   - Rename the heading to "Connected Skills".

### 20. tsh-implementing-terraform-modules
1. **Facts:** `name`, `description`. 246 lines. Supporting files: `references/{aws,azure,gcp}-modules.md` (71-90 lines each).
2. **Verdict:** Keep. Absorb the IaC-pipeline content from ci-cd.
3. **Coupling:** none.
4. **Compliance:** good. The title "Terraform Module Library" (L6) doesn't match the name. Purpose/When sections (L10-20) duplicate the description.
5. **Content issues:**
   - L179 pins `google ~> 5.0`, which is outdated (v6 and v7 have since been released).
   - Testing covers only Terratest (L186, L195-209). It omits native `terraform test` (1.6+).
   - L206 asks tests to use `single_nat_gateway = true`, but the example VPC module has no NAT gateway.
   - L207: "plan-only … requires no AWS credentials" is incorrect; `plan` with the AWS provider needs credentials unless the provider is mocked (e.g. `terraform test` with `mock_provider`).
   - L220: `run-all` is deprecated in current Terragrunt (`terragrunt run --all`); verify.
   - OpenTofu is not mentioned.
6. **Changes:**
   - Refresh the provider pins, or describe the pinning strategy without numbers.
   - Add `terraform test`.
   - Fix the plan-only claim.
   - Update the Terragrunt CLI guidance.
   - Take over the ci-cd IaC pipeline section.

### 21. tsh-jira-task-formatting
1. **Facts:** `name`, `description`. 269 lines. Supporting files: `jira-task.example.md` (319, no TOC) and `task-baseline.example.md` (27). Both are in the root.
2. **Verdict:** Keep. Split Import Mode (L202-265) and the Jira markup notes into `references/`.
3. **Coupling:** L185 and L229 "Atlassian MCP"; L136 "Atlassian tools".
4. **Compliance:** the description has no "Use when" (L3). Duplicate H1 (L6 and L8). Object-first name.
5. **Content issues:**
   - **Contradiction:** L200 says the local file uses standard markdown and Jira formatting is applied only at push. But the benchmark template the skill tells the agent to follow uses wiki markup (`jira-task.example.md:25,29,33` `h2.`, `:42-43` `(/)`).
   - L197 calls `(/)` "Jira checkbox format". In wiki markup `(/)` renders a check-mark icon, not a checkbox. Also, Jira Cloud (REST v3/ADF) and the Atlassian MCP accept Markdown/ADF, so the wiki-markup guidance may be obsolete; verify.
   - `task-baseline.example.md` is an **orphan**: step 11 (L165-174) refreshes `task-baseline.md` but never references the template.
   - The custom status "PO APPROVE" is hardcoded eight times (L47, 62, 79, 92, 133, 146, 182, 251); it is org-specific.
   - The Protected Status Guard is repeated in five places.
   - The example contains dated labels (`workshop-2026-02-19`, L189-319).
6. **Changes:**
   - Add "Use when formatting extracted tasks for Jira, importing a Jira backlog, or pushing tasks".
   - Remove the duplicate H1.
   - Decide on the storage format (Markdown locally) and fix the template.
   - Reference `assets/task-baseline.template.md` from step 11.
   - Make the protected statuses a configurable list, defined once.
   - Move Import Mode to `references/import-mode.md`.
   - Move the templates to `assets/` and add a TOC.

### 22. tsh-managing-secrets
1. **Facts:** `name`, `description`. 90 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** L32 and L59 name `context7` / "cloud MCP".
4. **Compliance:** OK. Uses "Related Skills".
5. **Content issues:**
   - **L49:** "GitLab CI … OIDC with `CI_JOB_JWT`". `CI_JOB_JWT` was removed in GitLab 17.0; use `id_tokens:`.
   - L50: Bitbucket supports OIDC.
   - L84: "Use Kubernetes Secrets (encrypted at rest)" is misleading. Secrets are only base64-encoded unless etcd encryption (EncryptionConfiguration or KMS) is enabled.
   - L66: the "environment variables visible in UI" wording is unclear.
   - Detection (L27-30) covers only Terraform.
6. **Changes:**
   - Replace `CI_JOB_JWT` with `id_tokens`.
   - Switch Bitbucket to OIDC.
   - Fix the K8s encryption claim.
   - Make this the single owner of the CI credentials table.

### 23. tsh-migrating-copilot-to-cursor
1. **Facts:** `name`, `description`. 105 lines. No supporting files.
2. **Verdict:** **Rewrite as `tsh-migrating-copilot-artifacts` (Copilot → neutral source), or delete.** It exists to port upstream Copilot PRs (#60-#64). Once a neutral source and per-target generators exist, the target of a port is the neutral format, not Cursor.
3. **Coupling:** the whole skill is tool-specific by design:
   - the mapping tables L12-18, L22-30 and L45-56;
   - the `vscode/*` tool stripping at L34-39;
   - the rewrites `copilot-instructions.md` → `cursor-instructions.md` (L53) and "GitHub Copilot" → "Cursor AI IDE" (L56).
4. **Compliance:** the description is good. There is no step detail beyond the checklist.
5. **Content issues:**
   - L24 "Cursor doesn't bind models in frontmatter" and L25 (tools become body lines) encode Cursor-only limitations. Claude Code agents *do* support `model` and `tools` in frontmatter, so the neutral format should keep them as structured fields, not prose.
   - L27-28 turn handoffs/agents into prose, losing information that Claude Code and Codex can use.
   - L72 says "workflow skills and commands … don't have tool access"; the neutral format could carry `allowed-tools`.
   - L96 mentions `website/docs/` without explaining it.
6. **Changes:**
   - If Copilot ports continue: re-target to the neutral source. Keep `model`, `tools`, `handoffs` and `delegation` as structured fields, and map `vscode/askQuestions` to an abstract "ask-user" capability.
   - Otherwise delete the skill and archive the mapping under `specifications/`.
   - Either way, drop the `cursor-instructions.md` rename in favour of `AGENTS.md`.

### 24. tsh-optimizing-cloud-cost
1. **Facts:** `name`, `description`. 96 lines. Supporting file: `references/tagging-standards.md` (33).
2. **Verdict:** Keep. Rewrite the reference.
3. **Coupling:** none.
4. **Compliance:** OK. Uses "Related Skills".
5. **Content issues:**
   - **Contradiction:** SKILL.md's "Required Tags" (L35-43: Environment, Project, CostCenter, Owner, ManagedBy) and the reference's "Core 5" (`tagging-standards.md:8-17`: CostCenter, Environment, Service, Owner, DataClass) are different sets.
   - The reference presents invented organisational policy as standard:
     - "flagged for termination in 24 hours" (L9);
     - "Auto-quarantined by Lambda `finops-tag-remediation`" (L32);
     - the "2xlarge" dev limit (L33);
     - AWS-only Tag Policies (L4);
     - time-sensitive content: "Critical for 2026" (L21) and `TTL: 2026-12-31` (L29).
   - L21 says "Preemptible" for GCP; it should be Spot VMs.
   - L56 (weekly reviews, monthly optimisation) conflicts with the L78 anti-pattern "Review costs monthly".
6. **Changes:**
   - Settle on one required-tag set.
   - Rewrite the reference as a provider-neutral template with the enforcement options (AWS Tag Policies, Azure Policy, GCP org policy/labels), marking org-specific values as placeholders.
   - Remove the dates.
   - Fix GCP Spot.
   - Take over the pricing tables from multi-cloud.

### 25. tsh-optimizing-frontend
1. **Facts:** `name`, `description`. 193 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** none. L186 uses a cross-skill reference (see §6).
4. **Compliance:** good.
5. **Content issues:**
   - L115-116: the Lighthouse run is told to "extract … LCP, INP, CLS". A Lighthouse navigation (lab) run does **not** measure INP; it reports TBT as a proxy. INP needs field data or a timespan run.
   - L59 and L140: "never `import * as`, wildcard imports defeat tree shaking" is outdated for ESM namespace imports in modern bundlers. The real problem is CJS modules and side effects.
   - The cleanup section (L85-93) duplicates writing-hooks.
   - No React 19 / Compiler note.
6. **Changes:**
   - Use TBT for lab runs and CrUX/RUM for INP.
   - Nuance the import rule.
   - Point memory management to writing-hooks.
   - Add the Compiler caveat to memoization.

### 26. tsh-reviewing-frontend
1. **Facts:** `name`, `description`. 226 lines. No supporting files.
2. **Verdict:** Keep as a distinct, frontend-only complement to code-reviewing. Do not merge the two.
3. **Coupling:** none. L217 uses a cross-skill reference.
4. **Compliance:** good.
5. **Content issues:**
   - L114 suggests `import { debounce } from 'lodash/debounce'`, which is wrong: the per-method module has a default export. It should be `import debounce from 'lodash/debounce'`, or `import { debounce } from 'lodash-es'`.
   - L76 and L217 promise a "framework-specific hooks review checklist" and `dangerouslySetInnerHTML` checks in react-patterns.md. Neither exists.
   - L73 says tuples are OK for 2-value hooks; writing-hooks L184 says to prefer objects for more than one value (minor inconsistency).
6. **Changes:**
   - Fix the lodash example.
   - Add the promised content to react-patterns, or remove the claims.
   - Reuse the severity/finding format from code-reviewing.
   - Align the tuple guidance with writing-hooks.

### 27. tsh-sql-and-database-understanding
1. **Facts:** `name`, `description`. **1229 lines (about 2.5× the 500-line limit)**. No supporting files.
2. **Verdict:** **Split.** Keep principles, naming, the procedure (L1177-1224) and a section index in SKILL.md. Move the following to `references/`:
   - `schema-design.md` (§1-3)
   - `indexing.md` (§4)
   - `query-performance.md` (§5, §8)
   - `transactions-locking.md` (§6-7)
   - `orm.md` (§10)
   - `maintenance.md` (§11)
3. **Coupling:** none.
4. **Compliance:** the description is good but long. The body is far over the limit and doesn't use progressive disclosure. The name is not gerund-form, and "understanding" is vague.
5. **Content issues:**
   - L93: "Adding a new enum value is a simple DROP + ADD CONSTRAINT, no table rewrite required". It avoids a rewrite, but `ADD CONSTRAINT … CHECK` scans the table under an ACCESS EXCLUSIVE lock. Recommend `NOT VALID` followed by `VALIDATE CONSTRAINT`.
   - L39: "Every table MUST include created_at/updated_at" is also applied to junction tables (clarify).
   - Overlaps backend L230-260.
6. **Changes:**
   - Split as above.
   - Rename to e.g. `tsh-designing-databases` or `tsh-writing-sql`, and update the four agents/skills that reference it.
   - Fix the constraint note.
   - Make it the canonical DB owner; backend links here.

### 28. tsh-task-analysing
1. **Facts:** `name`, `description`. 69 lines. Supporting file: `research.example.md` (55, root).
2. **Verdict:** Keep. Narrow it to requirements research that produces `*.research.md`.
3. **Coupling:**
   - **Copilot leftover at L43:** "Check if GitHub tools is available and look for Spaces" (GitHub Copilot Spaces).
   - L30 and L53 name `pdf-reader`.
4. **Compliance:** the description is a list of fragments with no "Use when", and claims "performs gap analysis" (L3). Steps are numbered from 0 (L23). The template is in the root.
5. **Content issues:**
   - Overlaps gap-analysing and codebase-analysing (see §4).
   - `research.example.md:7` is Jira-centric (a "Jira ID" field), although L29 supports prompt-only input.
   - task-extracting L160 claims this skill does "baseline comparison and intent brief drafting". It does not.
6. **Changes:**
   - Rewrite the description: "Gathers requirements from task trackers, docs and the user, identifies gaps and produces `<task>.research.md`. Use when starting a new task, given a Jira/Linear ID, or before /tsh-plan."
   - Remove GitHub Spaces.
   - Generalise the Jira ID field to "Task ID".
   - Move the template to `assets/`.

### 29. tsh-task-extracting
1. **Facts:** `name`, `description`. 160 lines. Supporting files: `extracted-tasks.example.md` (105, no TOC) and `intent-brief.example.md` (49), both in the root.
2. **Verdict:** Keep.
3. **Coupling:** L136 says "popup" (Copilot askQuestions). L22-23 route to the `tsh-architect` / `tsh-context-engineer` agents. L54 names `pdf-reader`.
4. **Compliance:** the description has no "Use when". Duplicate H1 (L6 "Task Extracting", L8 "Task Extraction"). Object-first name.
5. **Content issues:**
   - L160's Connected Skills claim about tsh-task-analysing is incorrect (see #28).
   - "Explore Mode" and `workshop-context-summary.md` (L49, L72) are defined only in `commands/tsh-explore-materials`. Name the source.
6. **Changes:**
   - Add a "Use when" trigger.
   - Remove the duplicate H1.
   - Neutralise the question wording.
   - Fix L160.
   - Move the templates to `assets/`.

### 30. tsh-task-quality-reviewing
1. **Facts:** `name`, `description`. 345 lines. Supporting file: `quality-review.example.md` (156, root, no TOC).
2. **Verdict:** Keep. Move Passes A-J (L117-247) to `references/analysis-passes.md`.
3. **Coupling:** L75 calls ``List accessible Resources`` (an Atlassian MCP tool name). L243 and L253 name `context7`. L291 says "popup".
4. **Compliance:** the description has no "Use when". Duplicate H1 (L6 and L8). Close to the limit.
5. **Content issues:**
   - Step 5 (L251-259) repeats Pass J.
   - Step 5 always runs domain research, although Lite mode (L53) excludes Pass J.
   - L259 says "rely on the other nine passes", but Lite runs only five.
   - The protected-status guard is repeated three times, with a hardcoded "PO APPROVE".
6. **Changes:**
   - Merge Step 5 into Pass J and make it Full-mode only.
   - Move the passes to references.
   - Use capability wording for Jira and research tools.
   - Add a "Use when" trigger.
   - Share the protected-status definition with jira-task-formatting.

### 31. tsh-technical-context-discovering
1. **Facts:** `name`, `description`. 98 lines. No supporting files.
2. **Verdict:** Keep. **Rewrite Step 1.** This skill is loaded by the most agents (16 agent references), and its core step assumes Cursor.
3. **Coupling:**
   - L24, L42-48, L63 and L78: "Check Cursor rule files", `.cursor/rules/cursor-instructions.md`, `*.mdc`, `.cursor/`.
   - L74: "Use `search` and `usages` tools" (the `usages` tool is from Copilot/VS Code).
   - L80 names `context7`.
4. **Compliance:** the description is good. No Connected Skills. "When to Use" (L10-15) duplicates the description. Object-first name.
5. **Content issues:**
   - Under Claude Code or Codex, the skill finds no rules, because it ignores `AGENTS.md`, `CLAUDE.md`, `.claude/rules/`, nested `AGENTS.md`, `.github/copilot-instructions.md`, and `CONTRIBUTING.md`/linters.
   - L86 says to document greenfield decisions "in code comments or README"; it should propose a rule/AGENTS.md entry.
6. **Changes:**
   - Change Step 1 to "Check project instruction files" with an ordered list covering all tools: `AGENTS.md` (root + nested), `CLAUDE.md`, `.claude/rules/*.md`, `.cursor/rules/*`, `.github/copilot-instructions.md`, `CONTRIBUTING.md`.
   - Replace the tool names with "code search / find references".
   - Add Connected Skills (`tsh-codebase-analysing`, `tsh-creating-rules`).

### 32. tsh-transcript-processing
1. **Facts:** `name`, `description`. 118 lines. Supporting file: `cleaned-transcript.example.md` (64, root).
2. **Verdict:** Keep.
3. **Coupling:** L33 names `pdf-reader`. L108 hardcodes the `specifications/<workshop-name>/` path.
4. **Compliance:** the description has no "Use when". The template is in the root.
5. **Content issues:** none significant.
6. **Changes:**
   - Add a "Use when" trigger (e.g. "Use when a raw meeting or workshop transcript is provided, or as the first step of /tsh-analyze-materials").
   - Move the template to `assets/`.
   - Use capability wording for PDF extraction.

### 33. tsh-ui-verifying
1. **Facts:** `name`, `description`. 198 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** L33, L41 and L51 name the `figma` / `playwright` tools. L3 names `/tsh-review-ui`. L55 hardcodes the `specifications/<task-id>/screenshots/` path.
4. **Compliance:** good.
5. **Content issues:**
   - The accessibility-tree warning is duplicated (L57 and L113).
   - The report template is inline and could move to `assets/`.
6. **Changes:**
   - Use capability wording ("design-inspection tool (Figma MCP)", "browser automation (Playwright MCP)") and declare it in `compatibility`.
   - Deduplicate the warning.
   - Optionally move the report format to `assets/ui-verification-report.template.md`.

### 34. tsh-writing-hooks
1. **Facts:** `name`, `description`. 224 lines. No supporting files.
2. **Verdict:** Keep.
3. **Coupling:** none. L217 uses a cross-skill reference to react-patterns.
4. **Compliance:** good.
5. **Content issues:**
   - **Contradiction:** L138-139 allow throwing during render for programmer errors and Suspense/Error Boundary integration. Checklist L209 says "Errors surfaced via return value, never thrown from render".
   - L19 ("more than 1–2 values") vs L184 ("more than one value"): inconsistent tuple threshold.
   - L217 promises `useEffect`/dependency/rules-of-hooks syntax in react-patterns.md, which that file lacks.
   - No Vue reference, although the skill claims to support Vue composables (L10).
6. **Changes:**
   - Align the checklist with L138-139.
   - Pick one tuple threshold (shared with reviewing-frontend).
   - Add the missing React content, or add `references/vue-patterns.md`.

---

## Recommended Order of Work (for the architect)
1. **Decide the conventions:** gerund order (`tsh-naming-conventions.mdc:17` vs `tsh-creating-skills`), and the `assets/` vs `references/` split. Tell the generator to enforce both.
2. **Rewrite the meta skills (#5-8, #23)** against the neutral source format first. They define how everything else is authored.
3. **Fix the multi-tool blockers in heavily used knowledge skills:** #31 (technical-context, used by 16 agents) and #4 (committing, repo-specific paths).
4. **Fix correctness bugs:** ci-cd `role-to-arn`; secrets `CI_JOB_JWT`; the kubernetes ingress-nginx recommendation; the broken links in architecture-designing; the duplicate broken Connected Skills in backend; the jira markup contradiction; the cost tag contradiction.
5. **Split #14 and #27.** Move all root `*.example.md` / `*.template.md` files to `assets/` or `references/`.
6. **Minor cleanups:** descriptions without "Use when" (8 skills), duplicate H1s (3), missing Connected Skills (4), "Related Skills" headings (7), "When to Use" body sections (9), missing TOCs (8 files).
