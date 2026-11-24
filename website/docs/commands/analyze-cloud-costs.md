---
sidebar_position: 17
title: /tsh-analyze-cloud-costs
---

# /tsh-analyze-cloud-costs

**Source:** `src/skills/tsh-analyze-cloud-costs/SKILL.md`  
**Routes to:** [DevOps Engineer](../agents/devops-engineer) subagent (`tsh-devops-engineer`), delegated from the main thread

A cost optimization and tagging compliance audit of one AWS account or one GCP project. It replaces the former separate AWS and GCP commands. The audit is hybrid: it analyzes the IaC code first, then always validates against the live cloud API with read-only calls.

## Usage

```text
/tsh-analyze-cloud-costs <aws|gcp> <profile|project> <region>
```

## What it does

1. Reads the provider, the AWS profile or GCP project, and the region (or all regions) from the arguments. Asks for anything missing.
2. Delegates the audit to the DevOps Engineer:
   - analyzes `*.tf`, `*.tfvars`, `terragrunt.hcl`, CloudFormation or Deployment Manager templates
   - inventories live resources and reports drift and shadow resources
   - follows the provider checklist and the tagging standards, with three paths per finding (Golden, Cost-Optimized, Velocity)
   - verifies instance types and pricing against current provider documentation
3. Writes the report to `specifications/cost-audits/<provider>-<yyyy-mm-dd>.md` and shows you the path, the executive summary and the summary table.
4. Asks whether to generate Terraform code for selected optimizations. Nothing is generated or changed before you confirm the items.

## Guardrails

The audit is analysis only. The agent's zero-deletion and mutation-lock rules apply, and it warns before any suggestion that touches a resource tagged `prod`.

**Degraded mode.** If the `tsh-optimizing-cloud-cost` skill and its tagging standards cannot be loaded, the audit may fall back to the five core tag names (`CostCenter`, `Environment`, `Service`, `Owner`, `DataClass`, or the lowercase GCP labels) for presence checks only. The report states the substitution in its Executive Summary, and no finding or recommendation is issued from the defaults.

**Secrets gate.** The security section depends on the `tsh-managing-secrets` skill. If that skill cannot be loaded, the command stops and asks you: either make it available, or re-scope the audit to exclude security. It never writes a security section without it.

Requires the AWS or GCP MCP servers. See [MCP setup](../getting-started/mcp-setup).
