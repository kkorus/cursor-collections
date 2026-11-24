# Audit: `.cursor/skills/agents/` for the unified agent structure

- **Scope:** every `SKILL.md` under `.cursor/skills/agents/`. The brief said 23 skills. The directory actually has **21**. None of the agent directories has supporting files (only `SKILL.md`).
- **Branch / date:** `refactor/unified-agent-structure`, 2026-09-27
- **Artifact type legend:** (a) subagent, (b) user-invocable skill or command (main-thread), (c) model-invoked knowledge skill, (d) merge or delete
- **Severity legend:** none / minor (mechanical: frontmatter, tool-neutral wording, paths) / major (a structural or content rewrite, a rename, or a contradiction that must be resolved)

## Summary table

| # | Name | Lines | Current type | Proposed type | Severity |
|---|------|------:|--------------|---------------|----------|
| 1 | tsh-architect | 168 | user-facing agent skill | (a) subagent | minor |
| 2 | tsh-software-engineer | 155 | user-facing agent skill | (a) subagent | minor |
| 3 | tsh-engineering-manager | 179 | user-facing agent skill (orchestrator) | (b) main-thread orchestrator skill, merged with `/tsh-implement` | major |
| 4 | tsh-code-reviewer | 115 | user-facing agent skill | (a) subagent | minor |
| 5 | tsh-context-engineer | 118 | user-facing agent skill | (a) subagent | minor |
| 6 | tsh-devops-engineer | 235 | user-facing agent skill | (a) subagent (remove nested spawning) | major |
| 7 | tsh-e2e-engineer | 150 | user-facing agent skill | (a) subagent | minor |
| 8 | tsh-ui-reviewer | 90 | user-facing agent skill | (a) subagent, read-only | minor |
| 9 | tsh-prompt-engineer | 100 | user-facing agent skill | (a) subagent | minor |
| 10 | tsh-plan-reviewer | 243 | delegate-only (`disable-model-invocation`) | (a) subagent, plus a new `tsh-plan-reviewing` workflow (c) | major |
| 11 | tsh-business-analyst | 298 | user-facing agent skill (orchestrator) | (b) main-thread orchestrator skill | major |
| 12 | tsh-ba-transcript-worker | 69 | delegate-only | (a) subagent | minor |
| 13 | tsh-ba-analysis-worker | 79 | delegate-only | (a) subagent | minor |
| 14 | tsh-ba-extraction-worker | 69 | delegate-only | (a) subagent | minor |
| 15 | tsh-ba-quality-worker | 66 | delegate-only | (a) subagent | minor |
| 16 | tsh-ba-formatting-worker | 66 | delegate-only | (a) subagent | minor |
| 17 | tsh-cursor-orchestrator | 114 | user-facing agent skill (orchestrator) | (b) main-thread orchestrator skill, renamed | major |
| 18 | tsh-cursor-engineer | 141 | user-facing agent skill | (a) subagent, renamed (or (d) after the A/B test) | major |
| 19 | tsh-cursor-researcher | 52 | delegate-only | (a) subagent, read-only, renamed | minor |
| 20 | tsh-cursor-artifact-creator | 57 | delegate-only | (a) subagent, renamed | major |
| 21 | tsh-cursor-artifact-reviewer | 66 | delegate-only | (a) subagent, read-only, renamed | major |

The BA worker rows are rated minor for the worker files themselves. The fix they depend on is major, but it belongs in the workflows (see X4).

---

## Cross-cutting findings

### X1. Orchestrators must run in the main thread, not as subagents
In Claude Code, a subagent cannot spawn further subagents. Codex also limits nesting depth; the format research agent should confirm the exact limit. Today three agents delegate as their core job: `tsh-engineering-manager`, `tsh-business-analyst` and `tsh-cursor-orchestrator`. A fourth, `tsh-devops-engineer`, must spawn `tsh-architect` (`tsh-devops-engineer/SKILL.md:37,49-67,128,138-148`). The implications:
- Generate the orchestrators as **user-invocable skills/commands** that run in the main conversation and delegate to native subagents. Do not generate them as subagents.
- Any leaf agent that delegates today (devops → architect) needs a different pattern. It can return a "needs architect decision" result to the caller, or the orchestrator can run the architect first.
- Chains of handoffs that assume one agent invokes another agent's command (for example "Invoke @tsh-software-engineer with `/tsh-implement ...`") are not executable from inside a subagent. Rewrite them as "Suggested next step" text for the user or the orchestrator.

### X2. Delegation graph (current)

```
Commands (entry points)
  /tsh-implement ............ -> tsh-engineering-manager
  /tsh-review ............... -> tsh-code-reviewer
  /tsh-review-ui ............ -> tsh-ui-reviewer
  /tsh-review-codebase ...... -> tsh-architect
  /tsh-debug, /tsh-refactor . -> tsh-software-engineer
  /tsh-analyze-materials, /tsh-explore-materials -> tsh-business-analyst
  /tsh-create-custom-{agent,skill,command,rules} -> tsh-cursor-orchestrator
  /tsh-audit-infrastructure . -> tsh-devops-engineer (+ tsh-architect)
  /tsh-analyze-aws-costs, /tsh-analyze-gcp-costs -> tsh-devops-engineer

Delegation (Task tool)
  tsh-engineering-manager -> tsh-context-engineer, tsh-architect, tsh-plan-reviewer,
                             tsh-software-engineer, tsh-e2e-engineer, tsh-devops-engineer,
                             tsh-ui-reviewer, tsh-code-reviewer, tsh-prompt-engineer
  tsh-devops-engineer     -> tsh-architect                 (NESTED - breaks in Claude Code)
  tsh-business-analyst    -> tsh-ba-{transcript,analysis,extraction,quality,formatting}-worker
  tsh-cursor-orchestrator -> tsh-cursor-researcher, tsh-cursor-artifact-creator,
                             tsh-cursor-artifact-reviewer, tsh-cursor-engineer

Handoffs (text suggestions, "Invoke @x with /y")
  architect -> engineering-manager (/tsh-implement), devops-engineer
  context-engineer -> engineering-manager (/tsh-implement)
  business-analyst -> engineering-manager (/tsh-implement)   (orchestrator -> orchestrator)
  software-engineer -> code-reviewer (/tsh-review), e2e-engineer
  code-reviewer -> software-engineer (/tsh-implement)  (but /tsh-implement routes to EM, not SE)
  e2e-engineer -> software-engineer (/tsh-implement)   (same mismatch)
  devops-engineer -> code-reviewer (/tsh-review)
  ui-reviewer -> code-reviewer (/tsh-review)           (conflicts with EM's UI-verification gate)
  plan-reviewer -> architect ("ALWAYS send", :195)     (conflicts with EM owning the loop, EM:115)
```

Depth today: user → `/tsh-implement` → EM → devops → architect is two levels of nesting. Under X1 this becomes user/main-thread EM → devops, and devops never spawns architect.

### X3. Portability coupling repeated across (almost) every file
| Coupling | Where | Fix |
|---|---|---|
| `> Recommended model: …` blockquote in the body, using vendor model names (GPT-5.4, GPT-5.4 mini, Gemini 3.1 Pro (Preview), Claude Sonnet 4.6) | line 8 or 9 of every file | Move to neutral frontmatter (for example `model-tier: deep \| balanced \| fast`) and map it per target (Claude: `opus`/`sonnet`/`haiku`/`inherit`; Codex: `gpt-*`; Cursor: model id). Remove model names from bodies (EM:61, BA:42-46). |
| `> Recommended tools: …` using VS Code/Copilot tool ids (`execute`, `read`, `edit`, `search`, `todo`, `agent`, `web/fetch`, `atlassian/*`, `atlassian/search`) | line 9 or 10 of every file | Replace with a neutral capability list (read, write, shell, web, delegate, mcp:<server>) and generate native `tools`/`disallowedTools`/`readonly`/`sandbox` per target. These ids are Copilot leftovers. |
| "Invoke with @tsh-x." in `description` | all 12 user-facing files, line 3 | Remove it from the neutral description. Generators can append a per-target hint if one is needed. |
| "Task tool" / `**Task** tool` / "via Task tool" | EM:27,129; BA:13,121,146,169; cursor-orchestrator:15,54; all 5 BA worker descriptions | Use neutral wording such as "delegate to the subagent `tsh-x`". |
| `agent` tool with `agentId: "tsh-architect"` | devops:37,49,60 | This is Copilot `runSubagent`-era syntax. Remove it (see X1). |
| Root-relative Markdown links `[x](.cursor/skills/internal/…/SKILL.md)` | EM:29,48,60,61,74-77,87,101,112,130,131,144; SE:155; context-engineer:35 | These are broken as relative links even today: they resolve against the file's own directory. They also hardcode the Cursor layout. Reference skills **by name** ("follow the `tsh-implement-e2e` skill") and let the generator resolve names. |
| `*.mdc` rules / `cursor-instructions.md` | architect:48; code-reviewer:30; devops:106; plan-reviewer:63; cursor-engineer:52,62,135; creator:35 | Use "project rules/instructions (AGENTS.md, CLAUDE.md, `.cursor/rules/*`)". |
| "local Figma desktop app running in Dev Mode" | architect:99; code-reviewer:77; context-engineer:64; e2e:97; BA:240 | This is also **factually stale**: `.cursor/mcp.json` configures the remote HTTP server `https://mcp.figma.com/mcp`. SE:89 already says "via MCP". Unify on the neutral wording. |
| Copilot/VS Code tool names in prose: `grep_search`, `usages`, `create_file` | architect:88; SE:77; e2e:89; creator:54 | Replace with generic verbs. |
| `disable-model-invocation: true` on delegate-only workers | plan-reviewer:4, BA workers:4, cursor researcher/creator/reviewer:4 | This field is only meaningful for skills. Once these become native subagents it is not needed. Skills that stay user-invocable only need the per-target equivalent (the Claude skill flag, Codex `allow_implicit_invocation`-style policy). |
| Cursor UI references ("Workers run in collapsed tool calls") | cursor-orchestrator:92 | Use tool-neutral wording. |

### X4. BA worker/workflow contradiction (highest-impact content bug)
The workers say "Never write files / never ask the user / never call Jira" (for example `tsh-ba-transcript-worker:58-61`, `tsh-ba-quality-worker:54-57`). The workflows they are told to follow as "governing workflow" instruct the opposite:
- `workflows/tsh-transcript-processing/SKILL.md:41` asks the user; `:108` saves `cleaned-transcript.md`
- `workflows/tsh-task-extracting/SKILL.md:136` asks the user; `:152` saves `intent-brief.md` and `extracted-tasks.md`
- `workflows/tsh-task-quality-reviewing/SKILL.md:73-76` calls Atlassian and asks the user; `:320` saves `quality-review.md`
- `workflows/tsh-jira-task-formatting/SKILL.md:100,106` asks the user; `:116` saves; `:136` calls Atlassian

Fix: add an explicit "Delegated mode (return in-memory, skip Save/Ask/Jira steps)" section to each of these workflows, or split the steps the orchestrator owns out of the workflows. Native subagent tool restrictions (no write, no Atlassian MCP) should also enforce this.

### X5. Duplication
- The "Plan Progress and Definition of Done" block is duplicated verbatim in SE:39-47, devops:22-30 and e2e:33-41. Extract it into a small knowledge skill (for example `tsh-plan-progress-tracking`), or into the internal implement skills.
- The context7 "IMPORTANT: check version first, include version, prefer official docs" block is duplicated in architect:84-86, SE:73-75, code-reviewer:64-66 and prompt-engineer:65-67. Devops (:191-192) and e2e (:86) have variants. Move it into one shared snippet or rule.
- The pdf-reader MUST/IMPORTANT block is near-identical in architect:106-119, context-engineer:72-85 and BA:248-261.
- The Atlassian block is near-identical in architect, EM, code-reviewer, context-engineer and BA. "List accessible Resources" appears in context-engineer:49 and BA:208, and again in `tsh-task-quality-reviewing:75`.
- The separation-of-concerns / progressive-disclosure "domain knowledge" appears in cursor-orchestrator:74-87, cursor-engineer:48-54,114-131 and cursor-artifact-reviewer:38, and again in the `tsh-creating-*` workflows.
- The "Meta-cognitive / Adversarial / First-principles / Iterative" persona prose appears in both prompt-engineer:27-35 and cursor-engineer:26-46.
- The Protected Status Policy is declared "single source of truth" in BA:90, but the status list is repeated 10+ times in `tsh-jira-task-formatting` (:47,62,79,92,133,146,182,251) and `tsh-task-quality-reviewing:107`.
- The E2E Testing Standards in e2e:49-73 duplicate `workflows/tsh-e2e-testing/SKILL.md` (:14, :23, :69).

### X6. Naming
- **`tsh-cursor-*` must become tool-neutral.** Proposal: `tsh-ai-customization-orchestrator`, `tsh-ai-customization-engineer`, `tsh-ai-customization-researcher`, `tsh-ai-customization-creator`, `tsh-ai-customization-reviewer`. A shorter alternative is `tsh-customization-*`. Inbound references to update:
  - `commands/tsh-create-custom-{agent,skill,command,rules}`
  - `tsh-prompt-engineer:25`
  - the `website/docs/agents/cursor-*.md` pages
  - `specifications/decisions/agents-skills-vs-cursor-subagents.decision.md`
- `tsh-migrating-copilot-to-cursor` (loaded by cursor-engineer:63) is Cursor-targeted. Generalize it, for example to `tsh-migrating-copilot-customizations`, or drop it.
- **Confusing triad:** `tsh-prompt-engineer` (agent), `tsh-engineer-prompt` (internal) and `tsh-engineering-prompts` (workflow). Rename the internal one to something like `tsh-implement-prompt`.
- Near-collisions that differ only in word order or form:
  - `tsh-ui-reviewer` (agent), `tsh-review-ui` (command) and `tsh-ui-verifying` (workflow)
  - `tsh-code-reviewer`, `tsh-review` and `tsh-code-reviewing`
  - `tsh-plan-reviewer` and `tsh-plan`

  These are acceptable, but the generator must never emit a skill and a subagent with the **same** name into one target. Cursor exposes both under `/name` (see the decision doc).
- "Agent" is overloaded: today it means an agent *skill*. In the new model, reserve "agent" for native subagents and "orchestrator skill" for main-thread personas.

### X7. Repo-level inconsistencies found during the audit
- `CLAUDE.md` and `.cursor/rules/cursor-instructions.md` (the harness copy) refer to `scripts/sync-claude.sh`, `.claude/skills/`, `.claude/README.md` and `.mcp.json`. **None of these exist** in the working tree: `scripts/` only has `count-skills.sh`, and `.claude/` only has `settings.local.json`. The checked-in `cursor-instructions.md` does not mention them. This needs resolving as part of the refactor.
- `cursor-instructions.md` says the Cursor researcher/creator/reviewer are "delegate-only workers **in this folder**". That is correct, but the `internal/` category exists for the same purpose. The new model should give delegate-only workers exactly one home (native subagents).

### X8. Structural and template gaps
- The agents do not follow `workflows/tsh-creating-agents` (XML `<agent-role>`, frontmatter `tools`/`handoffs`). They use Markdown `## Agent Role` with blockquote metadata. Rewrite `tsh-creating-agents` for the neutral source format.
- Most user-facing agents open with the same "Before starting any task, you check all available skills…" boilerplate. It adds little value; skill discovery is native. Remove it or shorten it.
- The five BA worker files are about 50% blank lines (33-39 empty lines out of 66-79).

---

## Per-skill sections

### 1. tsh-architect
1. **Current:** `agents/`, frontmatter `name`, `description`. 168 lines.
2. **Proposed:** (a) subagent. It is an isolated planning persona with its own tool set, delegated to by EM and invoked directly by users. Model tier: deep.
3. **Coupling:** `:3` "Invoke with @tsh-architect"; `:8` GPT-5.4; `:9` Copilot tool ids; `:48` "*.mdc rules"; `:88` `grep_search`; `:99` "local Figma desktop app running in Dev Mode" (stale); `:167-168` handoffs "Invoke @tsh-engineering-manager with `/tsh-implement`" and "Invoke @tsh-devops-engineer".
4. **Content issues:** All 13 referenced skills exist. The `execute` tool is "read-only" by prose only (`:121-134`); a native tool restriction cannot express "read-only shell", so either keep it as prose or drop shell. The tool guidance blocks duplicate other agents (X5). The skill list duplicates devops' list (IaC skills). No length problem.
5. **Recommended:**
   - Move model and tools into neutral frontmatter.
   - Replace `grep_search`, `*.mdc` and the Figma "Dev Mode" wording.
   - Turn Handoffs into "Suggested next steps" that name the command (`/tsh-implement`), not an @-mention.
   - Factor the context7, pdf-reader and Atlassian blocks into shared snippets.
   - Remove the "check all available skills" boilerplate.

### 2. tsh-software-engineer
1. **Current:** `agents/`, `name`, `description`. 155 lines.
2. **Proposed:** (a) subagent. It is the core implementation worker delegated to by EM, `/tsh-debug` and `/tsh-refactor`.
3. **Coupling:** `:3` @-invoke; `:8` "Gemini 3.1 Pro (Preview)"; `:9` tool ids; `:77` `usages`; `:154` "Invoke @tsh-code-reviewer with `/tsh-review`"; `:155` hardcoded `.cursor/skills/internal/tsh-implement-e2e/SKILL.md`.
4. **Content issues:** All referenced skills exist. The Plan-progress block is duplicated (X5). `:21-23` "collaborate with QA engineers / communicate with the architect" is not possible for an isolated subagent; it should return blockers instead. `:17` refers to "Technical Context Discovery guidelines" informally; use the skill name `tsh-technical-context-discovering`. `:60` uses an em dash where the rest of the list uses a hyphen (cosmetic).
5. **Recommended:**
   - Neutral frontmatter.
   - Reference `tsh-implement-e2e` by name.
   - Extract the Plan-progress block.
   - Rephrase collaboration as "report back to the caller".
   - Replace `usages`.

### 3. tsh-engineering-manager
1. **Current:** `agents/`, `name`, `description`. 179 lines.
2. **Proposed:** (b) main-thread orchestrator skill. Merge it with `commands/tsh-implement`: that command already says "Load and follow the tsh-engineering-manager agent skill" (`tsh-implement/SKILL.md:9`). It cannot be a subagent because it delegates to 9 subagents (X1).
3. **Coupling:**
   - `:3` @-invoke; `:8` GPT-5.4; `:9` tool ids
   - `:27,:129` "**Task** tool"
   - `:27` example path `.cursor/skills/internal/tsh-plan/SKILL.md`
   - root-relative `.cursor/...` links at `:29,48,60,61,74-77,87,101,112,130,131,144`
   - `:61` "Use GPT-5.4 mini for this use case" (model name in the body)
   - `:112` "invoke the agent skill `.cursor/skills/agents/tsh-plan-reviewer/SKILL.md`" (path-based invocation)
   - `:171-179` `@tsh-*` list
4. **Content issues:**
   - All link targets exist, but they are broken as relative links.
   - **Missing delegation block for `tsh-code-reviewer`**: it is listed at `:176` and used at `:29/:38`, but it has no MUST/SHOULD section under "Agents Delegation Guidelines" (`:40-147`). Every other delegate has one.
   - The UI-verification enforcement (`:31-38`, `:122-135`) duplicates `internal/tsh-implement-ui`. That is workflow knowledge embedded in a persona.
   - The phase-routing logic (research → plan → review → implement) overlaps with the `/tsh-implement` workflow steps, so there are two sources of truth.
5. **Recommended:**
   - Make it the body, or the loaded workflow, of `/tsh-implement`.
   - Delegate to native subagents by name.
   - Replace every path link with a skill name.
   - Express model choice as a tier on the subagent, not in prose.
   - Add the missing code-reviewer block.
   - Move the UI-gate rules into `tsh-implement-ui` and keep a single pointer.
   - Deduplicate against `tsh-implement`.

### 4. tsh-code-reviewer
1. **Current:** `agents/`, `name`, `description`. 115 lines.
2. **Proposed:** (a) subagent with an independent-review context and no code edits. It still needs shell for tests; write access only for a review report if the command requires one.
3. **Coupling:** `:3` @-invoke; `:8` Claude Sonnet 4.6; `:9` tool ids (includes `edit`, `agent`); `:30` "cursor-instructions.md or any other *.mdc rules"; `:77` Figma "Dev Mode"; `:115` "Invoke @tsh-software-engineer with `/tsh-implement …`".
4. **Content issues:** All skills exist. **The handoff is wrong:** `/tsh-implement` routes to `tsh-engineering-manager` (`commands/tsh-implement/SKILL.md:3,9`), not to SE. The `agent` tool is listed with no delegation defined, and `edit` is questionable for a reviewer. `:41` embeds a detection heuristic for LLM code (search for `openai`, `anthropic`…); that is domain knowledge that belongs in `tsh-engineering-prompts` or `tsh-code-reviewing`.
5. **Recommended:**
   - Neutral frontmatter.
   - Tool policy: read + shell + optional report write, no delegate.
   - Fix the handoff to "fix via `/tsh-implement`" (EM) or "return findings to the caller".
   - Move the LLM detection heuristic into the workflow.
   - Neutral rules wording.

### 5. tsh-context-engineer
1. **Current:** `agents/`, `name`, `description`. 118 lines.
2. **Proposed:** (a) subagent. It is the research worker EM delegates to, with read + write for the research file, the MCPs Atlassian, Figma and pdf-reader, and no shell.
3. **Coupling:** `:3` @-invoke; `:8` GPT-5.4; `:9` tool ids; `:35` hardcoded `.cursor/skills/internal/tsh-research/SKILL.md` and "when delegated by the Engineering Manager"; `:64` Figma "Dev Mode"; `:118` "Invoke @tsh-engineering-manager with `/tsh-implement`".
4. **Content issues:**
   - `:25` is copy-pasted from the architect ("could influence the architectural decisions"). It contradicts `:27-29` ("don't provide technical specifications").
   - `:108` says "one question at a time", while architect, SE and others say "batch questions". The question policy is inconsistent across agents.
   - `:35` lists the internal step `tsh-research` as a "skill" alongside workflows, mixing layers.
5. **Recommended:**
   - Neutral frontmatter.
   - Reference `tsh-research` by name.
   - Delete `:25` or reword it to scope it to requirements.
   - Pick one question policy repo-wide, or state explicitly why this agent differs.

### 6. tsh-devops-engineer
1. **Current:** `agents/`, `name`, `description`. 235 lines.
2. **Proposed:** (a) subagent, but it must stop spawning `tsh-architect` (X1). It is invoked by EM and by the cost/audit commands.
3. **Coupling:**
   - `:3` @-invoke; `:8` Claude Sonnet 4.6
   - `:9` tool ids plus 5 cloud MCP servers (`awslabs.*`, `gcp-*`); a good candidate for per-subagent MCP scoping
   - `:37,:49,:60` "`agent` tool with `agentId: \"tsh-architect\"`" (Copilot syntax)
   - `:106` "*.mdc rules"
   - `:235` "Invoke @tsh-code-reviewer with `/tsh-review`"
4. **Content issues:**
   - **Contradiction:** `:36` "Work non-interactively … Do not ask clarifying questions". But `:123-126` requires asking the user in greenfield projects, and `:220-229` defines "MUST ask" cases.
   - The mandatory architect spawn (`:47-79,:128,:138-148`) will not work as a subagent.
   - A lot of embedded domain knowledge belongs in workflows: Context Discovery file lists (`:102-132`), Output Strategy with 3 options (`:136-150`), the FinOps threshold rule (`:96-98`) and the Mandatory Skill Loading table (`:166-179`). Candidates are `tsh-technical-context-discovering`, `tsh-optimizing-cloud-cost`, `tsh-designing-multi-cloud-architecture` or a new `tsh-devops-delivering`.
   - There is no guidance for the 5 cloud MCP servers it lists.
   - The Plan-progress block is duplicated (X5).
5. **Recommended:**
   - Replace spawning with "if an architectural decision is needed, stop and return `NEEDS_ARCHITECT_DECISION` with context". Let the orchestrator (EM or the command) call the architect.
   - Resolve the interactivity contradiction.
   - Move the discovery, output-strategy and skill-loading tables into workflows; target under 120 lines.
   - Scope the cloud MCPs to this subagent in the generated config.

### 7. tsh-e2e-engineer
1. **Current:** `agents/`, `name`, `description`. 150 lines.
2. **Proposed:** (a) subagent. It is an isolated test worker with Playwright MCP, delegated to by EM.
3. **Coupling:** `:3` @-invoke; `:8` GPT-5.4 mini; `:9` tool ids (`atlassian/search`); `:89` `usages`; `:97` Figma "Dev Mode"; `:150` "Invoke @tsh-software-engineer with `/tsh-implement`".
4. **Content issues:**
   - **Contradiction:** `:15` "You are non-interactive" versus `:117-128` "MUST ask the user when…".
   - The `:150` handoff has the same `/tsh-implement` routing mismatch as the code reviewer.
   - `:49-73` "E2E Testing Standards" duplicates `workflows/tsh-e2e-testing`.
   - `atlassian/search` is listed but has no usage guidance.
   - `:45` loads `tsh-task-analysing` "at the start of every task". That is heavy for a worker that already receives the plan.
5. **Recommended:**
   - Neutral frontmatter.
   - Remove the standards section (keep it in the workflow).
   - Resolve the interactivity policy.
   - Fix the handoff.
   - Drop `atlassian/search` or document its use.

### 8. tsh-ui-reviewer
1. **Current:** `agents/`, `name`, `description`. 90 lines.
2. **Proposed:** (a) subagent, read-only (Figma + Playwright MCPs and read, no edit). It is the textbook independent-verification subagent.
3. **Coupling:** `:3` @-invoke; `:8` "Gemini 3.1 Pro (Preview)"; `:9` tool ids include `edit`, `execute` and `agent`; `:90` "Invoke @tsh-code-reviewer with `/tsh-review`".
4. **Content issues:**
   - **Contradiction:** `:13` says it is "called … as a subagent by `tsh-software-engineer`". Per `internal/tsh-implement-ui-common-task/SKILL.md:66` and EM:122-135, the manager orchestrates UI review and SE does not.
   - `:15` "You do not fix code" / "read-only" conflicts with the `edit` tool in `:9`.
   - The `:90` handoff to the code reviewer bypasses the EM gate (EM:38).
   - `:29` "do not block the workflow — return a partial report" is in tension with `:21-27` "stop and ask the user". Ask versus return partial should be one rule; in subagent mode, return to the caller.
5. **Recommended:**
   - Enforce read-only natively.
   - Fix the caller description.
   - Remove the handoff, or make it a "suggested next step" for standalone `/tsh-review-ui` use only.
   - Define one blocker policy.

### 9. tsh-prompt-engineer
1. **Current:** `agents/`, `name`, `description`. 100 lines.
2. **Proposed:** (a) subagent. EM delegates prompt work to it via `tsh-engineer-prompt`.
3. **Coupling:** `:3` @-invoke; `:8` GPT-5.4; `:9` tool ids; `:25` "Cursor customization files … belong to `tsh-cursor-engineer`".
4. **Content issues:** All skills exist. There is no Handoffs section, unlike its peers (acceptable). `:27-41` persona prose overlaps cursor-engineer (X5). The boundary statement needs updating after the rename.
5. **Recommended:**
   - Neutral frontmatter.
   - Update `:25` to "AI-tool customization artifacts belong to `tsh-ai-customization-engineer`".
   - Trim the persona prose.
   - Rename the internal `tsh-engineer-prompt` (X6).

### 10. tsh-plan-reviewer
1. **Current:** `agents/`, `name`, `description`, `disable-model-invocation: true`. 243 lines.
2. **Proposed:** (a) subagent. It is a real isolated adversarial reviewer with a fresh context, read + write for the report file only, no shell, and no delegation. Most of its body is process (`:44-243`), so extract it into a knowledge skill `tsh-plan-reviewing` (c) that the subagent loads.
3. **Coupling:** `:3` "delegated by tsh-engineering-manager via Task tool"; `:4` `disable-model-invocation`; `:9` GPT-5.4; `:10` tool ids; `:63` "*.mdc rules".
4. **Content issues:**
   - **Contradiction:** `:195` "You ALWAYS send the review report to `tsh-architect` when REVISIONS NEEDED". It has no delegation tool, and EM:115 owns the review/revise loop.
   - The body is 243 lines, under 500 but heavy for a persona. Challenge domains, severity table, workflow and output format are workflow content.
   - There is no path convention for `{task-name}` or `specifications/` beyond prose.
5. **Recommended:**
   - Create the `tsh-plan-reviewing` workflow (the challenge domains, severity, 10-step workflow and output template move there).
   - Reduce the subagent to about 60 lines.
   - Replace `:195` with "return the verdict and report path to the caller".
   - Drop `disable-model-invocation`.

### 11. tsh-business-analyst
1. **Current:** `agents/`, `name`, `description`. 298 lines, the largest file.
2. **Proposed:** (b) main-thread orchestrator skill. It is invoked by `/tsh-analyze-materials` and `/tsh-explore-materials` (consider merging it with them). It delegates to 5 workers and owns user gates and Jira writes, so it cannot be a subagent.
3. **Coupling:**
   - `:3` @-invoke
   - `:8` GPT-5.4; `:9` tool ids
   - `:13,121,146,169` "Task tool"
   - `:15-19` `@tsh-ba-*`
   - `:23` "delegate to `@tsh-engineering-manager` with `/tsh-implement`" (orchestrator to orchestrator)
   - `:42-46` per-worker vendor model names
   - `:127` tool-environment claim that Office files "cannot be read directly by any available tool". This depends on the environment; Claude Code and Codex, and the pdf-reader MCP variants, may read them.
   - `:240` Figma "Dev Mode"
4. **Content issues:**
   - The description says "Gate 0–2" but omits Gate 1.5 (`:64`), and it has no "Use when …" trigger.
   - The Protected Status Policy (`:73-90`) is declared the single source of truth, but it is duplicated in two workflows (X5). The workers also cannot see this file, which is why `:174` needs the "include policy in each worker prompt" workaround. Move the policy into a small shared knowledge skill that workers and workflows load.
   - The Parallel Processing Strategy (`:101-194`, about 95 lines) is orchestration workflow knowledge embedded in the persona. Move it into a workflow (for example `tsh-ba-orchestrating`).
   - Case B (`:123-134`) spawns "worker agents" per document but **does not say which worker**. Presumably `tsh-ba-analysis-worker`; make that explicit.
   - Structural bug: `## Constraints` (`:224-230`) is inserted in the middle of "Tool Usage Guidelines", between the Atlassian and Figma blocks, with stray indentation.
   - X4 applies here: this orchestrator's workers follow workflows that tell them to write, ask and call Jira.
5. **Recommended:**
   - Split into (1) a thin orchestrator skill of about 100 lines, (2) a `tsh-ba-orchestrating` workflow (parallelization, merge, routing), and (3) a `tsh-protected-status-policy` knowledge snippet.
   - Name the worker for Case B.
   - Fix the description.
   - Move Constraints.
   - Replace model names with tiers.
   - Make the EM handoff a user-facing suggestion.

### 12. tsh-ba-transcript-worker
1. **Current:** `agents/`, `name`, `description`, `disable-model-invocation: true`. 69 lines (36 blank).
2. **Proposed:** (a) subagent. The rationale is model specialization (fast tier) plus a hard tool restriction (read + pdf-reader, no write). These are real subagents.
3. **Coupling:** `:3` "via Task tool"; `:4` `disable-model-invocation`; `:9` GPT-5.4 mini; `:10` tool ids.
4. **Content issues:** Its governing workflow `tsh-transcript-processing` asks the user (`:41`) and saves a file (`:108`), which contradicts `:58-59` (X4). There are many blank lines.
5. **Recommended:**
   - Enforce no-write natively.
   - Add delegated mode to the workflow.
   - Compact the file.
   - Consider generating all 5 BA workers from one template with only role, skill, tier and tools varying.

### 13. tsh-ba-analysis-worker
1. **Current:** as above. 79 lines (39 blank).
2. **Proposed:** (a) subagent (deep/long-context tier; Figma + pdf-reader MCPs, read-only).
3. **Coupling:** `:3` Task tool; `:4`; `:9` "Gemini 3.1 Pro (Preview)"; `:10` tool ids.
4. **Content issues:** The skills exist. `tsh-task-analysing` is written for interactive use (Atlassian sources, `:37-38`), which is in tension with "never call Jira" (`:71`). This is the implicit target of BA Case B but is not named there.
5. **Recommended:** Same as #12. State explicitly that it handles per-document analysis for BA Case B.

### 14. tsh-ba-extraction-worker
1. **Current:** as above. 69 lines.
2. **Proposed:** (a) subagent (balanced tier, read-only).
3. **Coupling:** `:3`, `:4`, `:9` Claude Sonnet 4.6, `:10`.
4. **Content issues:** `tsh-task-extracting:136` asks the user and `:152` saves files, which contradicts `:58-59` (X4). BA:143-148 says the orchestrator runs the skill's first phases itself and the worker runs only per-epic story extraction. The worker text does not reflect that split.
5. **Recommended:** Same as #12. Document the "per-epic slice" input contract.

### 15. tsh-ba-quality-worker
1. **Current:** as above. 66 lines.
2. **Proposed:** (a) subagent (deep tier, read-only).
3. **Coupling:** `:3`, `:4`, `:9` GPT-5.4, `:10`.
4. **Content issues:** `tsh-task-quality-reviewing:73-76` calls Atlassian and asks the user, and `:320` saves a file (X4). The workflow is 345 lines; check it in the workflows audit.
5. **Recommended:** Same as #12.

### 16. tsh-ba-formatting-worker
1. **Current:** as above. 66 lines.
2. **Proposed:** (a) subagent (fast tier, read-only).
3. **Coupling:** `:3`, `:4`, `:9` GPT-5.4 mini, `:10`.
4. **Content issues:** `tsh-jira-task-formatting` owns the user gates (`:100,106`), the save (`:116`) and the Jira push (`:136`), all forbidden for this worker (X4). That workflow mixes orchestrator-owned and worker-owned steps more than any other.
5. **Recommended:** Same as #12. Split `tsh-jira-task-formatting` into formatting/verification (worker) and push/import (orchestrator).

### 17. tsh-cursor-orchestrator
1. **Current:** `agents/`, `name`, `description`. 114 lines.
2. **Proposed:** (b) main-thread orchestrator skill, renamed to `tsh-ai-customization-orchestrator`. It is invoked by `/tsh-create-custom-*`. It cannot be a subagent because it delegates (X1).
3. **Coupling:**
   - `:3` "Cursor engineering tasks" / @-invoke; `:6,13` "Cursor orchestrator"; `:8` GPT-5.4; `:9` tool ids
   - `:15` "**Task** tool" + `@tsh-cursor-*`
   - `:42` "Cursor API"; `:54` "the Cursor Task tool"
   - `:55,60,85` hardcoded `.cursor/skills/...` layout
   - `:92` Cursor UI ("collapsed tool calls")
4. **Content issues:**
   - `:28` "coexists for A/B comparison" is a stale experiment note with no end criterion.
   - `:74-87` domain-knowledge block duplicates cursor-engineer and the `tsh-creating-*` workflows. `:85` "Workspace structure" becomes wrong after this refactor.
   - Its separation-of-concerns model (Agent = WHO+HOW, `:77`) differs from the repo constitution (agents load workflows).
5. **Recommended:**
   - Rename.
   - Make the workspace structure a reference to the neutral source layout, maintained in one knowledge skill (for example `tsh-ai-customization-architecture`).
   - Remove the domain block.
   - Decide the A/B outcome and remove `:28`.
   - Neutral delegation wording.

### 18. tsh-cursor-engineer
1. **Current:** `agents/`, `name`, `description`. 141 lines.
2. **Proposed:** (a) subagent, renamed to `tsh-ai-customization-engineer`. It is the monolithic "research + edit in one pass" worker. If the orchestrator A/B test is concluded in the orchestrator's favour, (d) delete it and let the orchestrator's creator handle fixes.
3. **Coupling:** Cursor branding throughout (`:3,6,13,15,19,30,48,71-81,140`); `:9` `web/fetch`, `agent`; `:52,62,135` `.mdc` and `cursor-instructions.md`; `:72` `.cursor/agents/`; `:63` `tsh-migrating-copilot-to-cursor`.
4. **Content issues:**
   - **Contradiction:** `:50` defines Agent Skill = "WHO + HOW — … domain knowledge, step-by-step processes, templates", but `:134` says "Do NOT embed workflow-specific steps in agent files". The repo constitution says agents load workflows.
   - `:135` "Do NOT embed coding standards … in agents, skills, or prompts" uses Copilot "prompts" vocabulary.
   - The skills list (`:60-65`) is missing `tsh-creating-agents`, even though agent creation is core to the role (the creator lists it at `:32`).
   - The `agent` tool is listed but no delegation is defined.
   - `:26-46` has 20 lines of generic persona prose.
5. **Recommended:**
   - Rename and make it tool-neutral (Cursor, Claude Code, Codex).
   - Fix the SoC model to match the constitution.
   - Add `tsh-creating-agents`.
   - Replace the Copilot migration skill with a generalized one.
   - Cut the persona prose by about 50%.
   - Remove the `agent` tool.

### 19. tsh-cursor-researcher
1. **Current:** `agents/`, `name`, `description`, `disable-model-invocation: true`. 52 lines.
2. **Proposed:** (a) subagent, read-only (read/search/web/context7), renamed `tsh-ai-customization-researcher`. Claude Code's built-in Explore agent overlaps, but keep this one for cross-tool parity and output contract.
3. **Coupling:** `:3` "Cursor engineering tasks" / "delegated to by tsh-cursor-orchestrator"; `:4`; `:9` Claude Sonnet 4.6; `:10,47` `web/fetch`; `:18,47` "Cursor docs"; `:17` "agent skill/prompt/instruction files" (Copilot vocabulary).
4. **Content issues:** It is clean and well-scoped. The output contract (`:28-41`) is good.
5. **Recommended:** Rename. Make docs sources tool-neutral (Cursor, Claude Code, Codex, Agent Skills spec). Use native read-only tools.

### 20. tsh-cursor-artifact-creator
1. **Current:** `agents/`, `name`, `description`, `disable-model-invocation: true`. 57 lines.
2. **Proposed:** (a) subagent (read/search/write, fast tier), renamed `tsh-ai-customization-creator`.
3. **Coupling:** `:3,7,14,17` "Cursor customization artifacts"; `:9` GPT-5.4 mini; `:10` tool ids; `:19,53` hardcoded `.cursor/skills/agents/` and `.cursor/skills/workflows/`; `:35` `.mdc`, `cursor-instructions.md`; `:54` `create_file` (Copilot tool).
4. **Content issues:** All 4 skills exist. Its conventions check is defined against the `.cursor/skills/*` layout, which ceases to be the source after the refactor, so it would validate the generated output instead of the neutral source. That is a correctness risk.
5. **Recommended:**
   - Rename.
   - Point it at the neutral source directory.
   - Add "run the generator/check after editing" (the successor of `sync-claude.sh --check`).
   - Drop `create_file`.

### 21. tsh-cursor-artifact-reviewer
1. **Current:** `agents/`, `name`, `description`, `disable-model-invocation: true`. 66 lines.
2. **Proposed:** (a) subagent, read-only, renamed `tsh-ai-customization-reviewer`.
3. **Coupling:** `:3,7,14,17` Cursor; `:9` "Gemini 3.1 Pro (Preview)"; `:18,62-64` hardcoded `.cursor/skills/{agents,workflows,commands}/`; `:19` "prompts embed coding standards … (prompt territory)" (Copilot `.prompt.md` vocabulary).
4. **Content issues:**
   - The review dimension "Tool Configuration Appropriateness" (`:40`) checks tool names against the current Copilot-style ids. It must be redefined for neutral capabilities plus per-target validity.
   - The SoC dimension (`:38`) matches the constitution but contradicts cursor-engineer `:50`.
5. **Recommended:**
   - Rename.
   - Retarget it to the neutral source layout.
   - Add a "portability" dimension: no tool-specific syntax in the neutral source, and name references resolve.
   - Replace the "prompt" terminology with "command".

---

## Recommended decisions for the architect (condensed)
1. **Three orchestrators become main-thread user-invocable skills:** EM (merged with `/tsh-implement`), BA (merged with or loaded by `/tsh-analyze-materials` and `/tsh-explore-materials`) and the AI-customization orchestrator. **18 agents become native subagents.** No persona is emitted as both a skill and a subagent with the same name.
2. **Neutral frontmatter** replaces the `Recommended model/tools` blockquotes: `model-tier`, a capability list, `readonly`, MCP scoping and `invocation: user|delegate|both`. Generators map these per tool. Remove every vendor model name from bodies.
3. **References by skill/agent name only.** No `.cursor/...` paths and no `@`/Task/`agentId` syntax in the source.
4. **New or extracted knowledge skills:**
   - `tsh-plan-reviewing` (from plan-reviewer)
   - `tsh-ba-orchestrating` plus the protected-status policy (from BA)
   - the plan-progress block (from SE, devops and e2e)
   - a devops delivery/discovery workflow (from devops)
   - shared MCP-usage guidance (context7, pdf-reader, Atlassian, Figma)
5. **Fix contradictions before generation:**
   - BA workers vs. workflows (X4)
   - devops and e2e interactivity
   - plan-reviewer `:195`
   - ui-reviewer caller and edit tool
   - code-reviewer and e2e `/tsh-implement` handoff target
   - cursor-engineer SoC model
   - the missing EM code-reviewer block
6. **Rename** `tsh-cursor-*` to `tsh-ai-customization-*`, `tsh-engineer-prompt` to `tsh-implement-prompt`, and generalize `tsh-migrating-copilot-to-cursor`.
7. **Reconcile `CLAUDE.md`** with reality: `scripts/sync-claude.sh`, `.claude/skills/` and `.mcp.json` do not exist.
