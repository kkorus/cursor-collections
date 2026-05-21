---
name: tsh-committing
description: "Conventional Commits message drafting: type/scope inference, format rules, secret-file checks, and split recommendations. Use when drafting commit messages, running /tsh-commit, or analyzing git diffs for commit structure."
---

# Committing

Procedural rules for drafting commit messages per [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Does not run `git commit` itself — the `/tsh-commit` command handles inspection, confirmation, and execution.

## Message Format

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

- **Subject line** (required): imperative mood, lowercase after the colon, no trailing period, max ~72 characters.
- **Body** (optional): blank line after subject; explain *why*, not *what* (the diff shows what).
- **Footers** (optional): `BREAKING CHANGE: <description>`, `Refs: #123`, `Refs: PROJ-456` (git trailer style).

## Allowed Types

| Type | Use when |
| ---- | -------- |
| `feat` | New user-facing capability, new command/skill, new workflow behavior |
| `fix` | Bug fix in code or incorrect skill behavior |
| `docs` | Documentation only (README, website, comments, ADRs, plans) |
| `style` | Formatting, whitespace, no logic change |
| `refactor` | Code/skill restructure without behavior change |
| `perf` | Performance improvement |
| `test` | Tests only |
| `build` | Build system, dependencies, bundler |
| `ci` | CI/CD configuration |
| `chore` | Maintenance, tooling, repo hygiene not covered above |
| `revert` | Reverts a prior commit; body should reference reverted SHA |

## Inferring Type from Diff

| Diff signal | Default type | Scope hint |
| ----------- | ------------ | ---------- |
| Only `*.md` under `website/`, `README`, `docs/` | `docs` | `docs` or filename |
| Only `specifications/**/*.plan.md` or `*.decision.md` | `docs` | `specs` |
| New or updated `.cursor/skills/commands/` | `feat` | command name without `tsh-` |
| New or updated `.cursor/skills/workflows/` | `feat` or `chore` | `feat` if new capability; `chore` if typo/format fix |
| New or updated `.cursor/skills/agents/` | `feat` | agent name |
| `.cursor/rules/`, `.mdc` | `chore` or `feat` | `rules` |
| Config, lockfiles, CI yaml | `chore`, `ci`, or `build` | match path |
| Test files only | `test` | module or area |
| Bug fix in application code | `fix` | module or package |

When the user provides a hint (e.g. `docs: README cleanup`), honor it over inference.

## Scope

- Optional noun in parentheses: `feat(auth):`, `docs(readme):`
- Use when it aids changelog grouping; omit when unclear or change is repo-wide.
- For this repository, common scopes: `skills`, `commands`, `docs`, `readme`, `specs`, `website`.

## Breaking Changes

Indicate when the change breaks consumers or skill contracts:

- Subject: `feat(api)!: remove legacy endpoint`
- Or footer: `BREAKING CHANGE: environment variables now take precedence over config files`

Use only when the diff truly introduces a breaking change.

## Revert Commits

```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

## Split vs Single Commit

Recommend **split** when the diff contains unrelated concerns, for example:

- Application code + documentation in one session
- Two unrelated features in different modules
- `feat` + `fix` in separate areas

Present separate proposed messages and file lists. Do not silently combine.

## Anti-Patterns (reject and rewrite)

- Vague subjects: `update`, `fix stuff`, `changes`, `wip`
- Past tense: `fixed bug` → `fix: resolve session expiry handling`
- Multiple sentences in the subject line
- Mixing unrelated changes without split recommendation
- Non-imperative: `adding feature` → `add feature`

## Secret and Sensitive Files

**Never** include in a commit proposal without explicit user acknowledgment:

- `.env`, `.env.*` (except `.env.example`, `.env.dist`)
- `*credentials*`, `secrets.*`, `*.pem`, `*.key`, `*.p12`
- Private keys, tokens, connection strings in plain text

If present in the diff: **BLOCK** the proposal and list the paths. User must remove them from the changeset or explicitly override with quoted confirmation.

## Examples (this repository)

```
docs(readme): remove company branding from header and license

chore(skills): add tsh-commit command with confirmation gate

feat(commands): add conventional commit workflow for /tsh-commit

fix(tsh-implement): correct plan validation skip condition
```

## References

- Full spec: [conventionalcommits.org/en/v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
