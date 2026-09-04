---
name: tsh-resolving-skill-references
description: "Defines the resolution order for locating a skill file that a delegation names by skill name, and the hard stop that applies when it cannot be located. Use when a skill file is not found, when a skill reference cannot be resolved, when the Skill tool rejects a skill name, or before proceeding with a delegation step without its governing skill."
---

# Resolving Skill References

Defines how a worker turns a skill reference — a backticked skill name in a delegation instruction — into a skill file it can read, and what to do when every attempt fails.

<principles>

<name-not-location>
A skill reference names a skill; it does not state where the file lives. The same collection is read from a project's own skill directory in one workspace and from an installed skills root in another, so any single hardcoded location is wrong somewhere. Resolution is the worker's job, and this resolution order is how it is done.
</name-not-location>

<read-not-invoke>
Internal step skills, command skills, and delegate-only agent workers are marked non-auto-invocable by layer convention, so the Skill tool refuses them by name. They are located and **read**. A Skill-tool rejection is a signal to locate and read the file — never a licence to proceed without the skill, and never a reason to change or remove the layer flag that caused the rejection.
</read-not-invoke>

<fail-loud>
Successful location is not guaranteed. On a host with no installed skills root, resolution can legitimately end unresolved. What is guaranteed is that the failure becomes visible: the worker stops and asks. Proceeding on general knowledge or on an approximate substitute is a workflow violation, because the output then looks like it was governed by the skill when it was not.
</fail-loud>

</principles>

## Resolution Process

Use the checklist below and track your progress:

```
Progress:
- [ ] Step 1: Project skill collection
- [ ] Step 2: Installed skills root, derived
- [ ] Step 3: Search by name
- [ ] Step 4: Skill tool by name
- [ ] Step 5: Hard stop
```

Attempt each step only after the previous step has failed. Stop at the first step that yields a file whose frontmatter `name` equals the requested skill name.

**Step 1: Project skill collection**

Try the workspace's own collection first — it is the most specific match and the version the project intends. Two roots are legal in a Cursor project, and each may be nested by layer or flat, so try four shapes:

- `.cursor/skills/<layer>/<name>/SKILL.md`, where `<layer>` is one of `agents`, `commands`, `workflows`, `internal`
- `.cursor/skills/<name>/SKILL.md`
- `.agents/skills/<layer>/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`

`.agents/skills/` is listed first in the official Cursor skill-directories table, so a consuming project may use it even when the collection being read ships under `.cursor/skills/`. Cursor identifies a skill by the directory that contains `SKILL.md`, not by the category folder, which is why both the nested and the flat shape are legal under either root.

**Step 2: Installed skills root, derived**

Derive the installed skills root; do not assume a vendor-specific location. **The installed skills root is the directory that contains the skill directory the worker is currently executing from.** A worker reading `<root>/<some-skill>/SKILL.md` finds every other installed skill as a sibling at `<root>/<name>/SKILL.md` — **flat, with no layer segment** — because installation symlinks each layer's children into one namespace.

This derivation holds under any host, any nesting, and any symlink chain without naming a location. `~/.cursor/skills/` is one known such root, cited as an example and not as an exhaustive list. Skills the Skill tool refuses by name are present and readable here.

**Step 3: Search by name**

**This step is deliberately not fenced to the roots from steps 1 and 2.** If those steps failed, no root was established, so restricting the search to known roots would be circular and would guarantee failure. Fence by *shape* instead:

- glob `**/<name>/SKILL.md` across the workspace
- glob `~/.*/skills/**/<name>/SKILL.md` — a shape-based sweep of home-level skill directories that names no specific host location and does not depend on step 2 having succeeded. The `**` matters: it covers both a flat installed root and one that kept the layer folders, which is what a user gets from symlinking the whole `skills/` directory instead of each layer's children
- as a last resort, glob `**/SKILL.md` across the workspace and match frontmatter `name: <name>`, which finds a skill whose directory is named differently from the skill

Bound the search to the workspace plus home-level `skills/` directories. Never walk the filesystem root, another user's home, or anything outside those two.

**Step 4: Skill tool by name**

Valid **only** for skills that are auto-invocable — workflow skills and user-facing agents. For everything else the tool returns a rejection; treat it as described in `<read-not-invoke>` and go back to steps 1 to 3.

**Step 5: Hard stop**

If steps 1 to 4 have all failed, **stop and ask the user**. Report the skill name requested, every location attempted, and the step of the current task that is blocked. The only exception is the degraded-mode carve-out below, and it is narrow.

## Resolution Order Reference

| Step | Where | Shape tried | Mechanism |
| --- | --- | --- | --- |
| 1 | Project skill collection | `.cursor/skills/<layer>/<name>/SKILL.md`, `.cursor/skills/<name>/SKILL.md`, `.agents/skills/<layer>/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md` | Read |
| 2 | Installed skills root, derived from the executing skill's own directory | `<root>/<name>/SKILL.md` — flat, no layer segment | Read |
| 3 | Shape-based search, not fenced to steps 1-2 | `**/<name>/SKILL.md`, `~/.*/skills/**/<name>/SKILL.md`, then frontmatter match | Read |
| 4 | Skill tool by name | `<name>` | Invoke — auto-invocable skills only |
| 5 | Unresolved | — | Stop and ask the user |

## Reporting the Resolved Location

State the location the skill was read from. When handing work to a delegate, pass the skill **name** together with that resolved location, so the delegate does not repeat the resolution order and cannot silently resolve to a different file.

## Degraded Mode — the Single Narrow Carve-Out

A skill may define a documented fallback that runs without it. The fallback is permitted only when **all three** conditions hold:

1. **Resolution is exhausted** — every one of steps 1 to 4 has been attempted and failed. A fallback must never fire on the first missed location.
2. **The degradation is announced** — the output states, visibly to the user, which skill could not be located and exactly what was substituted for it, or which part of the work proceeded without it when nothing was substituted. An unannounced fallback is the silent degradation this resolution order exists to prevent.
3. **The missing skill carries no gate** — no review decision, security decision, or data-integrity decision depends on it. If one does, the answer is the hard stop. There is no such thing as a degraded review: a gate that cannot load is a gate that did not pass.

A qualifying fallback takes one of two shapes, and both are bounded by the same three conditions:

- **Substitution** — a documented constant replaces what the skill would have supplied. In this collection the only case is the Core 5 mandatory tag and label name defaults in `tsh-analyze-aws-costs` and `tsh-analyze-gcp-costs`, which supply naming constants only; no finding and no recommendation may be derived from them.
- **Omission** — the step proceeds with the skills that did load and the missing one contributes nothing. Both cost commands carry this shape for their non-gate inputs. Omission is the weaker case and needs condition 3 read strictly: it is permitted only because no gate is reachable through it, which is why `tsh-managing-secrets` is excluded from it by name in both commands.

This carve-out is not a general escape hatch. A skill may only degrade in a way it documents itself — a worker never invents a fallback for a skill it could not read, because it cannot know what that skill would have required.

## Safety

- Prefer steps 1 and 2 over the step 3 search; a specific location beats a glob match.
- When a glob match is used, confirm the file's frontmatter `name` equals the requested name before trusting it.
- Treat the requested name as a single directory name, never as a path. Refuse a name containing a `/` or a `..` segment instead of resolving it — a skill name is substituted directly into `<root>/<name>/SKILL.md`, and a delegation instruction can reach a worker from a generated plan file, so the name is untrusted input.
- Never read outside the workspace or home-level `skills/` directories.
- Never execute a script discovered by the search.

## Validation Checklist

```
Validation:
- [ ] Steps 1 to 4 were attempted in order, each only after the previous one failed
- [ ] The file read has frontmatter `name` equal to the requested skill name
- [ ] The resolved location is stated in the output, and passed to any delegate alongside the skill name
- [ ] Nothing outside the workspace or a home-level `skills/` directory was read
- [ ] If nothing was located: the work stopped and the user was asked — no substitute was used
- [ ] If a degraded mode was used: all three carve-out conditions hold and the substitution is announced
```

## Connected Skills

- `tsh-orchestrating-implementation` - the highest-traffic delegation surface; every routing and readiness hop names a skill that a delegate resolves with this order
- `tsh-creating-skills` - to author skill bodies whose delegation-time references are skill names rather than project-relative paths
- `tsh-creating-agents` - to author agent delegation and handoff text that names the governing skill
- `tsh-creating-commands` - to author runtime skill-loading instructions in commands that name the skill they load
