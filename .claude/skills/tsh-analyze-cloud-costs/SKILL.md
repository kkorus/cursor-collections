---
name: tsh-analyze-cloud-costs
description: Cost optimization and tagging compliance audit for AWS or GCP. Checks the IaC code first, then validates against the live cloud account through its API. Use when the user types /tsh-analyze-cloud-costs or asks to audit AWS or GCP costs. For a security and best-practices audit use /tsh-audit-infrastructure. Routes to the tsh-devops-engineer agent.
argument-hint: <aws|gcp> <profile|project> <region>
disable-model-invocation: true
metadata:
  short-description: Audit AWS or GCP cost optimization and tagging compliance
---
<!-- Generated from src/skills/tsh-analyze-cloud-costs/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-analyze-cloud-costs

Run an evidence-based cost optimization and tagging audit of one AWS account or GCP project. The audit is **hybrid**: analyze the Terraform/IaC code first (when it exists), then always validate against the live cloud API. Unless the user narrows the scope, audit every service in the given account or project and region. Cost is this command's scope. Security and best-practices audits belong to `/tsh-audit-infrastructure`.

## Required Skills

- `tsh-discovering-technical-context` - IaC patterns, tagging conventions and project context
- `tsh-optimizing-cloud-cost` - pricing and storage tables, tagging standards, the audit checklist for the provider (AWS or GCP) and its cost audit report template
- `tsh-analyzing-codebase` - IaC structure, dependencies and dead code when IaC files exist
- `tsh-implementing-terraform-modules` (conditional) - when Terraform files exist
- `tsh-managing-secrets` (gate) - when security findings are in scope. If the skill cannot be loaded, stop and ask the user: either the user makes it available, or the audit is re-scoped to exclude security and the report says so. A security section is never produced without it.

If `tsh-optimizing-cloud-cost` or its tagging standards cannot be loaded after you tried to load it by name, the audit runs in **degraded mode**. The only substitution allowed is the Core 5 tag names, used for presence checks only: AWS `CostCenter`, `Environment`, `Service`, `Owner`, `DataClass`; GCP labels `cost_center`, `environment`, `service`, `owner`, `data_class`. State the substitution in the Executive Summary of the report, and issue no finding, cost estimate or recommendation from these defaults, because the thresholds and checklists that justify findings live in the skill that was not loaded.

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

## Delegating and Handling Agent Status

Delegation goes one level deep. You delegate from the main thread, and the agents you delegate to never delegate further. Delegated agents start with a clean context and do not see this conversation, so put everything they need into the delegation prompt.

### Delegation prompt template

```
MODE: delegated
CALLER: <name of your skill or command>
TASK: <what to do, stated specifically>
INPUT_ARTIFACTS:
- <explicit path of each file the agent needs>
PRIOR_OUTPUT: <re-delegation only: the previous STATUS block, verbatim; when ARTIFACTS was "none", the complete previous reply body including the block>
USER_ANSWERS: <re-delegation only: the user's answers, numbered like the questions>
```

- The first line must be exactly `MODE: delegated`. Without it the agent runs in interactive mode and will ask the user instead of returning a status.
- Pass artifact paths explicitly. Never ask the agent to search for them.
- Read-only agents cannot save files, so their partial result lives in the reply body. Keep the full reply of every read-only delegate and pass it as `PRIOR_OUTPUT` on re-delegation, otherwise the agent restarts from zero.
- Omit `PRIOR_OUTPUT` and `USER_ANSWERS` on the first delegation.

### Reading the returned status

Every delegated agent ends its reply with a `STATUS:` block (`STATUS`, `ARTIFACTS`, `SUMMARY`, `QUESTIONS`, `DECISION_NEEDED`, `BLOCKER`). Some tools return the block on a single line (`STATUS: DONE SUMMARY: ...`), so parsing must not depend on line breaks:

- Find the last `STATUS:` followed by one of the four values.
- Read each field as the text after its capitalized name and colon, up to the next field name or the end of the reply.

### Handling each status

| Status | What you do |
|---|---|
| `DONE` | Continue with the workflow. Use the paths in `ARTIFACTS`. If `QUESTIONS` is present, these are open points the agent worked around: ask the user (or apply the answers at the matching gate of your workflow) and apply the answers yourself or pass them on to the next step. Do not re-delegate just for them. |
| `NEEDS_INPUT` | Ask the user the listed `QUESTIONS` in the main thread, all at once and numbered. Then delegate to the same agent again with `PRIOR_OUTPUT` and `USER_ANSWERS`. |
| `NEEDS_ARCHITECT_DECISION` | Delegate to the `tsh-architect` subagent with `DECISION_NEEDED` as the task. Then delegate to the original agent again, with the status block followed by the architect's decision in `PRIOR_OUTPUT`. |
| `BLOCKED` | Show the `BLOCKER` to the user and stop that branch of the work. |
| Missing or unparsable | Treat it as `BLOCKED` and show the raw output to the user. |

### Iteration cap

Re-delegate to the same agent at most 3 times per task. After that, stop and escalate to the user with the latest output. Loops that a workflow defines with their own caps (plan review, code review and fix, UI verification) keep those caps.

A missing skill is a stop, not a skip: when an agent reports that a skill could not be loaded, treat it as `BLOCKED`; do not continue the work without that skill.

The plan review loop (3), the code review loop (3) and the UI verification loop (5) have their own caps, separate from this one. A gate re-ask after a material plan revision is not a review iteration and does not count against any cap.
