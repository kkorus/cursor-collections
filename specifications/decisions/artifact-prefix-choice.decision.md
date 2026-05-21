# Decision: Artifact prefix for personal cursor-collections fork

**Status:** PROPOSED  
**Date:** 2026-05-21

## Context

This repository was originally created by The Software House under the name `copilot-collections`. All Cursor customization artifacts (agents, workflow skills, commands, rules) use the `tsh-` prefix, where `tsh` stands for "The Software House". The repository has since been forked to `kkorus/cursor-collections` as a personal setup.

The prefix serves two purposes:
1. **Collision avoidance** — prevents naming conflicts when these skills are installed globally (via GitHub import or `~/.cursor/skills/` symlinks) and used alongside project-specific skills.
2. **Ownership signal** — communicates at a glance which skills come from this collection vs. project-specific ones.

With the fork now owned by a different person, `tsh-` is semantically misleading. The question is what prefix to use instead.

There are 88 skill files referencing `tsh-`, plus directory names, frontmatter `name:` fields, and cross-references — so a rename has a real cost.

## Options Considered

### Option 1: Keep `tsh-`
- **Pros:** Zero migration cost. Works today. No risk of breaking cross-references between skills.
- **Cons:** `tsh-` is meaningless in a personal context. Slightly confusing if shared with others ("why does your setup use The Software House prefix?").

### Option 2: Personal initials prefix — `kk-`
- **Pros:** Short (2 chars + hyphen). Personalizes ownership clearly (`kk` = Konrad). Natural convention for personal forks of branded toolkits.
- **Cons:** Requires a global find-and-replace across 88 files + all directory renames. Initials may collide if another `kk-` toolkit exists (unlikely in personal setups).

### Option 3: Short custom brand — e.g., `my-`, `cc-` (cursor-collections), or similar
- **Pros:** Neutral and descriptive.
- **Cons:** `my-` is generic and would collide if multiple "my-" toolkits existed. `cc-` is slightly better but less personal. Higher ambiguity than initials.

## Decision

**Use `kk-` (personal initials).** Rename all artifacts, directories, and cross-references from `tsh-` → `kk-`.

Short, unambiguous, and correctly signals personal ownership. Initials are the established convention for personal forks of community toolkits (e.g., dotfiles repos, vim configs). The migration cost is one-time and can be fully automated with a find-and-replace + directory rename script.

## Consequences

- Collision avoidance is preserved — `kk-` is as collision-safe as `tsh-` in any project where someone else's global skills don't also use `kk-`.
- All 88 skill files need a `tsh-` → `kk-` substitution (body content + frontmatter `name:` fields).
- All skill directories need to be renamed (`tsh-architect/` → `kk-architect/`).
- `naming-conventions.mdc` rule needs updating to reflect the new prefix.
- README and documentation need updating.
- After renaming, any Cursor installation pointing to this repo (GitHub import or symlinks) must be refreshed.

## Rationale

Personal initials are the shortest meaningful namespace that:
- Is unique to you
- Is stable (initials don't change)
- Follows natural conventions (cf. dotfile maintainers who prefix everything with their handle)

`tsh-` staying would work but carries a semantic debt. `kk-` costs one migration, then it's clean forever.

## Migration Approach

If accepted, the rename can be done in one pass:

```bash
# 1. Rename all directories
for dir in .cursor/skills/agents/tsh-* .cursor/skills/commands/tsh-* .cursor/skills/workflows/tsh-* .cursor/skills/internal/tsh-*; do
  mv "$dir" "${dir/tsh-/kk-}"
done

# 2. Replace all references in file content
find .cursor/ README.md website/ -type f \( -name "*.md" -o -name "*.mdc" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i 's/tsh-/kk-/g' {} +

# 3. Verify no tsh- remains
grep -r "tsh-" .cursor/ --include="*.md"
```

Then commit as a single "Rename tsh- prefix to kk-" commit.
