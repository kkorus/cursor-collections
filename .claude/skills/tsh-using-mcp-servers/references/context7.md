# context7

Documentation lookup for libraries, frameworks, SDKs and cloud tools.

## When to use

- Verifying API usage, configuration and compatibility of a third-party library or service.
- Finding integration patterns and solutions to specific errors.
- Checking current best practices for a specific version of a tool.

## How to use

1. **Check the version first.** Read the project configuration (`package.json`, `pom.xml`, `go.mod`, `composer.json`, `requirements.txt`, `pyproject.toml`, `versions.tf`, `Chart.yaml`) and find the exact version of the library or tool.
2. **Include the version in the query.** "React 18 useTransition" finds better results than "React transitions".
3. **Resolve the library ID first, then query it.** Use the library-resolving tool to obtain the ID, then the documentation-query tool with that ID. If you already know the ID (for example `/microsoft/playwright.dev` for Playwright), skip the resolving step.
4. **Prefer official documentation.** Avoid unverified blogs and forums, which pollute the context.
5. **Stay narrow.** One focused query per question.

## Do not use for

- Searching the local codebase (use code search instead).
- Internal business logic, or questions about standard language features.
- Minor changes where the answer is already clear from the code in front of you.
