# Review: generated outputs (dimension: generated)

Summary: 0 critical, 1 warning, 1 suggestion. Baseline 324d2fd..HEAD (1dcd92e). `node scripts/generate.mjs --check` passes (338 files), `lint` and `check-refs --docs` report 0 errors. python3 is 3.9 here (no tomllib), so TOML was parsed with the repo's `smol-toml` instead (all 17 agent files and `.codex/config.toml` parse).

## Warning

### W1. `.gitattributes` skill patterns do not match files inside the skill directories
- File: `.gitattributes:2-3` (`.agents/skills/tsh-* linguist-generated=true`, `.claude/skills/tsh-* ...`)
- Evidence: `git ls-files .agents .claude .cursor .codex .mcp.json | xargs git check-attr linguist-generated` reports `unspecified` for every file under `.agents/skills/**` and `.claude/skills/**` (for example `.agents/skills/tsh-analyze-cloud-costs/SKILL.md`, `.../agents/openai.yaml`, `.../references/*.md`). Only the agent files, `.cursor/mcp.json`, `.mcp.json` and `.codex/config.toml` (patterns that name files) are set. Git attribute patterns do not recurse into a directory the way `.gitignore` does.
- Failure scenario: GitHub does not collapse the roughly 250 generated skill files in PR diffs or exclude them from language stats, which defeats the purpose of the file (the two skill trees are duplicated, so reviewers see every skill change twice).
- Fix: use `.agents/skills/tsh-*/** linguist-generated=true` and `.claude/skills/tsh-*/** linguist-generated=true`; re-run `git check-attr` to confirm.

## Suggestion

### S1. Codex can invoke orchestrator/internal skills implicitly
- File: `.agents/skills/tsh-engineering-manager/` (also `tsh-business-analyst`, `tsh-ai-customization-orchestrator`, `tsh-implement-task`, `tsh-orchestrate-ui-verification`, and the other `user-invocable: false` skills)
- Evidence: `agents/openai.yaml` (`policy.allow_implicit_invocation: false`) exists only for the 16 commands. The five `user-invocable: false` skills get no Codex policy, and Codex ignores `user-invocable`. The intended protection (hidden from menus) is Claude-only. Codex is unverified, so this only matters once it is tested.
- Fix (optional): emit the same `allow_implicit_invocation: false` policy for `user-invocable: false` skills.

## Checked and found correct (no finding)
- Claude agents (17): `name`, `description`, `model` (opus/sonnet/haiku per tier), `disallowedTools` always starts with `Agent`, `skills` preload names all exist in `.claude/skills`. Preload set matches the plan table.
- Read-only agents (ui-reviewer, 5 BA workers, researcher, ai-customization-reviewer): Cursor `readonly: true`, Claude denies Write/Edit/NotebookEdit (plus Bash where `shell: false`), Codex `sandbox_mode = "read-only"`. The known exception (ai-customization-reviewer keeps Bash in Claude) is documented in the plan.
- The 5 BA workers deny `mcp__atlassian` in Claude. The server is named `atlassian` in `.mcp.json`. The naming limit is a known item.
- Codex TOML: `name`, `description`, `developer_instructions` present and non-empty, and they match the Cursor and Claude name and description. Tiers map to gpt-5.4 high/medium and gpt-5.4-mini as in `src/config/targets.json`. No backslashes or triple quotes break the multi-line string. Cursor omits `model` for every tier (null mapping), which matches D1.
- Skills: 62 in `.agents/skills` and `.claude/skills`, identical except `agents/openai.yaml` (only in `.agents`, only on the 16 commands). Each `name` equals its directory and is lowercase-hyphen; max description is 482 chars (<1024); frontmatter keys are limited to name, description, metadata, argument-hint, disable-model-invocation, user-invocable, compatibility; no SKILL.md is over 500 lines.
- MCP: `.mcp.json`, `.cursor/mcp.json` and `.codex/config.toml` have the same 11 servers in the same order, with identical command, args, env and url. `.mcp.json` adds `type`. The content equals the pre-refactor `.cursor/mcp.json` (whose old top-level key was `servers`). No secrets, tokens or absolute paths.
- Secrets and personal paths: searching the added lines of `git diff 324d2fd..HEAD` for /Users/, /home/, the username, API-key, bearer and private-key patterns found only two benign documentation strings (an audit quote of someone else's `/home/hutchic/...` symlinks and a `/Users/you/...` placeholder in `upgrading.md`).
- `.gitignore`: `.codex/*` with `!.codex/agents/` and `!.codex/config.toml` keeps the generated files tracked (`git check-ignore` returns nothing for them). The owned globs in `targets.json` match all 8 generated outputs, and `--check` reports extra owned files.
