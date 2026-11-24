---
sidebar_position: 43
title: Writing Documentation
---

# Writing Documentation

**Skill name:** `tsh-writing-documentation`  
**Source:** `src/skills/tsh-writing-documentation/`  
**Used by:** Technical Writer, `tsh-write-documentation` (step)

Conventions for writing and updating repository documentation (README, CHANGELOG, in-repo `/docs` and the documentation site) without touching product code.

**Use when** writing or updating documentation pages, README or CHANGELOG entries, or when reviewing whether a documentation change is accurate and complete.

## What it covers

- Accuracy over volume: every claim is checked against the repository before it is written.
- Matching sibling pages: frontmatter, heading order and link conventions of the neighboring files.
- Link integrity: internal links must resolve, a build failure is a failure, and link targets are never invented.
- Craft for a busy reader: lead with what the reader needs, keep sections scannable, add only what cannot be inferred.
- A five-step workflow: identify the target and audience, gather source facts, match the structure, write, then validate links and the build.
- The write-versus-review boundary: the skill writes documentation; a documentation task that depends on a code change is reported, not solved by editing code.

## Documentation targets

| Target | Convention |
|---|---|
| README | Plain Markdown, consistent with the existing file |
| CHANGELOG | Append in the existing format; do not rewrite history |
| In-repo `/docs` | Follow the neighboring document structure |
| Documentation site | Pages with the standard frontmatter; internal links must resolve and the site build must pass |

## Connected skills

- [`tsh-discovering-technical-context`](./discovering-technical-context)
- [`tsh-analyzing-codebase`](./analyzing-codebase)
- [`tsh-creating-rules`](./creating-rules)
