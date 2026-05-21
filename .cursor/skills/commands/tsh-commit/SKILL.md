---
name: tsh-commit
description: "Draft a Conventional Commits message from current git changes and commit only after explicit user approval. Use when the user types /tsh-commit, wants to commit work in progress, or needs a structured commit message before git commit."
disable-model-invocation: true
---

# /tsh-commit

Analyze the working tree, draft a [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) message, and run `git commit` **only after the user explicitly approves** the proposal.

## Required Skills

- `tsh-committing` — type/scope inference, message format, secret-file rules, split recommendations

## Workflow

### 1. Inspect repository state

Run **in parallel**:

```bash
git status
git diff
git diff --staged
git log -10 --oneline
```

If there are no staged or unstaged changes to tracked files (and no untracked files the user intends to commit), stop and tell the user there is nothing to commit.

### 2. Draft the commit message

Load `tsh-committing` and analyze the combined diff (staged + unstaged unless the user specified staged-only).

- Apply any user hint from the command invocation (type, scope, `Refs:`, subject override).
- If unrelated change domains appear, present **Option A** (single commit) and **Option B** (split into N commits with separate messages and file lists).
- Enumerate **exact paths** to stage — never use `git add .` or `git add -A` without listing each path.
- Run secret-file checks from `tsh-committing`; block or warn before proposing.

### 3. Present proposal (mandatory format)

Show the user:

```text
Proposed commit:
─────────────────
<full commit message — subject, optional body, optional footers>

Files to stage:
- path/to/file1
- path/to/file2

Reply: approve | edit: <your full message> | cancel
```

For split recommendations, repeat the block per option (Option A / Option B) and ask which option to use.

### 4. Confirmation gate (blocking)

**Do not** run `git add` or `git commit` until the user explicitly confirms.

Treat as approval: `approve`, `yes`, `commit`, `ok`, `lgtm`, `go ahead`, or equivalent clear intent.

- **`cancel`** / **`no`** → stop; leave repository unchanged.
- **`edit: ...`** → replace the proposed message with the user's text, re-show the proposal, and wait for approval again.
- Ambiguous replies → ask for `approve`, `edit:`, or `cancel`; do not commit.

### 5. Execute commit (approved only)

1. Stage only the approved paths: `git add -- <path>` per file (or quoted paths with spaces).
2. Commit using a HEREDOC (preserves body and footers):

```bash
git commit -m "$(cat <<'EOF'
<type>[scope]: <description>

<optional body>

<optional footers>
EOF
)"
```

3. Run `git status` and report success or hook failure.

If the commit hook modifies files, report it and ask whether to amend (only if user rules allow amend) or create a follow-up commit.

### 6. Post-commit

- Show the new commit SHA (`git log -1 --oneline`).
- Do **not** push unless the user explicitly asks in a separate message.

## Optional Input

The user may append hints after the command:

```text
/tsh-commit
/tsh-commit docs: README branding cleanup
/tsh-commit Refs: PROJ-123
```

Hints influence drafting; they do not bypass the confirmation gate.

## Constraints

- Never update `git config`.
- Never use `--no-verify`, `--no-gpg-sign`, or `--amend` unless the user explicitly requests it and user rules allow amend.
- Never `git push`, force push, or destructive commands (`reset --hard`, etc.) unless explicitly requested.
- Never commit secret or credential files (see `tsh-committing`).
- Never commit unless the user asked to commit in this conversation (invoking `/tsh-commit` counts as intent to commit **after** approval).
- Match the approved message byte-for-byte in `git commit` unless the user edited it in step 4.

## Connected Skills

- `tsh-committing` — message drafting rules
- `tsh-refactor` — when changes need structural work before committing
- `tsh-debug` — when the diff includes a bug fix that should be verified first
