# Task Routing

Which specialist gets which task, and which skill that specialist follows. The seam test used below is defined in the Plan governance section of the manager's `SKILL.md`; apply it from there.

## Contents

- Routing table
- Skills each delegate follows
- Escalation
- UI scope rule

## Routing table

| Task (plan-based unless stated) | Delegate | Rule |
| --- | --- | --- |
| App code, NON-UI, actionable low-risk seam | `tsh-plan-implementor` (default) | The task passes the seam test |
| App code, NON-UI, complex or exception | `tsh-software-engineer` | The task fails the seam test; the plan-implementor returned `NEEDS_ARCHITECT_DECISION` twice for the same task; refactor-mode tasks |
| UI task (Figma URL, or any rendered-UI change), including UI fix passes | `tsh-ui-engineer` | Regardless of complexity; `tsh-software-engineer` and `tsh-plan-implementor` never edit UI |
| Plan-less work (Quick flow, `/tsh-implement <description>`, `/tsh-debug`) | `tsh-software-engineer` (non-UI) or `tsh-ui-engineer` (UI) | No `PLAN:` line, no gate |
| E2E tests, infrastructure (Kubernetes, CI/CD, observability), LLM prompts, documentation | `tsh-e2e-engineer`, `tsh-devops-engineer`, `tsh-prompt-engineer`, `tsh-technical-writer` | Documentation means README, CHANGELOG, `/docs` and the docs site; never skills or agents under `src/` (those stay with the `tsh-ai-customization-*` flow) |
| `[REUSE]` UI verification | You run `tsh-orchestrate-ui-verification` | One item at a time, never batched |

## Skills each delegate follows

| Delegate | Skill named in the task text |
| --- | --- |
| `tsh-plan-implementor`, `tsh-software-engineer`, `tsh-ui-engineer` | `tsh-implement-task` |
| `tsh-technical-writer` | `tsh-writing-documentation` |
| `tsh-devops-engineer` | `tsh-delivering-infrastructure` |
| `tsh-e2e-engineer`, `tsh-prompt-engineer` | their preloaded skills; do not name extra ones |

## Escalation

If the plan-implementor fails or returns `BLOCKED` for a reason other than approval after the loop cap of 3, re-route the task once to `tsh-software-engineer`. If that fails too, stop and ask the user. A `BLOCKED` caused by a missing or invalid human approval is not an escalation: go back to the gate.

## UI scope rule

Any change to rendered UI counts as UI work, also when the plan has no `[REUSE]` verification task. It goes to `tsh-ui-engineer`, and a Figma-backed screen goes through `tsh-orchestrate-ui-verification` before code review. If the Figma reference is missing, ask the user for it.
