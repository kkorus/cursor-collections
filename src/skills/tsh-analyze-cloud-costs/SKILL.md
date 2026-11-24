---
name: tsh-analyze-cloud-costs
description: Cost optimization and tagging compliance audit for AWS or GCP. Checks the IaC code first, then validates against the live cloud account through its API. Use when the user types /tsh-analyze-cloud-costs or asks to audit AWS or GCP costs. For a security and best-practices audit use /tsh-audit-infrastructure. Routes to the tsh-devops-engineer agent.
type: command
routes-to: tsh-devops-engineer
argument-hint: "<aws|gcp> <profile|project> <region>"
metadata:
  short-description: Audit AWS or GCP cost optimization and tagging compliance
---
# /tsh-analyze-cloud-costs

Run an evidence-based cost optimization and tagging audit of one AWS account or GCP project. The audit is **hybrid**: analyze the Terraform/IaC code first (when it exists), then always validate against the live cloud API. Unless the user narrows the scope, audit every service in the given account or project and region. Cost is this command's scope. Security and best-practices audits belong to `/tsh-audit-infrastructure`.

## Required Skills

- `tsh-discovering-technical-context` - IaC patterns, tagging conventions and project context
- `tsh-optimizing-cloud-cost` - pricing and storage tables, tagging standards, the audit checklist for the provider (AWS or GCP) and its cost audit report template
- `tsh-analyzing-codebase` - IaC structure, dependencies and dead code when IaC files exist
- `tsh-implementing-terraform-modules` (conditional) - when Terraform files exist
- `tsh-managing-secrets` (gate) - when security findings are in scope. If the skill cannot be loaded, stop and ask the user: either the user makes it available, or the audit is re-scoped to exclude security and the report says so. A security section is never produced without it.

## Workflow

1. **Scope**: read the provider (`aws` or `gcp`), the AWS profile or GCP project, and the region (or "all regions") from the arguments. Ask the user for anything missing before you continue.
2. **Delegate the audit** to the `tsh-devops-engineer` subagent with the template below. Name the provider checklist and these rules in `TASK`:
   - Analyze IaC first (`*.tf`, `*.tfvars`, `terragrunt.hcl`, CloudFormation or Deployment Manager templates), then **always** inventory the live resources with read-only API calls. Report drift and shadow resources.
   - Follow the provider checklist and the tagging standards, and produce three paths per finding (Golden, Cost-Optimized, Velocity).
   - Verify instance or machine types and pricing against current provider documentation before recommending them.
   - Write the report from the template to `specifications/cost-audits/<provider>-<yyyy-mm-dd>.md`, before you present anything. List it in `ARTIFACTS`.
   - The audit is analysis only. The Zero-Deletion Policy and the Mutation Lock of the agent apply. Remediation code is for review and manual execution.
3. **Handle the status** as described below. For `NEEDS_ARCHITECT_DECISION` (a finding that needs re-architecture), delegate the decision to the `tsh-architect` subagent, then delegate to `tsh-devops-engineer` again with the previous status block followed by the architect's answer in `PRIOR_OUTPUT`.
4. **Present the result**: tell the user the full report path on one line, then show the executive summary and the summary table of the report.
5. **Next step**: ask only one question: "Would you like me to generate Terraform code to implement these optimizations?" If no, end here. If yes, ask which opportunity numbers to apply (for example `1, 3, 5` or `all`). If no Terraform code exists in the workspace, ask for a local path or Git repository URL first. Then delegate the implementation to `tsh-devops-engineer` with the selected items and the IaC location, and show a diff preview before any file is written. Do not generate or change code before the user confirms the items.

## Guardrails

- Warn before any suggestion that modifies a resource tagged or labeled `prod`.
- The subagent never runs remediation itself.

<!-- include: caller-status-handling -->
