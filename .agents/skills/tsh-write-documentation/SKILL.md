---
name: tsh-write-documentation
description: Internal step of the technical writer. Load only when a tsh command, orchestrator or agent instructs it. Writes or updates documentation for a task or a plan scope.
metadata:
  short-description: Write or update documentation for a task or plan scope
user-invocable: false
---
<!-- Generated from src/skills/tsh-write-documentation/SKILL.md by scripts/generate.mjs. Do not edit. -->

# tsh-write-documentation

Your goal is to write or update the documentation a task needs, and nothing else. Load the `tsh-writing-documentation` skill first and follow its rules.

## Inputs

- The task description, or the plan tasks in your scope (`*.plan.md`).
- The research file (`*.research.md`) and the code the documentation describes.
- The existing documentation: README, CHANGELOG, `/docs` and the docs site sources.

If the scope is unclear, ask (in delegated mode: return `NEEDS_INPUT` with the questions).

## Scope

In scope: README, CHANGELOG, in-repo documentation and the published docs site. Out of scope: product code, generated outputs, and the skills and agents under `src/`.

## Procedure

1. Read the task and list the pages that must change or be created.
2. Discover the conventions with the `tsh-discovering-technical-context` skill: where documentation lives, how pages are named and ordered, how the docs build runs.
3. Read the code behind each claim you are going to write.
4. Edit the pages. Match the sibling pages and their frontmatter.
5. Verify the commands, names, counts and links. Run the docs build or link check when the project has one; a failure is not done.
6. Update the plan: check the boxes of your scope and add a Changelog entry when you changed the plan's documented facts.

## Escalation

- Missing facts, an unconfirmed audience or an unclear scope: `NEEDS_INPUT` with the questions.
- Documentation that needs a code change first, or a failing build you cannot fix inside the documentation: `BLOCKED` naming the dependency.
- Never invent a fact or a link target to finish the page.

## Plan synchronisation

Work from the plan when one exists: only your scope's checkboxes change, and the text of Definition of Done items stays as written.

## Output format

- Files changed, one line each.
- Result of the build or link check (or "not available").
- Open dependencies and unverified points.
