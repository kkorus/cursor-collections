# Unified Agent Structure: Research (Cursor, Claude Code, Codex CLI)

Research date: 2026-09-27. Scope: facts only, no solution design. Each claim cites the page it came from. Items marked **[UNVERIFIED]** could not be confirmed in official docs. Items marked **[SOURCE]** were confirmed only in `openai/codex` source code at commit `18344a9` (2026-09-27).

Doc URL notes:
- Cursor canonical pages are now `cursor.com/docs/<topic>`. The older `cursor.com/docs/context/*` URLs redirect there. `cursor.com/docs/context/commands` now serves the Skills page, and there is no standalone Commands page any more.
- Codex docs moved from `developers.openai.com/codex` to `learn.chatgpt.com/docs/*`. The index is https://developers.openai.com/codex/llms.txt.
- Claude Code docs live at `code.claude.com/docs/en/*`. `slash-commands` serves the same page as `skills`.

---

## 1. Capability matrix

| Capability | Cursor | Claude Code | Codex CLI |
|---|---|---|---|
| **Skills** | **Paths:** `.agents/skills/`, `.cursor/skills/`, `~/.agents/skills/`, `~/.cursor/skills/`.<br>**Compat paths:** `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/`, `~/.codex/skills/`.<br>**Discovery:** walks the skills root recursively, so category folders are fine. Identity comes from the folder that directly contains `SKILL.md`. Nested `.cursor/skills` or `.agents/skills` anywhere in the repo are picked up and auto-scoped to that subtree.<br>**Frontmatter:** `name` (required, must match the folder), `description` (required), `paths` (legacy `globs` also accepted), `disable-model-invocation`, `icon`, `color`, `metadata`.<br>**Source:** https://cursor.com/docs/skills | **Paths:** `.claude/skills/<name>/SKILL.md`, `~/.claude/skills/<name>/SKILL.md`, enterprise managed dir, nested `<subdir>/.claude/skills/` (loads lazily), `--add-dir`, plugin `skills/`.<br>**Discovery:** walks parent dirs up to the repo root. Symlinked skill folders are supported and deduped.<br>**Frontmatter:** all fields optional, `description` recommended. Fields: `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility`.<br>**Body:** substitutions such as `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`, and `` !`cmd` `` injection.<br>**Source:** https://code.claude.com/docs/en/skills | **Documented paths:** `.agents/skills` in every dir from CWD up to the repo root, `~/.agents/skills`, `/etc/codex/skills`, and bundled system skills. Symlinks are followed.<br>**[SOURCE] also reads:** project `<repo>/.codex/skills` (project config layer) and deprecated `~/.codex/skills`. Scan is recursive with max depth 6 (`ext/skills/src/host_roots.rs`, `loader/mod.rs`).<br>**Frontmatter:** `name` and `description` required. Only `name`, `description` and `metadata.short-description` are parsed ([SOURCE] `skills/src/parser.rs`).<br>**Metadata file:** optional `agents/openai.yaml` with `interface.*`, `policy.allow_implicit_invocation`, and `dependencies.tools` (MCP).<br>**Disable a skill:** `[[skills.config]] path=… enabled=false` in `~/.codex/config.toml`.<br>**Invocation:** `$name` or `/skills`.<br>**Source:** https://learn.chatgpt.com/docs/build-skills |
| **Subagents** | **Paths:** `.cursor/agents/`, `.claude/agents/`, `.codex/agents/`, and the same three under `~/`.<br>**Precedence:** project beats user. `.cursor/` beats `.claude/` and `.codex/`.<br>**Format:** Markdown with YAML frontmatter; the body is the prompt.<br>**Frontmatter (all optional):** `name` (defaults to the filename), `description`, `model` (`inherit` \| model id \| `id[effort=…,context=…]`), `readonly`, `is_background`.<br>**Tools:** there is no `tools` field. Subagents inherit all parent tools, including MCP.<br>**Source:** https://cursor.com/docs/subagents | **Paths:** `.claude/agents/` (walks up to the repo root, scanned recursively; subfolders don't affect identity), `~/.claude/agents/`, managed, `--agents` JSON, plugin `agents/`.<br>**Format:** Markdown with YAML frontmatter; the body is the system prompt.<br>**Required:** `name` and `description`. Files missing them are skipped silently.<br>**Optional:** `tools`, `disallowedTools`, `model` (`sonnet\|opus\|haiku\|fable\|<id>\|inherit`), `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `omitClaudeMd`, `effort`, `isolation: worktree`, `color`, `initialPrompt`, `experimental.cacheTtl`.<br>**Source:** https://code.claude.com/docs/en/sub-agents | **Paths:** `.codex/agents/*.toml` (project) and `~/.codex/agents/*.toml`. **TOML, not Markdown.**<br>**Required:** `name`, `description`, `developer_instructions`.<br>**Optional:** any `config.toml` key, e.g. `model`, `model_reasoning_effort`, `sandbox_mode` (`read-only`…), `mcp_servers`, `skills.config`.<br>**Global settings:** `[agents]` in config.toml (`enabled`, `max_concurrent_threads_per_session`, `default_subagent_model`, …).<br>**Built-ins:** `default`, `worker`, `explorer`. A custom agent with the same name overrides the built-in.<br>**Source:** https://learn.chatgpt.com/docs/agent-configuration/subagents |
| **Commands** | **Paths:** `.cursor/commands/*.md` and `~/.cursor/commands/`, plus Team commands from the dashboard. Documented only in the hutchic mirror (https://github.com/hutchic/.cursor/blob/main/docs/cursor-commands.md) and the plugin reference. The official standalone page is gone.<br>**Plugin commands:** `.md/.mdc/.markdown/.txt` with optional `name` and `description` (https://cursor.com/docs/reference/plugins).<br>**Migration:** `/migrate-to-skills` turns commands into skills with `disable-model-invocation: true` (https://cursor.com/docs/skills). | **Paths:** `.claude/commands/*.md` is the "older format, still works". It takes the same frontmatter as skills except `name` and `paths`. Subdirectories give `/dir:file` names. If a skill has the same name, the skill wins.<br>**Source:** https://code.claude.com/docs/en/skills | **Custom prompts are deprecated; use skills instead.**<br>**Paths:** `~/.codex/prompts/*.md` only (user-level, top level only, no project scope).<br>**Frontmatter:** `description`, `argument-hint`.<br>**Invocation:** `/prompts:<name>`.<br>**Placeholders:** `$1..$9`, `$ARGUMENTS`, `$NAMED`.<br>**Source:** https://learn.chatgpt.com/docs/custom-prompts |
| **Rules / always-on instructions** | **Paths:** `.cursor/rules/**/*.mdc`. **`.mdc` is required; a plain `.md` in `.cursor/rules` is ignored.**<br>**Frontmatter:** `description`, `globs` (comma-separated), `alwaysApply`. These give four modes: Always / file-glob / Intelligent / Manual (`@rule`). Keep rules under 500 lines.<br>**Also:** User rules (settings) and Team rules (dashboard). Precedence is Team, then Project, then User.<br>**Source:** https://cursor.com/docs/rules | **Paths:** `.claude/rules/**/*.md` (recursive, symlinks OK) and `~/.claude/rules/`.<br>**Frontmatter:** only `paths` (YAML list or comma-separated globs) is read. Other fields are silently ignored. A rule with no `paths` loads unconditionally.<br>**Source:** https://code.claude.com/docs/en/memory | **No equivalent for instructions.** Codex "rules" are exec-policy: Starlark-like `prefix_rule(pattern, decision, justification, match, not_match)` in `<layer>/rules/*.rules` (e.g. `~/.codex/rules/default.rules`, `<repo>/.codex/rules/`, trusted projects only). Experimental.<br>**Source:** https://learn.chatgpt.com/docs/agent-configuration/rules |
| **Root instructions file** | **`AGENTS.md`:** root and nested; nested files merge, more specific wins (https://cursor.com/docs/rules).<br>**`CLAUDE.md`:** root file is read like AGENTS.md and **always applied** (https://cursor.com/help/customization/rules). The CLI reads both `AGENTS.md` and `CLAUDE.md` at the root (https://cursor.com/docs/cli/using). | **Files:** `CLAUDE.md` or `.claude/CLAUDE.md`, plus `CLAUDE.local.md` and `~/.claude/CLAUDE.md`.<br>**Imports:** `@path` imports, relative to the importing file, up to 4 hops deep.<br>**Size:** target under 200 lines.<br>**`AGENTS.md`:** read natively (v2.1.277+) **only when no CLAUDE.md or CLAUDE.local.md exists** at or above CWD. Setting `claude-md-and-agents-md` loads both. `.agents/` and `AGENTS.override.md` are not read. The recommended share pattern is `CLAUDE.md` containing `@AGENTS.md`.<br>**Source:** https://code.claude.com/docs/en/memory | **Files:** `AGENTS.override.md` or `AGENTS.md` in `~/.codex`, then in each dir from the repo root down to CWD, concatenated root-first.<br>**Size cap:** `project_doc_max_bytes` of 32 KiB by default.<br>**CLAUDE.md:** not read by default, but can be added via `project_doc_fallback_filenames`.<br>**Imports:** no `@import` syntax is documented.<br>**Source:** https://learn.chatgpt.com/docs/agent-configuration/agents-md |
| **MCP** | **Paths:** `.cursor/mcp.json` and `~/.cursor/mcp.json`.<br>**Top-level key:** `mcpServers`.<br>**stdio entry:** `command`, `args`, `env`, `envFile`, optional `type: "stdio"`.<br>**Remote entry:** `url`, `headers`, `auth{CLIENT_ID,CLIENT_SECRET,scopes}`. `type` is not needed.<br>**Interpolation:** `${env:NAME}`, `${userHome}`, `${workspaceFolder}`, `${workspaceFolderBasename}`, `${/}`.<br>**Root `.mcp.json`:** not mentioned.<br>**Source:** https://cursor.com/docs/mcp | **Paths:** `.mcp.json` at the project root (needs a per-user approval prompt), `~/.claude.json`, and plugin `.mcp.json`.<br>**Top-level key:** `mcpServers`.<br>**`type`:** `stdio` (the default when there is no `type`), `http` (alias `streamable-http`), `sse`, `ws`. **An entry with `url` but no `type` is rejected.**<br>**Interpolation:** `${VAR}` and `${VAR:-default}` in `command`, `args`, `env`, `url`, `headers`.<br>**Other:** per-server `timeout` in ms.<br>**Source:** https://code.claude.com/docs/en/mcp | **Paths:** `[mcp_servers.<name>]` tables in `~/.codex/config.toml` or project `.codex/config.toml` (**trusted projects only**).<br>**stdio entry:** `command`, `args`, `env`, `env_vars` (forwarded vars), `cwd`.<br>**Streamable HTTP entry:** `url`, `bearer_token_env_var`, `http_headers`, `env_http_headers`, `http_headers_helper`, `auth`.<br>**Common options:** `startup_timeout_sec`, `tool_timeout_sec`, `enabled`, `required`, `enabled_tools`, `disabled_tools`, `default_tools_approval_mode`.<br>**Not listed:** SSE or ws transports.<br>**Source:** https://learn.chatgpt.com/docs/extend/mcp |
| **Hooks** | **Paths:** `.cursor/hooks.json` and `~/.cursor/hooks.json`, plus MDM and Team.<br>**Schema:** `{version:1, hooks:{<camelCaseEvent>:[{command,type,timeout,matcher,failClosed,loop_limit}]}}`.<br>**Events:** `preToolUse`, `postToolUse`, `beforeShellExecution`, `beforeSubmitPrompt`, `stop`, `sessionStart`, …<br>**Exit code:** 2 blocks.<br>**Source:** https://cursor.com/docs/hooks<br>**Claude hooks:** **also loads Claude Code hooks** from `.claude/settings.local.json`, `.claude/settings.json` and `~/.claude/settings.json`, mapping event names. Controlled by the "Include Third-Party Plugins, Skills, and Other Configs" setting, which is on by default (https://cursor.com/docs/reference/third-party-hooks). | **Paths:** a `hooks` key in `~/.claude/settings.json`, `.claude/settings.json` or `.claude/settings.local.json`, or managed settings. Also plugin `hooks/hooks.json`, and skill or subagent frontmatter `hooks`.<br>**Shape:** `{hooks:{PascalCaseEvent:[{matcher, hooks:[{type:"command"\|"prompt"\|"agent"\|…, command}]}]}}`.<br>**Source:** https://code.claude.com/docs/en/hooks | **Paths:** `~/.codex/hooks.json`, `<repo>/.codex/hooks.json`, or inline `[hooks]` in `config.toml`, plus plugin `hooks/hooks.json`.<br>**Shape:** Claude-like, `{hooks:{PreToolUse:[{matcher, hooks:[…]}]}}`. Events: `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Pre/PostCompact`, `UserPromptSubmit`, `SessionStart`, `SubagentStart/Stop`, `Stop`.<br>**Trust:** project hooks need the project to be trusted, and every hook needs hash-based trust review via `/hooks`.<br>**Source:** https://learn.chatgpt.com/docs/hooks |
| **Plugins (distribution)** | **Manifest:** `.cursor-plugin/plugin.json` (only `name` required), plus `.cursor-plugin/marketplace.json` for multi-plugin repos.<br>**Components:** `rules/`, `skills/`, `agents/`, `commands/`, `hooks/hooks.json`, `mcp.json`. Setting a manifest path replaces folder discovery for that component.<br>**Agent Plugins:** also loads the Agent Plugins standard (root `plugin.json`).<br>**Variables:** expands `${CURSOR_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_ROOT}`.<br>**Team marketplace:** import from a GitHub repo.<br>**Sources:** https://cursor.com/docs/plugins, https://cursor.com/docs/reference/plugins | **Manifest:** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.<br>**Components:** `skills/`, `agents/`, `commands/` (legacy), `hooks/hooks.json`, `.mcp.json`, LSP, `output-styles/`, `bin/`, default settings.<br>**Instructions:** **a plugin cannot ship a CLAUDE.md or rules**, so instructions must be written as skills.<br>**Namespacing:** skills are `/plugin:skill`.<br>**Plugin agents ignore:** `permissionMode`, `hooks`, `mcpServers`, `initialPrompt`.<br>**Sources:** https://code.claude.com/docs/en/plugins, https://code.claude.com/docs/en/plugins/components | **Manifest:** root `plugin.json` (Agent Plugins schema, with OpenAI extras under `extensions.com.openai`). `.codex-plugin/plugin.json` is a compatibility fallback.<br>**Components:** `skills/`, `mcp.json`, hooks, assets.<br>**Marketplace:** `$REPO_ROOT/.agents/plugins/marketplace.json` or `~/.agents/plugins/marketplace.json`, or `codex plugin marketplace add owner/repo`.<br>**[SOURCE]:** the marketplace loader also accepts `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json` (`core-plugins/src/marketplace.rs`).<br>**Source:** https://developers.openai.com/plugins/build/plugins |

---

## 2. Cross-tool path reading (drives deduplication)

| Artifact location | Cursor reads? | Claude Code reads? | Codex reads? |
|---|---|---|---|
| `.agents/skills/` | Yes, native (https://cursor.com/docs/skills) | **No.** "anything under a `.agents/` directory" is not read for instructions (https://code.claude.com/docs/en/memory); skills docs list only `.claude/skills` | Yes, native and documented |
| `.claude/skills/` | Yes, compat (on by default) | Yes, native | No (not documented, not in the source root list) |
| `.codex/skills/` | Yes, compat | No | [SOURCE] yes as a project-layer root, only in trusted projects. Not in the docs. |
| `.cursor/skills/` | Yes, native | No | No |
| `.claude/agents/*.md` | Yes, compat; `.cursor/agents` wins on name clash | Yes, native | No |
| `.codex/agents/` | Yes, compat, documented as Markdown | No | Yes, native, **TOML**. **[UNVERIFIED]** how Cursor treats `.toml` files here. |
| `.claude/commands/` | **[UNVERIFIED]**, not documented | Yes, legacy | No |
| `.cursor/rules/*.mdc` | Yes | No. `/init` and `/import` can convert them one-time (https://code.claude.com/docs/en/memory) | No |
| `.claude/rules/*.md` | **[UNVERIFIED]**, not documented | Yes | No |
| `AGENTS.md` (root and nested) | Yes | Yes, only if no `CLAUDE.md` exists, or via `@AGENTS.md` import | Yes |
| `CLAUDE.md` | Yes, always applied (help center and CLI docs). **[UNVERIFIED]** whether Cursor expands `@path` imports in it. | Yes | No, unless listed in `project_doc_fallback_filenames` |
| `.claude/settings.json` hooks | Yes, mapped (third-party import setting) | Yes | No |
| `.mcp.json` (root) | **[UNVERIFIED]**, not documented; docs list only `.cursor/mcp.json` | Yes | No; uses `config.toml` |
| `.cursor/mcp.json` | Yes | No | No |
| `.claude-plugin/marketplace.json` | [UNVERIFIED] | Yes | [SOURCE] yes |

**What this means for deduplication (facts only):**
- No single skills directory is read by all three tools. `.claude/skills` covers Cursor and Claude. `.agents/skills` covers Cursor and Codex.
- Cursor reads both, so shipping the same skill in both places makes Cursor see it twice. Cursor documents no precedence or dedup rule for skills (https://cursor.com/docs/skills). The hutchic doc claims a priority order, but the official page does not state one.
- Claude Code dedupes skills when several locations symlink to the same target (https://code.claude.com/docs/en/skills). Codex follows symlinks (https://learn.chatgpt.com/docs/build-skills). **[UNVERIFIED]** how Cursor handles symlinks or duplicate `name` values.
- Codex does not merge same-name skills: "both can appear in skill selectors" (https://learn.chatgpt.com/docs/build-skills).
- For subagents, a `.claude/agents/*.md` file is consumed by both Cursor and Claude. Codex needs a separate TOML file.
- For root instructions, `AGENTS.md` is read by all three. Claude reads it only if no `CLAUDE.md` exists, or if `CLAUDE.md` imports it with `@AGENTS.md`. Cursor also reads `CLAUDE.md` as always-on, so content in both files can be applied twice in Cursor. **[UNVERIFIED]** whether Cursor dedupes that.

---

## 3. Frontmatter portability

### Skills (`SKILL.md`)

**Agent Skills standard fields** (https://agentskills.io/specification):

| Field | Constraint |
|---|---|
| `name` | Required. 1–64 chars, `[a-z0-9-]`, no leading, trailing or double hyphen, must match the parent dir |
| `description` | Required. 1–1024 chars |
| `license` | Optional |
| `compatibility` | Optional. Up to 500 chars |
| `metadata` | Optional. Map of string to string |
| `allowed-tools` | Optional. Space-separated, experimental |

**Other fields and their support:**

| Field | Cursor | Claude Code | Codex |
|---|---|---|---|
| `disable-model-invocation` | Yes (explicit `/name` only) | Yes | **Ignored.** The equivalent is `agents/openai.yaml` → `policy.allow_implicit_invocation: false` |
| `user-invocable` | Not in the public docs. A Cursor developer confirmed (2026-10-05): supported in the Cursor CLI, not yet in the IDE | Yes (hides the skill from the `/` menu) | No |
| `paths` | Yes (`globs` is legacy) | Yes | No |
| `argument-hint`, `arguments`, `when_to_use`, `model`, `effort`, `context`, `agent`, `background`, `hooks`, `shell`, `disallowed-tools` | No | Claude only | No |
| `icon`, `color` | Cursor only (Custom Mode badge) | No | No |
| `metadata.short-description` | No | No | Read by Codex ([SOURCE] parser.rs) |

**What each tool does with unknown fields:**
- **Claude Code** "ignores a field it doesn't recognize without reporting an error" (https://code.claude.com/docs/en/skills). Uploading to claude.ai or the Skills API is stricter: any field outside `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` is a **hard error**.
- **Codex** parses only `name`, `description` and `metadata.short-description`. There is no `deny_unknown_fields`, so other keys are silently ignored ([SOURCE] `codex-rs/skills/src/parser.rs`). Codex also repairs unquoted colons in scalar values.
- **Cursor**: **[UNVERIFIED]**, not documented. Unrecognized `icon` and `color` values fall back to defaults, and `metadata` is the documented place for extra data.
- **The standard's client guide** recommends lenient loading: warn if the name doesn't match the dir, skip if the description is missing (https://agentskills.io/client-implementation/adding-skills-support).

**Name and description constraints that differ:**
- **Claude Code** truncates `description` plus `when_to_use` at 1,536 chars in the skill listing.
- **Codex** caps the initial skill list at 2% of the context window (or 8,000 chars) and shortens descriptions first (https://learn.chatgpt.com/docs/build-skills).
- **Cursor** requires `name` to equal the folder name.
- **Claude Code** falls back to the directory name when `name` is absent.

### Subagents

| Aspect | Cursor | Claude Code | Codex |
|---|---|---|---|
| File format | `.md` | `.md` | `.toml` |
| Required fields | None | `name`, `description` | `name`, `description`, `developer_instructions` |
| Where the prompt lives | Body | Body | `developer_instructions` |
| Tool-specific fields | `readonly`, `is_background` | `tools`, `disallowedTools`, `permissionMode`, `color`, `skills`, `mcpServers`, `memory`, `isolation`, … | `sandbox_mode`, `model_reasoning_effort`, `mcp_servers` |

- **Shared fields:** `name`, `description` and `model` are common to all three, but the `model` values are tool-specific.
- **Unknown fields:** Claude ignores them silently (https://code.claude.com/docs/en/sub-agents). Cursor behavior is **[UNVERIFIED]**.
- **Read-only mapping:** Cursor `readonly: true` ≈ Claude `tools`/`permissionMode: plan` ≈ Codex `sandbox_mode = "read-only"`. These are semantically similar, not identical.

### Rules

| Aspect | Cursor `.mdc` | Claude `.claude/rules/*.md` |
|---|---|---|
| Frontmatter | `description`, `globs`, `alwaysApply` | `paths` only |
| Unknown keys | [UNVERIFIED] | Ignored |
| No-frontmatter behavior | A plain `.md` file is ignored entirely | Loads always |

- **Mapping:**
  - Cursor `alwaysApply: true` ≈ Claude rule with no `paths` ≈ Codex/Cursor/Claude `AGENTS.md`.
  - Cursor `globs` ≈ Claude `paths`.
  - Cursor "Apply Intelligently" (description only) has no Claude rule equivalent. It is closest to a skill.
- **Codex** has no conditional-instruction mechanism besides nested `AGENTS.md`.

---

## 4. Key takeaways from hutchic/.cursor

Source: https://github.com/hutchic/.cursor, cloned and inspected 2026-09-27.

- **Layout:** `.agents/skills/` is the canonical store for cross-tool skills. `.claude/skills/*`, `.codex/skills/*`, `.opencode/skills/*` and `.github/skills/*` are **relative symlinks** (`../../.agents/skills/<name>`) to it.
- **Cursor-only artifacts** live in `.cursor/{rules,skills,commands,agents,templates}`.
- **No generator:**
  - Cross-tool sharing is symlink-only. There is no format translation, and no subagents, rules or MCP are shared across tools.
  - Distribution to other projects is `scripts/install-self-improvement.sh`, which **copies** files (no symlinks) into a target `.cursor/`.
  - The `Makefile` only verifies that directories exist.
- **Anti-pattern observed:** many `.cursor/skills/*` entries are **absolute symlinks** to `/home/hutchic/...` and `/tmp/...` paths, which are broken for anyone else.
- **Third-party skill provenance** is tracked in `skills-lock.json` and `.agents/.skill-lock.json`, written by the skills.sh CLI (`npx skills add/find/check/update`). Entries record source repo, path, hash and timestamps.
- **Docs claims:**
  - `docs/cursor-skills.md` labels `.claude/skills` and `.codex/skills` as "legacy" compat paths.
  - It lists a skills priority order that the official Cursor page does not state.
  - It predates `.agents/skills` being documented by Cursor.
- **Design principle:** the "Automation Decomposition Rule". Rules hold the what and why, skills the how, commands the when and order. Split automations into skills first, then compose them in commands (https://github.com/hutchic/.cursor/blob/main/docs/cursor-commands.md). Skills should be decomposable and not tied to one workflow.
- **Cursor commands per hutchic:** `.cursor/commands` (project), `~/.cursor/commands` (global), and Team commands. Plain Markdown, no frontmatter, trailing text is appended as context.

---

## 5. Current-repo observations relevant to the refactor

These are facts found while researching, not a design.
- **Missing generated files:** `CLAUDE.md` and `.cursor/rules/cursor-instructions.md` describe `scripts/sync-claude.sh`, a generated `.claude/`, and `.mcp.json`. **None of these exist** in the working tree or in git history. `scripts/` contains only `count-skills.sh`.
- **Wrong MCP key:** `.cursor/mcp.json` uses the top-level key **`servers`**, which is VS Code/Copilot style. Cursor documents only `mcpServers` (https://cursor.com/docs/mcp). **[UNVERIFIED]** whether Cursor tolerates `servers`.
- **Rule file ignored by Cursor:** `.cursor/rules/cursor-instructions.md` is a plain `.md` file, which the Cursor rules system ignores (https://cursor.com/docs/rules). It currently reaches Claude only through the `@` import in `CLAUDE.md`.
- **Category folders:** skills are nested under category folders (`.cursor/skills/{agents,commands,workflows,internal}/tsh-*`).
  - Cursor recurses, so this works there.
  - Codex recurses up to depth 6 ([SOURCE]).
  - Claude Code documents only `.claude/skills/<skill-name>/SKILL.md`, so it needs a flat layout. **[UNVERIFIED]** whether Claude discovers category-nested skills; not documented.
- **Agent personas:** "agents" are implemented as skills, not as `.cursor/agents/*.md` subagents. Each tool's subagent format differs (section 3).
- **MCP config differences across tools:**
  - MCP server names contain dots (e.g. `awslabs.aws-api-mcp-server`). In Codex TOML these need quoted keys: `[mcp_servers."awslabs.aws-api-mcp-server"]`. **[UNVERIFIED]** whether Codex accepts dots in server names.
  - HTTP entries (`figma`, `atlassian`) already set `type: "http"`, which Claude requires.

---

## 6. Open questions / unverified points

1. How Cursor resolves duplicate skill names across `.cursor/skills`, `.agents/skills`, `.claude/skills` and `.codex/skills`: first-wins, both shown, or dedupe by path or symlink.
2. Whether Cursor follows symlinked skill or agent folders.
3. What Cursor does with unknown `SKILL.md`, subagent and `.mdc` frontmatter keys.
4. Whether Cursor expands `@path` imports inside `CLAUDE.md` and `AGENTS.md`, and whether it double-applies content when both files exist.
5. Whether Cursor reads `.claude/commands/`, `.claude/rules/` or root `.mcp.json`. The "Third-Party Imports" setting is named for "Plugins, Skills, and Other Configs", but only hooks, skills and agents are documented.
6. Whether Cursor attempts to parse Codex `.toml` files under `.codex/agents/`.
7. Whether `.cursor/commands/` remains supported long-term. The official page was removed and `/migrate-to-skills` exists, but the plugin reference still lists `commands/`.
8. Codex project `.codex/skills` support is source-only (undocumented) and trust-gated. The docs point only to `.agents/skills`.
9. Whether Claude Code supports the Agent Plugins standard (agent-plugins.org). Its steering committee lists Amazon, Cursor, Microsoft, OpenAI and Vercel, not Anthropic (https://agent-plugins.org). No mention was found in the Claude docs.
10. Codex subagent `name` charset: the examples use underscores (`pr_explorer`). Whether hyphenated `tsh-*` names are valid is not stated.
11. Whether Codex skill `description` has a hard length limit. None was found in the parser; only `name` is capped at 64.
12. Cursor subagents on legacy request-based plans without Max Mode ignore `model` and run on Composer (https://cursor.com/docs/subagents). This may matter for the persona model hints.
