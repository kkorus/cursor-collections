# figma

Design access through the Figma MCP server.

## When to use

- A task, plan or ticket links Figma or FigJam designs.
- You need design specifications: spacing, typography, colors, components, variants and interaction states.
- A Figma or FigJam diagram describes a user flow or business logic.

## How to use

1. Treat the linked design as the **visual source of truth** for UI work.
2. Extract exact values and map them to the design tokens that exist in the codebase. Do not hard-code values that a token already covers.
3. Look for annotations, comments and flow lines that explain behavior, not only the layout.
4. Note states the design does not show (error, empty, loading, responsive behavior) and ask about them instead of guessing.
5. When the design and the specification disagree, report the conflict. Do not pick a side silently.

## When blocked

Missing URL, no access or tool errors: stop and report it. In interactive mode ask the user; in delegated mode return `NEEDS_INPUT` or `BLOCKED`. Do not continue without a design reference for UI work.

## Do not use for

- Backend-only work with no UI or flow described in Figma.
- Tasks for which no design context exists.
