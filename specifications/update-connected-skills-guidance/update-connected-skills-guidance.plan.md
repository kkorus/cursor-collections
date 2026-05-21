# Plan: Update skill-creation skills to document Connected Skills requirement

## Objective

Ensure that all skill-creation meta-skills (`tsh-creating-commands`, `tsh-creating-agents`) explicitly document the `Connected Skills` section requirement — the same way `tsh-creating-skills` already does.

## Current Implementation Analysis

| File | Connected Skills in Body Sections table? | Validation checklist item? |
|---|---|---|
| `tsh-creating-skills/SKILL.md` | ✅ Yes (Required) — line 229 | ✅ Yes — line 306 |
| `tsh-creating-skills/skill.template.md` | ✅ Yes (REQUIRED comment) — line 132 | — |
| `tsh-creating-commands/SKILL.md` | ❌ Missing | ❌ Missing |
| `tsh-creating-agents/SKILL.md` | ❌ Missing from Body Sections table | ❌ Missing from validation checklist |

### What `tsh-creating-skills` already has (correct state)

```
| Connected Skills | **Yes** | Links to related skills with brief rationale for each. |
```

Validation checklist:
```
|- [ ] Body: Connected Skills section references existing skills
```

### What `tsh-creating-commands` is missing

The `Body Sections` table (lines 144–152) has no `Connected Skills` row.  
The `Step 6 Validate` checklist (lines 122–131) has no Connected Skills check.

### What `tsh-creating-agents` is missing

The `Body Sections` table (lines 141–151) has no `Connected Skills` row.  
The `Step 9 Validate` checklist (lines 114–123) has no Connected Skills check.

Note: Agent skills use XML structure, not Markdown headings, so `Connected Skills` would be documented as a `## Connected Skills` section outside the XML tags — consistent with how `tsh-creating-agents` itself already ends (it has its own `## Connected Skills` section at line 177). This needs to be made explicit.

## Technical Context

- All meta-skills live in `.cursor/skills/workflows/`
- The `skill.template.md` is the canonical reference template and already marks `Connected Skills` as REQUIRED
- `tsh-creating-skills` is the source of truth for skill structure — it already has the correct state
- `tsh-creating-commands` and `tsh-creating-agents` each have their own `## Connected Skills` sections at the end but don't instruct users to add one to skills they create

## Implementation Plan

### Phase 1 — Fix `tsh-creating-commands`

#### Task 1.1 — Add Connected Skills to Body Sections table `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-commands/SKILL.md`

Add a new row to the Body Sections table after `Constraints`:

```markdown
| Connected Skills | **Yes** | Links to related skills with brief rationale for each. |
```

- [x] Row added in correct position (last row of Body Sections table)
- [x] Marked as **Yes** (Required), consistent with `tsh-creating-skills`

#### Task 1.2 — Add validation checklist item `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-commands/SKILL.md`

Add to Step 6 validation checklist:

```
- [ ] Connected Skills section present and references existing skills
```

- [x] Item added to the validation checklist
- [x] Wording consistent with `tsh-creating-skills` checklist

---

### Phase 2 — Fix `tsh-creating-agents`

#### Task 2.1 — Add Connected Skills to Body Sections table `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-agents/SKILL.md`

Add a new row to the Body Sections table (lines 141–151):

```markdown
| `## Connected Skills` | **Yes** | Links to related skills with brief rationale for each. Placed outside XML tags, after all XML sections. |
```

Note: Agents use XML tags for all body sections. `## Connected Skills` is intentionally a Markdown heading placed after the closing XML, not inside XML — the note "Placed outside XML tags" disambiguates this.

- [x] Row added in correct position
- [x] Note clarifies placement (outside XML, at end of file)

#### Task 2.2 — Add validation checklist item `[MODIFY]`

**File**: `.cursor/skills/workflows/tsh-creating-agents/SKILL.md`

Add to Step 9 validation checklist:

```
- [ ] Connected Skills section present at end of file (outside XML tags)
```

- [x] Item added
- [x] Placement note included

## Scope

Only `tsh-creating-commands` and `tsh-creating-agents` need changes.  
`tsh-creating-skills` and `skill.template.md` are already correct — do not modify them.

## Definition of Done

- `tsh-creating-commands` Body Sections table includes `Connected Skills | Yes`
- `tsh-creating-commands` Step 6 checklist includes Connected Skills check
- `tsh-creating-agents` Body Sections table includes Connected Skills row with placement note
- `tsh-creating-agents` Step 9 checklist includes Connected Skills check
- No other files modified
