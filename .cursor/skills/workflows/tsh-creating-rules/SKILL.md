---
name: tsh-creating-rules
description: "Creates custom rule files (.cursor/rules/*.mdc) for Cursor. Covers repository-level instructions (cursor-instructions.md) and granular file-based rules with globs and alwaysApply frontmatter. Provides templates and decision framework for rules vs. skill placement. Use when creating, reviewing, or updating .mdc rule files."
---

# Creating Rules

Creates well-structured rule files for Cursor. Covers the repository-level constitution and granular scoped conventions, with clear guidance on what belongs in rules versus skills.

## Core Design Principles

<principles>

<rule-types>
Two types of rule files exist:

**Repository-level rules** (`.cursor/rules/cursor-instructions.md`): A single file per repository — the "constitution." Defines architecture, directory structure, languages, frameworks, library versions, and fundamental project constraints. Applied to ALL Cursor interactions in the workspace. No frontmatter required. This is the first file any developer or AI agent should read to understand the project.

**Granular custom rules** (`*.mdc` in `.cursor/rules/`): Multiple files per repository. Support YAML frontmatter with `globs:` patterns and `alwaysApply:`. Applied automatically when matching files are in context, or manually added to chat. These encode file-type-specific or directory-specific coding conventions.

| Aspect | Repository-level | Granular custom |
|---|---|---|
| File | `.cursor/rules/cursor-instructions.md` | `*.mdc` in `.cursor/rules/` |
| Count per repo | Exactly one | Multiple |
| Frontmatter | Not required | Recommended (`globs:`, `name`, `description`, `alwaysApply:`) |
| Applied when | Every Cursor interaction | Files matching `globs:` pattern are in context, or description semantically matches the task |
| Location | `.cursor/rules/cursor-instructions.md` | `.cursor/rules/` folder |
| Purpose | Project constitution — architecture, stack, fundamental rules | Scoped conventions — file-type or domain-specific rules |
</rule-types>

<rules-vs-skills>
Rules define **CONSTRAINTS** — declarative rules that Cursor must follow whenever they apply. They are project-specific, loaded automatically, and encode decisions for THIS repository.

Skills define **HOW** — procedural workflows loaded on-demand by agents to perform specific tasks. Skills are generic, reusable across projects, and encode expert knowledge.

| If the content is... | It belongs in... | Example |
|---|---|---|
| A project-specific rule or constraint | Rules | "Use `date-fns` instead of `moment.js` — moment.js is deprecated" |
| A step-by-step workflow for performing a task | Skill | "How to perform code review with severity categorization" |
| A coding convention for specific file types | Rules (granular) | "React components use functional style with hooks" |
| A reusable process template across projects | Skill | "How to create a new API endpoint with validation" |
| An architectural decision for this repository | Rules (repo-level) | "This is a monorepo with apps/ and packages/ structure" |
| Domain knowledge needed to execute a task | Skill | "E2E testing patterns with Playwright Page Objects" |
| Technology stack and version requirements | Rules (repo-level) | "TypeScript 5.4, React 19, Next.js 15" |
| A coding standard that linters don't enforce | Rules (granular) | "Business logic must not import from UI layer" |

**Mental model**: Rules are "the law" (always in force). Skills are "expert handbooks" (consulted for specific tasks).
</rules-vs-skills>

<conciseness>
Rule files compete for the context window with conversation history, skills, and the actual task.

- Keep rules short and self-contained — each rule should be a single, simple statement.
- Include the reasoning behind rules (e.g., "Use `date-fns` instead of `moment.js` — moment.js is deprecated and increases bundle size").
- Show preferred and avoided patterns with concrete code examples — AI responds more effectively to examples than abstract rules.
- Focus on non-obvious rules — skip conventions that standard linters/formatters already enforce.
- Whitespace between rules is ignored — format for legibility.
</conciseness>

</principles>

## Creation Process

Use the checklist below and track progress:

```
Creation progress:
- [ ] Step 1: Determine the rule type
- [ ] Step 2: Define the rule scope
- [ ] Step 3: Gather content for the rule file
- [ ] Step 4: Write the rule file
- [ ] Step 5: Validate the rule file
```

**Step 1: Determine the rule type**

Determine from context or ask the user. Clarify intent if it's ambiguous:
- Is this a NEW project needing its first `cursor-instructions.md`? → Create repository-level rules.
- Are there existing `cursor-instructions.md` and file-specific rules are needed? → Create granular rules.
- Unsure? → Check if `.cursor/rules/cursor-instructions.md` exists. If not, recommend creating it first. The constitution comes before specific laws.

**Step 2: Define the rule scope**

For **repository-level rules**, the scope is always the entire project. Research by:
- Reading `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or equivalent to identify languages, frameworks, and versions.
- Analyzing the directory structure to understand architecture (monorepo, feature-based, layered, etc.).
- Reading existing config files (`.eslintrc`, `tsconfig.json`, `.prettierrc`, etc.) to understand tooling.
- Checking for existing README or architectural documentation.

For **granular rules**, determine:
- Which files they apply to (the `globs:` pattern).
- What specific conventions exist for that file scope.
- Whether an existing rule file already covers this scope (avoid overlapping `globs:` patterns).

`globs:` pattern reference:

| Pattern | Matches |
|---|---|
| `**/*.ts` | All TypeScript files |
| `**/*.test.ts` | All test files |
| `src/components/**` | All files under components directory |
| `**/*.{ts,tsx}` | All TypeScript and TSX files |
| `src/api/**` | All API-related files |
| `**` | All files (rarely needed for granular — use repo-level instead) |

**Step 3: Gather content for the rule file**

For **repository-level rules** (the constitution), research and document:
1. **Architecture** — Overall architecture pattern (monorepo, microservices, modular monolith, etc.), directory structure, and responsibility of each top-level directory.
2. **Technology Stack** — ALL languages, frameworks, and key libraries with specific versions. Critical — Cursor needs exact versions to generate compatible code.
3. **Coding Conventions** — Conventions NOT enforced by linters/formatters. Architectural rules (e.g., "business logic must not import from UI layer"), project-specific naming conventions, and agreed-upon patterns.
4. **Error Handling** — The project's error handling strategy.
5. **Testing Strategy** — Testing approach (unit, integration, E2E), frameworks, and key patterns.
6. **Development Workflow** — How developers interact with the project. Document task runners (Make, Taskfile, npm scripts, Turbo), containerization (Docker Compose commands), and common developer commands (build, test, lint, migrate, seed). Cursor should use the same scripts and tools a regular developer would — never raw commands when a script exists.

For **granular rules**, research and document:
- Specific conventions for the target file scope.
- Preferred patterns with code examples.
- Anti-patterns to avoid with code examples.
- Reasoning behind non-obvious rules.

Use the `./assets/cursor-instructions.template.md` and `./assets/custom-rules.template.md` templates as starting points.

**Step 4: Write the rule file**

For **repository-level rules**:
- Create the file at `.cursor/rules/cursor-instructions.md`.
- No frontmatter required.
- Use clear Markdown headers to organize sections.
- Use the `./assets/cursor-instructions.template.md` template.

For **granular rules**:
- Create the file in `.cursor/rules/` directory with `.mdc` extension.
- Name the file descriptively: `{scope}.mdc` (e.g., `python.mdc`, `react-components.mdc`, `api-endpoints.mdc`).
- Include YAML frontmatter with `name`, `description`, `globs:`, and optionally `alwaysApply:`.
- Use the `./assets/custom-rules.template.md` template.

Frontmatter fields reference:

| Field | Required | Description |
|---|---|---|
| `name` | No | Display name shown in UI. Defaults to filename. |
| `description` | Recommended | Short description shown on hover. Also used for semantic matching — if description matches the current task, rules may apply even without `globs:` match. |
| `globs:` | Recommended | Glob pattern relative to workspace root. If omitted, rules are not applied automatically. |
| `alwaysApply:` | No | Boolean. When `true`, rules apply to every request regardless of context. Use for repo-level conventions. |

**Step 5: Validate the rule file**

```
Validation:
- [ ] File is in the correct location (`.cursor/rules/cursor-instructions.md` or `.cursor/rules/*.mdc`)
- [ ] Frontmatter (if present) is valid YAML
- [ ] `globs:` pattern (if present) matches the intended files — verify with a glob tester
- [ ] Rules are short and self-contained — each rule is a single statement
- [ ] Non-obvious rules include reasoning ("because...")
- [ ] Preferred/avoided patterns include concrete code examples
- [ ] No duplication of rules already enforced by linters/formatters
- [ ] No procedural workflow content (that belongs in skills)
- [ ] No agent personality or behavior definitions (that belongs in agent skills)
- [ ] No command/workflow triggers (that belongs in command skills with disable-model-invocation: true)
- [ ] Repository-level file covers: architecture, stack with versions, key conventions
- [ ] Granular files have descriptive, non-overlapping `globs:` patterns
```

## Quick Reference

### Rule File Types

| Type | Location | Purpose |
|---|---|---|
| Repository rules | `.cursor/rules/cursor-instructions.md` | Project constitution — always loaded |
| Granular rules | `.cursor/rules/*.mdc` | Scoped conventions — loaded by `globs:` match |
| Always-apply rules | `.cursor/rules/*.mdc` with `alwaysApply: true` | Cross-cutting conventions |

### Priority Order

Higher takes precedence on conflict:

1. Personal rules (user-level) — highest
2. Repository rules (`.cursor/rules/cursor-instructions.md` or `alwaysApply: true` rules)
3. Granular `globs:`-matched rules — lowest

## Connected Skills

- `tsh-creating-agents` - to ensure agent skills don't embed coding standards that belong in rules
- `tsh-creating-skills` - to understand the boundary between procedural knowledge (skills) and declarative rules
- `tsh-creating-commands` - to ensure commands reference rules rather than duplicating conventions
- `tsh-technical-context-discovering` - the complementary skill that discovers and reads existing rule files
- `tsh-codebase-analysing` - to analyze existing rules and identify patterns to follow
