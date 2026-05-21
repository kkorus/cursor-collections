<p align="center">
  <img src="https://cursor.com/favicon.ico" alt="Cursor" width="72" />
</p>

<h1 align="center">⚙️ Cursor Collections</h1>

<p align="center">
  Opinionated Cursor AI IDE setup that covers the <b>full product development lifecycle</b> – from product ideation, through development, to quality assurance.
</p>

<p align="center">
  <b>Product Ideation → Development → Quality – one toolchain, end to end.</b><br/>
  Built by <a href="https://tsh.io" target="_blank">The Software House</a>.
</p>

---

## What This Repo Provides

This repository supports the **full product development lifecycle** with AI-powered agent skills, workflow skills, and slash commands organized into four lifecycle phases — plus a cross-cutting track for Cursor customization:

### Product Ideation – Requirements & Planning

- **Agent skills** – Business Analyst
- **Commands** – `/tsh-analyze-materials`
- **Workflow skills** – Task Analysis, Transcript Processing, Task Extraction, Jira Task Formatting

### Development – Architecture & Implementation

- **Agent skills** – Engineering Manager, Context Engineer, Architect, Software Engineer
- **Commands** – `/tsh-implement` (internally delegates to Context Engineer for research and Architect for planning)
- **Workflow skills** – Architecture Design, Technical Context Discovery, Frontend Implementation, Backend Implementation, Implementation Gap Analysis, SQL & Database Engineering, Codebase Analysis

### Quality – Review & Testing

- **Agent skills** – Code Reviewer, UI Reviewer, E2E Engineer
- **Commands** – `/tsh-review`, `/tsh-review-ui`, `/tsh-review-codebase`
- **Workflow skills** – Code Review, UI Verification, E2E Testing

### Developer Utilities

- **Commands** – `/tsh-ask` (architectural decisions as ADRs), `/tsh-debug` (systematic root-cause analysis), `/tsh-refactor` (structural refactoring without behavior change)

### Cursor Customization – Extending the Toolchain

- **Agent skills** – Cursor Engineer, Cursor Orchestrator
- **Commands** – `/tsh-create-custom-agent`, `/tsh-create-custom-skill`, `/tsh-create-custom-rules`
- **Workflow skills** – Creating Agent Skills, Creating Skills, Creating Commands, Creating Prompts, Creating Rules

### Infrastructure

- **MCP integrations** – Atlassian, Figma Dev Mode, Context7, Playwright, Sequential Thinking, PDF Reader
- **Cursor setup** – ready-to-plug global configuration via GitHub import or symlinks

---

> **Why the `tsh-` prefix?** All artifacts use the `tsh-` prefix (e.g., `/tsh-implement`, `tsh-architect`) to avoid naming collisions with your own project-specific skills and rules. You can safely use this alongside your own customizations without renaming anything.

---

## Installation in Cursor

### Option 1 — GitHub Import (recommended, one click)

1. Open **Cursor Settings** (`Cmd/Ctrl + Shift + J`)
2. Navigate to **Rules**
3. In the **Project Rules** section, click **Add Rule → Remote Rule (GitHub)**
4. Enter: `https://github.com/kkorus/cursor-collections`

Skills are imported globally and available in every workspace immediately.

### Option 2 — Clone + Symlink (full control, auto-updates via git pull)

```bash
# 1. Clone alongside your projects
git clone https://github.com/kkorus/cursor-collections ~/cursor-collections

# 2. Link skills globally so they appear in every workspace
mkdir -p ~/.cursor/skills

# Agent skills
for d in ~/cursor-collections/.cursor/skills/agents/*/; do
  ln -sf "$d" ~/.cursor/skills/
done

# Workflow skills
for d in ~/cursor-collections/.cursor/skills/workflows/*/; do
  ln -sf "$d" ~/.cursor/skills/
done

# Command skills (slash commands)
for d in ~/cursor-collections/.cursor/skills/commands/*/; do
  ln -sf "$d" ~/.cursor/skills/
done
```

To update later: `git -C ~/cursor-collections pull`

---

## MCP Server Configuration

To unlock the full workflow (Jira, Figma, code search, browser automation), configure MCP servers.

### Option 1 — User Profile (recommended, global across all projects)

1. Open **Cursor Settings → MCP**
2. Click **Add MCP Server**
3. Copy the contents of [`.cursor/mcp.json`](.cursor/mcp.json) from this repository

### Option 2 — Workspace Configuration

Copy `.cursor/mcp.json` to your project's `.cursor/mcp.json`.

### What each MCP is used for

| MCP | Purpose |
|-----|---------|
| **Atlassian** | Access Jira issues for `/tsh-implement` and `/tsh-review` |
| **Figma** | Pull design details for UI implementation and verification |
| **Context7** | Semantic search in external docs and knowledge bases |
| **Playwright** | Browser automation for UI verification and E2E tests |
| **Sequential Thinking** | Advanced reasoning for complex problem analysis |
| **AWS / GCP** | Infrastructure audit and cost optimization |
| **PDF Reader** | Extract content from PDF documents |

---

## How to Use

All commands work in **Cursor Agent chat** (not Ask mode). Type `/` to see available slash commands.

---

### New feature from a Jira ticket

```
/tsh-implement PROJ-123
```

What happens:
1. Context Engineer gathers requirements from Jira, Confluence, Figma
2. You review the research document — confirm to proceed
3. Architect creates a step-by-step implementation plan
4. Architect Reviewer validates the plan — returns it if BLOCKERs found (up to 3 iterations)
5. You review the plan + review report and approve
6. Software Engineer implements phase by phase
7. (UI tasks) Each UI component is verified against Figma automatically — up to 5 fix iterations
8. Code Reviewer runs the final quality check

---

### New feature from a description (no Jira)

```
/tsh-implement Add OAuth2 login with Google, using existing NestJS auth module
```

Same flow as above, but Context Engineer builds context from your codebase instead of Jira.

---

### Code review

```
/tsh-review PROJ-123
```

Or for changes without a Jira ticket:

```
/tsh-review Review the recent changes to the payment module
```

The Code Reviewer checks: acceptance criteria, security, test coverage, code quality. Returns a structured PASS / BLOCKER / SUGGESTION verdict.

---

### UI task with Figma verification

```
/tsh-implement PROJ-456
```

When the Engineering Manager detects a UI task, it automatically:
1. Delegates implementation to the Software Engineer (with Figma context)
2. Runs `/tsh-review-ui` — compares the running app via Playwright against Figma specs
3. Fixes differences and re-verifies (up to 5 iterations)
4. Escalates to you if iteration limit is reached

To run UI verification standalone:

```
/tsh-review-ui
```

---

### Full codebase review

```
/tsh-review-codebase
```

The Architect analyzes the whole repository for: dead code, duplications, architectural issues, security concerns. Returns a prioritized `code-quality-report.md` (Critical / Important / Nice to Have).

---

### Workshop transcript to Jira backlog

```
/tsh-analyze-materials [paste transcript or attach file]
```

The Business Analyst: cleans the transcript, extracts epics and user stories, runs quality review, formats for Jira, and pushes after your approval.

Works with: transcripts, Figma designs, PDF documents, codebase context.

---

### Infrastructure audit

```
/tsh-audit-infrastructure
```

For AWS cost analysis:

```
/tsh-analyze-aws-costs default eu-west-1
```

For GCP:

```
/tsh-analyze-gcp-costs my-project us-central1
```

---

### E2E tests

The Engineering Manager delegates to the E2E Engineer automatically when tasks include E2E test coverage. To run standalone:

```
/tsh-implement Write E2E tests for the login flow using Playwright
```

---

### Onboarding a new team member

```
/tsh-implement PROJ-123
```

The Engineering Manager's Context Engineer automatically gathers all context from Jira, Confluence, Figma, and the codebase — within ~5 minutes instead of days of reading.

---

### Ask an architectural question

```
/tsh-ask Why does the payment module use optimistic locking?
/tsh-ask Should we split the notifications module into a separate service?
```

Researches the codebase, evaluates options, and saves the answer as a structured ADR in `specifications/decisions/{topic}.decision.md`.

---

### Debug a bug

```
/tsh-debug Login fails silently when session expires
/tsh-debug The useCart hook triggers an infinite re-render on mobile
```

Reproduces → isolates root cause → delegates fix to Software Engineer → verifies with regression tests. Never fixes symptoms — always finds the root cause first.

---

### Refactor code structure

```
/tsh-refactor Extract shared validation logic from all form handlers
/tsh-refactor Split the UserService class — it has too many responsibilities
```

Creates an atomic, step-by-step refactoring plan in `specifications/refactoring/`. Each step keeps tests green. Delegates implementation to Software Engineer.

---

### Create a new Cursor customization artifact

```
/tsh-create-custom-agent
/tsh-create-custom-skill
/tsh-create-custom-rules
```

The Cursor Orchestrator handles research → design → creation → review automatically.

---

## Agents

### Product Ideation

| Agent | Purpose |
|-------|---------|
| Business Analyst | Convert workshop materials into Jira-ready epics and user stories |

### Development

| Agent | Purpose |
|-------|---------|
| Engineering Manager | Orchestrates the full implement cycle: research → plan → implement → review |
| Context Engineer | Gather requirements from Jira, Confluence, Figma, and codebase |
| Architect | Design solution architecture and create step-by-step implementation plan |
| Architect Reviewer | Validate the implementation plan before coding starts — APPROVED or REVISIONS NEEDED |
| Software Engineer | Implement backend, frontend, APIs, and data layers |
| Prompt Engineer | Design, optimize, and audit LLM application prompts |
| DevOps Engineer | Cloud infrastructure, CI/CD pipelines, Kubernetes, Terraform |
| E2E Engineer | End-to-end tests with Playwright — Page Object patterns, stable locators |

### Quality

| Agent | Purpose |
|-------|---------|
| Code Reviewer | Structured code review: correctness, security, tests, best practices |
| UI Reviewer | Single-pass Figma vs. Playwright comparison — PASS/FAIL verdict |

### Cursor Customization

| Agent | Purpose |
|-------|---------|
| Cursor Engineer | Create, review, and improve Cursor skills, rules, and commands |
| Cursor Orchestrator | Coordinate complex multi-phase customization tasks |

---

## Workflow skills (34)

Skills are automatically loaded by agents when relevant to the task. No manual invocation needed.

| Category | Skills |
|----------|--------|
| **Product Ideation** | tsh-transcript-processing, tsh-task-extracting, tsh-task-analysing, tsh-jira-task-formatting, tsh-task-quality-reviewing |
| **Architecture** | tsh-architecture-designing, tsh-technical-context-discovering, tsh-implementation-gap-analysing |
| **Backend** | tsh-implementing-backend, tsh-sql-and-database-understanding, tsh-engineering-prompts |
| **Frontend** | tsh-implementing-frontend, tsh-implementing-forms, tsh-ensuring-accessibility, tsh-reviewing-frontend, tsh-optimizing-frontend, tsh-writing-hooks |
| **Infrastructure** | tsh-implementing-terraform-modules, tsh-implementing-kubernetes, tsh-implementing-ci-cd, tsh-implementing-observability, tsh-managing-secrets, tsh-optimizing-cloud-cost, tsh-designing-multi-cloud-architecture |
| **Quality** | tsh-code-reviewing, tsh-ui-verifying, tsh-e2e-testing, tsh-codebase-analysing |
| **Cursor Customization** | tsh-creating-agents, tsh-creating-skills, tsh-creating-commands, tsh-creating-prompts, tsh-creating-rules, tsh-migrating-copilot-to-cursor |

---

## Repository structure

```
.cursor/
├── rules/
│   └── naming-conventions.mdc    # tsh- prefix enforcement
├── skills/
│   ├── agents/                    # 16 agent skill definitions
│   ├── workflows/                 # 34 domain workflow skills
│   ├── commands/                  # 15 user-invokable slash commands
│   └── internal/                  # 11 internal sub-workflow skills
└── mcp.json                       # MCP server configuration
```

---

## Migrating new Copilot-based PRs to Cursor

This repo was migrated from a GitHub Copilot setup. When a new PR appears in the upstream Copilot repo and you want to bring those changes here, use the built-in migration skill:

```
/tsh-implement Migrate changes from PR #<number> to the Cursor setup
```

The `tsh-migrating-copilot-to-cursor` workflow skill is loaded automatically and provides the full mapping:
- `.github/agents/` → `.cursor/skills/agents/` (agent skills)
- `.github/prompts/` → `.cursor/skills/commands/` (slash commands with `disable-model-invocation: true`)
- `.github/internal-prompts/` → `.cursor/skills/internal/` (internal skills)
- `.github/skills/` → `.cursor/skills/workflows/` (workflow skills)
- `.github/instructions/` → `.cursor/rules/` (`.mdc` rules)
- `model:` frontmatter → `> Recommended model:` in body
- Copilot-specific tools (`vscode/runCommand`, `vscode/askQuestions`) → stripped or replaced

---

## License

MIT License — © 2026 The Software House
