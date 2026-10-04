# Terraform and Terragrunt CI/CD Pipelines

## Contents

- Pipeline structure
- Required elements
- OIDC credentials
- Environment protection
- Plan artifact pattern
- Anti-patterns
- IaC checklist

Pin every action, image and tool to a release tag or a commit SHA, and look up the current version with `context7`. The snippets below use placeholders for versions.

## Pipeline structure

```
Lint (fmt) → Validate → Security Scan → Plan → [Manual Approval] → Apply
                                          ↓
                                    Save Plan Artifact
                                          ↓
                                    PR Comment with Diff
```

**Rule:** Never use local state in CI/CD. Configure the remote backend before the pipeline runs.

## Required elements

| Element | Implementation | Why |
|---------|---------------|-----|
| Cloud credentials | OIDC federation (see `tsh-managing-secrets` for the per-platform table) | No long-lived secrets |
| State backend | S3 with native locking (`use_lockfile = true`; introduced in Terraform 1.10 and still experimental there, so check the release notes of your version and of OpenTofu), GCS, or Azure Blob | Persistent state and protection against concurrent runs |
| Plan artifact | `terraform plan -out=tfplan` and an uploaded artifact | Apply matches the reviewed plan |
| PR comment | A script step or a maintained PR-comment action | Reviewers see the changes before merge |
| Security scan | Trivy (`trivy config`, which includes the former tfsec rules) or Checkov | Catch misconfigurations early |
| Production guard | `environment: production` with required reviewers | Human approval before infrastructure changes |
| Cache | Cache the provider plugin cache directory (`TF_PLUGIN_CACHE_DIR`) | Faster init, fewer download calls |

Older setups lock S3 state with a DynamoDB table. Do not use that for new work. When you find it in an existing project, mention the migration to `use_lockfile` as an improvement and do not change it unasked.

## OIDC credentials

GitHub Actions with AWS:

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@<pinned version>
    with:
      role-to-assume: ${{ vars.AWS_ROLE_ARN }}
      aws-region: ${{ vars.AWS_REGION }}
```

**Rule:** Always use OIDC federation. Never store cloud access keys as secrets. The role ARN is not a secret, so a variable is enough. For GitLab (`id_tokens:`), Bitbucket (`oidc: true`) and other clouds, use the table in `tsh-managing-secrets`.

Scope the role's trust policy to the repository and branch or environment. Use a read-only role for the plan job (note that `plan` takes the state lock by default, so with S3 `use_lockfile` the role also needs write access to the lock object, or run `plan -lock=false`) and a separate role, limited to the protected environment, for the apply job.

## Environment protection

```yaml
apply:
  runs-on: ubuntu-latest
  needs: plan
  environment: production  # requires manual approval
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

Configure the reviewers in the repository settings under Environments.

## Plan artifact pattern

```yaml
plan:
  steps:
    - run: terraform plan -out=tfplan
    - uses: actions/upload-artifact@<pinned version>
      with:
        name: tfplan
        path: tfplan

apply:
  steps:
    - uses: actions/download-artifact@<pinned version>
      with:
        name: tfplan
    - run: terraform apply tfplan
```

**Rule:** Apply must use the exact plan that was reviewed, not regenerate it. A saved plan can contain sensitive values, so restrict who can read the artifact.

## Anti-patterns

- `apply -auto-approve` without environment protection gates
- Repeating `terraform init` in every job without a plugin cache
- Missing remote state backend configuration
- No plan artifact between the plan and apply jobs
- Skipping security scanning (Trivy, Checkov)
- Using unpinned provider versions
- Not posting the plan output to the PR for review
- Starting new work with DynamoDB-based state locking

## IaC checklist

- [ ] Remote state backend configured (S3, GCS or Azure Blob)
- [ ] State locking enabled (`use_lockfile` for S3, native for GCS and Azure Blob)
- [ ] OIDC federation for cloud credentials
- [ ] Security scanning in the pipeline (Trivy or Checkov)
- [ ] Plan artifact saved and reused in apply
- [ ] Plan diff posted as a PR comment
- [ ] Environment protection on production
- [ ] Provider versions pinned in `versions.tf`
- [ ] Plugin cache kept between runs
