---
name: tsh-creating-rules
description: "Guides creating and reviewing project instructions and scoped rules for Cursor, Claude Code and Codex: AGENTS.md as the single constitution, CLAUDE.md importing it, Cursor .mdc rules, Claude .claude/rules files and Codex nested AGENTS.md. Covers per-tool placement, frontmatter, precedence, templates and the rules-versus-skills decision. Use when creating, reviewing or updating AGENTS.md, CLAUDE.md or scoped rule files."
metadata:
  short-description: Placement, fields and templates for project instructions and rules
user-invocable: false
---
<!-- Generated from src/skills/tsh-creating-rules/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Creating Rules

Creates well-structured project instructions for Cursor, Claude Code and Codex: one constitution that every tool reads, plus scoped rules where a tool supports them. Rules are declarative constraints for THIS repository, not procedures.

## Core Design Principles

<principles>

<agents-md-first>
`AGENTS.md` at the repository root is the constitution and the single source of truth for always-on instructions.

- **Cursor** and **Codex** read `AGENTS.md` natively.
- **Claude Code** reads `CLAUDE.md`, not `AGENTS.md`. Create `CLAUDE.md` containing only the line `@AGENTS.md`, so the same text serves all three tools. Add Claude-only notes below that line only when really needed.
- Do not maintain the same rules in several places. If a tool needs a copy, import or link it.

Project instructions are written by hand. They are not generated from a neutral source, so edit `AGENTS.md` directly.
</agents-md-first>

<rules-vs-skills>
Rules define **CONSTRAINTS**: declarative, project-specific, loaded automatically. Skills define **HOW**: procedures and knowledge, loaded on demand and reusable across projects.

| If the content is... | It belongs in... | Example |
|---|---|---|
| A project-specific rule or constraint | Rules | "Use `date-fns`, not `moment.js`: moment.js is deprecated" |
| A step-by-step workflow | Skill | "How to perform a code review with severity categories" |
| A convention for one file type or directory | Scoped rule (or nested instructions) | "React components are functional with hooks" |
| A reusable process template | Skill | "How to add an API endpoint with validation" |
| An architectural decision for this repository | `AGENTS.md` | "Monorepo with `apps/` and `packages/`" |
| Domain knowledge needed to perform a task | Skill | "E2E patterns with page objects" |
| Stack and version requirements | `AGENTS.md` | "TypeScript 5.4, React 19" |
| A standard linters do not enforce | `AGENTS.md` or scoped rule | "Business logic must not import from the UI layer" |

Mental model: rules are the law, always in force; skills are handbooks consulted for a task.
</rules-vs-skills>

<conciseness>
Instructions compete with the conversation, skills and the task for context, in every session.

- One simple statement per rule, with the reason behind non-obvious rules.
- Preferred and avoided patterns as concrete code examples.
- Skip what linters and formatters already enforce.
</conciseness>

</principles>

## Where Each Tool Reads Instructions

| Purpose | Cursor | Claude Code | Codex |
|---|---|---|---|
| Always-on constitution | `AGENTS.md` | `CLAUDE.md` containing `@AGENTS.md` | `AGENTS.md` |
| Scoped by file pattern | `.cursor/rules/<topic>.mdc` | `.claude/rules/<topic>.md` with `paths` | nested `AGENTS.md` in the subdirectory |
| Subdirectory instructions | nested `AGENTS.md` | nested `CLAUDE.md` | nested `AGENTS.md` |
| User-wide | User Rules in settings | `~/.claude/CLAUDE.md` | `~/.codex/AGENTS.md` |

Cursor also treats `CLAUDE.md` as always applied, which is why it must hold only the import line and not a second copy of the rules.

### Cursor `.mdc` frontmatter

| Field | Description |
|---|---|
| `description` | What the rule covers. Lets the agent decide to apply the rule when it matches the task. |
| `globs` | Glob pattern of files for which the rule is attached automatically. |
| `alwaysApply` | `true` applies the rule to every request; leave `false` for scoped rules. |

There is no `name` field; the file name identifies the rule. A rule with neither `globs`, `alwaysApply: true` nor a useful `description` applies only when a user mentions it.

### Claude `.claude/rules/*.md`

Plain Markdown. Frontmatter `paths` holds a list of glob patterns; the rule loads when matching files are in context. A rule without `paths` loads at session start like `CLAUDE.md`.

### Codex nested `AGENTS.md`

Codex reads `AGENTS.md` files from the repository root down to the working directory and combines them, so a file in a subdirectory carries the conventions for that part of the tree. There are no separate scoped rule files.

### Glob reference

| Pattern | Matches |
|---|---|
| `**/*.ts` | All TypeScript files |
| `**/*.test.ts` | All test files |
| `src/components/**` | Everything under `src/components` |
| `**/*.{ts,tsx}` | TypeScript and TSX files |
| `**` | All files (use `AGENTS.md` instead) |

### Precedence

- **Cursor:** Team Rules, then Project Rules, then User Rules. All applicable rules are merged, and on a conflict the earlier source wins.
- **Claude Code:** instruction files are loaded together as context; more specific locations (a subdirectory file, a project rule) refine the broader ones, and user-wide files apply across projects. Avoid conflicting statements rather than relying on precedence.
- **Codex:** files closer to the working directory come later in the combined instructions and take precedence over the root file.

Design rules so they do not conflict: keep each statement in one place.

## Creation Process

```
Creation progress:
- [ ] Step 1: Determine what is needed
- [ ] Step 2: Define the scope
- [ ] Step 3: Gather the content
- [ ] Step 4: Write the files
- [ ] Step 5: Validate
```

**Step 1: Determine what is needed.** Decide with the user, or from context:
- No `AGENTS.md` yet: create the constitution first, plus the `CLAUDE.md` import if Claude Code is used.
- `AGENTS.md` exists and a convention applies to one file type or directory: add a scoped rule for each tool in use (Cursor `.mdc`, Claude `.claude/rules`, Codex nested `AGENTS.md`).
- Unsure: check which files exist. The constitution comes before the specific laws.
- If the content is a procedure, stop: it belongs in a skill (`tsh-creating-skills`).

**Step 2: Define the scope.** For the constitution, research the project: `package.json`, `pyproject.toml`, `go.mod` or equivalent for languages and versions; the directory structure for the architecture; linter and formatter configs for what is already enforced; the README. For a scoped rule, decide which files it applies to, which conventions exist for them, and whether an existing rule already covers the scope (no overlapping globs).

**Step 3: Gather the content.**
- Constitution: architecture; technology stack with exact versions; conventions that linters do not enforce; error handling; testing strategy; development workflow (task runners and commands to use instead of raw commands).
- Scoped rule: the conventions for the scope, preferred patterns with examples, anti-patterns with examples, reasons for non-obvious rules.

**Step 4: Write the files.** Use `assets/agents-md.template.md` for the constitution and `assets/scoped-rule.template.md` for scoped rules.
- `AGENTS.md` at the root, Markdown headings, no frontmatter. Then `CLAUDE.md` with the single line `@AGENTS.md`.
- Cursor scoped rule: `.cursor/rules/<topic>.mdc` with `description`, `globs`, `alwaysApply`.
- Claude scoped rule: `.claude/rules/<topic>.md` with `paths`.
- Codex: nested `AGENTS.md` in the subdirectory.
- Name files by scope (`python`, `react-components`, `api-endpoints`). Add only files for tools the project uses.

**Step 5: Validate.**

```
Validation:
- [ ] AGENTS.md exists at the root; CLAUDE.md contains only @AGENTS.md (if Claude Code is used)
- [ ] The same rule is not written in two places
- [ ] .mdc frontmatter has only description, globs and alwaysApply and is valid YAML
- [ ] Claude rule frontmatter (if any) uses paths with a list of globs
- [ ] Globs match the intended files and do not overlap another rule
- [ ] Each rule is one statement; non-obvious rules give the reason
- [ ] Preferred and avoided patterns have concrete examples
- [ ] Nothing a linter or formatter already enforces
- [ ] No procedures (skills), no personas (agents), no workflow triggers (commands)
- [ ] The constitution covers architecture, stack with versions and key conventions
```

## Connected Skills

- `tsh-creating-agents` - to keep coding standards out of agent definitions
- `tsh-creating-skills` - to draw the boundary between procedural knowledge (skills) and declarative rules
- `tsh-creating-commands` - to keep commands pointing at rules instead of duplicating conventions
- `tsh-discovering-technical-context` - to discover and read existing instruction files
- `tsh-analyzing-codebase` - to analyze the project for stack, architecture and conventions
