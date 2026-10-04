# Cloud Resource Tagging Standards

A provider-neutral template. Replace every `[placeholder]` with the organization's own value, and record the result in the project instructions. If the project already has a tagging standard, that standard wins.

## Contents

- Governance and enforcement
- Required tags
- Provider key format
- Workload-specific tags
- Compliance rules

## Governance and enforcement

| Provider | Enforcement mechanism |
|---|---|
| AWS | Tag Policies in AWS Organizations, plus service control policies or AWS Config rules for required tags |
| Azure | Azure Policy (`Require a tag on resources`, `Inherit a tag from the resource group`) |
| GCP | Organization policy (custom constraints where the service supports them) plus labels in the billing export |

- **Infrastructure as code**: every Terraform or CDK module injects the required tags automatically (for example provider `default_tags` on AWS, `default_labels` on GCP).
- **Case**: `[PascalCase keys on AWS and Azure; lowercase_underscore keys on GCP]`. Values are `lowercase-with-hyphens`.
- **Owner of the standard**: `[team or role]`.

## Required tags

The required set is the same in `SKILL.md` and here. Every resource that supports tags carries all five.

| Tag key | Example value | Description |
|---|---|---|
| `CostCenter` | `[cc-102]` | Billing code for chargeback |
| `Environment` | `dev`, `staging`, `prod` | Deployment stage |
| `Service` | `[auth-api]` | Name of the specific workload |
| `Owner` | `[platform-team]` | Team responsible for the resource |
| `DataClass` | `public`, `confidential`, `pii` | Security classification level |

Optional but recommended: `ManagedBy` (`terraform`, `manual`) to track IaC coverage.

## Provider key format

| Concept | AWS and Azure tag | GCP label |
|---|---|---|
| Cost center | `CostCenter` | `cost_center` |
| Environment | `Environment` | `environment` |
| Service | `Service` | `service` |
| Owner | `Owner` | `owner` |
| Data classification | `DataClass` | `data_class` |
| Managed by | `ManagedBy` | `managed_by` |

GCP label keys and values use lowercase letters, digits, underscores and hyphens, and are limited to 63 characters. GCP labels are what appears in the billing export. GCP resource manager tags are a separate feature for policy and IAM conditions and do not replace labels for cost allocation.

## Workload-specific tags

### AI and ML workloads

- `ModelID` (`model_id` on GCP): tracks spend per model.
- `TrainingJobId` (`training_job_id`): links cost to a training run.
- `InferenceType` (`inference_type`): `realtime` or `batch`.

### Automation and lifecycle

- `Schedule` (`schedule`): for example `business-hours-only`, read by the instance scheduler that stops resources outside working hours.
- `Temporary` (`temporary`): `true`. Must come with a `TTL` tag.
- `TTL` (`ttl`): the date after which the resource should be reviewed for removal, as `[YYYY-MM-DD]`.

## Compliance rules

- **Untagged resources**: `[organization policy: for example notify the owner, then restrict access]`. Do not delete or terminate a resource only because it is untagged (Zero-Deletion Policy). Removal is a separate, explicit decision.
- **Development limits**: `Environment:dev` resources above `[maximum size, for example 2xlarge]` need an `ExceptionID` tag.
