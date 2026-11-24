# Content review: business-analysis group and knowledge skills

Scope: `src/skills/tsh-business-analyst` and the five `tsh-ba-*-worker` agents, the BA workflow skills and their assets, and the knowledge skills (backend, databases, React, frontend, optimizing, hooks, accessibility, forms, prompts, E2E, MCP). HEAD 1dcd92e, baseline 324d2fd. Read-only review. `npm run check` passes (generated outputs up to date, 0 lint errors).

Summary: 2 critical, 11 warning, 9 suggestion.

Checked and found correct (no finding):
- Protected statuses are defined once, in `tsh-guarding-jira-statuses`. A grep for "PO APPROVE" and "Cancelled" finds no other copy in `src`.
- `tsh-business-analyst`, the commands, `references/parallel-processing.md`, the workers and the skills agree on gates 0, 1, 1.5 and 2 and on the 13-step table, apart from the gaps below.
- The `NOT VALID` / `VALIDATE CONSTRAINT` pattern is valid PostgreSQL. The locks, the "new writes are checked" claim and the transaction wrapper are correct.
- WCAG 2.2 numbers and levels: 2.4.11 AA, 2.5.7 AA, 2.5.8 AA at 24px, 2.5.5 AAA at 44px, 3.3.8 AA, 3.3.7 A, 3.2.6 A, and 4.1.1 removed. 1.4.4, 1.4.10 and 1.4.11 are also right.
- Core Web Vitals: LCP 2.5/4.0s, CLS 0.1/0.25, INP 200/500ms, TBT 200/600ms, and INP as a field metric only.
- The lodash example in `tsh-reviewing-frontend` is a correct default import.
- React hooks rules, the React 19 claims and the Strict Mode claim are correct.
- Every `references/` and `assets/` file is linked from its SKILL.md. Heading diffs against 324d2fd show no lost section in the databases or backend split.

## Critical

### C1. Jira-import entry point leads to a quality review with no input
- `src/skills/tsh-business-analyst/SKILL.md:41` says import Jira issues "and continue at step 7". Import Mode produces only `jira-tasks.md` (`tsh-formatting-jira-tasks/references/import-mode.md`, Steps I-4 and I-6).
- Step 7 is `tsh-reviewing-task-quality`. Its mandatory input is `extracted-tasks.md` ("Gate 1-approved", `tsh-reviewing-task-quality/SKILL.md:62`). Step 7 of that skill applies accepted suggestions to `extracted-tasks.md`.
- Failure scenario: a user runs `/tsh-analyze-materials PROJ-10`. The orchestrator imports, then starts step 7. The quality worker has no `extracted-tasks.md`, and nothing says how to derive one from `jira-tasks.md`. Protected tasks are also absent from any extracted list.
- Fix: in the orchestrator, define the import path. Either skip the quality review and go straight to step 10 or 11, or state that quality review takes `jira-tasks.md` as input. If the latter, add it as an alternative mandatory input in the quality skill and in Steps 1, 7 and 8 (apply to and save from `jira-tasks.md`).

### C2. GORM "built-in optimistic locking" is false
- `src/skills/tsh-designing-databases/references/transactions-locking.md:114`: "GORM (Go) | Built-in optimistic locking with `gorm:"column:version"` tag".
- GORM has no built-in optimistic locking. It needs the `gorm.io/plugin/optimisticlock` plugin with its `Version` type. A plain `version` column with a tag does nothing. (From GORM documentation knowledge; not run here.)
- Failure scenario: a Go developer follows the table, adds a `Version int` field and assumes conflicts are detected. Concurrent updates silently overwrite each other.
- Fix: write "Plugin `gorm.io/plugin/optimisticlock` (`optimisticlock.Version`), or a manual `WHERE version = ?` update checking `RowsAffected`".

## Warning

### W1. The operating-modes partial still tells read-only workers to write files, and re-delegation loses their result
- `src/partials/agent-modes.md:24`: "Persist partial work before returning. Write drafts, findings and reports to files". Line 40 says `NEEDS_INPUT`: "Save your progress first".
- The partial is included in all five BA workers. They are `access: read-only` and the generator denies Write and Edit (`.claude/agents/tsh-ba-quality-worker.md` frontmatter). Each worker's Constraints say "you cannot write files ... `ARTIFACTS: none`".
- So the model gets two conflicting instructions, which is the AG-X4 contradiction in a smaller form.
- Second part: `caller-status-handling.md:13` defines `PRIOR_OUTPUT` as "the previous STATUS block, verbatim". For a read-only worker the real result lives in the reply body, not in a file. The orchestrator SKILL (`SKILL.md:28-32`) does not say to pass the previous reply body. On `NEEDS_INPUT` the worker therefore restarts from zero.
- Fix: make the partial conditional: "if you can write files, ... otherwise include the partial result in the reply before the status block". Tell callers to pass the full previous reply body as `PRIOR_OUTPUT` when `ARTIFACTS` is `none`.

### W2. Delegated workers are told to return questions, but the orchestrator has no path for "DONE with QUESTIONS"
- `tsh-processing-transcripts/SKILL.md:123` says to leave metadata as "not stated" and list it in `QUESTIONS`. The formatting skill ("Put each uncertain field in `QUESTIONS`") and the quality and extraction skills do the same while continuing the work.
- The partial (`agent-modes.md:44-45`) allows `QUESTIONS` only with `NEEDS_INPUT`, meaning "cannot continue". The orchestrator (`tsh-business-analyst/SKILL.md:28-32`) handles `DONE` as "merge and write" and `NEEDS_INPUT` as "ask, then re-delegate".
- Failure scenario: a transcript worker returns a full cleaned transcript plus questions. With `DONE` the questions are dropped. With `NEEDS_INPUT` the whole transcript is reprocessed for a date.
- Fix: define that `DONE` may carry `QUESTIONS`. The orchestrator asks them at the matching gate and applies the answers itself, without re-delegating.

### W3. Who identifies the epics is contradictory, and the single-worker path has no owner
- Step table, `tsh-business-analyst/SKILL.md:49`: step 5 "Extract epics and stories", owner "extraction worker(s)".
- `references/parallel-processing.md:49`: "After Gate 0 ... you run the first extraction phases (material review and epic identification) yourself".
- The worker skill, `tsh-extracting-tasks/SKILL.md:163`, limits a worker to Steps 1-2 or 5-8, and requires epic definitions in `INPUT_ARTIFACTS`. It says "do not re-derive the epic list". The worker agent (`tsh-ba-extraction-worker.md:28`) also expects a per-epic slice.
- Nothing produces that epic list when the user did not ask for parallelization, and the orchestrator never loads `tsh-extracting-tasks`. Step 4's rules (3-10 epics, business capability) and the Step 6 story format are therefore unreachable for the orchestrator.
- Fix: in the step table, split step 5 into "5a identify epics (you, using Step 4 of `tsh-extracting-tasks`)" and "5b extract stories (worker)". Or allow Step 4 in the worker scope when the task names it.

### W4. Gate procedures are declared "orchestrator-owned", but the orchestrator is not pointed at them
- The user-facing steps of the skills are marked "skipped" for workers: extracting Steps 3, 9, 10; quality Steps 6, 7, 8; formatting Steps 5, 6, 8, 9 and the Per-Change flow; transcript Step 1.
- They contain the only detailed protocol: one question per story and a final "did I miss any" (extracting Step 10), suggestion ordering and the Accept/Reject format (quality Step 6), apply rules per action type and the `NEW_STORY` numbering (quality Step 7), and the sync summary (formatting Step 9).
- `tsh-business-analyst/SKILL.md` repeats only generic rules ("accepts or rejects each suggestion", "apply the accepted ones"). It has no instruction to load these skills or follow those steps.
- Failure scenario: at Gate 1.5 the orchestrator does not know the ordering, the required header, the apply rules or the summary-table update. Behavior depends on whether it happens to read the skill.
- Fix: add to each gate row "follow Step N of `<skill>`" (or a "Skills you also load" line), and point the orchestrator at the sections that are "skipped" for workers.

### W5. `tsh-guarding-jira-statuses` fails open for Jira-keyed tasks with unknown status
- `tsh-guarding-jira-statuses/SKILL.md:21`: "When the task status is missing or unknown, treat the task as not protected and say so."
- The push table says "re-check the current status", but a `jira-tasks.md` entry with a `Jira Key` and a `—` status (allowed by the template's Status field text) is treated as unprotected. The formatting skill then sends an update (`tsh-formatting-jira-tasks/SKILL.md`, Step 9 "update").
- Failure scenario: a task that is Done in Jira has an empty status locally, for example after a failed verification or a hand edit. The push overwrites a protected issue.
- Fix: keep "unknown = not protected" only for tasks without a Jira key. For a keyed task with no status, the orchestrator fetches the status before any update and skips the task if it cannot.

### W6. `test.fixme('BUG: desc')` probably drops the description
- `tsh-writing-e2e-tests/SKILL.md:93`, `:103`, and `assets/e2e-summary.template.md`.
- Inside a test body the signature is `test.fixme(condition, description)`. Playwright treats a lone string as the (truthy) condition and takes `description` from the second argument. The text is therefore lost from the report; at describe level a lone string is parsed as a test title. (Not run here because Playwright is not installed; please verify.)
- Fix: use `test.fixme(true, 'BUG: desc')` inside the test, or `test.fixme('name', async ...)` at declaration level.

### W7. Node.js Dockerfile ships devDependencies, against the collection's own rule
- `tsh-implementing-backend/references/nodejs-patterns.md:197` copies `node_modules` from the builder stage, where `npm ci` installed dev dependencies.
- `references/local-development.md` says: "Install only production dependencies in the final stage."
- Fix: run `npm ci --omit=dev` in the production stage, or `npm prune --omit=dev` in the builder before copying.

### W8. PHP Dockerfile sketch will not build
- `tsh-implementing-backend/references/php-patterns.md:200-213`.
- The `php:*-fpm-alpine` image has no `composer`, so `composer install` (line 204) fails with "not found". It needs `COPY --from=composer:2 /usr/bin/composer /usr/bin/composer`.
- `docker-php-ext-install pdo_pgsql` on Alpine needs `postgresql-dev` for the build and `libpq` at runtime. Neither is installed (lines 202 and 212).
- Line 211 is a bare `apk add --no-cache` with no packages. (Based on known image contents; `docker build` not run here.)
- Fix: add the composer copy and `apk add --no-cache postgresql-dev` (build) and `libpq` (runtime), and remove the empty `apk add`.

### W9. Java reference: a false claim and a wrong label
- `java-spring-boot-patterns.md:105`: "Spring Boot auto-configures request logging — customize via `server.tomcat.accesslog`". Boot does not log requests by default, and the Tomcat access log is off unless `server.tomcat.accesslog.enabled=true`. The `backend` SKILL says to log every request, so a reader may assume it is already done.
- `java-spring-boot-patterns.md:334`: "Never throw unchecked exceptions in a `Consumer` without a DLQ ... infinite retry loops". The configuration in the same file sets `max-attempts: 3`. Without a DLQ the message is dropped after the retries (data loss), not retried forever.
- `java-spring-boot-patterns.md:384`: the heading says "uses Spring Boot's built-in native buildpack pipeline", but the Dockerfile builds with `native:compile` in a GraalVM image and does not use buildpacks.
- Fix: correct the three statements.

### W10. Databases: FK indexing claim is wrong for InnoDB
- `tsh-designing-databases/references/indexing.md:24`: "Foreign key columns (not auto-indexed in PostgreSQL/MySQL InnoDB)".
- InnoDB creates an index on the referencing columns automatically when none exists. This is true only for PostgreSQL.
- Fix: "(PostgreSQL does not create them automatically; InnoDB creates one only if none exists, often not the composite you want)".

### W11. Databases: wrong label and comment in the reference files
- `schema-design.md:243`: "`RESTRICT` (default)". The SQL and PostgreSQL default is `NO ACTION`. This conflicts with `NO ACTION` described as "same as RESTRICT but checked at end of transaction" in the row below.
- `query-performance.md:255`: the MySQL `type` list `ALL → index → range → ref → eq_ref → const → system` is labelled "(best to worst)". It runs from worst to best.
- `maintenance.md:34` says "Find slowest queries by total time", but line 42 orders by `mean_exec_time`. The query text and the comment disagree.

## Suggestion

### S1. Dangling reference "routing guide in the skill"
`references/parallel-processing.md:69` points to a routing guide in the skill. `tsh-business-analyst/SKILL.md` has none; its Workers table is the only mapping. Point to that table.

### S2. Review-mode selection is unowned and the thresholds leave a gap
- `tsh-business-analyst/SKILL.md` step 7 does not say who picks Lite or Full, or that the task to the worker must name the mode (`tsh-ba-quality-worker.md:26` expects it).
- Lite is the default for "3 or fewer epics and 12 or fewer stories" (`tsh-reviewing-task-quality/SKILL.md:53`). Full is preferred at "4 or more epics, 15 or more stories" (`parallel-processing.md:59`). The range 13-14 stories with at most 3 epics is neither.
- The baseline wording was 4+ epics *with* 15+ stories.
- Fix: one threshold, stated once, and an orchestrator sentence on who decides.

### S3. Save ownership of step 2 output
In the step table, step 2 owner is only "analysis worker", unlike the other steps ("you save"). In Explore Mode the orchestrator must write `workshop-context-summary.md` from the worker reply. Say "analysis worker, you save".

### S4. `tsh-reviewing-task-quality` pass J has no research tools in the worker
The quality worker lists only `read` and `search` and no documentation or web MCP. In Full mode pass J then always takes the "no research tool, skip" branch (`references/analysis-passes.md`, step 2 of pass J). It degrades cleanly but can be surprising. Say so in the worker or the skill, or give the worker `context7`.

### S5. PDF text-export request in delegated transcript mode
`tsh-processing-transcripts/SKILL.md` Step 1 says "If no tool can read it, ask for a text export". The delegated-mode section skips only the metadata question. Say explicitly that this becomes `BLOCKED` or `NEEDS_INPUT`.

### S6. `React.lazy` conflicts with the "named exports only" rule
`tsh-implementing-frontend/SKILL.md:72` forbids default exports. `tsh-implementing-react/references/component-patterns.md:52` and the React SKILL table show `React.lazy(() => import('./Heavy'))`, which needs a default export. Add the named-export form: `lazy(() => import('./Heavy').then(m => ({ default: m.Heavy })))`.

### S7. Smaller technical inaccuracies in the SQL references
- `transactions-locking.md:74`: `FOR UPDATE` "other transactions cannot read". Plain reads are not blocked under MVCC; only locking reads and writes are.
- `transactions-locking.md:16`: "Constraints are enforced at commit time". Most are enforced per statement, and only deferred constraints are checked at commit.
- `transactions-locking.md:110`: Doctrine `@ORM\Version` annotation. Current Doctrine uses the attribute `#[ORM\Version]`, and `orm.md` uses `SQLLogger`, which is deprecated in DBAL 3 and removed in DBAL 4.
- `maintenance.md:57`: the pool-size formula is attributed to the PostgreSQL wiki. It is widely attributed to the HikariCP pool-sizing guide. Uncertain; verify or drop the attribution.
- `maintenance.md`: `pg_stat_statements` also needs `shared_preload_libraries`, not only `CREATE EXTENSION`.

### S8. Smaller inconsistencies in backend examples
- `php-patterns.md:119`: "fingerscrossed handler". The name is `fingers_crossed` (Monolog `FingersCrossedHandler`).
- Response envelope: `SKILL.md`, the Node, PHP and Go tests assert `body.data.email`. The Java `TestRestTemplate` test asserts a flat `email`, and `GET /me` returns a flat object. The DataGrid envelope applies to lists only. Say that single-resource responses are not wrapped, or align the examples.
- `java-spring-boot-patterns.md` native example pins Spring Boot `3.3.x` (end of support). Use a placeholder as the other files do.

### S9. `tsh-writing-hooks` example signatures disagree
`useDebounce` is `({ value, delay, leading })` in the contract example and `(value, delay)` in the composability example. Use one signature, or label the second as a different hook.
