---
description: '<What these rules cover; also used to decide when the rule applies>'
globs: '<glob-pattern>'
alwaysApply: false
---
<!--
  Scoped Rule
  ===========
  Conventions for files matching a glob pattern. Keep exactly the frontmatter of the tool you target.

  Cursor:      .cursor/rules/<topic>.mdc    frontmatter: description, globs, alwaysApply (shown above)
  Claude Code: .claude/rules/<topic>.md     frontmatter: paths (a list of globs); without paths the rule always loads
               ---
               paths:
                 - "<glob-pattern>"
               ---
  Codex:       no scoped rule files; put the conventions in a nested AGENTS.md in the subdirectory

  Guidelines:
  - Each rule is one clear statement
  - Give the reason for non-obvious rules ("because ...")
  - Show preferred and avoided patterns with code examples
  - Do not repeat AGENTS.md and do not repeat what linters enforce
  - Delete this comment block and every placeholder before finishing
-->

<!-- Describe the conventions for this file scope -->

<!-- Preferred patterns -->

<!-- Avoided patterns -->
