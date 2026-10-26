# Plan Review: {plan-file-name}

- **Plan:** {path to the .plan.md}
- **Research:** {path to the .research.md}
- **Reviewed Plan Revision:** {Plan Revision read from the plan, or unknown}
- **Review date:** {YYYY-MM-DD}
- **Iteration:** {n}
- **Verdict:** {APPROVED | REVISIONS NEEDED}
- **Findings:** {n} blockers, {n} warnings, {n} suggestions

## Challenge Domains

One entry per domain, each with a finding or an explicit "no issue detected":

- **Technology and stack decisions:** {finding or no issue detected}
- **Irreversible or high-cost decisions:** {finding or no issue detected}
- **Contradictions with research or prior context:** {finding or no issue detected}
- **Scope gaps and silent omissions:** {finding or no issue detected}
- **Cross-cutting decisions that propagate:** {finding or no issue detected}
- **Build vs buy vs reuse:** {finding or no issue detected}

## Decision and Revision History

Compact table, oldest to newest, present on every iteration. Keep every cell phrase-length. Include only the highest-signal plan decisions, reviewer challenges, architect responses and outcomes that still matter. On iteration 1, record the initial plan-shaping decisions you challenged and why they mattered. Show how the review influenced the plan.

| Date | Iteration | Decision / Topic | Problem / Challenge | Plan Decision / Change | Status |
| --- | --- | --- | --- | --- | --- |
| {YYYY-MM-DD} | {n} | {topic} | {challenge} | {change or none} | {open / changed / resolved / kept / dropped} |

## Top Failure Modes

{The strongest reasons this plan may fail or create expensive rework.}

## Unproven Assumptions

{Assumptions the architect must verify or tighten.}

## Most Likely Rework Triggers

{The parts most likely to send implementation back for redesign or patch-up work.}

## Questions the Architect Must Answer Before Coding

{Unresolved questions that materially affect execution.}

## Findings

### BLOCKERS

{Per finding: title, concise reasoning, evidence (file or plan section), action needed.}

### WARNINGS

{Same structure.}

### SUGGESTIONS

{Same structure.}

## Verdict

{APPROVED | REVISIONS NEEDED} - {one or two sentences of justification}
