# playwright

Browser automation through the Playwright MCP server.

## When to use

- Verifying a frontend change by using the running application.
- Validating interactions (clicks, form submissions, navigation) and checking that elements render accessibly.
- Debugging frontend behavior by inspecting the actual page state.
- Checking that no console errors appear during interactions.

## How to use

1. Make sure the development server is running and reachable before you navigate.
2. Work from the **accessibility snapshot** of the page. It gives a structured view that is more reliable for logic checks than a screenshot. Use screenshots when a visual comparison is the goal.
3. Click through the application the way a user would.
4. Compare what you see with the plan, the design or the expected behavior, and record the differences.

## When blocked

Server not running, authentication required or an unexpected page: stop and report it. Do not verify against the wrong content. In interactive mode ask the user; in delegated mode return `NEEDS_INPUT` or `BLOCKED`.

## Do not use for

- Backend-only tasks.
- Unit-testing individual functions (use the project's test runner).
