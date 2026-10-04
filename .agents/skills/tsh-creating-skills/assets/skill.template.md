# Skill Template

Fill-in template for `src/skills/<name>/SKILL.md`. Copy the block under "Template", replace every `<placeholder>`, delete the optional parts you do not need. Omit this header and the `## Contents` section from the finished skill.

## Contents

- [Template](#template)
- [Notes](#notes)

## Template

```markdown
---
name: tsh-<name>                 # == folder name; gerund first for type skill, imperative verb for command/internal
description: >-
  <What the skill does, core capabilities>. Use when <triggers, contexts and keywords>.
type: skill                      # skill | command | internal | orchestrator
# paths: ["**/*.tsx"]            # optional, type skill only: activate for matching files
# requires-mcp: [context7]       # optional: servers defined in src/mcp/servers.json
# license: MIT                   # optional
metadata:
  short-description: "<at most 120 characters>"
---

# <Skill Title>

<What the skill does in one sentence, third person, no "you" or "I".>

<!-- Optional: foundational rules -->
<principles>

<principle-name>
<Why this principle matters for the skill.>
</principle-name>

</principles>

## <Process Name> Process

Use the checklist below and track your progress:

    Progress:
    - [ ] Step 1: <step title>
    - [ ] Step 2: <step title>
    - [ ] Step 3: <step title>

**Step 1: <Step title>**

<What to do, what to use and what to produce.>

**Step 2: <Step title>**

<Instructions.>

**Step 3: <Step title>**

<Instructions.>

<!-- Optional: quick-reference table, examples, validation checklist -->

## Quick Reference

| Rule | Description |
|---|---|
| <rule> | <description> |

## Connected Skills

- `tsh-<other-skill>` - <when and why to load it>
```

## Notes

- Instructions stay neutral: no tool-specific syntax, no path references to other skills, no `../` links. Link only to this skill's own `references/` and `assets/` files.
- Do not define an agent persona here (that belongs in `src/agents/`) and do not define workflow entry points here (those are `type: command` skills).
- Add shared text with `<!-- include: <partial-name> -->` instead of copying it.
- A `command` additionally needs `routes-to` and optionally `argument-hint`; use the command template of the `tsh-creating-commands` skill.
- Keep instructions concise: add only context the model does not already have.
