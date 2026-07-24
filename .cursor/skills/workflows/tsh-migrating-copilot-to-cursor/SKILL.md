---
name: tsh-migrating-copilot-to-cursor
description: "Convert GitHub Copilot customization artifacts (agents, skills, prompts, instructions) to their Cursor AI IDE equivalents (SKILL.md files, .mdc rules). Use when porting a PR or branch from a Copilot-based repo to this Cursor setup, adding a new Copilot-originated agent or skill, or verifying that a converted artifact follows the correct Cursor structure."
---

# Migrating Copilot to Cursor

Converts GitHub Copilot customization artifacts to Cursor equivalents by applying a deterministic mapping of file types, frontmatter fields, path references, and terminology.

## Artifact Type Mapping

| Copilot source | Cursor target | Notes |
|---|---|---|
| `.github/agents/*.agent.md` | `.cursor/skills/agents/<name>/SKILL.md` | No `disable-model-invocation` — agents are invoked via `@name` |
| `.github/skills/*.skill.md` | `.cursor/skills/workflows/<name>/SKILL.md` | Workflow knowledge, loaded by agents on demand |
| `.github/prompts/*.prompt.md` | `.cursor/skills/commands/<name>/SKILL.md` | Add `disable-model-invocation: true` — these are slash commands |
| `.github/internal-prompts/*.prompt.md` | `.cursor/skills/internal/<name>/SKILL.md` | Add `disable-model-invocation: true` |
| `.github/instructions/*.instructions.md` | `.cursor/rules/*.mdc` | Use `alwaysApply: false` + `globs` for scoped rules |

## Frontmatter Conversion

| Copilot frontmatter | Cursor equivalent | Action |
|---|---|---|
| `model: "GPT-5.4"` | *(drop)* | Cursor doesn't bind models in frontmatter or read a model line — the model is chosen in the Cursor UI/session. Do not carry it into the body. |
| `tools: [tool1, tool2]` | *(drop)* | Cursor doesn't bind tools per artifact — do not carry a tools line into the body. See tool stripping rules for how removed tools affect body prose. |
| `user-invocable: false` | `disable-model-invocation: true` | Direct frontmatter replacement |
| `agent: "tsh-x"` (in `.prompt.md`) | *(drop from frontmatter)* | The command/internal skill routes to the agent from the body instead, e.g. "Load and follow the `tsh-x` agent skill." |
| `handoffs:` list | `## Handoffs` section in body | Convert list items to Markdown bullet prose |
| `agents:` list | `## Delegation` section in body | Convert list items to Markdown bullet prose |
| `description:` | Keep as-is | Already compatible |
| `name:` | **Add** `name: <dir-name>` | Copilot `.agent.md` / `.prompt.md` files have no `name:` (it derives from filename). The Cursor SKILL.md REQUIRES a `name:` field equal to the target directory name — add it. |

Also strip any `<!-- TSH_COPILOT_COLLECTIONS:... -->` marker comments from prompt bodies — the Cursor artifacts don't use them.

### Tool stripping rules

Remove these tools entirely (Cursor doesn't have them):
- `vscode/runCommand`
- `vscode/openFile`

Replace these tools with plain prose in the skill body:
- `vscode/askQuestions` → "ask questions to the user" (wherever it appears in instructions)

## Path and Terminology Replacements

Apply these replacements throughout the skill body:

| From | To |
|---|---|
| `.github/agents/` | `.cursor/skills/agents/` |
| `.github/skills/` | `.cursor/skills/workflows/` |
| `.github/prompts/` | `.cursor/skills/commands/` |
| `.github/internal-prompts/` | `.cursor/skills/internal/` |
| `.github/instructions/` | `.cursor/rules/` |
| `*.instructions.md` | `*.mdc rules` |
| `copilot-instructions.md` | `cursor-instructions.md` |
| `tsh-copilot-*` (agent/skill names) | `tsh-cursor-*` |
| `Copilot` (when referring to the IDE or customization context) | `Cursor` |
| `GitHub Copilot` | `Cursor AI IDE` |

Do NOT replace `Copilot` when it appears inside a code example, a historical reference, or a comparison context (e.g., "migrating from Copilot").

## Decision Rules

**When to add `disable-model-invocation: true`:**
- Always for commands (`.github/prompts/`) and internal prompts (`.github/internal-prompts/`)
- Never for agents (`.github/agents/`) or workflow skills (`.github/skills/`)

**Model and tools frontmatter:**
- Drop the Copilot `model:` and `tools:` frontmatter entirely — Cursor does not read them, and they should not be carried into the body as `> Recommended model:` / `> Recommended tools:` lines. The model is selected in the Cursor UI/session; tool access is governed at the session level.
- Removed tools (`vscode/runCommand`, `vscode/openFile`) and replaced tools (`vscode/askQuestions`) still affect the body prose — see the tool stripping rules above.

## Porting a PR of Changes (not a fresh conversion)

Most migrations port an upstream **PR that modifies artifacts already present in Cursor**, not brand-new files. Apply the PR's *semantic change* through the mapping — do not re-convert the whole file or blindly paste upstream text.

- **Fetch the diff, don't guess:** `gh pr diff <n> --repo <upstream>`. Read the whole diff before touching anything.
- **Apply deltas onto the current Cursor file.** The Cursor file has usually diverged from upstream (earlier ports, XML restructuring, `.cursor/...SKILL.md` link forms instead of `.prompt.md`). When the diff's "before" context no longer matches, adapt the change to the current text and preserve prior edits — never revert them.
- **Port PRs in merge order.** Later PRs build on earlier ones (e.g. a skill created in one PR is modified by the next). Do one commit per PR, in the order they merged, so dependencies resolve.
- **Match the target file's existing structure.** If the Cursor agent already uses XML-tag sections (`<agent-role>`, `<tool-usage>`, …), keep that structure; if it still uses `##` prose headers, either match it or follow `tsh-creating-agents` — do not mix half-and-half within one file.
- **New files still use the full conversion** (frontmatter, paths, terminology, `name:` add) per the tables above.

## Divergence from Upstream (do not blindly mirror)

Some upstream files have no faithful Cursor equivalent. Adapt, don't copy:

- **README / docs:** This fork's README is a richer, diverged artifact (it is primary documentation; upstream's may be a thin pointer to a docs site). Apply the upstream *intent* where the Cursor README has matching content; skip upstream-only sections and any `.github/`/VS-Code-specific instructions. A README-only upstream PR can legitimately be a near-no-op — record that it was reviewed in the changelog rather than forcing changes.
- **Commands don't bind models.** Upstream `.prompt.md` `model:` changes have no home in Cursor command SKILLs (no model line). Fold the intent into the delegated *agent's* guidance instead, or note it as N/A.
- **Skill/agent counts:** if the repo tracks counts (README, `website/docs/**` overviews, `scripts/count-skills.sh`), update them whenever a PR adds or removes an artifact.
- **Changelog:** add one dated entry per ported PR to both `CHANGELOG.md` and `website/src/pages/changelog.md`, tagged with the source PR number (e.g. "ported from copilot-collections PR #NN").

## Conversion Process

```
Conversion progress:
- [ ] Step 1: Identify artifact type and determine target directory + filename
- [ ] Step 2: Convert frontmatter fields (add `name:`; drop `model:`/`tools:`/prompt `agent:`; map `user-invocable: false` → `disable-model-invocation: true`)
- [ ] Step 3: Apply path and terminology replacements throughout body
- [ ] Step 4: Strip or replace removed tools (vscode/*) and any TSH marker comments
- [ ] Step 5: Convert handoffs/agents frontmatter to body sections (if applicable)
- [ ] Step 6: Verify the directory name matches the `name` field in frontmatter
- [ ] Step 7: Check that no `.github/` paths remain in the body (except GitHub Actions / migration-guidance references)
- [ ] Step 8: Check that no Copilot IDE terminology remains (in non-comparison contexts)
- [ ] Step 9: Update cross-references, delegation blocks, and docs
- [ ] Step 10: Update tracked counts (README, docs overviews) and add a changelog entry per ported PR
```

## Post-Conversion Checks

After converting, verify:

1. **Cross-references** — search for the old filename in all `.cursor/skills/**` files; update any that reference the old path
2. **Agent delegation blocks** — if the converted artifact is an agent, check whether `tsh-engineering-manager/SKILL.md` or other orchestrators need a new delegation block
3. **Documentation** — if `website/docs/` exists, create or update the corresponding docs page following the same naming and structure as existing pages
4. **Naming conventions** — verify the `tsh-` prefix is present and the directory name matches `name` in frontmatter

## Connected Skills

- `tsh-creating-agents` — when the converted artifact is a new agent, follow agent creation conventions
- `tsh-creating-skills` — when the converted artifact is a new workflow skill, follow skill creation conventions
- `tsh-creating-commands` — when the converted artifact is a new slash command
- `tsh-creating-rules` — when converting `.instructions.md` files to `.mdc` rules
- `tsh-codebase-analysing` — to understand the existing skill structure before placing new files
