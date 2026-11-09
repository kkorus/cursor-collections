---
name: tsh-designing-multi-cloud-architecture
description: Designs multi-cloud architectures using a decision framework to select and integrate services across AWS, Azure, and GCP. Use when designing multi-cloud strategies, migrating between cloud providers, selecting cloud services for a workload, avoiding vendor lock-in, or leveraging best-of-breed services from multiple providers.
metadata:
  short-description: Choose and integrate services across AWS, Azure and GCP
user-invocable: false
---
<!-- Generated from src/skills/tsh-designing-multi-cloud-architecture/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Multi-Cloud Architecture

Decision framework and patterns for architecting applications across AWS, Azure, and GCP.

## Purpose

Design cloud-agnostic architectures and make informed decisions about service selection across cloud providers.

## Cloud Service Comparison

### Compute Services

| AWS     | Azure               | GCP             | Use Case           |
| ------- | ------------------- | --------------- | ------------------ |
| EC2     | Virtual Machines    | Compute Engine  | IaaS VMs           |
| ECS     | Container Apps      | Cloud Run       | Managed containers |
| EKS     | AKS                 | GKE             | Kubernetes         |
| Lambda  | Functions           | Cloud Run functions | Serverless     |
| Fargate | Container Instances | Cloud Run       | Serverless containers |

### Storage Services

| AWS     | Azure           | GCP             | Use Case       |
| ------- | --------------- | --------------- | -------------- |
| S3      | Blob Storage    | Cloud Storage   | Object storage |
| EBS     | Managed Disks   | Persistent Disk | Block storage  |
| EFS     | Azure Files     | Filestore       | File storage   |
| Glacier | Archive Storage | Archive Storage | Cold storage   |

### Database Services

| AWS         | Azure            | GCP           | Use Case        |
| ----------- | ---------------- | ------------- | --------------- |
| RDS         | SQL Database     | Cloud SQL     | Managed SQL     |
| DynamoDB    | Cosmos DB        | Firestore     | NoSQL           |
| Aurora      | Hyperscale / PostgreSQL Flexible Server | AlloyDB | Cloud-native MySQL/PostgreSQL |
| Aurora DSQL | (no direct equivalent) | Cloud Spanner | Distributed SQL |
| ElastiCache | Cache for Redis  | Memorystore   | Caching         |

**Reference:** See `references/service-comparison.md` for complete comparison

## Multi-Cloud Patterns

### Pattern 1: Single Provider with DR

- Primary workload in one cloud
- Disaster recovery in another
- Database replication across clouds
- Automated failover

### Pattern 2: Best-of-Breed

- Use best service from each provider
- AI/ML on GCP
- Enterprise apps on Azure
- General compute on AWS

### Pattern 3: Geographic Distribution

- Serve users from nearest cloud region
- Data sovereignty compliance
- Global load balancing
- Regional failover

### Pattern 4: Cloud-Agnostic Abstraction

- Kubernetes for compute
- PostgreSQL for database
- S3-compatible storage (MinIO)
- Open source tools

## Cloud-Agnostic Architecture

### Use Cloud-Native Alternatives

- **Compute:** Kubernetes (EKS/AKS/GKE)
- **Database:** PostgreSQL/MySQL (RDS/SQL Database/Cloud SQL)
- **Message Queue:** Apache Kafka (MSK/Event Hubs/Confluent)
- **Cache:** Redis (ElastiCache/Azure Cache/Memorystore)
- **Object Storage:** S3-compatible API
- **Monitoring:** Prometheus/Grafana
- **Service Mesh:** Istio/Linkerd

### Abstraction Layers

```
Application Layer
    ↓
Infrastructure Abstraction (Terraform)
    ↓
Cloud Provider APIs
    ↓
AWS / Azure / GCP
```

## Cost

Pricing models, discounts, storage tiering and cost governance are owned by `tsh-optimizing-cloud-cost`. Use it for the cost side of a service choice. From the multi-cloud view, the levers are to minimize cross-cloud data transfer, use Spot VMs for fault-tolerant work and keep tagging consistent across clouds.

**Reference:** See `references/multi-cloud-patterns.md`

## Migration Strategy

### Phase 1: Assessment

- Inventory current infrastructure
- Identify dependencies
- Assess cloud compatibility
- Estimate costs

### Phase 2: Pilot

- Select pilot workload
- Implement in target cloud
- Test thoroughly
- Document learnings

### Phase 3: Migration

- Migrate workloads incrementally
- Maintain dual-run period
- Monitor performance
- Validate functionality

### Phase 4: Optimization

- Right-size resources
- Implement cloud-native services
- Optimize costs
- Enhance security

## Process

1. **Assess requirements** → Identify drivers (DR, compliance, best-of-breed, cost)
2. **Choose pattern** → Select from patterns above based on requirements
3. **Map services** → Use service comparison tables to select equivalents
4. **Design abstraction** → Use Kubernetes + Terraform for portability
5. **Plan networking** → Design cross-cloud connectivity (VPN, interconnect)
6. **Implement IaC** → Use `tsh-implementing-terraform-modules` skill
7. **Set up observability** → Unified monitoring across clouds
8. **Document runbooks** → Cloud-specific operational procedures

## Checklist

- [ ] Multi-cloud drivers documented (DR, compliance, vendor diversification)
- [ ] Service equivalents mapped across target clouds
- [ ] Abstraction layer chosen (Kubernetes, Terraform, or both)
- [ ] Cross-cloud networking designed and secured
- [ ] Identity federation configured (single IAM source of truth)
- [ ] Unified monitoring and logging implemented
- [ ] Cost allocation and tracking across clouds
- [ ] DR/failover procedures tested
- [ ] Team trained on all target cloud platforms

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Use proprietary services for portability needs | Choose cloud-agnostic alternatives (K8s, PostgreSQL) |
| Duplicate everything across clouds | Be intentional about what runs where |
| Manage each cloud differently | Use unified IaC and observability |
| Ignore data transfer costs | Design to minimize cross-cloud traffic |

## Reference Files

- `references/service-comparison.md` - Complete service comparison
- `references/multi-cloud-patterns.md` - Architecture patterns

## Connected Skills

- `tsh-implementing-terraform-modules` - For IaC implementation
- `tsh-optimizing-cloud-cost` - For cost management
