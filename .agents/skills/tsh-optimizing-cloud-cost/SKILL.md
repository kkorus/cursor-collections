---
name: tsh-optimizing-cloud-cost
description: Optimize cloud costs through resource rightsizing, tagging strategies, reserved instances, and spending analysis. Use when reducing cloud spending or meeting budget constraints, right-sizing resources from utilization data, implementing cost governance and tagging, or analyzing multi-cloud cost optimization opportunities.
metadata:
  short-description: Cloud cost rightsizing, tagging and governance
user-invocable: false
---
<!-- Generated from src/skills/tsh-optimizing-cloud-cost/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Cloud Cost Optimization

## Pricing Model Decision

| Workload Type | AWS | Azure | GCP | Savings |
|---------------|-----|-------|-----|---------|
| Steady-state (24/7) | Reserved Instances / Savings Plans | Reserved VMs | Committed Use | 30-72% |
| Variable / burst | On-Demand + Auto-scaling | Pay-as-you-go | On-Demand | Baseline |
| Fault-tolerant batch | Spot Instances | Spot VMs | Spot VMs | Up to 90% |
| Serverless / event-driven | Lambda | Functions | Cloud Run functions | Pay-per-use |

## Storage Tiering Decision

| Data Access Pattern | AWS | Azure | GCP |
|---------------------|-----|-------|-----|
| Frequent (hot) | S3 Standard | Hot | Standard |
| Infrequent (30+ days) | S3 Standard-IA | Cool | Nearline |
| Rare (90+ days) | S3 Glacier | Cold | Coldline |
| Archive (365+ days) | S3 Deep Archive | Archive | Archive |

**Rule:** Implement lifecycle policies to auto-transition data between tiers.

## Required Tags

The required set is the same five tags everywhere (this file, `references/tagging-standards.md` and the audit commands).

| Tag | Purpose | Example |
|-----|---------|---------|
| `CostCenter` | Finance reporting and chargeback | `cc-102` |
| `Environment` | Cost allocation by environment | `dev`, `staging`, `prod` |
| `Service` | Cost allocation by workload | `auth-api` |
| `Owner` | Contact for unused resources | `platform-team` |
| `DataClass` | Security classification | `public`, `confidential`, `pii` |

On GCP these are labels (`cost_center`, `environment`, `service`, `owner`, `data_class`). `ManagedBy` (`terraform`, `manual`) is optional.

**Reference:** See `references/tagging-standards.md` for the full standards, the provider key formats and enforcement.

## Pricing Models by Provider

| Pricing Model | AWS | Azure | GCP |
|---------------|-----|-------|-----|
| 1-year or 3-year commitment | Reserved Instances, Savings Plans | Reserved VM Instances | Committed Use Discounts |
| Flexible spend commitment | Compute Savings Plans | Savings plan for compute | Flexible committed use discounts |
| Spot | Spot Instances | Spot VMs | Spot VMs |
| Automatic discount | - | - | Sustained use discounts (on supported machine types) |

Check the current discount levels and eligible services in the provider's pricing documentation before you quote numbers.

## Process

1. **Audit current spend** → Use Cost Explorer / Cost Management to identify top costs
2. **Tag all resources** → Apply required tags for cost allocation
3. **Identify waste** → Find unused EBS, EIPs, snapshots, idle instances
4. **Right-size resources** → Use Compute Optimizer / Advisor recommendations
5. **Apply pricing models** → Reserved/Committed for steady, Spot for batch
6. **Implement tiering** → Storage lifecycle policies, database right-sizing
7. **Set up alerts** → Budget alerts at 50%, 80%, 100% thresholds
8. **Schedule reviews** → Weekly cost and anomaly review, monthly optimization review (rightsizing and commitments)

## Checklist

- [ ] Cost allocation tags applied to all resources
- [ ] Unused resources identified (EBS, EIPs, snapshots, idle instances) and reviewed for removal (nothing is deleted without an explicit decision)
- [ ] Instances right-sized based on utilization metrics
- [ ] Reserved capacity purchased for steady workloads (>70% utilization)
- [ ] Spot capacity used for fault-tolerant workloads
- [ ] Storage lifecycle policies configured
- [ ] Budget alerts enabled (50%, 80%, 100%)
- [ ] Cost anomaly detection enabled
- [ ] Auto-scaling configured for variable workloads

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Over-provision "just in case" | Right-size based on metrics, scale up if needed |
| Use On-Demand for steady workloads | Use Reserved/Committed for predictable usage |
| Store all data in hot tier | Implement lifecycle policies |
| Skip tagging | Tag everything for cost visibility |
| Review costs only at month end | Review weekly, alert on anomalies, run the optimization review monthly |

## Tools

| Provider | Tools |
|----------|-------|
| AWS | Cost Explorer, Cost Anomaly Detection, Compute Optimizer |
| Azure | Cost Management, Advisor |
| GCP | Cost Management, Recommender |
| Multi-cloud | CloudHealth, Cloudability, Kubecost |

## Reference Files

- `references/tagging-standards.md` - Tagging conventions and enforcement
- `references/aws-audit-checklist.md` - Resource categories and data sources for an AWS cost audit
- `references/gcp-audit-checklist.md` - Resource categories and data sources for a GCP cost audit
- `assets/cost-audit-report.template.md` - Report template for a cost audit

## Connected Skills

- `tsh-implementing-terraform-modules` - For resource provisioning
- `tsh-designing-multi-cloud-architecture` - For cloud selection
- `tsh-delivering-infrastructure` - For the audit workflow and architect escalation
