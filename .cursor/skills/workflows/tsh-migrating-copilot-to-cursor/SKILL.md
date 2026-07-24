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
| `handoffs:` list | `## Handoffs` section in body | Convert list items to Markdown bullet prose |
| `agents:` list | `## Delegation` section in body | Convert list items to Markdown bullet prose |
| `description:` | Keep as-is | Already compatible |
| `name:` | Keep as-is | Must match the directory name |

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

## Conversion Process

```
Conversion progress:
- [ ] Step 1: Identify artifact type and determine target directory + filename
- [ ] Step 2: Convert frontmatter fields (drop `model:`/`tools:`; map `user-invocable: false` → `disable-model-invocation: true`)
- [ ] Step 3: Apply path and terminology replacements throughout body
- [ ] Step 5: Strip or replace removed tools (vscode/*)
- [ ] Step 6: Convert handoffs/agents frontmatter to body sections (if applicable)
- [ ] Step 7: Verify the directory name matches the `name` field in frontmatter
- [ ] Step 8: Check that no `.github/` paths remain in the body
- [ ] Step 9: Check that no Copilot IDE terminology remains (in non-comparison contexts)
- [ ] Step 10: Update any cross-references in other skills that may point to the old path
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
