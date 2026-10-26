# <task-name> - Implementation Plan

## Contents

_Template navigation only: omit this section from the generated document._

- [Task Details](#task-details)
- [Wildly Important Goal](#wildly-important-goal)
- [Proposed Solution](#proposed-solution)
- [Current Implementation Analysis](#current-implementation-analysis)
- [Open Questions](#open-questions)
- [Human Approval](#human-approval)
- [Technical Context](#technical-context)
- [Implementation Plan](#implementation-plan)
- [Security Considerations](#security-considerations)
- [Quality Assurance](#quality-assurance)
- [Improvements (Out of Scope)](#improvements-out-of-scope)
- [Changelog](#changelog)

## Task Details

| Field            | Value                   |
| ---------------- | ----------------------- |
| Task ID          | <jira-id-or-task-slug>  |
| Title            | <task-title>            |
| Description      | <task-description>      |
| Priority         | <priority>              |
| Related Research | <link-to-research-file> |
| Behavior-preserving | <yes for refactoring plans; omit otherwise> |

## Wildly Important Goal

**Goal**: <one-sentence-statement-of-the-single-most-important-outcome-this-plan-must-achieve>

**Success Measure**: <one-sentence-stating-the-condition-that-proves-the-goal-is-achieved>

**Do NOT touch / do NOT add**: <compact-list-of-out-of-scope-items>

## Proposed Solution

<description-of-proposed-solution-explaining-the-approach-and-the-why-for-reviewers-and-implementors>

<necessary-diagrams>

<!-- The plan must not contain real implementation code or function bodies. Pseudo-code is allowed only to explain a genuinely complicated algorithm. Type definitions, function signatures, DTOs, interfaces and API shapes are allowed when they clarify a contract at a task boundary. -->

## Current Implementation Analysis

### To Be Created

List of new components, functions, utilities that need to be built from scratch:

- <component/function> - <brief description of what it does>

### To Be Modified

List of existing code that needs changes or extensions (with file paths and description of changes):

- <component/function> - `<file-path>` - <what needs to change>

### To Be Reused

List of existing components, functions, utilities that will be reused as they are (with file paths):

- <component/function> - `<file-path>` - <brief description>

## Open Questions

| #   | Question   | Answer   | Status                |
| --- | ---------- | -------- | --------------------- |
| 1   | <question> | <answer> | ✅ Resolved / ❓ Open |

<!-- Dispatch gate: a plan is not dispatchable while any row is `❓ Open`, while an angle-bracket placeholder or an assumed-default command remains in a Verification, Definition of Done or Files slot, or while it contains real implementation code. Replace every slot with a concrete value before the plan goes to review. -->

## Human Approval

| Field              | Value                   |
| ------------------ | ----------------------- |
| Plan Revision      | 1                       |
| Human Decision     | PENDING                 |
| Approved Revision  | -                       |
| Decision Timestamp | -                       |
| Note               | <optional-concise-note> |

<!-- Approval protocol. This table is the only record of human approval of the exact current plan revision; never store it in the plan-review file. `Human Decision` is one of PENDING, APPROVED, CHANGES_REQUESTED, STOPPED. `Decision Timestamp` is ISO 8601 UTC ending in `Z`. An approval is valid only when `Human Decision` is APPROVED, `Approved Revision` equals `Plan Revision` and the timestamp is valid. The architect records only the literal answer of the user, never an inferred consent. A material change bumps `Plan Revision`, sets `Human Decision` to PENDING, clears `Approved Revision` and is logged in the Changelog. Checkbox ticks and progress notes do not invalidate an approval. -->

## Technical Context

Project conventions, coding standards, and patterns discovered during planning. Downstream agents MUST read this section instead of re-discovering the same context.

### Project Instructions

- <summary of the relevant project instructions and rule files (AGENTS.md, CLAUDE.md, scoped rules) — file path + key rules>

### Architecture & Patterns

- <framework, layering, module organization, folder structure conventions>
- <naming conventions, file naming patterns>

### Tech Stack

- <language, framework, key libraries with versions>
- <package manager, build tool, test runner>

### Code Style & Standards

- <formatting, linting rules, import conventions>
- <error handling patterns, validation approach>

### Testing Patterns

- <test framework, test file naming, mocking strategy>
- <test commands: unit, integration, e2e, lint, build>

### Database Patterns

- <ORM, migration tool, entity conventions (if applicable)>

### Additional Context

- <any other project-specific conventions relevant to implementation>

## Implementation Plan

<!-- Source every Verification and Definition of Done command verbatim from Technical Context (Tech Stack and Testing Patterns); never assume a package manager. Each task needs at least one check a reviewer can verify: code tasks use a runnable command, docs and config tasks may use a grep-style assertion. -->

### Phase 1: <phase-name>

**Goal**: <how-this-phase-advances-the-wildly-important-goal>

**Description**: <broader-explanation-of-what-should-be-done-and-why>

**Verification**: <fast-checks-taken-from-technical-context>

#### Task 1.1 - [CREATE/MODIFY/REUSE] <task-name>

**Description**: <brief description of what the task entails, naming the files and the behavior>

**Files**: `<file-path>` (create), `<file-path>` (reuse)

**Definition of Done**:

- [ ] <specific verifiable criterion in the listed files>
- [ ] Run `<verification-command-from-technical-context>`

**Stop Rule**: <stop-condition-or-omit>

**Clues**: <optional-hints-for-the-implementor>

#### Task 1.2 - [CREATE/MODIFY/REUSE] <task-name>

**Description**: <brief description>

**Files**: `<file-path>` (modify - created in Task 1.1)

**Definition of Done**:

- [ ] <specific verifiable criterion in the listed files>
- [ ] Run `<verification-command-from-technical-context>`

**Stop Rule**: <stop-condition-or-omit>

#### Task 1.3 - [CREATE/MODIFY] <docs-or-config-task-name>

**Description**: <a docs, config or content change that has no runnable command>

**Files**: `<file-path>` (modify)

**Definition of Done**:

- [ ] <specific verifiable criterion in the listed files>
- [ ] `<file-path>` contains <expected-heading-or-string> (grep-style check; a docs-only task has no runnable command)

**Stop Rule**: <stop-condition-or-omit>

### Phase 2: <ui-phase-name>

**Goal**: <how-this-phase-advances-the-wildly-important-goal>

**Description**: <broader-explanation-of-what-should-be-done-and-why>

**Verification**: <fast-checks-taken-from-technical-context>

#### Task 2.1 - [CREATE/MODIFY] <ui-component-name>

**Description**: <implementation of the UI component based on the Figma design>

**Files**: `<file-path>` (modify), `<file-path>` (reuse)

**Figma URL**: <figma-url-for-this-component>

**Definition of Done**:

- [ ] <specific verifiable criterion in the listed files>
- [ ] Run `<verification-command-from-technical-context>`

**Stop Rule**: <stop-condition-or-omit>

#### Task 2.2 - [REUSE] UI Verification of <ui-component-name> by the `tsh-ui-reviewer` subagent

**Description**: The engineering manager runs the verify-fix loop of the `tsh-orchestrate-ui-verification` skill for this component. Each pass first runs the `tsh-ui-capture-worker` subagent, which produces `actual.png`, `computed-styles.json` and `a11y-snapshot.yml` in the iteration directory, and only then the `tsh-ui-reviewer` subagent (it follows the `tsh-verifying-ui` skill) with the Figma URL and the dev server URL. On `FAIL` the `tsh-ui-engineer` subagent fixes the component with the full report and a fresh capture-and-review pass follows (at most 5 complete iterations). `VERIFICATION NOT RUN` means the stated blocker is resolved and the capture re-run; it does not consume an iteration and is never a pass.

**Files**: `<file-path>` (reuse)

**Figma URL**: <figma-url-for-this-component>

**UI Verification Status**: for Figma-based UI features only; tracked separately from code review.

- **Component Name**: <ui-component-name>
- **Iteration Count**: <number-of-verification-iterations>
- **Final Status**: <PASSED / ESCALATED / VERIFICATION NOT RUN>
- **Figma URL**: <figma-url-for-this-component>

**Definition of Done**:

- [ ] Every review pass is preceded by a fresh capture; artifacts of an earlier pass are never reused
- [ ] UI verification reaches `PASSED`, or is `ESCALATED` to the user after 5 complete iterations
- [ ] The UI Verification Status above is filled in and the verification report is documented in the Changelog

**Stop Rule**: <stop-condition-or-omit>

### Phase 3: <phase-name>

**Goal**: <how-this-phase-advances-the-wildly-important-goal>

**Description**: <broader-explanation-of-what-should-be-done-and-why>

**Verification**: <fast-checks-taken-from-technical-context>

#### Task 3.1 - [CREATE/MODIFY/REUSE] <task-name>

**Description**: <brief description>

**Files**: `<file-path>` (modify - created in Task 1.1)

**Definition of Done**:

- [ ] <specific verifiable criterion in the listed files>
- [ ] Run `<verification-command-from-technical-context>`

**Stop Rule**: <stop-condition-or-omit>

### Phase 4: Code review

**Goal**: <how-verified-quality-of-the-delivered-changes-secures-the-wildly-important-goal>

**Description**: Final verification of the full implementation. This phase is mandatory and always comes last.

**Verification**: <fast-checks-taken-from-technical-context>

#### Task 4.1 - [REUSE] Code review by the `tsh-code-reviewer` subagent

**Description**: The engineering manager runs the equivalent of `/tsh-review` through the `tsh-code-reviewer` subagent, which follows the `tsh-reviewing-code` skill, on the complete implementation. E2E execution is part of that task; do not run those tests elsewhere. The UI verification result is reported separately from this review.

**Files**: `<file-path>` (reuse)

**Definition of Done**:

- [ ] Run `<verification-command-from-technical-context>`
- [ ] Code review passes with no blocking findings
- [ ] Review outcome documented in the Changelog

**Stop Rule**: <stop-condition-or-omit>

## Security Considerations

- <security consideration relevant to this task>

## Quality Assurance

Acceptance criteria checklist to verify the implementation meets the defined requirements:

- [ ] <acceptance criterion 1>
- [ ] <acceptance criterion 2>
- [ ] <acceptance criterion 3>

## Improvements (Out of Scope)

Potential improvements identified during planning that are not part of the current task:

- <improvement description>

## Changelog

| Date   | Change Description   |
| ------ | -------------------- |
| <date> | Initial plan created |
