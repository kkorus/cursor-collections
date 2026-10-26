---
name: tsh-review-ui
description: Single-pass UI verification comparing implementation against Figma design. Use when the user types /tsh-review-ui, asks to verify a UI component, or wants to compare the running app against Figma. Routes to the tsh-ui-reviewer agent.
argument-hint: <figma-url> <dev-url> [component]
disable-model-invocation: true
metadata:
  short-description: Verify a UI implementation against its Figma design
---
<!-- Generated from src/skills/tsh-review-ui/SKILL.md by scripts/generate.mjs. Do not edit. -->

# /tsh-review-ui

Delegate to the `tsh-ui-reviewer` subagent. Perform a single verification pass comparing the current implementation against the Figma design. Report all differences found — do not fix code.

Arguments: the Figma URL, the running dev server URL and optionally the component or section name. Pass them to the subagent. If one is missing, ask the user before delegating.

## Workflow

The subagent loads the `tsh-verifying-ui` skill (process, criteria, tolerances, severity definitions, report format) and follows its 5-step verification process:

1. Validate inputs (Figma URL + running dev server)
2. Get EXPECTED from Figma via `figma`
3. Get ACTUAL from implementation via `playwright` — structure, actual rendered dimensions, and visual screenshot
4. Compare following the skill's verification categories and tolerances
5. Generate structured report following the skill's report format

The Figma design is the **source of truth** for every comparison. When in doubt, the design wins.

**Enumerate ALL differences in a single pass.** Do not stop at the first critical finding — complete every verification category (Structure, Layout, Dimensions, Visual, Components) and report every difference found. The goal is to give the engineer a complete list so all fixes can be applied at once, minimizing the number of verify-fix iterations.

## Delegating and Handling Agent Status

Delegation goes one level deep. You delegate from the main thread, and the agents you delegate to never delegate further. Delegated agents start with a clean context and do not see this conversation, so put everything they need into the delegation prompt.

### Delegation prompt template

```
MODE: delegated
CALLER: <name of your skill or command>
TASK: <what to do, stated specifically>
INPUT_ARTIFACTS:
- <explicit path of each file the agent needs>
PRIOR_OUTPUT: <re-delegation only: the previous STATUS block, verbatim; when ARTIFACTS was "none", the complete previous reply body including the block>
USER_ANSWERS: <re-delegation only: the user's answers, numbered like the questions>
```

- The first line must be exactly `MODE: delegated`. Without it the agent runs in interactive mode and will ask the user instead of returning a status.
- Pass artifact paths explicitly. Never ask the agent to search for them.
- Read-only agents cannot save files, so their partial result lives in the reply body. Keep the full reply of every read-only delegate and pass it as `PRIOR_OUTPUT` on re-delegation, otherwise the agent restarts from zero.
- Omit `PRIOR_OUTPUT` and `USER_ANSWERS` on the first delegation.

### Reading the returned status

Every delegated agent ends its reply with a `STATUS:` block (`STATUS`, `ARTIFACTS`, `SUMMARY`, `QUESTIONS`, `DECISION_NEEDED`, `BLOCKER`). Some tools return the block on a single line (`STATUS: DONE SUMMARY: ...`), so parsing must not depend on line breaks:

- Find the last `STATUS:` followed by one of the four values.
- Read each field as the text after its capitalized name and colon, up to the next field name or the end of the reply.

### Handling each status

| Status | What you do |
|---|---|
| `DONE` | Continue with the workflow. Use the paths in `ARTIFACTS`. If `QUESTIONS` is present, these are open points the agent worked around: ask the user (or apply the answers at the matching gate of your workflow) and apply the answers yourself or pass them on to the next step. Do not re-delegate just for them. |
| `NEEDS_INPUT` | Ask the user the listed `QUESTIONS` in the main thread, all at once and numbered. Then delegate to the same agent again with `PRIOR_OUTPUT` and `USER_ANSWERS`. |
| `NEEDS_ARCHITECT_DECISION` | Delegate to the `tsh-architect` subagent with `DECISION_NEEDED` as the task. Then delegate to the original agent again, with the status block followed by the architect's decision in `PRIOR_OUTPUT`. |
| `BLOCKED` | Show the `BLOCKER` to the user and stop that branch of the work. |
| Missing or unparsable | Treat it as `BLOCKED` and show the raw output to the user. |

### Iteration cap

Re-delegate to the same agent at most 3 times per task. After that, stop and escalate to the user with the latest output. Loops that a workflow defines with their own caps (plan review, code review and fix, UI verification) keep those caps.

A missing skill is a stop, not a skip: when an agent reports that a skill could not be loaded, treat it as `BLOCKED`; do not continue the work without that skill.

The plan review loop (3), the code review loop (3) and the UI verification loop (5) have their own caps, separate from this one. A gate re-ask after a material plan revision is not a review iteration and does not count against any cap.
