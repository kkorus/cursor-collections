---
name: tsh-implementing-ci-cd
description: CI/CD pipeline design patterns and deployment strategies. Use when designing new pipelines, choosing a deployment strategy (rolling, blue-green, canary), optimizing build caching, or structuring pipelines for monorepos.
type: skill
metadata:
  short-description: CI/CD pipeline design and deployment strategies
---

# CI/CD Pipeline Patterns

## Platform Detection

Check which CI/CD platform the project uses:
- `.github/workflows/*.yml` → GitHub Actions
- `bitbucket-pipelines.yml` → Bitbucket Pipelines
- `.gitlab-ci.yml` → GitLab CI
- `azure-pipelines.yml` → Azure Pipelines
- `Jenkinsfile` → Jenkins

Use `context7` to look up platform-specific syntax for the detected platform.

## Pipeline Structure

```
Lint → Test → Build → Deploy (staging) → Deploy (production)
         ↓
    Artifacts & Caching
```

**Rule:** Each stage should be independent and cacheable.

## Deployment Strategy Decision

| Strategy | Use When | Rollback | Risk |
|----------|----------|----------|------|
| **Rolling** | Stateless apps, can tolerate mixed versions | Slow | Low |
| **Blue-Green** | Need instant rollback, DB migrations | Instant | Low |
| **Canary** | High traffic, want gradual validation | Instant | Very Low |
| **Recreate** | Dev/test, breaking changes only | Slow | High |

Blue-green and canary need traffic routing, so they rely on the platform (load balancer, service mesh or a progressive delivery controller). Adding one of them to a pipeline is routine when the organization already runs it. A strategy that is new to the organization is an architect decision (see `tsh-delivering-infrastructure`). GitOps delivery (Argo CD, Flux) belongs to `tsh-implementing-kubernetes`.

## Credentials

Prefer OIDC federation over long-lived access keys. The credentials table (per CI platform and cloud, including Bitbucket) and the implementation details live in `tsh-managing-secrets`. Look them up there and do not restate them in the pipeline notes.

## Monorepo Strategy

| Tool | Detection | Approach |
|------|-----------|----------|
| Nx | `nx.json` | `nx affected --target=build` |
| Turborepo | `turbo.json` | `turbo run build --filter=...[origin/main]` |
| None | - | Path filtering in CI config |

## Process

1. **Discover context** → Use `tsh-discovering-technical-context` to find existing CI patterns
2. **Detect platform** → Check for CI config files listed above
3. **Look up syntax** → Use `context7` for platform-specific YAML syntax
4. **Choose deployment strategy** → Use decision table above
5. **Configure credentials** → Use the credentials table in `tsh-managing-secrets`
6. **Validate** → Run pipeline in dry-run/plan mode first

## Checklist

- [ ] Secrets stored in platform secret manager (not in code)
- [ ] Caching configured for dependencies
- [ ] Branch protection enabled on main/master
- [ ] Environment approvals required for production
- [ ] Rollback procedure documented
- [ ] Pipeline uses pinned versions (not `@latest`)

## Anti-Patterns

- Storing secrets in code or logs
- Skipping tests for "quick fixes"
- Using `latest` tags in production images
- Deploying without artifact verification
- Direct pushes to main/master

## Infrastructure as Code Pipelines

Terraform and Terragrunt pipelines (plan and apply stages, remote state and locking, security scanning, OIDC, plan artifacts, PR comments) are described in `tsh-implementing-terraform-modules` (`references/ci-pipelines.md`).

## Summary Output

End an implementation with the summary in `assets/pipeline-summary.template.md`. A blue-green or canary strategy that is new to the organization, multi-environment promotion pipelines and GitOps workflows are architect decisions (see `tsh-delivering-infrastructure`). Adding a strategy the organization already uses, test stages, caching, version updates and pipeline bug fixes are not.

## Connected Skills

- `tsh-managing-secrets` - For credential configuration
- `tsh-discovering-technical-context` - For finding existing patterns
- `tsh-implementing-terraform-modules` - For Terraform and Terragrunt pipelines
- `tsh-implementing-kubernetes` - For GitOps delivery and cluster deployments
- `tsh-delivering-infrastructure` - For skill routing and architect escalation
