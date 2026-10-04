---
name: tsh-implementing-terraform-modules
description: Build reusable Terraform modules for AWS, Azure, and GCP infrastructure following infrastructure-as-code best practices. Use when creating reusable infrastructure modules, standardizing cloud provisioning, building multi-cloud compatible modules, or establishing organizational Terraform standards.
metadata:
  short-description: Reusable Terraform modules for AWS, Azure and GCP
user-invocable: false
---
<!-- Generated from src/skills/tsh-implementing-terraform-modules/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Implementing Terraform Modules

Production-ready Terraform module patterns for AWS, Azure, and GCP infrastructure.

## Purpose

Create reusable, well-tested Terraform modules for common cloud infrastructure patterns across multiple cloud providers.

## Module Structure

```
terraform-modules/
├── aws/
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   └── s3/
├── azure/
│   ├── vnet/
│   ├── aks/
│   └── storage/
└── gcp/
    ├── vpc/
    ├── gke/
    └── cloud-sql/
```

## Standard Module Pattern

```
module-name/
├── main.tf          # Main resources
├── variables.tf     # Input variables
├── outputs.tf       # Output values
├── versions.tf      # Provider versions
├── README.md        # Documentation
├── examples/        # Usage examples
│   └── complete/
│       ├── main.tf
│       └── variables.tf
└── tests/           # Native terraform test files (and optional Terratest)
    ├── unit.tftest.hcl
    └── integration_test.go   # optional
```

## AWS VPC Module Example

**main.tf:**

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(
    {
      Name = var.name
    },
    var.tags
  )
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    {
      Name = "${var.name}-private-${count.index + 1}"
      Tier = "private"
    },
    var.tags
  )
}

resource "aws_internet_gateway" "main" {
  count  = var.create_internet_gateway ? 1 : 0
  vpc_id = aws_vpc.main.id

  tags = merge(
    {
      Name = "${var.name}-igw"
    },
    var.tags
  )
}
```

**variables.tf:**

```hcl
variable "name" {
  description = "Name of the VPC"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for VPC"
  type        = string
  validation {
    condition     = can(cidrnetmask(var.cidr_block))
    error_message = "CIDR block must be valid IPv4 CIDR notation."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = []
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

variable "create_internet_gateway" {
  description = "Whether to create an Internet Gateway"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
```

**outputs.tf:**

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "vpc_cidr_block" {
  description = "CIDR block of VPC"
  value       = aws_vpc.main.cidr_block
}
```

## Best Practices

1. **Use semantic versioning** for modules
2. **Pin versions** in `versions.tf`: set `required_version` and a pessimistic constraint on the current major version of each provider (`~> <major>.<minor>`), and commit `.terraform.lock.hcl`. Look up the current provider versions with `context7` or the registry, and never copy a version number from an old module. Modules declare a minimum provider version. Root modules pin tighter.
3. **Document all variables** with descriptions
4. **Provide examples** in examples/ directory
5. **Use validation blocks** for input validation
6. **Output important attributes** for module composition
7. **Use locals** for computed values
8. **Implement conditional resources** with count/for_each
9. **Test modules** with `terraform test` (see Testing)
10. **Tag all resources** consistently

## Reference Files

- `references/aws-modules.md` - AWS module patterns
- `references/azure-modules.md` - Azure module patterns
- `references/gcp-modules.md` - GCP module patterns
- `references/ci-pipelines.md` - Terraform and Terragrunt CI/CD pipelines, remote state, scanning and the IaC checklist

## Testing

Use the native `terraform test` command (Terraform 1.6 and newer, OpenTofu has an equivalent) for unit tests, and add Terratest only for integration tests that need real infrastructure.

**Unit tests with `mock_provider`** (Terraform 1.7 and newer) run without cloud credentials, because the provider is replaced by a mock:

```hcl
# tests/unit.tftest.hcl
mock_provider "aws" {}

variables {
  name                 = "test"
  cidr_block           = "10.0.0.0/16"
  availability_zones   = ["eu-west-1a", "eu-west-1b"]
  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
}

run "creates_private_subnets" {
  command = plan

  assert {
    condition     = length(aws_subnet.private) == 2
    error_message = "Expected one private subnet per CIDR."
  }
}

run "rejects_invalid_cidr" {
  command = plan

  variables {
    cidr_block = "not-a-cidr"
  }

  expect_failures = [var.cidr_block]
}
```

Rules:
- Every module has `tests/*.tftest.hcl` with `mock_provider` runs that check resource counts, naming, tags and variable validation.
- A plain `command = plan` run against the real provider still needs credentials, because the provider configures itself and data sources are read. Only `mock_provider` (or `override_data`) removes that need.
- Keep `examples/complete/` as a root module that calls the module with realistic values. It also serves as the target of integration tests.

**Integration tests (optional)** with Terratest (Go) or a `command = apply` run:
- Use a dedicated test account. Never run against production.
- Use the cost-reducing settings the module exposes (for example a single NAT gateway) in the example.
- With Terratest: call `t.Parallel()`, wrap options with `terraform.WithDefaultRetryableErrors`, resolve the example path with `runtime.Caller(0)`, and always defer `Destroy`.
- Set a timeout (for example `-timeout 30m`) in CI to avoid hanging runs.

## Terraform vs Terragrunt Decision

Use **plain Terraform** when:
- Single environment, single region
- 2–3 environments in the same region (use workspaces or directory layout)
- Existing project without Terragrunt (don't migrate mid-project)

Use **Terragrunt** when:
- 4+ environments or multi-region deployments
- Monorepo with many independent stacks (need `terragrunt run --all`, dependency orchestration)
- Team needs strict environment parity via inheritance
- Multi-account AWS (landing zone pattern)
- Greenfield with expected growth

Current Terragrunt versions use `terragrunt run --all <command>`. The older `run-all` form is deprecated, so check the installed version. Verify flags with `context7`.

**Terragrunt Golden Path structure:**
```
infrastructure/
├── terragrunt.hcl              # Root config (remote_state, generate provider)
├── _envcommon/                  # Shared module references
│   ├── vpc.hcl
│   ├── eks.hcl
│   └── rds.hcl
├── dev/
│   ├── env.hcl                 # Environment-level vars
│   ├── vpc/terragrunt.hcl
│   └── eks/terragrunt.hcl
├── staging/
│   └── ...
└── prod/
    └── ...
```

## OpenTofu

OpenTofu is a drop-in alternative for Terraform. Modules written to the patterns above work with both, including `tofu test` (`mock_provider` needs a recent OpenTofu, so check the minimum version) and S3 `use_lockfile`. Check which CLI the project uses (`.terraform-version`, `.opentofu-version`, CI configuration) and use its command name. Do not switch tools without an explicit decision.

## Guardrails

- Always run `terraform plan` before any apply, and apply the saved plan.
- Never suggest `terraform apply -auto-approve` for production.
- Make sure remote state is configured before applying.
- Flag resources with a significant cost impact (more than a 10% increase).
- VPC or network topology, a choice between competing cloud services (ECS vs EKS, RDS vs Aurora), multi-region or disaster recovery design and decisions with a cost impact above 10% are architect decisions (see `tsh-delivering-infrastructure`). Adding resources to existing modules, version updates, bug fixes and tags are not.

## Summary Output

End an implementation with the summary in `assets/terraform-summary.template.md`.

## Connected Skills

- `tsh-designing-multi-cloud-architecture` - For architectural decisions
- `tsh-optimizing-cloud-cost` - For cost-effective designs
- `tsh-implementing-ci-cd` - For general pipeline design
- `tsh-managing-secrets` - For credentials and OIDC in pipelines
- `tsh-delivering-infrastructure` - For skill routing and architect escalation
