# TSH AI Collections - Repository Constitution

This repository distributes AI customizations (skills, commands, subagents, MCP config) for Cursor, Claude Code and Codex, for installation into other projects. It is not an application codebase. `CLAUDE.md` only imports this file (`@AGENTS.md`); Cursor and Codex read `AGENTS.md` natively.

## Single source

`src/` is the only source of truth. Native files for every tool are generated from it.

- `src/skills/<name>/SKILL.md` plus `references/`, `assets/`, `scripts/` - commands, orchestrators, internal steps and knowledge skills
- `src/agents/<name>.md` - subagents (neutral frontmatter: `model-tier`, `access`, `preload-skills`, ...)
- `src/partials/<name>.md` - shared text, included with `<!-- include: <name> -->`
- `src/mcp/servers.json` - MCP servers; `src/config/targets.json` - model tiers and the owned output globs

**Never edit the generated paths by hand** (the next `npm run generate` overwrites them, and `npm run check` fails on drift):

- `.agents/skills/tsh-*` (Cursor and Codex skills tree) and `.claude/skills/tsh-*`
- `.cursor/agents/tsh-*.md`, `.claude/agents/tsh-*.md`, `.codex/agents/tsh-*.toml`
- `.cursor/mcp.json`, `.mcp.json`, `.codex/config.toml`

Cursor reads both skills trees and dedupes by name: a same-name skill resolves to `.claude/skills`.

## Workflow

1. Edit `src/` (or `scripts/`).
2. `npm run generate` - renders all native outputs and prints the counts per type.
3. `npm run check` - `generate --check` (drift), `lint` (content and structural rules), `refs` (name and link references).
4. `npm test` - unit tests for the generator, lint, refs, installer and migration.

Lint and refs findings may be recorded in `scripts/baseline/lint.jsonl` and `scripts/baseline/refs.jsonl`. The baseline only shrinks: never add entries; fix the finding or remove the entry. Structural rules (`schema`, `name-collision`, `skill-layout`, `no-dot-tool-dirs`) and `../` links can never be baselined. `--update-baseline` lowers counts and drops stale entries; `--write-baseline` is only for the initial recording. Run `node scripts/check-refs.mjs --docs` to also check `README.md`, `AGENTS.md`, the latest CHANGELOG entry and `website/docs`.

## Artifact types and layering

Every skill has a neutral `type` in its frontmatter:

| Type | Purpose | Visibility |
|---|---|---|
| `command` | Thin user entry point (`/tsh-<verb>`); has `routes-to` (an agent or orchestrator) | user only (no model invocation); the only type a user types |
| `orchestrator` | Main-thread workflow that delegates to subagents; loaded by name from commands | hidden where the tool supports it |
| `internal` | Step loaded by an orchestrator or agent by name | hidden where the tool supports it |
| `skill` | Knowledge skill, loaded by any agent by name | hidden from the user menu where the tool supports it (`user-invocable: false`); the model can still load it |

Agents (`src/agents/`) are leaf subagents: they never delegate (one delegation level everywhere), run in interactive mode by default and in delegated mode only when the task starts with `MODE: delegated` (`agent-modes` partial, STATUS block). Orchestrators and agent-routed commands include `caller-status-handling`. Handoffs are text (`## Suggested next steps` naming commands), never automatic invocations.

Layering: commands (thin, `routes-to`) -> orchestrators (main thread) or subagents (depth 1) -> knowledge skills (loaded by name). Commands contain no domain knowledge. Exception: `/tsh-commit` is `standalone: true` (runs in the main thread, no `routes-to`).

Reference other skills by name ("load the `tsh-<name>` skill"). Never by path: no `.cursor/skills/` paths, no `SKILL.md` links, no `../` links out of a skill, no `read_file` + path.

## Naming

- Everything uses the `tsh-` prefix; the frontmatter `name` equals the directory (or agent file) name.
- Knowledge skills: `tsh-<gerund>-<object>`, gerund first, American spelling (`tsh-reviewing-code`, `tsh-analyzing-codebase`); a single gerund is fine (`tsh-committing`).
- Commands and internal steps: `tsh-<verb>[-<object>]`, imperative (`tsh-implement`, `tsh-implement-task`).
- Agents and orchestrators: `tsh-<role>`, noun (`tsh-architect`, `tsh-engineering-manager`).
- No skill name may equal an agent name; `routes-to` must resolve.
- The `tsh-` prefix applies to skill directory names and agent file names; support files under `references/`, `assets/`, `scripts/` are named for their topic.
- Tool-neutral wording: no tool-specific syntax (`@tsh-...` mentions, "Task tool", model names) in `src/`.
- `SKILL.md` is at most 500 lines; descriptions of `skill` and `command` types contain "Use when"; each skill has `metadata.short-description` (max 120 chars).

## Support-file layout

A skill directory contains only `SKILL.md`, `references/`, `assets/` and `scripts/`. Fill-in templates go to `assets/<name>.template.md`, worked examples to `references/<name>.example.md`. Links go only to the skill's own support files, one level deep. Files over 100 lines in `references/` or `assets/` start with `## Contents`. No cross-skill file references.

## No Copilot paths

Do not add Copilot paths (`.github/agents`, `.github/prompts`, `*.prompt.md`, `copilot-instructions.md`) to active skills. The only place they may appear is `tsh-migrating-copilot-customizations`, which exists to translate them.

## Commit conventions

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/): `<type>[scope][!]: <description>`; imperative, lowercase after the colon, no trailing period, about 72 characters. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. The generic rules live in the `tsh-committing` skill. Repository mapping from paths to type and scope:

| Changed paths | Type | Scope |
|---|---|---|
| `src/skills/` command (new or changed) | `feat` | command name without `tsh-` |
| `src/skills/` knowledge skill, orchestrator, internal | `feat` for new capability, `chore` for typo or format fixes | skill name or `skills` |
| `src/agents/` | `feat` | agent name or `agents` |
| `src/partials/`, `src/mcp/`, `src/config/` | `feat` or `chore` | `partials`, `mcp`, `config` |
| `scripts/` (generator, lint, installer) | `feat`, `fix` or `chore` | `generator`, `lint`, `refs`, `installer` |
| Generated trees only (regenerated with their `src/` change) | same commit as the `src/` change | - |
| `specifications/**/*.plan.md`, `*.decision.md` | `docs` | `specs` |
| `website/`, `README.md`, `CHANGELOG.md` | `docs` | `website`, `readme`, `changelog` |
| CI yaml, lockfiles, `package.json` | `ci`, `build` or `chore` | match path |

Commit `src/` changes together with their regenerated outputs. Never commit secrets (`.env*`, keys, credentials).
