# Cursor Collections — Repository Constitution

This repository distributes Cursor Agent Skills, commands, workflows, and rules for installation into other projects. It is not an application codebase.

## Architecture

- `.cursor/skills/agents/` — agent personas (`SKILL.md`). User-facing agents are invoked via `@tsh-<role>`. Delegate-only workers in this folder (BA workers, `tsh-plan-reviewer`, Cursor researcher/creator/reviewer) use `disable-model-invocation: true` and are meant for orchestrator delegation only.
- `.cursor/skills/commands/` — slash commands (`disable-model-invocation: true`)
- `.cursor/skills/workflows/` — reusable domain knowledge (auto-loaded by agents)
- `.cursor/skills/internal/` — delegate-only steps (`disable-model-invocation: true`)
- `.cursor/rules/` — project rules (`.mdc` with `globs`, or this file)

## Naming

Skill directory names and rule filenames use the `tsh-` prefix; the literal `SKILL.md` and in-skill support files (`references/`, `assets/`, `examples/`, `*.template.md`, `*.example.md`) are named for their topic. The `name` field in skill frontmatter must match the directory name — except for the two exceptions named in [tsh-naming-conventions.mdc](./tsh-naming-conventions.mdc): vendored `playwright-cli` and this file.

## When Editing This Repo

- Follow [tsh-naming-conventions.mdc](./tsh-naming-conventions.mdc)
- Do not add Copilot paths (`.github/agents`, `.prompt.md`) to active skills
- Commands route to agents; agents load workflows — do not embed domain knowledge in commands
- Delegation-time skill references use the backticked skill name plus `tsh-resolving-skill-references`; `.cursor/skills/<layer>/` paths are for authoring guidance only
