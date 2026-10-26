---
name: tsh-migrating-copilot-customizations
description: Converts GitHub Copilot customization artifacts (agents, skills, prompts, instructions) into the neutral source in `src/` when the repository has one, or into native Cursor, Claude Code and Codex files otherwise. Maps file types, frontmatter fields, paths and terminology, and keeps model, tools and handoffs as structured fields. Use when porting a PR or branch from a Copilot-based repository, adding a Copilot-originated agent, skill or prompt, or verifying a converted artifact.
metadata:
  short-description: Convert Copilot customizations to the neutral source or native files
user-invocable: false
---
<!-- Generated from src/skills/tsh-migrating-copilot-customizations/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Migrating Copilot Customizations

Converts GitHub Copilot customization artifacts by applying a deterministic mapping of file types, frontmatter fields, path references and terminology. The target is the neutral source (`src/`) when the repository has `src/skills/`, `src/agents/` and a generator, and native files for the chosen tools otherwise.

## Choose the Target

- **Neutral source present:** write only to `src/`. Then run `npm run generate && npm run check` and fix every finding. Never edit the generated native files by hand and never add baseline entries.
- **No neutral source:** write native files for each tool the project uses (Cursor, Claude Code, Codex). The `tsh-creating-skills`, `tsh-creating-agents`, `tsh-creating-commands` and `tsh-creating-rules` skills give the exact fields and paths.

## Artifact Type Mapping

| Copilot source | `src/` target | Native Cursor | Native Claude Code | Native Codex |
|---|---|---|---|---|
| `.github/agents/*.agent.md` (leaf role) | `src/agents/<name>.md`, `type: agent` | `.cursor/agents/<name>.md` | `.claude/agents/<name>.md` | `.codex/agents/<name>.toml` |
| `.github/agents/*.agent.md` that delegates to other agents (has `agents:`) | `src/skills/<name>/SKILL.md`, `type: orchestrator` | `.agents/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` with `user-invocable: false` | `.agents/skills/<name>/SKILL.md` |
| `.github/skills/*.skill.md` | `src/skills/<name>/SKILL.md`, `type: skill` | `.agents/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` |
| `.github/prompts/*.prompt.md` | `src/skills/<name>/SKILL.md`, `type: command` with `routes-to` | skill with `disable-model-invocation: true` | same, plus `argument-hint` | skill plus `agents/openai.yaml` with `policy.allow_implicit_invocation: false` |
| `.github/internal-prompts/*.prompt.md` | `src/skills/<name>/SKILL.md`, `type: internal` | plain skill | skill with `user-invocable: false` | plain skill |
| `.github/copilot-instructions.md` | `AGENTS.md` (hand-written, not generated) | `AGENTS.md` | `CLAUDE.md` containing `@AGENTS.md` | `AGENTS.md` |
| `.github/instructions/*.instructions.md` | scoped rule (hand-written) or a section of `AGENTS.md` | `.cursor/rules/<topic>.mdc` (`description`, `globs`, `alwaysApply`) | `.claude/rules/<topic>.md` (`paths`) | nested `AGENTS.md` |

Agents never delegate (one delegation level). A Copilot agent that hands work to other agents becomes an orchestrator skill that the commands load by name; the agents it coordinated stay agents.

## Frontmatter Conversion

Preserve each structured field as a structured field. Do not turn it into prose.

| Copilot field | Neutral field | Action |
|---|---|---|
| `name` | `name` | Keep; must equal the folder or file name and start with `tsh-` |
| `description` | `description` | Keep; make it third person with "Use when ..." |
| `model: "GPT-5.4"` or `"Gemini 3.1 Pro (Preview)"` | `model-tier: deep` | `GPT-5.4 mini` maps to `fast`, `Claude Sonnet 4.6` to `balanced`; omit when unknown |
| `tools: [...]` | `access`, `shell`, `requires-mcp` | `access: read-only` if the list has no edit tools, else `read-write`; `shell: false` if it has no execute tool; each `<server>/*` entry becomes a `requires-mcp` server (it must exist in `src/mcp/servers.json`); drop the rest |
| `handoffs:` list | `## Suggested next steps` section | Text naming the follow-up **commands**, never automatic invocations |
| `agents:` list | orchestrator body | The listed agents become its delegates; a leaf agent drops the field |
| `agent:` (prompt field) | `routes-to` | The agent or orchestrator the command routes to |
| `argument-hint` (prompt) | `argument-hint` | Keep |
| `user-invocable: false` | `type: internal` | For prompts and skills; the generator renders the hiding per tool |

Without a neutral source, map the same fields to each tool's native frontmatter (see the creating skills). Do not carry model names, tool-id blockquotes (`> Recommended model:`, `> Recommended tools:`) or tool lists into the body.

### Tool handling

- `vscode/runCommand`, `vscode/openFile`: remove; they have no equivalent.
- `vscode/askQuestions`: remove from the tool list and write "ask the user" in the body. Agents inherit the `NEEDS_INPUT` contract from the operating-modes partial (in delegated mode the question goes into `QUESTIONS` and the agent returns `NEEDS_INPUT`); orchestrators ask the user directly.
- Delegation tools (`agent`, `runSubagent`): remove; delegation is written as "delegate to the `tsh-<name>` subagent" in an orchestrator or command.

## Path and Terminology Replacements

Apply throughout each body. Reference other skills and agents by name, never by path.

| From | To |
|---|---|
| `.github/agents/`, `.github/skills/`, `.github/prompts/`, `.github/internal-prompts/` (as links or paths) | "the `tsh-<name>` subagent" or "the `tsh-<name>` skill" |
| `.github/instructions/`, `*.instructions.md` | "project instructions (`AGENTS.md`, `CLAUDE.md`, scoped rules)" |
| `copilot-instructions.md` | `AGENTS.md` |
| `tsh-copilot-*` names | a tool-neutral `tsh-` name that follows the naming rules of the artifact type |
| `GitHub Copilot`, `Copilot` (as the tool) | neutral wording ("the assistant"), or the specific tool when the sentence is about one |
| Copilot tool names and chat syntax (`@agent`, `#file`) | generic verbs ("search the codebase", "read the file") and "the `tsh-<name>` subagent" |

Do NOT replace `Copilot` inside code examples, historical references or comparisons such as "migrating from Copilot".

## Decision Rules

- **Type of a prompt:** a prompt with an `agent:` field becomes a `command` routed to that agent. A prompt without one that is only loaded by other prompts becomes `internal`. A prompt that holds reusable domain knowledge becomes a `skill`, and the command stays thin.
- **Naming:** commands and internal steps `tsh-<verb>[-<object>]`; knowledge skills `tsh-<gerund>-<object>`; agents and orchestrators `tsh-<role>`. Use American spelling.
- **Visibility:** never set invocation flags by hand in a neutral source. The `type` decides them.
- **Model:** the tier belongs to the agent. A prompt's `model:` is dropped.

## Conversion Process

```
Conversion progress:
- [ ] Step 1: Choose the target (neutral source or native files) and the artifact type
- [ ] Step 2: Create the file at the mapped location with a valid name
- [ ] Step 3: Convert the frontmatter fields using the table above
- [ ] Step 4: Apply path and terminology replacements in the body
- [ ] Step 5: Replace tool handling (ask, delegation) as described
- [ ] Step 6: Convert handoffs to "Suggested next steps" and agents to delegates
- [ ] Step 7: Check that no `.github/` paths or Copilot tool syntax remain
- [ ] Step 8: Run the generator and checks, or validate against the creating skills
- [ ] Step 9: Update cross-references in other artifacts
```

## Porting a PR (not a fresh conversion)

Use this when the Copilot-based repository changed after an earlier conversion and you bring those changes over, instead of converting an artifact from scratch.

1. List the changed artifacts of the source range and map each one to its target in `src/` with the tables above. Skip changes that only touch wording the neutral source already replaced.
2. Apply the semantic change onto the neutral source (`src/skills/`, `src/agents/`, `src/partials/`). Do not copy the file from the other repository, and do not merge it with git.
3. A model recommendation in a prompt or agent is not carried as text. Fold it into the agent's `model-tier` (or drop it for a command).
4. Run `npm run generate`, then `npm run check`, and fix every finding without baseline entries.

## Divergence from upstream

The neutral source deliberately differs from a Copilot-based repository, and a port keeps these differences:

- Agents never delegate. Where the upstream agent called another agent, the orchestrator performs that delegation.
- Skills are referenced by name only, never by path or by an installed skill location.
- Wording is tool-neutral: no tool names, tool syntax or model names in `src/`.
- Models are expressed as `model-tier`, and permissions as `access`, `shell` and `requires-mcp`.
- A change that only exists for the other layout (paths, category folders, resolver skills) has no counterpart and is skipped.

## Post-Conversion Checks

1. **Names resolve:** every skill, agent and command named in the converted body exists; `routes-to` resolves.
2. **Cross-references:** search the project for the old names and update them, by name and not by path.
3. **Delegation:** an agent that used to delegate is now an orchestrator; check whether the orchestrators or commands that call it need updating.
4. **Documentation:** if `website/docs/` exists, create or update the corresponding page in the same style as the existing ones.
5. **Validation:** with a neutral source `npm run check` passes with no new baseline entries; otherwise walk through the checklist of the matching creating skill.

## Connected Skills

- `tsh-creating-agents` - when the converted artifact is an agent or orchestrator, for the schema and per-tool mapping
- `tsh-creating-skills` - when the converted artifact is a skill, for the schema, naming and layout
- `tsh-creating-commands` - when the converted artifact is a slash command
- `tsh-creating-rules` - when converting instruction files to `AGENTS.md` or scoped rules
- `tsh-analyzing-codebase` - to understand the existing structure before placing new files
