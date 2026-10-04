# <task-name> - Implementation Plan

## Contents

_Template navigation only: omit this section from the generated document._

- [Task Details](#task-details)
- [Proposed Solution](#proposed-solution)
- [Current Implementation Analysis](#current-implementation-analysis)
- [Open Questions](#open-questions)
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

## Proposed Solution

<description-of-proposed-solution>

<necessary-diagrams>

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

### Phase 1: <phase-name>

#### Task 1.1 - [CREATE/MODIFY/REUSE] <task-name>

**Description**: <brief description of what the task entails>

**Definition of Done**:

- [ ] <specific verifiable criterion>
- [ ] <specific verifiable criterion>

#### Task 1.2 - [CREATE/MODIFY/REUSE] <task-name>

**Description**: <brief description>

**Definition of Done**:

- [ ] <specific verifiable criterion>

### Phase 2: <ui-phase-name>

#### Task 2.1 - [CREATE/MODIFY] <ui-component-name>

**Description**: <implementation of the UI component based on Figma design>

**Figma URL**: <figma-url-for-this-component>

**Definition of Done**:

- [ ] <specific verifiable criterion>
- [ ] <specific verifiable criterion>

#### Task 2.2 - [REUSE] UI Verification of <ui-component-name> by the `tsh-ui-reviewer` subagent

**Description**: Run the `tsh-ui-reviewer` subagent (it follows the `tsh-verifying-ui` skill) to verify <ui-component-name> against the Figma design. Pass the Figma URL and the dev server URL. The engineering manager runs the verify-fix loop of the `tsh-orchestrate-ui-verification` skill: if verification fails, the fix goes to `tsh-software-engineer` and the component is verified again.

**Figma URL**: <figma-url-for-this-component>

**Definition of Done**:

- [ ] UI verification passes, or the mismatch is escalated to the user by the verify-fix loop
- [ ] Verification report documented in Changelog

### Phase 3: <phase-name>

#### Task 3.1 - [CREATE/MODIFY/REUSE] <task-name>

**Description**: <brief description>

**Definition of Done**:

- [ ] <specific verifiable criterion>

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
