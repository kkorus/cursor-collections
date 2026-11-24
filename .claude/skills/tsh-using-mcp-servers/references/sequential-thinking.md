# sequential-thinking

Structured step-by-step reasoning.

## When to use

- Complex designs or logic with many interacting parts (architectures, state machines, concurrency).
- Trade-off analysis between several approaches.
- Breaking a large, ambiguous problem into concrete steps.
- Root-cause analysis of hard-to-reproduce issues, security analysis and data-flow reasoning.
- Mapping dependencies between tasks or stories.

## How to use

- **Revising:** when a step turns out to be wrong or an assumption breaks, revise that thought (`isRevision`) instead of continuing on a bad base.
- **Branching:** when several approaches look viable, branch (`branchFromThought`) and compare them before choosing.
- Finish with a conclusion you can act on, and carry the result into your output.

## Do not use for

- Trivial changes, simple summaries or routine formatting.
- Looking up basic documentation.
- Work where a well-known template already gives the answer.
