---
name: tsh-audit-infrastructure
description: Audit infrastructure for security gaps, operational best-practice violations and configuration drift across IaC, CI/CD pipelines, Kubernetes and cloud resources. Use when the user types /tsh-audit-infrastructure or asks to audit cloud infrastructure. For a dedicated cost and tagging audit use /tsh-analyze-cloud-costs. Routes to the tsh-devops-engineer agent.
argument-hint: "[aws|azure|gcp|kubernetes|ci-cd] [security|cost|best-practices|all]"
disable-model-invocation: true
metadata:
  short-description: Audit infrastructure for security and best practices
---
<!-- Generated from src/skills/tsh-audit-infrastructure/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-audit-infrastructure

Audit the project's infrastructure for security gaps, cost waste indicators and best-practices violations, and produce a prioritized report. The scope is broad and shallow: IaC configuration, CI/CD pipelines, Kubernetes and cloud resources. A full cost and tagging audit of an AWS account or GCP project is a different, deeper job and belongs to `/tsh-analyze-cloud-costs`.

## Required Skills

- `tsh-discovering-technical-context` - project conventions, IaC dialect and existing infrastructure
- `tsh-delivering-infrastructure` - its audit report template and the severity scale
- `tsh-analyzing-codebase` - reviewing IaC files, CI/CD configuration and documentation coverage
- `tsh-optimizing-cloud-cost` - unused resources, rightsizing and reservation findings
- `tsh-managing-secrets` - secrets audit criteria and exposure risk. This skill is a gate for the security section: if it cannot be loaded, stop and ask the user, or re-scope the audit to exclude security and say so in the report

## Workflow

1. **Scope**: from the arguments, or by asking the user when they are missing, establish what to audit (AWS, Azure, GCP, Kubernetes, CI/CD), the focus (security, cost, best practices or all) and any compliance requirement (SOC2, HIPAA, PCI-DSS or none).
2. **Delegate the audit** to the `tsh-devops-engineer` subagent with the template below. Name the scope, the focus areas, the skills above and the report template in `TASK`, and ask for the report to be saved to `specifications/infrastructure-audit-<yyyy-mm-dd>.md`. The report must not contain paths that belong to the AI toolkit itself. The audit is read-only and the agent's Zero-Deletion Policy applies.
3. **Handle the status** as described below. For `NEEDS_ARCHITECT_DECISION` (findings that need network redesign, re-architecture or structural compliance changes), delegate the decision to the `tsh-architect` subagent, then delegate to `tsh-devops-engineer` again with the previous status block followed by the architect's answer in `PRIOR_OUTPUT`.
4. **Present the result**: show the report path, the executive summary and the top priorities.
5. **Next step**: suggest `/tsh-implement` with the finding numbers to fix. Do not implement the fixes in this command. Application code security is a job for the software engineer, so suggest `/tsh-review` for it.

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
