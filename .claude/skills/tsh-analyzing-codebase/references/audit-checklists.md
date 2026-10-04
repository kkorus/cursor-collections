# Code Quality Audit Checklists

## Contents

- [Dead code detection](#dead-code-detection)
- [Duplication detection](#duplication-detection)
- [Improvement opportunities](#improvement-opportunities)
- [Architecture review](#architecture-review)
- [Severity levels](#severity-levels)
- [Guidelines](#guidelines)

Apply the checklists to one layer or app at a time. In a monorepo, every app, package and shared library is analyzed and reported separately.

## Dead code detection

- Unused imports across all source files.
- Unused exported functions, classes, types, interfaces and constants that are never imported elsewhere.
- Unused components (frontend) that are not referenced in any route, page or other component.
- Unreachable code paths (for example after return/throw statements, impossible conditions).
- Unused configuration files, environment variables and feature flags.
- Code marked `@deprecated` (or similar) that is no longer referenced.
- Files that are not imported or required anywhere.
- Dead routes or endpoints that are defined but not reachable.
- Code that is only imported in its own test file and nowhere else in production code.

## Duplication detection

- Functions or methods with identical or near-identical logic in different files.
- UI components that render similar structures with minor variations.
- API call patterns, data fetching logic and error handling patterns.
- Validation logic, utility functions and helper methods.
- Type definitions, interfaces and schemas.
- Configuration or constant definitions repeated across modules.
- Copy-pasted blocks that differ only in variable names or string literals.
- Highly similar components or functions that can be merged into one configurable version.

## Improvement opportunities

- Overly complex functions (high cyclomatic complexity, deeply nested logic).
- Functions or classes with too many responsibilities (SRP violations).
- Missing or inconsistent error handling patterns.
- Inconsistent naming conventions or coding styles.
- Missing types or excessive use of `any`.
- Shared logic that could be extracted into reusable utilities or hooks.
- Outdated patterns that could be modernized (callbacks to async/await, class components to functional).
- Missing or insufficient test coverage for critical paths.
- Potential performance issues (unnecessary re-renders, N+1 queries, missing indexes).
- Security concerns (exposed secrets, missing input validation, SQL injection risks).

## Architecture review

Done once for the whole repository, after the per-layer findings are in:

- Are module and package boundaries well defined?
- Is shared code properly extracted and reusable?
- Is the dependency graph between modules clean (no circular dependencies)?
- Is separation of concerns maintained?
- Are the current patterns scalable and maintainable?

## Severity levels

- **Critical** - must be fixed; causes bugs, security issues or significant maintenance burden.
- **Important** - should be fixed; improves quality, readability or maintainability.
- **Nice to Have** - optional improvements; polish and optimization.

## Guidelines

- Be specific: always include file paths and line numbers.
- Be actionable: every finding includes a recommendation for how to fix it.
- Avoid false positives: verify that "unused" code is truly unused by checking all import paths, dynamic imports and re-exports.
- For monorepos, keep findings per layer or app separate.
- The final report must be self-contained and understandable without additional context.
