# Plan: Align skill template and creation docs with official Cursor skill spec

## Objective

Synchronize `skill.template.md` and `tsh-creating-skills/SKILL.md` with the official Cursor Agent Skills specification at [cursor.com/docs/skills](https://cursor.com/docs/skills).

## Gap Analysis

### Official frontmatter fields (cursor.com/docs/skills)

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Lowercase letters, numbers, hyphens |
| `description` | Yes | Describes what the skill does and when |
| `paths` | No | Glob patterns to scope skill to specific files |
| `disable-model-invocation` | No | When `true`, only included on explicit `/skill-name` invocation |
| `metadata` | No | Arbitrary key-value mapping |

### Our `skill.template.md` vs official spec

| Field in our template | In official docs? | Action |
|---|---|---|
| `name` | ✅ Yes | Keep |
| `description` | ✅ Yes | Keep |
| `metadata` | ✅ Yes | Keep |
| `allowed-tools: Bash(git:*) Read` | ❌ No — GitHub Copilot field | Remove |
| `compatibility: "Designed for VS Code GitHub Copilot"` | ❌ No — GitHub Copilot field | Remove |
| `license: Apache-2.0` | ❌ No | Remove (harmless but noise) |
| `paths` | ❌ Missing | Add with documentation |
| `disable-model-invocation` | ❌ Missing from template | Add (already in `tsh-creating-commands`) |

### GUARD comment in `skill.template.md`

Current comment references Copilot artifacts:
```
<!-- GUARD: ...belong in .agent.md files...belong in .prompt.md files -->
```
Should reference Cursor artifacts:
```
<!-- GUARD: ...belong in .cursor/skills/agents/...belong in .cursor/skills/commands/ -->
```

### `tsh-creating-skills/SKILL.md` body

The frontmatter description section documents only `name` and `description`. It needs:
- `paths` field with use-case guidance (when to scope, glob syntax)
- Note that `allowed-tools` and `compatibility` are not valid Cursor fields
- Note about `disable-model-invocation` as a valid optional field

## Current Implementation Analysis

| File | Location |
|---|---|
| Template | `.cursor/skills/workflows/tsh-creating-skills/skill.template.md` |
| Skill creation guide | `.cursor/skills/workflows/tsh-creating-skills/SKILL.md` |
| Commands creation guide | `.cursor/skills/workflows/tsh-creating-commands/SKILL.md` |

`tsh-creating-commands/SKILL.md` already correctly documents `disable-model-invocation: true` in its frontmatter section — no changes needed there.

The `naming-conventions.mdc` uses `globs:` in its own frontmatter — this is correct, `globs` is the valid field for `.mdc` rule files in Cursor, distinct from `paths` in `SKILL.md` files.

## Technical Context

- Repo is Cursor-only (no GitHub Copilot), `.cursor/skills/` directory structure
- `skill.template.md` is the canonical starting point used by the `tsh-creating-skills` workflow
- Official `paths` field replaces the legacy `globs` field for skills (not to be confused with `globs` in `.mdc` rule files — these are two different systems)
- `.agents/skills/` is an alternative location per official docs but informational only — no changes needed to directory structure

## Implementation Plan

### Phase 1 — Fix `skill.template.md`

#### Task 1.1 — Remove Copilot legacy fields and add `paths` + `disable-model-invocation` `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-skills/skill.template.md`

Replace the OPTIONAL FIELDS block:

**Before:**
```yaml
# ============================================================
# OPTIONAL FIELDS
# ============================================================
# license: Apache-2.0
# compatibility: "Designed for VS Code GitHub Copilot"
# metadata:
#   author: your-org
#   version: "1.0"
# allowed-tools: Bash(git:*) Read
```

**After:**
```yaml
# ============================================================
# OPTIONAL FIELDS
# ============================================================
# paths:
#   Glob patterns that scope this skill to specific files.
#   When set, the skill is only surfaced when the agent works with matching files.
#   Examples:
#     paths: "**/*.tsx"
#     paths:
#       - "**/*.tsx"
#       - "packages/ui/**/*.ts"
#   Leave unset for skills available regardless of which files are open.
#
# disable-model-invocation: true
#   When true, this skill is only included when explicitly invoked via /skill-name.
#   The agent will not automatically apply it based on context.
#   Use for entry-point commands that should never auto-trigger.
#
# metadata:
#   author: your-org
#   version: "1.0"
```

- [ ] `license` removed
- [ ] `compatibility` removed (Copilot leftover)
- [ ] `allowed-tools` removed (Copilot leftover — not in Cursor spec)
- [ ] `paths` added with glob examples and scoping explanation
- [ ] `disable-model-invocation` added with description

#### Task 1.2 — Fix GUARD comment `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-skills/skill.template.md`

Replace the GUARD comment referencing Copilot file types:

**Before:**
```
<!-- GUARD: This file defines HOW to perform a specific task. Do NOT define
     agent personality or behavior here (those belong in .agent.md files).
     Do NOT define workflow triggers here (those belong in .prompt.md files).
     Keep instructions concise — only add context the LLM doesn't already have. -->
```

**After:**
```
<!-- GUARD: This file defines HOW to perform a specific task. Do NOT define
     agent personality or behavior here (those belong in .cursor/skills/agents/).
     Do NOT define workflow entry points here (those belong in .cursor/skills/commands/).
     Keep instructions concise — only add context the LLM doesn't already have. -->
```

- [ ] `.agent.md` reference replaced with `.cursor/skills/agents/`
- [ ] `.prompt.md` reference replaced with `.cursor/skills/commands/`

---

### Phase 2 — Update `tsh-creating-skills/SKILL.md`

#### Task 2.1 — Add `paths` and `disable-model-invocation` to frontmatter docs `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-skills/SKILL.md`

In **Step 3: Write the skill description** (or better: insert as a new step between current Steps 3 and 4), add frontmatter fields reference. Currently the skill only documents `name` (Step 2) and `description` (Step 3). Add a brief section or note in Step 4 (Write the skill body) referencing the official optional fields.

The goal: ensure that when a developer reads `tsh-creating-skills`, they know about `paths` and `disable-model-invocation` as valid optional frontmatter fields.

Approach: add a `### Optional Frontmatter Fields` subsection inside **Step 4: Write the skill body**, before Content Guidelines.

**New content:**
```markdown
### Optional Frontmatter Fields

| Field | When to use |
|---|---|
| `paths` | Scope the skill to specific file types (e.g. `"**/*.tsx"`). Only surfaced when the agent works with matching files. Leave unset for globally available skills. |
| `disable-model-invocation` | Set to `true` for entry-point commands that should only trigger on explicit `/skill-name` invocation. See `tsh-creating-commands` for the full command pattern. |
| `metadata` | Arbitrary key-value metadata (author, version). Informational only. |
```

- [ ] `paths` field documented with guidance on when to use it
- [ ] `disable-model-invocation` mentioned with reference to `tsh-creating-commands`
- [ ] `metadata` kept for completeness
- [ ] No mention of `allowed-tools`, `compatibility`, `license` (removed from canon)

#### Task 2.2 — Add `paths` to validation checklist `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-skills/SKILL.md`

In the Validation Checklist (Step 6), add a frontmatter check:

```
- [ ] Frontmatter: `paths` set if skill should be scoped to specific file types (omitted otherwise)
```

- [ ] Check added to validation checklist

## Scope

Only `skill.template.md` and `tsh-creating-skills/SKILL.md` need changes.  
`tsh-creating-commands/SKILL.md` already correctly documents `disable-model-invocation` — no changes.  
`naming-conventions.mdc` uses `globs` in rule file frontmatter (correct — different system) — no changes.

## Definition of Done

- [ ] `skill.template.md`: `license`, `compatibility`, `allowed-tools` removed
- [ ] `skill.template.md`: `paths` added with glob examples
- [ ] `skill.template.md`: `disable-model-invocation` added
- [ ] `skill.template.md`: GUARD comment references Cursor paths, not Copilot file types
- [ ] `tsh-creating-skills/SKILL.md`: Optional Frontmatter Fields table added
- [ ] `tsh-creating-skills/SKILL.md`: Validation checklist includes `paths` check
