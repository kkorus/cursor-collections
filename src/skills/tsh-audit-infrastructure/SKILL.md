---
name: tsh-audit-infrastructure
description: Audit infrastructure for security gaps, operational best-practice violations and configuration drift across IaC, CI/CD pipelines, Kubernetes and cloud resources. Use when the user types /tsh-audit-infrastructure or asks to audit cloud infrastructure. For a dedicated cost and tagging audit use /tsh-analyze-cloud-costs. Routes to the tsh-devops-engineer agent.
type: command
routes-to: tsh-devops-engineer
argument-hint: "[aws|azure|gcp|kubernetes|ci-cd] [security|cost|best-practices|all]"
metadata:
  short-description: Audit infrastructure for security and best practices
---
# /tsh-audit-infrastructure

Audit the project's infrastructure for security gaps, cost waste indicators and best-practices violations, and produce a prioritized report. The scope is broad and shallow: IaC configuration, CI/CD pipelines, Kubernetes and cloud resources. A full cost and tagging audit of an AWS account or GCP project is a different, deeper job and belongs to `/tsh-analyze-cloud-costs`.

## Required Skills

- `tsh-discovering-technical-context` - project conventions, IaC dialect and existing infrastructure
- `tsh-delivering-infrastructure` - its audit report template and the severity scale
- `tsh-analyzing-codebase` - reviewing IaC files, CI/CD configuration and documentation coverage
- `tsh-optimizing-cloud-cost` - unused resources, rightsizing and reservation findings
- `tsh-managing-secrets` - secrets audit criteria and exposure risk

## Workflow

1. **Scope**: from the arguments, or by asking the user when they are missing, establish what to audit (AWS, Azure, GCP, Kubernetes, CI/CD), the focus (security, cost, best practices or all) and any compliance requirement (SOC2, HIPAA, PCI-DSS or none).
2. **Delegate the audit** to the `tsh-devops-engineer` subagent with the template below. Name the scope, the focus areas, the skills above and the report template in `TASK`, and ask for the report to be saved to `specifications/infrastructure-audit-<yyyy-mm-dd>.md`. The report must not contain paths that belong to the AI toolkit itself. The audit is read-only and the agent's Zero-Deletion Policy applies.
3. **Handle the status** as described below. For `NEEDS_ARCHITECT_DECISION` (findings that need network redesign, re-architecture or structural compliance changes), delegate the decision to the `tsh-architect` subagent, then delegate to `tsh-devops-engineer` again with the previous status block followed by the architect's answer in `PRIOR_OUTPUT`.
4. **Present the result**: show the report path, the executive summary and the top priorities.
5. **Next step**: suggest `/tsh-implement` with the finding numbers to fix. Do not implement the fixes in this command. Application code security is a job for the software engineer, so suggest `/tsh-review` for it.

<!-- include: caller-status-handling -->
