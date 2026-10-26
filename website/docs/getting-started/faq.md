---
sidebar_position: 6
title: FAQ & Best Practices
---

# FAQ & Best Practices

This page captures the practical working habits TSH teams use with TSH AI Collections day to day.

It is not a rigid protocol. Think of it as a set of defaults from the people who built and use the framework on real projects. The answers apply to Cursor, Claude Code and Codex unless a heading says otherwise; the few answers that depend on one tool are collected under [Cursor](#cursor).

If you are new to the framework, start with the [Workflow Overview](../workflow/overview), then come back here for the operating advice teams usually ask about after the first few sessions.

:::tip The Short Version
- Default to `/tsh-analyze-materials` when you need to shape or expand a task.
- Default to `/tsh-implement` when you need to build, fix, or change something.
- Use one session for one meaningful slice of work, not one tiny story at a time.
- Review `research.md` and `plan.md` carefully, but keep durable human documentation separate.
:::

## Commands and sessions

### Which commands should I use most of the time?

For most projects, a small set of commands covers nearly all daily work:

- `/tsh-analyze-materials` when you need to create or refine a task, backlog item, or specification.
- `/tsh-implement` when you need to implement a feature, hotfix, or larger change.
- `/tsh-review` when you want an explicit code review pass.
- `/tsh-review-ui` when you need to verify a UI against Figma.

The common default is to shape the task with `/tsh-analyze-materials` if needed, deliver it with `/tsh-implement`, and run `/tsh-review` or `/tsh-review-ui` when the task needs an explicit quality check.

For Figma-backed UI tasks, `/tsh-implement` runs the verification loop automatically. What you need to provide is a running app, the exact full dev server URL, access to the Figma design, and the `playwright-cli` command (see [Prerequisites](./prerequisites#figma-backed-ui-verification)).

You do not need to switch agents manually for every step. The main commands route work to the right agents for you.

### How big should one `/tsh-implement` session be?

Usually bigger than people expect.

TSH teams do not optimize for a fixed rule like "stay below 50% of context". A more useful default is to keep one session focused on one meaningful implementation slice: often a large story, a few related stories, or even an epic if the work is coherent. Doing everything story by story is often less efficient because the framework has to rebuild task context, technical context, and planning overhead again and again.

Good examples of one session: one large story, several related stories from the same epic, a coherent epic with shared context. Bad examples: two unrelated implementations, a session that keeps drifting across different features, a session that has become mostly cleanup after a completed feature.

### What should I do when conversation compaction starts?

Treat it as a signal, not an automatic failure.

If compaction appears once but you are still working on the same coherent slice, you can often continue. If it keeps happening or the task has grown too wide, narrow the scope and start a new session with a tighter request. A practical split is often better than a tiny split: instead of restarting for every story, move to something like "epic 1, stories 1-4" if that is still one coherent change.

How compaction is shown, and how large the context window is, depends on your tool.

### Is it better to work story by story?

Usually not.

TSH discourages over-splitting implementation into tiny sessions when the work shares the same technical and business context. Repeating the surrounding workflow for every story can consume as many or more tokens than handling a larger slice once. If the work belongs together, bundle it. If it is a real scope break, split it.

### After implementation, should I keep writing in the same chat or run `/tsh-implement` again?

Use the size of the follow-up change as the rule.

Stay in the same chat when it is a small fix, you found a bug during manual testing, the issue can likely be resolved in 2-3 messages, or you want to preserve the technical context already built. Start a new `/tsh-implement` flow when the change is substantial, the scope is shifting, you need fresh research or a fresh plan, or the current session is already bloated.

### If I type a plain follow-up like "here is the bug, fix it", will the Engineering Manager still delegate?

Usually yes, when the follow-up is meaningful enough. Only very small fixes may stay local. If you want a full structured pass with fresh research and planning, use `/tsh-implement` explicitly.

Note that a follow-up on plan-based work does not skip the approval gate: a material change to the plan resets the approval, and the manager asks you again before executors change files.

### Should I ask several related things at once or keep chatting line by line?

Batch related requests whenever possible. Issue clear requests and expect outcomes, instead of walking the agent sentence by sentence. Saving up several related instructions into one message is usually more efficient than stretching the same intent across many tiny turns, especially when you already know the goal and can provide the context up front.

## Research, plans and documentation

### How should I use `research.md` and `plan.md`?

Treat them as working artifacts for the agents and for you as the developer solving the task.

1. The Context Engineer produces `research.md`.
2. You review it critically and continue the discussion if anything looks wrong or incomplete.
3. The Architect produces `plan.md`, which the Plan Reviewer checks.
4. At the approval gate you choose `Approve plan`, `I have comments` or `Stop`. Only an approved plan lets executors change files.
5. Implementation starts.

The important part is not the file names. It is that you read these artifacts carefully instead of treating them as automatic approvals.

### Are `research.md` and `plan.md` the same as project documentation?

No. They are useful implementation artifacts, but not a substitute for durable documentation intended for humans.

If a task produces knowledge the team should keep, turn it into proper documentation: ADRs for important architectural decisions, developer-facing feature documentation, or team documentation in the repository or Confluence. This keeps long-lived documentation readable and avoids overloading the repository with stale implementation artifacts that an agent may over-trust later.

### When should I create ADRs or human documentation?

Whenever a decision matters beyond the current session. An ADR is a good default for an important architectural or technical decision; it can be detailed or lightweight. The point is to capture the reasoning in a form the team can revisit later. The Technical Writer agent can also produce documentation for the team after implementation, for example based on the feature you just built.

### Where should I keep specifications and old planning artifacts?

There are two practical patterns. Keep them in the main repository while they are still active, which is convenient when the specs are fresh. Or move older or less relevant specs to a separate `-meta` repository, which is useful when the main repository starts accumulating outdated material. Too many old specs can pollute context and make an agent pull in information that is no longer trustworthy. A multi-root workspace, where your tool supports one, lets you keep the archive available and add only the folders you need.

### If I extend an existing feature later, should I reuse the old plan or start from scratch?

It depends on how far the change moves away from the original intent. Reuse the existing specification or plan when the new work extends the same feature and the previous intent is still valid. Start fresh when the change is a major deviation, the old specs are stale or misleading, or the new direction needs a new research phase anyway.

One middle ground is to ask for a second plan in the same folder that extends the base plan and states what changed. Another is to archive the current state in a `-meta` repository, then rerun the full research and plan flow. Attaching the previous specification helps preserve continuity when it is still trustworthy, at the cost of extra context; if it is stale or contradictory, do not force it into the new session. A revised plan needs a new approval.

### How should I organize specification folders?

Use names that stay readable after a few weeks. If you do not have an external task identifier such as a Jira ticket, a practical convention is `NNNN-short-description`, which gives you ordering and makes many folders easy to scan later.

## UI verification

### How do I verify a page that needs a login?

The UI Capture Worker never reads `.env` files, never prints the environment, and never bypasses authentication. It can log in in two ways:

- **Environment variables.** Export `TSH_UI_LOGIN_EMAIL` or `TSH_UI_LOGIN_USERNAME`, and `TSH_UI_LOGIN_PASSWORD` (other fields use `TSH_UI_LOGIN_<FIELD>`) in the shell **before** you start your tool. A running tool cannot receive new variables, and a tool launched from a desktop icon does not see your shell exports, so start it from that shell; this costs a restart. Use a dedicated test account.
- **Headed login (default for single sign-on and multi-factor).** You log in once in a visible browser session and the worker reuses the saved session state.

If the variables are missing the worker asks for the exact names instead of continuing. Whether the variables reach the worker is **not yet verified** for Codex; see [Supported Tools](./supported-tools). The flow is described in the [UI Verification Flow](../workflow/ui-verification-flow).

### What does `VERIFICATION NOT RUN` mean?

It means the UI check could not be completed on trustworthy evidence, so it says nothing about whether the UI matches the design. Typical causes are a missing or stale capture, a Figma node that cannot be reached, a login the worker could not complete, or a host that cannot open the screenshot images. It is never treated as a pass and it does not use up one of the 5 iterations. The Engineering Manager shows you the reason and asks what to do: fix the cause (start the app, export the login variables, authorize the Figma MCP) and run it again, or verify manually. Which tools can open the images is listed in [Supported Tools](./supported-tools); Codex is not yet verified.

## Cursor

These answers describe Cursor behavior. Claude Code and Codex differ, and no equivalent claim is made for them here.

### Should I watch token percentage and open a new chat at 50%?

No. TSH does not use a fixed percentage rule. The practical question is whether the session is still productive and cost-effective. Open a new chat when the scope has drifted into a different problem, when compaction keeps repeating, when the agent has to reconstruct too much intent from a long history, or when you are no longer changing the same feature slice. If none of those happen, continuing in the same session is usually fine.

### Do I need to switch models manually?

Usually no. Model selection in Cursor is a session-level choice made in the model picker, and the agents of this collection do not bind it. For normal use, rely on your default model and avoid unnecessary model juggling. Switching manually makes sense when you run a single agent directly and have a clear reason to override the default.

### Should I enable Bypass Approvals?

If your environment and risk tolerance allow it, many teams find it useful: the workflow can involve many repeated approvals for file operations and tool usage, especially during implementation. Only do this if it matches your team's security expectations and the kind of repositories you work on. It does not replace the plan approval gate, which is part of the workflow itself.

## Mindset

### What is the best default mindset for using TSH AI Collections?

Use the framework to do the heavy lifting, but keep human review where it matters: let the main commands orchestrate the work, keep sessions large enough to preserve useful context, avoid needless agent and model switching, review research, plans and code critically, and promote durable knowledge into real team documentation. It works best as a structured delivery workflow, not as a chat toy.
