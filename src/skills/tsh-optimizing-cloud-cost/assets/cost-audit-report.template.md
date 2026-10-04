# [AWS | GCP] Cost Optimization Audit

**Account / Project:** `[profile or project id]`   **Region:** `[region or "all"]`   **Date:** [YYYY-MM-DD]
**Data sources:** [IaC (Terraform) / live API / both]
**Scope:** [all services / specific services]

---

## Executive Summary

- [3 to 6 bullets]

---

## IaC vs Live Infrastructure Drift

| # | Resource | IaC State | Live State | Drift Type |
|---|----------|-----------|------------|------------|
| 1 | `[id]` | `[value in code]` | `[live value]` | Config drift |
| 2 | `[id]` | Not in IaC | Active | Shadow resource |

(If no IaC was found or no drift was detected, state that clearly.)

---

## Optimization Opportunities

| # | Resource ID | Type | Current Config | Current Cost ($/mo) | Recommended Config | Est. New Cost ($/mo) | Savings ($/mo) | Path |
|---|---|---|---|---|---|---|---|---|
| 1 | `[id]` | [type] | `[config]` | [cost] | `[config]` | [cost] | **[savings]** | Golden |

Path legend: Golden Path, Cost-Optimized, Velocity.

---

## Tag / Label Compliance

| # | Resource ID | Type | Missing Tags or Labels | Status |
|---|---|---|---|---|
| 1 | `[id]` | [type] | `[keys]` | FAIL |
| 2 | `[id]` | [type] | - | PASS |

---

## Critical Security Findings

| # | Resource ID | Type | Finding | Severity |
|---|---|---|---|---|
| 1 | `[id]` | [type] | [finding] | HIGH |

(If none were found, write: "No critical security findings detected.")

---

## Summary

| Metric | Value |
|---|---|
| Total current monthly spend | $[X,XXX] |
| Total estimated optimized spend | $[X,XXX] |
| **Total estimated savings** | **$[X,XXX]/mo ([XX]%)** |
| Tag or label compliance | [XX]% ([X] of [Y] resources fully tagged) |
| IaC coverage | [XX]% ([X] of [Y] resources managed by IaC) |
| Drift detected | [X] resources with configuration drift |
| Data sources used | [API / Terraform code / both] |

---

## Open architectural decisions

- [decision that needs an architect, or "none"]

---

## Recommended Action Order

1. [Apply optimization #X: highest savings, lowest risk]

---

Formatting rules:

- Use `---` between major sections.
- Wrap resource IDs in backticks.
- Use `FAIL` and `PASS` in the compliance status column.
- Left-align all table columns (`|---|`).
- Add no prose paragraphs between tables.
