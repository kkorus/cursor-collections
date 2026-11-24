# Review: per-skill change table, WORKFLOWS section (rows 50-83) and audit traceability

Summary: 0 critical, 2 warning, 1 suggestion. `npm run check` passes (0 errors, 0 warnings).

Method: all 34 rows were checked for the new name and the stated action (rename, split, merge, delete). 2-5 listed changes per row were opened and confirmed in `src/skills/<name>/`. The bug-fix rows (64, 67, 69, 70, 71, 73, 61, 76, 63) were checked in full. I also grepped all 34 skills for stale old names, `.cursor/skills` paths, `../` cross-skill links, `WCAG 2.1`, "popup", Copilot tool ids, duplicate H1, a missing "Connected Skills" section, "Related Skills"/"References"/"When to Use" headings, and root `*.example.md` files. None of these remain, apart from the findings below.

Result: all 34 skills exist under their new names, with the splits done as stated (backend, databases) and the merges done (plan, research, engineer-prompt). Every bug fix listed in the table is present:
- CI/CD: `role-to-assume`, Trivy, `use_lockfile`, Bitbucket OIDC, and the IaC section moved into `tsh-implementing-terraform-modules/references/ci-pipelines.md`.
- Secrets: `id_tokens:`, and the K8s Secrets/etcd-encryption note.
- Kubernetes: Gateway API/HTTPRoute replaces ingress-nginx.
- SQL: `NOT VALID` plus `VALIDATE CONSTRAINT`, in `SKILL.md:38` and `references/schema-design.md:69-82`.
- Jira: Markdown is the local format and is converted to wiki markup only at push (`tsh-formatting-jira-tasks/SKILL.md:201-211`); `(/)` is corrected; the templates contain no wiki markup.
- Accessibility: WCAG 2.2 AA with SC 2.4.11, 2.5.7 and 2.5.8, and the 4.1.1 removal noted.
- Also done: the lodash default import, the `tsh-writing-hooks` throw-in-render contradiction (`:141-142` and `:212` agree), the single tuple threshold (3+ values) across hooks, reviewing-frontend and the checklists, and one five-tag required set in `tsh-optimizing-cloud-cost`.

## Warnings

### W1. WF-CC5 is only half done: the workshop skills still hard-code `specifications/`
- Files:
  - `src/skills/tsh-processing-transcripts/SKILL.md:111`
  - `src/skills/tsh-extracting-tasks/SKILL.md:153`
  - `src/skills/tsh-reviewing-task-quality/SKILL.md:175`
  - `src/skills/tsh-formatting-jira-tasks/SKILL.md:117,168,171`
  - `src/skills/tsh-formatting-jira-tasks/references/import-mode.md:62`
  - `src/skills/tsh-analyzing-codebase/SKILL.md:124,130`
  - `src/skills/tsh-business-analyst/SKILL.md:64`
- Evidence: the traceability table in the plan (row "WF-CC5", plan line 711) says skills that write files refer to "the project's specifications location (default `specifications/`)". Only `tsh-analyzing-requirements`, `tsh-designing-architecture`, `tsh-engineering-manager` and `tsh-verifying-ui` use `<specs>` or "default". The files above still write literal `specifications/<workshop-name>/...` paths with no "default" wording and no pointer to the "Project output locations" step of `tsh-discovering-technical-context`.
- Failure scenario: in a consumer repo whose `AGENTS.md` sets another docs location (for example `docs/specs/`), the BA workflow (transcript, extract, quality review, Jira formatting) writes to `specifications/` while the architect and context engineer write to the configured location. The artifacts end up in two trees, and the task baseline paths do not match.
- Fix: in those lines say "the project's specifications location (default `specifications/`, see 'Project output locations' in `tsh-discovering-technical-context`)". Alternatively state once in `tsh-business-analyst` that `<specs>` is resolved there and passed to workers. In delegated mode the orchestrator already supplies paths.

### W2. The creating-skills worked example still uses unprefixed, non-existent skill names (audit WF-8)
- File: `src/skills/tsh-creating-skills/references/reviewing-code.example.md:64-65`
- Evidence: the "Connected Skills" section lists `codebase-analysing` and `architecture-designing`. Plan row 57 says "`tsh-` prefix on all examples". The audit cited exactly this spot (`examples/reviewing-code.skill.md` L61-62). The names also appear in the pre-refactor skills under the old names (`tsh-codebase-analysing`, `tsh-architecture-designing`), which no longer exist. The current names are `tsh-analyzing-codebase` and `tsh-designing-architecture`. The example's own frontmatter (`name: tsh-reviewing-code`, line 2) is already fixed, so the file is only half converted. `npm run check` does not catch it because the names sit in inline code in a reference file.
- Failure scenario: an agent copying the example creates a skill that links to non-existent skills, and it breaks the repo's own rule (the prefix is required, and skills are referenced by their real names). It also contradicts `SKILL.md:174`, which uses `task-analysis` as a bad example.
- Fix: replace them with `tsh-analyzing-codebase` and `tsh-designing-architecture`, or with names that exist.

## Suggestions

### S1. `use_lockfile` version statement may be imprecise
- File: `src/skills/tsh-implementing-terraform-modules/references/ci-pipelines.md:32`
- Evidence: it says "`use_lockfile = true`, Terraform 1.10 or newer". From memory, S3-native locking was introduced as experimental in 1.10 and became stable in 1.11. I did not check this against the Terraform docs.
- Fix: say "experimental in 1.10, stable in 1.11", or "1.11 or newer" for production guidance. Verify against the release notes first.
