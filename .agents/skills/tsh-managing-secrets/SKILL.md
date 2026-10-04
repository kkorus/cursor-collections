---
name: tsh-managing-secrets
description: Secrets management patterns for cloud and Kubernetes environments. Use when implementing secure credential storage, secrets rotation, CI/CD authentication, or GitOps-compatible secret management.
metadata:
  short-description: Secrets storage, rotation and CI/CD authentication
user-invocable: false
---
<!-- Generated from src/skills/tsh-managing-secrets/SKILL.md by scripts/generate.mjs. Do not edit. -->

# Secrets Management

## Solution Decision Matrix

| Scenario | Recommended Solution |
|----------|---------------------|
| Single cloud, simple apps | Cloud-native (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager) |
| Multi-cloud / hybrid | HashiCorp Vault |
| GitOps with Kubernetes | Sealed Secrets or External Secrets Operator |
| Local dev / small teams | SOPS with age/GPG |
| CI/CD → Cloud | OIDC federation (no long-lived keys) |

## Cloud-Native Detection

Check which cloud provider the project uses:
- `*.tf` with `provider "aws"` → AWS Secrets Manager
- `*.tf` with `provider "azurerm"` → Azure Key Vault
- `*.tf` with `provider "google"` → GCP Secret Manager

Use `context7` or cloud documentation MCP to look up provider-specific syntax.

Also check for other IaC and secret tooling (`*.bicep`, `template.yaml`, `cdk.json`, `.sops.yaml`, `vault-config/`) before you choose a solution.

## Kubernetes Secrets Detection

Check for existing patterns:
- `SealedSecret` resources → Bitnami Sealed Secrets
- `ExternalSecret` resources → External Secrets Operator
- `*.enc.yaml` files → SOPS encryption
- `vault-agent` sidecars → HashiCorp Vault

**Kubernetes Secrets are not encrypted by default.** A `Secret` is only base64-encoded in etcd. It is encrypted at rest only when etcd encryption is enabled (an `EncryptionConfiguration`, ideally with a KMS provider) or the managed cluster offers it (for example envelope encryption with a cloud KMS key). Enable it, restrict RBAC access to Secrets, and prefer an external secret store (External Secrets Operator, Vault) for sensitive values.

## CI/CD Credentials Decision

| CI Platform | Cloud | Approach |
|-------------|-------|----------|
| GitHub Actions | AWS | OIDC with `aws-actions/configure-aws-credentials` |
| GitHub Actions | Azure | OIDC with `azure/login` |
| GitHub Actions | GCP | OIDC with `google-github-actions/auth` |
| GitLab CI | AWS/Azure/GCP | OIDC with an `id_tokens:` block that sets the audience for the cloud (the legacy job JWT variables were removed in GitLab 17.0) |
| Bitbucket Pipelines | AWS/Azure/GCP | OIDC with `oidc: true` on the step, which provides `BITBUCKET_STEP_OIDC_TOKEN` to exchange for a short-lived role |
| Any | Any | HashiCorp Vault with JWT/OIDC auth |

**Rule:** Always prefer OIDC federation over long-lived access keys. This is the single CI credentials table. Other skills link here and do not copy it.

Scope the cloud-side trust to the repository, branch or environment that needs access. Fall back to platform secrets with a narrowly scoped, rotated key only when the platform or cloud does not support OIDC.

## Process

1. **Discover context** → Check existing secret patterns in codebase
2. **Choose solution** → Use decision matrix based on scenario
3. **Look up implementation** → Use `context7` or cloud MCP for current syntax
4. **Implement rotation** → Set rotation policy (30-90 days for credentials)
5. **Enable auditing** → Configure access logging on secret store
6. **Document break-glass** → Define emergency access procedure

## Security Checklist

- [ ] No secrets in code, logs, build output or plain-text pipeline variables (use masked, protected secret variables)
- [ ] Rotation policy defined (30-90 days for credentials)
- [ ] Least privilege access to secret stores
- [ ] Audit logging enabled on all secret access
- [ ] OIDC used for CI/CD (no long-lived access keys)
- [ ] Secrets encrypted at rest and in transit (for Kubernetes: etcd encryption or KMS enabled, not just base64)
- [ ] Break-glass procedure documented
- [ ] Secret scanning enabled in CI (gitleaks, trufflehog)

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Hardcode secrets in code | Use secret references |
| Commit `.env` files | Use `.env.example` with placeholders |
| Share secrets via Slack/email | Use secret manager with access control |
| Same secret across environments | Separate secrets per environment |
| Long-lived CI/CD credentials | OIDC federation with short-lived tokens |
| Secrets in ConfigMaps | Use Kubernetes Secrets, with etcd encryption at rest or an external secret store |

## Connected Skills

- `tsh-implementing-ci-cd` - For pipeline credential setup
- `tsh-implementing-terraform-modules` - For IaC secret resource patterns
- `tsh-optimizing-cloud-cost` - Secret manager pricing considerations
