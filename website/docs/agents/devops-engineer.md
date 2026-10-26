---
sidebar_position: 8
title: DevOps Engineer
---

# DevOps Engineer Agent

**Source:** `src/agents/tsh-devops-engineer.md`  
**Kind:** subagent, model tier `balanced`, read-write access

The DevOps Engineer agent is a Senior DevOps Engineer and Consultant that propagates DevOps culture, builds "Golden Path" templates, and manages cloud infrastructure, CI/CD pipelines, observability, and cost optimization.

## Responsibilities

- Infrastructure automation with Terraform and Kubernetes.
- CI/CD pipeline design and implementation.
- Cloud cost optimization and tagging compliance audits.
- Observability and monitoring setup (logging, metrics, traces, alerting).
- Secrets management and security hardening.
- Multi-cloud architecture guidance (AWS, Azure, GCP).

## Key Behaviors

- **Decides on its own in small matters** - In delegated mode it picks sensible defaults and notes them as assumptions. In interactive mode it asks you when a choice is yours (cloud provider, workload type, scale, trade-offs).
- **Leaves architecture decisions to the Architect** - It does not delegate. When a task needs an architecture decision (new infrastructure features, multi-region or multi-cloud topology, greenfield stack), it returns `NEEDS_ARCHITECT_DECISION` and the caller routes it to the Architect.
- **Safety-first** - Prefers `--dry-run`, `plan`, or `validate`. Never runs `apply`, `delete`, or `destroy` without explicit user authorization.
- **IaC-only** - Never makes manual cloud console changes or ad-hoc CLI mutations outside of code.
- **Cost-aware** - Every infrastructure proposal includes cost impact. Flags proposals exceeding 10% spend increase.

## Context Discovery

The `tsh-delivering-infrastructure` skill holds the discovery order and the skill-loading table. Before implementing, the agent looks at:

1. **Project instructions** - `AGENTS.md`, `CLAUDE.md` and rule files.
2. **CI/CD platform** - GitHub Actions, Bitbucket Pipelines, GitLab CI, Jenkins.
3. **IaC patterns** - Terraform, Terragrunt, Kubernetes, Helm, Kustomize, CloudFormation, CDK.
4. **Policy and secrets** - `.rego`, `.sops.yaml`, `sealed-secrets/`, `vault-config/`.
5. **Greenfield** - If no patterns exist, it gathers requirements and asks for an architecture decision.

## Approved plan precondition

For plan-based work, the agent validates the plan's `## Human Approval` record before it changes any file: it needs an approved plan whose approved revision equals the current `Plan Revision`. Without a valid record it does not start: interactive mode offers you the options (point it at the right plan, request approval through `/tsh-implement`, go back to `/tsh-architect`, or stop) and never records an approval itself; delegated mode returns `BLOCKED` and names the failed condition. Work without a plan is not affected. See the [approval gate](../workflow/standard-flow#approval-gate).

## Tool access

- **Read-write.**
- **Leaf agent.** It never delegates to other agents.
- **MCP servers:** Context7, Sequential Thinking, AWS API, AWS Documentation, GCP gcloud, GCP Observability, GCP Storage.

## Skills loaded

- `tsh-delivering-infrastructure` (preloaded) - Infrastructure delivery workflow, skill routing and escalation rules
- `tsh-discovering-technical-context` - Discover project conventions and patterns before coding
- `tsh-analyzing-codebase` - Analyze a codebase: dependencies, business logic, duplications
- `tsh-optimizing-cloud-cost` - Cloud cost rightsizing, tagging and governance
- `tsh-designing-multi-cloud-architecture` - Choose and integrate services across AWS, Azure and GCP
- `tsh-implementing-terraform-modules` - Reusable Terraform modules for AWS, Azure and GCP
- `tsh-implementing-ci-cd` - CI/CD pipeline design and deployment strategies
- `tsh-managing-secrets` - Secrets storage, rotation and CI/CD authentication
- `tsh-implementing-kubernetes` - Kubernetes deployments, Helm charts and scaling
- `tsh-implementing-observability` - Logging, monitoring, alerting and tracing patterns
- `tsh-using-mcp-servers` - When and how to use the collection's MCP servers

## Invocation and modes

- **Delegated by:** `/tsh-audit-infrastructure`, `/tsh-analyze-cloud-costs` and the `tsh-engineering-manager` (infrastructure tasks). In delegated mode the task starts with `MODE: delegated` and the agent ends its reply with a `STATUS` block instead of asking the user.
- **Direct use:** the agent runs in interactive mode and talks to you. See the invocation table in the [Agents overview](./overview#invoking-an-agent-directly).

## Suggested next steps

The agent recommends these commands as text; it never starts them itself.

- `/tsh-review Review the infrastructure-as-code and CI/CD pipeline changes` to review the result.
