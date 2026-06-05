---
name: tsh-audit-infrastructure
description: Audit infrastructure for security gaps, cost waste, and best practices violations. Use when the user types /tsh-audit-infrastructure or asks to audit cloud infrastructure. Routes to the tsh-devops-engineer agent.
disable-model-invocation: true
---
# /tsh-audit-infrastructure

Load and follow the tsh-devops-engineer agent skill. Perform a comprehensive infrastructure audit to identify security vulnerabilities, cost optimization opportunities, and best practices violations across your cloud environment. Systematically examine IaC configurations, CI/CD pipelines, and cloud resources to produce an actionable audit report with prioritized findings.

The audit covers three key dimensions: security (IAM, encryption, network exposure, secrets), cost (unused resources, rightsizing, reservations), and operational excellence (tagging, IaC coverage, documentation). Findings are classified by severity and linked to remediation skills for immediate action.

## Required Skills
Before starting, load and follow these skills:
- `tsh-optimizing-cloud-cost` - for cost analysis patterns, rightsizing, and reservation recommendations
- `tsh-managing-secrets` - for secrets management audit criteria and exposure risk assessment
- `tsh-codebase-analysing` - to review IaC files, CI/CD configurations, and documentation coverage

---

## 1. Context

Determine audit scope (if not provided):
- **What to audit?** AWS, Azure, GCP, Kubernetes, CI/CD
- **Focus areas?** Security, cost, best practices, or all
- **Compliance requirements?** SOC2, HIPAA, PCI-DSS, or none

Additionally, always:
- Check `*.mdc rules` → project-specific conventions
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
1. [Critical] Description → `.cursor/skills/internal/tsh-implement-terraform/SKILL.md`
2. [High] Description → `.cursor/skills/internal/tsh-deploy-kubernetes/SKILL.md`
3. [Medium] Description → `.cursor/skills/internal/tsh-implement-observability/SKILL.md`
```

---

## Scope

**Does NOT handle** (redirect to):
- Implementing fixes → delegate to `@tsh-devops-engineer` and load the matching internal skill: `tsh-implement-terraform`, `tsh-deploy-kubernetes`, `tsh-implement-pipeline`, or `tsh-implement-observability` (`.cursor/skills/internal/<name>/SKILL.md`)
- Application code security → coordinate with software engineer
