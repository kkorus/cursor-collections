---
name: tsh-committing
description: "Conventional Commits message drafting: type/scope inference, format rules, secret-file checks, and split recommendations. Use when drafting commit messages, running /tsh-commit, or analyzing git diffs for commit structure."
type: skill
metadata:
  short-description: Draft Conventional Commits messages from git changes
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
| `feat` | New user-facing capability or behavior |
| `fix` | Bug fix |
| `docs` | Documentation only (README, website, comments, ADRs, plans) |
| `style` | Formatting, whitespace, no logic change |
| `refactor` | Code restructure without behavior change |
| `perf` | Performance improvement |
| `test` | Tests only |
| `build` | Build system, dependencies, bundler |
| `ci` | CI/CD configuration |
| `chore` | Maintenance, tooling, repo hygiene not covered above |
| `revert` | Reverts a prior commit; body should reference reverted SHA |

## Inferring Type from Diff

| Diff signal | Default type | Scope hint |
| ----------- | ------------ | ---------- |
| Only documentation (`*.md`, `docs/`, README, comments) | `docs` | `docs` or the filename |
| Only plans, specifications or decision records | `docs` | `specs` |
| New capability, command, endpoint or user-visible behavior | `feat` | module or feature name |
| Bug fix in application code | `fix` | module or package |
| Code restructure with no behavior change | `refactor` | module or package |
| Formatting or typo fixes with no logic change | `style` or `chore` | match path |
| Config, lockfiles, tooling | `chore` or `build` | match path |
| CI/CD configuration | `ci` | pipeline name |
| Test files only | `test` | module or area |

When the user provides a hint (e.g. `docs: README cleanup`), honor it over inference.

If the project instructions (for example `AGENTS.md` or `CLAUDE.md`) define commit types, scopes or a scope list, follow them over these defaults.

## Scope

- Optional noun in parentheses: `feat(auth):`, `docs(readme):`
- Use when it aids changelog grouping; omit when unclear or the change is repo-wide.
- Derive scopes from the top-level module, package or area the diff touches, and reuse the scopes already present in the recent commit history.

## Breaking Changes

Indicate when the change breaks consumers or public contracts:

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

## Examples

```
docs(readme): remove outdated installation section

feat(auth): add refresh token rotation

fix(cart): correct total when a coupon expires

refactor(api)!: rename the orders endpoint

BREAKING CHANGE: clients must call /v2/orders
```

## Specification

Full spec: [conventionalcommits.org/en/v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

## Connected Skills

- `tsh-discovering-technical-context` — for project-specific commit scopes and conventions in the project instructions
- `tsh-reviewing-code` — for checking the changes before they are committed
