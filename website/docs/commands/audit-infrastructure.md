---
sidebar_position: 16
title: /tsh-audit-infrastructure
---

# /tsh-audit-infrastructure

**Source:** `src/skills/tsh-audit-infrastructure/SKILL.md`  
**Routes to:** [DevOps Engineer](../agents/devops-engineer) subagent (`tsh-devops-engineer`), delegated from the main thread

A broad and shallow audit of infrastructure for security gaps, cost waste indicators and best-practice violations across IaC, CI/CD pipelines, Kubernetes and cloud resources. For a deep cost and tagging audit of one AWS account or GCP project use [`/tsh-analyze-cloud-costs`](./analyze-cloud-costs).

## Usage

```text
/tsh-audit-infrastructure [aws|azure|gcp|kubernetes|ci-cd] [security|cost|best-practices|all]
```

## What it does

1. Establishes the scope, the focus and any compliance requirement (SOC2, HIPAA, PCI-DSS or none). Asks you when they are missing.
2. Delegates the audit to the DevOps Engineer. The audit is read-only; the agent never deletes or changes resources.
3. If the audit finds something that needs re-architecture, the decision goes to the Architect and back to the DevOps Engineer.
4. Saves the report to `specifications/infrastructure-audit-<yyyy-mm-dd>.md` and shows you the path, the executive summary and the top priorities.

## Secrets gate

The security part of the audit is governed by the `tsh-managing-secrets` skill. If that skill cannot be loaded, the command stops and asks you: either make it available, or re-scope the audit to exclude security (the report then says so).

## Suggested next steps

`/tsh-implement` with the finding numbers to fix them. Application code security belongs to `/tsh-review`. The command itself fixes nothing.
