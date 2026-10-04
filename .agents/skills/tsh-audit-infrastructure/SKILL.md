---
name: tsh-audit-infrastructure
description: Audit infrastructure for security gaps, cost waste, and best practices violations. Use when the user types /tsh-audit-infrastructure or asks to audit cloud infrastructure. Routes to the tsh-devops-engineer agent.
disable-model-invocation: true
metadata:
  short-description: Audit infrastructure for security, cost and best practices
---
<!-- Generated from src/skills/tsh-audit-infrastructure/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-audit-infrastructure

Delegate to the `tsh-devops-engineer` subagent. Perform a comprehensive infrastructure audit to identify security vulnerabilities, cost optimization opportunities, and best practices violations across your cloud environment. Systematically examine IaC configurations, CI/CD pipelines, and cloud resources to produce an actionable audit report with prioritized findings.

The audit covers three key dimensions: security (IAM, encryption, network exposure, secrets), cost (unused resources, rightsizing, reservations), and operational excellence (tagging, IaC coverage, documentation). Findings are classified by severity and linked to remediation skills for immediate action.

## Required Skills
Before starting, load and follow these skills:
- `tsh-optimizing-cloud-cost` - for cost analysis patterns, rightsizing, and reservation recommendations
- `tsh-managing-secrets` - for secrets management audit criteria and exposure risk assessment
- `tsh-analyzing-codebase` - to review IaC files, CI/CD configurations, and documentation coverage

---

## 1. Context

Determine audit scope (if not provided):
- **What to audit?** AWS, Azure, GCP, Kubernetes, CI/CD
- **Focus areas?** Security, cost, best practices, or all
- **Compliance requirements?** SOC2, HIPAA, PCI-DSS, or none

Additionally, always:
- Check project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`) → project-specific conventions
- Analyze existing IaC files and CI/CD configurations
- Discover existing infrastructure patterns in the codebase

---

## 2. Assessment

Follow the relevant skills to audit each focus area:
- **Security**: IAM, encryption, network exposure, compliance
- **Cost**: Follow `tsh-optimizing-cloud-cost` skill for unused resources, rightsizing, reservations
- **Secrets**: Follow `tsh-managing-secrets` skill for exposure risks
- **Best practices**: Tagging, IaC coverage, documentation

Classify findings by severity:
- **Critical**: Immediate security risk or compliance violation
- **High**: Significant cost waste or security gap
- **Medium**: Best practice deviation with moderate impact
- **Low**: Minor improvements or nice-to-haves

---

## 3. Architect Consultation

Spawn `tsh-architect` sub-agent when findings require architectural changes:
- Security findings requiring network redesign
- Cost findings requiring infrastructure re-architecture
- Compliance gaps requiring structural changes

Skip for: adding tags, updating configurations, simple fixes.

---

## 4. Summary (required output)

```markdown
## Infrastructure Audit Summary

### Executive Summary
- Overall health: Critical / Warning / Good
- Findings: X Critical, Y High, Z Medium, W Low
- Top 3 priorities

### Security Findings
| Severity | Finding | Resource | Recommendation |
|----------|---------|----------|----------------|

### Cost Findings
| Severity | Finding | Monthly Impact | Recommendation |
|----------|---------|----------------|----------------|

### Best Practices Findings
| Severity | Finding | Area | Recommendation |
|----------|---------|------|----------------|

### Quick Wins
- [list immediate actions with high impact and low effort]

### Remediation Roadmap
1. [Critical] Description → the `tsh-implement-terraform` skill
2. [High] Description → the `tsh-deploy-kubernetes` skill
3. [Medium] Description → the `tsh-implement-observability` skill
```

---

## Scope

**Does NOT handle** (redirect to):
- Implementing fixes → delegate to the `tsh-devops-engineer` subagent and load the matching internal skill: `tsh-implement-terraform`, `tsh-deploy-kubernetes`, `tsh-implement-pipeline`, or `tsh-implement-observability` (`.cursor/skills/internal/<name>/SKILL.md`)
- Application code security → coordinate with software engineer

## Delegating and Handling Agent Status

Delegation goes one level deep. You delegate from the main thread, and the agents you delegate to never delegate further. Delegated agents start with a clean context and do not see this conversation, so put everything they need into the delegation prompt.

### Delegation prompt template

```
MODE: delegated
CALLER: <name of your skill or command>
TASK: <what to do, stated specifically>
INPUT_ARTIFACTS:
- <explicit path of each file the agent needs>
PRIOR_OUTPUT: <re-delegation only: the previous STATUS block, verbatim>
USER_ANSWERS: <re-delegation only: the user's answers, numbered like the questions>
```

- The first line must be exactly `MODE: delegated`. Without it the agent runs in interactive mode and will ask the user instead of returning a status.
- Pass artifact paths explicitly. Never ask the agent to search for them.
- Omit `PRIOR_OUTPUT` and `USER_ANSWERS` on the first delegation.

### Reading the returned status

Every delegated agent ends its reply with a `STATUS:` block (`STATUS`, `ARTIFACTS`, `SUMMARY`, `QUESTIONS`, `DECISION_NEEDED`, `BLOCKER`). Some tools return the block on a single line (`STATUS: DONE SUMMARY: ...`), so parsing must not depend on line breaks:

- Find the last `STATUS:` followed by one of the four values.
- Read each field as the text after its capitalized name and colon, up to the next field name or the end of the reply.

### Handling each status

| Status | What you do |
|---|---|
| `DONE` | Continue with the workflow. Use the paths in `ARTIFACTS`. |
| `NEEDS_INPUT` | Ask the user the listed `QUESTIONS` in the main thread, all at once and numbered. Then delegate to the same agent again with `PRIOR_OUTPUT` and `USER_ANSWERS`. |
| `NEEDS_ARCHITECT_DECISION` | Delegate to the `tsh-architect` subagent with `DECISION_NEEDED` as the task. Then delegate to the original agent again, with the status block followed by the architect's decision in `PRIOR_OUTPUT`. |
| `BLOCKED` | Show the `BLOCKER` to the user and stop that branch of the work. |
| Missing or unparsable | Treat it as `BLOCKED` and show the raw output to the user. |

### Iteration cap

Re-delegate to the same agent at most 3 times per task. After that, stop and escalate to the user with the latest output. Loops that a workflow defines with their own caps (plan review, UI verification) keep those caps.
