## Version Control Safety

Treat the working tree as you found it. Other work, yours or the user's, may be uncommitted there.

- Never run `git clean`, `git restore`, `git checkout --`, `git reset` or `git stash`.
- Delete files with normal edits, never with version control commands.
- If uncommitted changes block the task, in delegated mode return `BLOCKED` naming the files; in interactive mode ask the user how to proceed.
- Run tests and builds only as the task requires.
