---
name: tsh-writing-e2e-tests
description: E2E testing standards, patterns, verification procedures, and CI readiness checklists using Playwright. Use when writing, debugging, or reviewing end-to-end tests, fixing flaky tests, creating Page Objects, or mocking external APIs. NOT for unit or integration tests.
type: skill
metadata:
  short-description: Playwright E2E testing patterns and CI readiness
---

# E2E Testing Patterns & Practices

## Process Checklist

Work through these steps in order:

1. **Discover** - read the plan or requirements, `playwright.config.ts`, existing Page Objects and locator strategies.
2. **Write** - map each acceptance criterion to at least one test; create or extend Page Objects.
3. **Run** - run the tests headless and read the failures.
4. **Debug** - inspect the real page state (accessibility snapshot, trace viewer) and fix the cause.
5. **Stabilize** - repeat until the tests pass 3+ consecutive times with no flaky results.
6. **CI** - go through the CI readiness checklist.

## Standards

### Locators and selectors

- Use user-visible locators first: `getByRole`, `getByLabel`, `getByText`.
- Avoid implementation details such as class-based CSS selectors (`.btn-primary`) and XPath. A CSS or structural selector is acceptable only when no user-visible locator exists and `getByTestId` is not feasible; add a comment saying why.
- Use `getByTestId` only when user-visible locators are not feasible.

### Synchronization and assertions

- Rely on auto-waiting assertions, for example `expect(locator).toBeVisible()`.
- Never use `waitForTimeout()`.
- Avoid `waitForLoadState('networkidle')`, it is flaky. Wait for specific UI elements or API responses instead.

### Test data and isolation

- Generate unique data for every run so tests can run in parallel, for example `test-${Date.now()}-${test.info().parallelIndex}`.
- Tests must not depend on state left by previous tests.
- Never hardcode credentials; read them from environment variables.

### Naming

Pattern: `should [behavior] when [condition]`, for example `should display error when login fails`.

## Page Object Pattern

```typescript
export class FeaturePage {
  constructor(readonly page: Page) {}
  get submitBtn() {
    return this.page.getByRole('button', { name: 'Submit' });
  }
  async navigate() { await this.page.goto('/feature'); }
}
```

## Test Structure

```typescript
test('should [behavior] when [condition]', async ({ page }) => {
  const id = `test-${Date.now()}-${test.info().parallelIndex}`;
  // Arrange -> Act -> Assert
});
```

## Authentication, Fixtures and Web Server

- **storageState:** log in once in a setup project and reuse the saved state (`storageState`) in the other projects instead of logging in through the UI in every test. Keep the state file out of version control.
- **Fixtures:** put shared setup (Page Objects, seeded data, API clients) into custom fixtures via `test.extend`, with cleanup after `use`.
- **webServer:** let Playwright start the app with the `webServer` option in `playwright.config.ts` (with `url` and `reuseExistingServer: !process.env.CI`) so the suite does not depend on a manually started server.

## Mocking (external APIs only)

```typescript
await page.route('**/api/external/**', route => route.fulfill({ status: 200, body: '{}' }));
```

## Verification Loop

```
RUN -> FAIL? -> DEBUG (accessibility snapshot / trace viewer) -> FIX -> REPEAT
```

Debugging tools: the accessibility snapshot of a browser tool when one is available, otherwise the trace viewer (`npx playwright show-trace`) or `npx playwright test --debug`.

| Rule | Limit |
|------|-------|
| Max per test | 5 iterations -> `test.fixme()` |
| Max per suite | 15 iterations -> stop |
| Flaky detection | 3 pass/fail mix -> investigate |
| Stability | 3+ consecutive passes required |
| App bug | Mark `test.fixme('BUG: desc')` |

### Error Recovery

| Error | Action |
|-------|--------|
| Timeout | Increase once -> check selector -> check if element renders |
| Element not found | Alternative locator -> check DOM -> verify page loaded |
| Network | Retry -> consider mock -> verify backend |
| Flaky | Explicit waits -> check race conditions -> run 5x |
| App bug | Mark `test.fixme('BUG: desc')` - test is skipped; CI usually still passes unless skipped tests fail the build |

## CI Readiness Checklist

- [ ] Passes headless: `npx playwright test` (Playwright runs headless by default)
- [ ] Uses `process.env.BASE_URL`
- [ ] No hardcoded credentials
- [ ] Explicit viewport

## Summary

Report the result with the template in [assets/e2e-summary.template.md](assets/e2e-summary.template.md).

## Quick Reference

**Always**: accessible locators, unique test data, 3+ passes, mock external APIs
**Never**: `waitForTimeout()`, class or XPath selectors without a reason, test interdependencies, hardcoded creds

## Connected Skills

- `tsh-discovering-technical-context` - for existing test conventions and tooling
- `tsh-ensuring-accessibility` - for semantic markup that makes accessible locators possible
- `tsh-implementing-ci-cd` - for running E2E tests in pipelines
- `tsh-reviewing-code` - for reviewing test code and quality gates
