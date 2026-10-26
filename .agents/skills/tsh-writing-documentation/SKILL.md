---
name: tsh-writing-documentation
description: Craft rules for writing accurate, scannable project documentation such as README, CHANGELOG, in-repo docs and docs-site pages. Use when writing or updating documentation, documenting a feature after implementation, or reviewing a documentation change.
metadata:
  short-description: Write accurate, scannable project documentation
user-invocable: false
---
<!-- Generated from src/skills/tsh-writing-documentation/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Writing Documentation

Rules for documentation that readers can trust and use quickly. For the procedure of a documentation task, the technical writer uses the `tsh-write-documentation` step.

## Contents

- Principles
- Workflow
- Writing versus reviewing
- Connected Skills

## Principles

- **Accuracy over volume.** Write only what you verified in the code, the plan or by running the tool. Remove a claim you cannot verify instead of softening it.
- **Match the siblings.** Mirror the structure, tone, headings and frontmatter of neighboring pages. Do not introduce a new page shape.
- **Links must resolve.** Link only to pages and anchors that exist. A broken-link or build failure is a failure of the task: fix it, never invent a link target.
- **Write for a busy reader.** Lead with the outcome or the action. Use short sentences, descriptive headings, lists for steps and options, and tables for comparisons. One idea per paragraph.
- **One home per fact.** Put each fact in one place and link to it from the others.
- **Concrete over abstract.** Give a runnable command or a real example instead of a description. Mark placeholders clearly.
- **No stale numbers.** Counts, versions and names come from the source, not from memory. Re-check them when the source changes.

## Workflow

```
Documentation progress:
- [ ] Step 1: Define the audience and the scope of the change
- [ ] Step 2: Read the code, the plan and the sibling pages
- [ ] Step 3: Write or update the pages
- [ ] Step 4: Verify claims, commands and links; run the docs build if one exists
- [ ] Step 5: Report the changed files and open points
```

1. State who reads the page and what they must be able to do afterwards. Keep the scope to that.
2. Read the implementation and the plan for the facts, and the nearest sibling pages for the shape.
3. Edit existing pages before creating new ones. Add a new page only when no existing page fits.
4. Run every command you document when it is safe to do so. Run the documentation build or link check when the project has one.
5. Report each changed file in one line and list anything you could not verify.

## Writing versus reviewing

This skill guides writing. A review of the written result (does it match the code, do the links resolve) is a separate pass: do not mark your own pages as reviewed.

## Connected Skills

- `tsh-write-documentation` - the internal step with inputs, escalation and output format for a documentation task
- `tsh-discovering-technical-context` - for the conventions and structure of the project's documentation
- `tsh-analyzing-codebase` - to understand the code you document
