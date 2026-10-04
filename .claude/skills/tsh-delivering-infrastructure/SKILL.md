---
name: tsh-delivering-infrastructure
description: Shared delivery workflow for infrastructure work (Terraform, CI/CD, Kubernetes, observability, cloud cost, audits). Covers context discovery, the three-option output strategy, the FinOps threshold, the skill-loading table and the triggers that require an architect decision. Use when implementing, changing or auditing infrastructure, pipelines, clusters or monitoring.
metadata:
  short-description: Infrastructure delivery workflow, skill routing and escalation rules
---
<!-- Generated from src/skills/tsh-delivering-infrastructure/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Delivering Infrastructure

This skill holds the delivery rules that every infrastructure task shares. The domain skills (Terraform, CI/CD, Kubernetes, observability, secrets, cost) hold the technical patterns. This skill tells you which of them to load, what to discover first, when to stop and ask for an architect decision and how to present the result.

## Context discovery

Establish context in this order before you change anything. Skip the steps that a plan's "Technical Context" section already answers.

1. **Project instructions**: `.devops/instructions.md`, `infrastructure/README.md`, and the project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`).
2. **CI/CD platform**:
   - GitHub Actions: `.github/workflows/*.yml`
   - Bitbucket: `bitbucket-pipelines.yml`
   - GitLab: `.gitlab-ci.yml`
   - Other: `Jenkinsfile`, `azure-pipelines.yml`
3. **IaC dialect**: match what exists.
   - Terraform or Terragrunt: `*.tf`, `terragrunt.hcl`
   - Kubernetes: `k8s/*.yaml`, `helm/`, `kustomize/`
   - CloudFormation or CDK: `template.yaml`, `cdk.json`
4. **Policy and secrets**: `.rego`, `.sops.yaml`, `sealed-secrets/`, `vault-config/`.
5. **Greenfield** (no patterns exist): gather the target cloud provider (AWS, Azure, GCP, multi-cloud), the workload type (serverless, containers, Kubernetes, VMs) and the expected scale (small, medium, large). Ask the user in interactive mode. In delegated mode return `NEEDS_INPUT` with these questions. The stack choice itself is an architect decision (see below), so do not pick it yourself.

Record the result as a "Technical Context" line in your summary (platform, IaC dialect, conventions found). If you found none, say so.

## Skill loading

Load the skills in the order shown. `tsh-discovering-technical-context` always comes first.

| Task type | Skills, in order |
|---|---|
| CI/CD pipelines | `tsh-discovering-technical-context`, `tsh-implementing-ci-cd`, `tsh-managing-secrets` |
| Terraform pipelines | `tsh-discovering-technical-context`, `tsh-implementing-terraform-modules` (`references/ci-pipelines.md`), `tsh-managing-secrets` |
| Terraform modules | `tsh-discovering-technical-context`, `tsh-implementing-terraform-modules`, `tsh-managing-secrets` |
| Terraform with cloud selection | `tsh-discovering-technical-context`, `tsh-implementing-terraform-modules`, `tsh-designing-multi-cloud-architecture`, `tsh-optimizing-cloud-cost` |
| Kubernetes deployments | `tsh-discovering-technical-context`, `tsh-implementing-kubernetes`, `tsh-managing-secrets` |
| Monitoring and alerting | `tsh-discovering-technical-context`, `tsh-implementing-observability` |
| Kubernetes observability stack | `tsh-discovering-technical-context`, `tsh-implementing-kubernetes`, `tsh-implementing-observability` |
| Infrastructure audit | `tsh-discovering-technical-context`, `tsh-analyzing-codebase`, `tsh-optimizing-cloud-cost`, `tsh-managing-secrets` |

When the task touches an existing codebase, also load `tsh-analyzing-codebase` to understand the current Terraform, Helm charts and manifests.

For an IaC pipeline, follow the IaC checklist in `tsh-implementing-terraform-modules` (`references/ci-pipelines.md`) before you deliver.

## Architect escalation

You do not make architectural decisions and you do not delegate. Stop and ask for an architect decision when the task needs one of these:

| Area | Trigger |
|---|---|
| Any | A new infrastructure feature, a remodel of the existing architecture, a choice between competing patterns, or an optimization that needs structural change |
| Topology | VPC or network design, multi-region, multi-cluster, disaster recovery, multi-cloud |
| Service selection | ECS vs EKS, RDS vs Aurora, or any choice with more than 10% cost impact |
| Kubernetes | A new service architecture or microservices topology, a service mesh (Istio, Linkerd) |
| Observability | A stack choice for a greenfield project, cross-service tracing design, centralized logging with compliance requirements |
| CI/CD | A deployment strategy that is new to the organization (blue-green, canary), multi-environment promotion, GitOps workflows |
| Audit | Findings that need network redesign, re-architecture or structural compliance changes |
| Greenfield | The stack choice, after you gathered the requirements |

Do not escalate routine work: version updates, bug fixes in IaC, scaling inside an established pattern, tags and labels, alerts and dashboards on an existing stack, HPA, PDB, probes and resource limits, documentation. A blue-green or canary strategy that the organization already uses is routine too.

How to escalate:

- **Delegated mode**: return `NEEDS_ARCHITECT_DECISION`. Put the current state, the requirement, the constraints (budget, compliance, timeline) and the options you see in `DECISION_NEEDED`. Save your partial work first.
- **Interactive mode**: tell the user which decision is open, with the same information, and recommend `/tsh-ask` or the `tsh-architect` agent. Continue only with the parts that do not depend on the decision.

If the architect's decision arrives in `PRIOR_OUTPUT`, apply it and review it for production readiness.

## Output strategy

For a design request, once the architect decision is known, present three implementation options. They are variants of one architecture, not architectural alternatives:

1. **Golden Path**: the balanced, standard stack.
2. **Cost-Optimized**: the cheapest (spot capacity, scale to zero, serverless).
3. **Velocity Path**: the fastest to deploy, the highest performance.

Give each option a cost estimate and SLOs. Every design includes self-healing (GitOps drift reconciliation) and health checks.

For small changes within an established pattern, skip the options and follow the project's existing approach.

## FinOps threshold

Every infrastructure proposal includes a cost estimate. When the estimated spend grows by more than 10%, start the proposal with `FINOPS ALERT: High Cost Impact` and treat the decision as an architect escalation.

## Summary and audit outputs

End an implementation with the summary template of the domain skill you used (in `assets/` of `tsh-implementing-kubernetes`, `tsh-implementing-observability`, `tsh-implementing-ci-cd` and `tsh-implementing-terraform-modules`). For an audit, use `assets/infrastructure-audit-report.template.md`. Keep paths that belong to this toolkit out of user-facing reports.

## Connected Skills

- `tsh-discovering-technical-context` - project conventions, always first
- `tsh-implementing-terraform-modules` - modules, state and IaC pipelines
- `tsh-implementing-ci-cd` - pipelines and deployment strategies
- `tsh-implementing-kubernetes` - workloads, Helm, scaling, Gateway API
- `tsh-implementing-observability` - metrics, logs, traces, SLOs
- `tsh-managing-secrets` - credentials, OIDC and the CI credentials table
- `tsh-optimizing-cloud-cost` - pricing, tagging and cost audits
- `tsh-designing-multi-cloud-architecture` - service selection across providers
