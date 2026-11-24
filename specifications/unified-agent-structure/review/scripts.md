# Review: tooling (scripts/, package.json, validate.yml)

Summary: 0 critical, 3 warning, 1 suggestion.

Gates (run on HEAD 1dcd92e): `npm test` 160/160 pass; `npm run check` clean (338 generated files up to date, lint 0 errors/0 warnings, refs 0/0); `npm --prefix website run build` succeeds. Generator, lint and refs otherwise read clean: TOML multi-line escaping (backslash, triple quote, control chars) is correct, output order is deterministic (sorted readdir), writes/deletes are confined to owned globs and symlinks are unlinked, not followed.

Adversarial installer runs (scratch TSH_HOME under /private/tmp/rv):
- Legacy folder symlinks: symlinks are only unlinked and real dirs are renamed into the backup, nothing outside is touched (holds).
- Manifest with a traversal name and self-install: both confirmed below.

## Warnings

### W1. Installing into the source checkout with --force moves the generated skill tree aside and then crashes
scripts/install.mjs:258-272 (installTree, `--force` branch -> `retire` -> `copyDereferenced`)
`--scope project --project-dir <clone> --source <clone> --tools claude --force` (or a project dir that is the clone, e.g. dogfooding) makes src == dest. Without --force the entries are skipped (exit 1), but with --force each `.claude/skills/tsh-*` is moved to the backup, then `copyDereferenced(src)` reads the just-moved path.
Evidence (scratch copy of the repo): ENOENT stack trace for `.claude/skills/tsh-ai-customization-orchestrator`; `.claude/skills` dropped from 62 to 61 entries and that skill sits in the backup. No manifest is written, exit code is a raw crash, not a UsageError.
Fix: in `run`/`makeCtx`, reject (UsageError) when `path.resolve(targetRoot)` equals `ctx.source` or when a target dir resolves (realpath) inside the source tree; same for link mode (would self-link).

### W2. Manifest `names` are trusted as path components, so --update can move arbitrary paths outside the install dir
scripts/install.mjs:279-285 (prune loop) and 247 (`oldNames` from readManifest, no validation)
`names` from `.tsh-install-manifest.json` are joined with `targetDir` and retired without checking the `tsh-` prefix or that there is no separator/`..`. Reproduced: a manifest with `"names":["../../../victim-outside"]` in `~/.claude/skills` and `--update` moved `/private/tmp/rv/victim-outside` to the backup ("pruned: no longer in source"). The data is backed up, not deleted, and requires a corrupted or tampered manifest, hence warning not critical; but the plan's promise is that the installer only touches `tsh-*` entries.
Fix: in readManifest filter `names` to `typeof n === 'string' && n.startsWith('tsh-') && n === path.basename(n)` (and the same for `tools`); drop others with a log line.

### W3. A src/mcp/servers.json without a `servers` key crashes the generator and lint with a TypeError
scripts/lib/schema.mjs:116 (checkMcpRefs) with scripts/lib/load-source.mjs:52 (`servers: json.servers`)
`validateServers` reports "servers must be an object", but `validateModel` continues and `Object.hasOwn(undefined, server)` throws for any agent/skill with `requires-mcp`. Reproduced with `{}` as servers.json: `generate.mjs` dies with "Cannot convert undefined or null to object" instead of the normal `error: src/mcp/servers.json: servers: must be an object`. (lint.mjs calls validateModel without a try/catch too.)
Fix: in validateModel use `const servers = isObject(model.mcp?.servers) ? model.mcp.servers : {}`.

## Suggestions

### S1. `--update` records pruned names that were not on disk
scripts/install.mjs:279-285: `result.pruned.push(n)` runs even when `lstat` found nothing, so the "pruned" count can overstate. Push only inside the `if`.
