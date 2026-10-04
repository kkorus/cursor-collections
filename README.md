<h1 align="center">TSH AI Collections</h1>

<p align="center">
  Opinionated AI setup for <b>Cursor</b>, <b>Claude Code</b> and <b>Codex</b> that covers the <b>full product development lifecycle</b> – from product ideation, through development, to quality assurance.
</p>

<p align="center">
  <b>Product Ideation → Development → Quality – one toolchain, end to end.</b>
</p>

---

## What This Repo Provides

One neutral source (`src/`) is rendered into the native format of each tool: 16 slash commands, 3 orchestrators, 17 subagents, 41 knowledge skills and 11 MCP server definitions. The content is the same in every tool.

### Product Ideation – Requirements & Planning

- **Commands** – `/tsh-explore-materials`, `/tsh-analyze-materials`
- **Orchestrator** – `tsh-business-analyst` (delegates to 5 internal BA worker subagents)
- **Skills** – `tsh-analyzing-requirements`, `tsh-processing-transcripts`, `tsh-extracting-tasks`, `tsh-reviewing-task-quality`, `tsh-formatting-jira-tasks`, `tsh-guarding-jira-statuses`

### Development – Architecture & Implementation

- **Commands** – `/tsh-implement` (research, planning, implementation and review in one flow), `/tsh-refactor`, `/tsh-debug`, `/tsh-ask`
- **Orchestrator** – `tsh-engineering-manager`
- **Subagents** – `tsh-context-engineer`, `tsh-architect`, `tsh-software-engineer`, `tsh-prompt-engineer`, `tsh-devops-engineer`
- **Skills** – `tsh-designing-architecture`, `tsh-discovering-technical-context`, `tsh-analyzing-implementation-gaps`, `tsh-analyzing-codebase`, `tsh-implementing-frontend`, `tsh-implementing-backend`, `tsh-designing-databases` and more (see [Knowledge skills](#knowledge-skills-41))

### Quality – Review & Testing

- **Commands** – `/tsh-review`, `/tsh-review-ui`, `/tsh-audit-codebase`
- **Subagents** – `tsh-code-reviewer`, `tsh-ui-reviewer`, `tsh-e2e-engineer`, `tsh-plan-reviewer`
- **Skills** – `tsh-reviewing-code`, `tsh-verifying-ui`, `tsh-writing-e2e-tests`, `tsh-reviewing-plans`, `tsh-reviewing-frontend`

### Infrastructure

- **Commands** – `/tsh-audit-infrastructure`, `/tsh-analyze-cloud-costs`
- **Subagent** – `tsh-devops-engineer`
- **Skills** – `tsh-delivering-infrastructure`, `tsh-implementing-terraform-modules`, `tsh-implementing-kubernetes`, `tsh-implementing-ci-cd`, `tsh-implementing-observability`, `tsh-managing-secrets`, `tsh-optimizing-cloud-cost`, `tsh-designing-multi-cloud-architecture`

### Developer Utilities

- **Commands** – `/tsh-commit` ([Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) with mandatory approval before `git commit`)

### AI Customization – Extending the Toolchain

- **Commands** – `/tsh-create-custom-agent`, `/tsh-create-custom-skill`, `/tsh-create-custom-command`, `/tsh-create-custom-rules`
- **Orchestrator** – `tsh-ai-customization-orchestrator` (delegates to 3 internal subagents: researcher, creator, reviewer)
- **Skills** – `tsh-creating-agents`, `tsh-creating-skills`, `tsh-creating-commands`, `tsh-creating-rules`, `tsh-migrating-copilot-customizations`

### MCP integrations

Atlassian, Figma, Context7, Playwright, Sequential Thinking, PDF Reader, AWS (API, documentation) and GCP (gcloud, observability, storage).

---

> **Why the `tsh-` prefix?** All artifacts use the `tsh-` prefix (e.g., `/tsh-implement`, `tsh-architect`) to avoid naming collisions with your own project-specific skills and rules. You can use this alongside your own customizations without renaming anything.

---

## Installation

Supported tools: Cursor, Claude Code and Codex. Requires Node.js (see `.nvmrc`).

```bash
git clone https://github.com/kkorus/cursor-collections ~/ai-collections
cd ~/ai-collections
npm ci

# Preview first, then install for the tools you use
node scripts/install.mjs --tools cursor,claude,codex --dry-run
node scripts/install.mjs --tools cursor,claude,codex
```

Pick only the tools you use with `--tools` (comma list of `cursor`, `claude`, `codex`).

| Option | Meaning |
|--------|---------|
| `--scope user` (default) | Install into your home directory (all workspaces) |
| `--scope project [--project-dir <dir>]` | Install into one project |
| `--mode copy` (default) / `--mode link` | Copy files, or symlink to the clone so `git pull` updates it (Windows: symlinks need Developer Mode or admin rights; prefer copy) |
| `--update` | Reinstall the tools recorded in the manifests and prune `tsh-*` entries that no longer exist; unedited copies (checksum in the manifest) are replaced without a backup, edited ones are backed up first |
| `--dry-run` | Print what would happen and change nothing (grouped by folder) |
| `--verbose`, `-v` | One line per entry instead of grouped summaries |
| `--force` | Replace an unmanaged `tsh-*` entry (moved to the backup first) |

What is installed where:

| Tool | Skills | Subagents |
|------|--------|-----------|
| Cursor | `.agents/skills/` | `.cursor/agents/` |
| Claude Code | `.claude/skills/` | `.claude/agents/` |
| Codex | `.agents/skills/` | `.codex/agents/` |

Which skill tree is written depends on the tool combination: with `--tools cursor,claude` only `.claude/skills` is written (Cursor reads it), and both trees are written only for claude+codex or all three (see [Installation](website/docs/getting-started/installation.md) for the full table). Cursor also reads `.claude/skills`. When both trees are installed, Cursor dedupes by name and a same-name skill resolves to `.claude/skills`. If skills show up twice, turn off **Settings > Include Third-Party Plugins, Skills, and Other Configs**; Cursor then reads `.agents/skills` and `.cursor/agents` natively.

Importing the repository as a Remote Rule (GitHub) in Cursor is **not verified** for the new layout, so it is not a supported install path.

To update later: `git pull`, then `node scripts/install.mjs --update` (not needed with `--mode link`, except to prune removed entries).

The installer never writes MCP configuration. It prints which generated file to merge for each tool (see below). Backups go to `~/.tsh-ai-collections-backup/<timestamp>/`.

### Upgrading from Cursor Collections

The structure and many names changed in this release (a breaking release, no aliases). The installer removes the old `.cursor/skills/tsh-*` layout for you (symlinks are removed, real directories are backed up) before every install. Run `node scripts/install.mjs --migrate-legacy --dry-run` to see what it would do. See [Upgrading](website/docs/getting-started/upgrading.md) for the manual equivalent and the [CHANGELOG](CHANGELOG.md) for the old-to-new name table.

---

## MCP Server Configuration

To unlock the full workflow (Jira, Figma, code search, browser automation), configure MCP servers. The source is `src/mcp/servers.json`; the generated files are:

| Tool | Generated file in this repo | Merge into (user scope) | Merge into (project scope) |
|------|-----------------------------|-------------------------|----------------------------|
| Cursor | `.cursor/mcp.json` | `~/.cursor/mcp.json` | `<project>/.cursor/mcp.json` |
| Claude Code | `.mcp.json` | `~/.claude.json` (`mcpServers`) | `<project>/.mcp.json` |
| Codex | `.codex/config.toml` | `~/.codex/config.toml` | `<project>/.codex/config.toml` |

These target paths are the ones the installer prints. The user-scope paths for Claude Code and Codex are **not yet verified** by a smoke test.

| MCP | Purpose |
|-----|---------|
| **Atlassian** | Jira and Confluence access for `/tsh-implement`, `/tsh-review` and the BA flow |
| **Figma** | Pull design details for UI implementation and verification |
| **Context7** | Semantic search in external docs and knowledge bases |
| **Playwright** | Browser automation for UI verification and E2E tests |
| **Sequential Thinking** | Advanced reasoning for complex problem analysis |
| **AWS / GCP** | Infrastructure audit and cost optimization |
| **PDF Reader** | Extract content from PDF documents |

---

## How to Use

### Invocation syntax

| | Cursor | Claude Code | Codex |
|---|--------|-------------|-------|
| Run a command | `/tsh-implement PROJ-123` in Agent chat (tested in cursor-agent CLI; IDE not yet verified) | `/tsh-implement PROJ-123` | not yet verified |
| Pass arguments | text after the command name | text after the command name (appended as `ARGUMENTS:`) | not yet verified |
| Use a subagent directly | "Use the tsh-architect subagent" (tested in cursor-agent CLI; IDE not yet verified) | `@agent-tsh-architect`, or start a session with `claude --agent tsh-architect` | not yet verified |
| Knowledge skills, orchestrators, internal steps | loaded by name by the agent; not meant for manual use (Cursor cannot hide them from its menu) | same; hidden from the `/` menu, so it lists exactly the 16 commands | not yet verified |

Commands are thin entry points. Each routes to a subagent or an orchestrator, which loads knowledge skills by name. Subagents are leaf workers: they never start other subagents. Hand-offs between commands are text suggestions ("Suggested next steps"), never automatic.

Claude Code: typing the name of a hidden skill (for example `tsh-implement-task`) after `/` runs nothing; use the commands.

**What should I type?** Only commands (`/tsh-...`). For example `/tsh-debug` to fix a bug: it runs the method from the `tsh-debugging` knowledge skill, which you never type yourself. A situation-to-command table is in [Which Command Do I Use?](website/docs/getting-started/which-command.md).

### Commands

| Command | What it does |
|---------|--------------|
| `/tsh-implement <task-id \| description>` | Full cycle: context, plan, plan review, implementation, UI verification, code review |
| `/tsh-refactor` | Atomic, step-by-step refactoring plan; each step keeps tests green |
| `/tsh-debug` | Reproduce, isolate the root cause, fix, verify with regression tests |
| `/tsh-ask` | Research a question and save the answer as an ADR in `specifications/decisions/` |
| `/tsh-review` | Structured code review (PASS / BLOCKER / SUGGESTION) |
| `/tsh-review-ui` | Compare the running app (Playwright) against Figma |
| `/tsh-audit-codebase` | Whole-repository audit; writes `code-quality-report.md` |
| `/tsh-audit-infrastructure` | Infrastructure audit |
| `/tsh-analyze-cloud-costs <aws\|gcp> <profile\|project> <region>` | Cloud cost analysis |
| `/tsh-explore-materials` | Optional exploration of ambiguous workshop inputs |
| `/tsh-analyze-materials` | Workshop materials to a Jira-ready backlog |
| `/tsh-commit` | Conventional Commits message proposal; commits only after you approve |
| `/tsh-create-custom-agent`, `/tsh-create-custom-skill`, `/tsh-create-custom-command`, `/tsh-create-custom-rules` | Research, design, create and review a customization artifact |

### New feature from a Jira ticket

```
/tsh-implement PROJ-123
```

1. Context Engineer gathers requirements from Jira, Confluence, Figma
2. You review the research document and confirm
3. Architect creates a step-by-step implementation plan
4. Plan Reviewer validates the plan and returns it if BLOCKERs are found (up to 3 iterations)
5. You review the plan and the review report and approve
6. Software Engineer implements phase by phase
7. UI tasks: each component is verified against Figma, up to 5 fix iterations
8. Code Reviewer runs the final quality check

### New feature from a description (no Jira)

```
/tsh-implement Add OAuth2 login with Google, using existing NestJS auth module
```

Same flow, but context comes from your codebase instead of Jira.

### Code review and UI verification

```
/tsh-review PROJ-123
/tsh-review Review the recent changes to the payment module
/tsh-review-ui
```

### Workshop transcript to Jira backlog

```
/tsh-explore-materials [paste transcript or attach materials]
/tsh-analyze-materials [paste transcript or attach file]
```

The Business Analyst orchestrator optionally explores context, drafts an intent brief (Gate 0), cleans the transcript, extracts epics and user stories (Gate 1), runs a Lite or Full quality review (Gate 1.5), formats for Jira (Gate 2), verifies Jira after sync and refreshes the project baseline.

### Infrastructure and cloud costs

```
/tsh-audit-infrastructure
/tsh-analyze-cloud-costs aws default eu-west-1
/tsh-analyze-cloud-costs gcp my-project us-central1
```

### Architecture questions, debugging, refactoring, commits

```
/tsh-ask Why does the payment module use optimistic locking?
/tsh-debug Login fails silently when session expires
/tsh-refactor Split the UserService class, it has too many responsibilities
/tsh-commit
```

### Create a new AI customization

```
/tsh-create-custom-agent
/tsh-create-custom-skill
/tsh-create-custom-command
/tsh-create-custom-rules
```

---

## Agents

Subagents are leaf workers (one delegation level). Orchestrators run in the main thread and delegate to them.

| Role | Kind | Purpose |
|------|------|---------|
| `tsh-engineering-manager` | orchestrator | Runs the implement and refactor cycles: research, plan, implement, review |
| `tsh-business-analyst` | orchestrator | Workshop analysis into Jira-ready epics and user stories via BA workers |
| `tsh-ai-customization-orchestrator` | orchestrator | Coordinates research, creation and review of customization artifacts |
| `tsh-context-engineer` | subagent | Gather requirements from Jira, Confluence, Figma and the codebase |
| `tsh-architect` | subagent | Solution architecture and step-by-step implementation plans |
| `tsh-software-engineer` | subagent | Implement backend, frontend, APIs and data layers |
| `tsh-prompt-engineer` | subagent | Design, optimize and audit LLM application prompts |
| `tsh-devops-engineer` | subagent | Cloud infrastructure, CI/CD, Kubernetes, Terraform |
| `tsh-e2e-engineer` | subagent | Playwright end-to-end tests |
| `tsh-code-reviewer` | subagent | Structured code review |
| `tsh-ui-reviewer` | subagent | Figma vs. Playwright comparison, PASS/FAIL verdict |
| `tsh-plan-reviewer` | subagent (delegated only) | Validate implementation plans: APPROVED or REVISIONS NEEDED |
| `tsh-ba-transcript-worker`, `tsh-ba-analysis-worker`, `tsh-ba-extraction-worker`, `tsh-ba-quality-worker`, `tsh-ba-formatting-worker` | subagents (delegated only) | BA phases: transcript, analysis, extraction, quality, Jira formatting |
| `tsh-ai-customization-researcher`, `tsh-ai-customization-creator`, `tsh-ai-customization-reviewer` | subagents (delegated only) | Research, creation and review for customization tasks |

Subagents work in interactive mode by default. When a task starts with `MODE: delegated` they do not ask questions and end with a `STATUS` block for the caller.

## Knowledge skills (41)

Loaded by name by agents when relevant. No manual invocation needed.

| Category | Skills |
|----------|--------|
| **Product Ideation** | tsh-processing-transcripts, tsh-extracting-tasks, tsh-analyzing-requirements, tsh-formatting-jira-tasks, tsh-reviewing-task-quality, tsh-guarding-jira-statuses |
| **Architecture** | tsh-designing-architecture, tsh-discovering-technical-context, tsh-analyzing-implementation-gaps, tsh-analyzing-codebase |
| **Backend** | tsh-implementing-backend, tsh-designing-databases, tsh-engineering-prompts |
| **Frontend** | tsh-implementing-frontend, tsh-implementing-react, tsh-implementing-forms, tsh-ensuring-accessibility, tsh-reviewing-frontend, tsh-optimizing-frontend, tsh-writing-hooks |
| **Infrastructure** | tsh-delivering-infrastructure, tsh-implementing-terraform-modules, tsh-implementing-kubernetes, tsh-implementing-ci-cd, tsh-implementing-observability, tsh-managing-secrets, tsh-optimizing-cloud-cost, tsh-designing-multi-cloud-architecture |
| **Quality** | tsh-reviewing-code, tsh-reviewing-plans, tsh-verifying-ui, tsh-writing-e2e-tests, tsh-debugging, tsh-refactoring |
| **Tooling** | tsh-committing, tsh-using-mcp-servers |
| **AI Customization** | tsh-creating-agents, tsh-creating-skills, tsh-creating-commands, tsh-creating-rules, tsh-migrating-copilot-customizations |

The orchestrators and the two internal steps (`tsh-implement-task`, `tsh-orchestrate-ui-verification`) are skills as well; they are loaded by commands and are hidden from the `/` menu where the tool supports it.

---

## Repository structure

```
src/                        # the only source of truth - edit here
├── skills/                 # commands, orchestrators, internal steps and knowledge skills
├── agents/                 # subagents (neutral frontmatter)
├── partials/               # shared text included into skills and agents
├── mcp/servers.json        # MCP server definitions
└── config/targets.json     # model tiers and owned output paths
scripts/                    # generator, lint, reference checker, installer, migration
AGENTS.md                   # repository rules (CLAUDE.md imports it)

# Generated by `npm run generate` - committed, never edit by hand
.agents/skills/tsh-*        # Cursor and Codex skills
.claude/skills/tsh-*        # Claude Code skills (also read by Cursor)
.cursor/agents/  .claude/agents/  .codex/agents/
.cursor/mcp.json  .mcp.json  .codex/config.toml
```

## Contributing

1. Edit `src/` (or `scripts/`). Never edit the generated paths.
2. `npm run generate` renders all native outputs.
3. `npm run check` verifies drift, content rules and name/link references.
4. `npm test` runs the unit tests.

Commit `src/` changes together with their regenerated outputs. The rules are in [AGENTS.md](AGENTS.md).

## Migrating Copilot customizations

If you have GitHub Copilot customizations (`.github/agents`, `.github/prompts`, `.github/skills`, `.github/instructions`) to bring over, load the `tsh-migrating-copilot-customizations` skill, for example:

```
/tsh-implement Migrate the Copilot customizations in this repository using tsh-migrating-copilot-customizations
```

---

## License

MIT License — © 2026
