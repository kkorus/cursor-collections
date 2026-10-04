## Contents

- When to suggest parallelization
- Scenario 1: material processing
- Scenario 2: epic-level task extraction
- Scenario 3: pass-level quality review
- Delegation rules
- Merge and conflict resolution

# Parallel Processing Strategy

You do not parallelize on your own. Evaluate the volume and complexity of the material, **suggest** parallel delegation to the user when a condition below is met, and delegate only after the user confirms. Every delegation uses the prompt template from the status-handling rules: first line `MODE: delegated`, then `CALLER: tsh-business-analyst`, `TASK:` and explicit `INPUT_ARTIFACTS:` paths.

## When to suggest parallelization

- Several independent input sources need processing (transcript + Figma + codebase).
- The input has 3 or more substantial documents (multi-page PDFs, policy documents, requirement specifications; not trivially short files).
- A single transcript exceeds about 3000 words or has 5 or more distinct topics.
- The extracted task list has 4 or more epics or 15 or more stories (quality review).
- Codebase analysis targets a monorepo with 3 or more apps or packages.

When you suggest it, tell the user (1) what is parallelized, (2) how many workers are started and (3) the expected benefit. Then ask for confirmation.

## Scenario 1: material processing

Input gathering activities are independent and can run in parallel before extraction.

**Case A, multi-source:** different analysis types (transcript cleanup, Figma analysis, codebase analysis) each go to their own worker. Transcript cleanup goes to `tsh-ba-transcript-worker`. Figma analysis, codebase analysis and multi-source synthesis go to `tsh-ba-analysis-worker`.

**Case B, multi-document:** when the user provides a folder or set of documents (RFP packages, policy bundles, requirement sets), each document is analyzed by its own `tsh-ba-analysis-worker`. Assignment rules:

- Each document gets its own worker.
- A subfolder of related documents may be one assignment if it has 5 or fewer processable files. A larger subfolder is split into batches of about 5 files, grouped by affinity (for example architecture documents together, process documents together).
- Each worker reads its documents (the PDF reader for PDFs, plain reads for text and Markdown) and returns a structured summary: key requirements, decisions, constraints, business rules and open questions.
- **Unsupported formats:** if no available tool can read a binary Office format (.xlsx, .xlsm, .docx, .doc), tell the user and ask for an export to PDF, CSV or plain text. Do not assign such files to workers.
- **Images** (.png, .jpg, .svg): do not read them automatically. Tell the user the file name and location, and ask whether the image needs a manual review or is only informational.

Cases A and B can combine (for example 5 documents + a codebase + a Figma link = 7 workers). Start at most 5 workers at once and batch the rest, with the longest-running activities (codebase, large PDFs, Figma) in the first batch.

**Merge pass** after all workers return:

1. Collect the summaries and check completeness. Report missing chunks to the user.
2. Cross-reference the findings with `sequential-thinking` to find consistencies, conflicts and gaps between the sources.
3. Ask the user about contradictions before you continue (for example pricing in one document conflicts with scope in another).
4. Produce one unified material summary for task extraction.

## Scenario 2: epic-level task extraction

After Gate 0 is approved, you run the first extraction phases (material review and epic identification) yourself. Then:

1. Identify all epics and their scope boundaries.
2. Delegate to `tsh-ba-extraction-worker`, one worker per epic (or 2-3 small epics per worker), with the epic definition, the relevant source paths and the instruction to extract the stories of that epic only.
3. Each worker returns the stories with user story text, acceptance criteria, technical notes and priority.

Then you collect the story lists, assign consistent numbering, resolve duplicates across epics, map cross-epic dependencies and assemble `extracted-tasks.md`.

## Scenario 3: pass-level quality review

The active passes depend on the review mode. For 4 or more epics, 15 or more stories, or a regulated or high-risk domain, prefer Full mode.

1. Split the active passes into roughly equal batches.
2. Delegate each batch to `tsh-ba-quality-worker` with the path of `extracted-tasks.md`, the passes of the batch and the suggestion format.
3. Each worker returns suggestions (ID, confidence, action type, target story, finding, proposed change).

Then you collect them, deduplicate overlapping suggestions (keep the higher-confidence one or merge them), assign consistent IDs and continue with Gate 1.5.

## Delegation rules

1. **One owner per phase:** route each phase to the worker that owns it (see the routing guide in the skill). Do not do a worker's job yourself when it was delegated.
2. **In-memory returns:** workers are read-only and return their result in the reply. You assemble and write every output file after the merge, which also prevents concurrent overwrites.
3. **1:1 assignment:** each worker gets exactly one chunk. Never give overlapping material to two workers.
4. **Errors:** if a worker fails or returns an incomplete result, do not re-delegate on your own. Tell the user and ask whether to retry the chunk or continue without it. A `NEEDS_INPUT` result is not a failure: ask the questions and re-delegate as the status-handling rules describe.
5. **Protected statuses:** name the protected tasks in the delegation prompt of every quality review, so the worker skips them.
6. **Concurrency:** at most 5 workers at once. Process larger sets in batches of up to 5.
7. **Jira ownership:** only you call Atlassian write tools, and only after Gate 2. Fetch any Jira or read-back context yourself and pass it to the worker through `INPUT_ARTIFACTS`.

## Merge and conflict resolution

1. **Deduplication and completeness:** check for stories or suggestions that appear in several outputs (common at epic boundaries) and keep the more detailed version. Report chunks without output to the user.
2. **Numbering:** re-assign sequential IDs across the merged output.
3. **Cross-references:** resolve dependencies and blockers that span worker boundaries.
4. **Conflicts:** when two workers contradict each other, ask the user. If the user asks you to resolve it yourself, reason it through with `sequential-thinking`.
