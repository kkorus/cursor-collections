# GCP Audit Checklist

Use this checklist for a full GCP cost and labeling audit. Check every category unless the user narrowed the scope. Use read-only operations (`list`, `describe`, `get`).

## Resource categories

- **Compute**: Compute Engine instances (machine type, generation, sustained use and committed use discounts), managed instance groups (min/max/target size), Cloud Run functions and services (memory, timeout, CPU/memory, min/max instances, concurrency), GKE node pools (machine type, autoscaling, Spot VMs).
- **Storage**: Persistent Disks (type pd-standard, pd-balanced, pd-ssd or pd-extreme, size, attachment status, snapshots), Cloud Storage buckets (lifecycle policies, storage class Standard, Nearline, Coldline or Archive, versioning, access patterns, retention policies), Filestore instances (tier, capacity).
- **Databases**: Cloud SQL instances (tier, machine type, high availability, storage type, disk autoresize), AlloyDB clusters (instance count, machine type), Firestore (provisioned vs on-demand mode), Bigtable clusters (node count, SSD or HDD), Memorystore instances (tier, memory size).
- **Networking**: Cloud NAT gateways (data processing costs), Private Service Connect and Private Google Access (vs NAT savings), static external IPs (unattached, reserved), Cloud Load Balancers (idle or underutilized), Cloud CDN (cache hit ratio, origin traffic), Cloud DNS managed zones, Cloud Interconnect and VPN (utilization).
- **Containers and orchestration**: GKE clusters (Autopilot vs Standard, node pool sizing, Spot VMs), Cloud Run (CPU allocation always-on vs request-based, idle instances), Artifact Registry repositories (cleanup policies, image count).
- **Serverless**: Cloud Run functions (invocation count, duration), API Gateway and Apigee (tier, traffic), Workflows (execution count).
- **AI/ML**: Vertex AI endpoints (machine type, autoscaling), Vertex AI training jobs, GPU instances (type, utilization), TPU usage.
- **Security and compliance**: VPC firewall rules (overly permissive rules, 0.0.0.0/0 ingress), Cloud KMS keys (unused, rotation policy), Cloud Armor policies, Certificate Manager certificates.
- **Other**: Cloud Logging (retention, exclusions, routing sinks), Pub/Sub (unused topics and subscriptions, message retention), Secret Manager (unused secrets), data transfer costs (cross-region, internet egress, inter-zone).

## Data sources

- **Inventory and labels**: the `gcp-gcloud` MCP tools with read-only `gcloud` commands (for example `gcloud compute instances list`, `gcloud sql instances list`, `gcloud container clusters list`).
- **Cloud Storage**: the `gcp-storage` MCP tools.
- **Monitoring and logging configuration**: the `gcp-observability` MCP tools.
- **Actual cost data**: Cloud Billing (`gcloud billing budgets list`, the BigQuery billing export). If it is unavailable, estimate from machine type and runtime hours and say so in the report.
- **Current machine types, pricing tiers and regional availability**: `context7`. Check it before you recommend any machine type or configuration.
- **Service alternatives** (Cloud SQL vs AlloyDB, GKE Standard vs Autopilot, Compute Engine vs Cloud Run): `tsh-designing-multi-cloud-architecture`.
- **Fallback**: if the GCP MCP tools are unavailable, use `context7`, tell the user the audit is based on documentation and not on live data, and recommend a re-run with API access.

## Label checks

- Every resource carries the required label set from `tagging-standards.md`, in the GCP label format (lowercase, underscores).
- GPU instances and Vertex AI endpoints carry the AI/ML labels.
- Storage and database resources carry the data classification label.
- Development resources that run 24/7 carry a schedule label.
