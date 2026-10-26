---
name: tsh-reviewing-plans
description: Adversarial review of implementation plans (.plan.md) that finds likely failure modes, hidden assumptions and costly rework risks before coding begins, and produces a plan-review report with an APPROVED or REVISIONS NEEDED verdict. Use when a plan has just been produced or revised and must be validated before implementation, or when asked to stress-test, challenge or review a plan.
type: skill
requires-mcp:
  - context7
  - sequential-thinking
metadata:
  short-description: Stress-test an implementation plan and write a plan-review report
---

# Reviewing Plans

Stress-test an implementation plan before it is handed to engineers. You are the challenge gate between planning and implementation: look for the strongest reasons a basically sound plan could still fail, create expensive rework or give the team false confidence. Persist the final report as `{task-name}.plan-review.md` next to the plan, in the same specifications directory (or at the path the caller gave you).

## Approach

Assume the plan is mostly correct. Then attack where it is brittle, optimistic, unsafe to execute or likely to cause costly rework.

Prioritize real execution risk over template, style or wording issues. Do not broaden the scope or redesign for taste. Prefer a few strong findings to many cosmetic notes. Challenge the biggest decisions first: technology choices, irreversible commitments and departures from the established repository context. A deviation from research or prior direction without clear justification is a red flag.

Focus on high-signal execution risks:

- **Hidden assumptions**: unproven beliefs about repository state, interfaces, ownership, environment or data shape
- **Likely failure modes**: the most plausible ways the implementation could break, stall or diverge from intent
- **Sequencing and dependency traps**: order-of-operations mistakes, coupling hazards, coordination bottlenecks
- **Integration mismatches**: wrong assumptions about APIs, abstractions, contracts, framework behavior or library capabilities
- **Migration and data risks**: schema drift, backfill gaps, compatibility problems, rollback hazards, irreversible changes
- **False confidence in testing or rollout**: weak validation, blind spots in the rollout, definitions of done that pass while real risk remains
- **Over-engineering when it creates delivery risk**: abstractions or complexity that materially raise cost, coordination burden or rework probability

## Challenge Domains

Probe every domain on every review, even when the conclusion is that no issue was detected. They are mandatory attack vectors.

- **Technology and stack decisions**: challenge any choice that differs from the research, prior iterations, team expertise or established project patterns. Flag language or framework switches mid-project, unfamiliar stacks without justification, and choices that break code sharing or team velocity.
- **Irreversible or high-cost decisions**: database engine, primary language or framework, deployment model, vendor lock-in, and a data model shape that propagates everywhere.
- **Contradictions with research or prior context**: if the research, earlier plan iterations or the codebase established a direction and the plan deviates, challenge it as a potential BLOCKER. The architect must justify the deviation.
- **Scope gaps and silent omissions**: requirements from the research the plan does not address, flows with no tasks, edge cases acknowledged in research but missing from the phases.
- **Cross-cutting decisions that propagate**: choices in Phase 1 that lock in later phases, such as the auth model, API contract shape, state management, shared code strategy, repository layout and CI/CD assumptions.
- **Build vs buy vs reuse**: building from scratch when established libraries exist, or adopting new dependencies when existing project patterns already solve the problem.

## Severity Levels

| Severity | Definition | Action required |
| --- | --- | --- |
| **BLOCKER** | Exactly one of the six categories below | The plan must be revised |
| **WARNING** | Any other meaningful weakness or assumption that could cause delays, defects or local rework but can be managed during implementation | Should be addressed; does not block |
| **SUGGESTION** | A lower-signal concern worth noting only when it has practical value | Nice to have; does not affect approval |

The six BLOCKER categories. This skill is the only place that lists them:

1. Requirement or scope contradiction: the plan contradicts a requirement or the scope of the research or the task.
2. Architecture or technology choice that contradicts the research or the project instructions, without a recorded justification.
3. Security or data-loss risk without mitigation.
4. No safety proof: a risky change (migration, backfill, destructive operation, broad refactor) with no test, check or fallback that would show it is safe.
5. Unexecutable task: a missing seam, a circular dependency, or an `Open` question that implementation cannot proceed without.
6. Irreversible step without rollback.

Everything else is a WARNING or a SUGGESTION, never a BLOCKER.

### Execution-critical open decisions

An unresolved open decision on the critical path is a category 5 BLOCKER: implementation cannot safely start, parallel work cannot proceed, or the eventual choice forces broad rework. Examples: a provider or vendor choice required before the work can start, an unresolved stack or framework choice, an unresolved auth, privacy or security rule, an unresolved integration contract or migration prerequisite. It is not a blocker only when the plan proves the decision is deferred off the critical path.

### Carry-forward and escalation

If a previous review raised a BLOCKER and the revised plan still leaves it unresolved, carry it forward explicitly. It must not silently disappear. A finding closed by a recorded justification stays visible in the history table.

### Failure-oriented standards

Flag a plan that shows these as WARNING, unless the problem fits one of the six categories:

- Unverified assumptions about existing files, interfaces, ownership, data shape or runtime behavior
- Sequencing that needs an impossible order, risky coordination or unsafe partial states
- Integration points that are underspecified or inconsistent with the real codebase abstractions
- Test or rollout plans that can pass while critical production risks remain untested

### Over-engineering

Over-engineering is a WARNING, never a BLOCKER: abstractions used only once, patterns absent from the codebase without justification, generalization for requirements that are not in the research, needless indirection. Name the simpler alternative.

### Ineligible concerns

These are never findings, at any severity: grep syntax of a check, counts of diff hunks, style, conformance to the plan template, bookkeeping of the `Files` lines, wording, documentation sync and the verbosity of reports.

### Finding discipline

Every finding states four things: the criterion it breaks (the category for a BLOCKER), the evidence (plan section or file), the consequence if ignored and the minimum correction. A finding without evidence is dropped.

## Approval Guidance

- `APPROVED` is allowed only when there is no BLOCKER and no unresolved `Open` question. Warnings may remain when they are local and do not gate the start of implementation. A short `APPROVED` report is a normal outcome.
- `REVISIONS NEEDED` is required when any BLOCKER exists.
- Never approve a plan with BLOCKER findings.
- The verdict is bound to one plan revision: read `Plan Revision` verbatim from the `Human Approval` table of the plan and record it as `Reviewed Plan Revision` in the report and return it to the caller as `REVIEWED_PLAN_REVISION`. If the plan has no readable `Plan Revision`, record `unknown`, which forces `REVISIONS NEEDED`.
- Never state or evaluate human approval. A reviewer verdict is not a human decision.

## Workflow

1. **Read the research file** (`.research.md`) first, to understand the requirements, acceptance criteria and constraints the plan must address, so the challenge is grounded in the intended outcome.
2. **Read the plan file** (`.plan.md`): architecture, phases, tasks and definitions of done. Note the `Plan Revision`. If any row of Open Questions is `Open`, that is a category 5 BLOCKER: stop the analysis passes, still write the report with the verdict `REVISIONS NEEDED`.
3. **Challenge-domains pass**: attack the most consequential decisions domain by domain. State for each domain whether an issue was found. Pay special attention to stack choices that deviate from the research or prior iterations.
4. **Failure-modes pass**: find the strongest reasons the plan may fail or cause major rework: integration mismatches, unsafe migrations, coordination traps, weak rollout strategies, brittle task breakdowns.
5. **Hidden-assumptions pass**: identify assumptions that are unproven in this repository (files, abstractions, contracts, environment behavior, team coordination, data shape).
6. **Codebase-reality pass**: for every critical file, component, function, class, abstraction or dependency the plan relies on, search the codebase to verify it exists, read it to verify it has the expected interface, and flag every reference that does not match or is more constrained than assumed. If the plan says "modify file X to add method Y", check that X exists and the change fits. Never skip this pass.
7. **Sequencing-and-feasibility pass**: order-of-operations traps, risky migrations, rollback gaps, coordination issues, test and rollout blind spots.
8. **Execution-critical decision gate**: before the verdict, check explicitly for unresolved provider, vendor, stack, framework, auth, privacy, security, integration-contract or migration-prerequisite decisions on the critical path.
9. **Decision and revision history**: build a `Decision and Revision History` table on every review, including iteration 1. On later iterations, read the existing report first and update the same table. Prefer appending rows; update a row only when that keeps the table clearer. Use compact `Status` values such as `open`, `changed`, `resolved`, `kept` or `dropped`. If an issue is downgraded or dropped, say why in the row.
10. **Write the report and the verdict**: save the full report with the template in [assets/plan-review.template.md](assets/plan-review.template.md). Do not reduce the saved artifact to a short verdict memo. Return the verdict, the reviewed plan revision and the report path to the caller. You may add advisory notes after the findings; they never change the verdict.

## Review Requirements

- Target 5-10 substantive findings when the evidence supports them. If fewer are found, state why the plan appears unusually robust.
- Attribute at least 2-3 findings to the challenge-domains pass when the evidence supports them.
- Do not pad the report with cosmetic, wording or style-only notes, and do not fall back to generic quality audits.
- Treat an unexplained deviation from the research or the project instructions as a category 2 BLOCKER until justified.
- Address every challenge domain, even if only with "no issue detected".
- Justify explicitly any downgrade or removal of a previously raised high-signal issue.
- Never modify the plan and never suggest scope expansion; stay inside the defined task scope.
- Be pragmatic: do not bounce a plan for cosmetic issues or survivable differences in style.

## Key Principles

- **Failure orientation**: look first for why the plan may break, stall or trigger major rework.
- **Verify, don't assume**: search the codebase before flagging phantom references.
- **Compressed history**: keep the decision history concise and decision-oriented.
- **Pragmatism over permissiveness**: issues can exist and the verdict still be `APPROVED`, but not with execution-critical open decisions.
- **Scope discipline**: never add features or requirements that are not in the research.
- **Carry critical issues forward** until genuinely closed.

## Connected Skills

- `tsh-designing-architecture` - to test whether the proposed shape, phasing and trade-offs are likely to fail in execution
- `tsh-analyzing-codebase` - during the codebase-reality pass to verify that references, dependencies and abstractions exist as assumed
- `tsh-discovering-technical-context` - when repository conventions or established abstractions matter to the execution risk
- `tsh-analyzing-implementation-gaps` - to expose gaps between what the plan assumes exists and what must be built, migrated or coordinated
- `tsh-designing-databases` - when the plan changes schemas, migrations, backfills, indexing or transaction boundaries
