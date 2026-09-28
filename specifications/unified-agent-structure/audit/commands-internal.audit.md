# Audit: `commands/` and `internal/` skills

**Scope:** every `SKILL.md` under `.cursor/skills/commands/` (17 found, not 16: `tsh-review-ui` is the 17th) and `.cursor/skills/internal/` (11). The agent skills they route to were skimmed to check consistency.
**Branch:** `refactor/unified-agent-structure` @ `324d2fd`
**Date:** 2026-09-27
**Purpose:** input for the architect deciding the neutral-source model (skills + native subagents + slash commands for Cursor, Claude Code and Codex).

Severity legend: **major** = will break or misbehave after flattening/generation, or violates a repo rule in a structural way (for example a command that embeds domain knowledge, or a load-bearing path); **minor** = wording, stale facts, cosmetic coupling; **none** = portable as is.

Proposed type legend:
- **command**: user-invocable entry point. Stays a thin router to an agent.
- **command (dual-use)**: user-invocable, but also followed by delegates. Must be model-loadable too.
- **internal step**: hidden from the user menu, loaded by an agent or subagent by name.
- **workflow**: reusable domain knowledge. Fold the content into an existing workflow skill.
- **agent**: fold the content into the agent definition (native subagent body).
- **merge/delete**: remove the artifact after moving its content somewhere else.

---

## Summary table

| # | Name | Current type | Proposed type | Severity |
|---|------|--------------|---------------|----------|
| 1 | tsh-analyze-aws-costs | command | command (merge with GCP into `tsh-analyze-cloud-costs`; move the checklist and report template into the `tsh-optimizing-cloud-cost` workflow) | major |
| 2 | tsh-analyze-gcp-costs | command | merge into `tsh-analyze-cloud-costs` (see #1) | major |
| 3 | tsh-analyze-materials | command | command (thin; the 14-step flow already lives in `tsh-business-analyst`) | major |
| 4 | tsh-ask | command | command → route to `tsh-architect`; move the ADR template into a workflow | minor |
| 5 | tsh-audit-infrastructure | command | command (thin; the report template goes into a workflow) | major |
| 6 | tsh-commit | command | command (no agent; keep the self-contained main-thread command) | minor |
| 7 | tsh-create-custom-agent | command | command, rewritten for the neutral source (consider merging #7–#10) | major |
| 8 | tsh-create-custom-command | command | command, rewritten for the neutral source | major |
| 9 | tsh-create-custom-rules | command | command, rewritten (rules are per-tool: `.mdc` / `CLAUDE.md` / `AGENTS.md`) | major |
| 10 | tsh-create-custom-skill | command | command, rewritten for the neutral source | major |
| 11 | tsh-debug | command | command → route to `tsh-software-engineer` (or EM) | minor |
| 12 | tsh-explore-materials | command | command | minor |
| 13 | tsh-implement | command | command (thin; move Quick/Full flow logic into the `tsh-engineering-manager` agent) | major |
| 14 | tsh-refactor | command | command → route to `tsh-architect` (plan) + `tsh-software-engineer` (execute) | minor |
| 15 | tsh-review | command | command (dual-use; content moves into the `tsh-code-reviewing` workflow) | major |
| 16 | tsh-review-codebase | command | command (thin; the 2a–2c checklists and report template go into `tsh-codebase-analysing`) | major |
| 17 | tsh-review-ui | command | command (dual-use) | minor |
| 18 | tsh-deploy-kubernetes | internal | merge/delete → `tsh-implementing-kubernetes` workflow + devops agent | minor |
| 19 | tsh-engineer-prompt | internal | merge/delete → `tsh-prompt-engineer` agent | minor |
| 20 | tsh-implement-common-task | internal | internal step (merge with #25 into one `tsh-implement-task`) | minor |
| 21 | tsh-implement-e2e | internal | internal step, or fold into the `tsh-e2e-engineer` agent | major |
| 22 | tsh-implement-observability | internal | merge/delete → `tsh-implementing-observability` + devops agent | minor |
| 23 | tsh-implement-pipeline | internal | merge/delete → `tsh-implementing-ci-cd` + devops agent | minor |
| 24 | tsh-implement-terraform | internal | merge/delete → `tsh-implementing-terraform-modules` + devops agent | minor |
| 25 | tsh-implement-ui-common-task | internal | merge into #20 | major |
| 26 | tsh-implement-ui | internal | workflow (rename, e.g. `tsh-orchestrating-ui-verification`) loaded by EM | major |
| 27 | tsh-plan | internal | merge into the `tsh-architecture-designing` workflow; optionally expose `/tsh-plan` → architect | major |
| 28 | tsh-research | internal | merge into the `tsh-task-analysing` workflow; optionally expose `/tsh-research` → context-engineer | minor |

Totals: 15 major (11 commands, 4 internal), 13 minor, 0 none.

---

## Cross-cutting findings (read first)

1. **`disable-model-invocation: true` is on all 28 files, and it is the wrong setting for internal steps.** Internal skills are "hidden from users, loaded by agents". In Cursor today they are loaded by *reading a file path* (`.cursor/skills/internal/<name>/SKILL.md`), not by the skill mechanism, because model invocation is disabled. When paths change (flattened `.claude/skills/tsh-*/`, Codex locations), every path-based load breaks. Two options:
   - Internal steps become "not user-invocable, but model-invocable" (in Claude Code that is `user-invocable: false`) and are referenced **by skill name**.
   - Internal steps are preloaded into the native subagent (for example a Claude subagent `skills:` field). Confirm with the format research.
2. **Dual-use commands.** `tsh-review`, `tsh-review-ui` and `tsh-review-codebase` are user commands *and* steps that delegates are told to follow:
   - EM: `.cursor/skills/agents/tsh-engineering-manager/SKILL.md:29,101,130`
   - `tsh-implement-ui`: `:46,69`
   - `tsh-implement`: `:39,66,80`
   - `tsh-architecture-designing`: `:69,71`
   - `plan.example.md:117`

   With `disable-model-invocation: true`, a subagent cannot load them by name. Either make them model-invocable, or move their bodies into workflows (`tsh-code-reviewing`, `tsh-ui-verifying`, `tsh-codebase-analysing`) so the commands become thin wrappers.
3. **Nested delegation.** Native subagents may be unable to spawn subagents; this is known for Claude Code, and the format research should confirm it for Cursor and Codex. These instructions assume nesting:
   - "Spawn `tsh-architect` sub-agent" in `tsh-audit-infrastructure:52`, `tsh-deploy-kubernetes:48`, `tsh-implement-observability:45`, `tsh-implement-pipeline:48` and `tsh-implement-terraform:49`, all executed by devops, which is itself a delegate of EM
   - `tsh-implement-e2e:89` (e2e-engineer spawns code-reviewer)
   - `tsh-review-codebase:27` (architect spawns parallel architect subagents)
   - `tsh-debug:45` and `tsh-refactor:42` (delegate to software-engineer)

   Orchestrators (EM, BA, cursor-orchestrator) must run in the **main thread**: the command loads the persona. Leaf agents (code-reviewer, ui-reviewer, devops, architect) can be forked subagents. Nested "spawn architect" steps should become "return an ARCHITECT-NEEDED escalation to the caller".
4. **Hardcoded category paths.** 45 path references inside commands and internal skills, plus about 20 inbound ones from agents and workflows (full inventory in the appendix). All of them break if `commands/` and `internal/` disappear. Replace them with skill-name references (`the tsh-review skill`) and let the generator resolve per-tool locations where a path is truly needed.
5. **The routing rule is violated in both directions.**
   - Commands with **no agent routing**: `tsh-ask`, `tsh-commit`, `tsh-debug`, `tsh-refactor`. `tsh-create-custom-command:41` says "Every command MUST reference an agent".
   - Commands that **embed domain knowledge**: `tsh-analyze-aws-costs`, `tsh-analyze-gcp-costs`, `tsh-analyze-materials`, `tsh-audit-infrastructure`, `tsh-implement`, `tsh-review-codebase`, `tsh-ask` (ADR template), `tsh-refactor` and `tsh-debug` (process).
6. **Cursor-specific terms in portable content.**
   - `*.mdc rules`: `tsh-ask:20`, `tsh-audit-infrastructure:28`, `tsh-review:24`, `tsh-plan:33`, and every devops/e2e internal skill (`:25/26`). Neutral wording: "project rules/instructions (e.g. `.cursor/rules`, `CLAUDE.md`, `AGENTS.md`)".
   - `read_file`: `tsh-analyze-aws-costs:28-32`, `tsh-analyze-gcp-costs:29-34`
   - "semantic search": `tsh-plan:27`
   - "Task tool": EM `:27,129`
   - `@tsh-*` mentions: `tsh-analyze-materials:9`, `tsh-explore-materials:9`, `tsh-audit-infrastructure:97`
   - Agents' `> Recommended model/tools` blockquotes use Cursor and Copilot-style tool IDs (`execute`, `todo`, `agent`, `atlassian/*`). This is agent scope, but it affects how commands delegate.
7. **Tool names are MCP-server names.** Examples: `figma`, `playwright`, `pdf-reader`, `context7`, `sequential-thinking`, `awslabs.aws-api-mcp-server`, `gcp-gcloud/*`, "Atlassian tools". They are portable only if every generated MCP config keeps the same server keys. Claude exposes them as `mcp__<server>__<tool>`; Codex uses `config.toml` `[mcp_servers.<name>]`. Keep them as server names in prose and pin the names in the MCP generator.
8. **No `$ARGUMENTS` or placeholder usage.** Every command relies on "the user's message following this skill". Commands that take structured input need an argument hint and an argument-injection strategy per tool (Claude `$ARGUMENTS`, Codex prompt args):
   - `tsh-commit` hints (`:94-100`)
   - `tsh-analyze-*-costs` (profile/project, region)
   - `tsh-review-ui` (Figma URL, dev URL)
   - `tsh-implement` (task/Jira ID)
9. **Copilot leftovers.** None in commands or internal. Remaining Copilot material:
   - "Recommended tools" syntax in agents (`execute`, `todo`, `agent`)
   - `tsh-migrating-copilot-to-cursor` workflow
   - `README.md:427-428`
10. **Repo tooling mismatch.** `CLAUDE.md` requires `scripts/sync-claude.sh`, but `scripts/` only contains `count-skills.sh`, and `.claude/` only has `settings.local.json`. The generator does not exist yet, so nothing is currently generated.
11. **Output-location inconsistency.**

    | Output | Location |
    |--------|----------|
    | Plans / research | `specifications/<task>/` |
    | ADRs (`tsh-ask`) | `specifications/decisions/` |
    | Refactor plans (`tsh-refactor`) | `specifications/refactoring/` |
    | Cost reports (`tsh-analyze-*-costs`) | CWD, no directory |
    | Codebase report (`tsh-review-codebase`) | repo root `code-quality-report.md` |

    Pick one convention, for example `specifications/<topic>/`.
12. **Description style.** Internal descriptions end with "Not user-invokable." and "Internal skill used by X". In the new model that belongs in metadata, not in the model-facing description. Command descriptions are inconsistent about "Routes to the X agent": `tsh-ask`, `tsh-commit`, `tsh-debug` and `tsh-refactor` lack it.

---

## Command → agent → internal/workflow map

```
/tsh-implement ─► tsh-engineering-manager (orchestrator, must run main-thread)
   ├─ tsh-context-engineer ─► [internal] tsh-research ─► tsh-task-analysing, tsh-codebase-analysing
   ├─ tsh-architect ────────► [internal] tsh-plan ─► tsh-architecture-designing, tsh-codebase-analysing,
   │                                               tsh-implementation-gap-analysing, tsh-technical-context-discovering,
   │                                               tsh-sql-and-database-understanding
   ├─ tsh-plan-reviewer (agent, delegate-only)
   ├─ tsh-software-engineer ► [internal] tsh-implement-common-task ─► tsh-technical-context-discovering,
   │                        │                                        tsh-implementation-gap-analysing, tsh-sql-..., tsh-implementing-backend
   │                        └ [internal] tsh-implement-ui-common-task (extends ↑) ─► tsh-implementing-frontend, tsh-ensuring-accessibility
   ├─ tsh-e2e-engineer ─────► [internal] tsh-implement-e2e ─► tsh-task-analysing, tsh-technical-context-discovering, tsh-e2e-testing
   │                                                          └─(nested) tsh-code-reviewer
   ├─ tsh-devops-engineer ──► [internal] tsh-implement-terraform / tsh-implement-pipeline /
   │                                     tsh-deploy-kubernetes / tsh-implement-observability
   │                                     ─► tsh-implementing-{terraform-modules,ci-cd,kubernetes,observability},
   │                                        tsh-managing-secrets, tsh-technical-context-discovering
   │                                     └─(nested) tsh-architect
   ├─ tsh-prompt-engineer ──► [internal] tsh-engineer-prompt ─► tsh-engineering-prompts, tsh-technical-context-discovering
   ├─ (EM itself) ──────────► [internal] tsh-implement-ui (verify-fix loop)
   ├─ tsh-ui-reviewer ──────► [command] tsh-review-ui ─► tsh-ui-verifying
   └─ tsh-code-reviewer ────► [command] tsh-review ─► tsh-code-reviewing, tsh-implementation-gap-analysing,
                                                      tsh-technical-context-discovering, tsh-sql-..., tsh-engineering-prompts
/tsh-review ──────────► tsh-code-reviewer (as above)
/tsh-review-ui ───────► tsh-ui-reviewer ─► tsh-ui-verifying
/tsh-review-codebase ─► tsh-architect (+ parallel architect subagents) ─► tsh-codebase-analysing,
                                                                          tsh-technical-context-discovering, tsh-code-reviewing
/tsh-analyze-aws-costs ┐
/tsh-analyze-gcp-costs ┼► tsh-devops-engineer ─► tsh-technical-context-discovering, tsh-codebase-analysing, tsh-optimizing-cloud-cost,
/tsh-audit-infrastructure┘                        tsh-implementing-terraform-modules*, tsh-managing-secrets*, tsh-designing-multi-cloud-architecture* (GCP)
                                                  audit → (nested) tsh-architect; remediation → 4 devops internal skills
/tsh-analyze-materials ┐
/tsh-explore-materials ┴► tsh-business-analyst (orchestrator) ─► tsh-ba-*-worker agents ─► tsh-task-analysing, tsh-transcript-processing,
                                                                  tsh-task-extracting, tsh-task-quality-reviewing, tsh-jira-task-formatting, tsh-codebase-analysing
/tsh-create-custom-{agent,command,rules,skill} ─► tsh-cursor-orchestrator (orchestrator) ─► tsh-cursor-researcher / -artifact-creator /
                                                   -artifact-reviewer / tsh-cursor-engineer ─► tsh-creating-{agents,commands,rules,skills},
                                                   tsh-technical-context-discovering, tsh-codebase-analysing
/tsh-ask ──────► (no agent; main thread) ─► tsh-codebase-analysing, tsh-technical-context-discovering
/tsh-debug ────► (no agent; main thread) ─► delegates fix to tsh-software-engineer; tsh-codebase-analysing, tsh-technical-context-discovering
/tsh-refactor ─► (no agent; main thread) ─► delegates steps to tsh-software-engineer; tsh-codebase-analysing, tsh-technical-context-discovering,
                                            tsh-implementation-gap-analysing, tsh-code-reviewing
/tsh-commit ───► (no agent; main thread) ─► tsh-committing
```

Inconsistencies found while mapping:

- **Handoffs to `/tsh-implement` target the wrong agent.** `/tsh-implement` routes to EM, but some handoffs invoke it on the software engineer:
  - `tsh-code-reviewer/SKILL.md:115`: "Invoke @tsh-software-engineer with `/tsh-implement`"
  - `tsh-e2e-engineer/SKILL.md:150`: the same
- **Who drives UI verification is contradictory.** `tsh-ui-reviewer/SKILL.md:13` says it is "called … as a subagent by `tsh-software-engineer` during the UI implementation loop". `tsh-implement-ui-common-task:66`, `tsh-architecture-designing:71` and EM `:60` all say EM orchestrates verification and the software engineer must not.
- **Wrong owner in `tsh-implement-e2e`.** Its description (`:3`) says "Internal skill used by tsh-software-engineer", but it is executed by `tsh-e2e-engineer` (EM `:48`, software-engineer `:155`).
- **No internal skill for the Quick flow.** `/tsh-implement` Quick flow (`:35`) delegates to software-engineer with no internal skill. EM `:61` says "Always delegate with … tsh-implement-common-task", but that skill requires a plan file.

---

## Commands

### 1. tsh-analyze-aws-costs

- **Current:** command · frontmatter `name, description, disable-model-invocation: true` · 200 lines · routes to `tsh-devops-engineer`.
- **Proposed:** command. Merge with #2 into `tsh-analyze-cloud-costs` (provider argument), or keep two very thin commands. Move the resource checklist (`:52-62`), the tagging rules (`:64-70`) and the report template (`:83-177`) into `tsh-optimizing-cloud-cost/references/` (for example `aws-audit-checklist.md` and `cost-audit-report.template.md`). *Why:* about 95% of the text is shared with GCP, and it is domain knowledge that belongs in the workflow.
- **Coupling:**
  - `:28-32`: five `read_file` + `.cursor/skills/workflows/<name>/SKILL.md` paths. Cursor tool name plus hardcoded category paths.
  - `:30` `references/tagging-standards.md`: ambiguous relative path (relative to which skill?).
  - `:47,50,66,73,75`: `awslabs.aws-api-mcp-server` and `awslabs.aws-documentation-mcp-server`. `:76` `context7`, `:77` `sequential-thinking`.
  - `:4` `disable-model-invocation: true`.
  - Scope inputs (profile, region) have no argument placeholder.
- **Content:**
  - Referenced targets that exist: the workflows, `tsh-optimizing-cloud-cost/references/tagging-standards.md`, Steps 2/7/12 in `tsh-codebase-analysing` (`:10-110`), the Pricing Model / Storage Tiering / Required Tags / Checklist / Anti-Patterns sections, and devops "Output Strategy" (`:136`), "Mutation Lock" (`:214`) and "FINOPS ALERT" (`:98`). **Broken reference:** "Zero-Deletion Policy" (`:196`, same in GCP `:201`) does not exist anywhere in `tsh-devops-engineer`.
  - **Bug** `:45`: "The user may provide a Terraform directory later in step 7". The Terraform question is in **step 8** (`:179-190`).
  - Required Skills are listed twice: the summary list (`:12-18`) and the "Load required skills" step (`:27-34`).
  - Heavy emoji-formatted report rules (`:170-177`). Fine as a template, but they belong in a references file.
- **Recommendations:**
  - Replace every `read_file` + path with "load the `tsh-…` skill".
  - Merge with GCP. Keep only the scope-validation, gate and guardrail steps in the command.
  - Move the checklists and report template into the `tsh-optimizing-cloud-cost` references.
  - Fix the step-7/8 reference.
  - Add an argument hint `<provider> <account|project> <region>`.
  - Standardize the report path (`specifications/cost-audits/…`).

### 2. tsh-analyze-gcp-costs

- **Current:** command · same frontmatter · 205 lines · routes to `tsh-devops-engineer`.
- **Proposed:** merge into `tsh-analyze-cloud-costs` (see #1). *Why:* it is a structural clone of #1 with GCP nouns.
- **Coupling:**
  - `:29-34`: six `read_file` + `.cursor/skills/workflows/...` paths.
  - `:31,33`: relative `references/tagging-standards.md` and `references/gcp-modules.md`. The second belongs to `tsh-implementing-terraform-modules`; it exists.
  - `:49-51,70,77`: the `gcp-gcloud/*`, `gcp-storage/*` and `gcp-observability/*` MCP families. `:54,80,81` `context7`, `:82` `sequential-thinking`.
- **Content:**
  - **Same bug** `:47`: "step 7" should be step 8.
  - `:32`: the multi-cloud skill is referenced for "GCP service comparison tables". They exist (`tsh-designing-multi-cloud-architecture:22`), but they compare providers, not GCP tiers against each other (`:79` "Cloud SQL vs AlloyDB"), so the reference is weak.
  - `:69`: "Required Tags table (adapted for GCP labels)". Label adaptation is invented in the command. It should live in `tagging-standards.md`.
- **Recommendations:** same as #1. Add a GCP label mapping to `tagging-standards.md`.

### 3. tsh-analyze-materials

- **Current:** command · 69 lines · routes to `@tsh-business-analyst`.
- **Proposed:** command, thin. *Why:* the BA agent already defines gates 0/1/1.5/2 (`tsh-business-analyst:62-65,283-286`), Explore Mode (`:35`), Import Mode (`:98`), Lite/Full review (`:97`) and worker routing. The command re-specifies the full 14-step pipeline (`:40-53`) and the artifact list (`:11-18`).
- **Coupling:**
  - `:9`: `@tsh-business-analyst` (Cursor mention syntax).
  - `:41`: `figma` tool, `pdf-reader` tool.
  - `:4` `disable-model-invocation`.
  - The BA is an orchestrator of worker subagents, so it must run in the main thread (not as a forked subagent).
- **Content:**
  - All referenced workflows exist. `tsh-jira-task-formatting` Import Mode is at `:202`; Lite/Full is in `tsh-task-quality-reviewing:53-54`.
  - It duplicates BA agent content. Divergence risk: gate definitions exist in 2 places, 3 counting the workflows.
  - `:36` Explore Mode branch duplicates `/tsh-explore-materials`.
- **Recommendations:**
  - Reduce the command to: route to BA + entry-point detection (workshop materials vs Jira keys vs explore) + output folder convention.
  - Keep the gate/step list only in the BA agent (or a `tsh-ba-orchestrating` workflow).
  - Replace `@` with a neutral "use the tsh-business-analyst agent".

### 4. tsh-ask

- **Current:** command · 81 lines · **no agent routing**.
- **Proposed:** command → `tsh-architect` (architectural consultation is architect scope). Move the ADR template (`:35-67`) into a workflow, for example the `tsh-architecture-designing` references (`decision.example.md`). *Why:* it violates "every command routes to an agent", and the template is domain knowledge.
- **Coupling:** `:20` "`*.mdc rules`"; `:4` `disable-model-invocation`.
- **Content:**
  - `:76-81` "Connected Skills" lists `tsh-debug` and `tsh-refactor`. These are **commands** with model invocation disabled, so the model cannot load them. They should be phrased as "recommend `/tsh-debug`".
  - `:11-14` and `:76-79` list the same skills twice.
- **Recommendations:**
  - Add "Use the tsh-architect agent".
  - Move the ADR template out.
  - Change Connected Skills to "Related commands".
  - Neutralize the `*.mdc` wording.

### 5. tsh-audit-infrastructure

- **Current:** command · 98 lines · routes to `tsh-devops-engineer`.
- **Proposed:** command, thin. Move the report template (`:63-90`) and severity scale (`:42-46`) into a workflow (a `tsh-optimizing-cloud-cost` reference, or a new `tsh-auditing-infrastructure` workflow). *Why:* embedded domain knowledge, and the scope overlaps the cost commands.
- **Coupling:**
  - `:87-89`: `.cursor/skills/internal/tsh-implement-{terraform,kubernetes,observability}/SKILL.md` **inside the user-facing report template**. Internal file paths leak into user deliverables and break after the refactor.
  - `:97`: `@tsh-devops-engineer` plus `.cursor/skills/internal/<name>/SKILL.md`.
  - `:28` `*.mdc rules`.
  - `:52` "Spawn `tsh-architect` sub-agent": nested delegation if devops runs as a subagent.
- **Content:**
  - Required Skills (`:13-16`) omit `tsh-technical-context-discovering`, although devops' own table requires it for "Infrastructure audit" (`tsh-devops-engineer:177`).
  - `:98` "coordinate with software engineer" is vague (which agent or command?).
  - It overlaps `/tsh-analyze-*-costs`, which both do a much deeper cost audit. Define the boundary: this command is the broad security/cost/ops audit, the cost commands are the FinOps deep-dive.
- **Recommendations:**
  - Replace the remediation paths with "hand off to tsh-devops-engineer (Terraform/K8s/CI-CD/observability)".
  - Add the context-discovering skill.
  - Replace nested spawning with an escalation note.
  - Move the template to a workflow.

### 6. tsh-commit

- **Current:** command · 117 lines · no agent (by design; see `specifications/decisions/commit-command-vs-committing-workflow.decision.md`).
- **Proposed:** command, main thread, no agent. *Why:* a git-approval gate needs direct user interaction, and the domain rules already live in `tsh-committing`. It is acceptable as an explicit exception to the routing rule, but document that exception in `cursor-instructions.md`.
- **Coupling:**
  - `:4` `disable-model-invocation` (correct for a side-effecting command).
  - `:94-100` optional hints have no argument placeholder.
  - Claude Code and Codex have their own built-in commit behaviors and attribution trailers. The generated Claude variant should defer to harness attribution rules.
- **Content:**
  - `:37` "Run secret-file checks from **the reference**" is stale wording. It is now `tsh-committing` "Secret and Sensitive Files" (`:97`).
  - `:113-117` Connected Skills lists `tsh-refactor` and `tsh-debug`, which are commands and cannot be model-loaded.
  - The step format (`### 1.` headings) differs from the other commands (numbered bold list).
- **Recommendations:**
  - Fix the "reference" wording.
  - Relabel Connected Skills as related commands.
  - Add an argument hint.
  - Record the no-agent exception in the rules.

### 7. tsh-create-custom-agent

- **Current:** command · 44 lines · routes to `tsh-cursor-orchestrator`.
- **Proposed:** command, rewritten to create a **neutral-source agent** and then run the generator. Consider merging #7–#10 into one `/tsh-create-artifact <agent|command|skill|rule>` (all four share the same 5-step skeleton), or keep four thin commands. *Why:* all four are Cursor-only by definition and target the paths being removed.
- **Coupling:**
  - `:3`: "Cursor Agent Skill (.cursor/skills/agents/<name>/SKILL.md)"
  - `:8`: "for Cursor"
  - `:19,34`: `.cursor/skills/agents/`
  - Router agent name `tsh-cursor-orchestrator` (Cursor-branded)
- **Content:**
  - In the new model agents are native subagent definitions (plus optional skills), not `SKILL.md` personas, so the "Create the SKILL.md" step (`:34`) is obsolete.
  - `:22` "Tool configurations" has no neutral tool vocabulary defined yet.
- **Recommendations:**
  - Point to the neutral source path.
  - Require a generator run and a `--check`.
  - Rename or re-scope the orchestrator family (`tsh-cursor-*` → for example `tsh-agentic-*`) as a separate decision.
  - Update `tsh-creating-agents` accordingly.

### 8. tsh-create-custom-command

- **Current:** command · 46 lines · routes to `tsh-cursor-orchestrator`.
- **Proposed:** command, rewritten (or merged; see #7).
- **Coupling:**
  - `:3,19,24,33,35,42`: `.cursor/skills/commands/` and `.cursor/skills/agents/`
  - `:20`: "disable-model-invocation fields"
- **Content:**
  - `:8` "Every command skill must specify an agent routing **and model preference in its frontmatter**" is false. No command has agent/model frontmatter; routing is in the body (`:41`). Contradictory.
  - The linked workflow `tsh-creating-commands:110` says command directories use "gerund form". That contradicts the naming rule `tsh-<action>` (`tsh-naming-conventions.mdc`).
- **Recommendations:**
  - Define what a neutral command source is (body + routing metadata + args), and generate Cursor `.cursor/commands`, Claude skills and Codex prompts from it.
  - Fix the frontmatter claim.
  - Fix the gerund contradiction in the workflow.

### 9. tsh-create-custom-rules

- **Current:** command · 47 lines · routes to `tsh-cursor-orchestrator`.
- **Proposed:** command, rewritten. Rules are the least portable artifact. Cursor has `.mdc` with `globs`; Claude has `CLAUDE.md` plus imported files (and path-scoped memory, if any); Codex has `AGENTS.md`. The command must choose a neutral rule format or emit per-tool files.
- **Coupling:** `:3,8,22,25-26,31,36,41-42`: `.cursor/rules/*.mdc`, `cursor-instructions.md`, "Cursor interactions".
- **Content:**
  - **Stale fact** `:23` and `:43`: "this repository currently has NO rule files". False: `.cursor/rules/cursor-instructions.md` and `tsh-naming-conventions.mdc` exist.
  - The skill is distributed to other repos, so a repo-specific statement is wrong in any case.
- **Recommendations:**
  - Delete the stale lines.
  - Add a per-tool mapping of rule types.
  - Decide in the architecture whether rules are generated (for example `cursor-instructions.md` → `CLAUDE.md` / `AGENTS.md` sections).

### 10. tsh-create-custom-skill

- **Current:** command · 46 lines · routes to `tsh-cursor-orchestrator`.
- **Proposed:** command, rewritten (or merged; see #7).
- **Coupling:** `:3,19,34`: `.cursor/skills/workflows/`.
- **Content:**
  - `:20,30,40` gerund examples omit the prefix (`creating-agents`, `analyzing-performance`), which contradicts the naming convention (`tsh-creating-agents`).
  - It only covers workflow skills. Internal/command skills are not addressed; in the new model, skills are the single cross-tool format.
- **Recommendations:**
  - Prefix the examples.
  - Target the neutral skills directory.
  - Note that the open Agent Skills standard frontmatter (`name`, `description`, optional fields) is what gets emitted.

### 11. tsh-debug

- **Current:** command · 72 lines · **no routing agent**; delegates the fix to `tsh-software-engineer` (`:9,45,62`).
- **Proposed:** command → `tsh-software-engineer` for small bugs (it can reproduce, isolate and fix), or EM when a plan is needed. *Why:* violates the routing rule; the main thread currently acts as an implicit orchestrator.
- **Coupling:** `:4` `disable-model-invocation`. Delegation from the main thread is fine; if the command is forked into a subagent, the nested delegation breaks.
- **Content:**
  - The 6-step debugging process (`:18-57`) is domain knowledge. A `tsh-debugging` workflow would let the software engineer and e2e engineer reuse it.
  - `:67-72` Connected Skills lists `tsh-refactor` and `tsh-ask`, which are commands.
- **Recommendations:**
  - Add agent routing.
  - Extract the process into a `tsh-debugging` workflow.
  - Relabel the related commands.

### 12. tsh-explore-materials

- **Current:** command · 46 lines · routes to `@tsh-business-analyst`.
- **Proposed:** command. It could also become an argument or mode of `/tsh-analyze-materials` (`--explore`), since that command already has an Explore branch (`:36`).
- **Coupling:** `:9` `@tsh-business-analyst`; `:4` `disable-model-invocation`.
- **Content:**
  - The output spec (`:37-43`) duplicates `tsh-task-analysing` / BA Explore Mode.
  - `:15` "internal analysis worker" is not named. It is `tsh-ba-analysis-worker`.
- **Recommendations:**
  - Keep it thin.
  - Name the worker, or drop the sentence (routing is the BA's concern).
  - Decide whether to merge it into `/tsh-analyze-materials`.

### 13. tsh-implement

- **Current:** command · 84 lines · routes to `tsh-engineering-manager`.
- **Proposed:** command, thin. Move the Step 0 flow selection and the Quick/Full flows into the EM agent; they are EM behavior. *Why:* the command embeds orchestration knowledge that is duplicated three ways: command `:53-78`, EM `:31-38,105-135`, and `tsh-implement-ui` `:36-103`. `tsh-implement-ui:8` explicitly says "do not duplicate its verify-fix loop in other orchestration skills".
- **Coupling:**
  - `:39,80`: `.cursor/skills/commands/tsh-review/SKILL.md`
  - `:51`: `.cursor/skills/agents/tsh-plan-reviewer/SKILL.md`
  - `:66`: `.cursor/skills/commands/tsh-review-ui/SKILL.md` and `.cursor/skills/internal/tsh-implement-ui/SKILL.md`
  - `:4` `disable-model-invocation`
  - EM delegates to subagents, so it **must run in the main thread** (not a forked subagent) in Claude Code.
  - The task/Jira ID has no argument placeholder.
- **Content:**
  - `:22` garbled: "ask the user to present your recommendation" should read "present your recommendation to the user".
  - Quick flow `:35`: it delegates to the software engineer without specifying an internal skill. `tsh-implement-common-task` assumes a plan exists (`:30`).
  - Quick flow `:39` sends to `tsh-review`, which requires `*.plan.md` / `*.research.md` and writes findings into the plan (`tsh-review:24,30-31`). There is no plan in the Quick flow, so this is undefined behavior.
  - It does not mention the `tsh-plan` or `tsh-research` internal steps; those are only in EM. That is fine if the command becomes thin.
  - No Required Skills section. Every other routing command has one.
- **Recommendations:**
  - Reduce the command to: route to EM, pass the task reference, and the one-line flow choice.
  - Move Step 0 and the Quick/Full flows into the EM agent.
  - Keep the UI loop only in the UI-verification workflow (#26).
  - Replace the paths with skill/agent names.
  - Define Quick-flow review behavior when no plan exists.

### 14. tsh-refactor

- **Current:** command · 72 lines · **no routing agent**; delegates steps to `tsh-software-engineer` (`:9,42`).
- **Proposed:** command → `tsh-architect` for scoping and the plan (steps 1–3), with execution handed to `tsh-software-engineer` (or route everything through EM, whose plan → implement → review flow already exists). *Why:* routing-rule violation; it reinvents a plan format.
- **Coupling:** `:4` `disable-model-invocation`. Main-thread delegation.
- **Content:**
  - `:36` writes `specifications/refactoring/{topic}.refactor-plan.md`. This is a different location and format from the standard `specifications/<task>/<task>.plan.md` (`tsh-plan:10`) that EM, plan-reviewer and code-reviewer understand. As a result `tsh-review` and `tsh-plan-reviewer` cannot consume it.
  - `:65-72` Connected Skills lists `tsh-debug` and `tsh-ask`, which are commands.
- **Recommendations:**
  - Route to an agent.
  - Reuse the standard plan format (with a "behavior-preserving" flag) so review tooling works.
  - Move characterization-test guidance into a workflow (`tsh-code-reviewing` or a new `tsh-refactoring`).

### 15. tsh-review

- **Current:** command · 33 lines · routes to `tsh-code-reviewer`.
- **Proposed:** command (dual-use). Move the 8-step review procedure into `tsh-code-reviewing` (or make this skill model-invocable) so delegates can load it by name. *Why:* EM, `tsh-implement`, `tsh-implement-ui`, `tsh-architecture-designing:69` and every agent handoff ("Invoke @tsh-code-reviewer with `/tsh-review`") depend on it.
- **Coupling:**
  - `:24` `*.mdc rules`
  - `:4` `disable-model-invocation` blocks loading by delegates in Claude Code
  - The handoffs use the Cursor `@agent /command` syntax (in agents)
- **Content:**
  - `:24,26-27,30-31` assume a plan file. There is no fallback for plain-diff review (Quick flow, direct user use such as "review my changes").
  - Its description "Review the implementation against the plan" undersells ad-hoc review.
  - Lines `:19-20` conditional skills are fine.
- **Recommendations:**
  - Add a "no plan: review the diff against conventions" branch.
  - Make it model-loadable, or move the body to the workflow.
  - Clarify its distinction from `/tsh-review-codebase` in the description (change review vs whole-repo audit).

### 16. tsh-review-codebase

- **Current:** command · 167 lines · routes to `tsh-architect`.
- **Proposed:** command, thin. Move Phase 2a–2c checklists (`:35-66`), Phase 3 (`:70-75`) and the report template (`:89-158`) into `tsh-codebase-analysing` (which already has Step 11 "improvements" and Step 12 "dead code and duplications") or into `tsh-code-reviewing`. *Why:* the largest embedded-knowledge block among the review commands, and it duplicates workflow steps.
- **Coupling:**
  - `:25-33,166`: "Run `tsh-architect` subagents in parallel". Nested delegation if the architect itself runs as a subagent (EM `:101` does delegate it to the architect).
  - EM references it by path (`tsh-engineering-manager:101`).
  - `:4` `disable-model-invocation` blocks that delegation in Claude Code.
- **Content:**
  - `:13` confusing: "(note: this skill's 'Report Structure' section overrides any report/template instructions from the skill)". The intended meaning is that *this command's* Report Structure overrides `tsh-codebase-analysing`'s "Report" section (`:116`) and `codebase-analysis.example.md`. Reword it.
  - `:85` report goes to the repo root `code-quality-report.md`, unlike all other outputs (under `specifications/`). A stale `code-quality-report.md` is currently committed at the repo root.
  - It is not a duplicate of `/tsh-review` (different scope), but the names are confusingly similar. Consider `/tsh-audit-codebase` for symmetry with `/tsh-audit-infrastructure`.
- **Recommendations:**
  - Keep: route to the architect, monorepo split rule, output path.
  - Move the checklists and template to the workflow.
  - Run the parallel fan-out from the main thread (the command runs in the main context and spawns architect subagents; the architect itself does not spawn).
  - Reword `:13`.

### 17. tsh-review-ui

- **Current:** command · 30 lines · routes to `tsh-ui-reviewer`.
- **Proposed:** command (dual-use), model-invocable, or referenced as the `tsh-ui-verifying` workflow by delegates. *Why:* EM `:130`, `tsh-implement:66`, `tsh-implement-ui:46` and `plan.example.md:117` instruct delegates to follow it.
- **Coupling:**
  - `:23-24`: `figma` and `playwright` MCP servers
  - `:4` `disable-model-invocation`
  - No placeholder for the Figma URL, dev URL and component name (`:22`)
- **Content:** a good thin command; the workflow does the work. It does restate the 5 steps (`:22-26`), which is harmless.
- **Recommendations:**
  - Allow model invocation, or make delegates load `tsh-ui-verifying` directly.
  - Add an argument hint `<figma-url> <dev-url> <component>`.

---

## Internal skills

### 18. tsh-deploy-kubernetes

- **Current:** internal · 92 lines · used by devops (delegated from EM `:76`).
- **Proposed:** merge/delete. Move the "Summary (required output)" template (`:59-83`) and the architect-escalation triggers (`:48-53`) into the `tsh-implementing-kubernetes` workflow. The devops agent's Mandatory Skill Loading table (`tsh-devops-engineer:166-177`) already covers skill selection. *Why:* the four devops internal skills are near-identical wrappers (Required Skills → Context → Implementation → Architect Consultation → Summary → Scope) whose only unique content is the summary template.
- **Coupling:**
  - `:90-92`: three `.cursor/skills/internal/.../SKILL.md` paths in Scope
  - `:25` `*.mdc rules`
  - `:48` "Spawn `tsh-architect` sub-agent" (nested)
  - `:3` "Not user-invokable"; `:4` `disable-model-invocation`
- **Content:** unlike the other three devops internals, it **lacks** the "Read the Technical Context section from the plan file" line, so it rescans the codebase unnecessarily. That is inconsistent.
- **Recommendations:**
  - Fold it into the workflow and the agent.
  - If it is kept, add the Technical-Context line, replace the paths with names, and replace nested spawning with "return an escalation".

### 19. tsh-engineer-prompt

- **Current:** internal · 32 lines · used by `tsh-prompt-engineer` (EM `:144`; `tsh-architecture-designing:73` via `../internal/...`).
- **Proposed:** merge into the `tsh-prompt-engineer` agent (Workflow + Output Format sections). *Why:* the agent has a single job; the internal skill only adds a 5-step loop and an output format that belong in the agent body. Under a native subagent, "follow the internal skill" becomes the subagent's default behavior.
- **Coupling:** inbound paths `tsh-engineering-manager:144` and `tsh-architecture-designing:73` (`../internal/tsh-engineer-prompt/SKILL.md`). `:4` `disable-model-invocation`.
- **Content:** the name is a verb phrase (`engineer-prompt`), inconsistent with the `implement-*` naming. No issues otherwise.
- **Recommendations:**
  - Move the content into the agent.
  - Update the EM and architecture-designing references to "delegate to tsh-prompt-engineer".

### 20. tsh-implement-common-task

- **Current:** internal · 39 lines · used by EM → software-engineer (EM `:61`).
- **Proposed:** internal step. Merge #25 into it as a single `tsh-implement-task` skill with a "UI tasks (Figma)" section, preloaded into the `tsh-software-engineer` subagent. *Why:* the "extends" relationship is implemented by a path-based prerequisite that breaks after flattening.
- **Coupling:** `:4` `disable-model-invocation` (a subagent cannot load it by name in Claude). Inbound paths: EM `:61`, `tsh-implement-ui:44`, `tsh-implement-ui-common-task:8`.
- **Content:**
  - `:10-16` restates `:29-37` (the "don't deviate", "ask confirmation" and "changelog" rules each appear twice).
  - It assumes a plan with a "Technical Context" section. There is no fallback for the Quick flow (no plan).
  - EM `:61` "Use GPT-5.4 mini for this use case" is a model hint that should become subagent/model metadata.
- **Recommendations:**
  - Merge with #25.
  - Dedupe the intro.
  - Add a no-plan branch.
  - Move the model preference into generated agent metadata.

### 21. tsh-implement-e2e

- **Current:** internal · 89 lines · followed by `tsh-e2e-engineer` (EM `:48`, software-engineer `:155`).
- **Proposed:** internal step, or fold into the `tsh-e2e-engineer` agent. The agent already loads the same three skills (`tsh-e2e-engineer:45-47`). *Why:* the e2e agent does nothing else, so the wrapper adds little beyond the summary template.
- **Coupling:**
  - `:25` `*.mdc rules`
  - `:89` "always run `tsh-code-reviewer` agent … automatically": **nested subagent**, since e2e-engineer is itself a delegate. Breaks in Claude Code.
  - Inbound paths: EM `:48`, software-engineer `:155`.
- **Content:**
  - `:3` description says "used by tsh-software-engineer". Wrong: the executor is `tsh-e2e-engineer`.
  - `:8` "Non-interactive" conflicts with the auto-review step, which requires orchestration.
  - Its section format (`## 1. Context` / `## 2. Planning` …) matches the devops internals, not the other internal steps.
- **Recommendations:**
  - Fix the description.
  - Move "run code review after E2E" to EM (the caller) instead of the delegate.
  - Consider merging it into the agent.

### 22. tsh-implement-observability

- **Current:** internal · 92 lines · devops.
- **Proposed:** merge/delete → `tsh-implementing-observability` (summary template `:56-83`, escalation triggers `:45-50`) + devops agent. *Why:* same as #18.
- **Coupling:** `:91-92` internal paths; `:25` `*.mdc`; `:45` nested architect spawn.
- **Content:** `:90` "coordinate with software engineer" is vague.
- **Recommendations:** as #18.

### 23. tsh-implement-pipeline

- **Current:** internal · 88 lines · devops.
- **Proposed:** merge/delete → `tsh-implementing-ci-cd` (summary `:59-79`, escalation `:48-53`) + devops agent.
- **Coupling:** `:86-88` internal paths; `:26` `*.mdc`; `:48` nested spawn.
- **Content:**
  - `:49` lists "blue-green, canary" as architect-escalation triggers, while `:36` implements them directly. This is a mild contradiction; clarify it as "new strategy for the org".
- **Recommendations:** as #18.

### 24. tsh-implement-terraform

- **Current:** internal · 98 lines · devops (plus remediation target of `/tsh-audit-infrastructure`).
- **Proposed:** merge/delete → `tsh-implementing-terraform-modules` (guardrails `:39-43`, summary `:61-89`, escalation `:49-55`) + devops agent. Keep the guardrails; they duplicate devops Mutation Lock but are Terraform-specific.
- **Coupling:** `:96-98` internal paths; `:25` `*.mdc`; `:49` nested spawn; inbound from `tsh-audit-infrastructure:87,97`.
- **Content:** OK.
- **Recommendations:** as #18.

### 25. tsh-implement-ui-common-task

- **Current:** internal · 66 lines · EM → software-engineer (EM `:60`).
- **Proposed:** merge into #20. *Why:* it is an extension of #20 via a path-based prerequisite.
- **Coupling:**
  - `:8` **"PREREQUISITE: This skill extends `.cursor/skills/internal/tsh-implement-common-task/SKILL.md`. You MUST read…"**. This is a load-bearing path and breaks after flattening.
  - `:32` `figma`.
  - `:55` "Before step 6 of the base workflow" and `:25` "step 1–2 of the base workflow" couple it by step number to #20, which is fragile.
- **Content:**
  - The "When Figma link is missing" block (`:34-49`) duplicates `tsh-implement-ui:25-34`.
  - `:66` correctly states EM owns verification, which contradicts `tsh-ui-reviewer:13`.
- **Recommendations:**
  - Merge it as a section of `tsh-implement-task`.
  - Remove the step-number coupling.
  - Keep one "missing Figma link" rule, in the UI-verification workflow, and reference it.

### 26. tsh-implement-ui

- **Current:** internal · 103 lines · "used by tsh-engineering-manager"; EM loads it itself (`:131`), `tsh-implement:66` references it.
- **Proposed:** workflow (EM-loaded, model-invocable, hidden from the user menu), renamed for example `tsh-orchestrating-ui-verification`. *Why:* the name says "implement UI", but the content is the EM's verify-fix orchestration loop (dev URL confirmation, delegation, 5-iteration limit, confidence handling, verification gate). It is loaded conditionally, so progressive disclosure argues against inlining it into the EM agent.
- **Coupling:**
  - `:44`: `.cursor/skills/internal/tsh-implement-ui-common-task/SKILL.md` and `.cursor/skills/internal/tsh-implement-common-task/SKILL.md`
  - `:46`: `.cursor/skills/commands/tsh-review-ui/SKILL.md`
  - `:69`: `.cursor/skills/commands/tsh-review/SKILL.md`
  - `:51,83-84`: `figma` / `playwright`
  - `:51` "You do NOT need `figma` or `playwright` tools yourself" is a workaround for Cursor subagent tool scoping; keep it tool-neutral
- **Content:**
  - It duplicates `tsh-implement` Full-flow steps 3–4 and 9–10, and EM `:31-38,122-135`.
  - Its own `:8` forbids exactly this duplication.
  - `:40` "Delegate codebase analysis" duplicates `tsh-implement:59`.
  - Step list `:62-67`: sub-bullets under step 10 are unindented (Markdown list break). Cosmetic.
- **Recommendations:**
  - Rename it.
  - Make it the single source of the UI loop; delete the copies in `tsh-implement` and trim EM to a one-line pointer.
  - Replace paths with names.

### 27. tsh-plan

- **Current:** internal · 53 lines · used by EM → architect (EM `:101`); documented in `website/docs/agents/context-engineer.md:60`.
- **Proposed:** merge the procedure into the `tsh-architecture-designing` workflow (which already owns `plan.example.md`, the `[REUSE]` UI-verification rule `:71` and the prompt-task rule `:73`). Then decide:
  - (a) keep no separate artifact; the architect subagent's default job is planning, or
  - (b) expose a user command `/tsh-plan` → `tsh-architect`. Today there is no user-level planning command even though the architect is user-facing.

  *Why:* the plan structure is defined in 3 places: architect agent `:23-29,43-46`, `tsh-plan` `:24-45`, and `tsh-architecture-designing` + `plan.example.md`. Step 9 (`:41`) duplicates `tsh-architecture-designing:71`.
- **Coupling:**
  - `:27` "Use semantic search" (Cursor `codebase_search` concept; neutral: "search the codebase")
  - `:33` `*.mdc rules`
  - `:4` `disable-model-invocation`
  - Inbound path EM `:27,101`
- **Content:**
  - `:10` naming rule for the output file is duplicated verbatim in `tsh-research:10`. Move it to a shared "specifications layout" rule.
  - `:47` "Don't provide … code review instructions" conflicts with `tsh-architecture-designing:69` ("The plan has to include a code review phase…").
- **Recommendations:**
  - Merge into the workflow.
  - Fix the code-review contradiction.
  - Neutralize tool words.
  - Choose (a) or (b).

### 28. tsh-research

- **Current:** internal · 36 lines · used by EM → context-engineer (EM `:87`, `tsh-context-engineer:35`).
- **Proposed:** merge the orchestration steps into `tsh-task-analysing` (which already owns `research.example.md` and the process). Optionally expose `/tsh-research` → `tsh-context-engineer` as a user command. *Why:* the context-engineer calls it "the orchestration wrapper" (`:35`). It is 36 lines of which about 60% restates `tsh-task-analysing`.
- **Coupling:**
  - `:22,25`: Atlassian / Confluence
  - `:25`: `pdf-reader`; `:26`: `figma` (MCP server names)
  - Inbound paths EM `:87`, `tsh-context-engineer:35`
- **Content:**
  - `:27` and `:34` repeat the "ask for clarification" instruction.
  - The output naming rule is duplicated with `tsh-plan:10`.
- **Recommendations:** merge; dedupe; move the output naming convention to a shared rule.

---

## Duplication pairs requested

| Pair | Verdict |
|------|---------|
| `tsh-review` vs `tsh-review-codebase` | **Not duplicates.** Change/plan review (code-reviewer) vs whole-repo audit (architect). The names are confusing: rename `tsh-review-codebase` → `tsh-audit-codebase`, and state the scope in both descriptions. Both embed procedure that belongs in workflows. |
| `tsh-implement-ui` vs `tsh-implement-ui-common-task` | **Not duplicates, but misnamed.** The former is EM verification orchestration, the latter is SE implementation. They share the duplicated "missing Figma link" block. Rename the former to a workflow and merge the latter into `tsh-implement-common-task`. |
| `tsh-plan` vs `tsh-architect` | **Duplicated.** The plan structure is defined in the architect agent, `tsh-plan` and `tsh-architecture-designing`. Single-source it in the workflow. |
| `tsh-implement` vs `tsh-engineering-manager` vs `tsh-implement-ui` | **Triplicated** UI gate and plan-review loop. Single-source them. |
| `tsh-analyze-aws-costs` vs `tsh-analyze-gcp-costs` | **About 95% clone.** Merge. |
| `tsh-analyze-materials` vs `tsh-business-analyst` | **Duplicated** gates/pipeline. Keep them in the agent. |
| four devops internals vs devops agent + workflows | **Wrapper duplication.** Fold them in. |
| `tsh-engineer-prompt` vs `tsh-prompt-engineer` | **Wrapper.** Fold it in. |
| `tsh-research` vs `tsh-task-analysing` | **Wrapper.** Fold it in. |

## Step-format inconsistency

| Format | Used by |
|--------|---------|
| `## Workflow` + numbered bold list | ask, debug, refactor, review, create-*, analyze-materials, implement (with `### Step 0` / flows), plan, research, implement-common-task, implement-ui |
| `## 1. Context / ## 2. … / ## 4. Summary (required output) / ## Scope` | audit-infrastructure, all four devops internals, implement-e2e |
| `### 1.` headings | commit |
| Phases (`### Phase 1…4`) | review-codebase |
| Numbered bold list with nested sub-phases | analyze-*-costs |

Recommend one command template (Route → Inputs/Args → Required Skills → Steps → Output → Guardrails) and one internal-step template.

---

## Appendix A: every path reference to a category folder (outbound, inside the audited files)

| File:line | Reference |
|-----------|-----------|
| commands/tsh-analyze-aws-costs:28 | `.cursor/skills/workflows/tsh-technical-context-discovering/SKILL.md` |
| commands/tsh-analyze-aws-costs:29 | `.cursor/skills/workflows/tsh-codebase-analysing/SKILL.md` |
| commands/tsh-analyze-aws-costs:30 | `.cursor/skills/workflows/tsh-optimizing-cloud-cost/SKILL.md` + `references/tagging-standards.md` |
| commands/tsh-analyze-aws-costs:31 | `.cursor/skills/workflows/tsh-implementing-terraform-modules/SKILL.md` |
| commands/tsh-analyze-aws-costs:32 | `.cursor/skills/workflows/tsh-managing-secrets/SKILL.md` |
| commands/tsh-analyze-aws-costs:65 | `references/tagging-standards.md` (relative) |
| commands/tsh-analyze-gcp-costs:29 | `.cursor/skills/workflows/tsh-technical-context-discovering/SKILL.md` |
| commands/tsh-analyze-gcp-costs:30 | `.cursor/skills/workflows/tsh-codebase-analysing/SKILL.md` |
| commands/tsh-analyze-gcp-costs:31 | `.cursor/skills/workflows/tsh-optimizing-cloud-cost/SKILL.md` + `references/tagging-standards.md` |
| commands/tsh-analyze-gcp-costs:32 | `.cursor/skills/workflows/tsh-designing-multi-cloud-architecture/SKILL.md` |
| commands/tsh-analyze-gcp-costs:33 | `.cursor/skills/workflows/tsh-implementing-terraform-modules/SKILL.md` + `references/gcp-modules.md` |
| commands/tsh-analyze-gcp-costs:34 | `.cursor/skills/workflows/tsh-managing-secrets/SKILL.md` |
| commands/tsh-analyze-gcp-costs:69,193 | `references/tagging-standards.md`, `references/gcp-modules.md` (relative) |
| commands/tsh-audit-infrastructure:87 | `.cursor/skills/internal/tsh-implement-terraform/SKILL.md` |
| commands/tsh-audit-infrastructure:88 | `.cursor/skills/internal/tsh-deploy-kubernetes/SKILL.md` |
| commands/tsh-audit-infrastructure:89 | `.cursor/skills/internal/tsh-implement-observability/SKILL.md` |
| commands/tsh-audit-infrastructure:97 | `.cursor/skills/internal/<name>/SKILL.md` |
| commands/tsh-create-custom-agent:3,19,34 | `.cursor/skills/agents/` |
| commands/tsh-create-custom-command:3,19,33 | `.cursor/skills/commands/` |
| commands/tsh-create-custom-command:24,35,42 | `.cursor/skills/agents/` |
| commands/tsh-create-custom-rules:3,22,26,41,42 | `.cursor/rules/`, `cursor-instructions.md` |
| commands/tsh-create-custom-skill:3,19,34 | `.cursor/skills/workflows/` |
| commands/tsh-implement:39 | `.cursor/skills/commands/tsh-review/SKILL.md` |
| commands/tsh-implement:51 | `.cursor/skills/agents/tsh-plan-reviewer/SKILL.md` |
| commands/tsh-implement:66 | `.cursor/skills/commands/tsh-review-ui/SKILL.md`, `.cursor/skills/internal/tsh-implement-ui/SKILL.md` |
| commands/tsh-implement:80 | `.cursor/skills/commands/tsh-review/SKILL.md` |
| internal/tsh-deploy-kubernetes:90-92 | `.cursor/skills/internal/tsh-implement-{terraform,pipeline,observability}/SKILL.md` |
| internal/tsh-implement-observability:91-92 | `.cursor/skills/internal/tsh-implement-{terraform,pipeline}/SKILL.md` |
| internal/tsh-implement-pipeline:86-88 | `.cursor/skills/internal/tsh-implement-terraform`, `tsh-deploy-kubernetes`, `tsh-implement-observability` |
| internal/tsh-implement-terraform:96-98 | `.cursor/skills/internal/tsh-implement-pipeline`, `tsh-deploy-kubernetes`, `tsh-implement-observability` |
| internal/tsh-implement-ui-common-task:8 | `.cursor/skills/internal/tsh-implement-common-task/SKILL.md` (**load-bearing prerequisite**) |
| internal/tsh-implement-ui:44 | `.cursor/skills/internal/tsh-implement-ui-common-task/SKILL.md`, `.cursor/skills/internal/tsh-implement-common-task/SKILL.md` |
| internal/tsh-implement-ui:46 | `.cursor/skills/commands/tsh-review-ui/SKILL.md` |
| internal/tsh-implement-ui:69 | `.cursor/skills/commands/tsh-review/SKILL.md` |

## Appendix B: inbound path references to `commands/` or `internal/` (outside the audited files)

| File:line | Target |
|-----------|--------|
| agents/tsh-engineering-manager:27 | `.cursor/skills/internal/tsh-plan/SKILL.md` (example) |
| agents/tsh-engineering-manager:29 | `commands/tsh-review` |
| agents/tsh-engineering-manager:48 | `internal/tsh-implement-e2e` |
| agents/tsh-engineering-manager:60,61 | `internal/tsh-implement-ui-common-task`, `internal/tsh-implement-common-task` |
| agents/tsh-engineering-manager:74-77 | `internal/tsh-implement-observability`, `-terraform`, `tsh-deploy-kubernetes`, `-pipeline` |
| agents/tsh-engineering-manager:87 | `internal/tsh-research` |
| agents/tsh-engineering-manager:101 | `commands/tsh-review-codebase`, `internal/tsh-plan` |
| agents/tsh-engineering-manager:112 | `agents/tsh-plan-reviewer` |
| agents/tsh-engineering-manager:130,131 | `commands/tsh-review-ui`, `internal/tsh-implement-ui` |
| agents/tsh-engineering-manager:144 | `internal/tsh-engineer-prompt` |
| agents/tsh-context-engineer:35 | `internal/tsh-research` |
| agents/tsh-software-engineer:155 | `internal/tsh-implement-e2e` |
| agents/tsh-cursor-orchestrator:78,85 · tsh-cursor-engineer:13,51,61 · tsh-cursor-artifact-reviewer:64 · tsh-cursor-artifact-creator:34 | category folder layout description |
| workflows/tsh-architecture-designing:69,71,73 | `../commands/tsh-review`, `../commands/tsh-review-ui`, `../internal/tsh-engineer-prompt` |
| workflows/tsh-architecture-designing/plan.example.md:117 | `.cursor/skills/commands/tsh-review-ui/SKILL.md` (**copied into every generated plan**) |
| workflows/tsh-creating-commands:3,8,27,110 · tsh-creating-skills:19 + skill.template.md:47 · tsh-creating-agents:18 · tsh-committing:46 · tsh-migrating-copilot-to-cursor:16-17,49-50 | category layout |
| rules/cursor-instructions.md:8,10 | category layout |
| README.md:91,96,139,427-428 · website/docs/** (about 30 pages: `prompts/public/*.md:9`, `prompts/internal/*.md:13`, `getting-started/installation.md:53,58`, `agents/overview.md:17,30`, `agents/context-engineer.md:60`, `prompts/overview.md:8` says "17 slash commands") | category layout / file paths |

Agent handoffs using Cursor `@agent /command` syntax (these need a neutral handoff format):

- architect:167
- business-analyst:23
- code-reviewer:115
- context-engineer:118
- devops:235
- e2e:150
- software-engineer:154
- ui-reviewer:90
