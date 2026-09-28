// Test helpers. Every fixture lives in the OS temp dir, never under a tool-discovered path in the repo.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parse as parseYaml, stringify } from 'yaml';

export const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
export const TARGETS = JSON.parse(readFileSync(join(REPO_ROOT, 'src', 'config', 'targets.json'), 'utf8'));

/** Writes `files` (repo-relative path -> string | Buffer | object as JSON; null skips) into a new temp root. */
export function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), 'tsh-gen-test-'));
  writeFiles(root, files);
  return root;
}

export function writeFiles(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    if (content === null) continue;
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    const isText = typeof content === 'string' || Buffer.isBuffer(content);
    writeFileSync(abs, isText ? content : `${JSON.stringify(content, null, 2)}\n`);
  }
}

export function doc(frontmatter, body = '') {
  return `---\n${stringify(frontmatter)}---\n${body}`;
}

const meta = (short) => ({ 'short-description': short });

/** A small, lint-clean source tree with every artifact type. Pass overrides to replace or drop (null) files. */
export function sourceFiles(overrides = {}) {
  return {
    'src/config/targets.json': TARGETS,
    'src/mcp/servers.json': {
      servers: {
        context7: { transport: 'stdio', command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] },
        'awslabs.aws-api-mcp-server': { transport: 'stdio', command: 'uvx', args: ['x'], env: { LOG: 'ERROR' } },
        figma: { transport: 'http', url: 'https://mcp.figma.com/mcp' },
      },
    },
    'src/partials/agent-modes.md': '## Modes\n\nInteractive by default. Delegated when the task starts with `MODE: delegated`.\n',
    'src/partials/caller-status-handling.md': '## Status handling\n\nHandle DONE, NEEDS_INPUT and BLOCKED.\n',
    'src/skills/tsh-reviewing-code/SKILL.md': doc(
      { name: 'tsh-reviewing-code', description: 'Reviews code changes. Use when reviewing a change.', type: 'skill',
        paths: ['**/*.ts'], 'requires-mcp': ['context7'], metadata: meta('Review code') },
      '\n# Reviewing code\n\nUse the [checklist](references/checklist.md) and fill in the [report](assets/report.template.md).\n',
    ),
    'src/skills/tsh-reviewing-code/references/checklist.md': '# Checklist\n\n- Correctness\n',
    'src/skills/tsh-reviewing-code/assets/report.template.md': '# Report\n\n```\ntsh-anything-goes-here\n```\n',
    'src/skills/tsh-review/SKILL.md': doc(
      { name: 'tsh-review', description: 'Reviews a change set. Use when a review is needed.', type: 'command',
        'routes-to': 'tsh-code-reviewer', 'argument-hint': '[task-id | scope]', 'requires-mcp': ['figma'],
        metadata: meta('Review a change') },
      '\nDelegate to the `tsh-code-reviewer` agent.\n\n<!-- include: caller-status-handling -->\n',
    ),
    'src/skills/tsh-commit/SKILL.md': doc(
      { name: 'tsh-commit', description: 'Creates a commit. Use when committing.', type: 'command', standalone: true,
        metadata: meta('Commit changes') },
      '\nCommit the staged changes.\n',
    ),
    'src/skills/tsh-implement-task/SKILL.md': doc(
      { name: 'tsh-implement-task', description: 'Internal step of `/tsh-review`: implements one task.',
        type: 'internal', metadata: meta('Implement one task') },
      '\nImplement the task.\n',
    ),
    'src/skills/tsh-engineering-manager/SKILL.md': doc(
      { name: 'tsh-engineering-manager', description: 'Internal step of `/tsh-review`: orchestrates delivery.',
        type: 'orchestrator', metadata: meta('Orchestrate delivery') },
      '\nRun `tsh-implement-task` via `tsh-code-reviewer`.\n\n<!-- include: caller-status-handling -->\n',
    ),
    'src/agents/tsh-code-reviewer.md': doc(
      { name: 'tsh-code-reviewer', description: 'Reviews a change. Use when a review is needed.', type: 'agent',
        'model-tier': 'balanced', access: 'read-write', 'requires-mcp': ['context7'],
        'preload-skills': ['tsh-reviewing-code'] },
      '\n# Code reviewer\n\nFollow `tsh-reviewing-code`.\n\n<!-- include: agent-modes -->\n',
    ),
    'src/agents/tsh-ui-reviewer.md': doc(
      { name: 'tsh-ui-reviewer', description: 'Verifies UI. Use when checking a UI.', type: 'agent',
        'model-tier': 'deep', access: 'read-only', shell: false },
      '\n# UI reviewer\n\n<!-- include: agent-modes -->\n',
    ),
    ...overrides,
  };
}

/** Returns a copy of a source file's frontmatter with `changes` applied (undefined deletes a key). */
export function withFrontmatter(files, rel, changes, body) {
  const text = files[rel];
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  const data = { ...parseYaml(match[1]), ...changes };
  for (const [k, v] of Object.entries(changes)) if (v === undefined) delete data[k];
  return doc(data, body ?? match[2]);
}
