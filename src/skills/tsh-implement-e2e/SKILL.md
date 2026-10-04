---
name: tsh-implement-e2e
description: Implement E2E tests using Playwright following Page Object patterns and CI readiness checklists.
type: internal
metadata:
  short-description: Write Playwright E2E tests with Page Objects
---
# tsh-implement-e2e

**Non-interactive** - make reasonable decisions, document them.

## Required Skills

Before starting, load and follow these skills:
- `tsh-analyzing-requirements` - to determine the input source and gather task requirements
- `tsh-discovering-technical-context` - to establish test conventions, existing patterns, and project configuration
- `tsh-writing-e2e-tests` - for Page Object patterns, test structure, mocking strategies, verification loop rules, error recovery, and CI readiness checklist

---

## 1. Context

Follow the `tsh-analyzing-requirements` skill's **Step 0 (Determine input source)** to identify whether context comes from research/plan files, a Jira ID, or directly from the prompt message.

Additionally, always:
- **Read the "Technical Context" section from the plan file** (`*.plan.md`) if it exists — it contains project conventions, test patterns, and commands already discovered during planning. Use it as your primary source and skip re-discovery for aspects already covered.
- Check project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`) only for aspects **not covered** by the plan's Technical Context
- Analyze `playwright.config.ts` + existing Page Objects
- Discover existing test patterns and locator strategies in the codebase

---

## 2. Planning

Map acceptance criteria to scenarios:

| Acceptance Criterion | Scenario Type | Test Name |
|---------------------|---------------|-----------|
| [from plan/prompt] | Happy/Error/Edge | `should [behavior] when [condition]` |

Checklist:
- [ ] Each criterion → at least one test
- [ ] API mocking needs documented
- [ ] Page Objects to create listed

---

## 3. Implementation & Verification

Follow the `tsh-writing-e2e-tests` skill for:
- Page Object patterns and test structure
- Mocking strategies (external APIs only)
- Verification loop rules and iteration limits
- Error recovery procedures
- CI readiness checklist

---

## 4. Summary (required output)

```markdown
## E2E Test Summary

### Coverage
| Criterion | Test | Status |
|-----------|------|--------|
| [from plan/prompt] | [file#test] | ✅/❌ |

Coverage: X/Y (Z%)

### Results
| File | Pass | Fail | Flaky | CI |
|------|------|------|-------|-----|
| login.spec.ts | 5 | 0 | 0 | ✅ |

### Issues
- 🐛 BUG: [desc] → test.fixme()
- ⚠️ FLAKY: [desc] → needs investigation

### Files
- NEW: tests/auth/login.spec.ts
- NEW: pages/login.page.ts
```

Update plan (if plan file exists): check acceptance criteria, add files to Change Log.

---

## 5. Code Review (automatic)

After completing E2E tests implementation, always run the `tsh-code-reviewer` subagent to review the E2E tests against best practices and test quality standards. The agent should be executed automatically without user confirmation. Update the changelog section of the plan file to indicate that E2E code review was performed and include a summary of the findings.
