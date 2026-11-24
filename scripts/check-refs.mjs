#!/usr/bin/env node
// Checks name and link references (plan Task 1.12). Findings may be baselined in scripts/baseline/refs.jsonl.
// Scope A (always): src/. Scope B (--docs): README.md, AGENTS.md, CHANGELOG.md (latest entry), website/docs/**.
// Usage: node scripts/check-refs.mjs [--root <dir>] [--docs] [--update-baseline | --write-baseline]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { applyBaseline } from './lib/baseline.mjs';
import { loadSource, markdownFiles } from './lib/load-source.mjs';

const REPO_ROOT = resolve(import.meta.dirname, '..');
// A `../` link must be rewritten to a name reference; it is never baselined (Task 2.8).
export const NEVER_BASELINED = ['link-outside-skill'];
const MIGRATION_TABLE_MARKER = '<!-- migration-table -->';
const TOKEN = /(?<![\w.-])(\/?)(tsh-[a-z0-9-]*)/g;
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const FENCE = /^\s*(```|~~~)/;

/** Placeholders: `tsh-<name>`, `tsh-…`, `tsh-*`, prefix mentions (`tsh-cursor-`), `tsh-my-*`, `tsh-example-*`. */
function isPlaceholder(token) {
  return token.endsWith('-') || /^tsh-(my|example)(-|$)/.test(token);
}

/** @returns {object[]} findings for scope A */
export function checkSource(model) {
  const findings = [];
  const index = nameIndex(model);
  for (const doc of markdownFiles(model)) {
    const isTemplate = /^assets\/[^/]*\.template\.[^/]+$/.test(doc.skillPath ?? '');
    findings.push(...scanNames(doc.text, doc.file, index, { skipFences: isTemplate }));
    findings.push(...scanLinks(doc, model.root));
  }
  for (const skill of model.skills) {
    const target = skill.data['routes-to'];
    if (typeof target === 'string' && !index.routable.has(target)) {
      findings.push({ rule: 'unresolved-routes-to', file: skill.file, key: target });
    }
  }
  return findings;
}

/** @returns {object[]} findings for scope B (names only) */
export function checkDocs(model) {
  const index = nameIndex(model);
  const findings = [];
  const docs = ['README.md', 'AGENTS.md'].filter((f) => existsSync(join(model.root, f)));
  for (const file of [...docs, ...walkDocs(model.root, 'website/docs')]) {
    findings.push(...scanNames(readFileSync(join(model.root, file), 'utf8'), file, index));
  }
  if (existsSync(join(model.root, 'CHANGELOG.md'))) {
    const { text, offset } = latestChangelogEntry(readFileSync(join(model.root, 'CHANGELOG.md'), 'utf8'));
    findings.push(...scanNames(text, 'CHANGELOG.md', index, { lineOffset: offset }));
  }
  return findings;
}

function nameIndex(model) {
  const orchestrators = model.skills.filter((s) => s.data.type === 'orchestrator').map((s) => s.name);
  return {
    names: new Set([...model.skills.map((s) => s.name), ...model.agents.map((a) => a.name)]),
    commands: new Set(model.skills.filter((s) => s.data.type === 'command').map((s) => s.name)),
    routable: new Set([...model.agents.map((a) => a.name), ...orchestrators]),
  };
}

/** Every `tsh-x` token must name a skill or agent; every `/tsh-x` must name a command. */
function scanNames(text, file, index, { skipFences = false, lineOffset = 0 } = {}) {
  const findings = [];
  let inFence = false;
  let table = 'none'; // none | pending (marker seen) | rows
  text.split('\n').forEach((line, i) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      if (skipFences) return;
    }
    if (inFence && skipFences) return;
    if (line.trim() === MIGRATION_TABLE_MARKER) {
      table = 'pending';
      return;
    }
    if (table !== 'none') {
      if (line.trim().startsWith('|')) return void (table = 'rows');
      if (table === 'pending' && line.trim() === '') return;
      table = 'none';
    }
    for (const m of line.matchAll(TOKEN)) {
      const [, slash, token] = m;
      if (isPlaceholder(token)) continue;
      const lineNo = lineOffset + i + 1;
      if (slash && !index.commands.has(token)) findings.push({ rule: 'unresolved-command', file, key: `/${token}`, line: lineNo });
      else if (!slash && !index.names.has(token)) findings.push({ rule: 'unresolved-name', file, key: token, line: lineNo });
    }
  });
  return findings;
}

/** Relative links must stay inside their own skill dir and point at an existing file. */
function scanLinks(doc, root) {
  const findings = [];
  let inFence = false;
  doc.text.split('\n').forEach((line, i) => {
    if (FENCE.test(line)) inFence = !inFence;
    if (inFence) return;
    for (const m of line.matchAll(LINK)) {
      const raw = m[1];
      const target = safeDecode(raw.replace(/[#?].*$/, ''));
      if (target === '' || /^[a-z][a-z0-9+.-]*:/i.test(raw)) continue;
      const finding = { file: doc.file, key: raw, line: i + 1 };
      const resolved = doc.skill ? posix.normalize(posix.join(posix.dirname(doc.skillPath), target)) : null;
      if (!resolved || target.startsWith('/') || resolved.startsWith('../')) {
        findings.push({ rule: 'link-outside-skill', ...finding });
      } else if (!existsSync(join(root, doc.skill.dir, resolved))) {
        findings.push({ rule: 'broken-link', ...finding });
      }
    }
  });
  return findings;
}

function safeDecode(value) {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

/** The first `## ` section of the changelog, with its line offset. */
function latestChangelogEntry(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## '));
  if (start === -1) return { text: '', offset: 0 };
  const next = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return { text: lines.slice(start, next === -1 ? undefined : next).join('\n'), offset: start };
}

function walkDocs(root, rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).sort().flatMap((entry) => {
    const childRel = `${rel}/${entry}`;
    if (statSync(join(abs, entry)).isDirectory()) return walkDocs(root, childRel);
    return /\.mdx?$/.test(entry) ? [childRel] : [];
  });
}

/** @returns {{ code: number, lines: string[] }} */
export function checkRefs(root, { docs = false, updateBaseline = false, writeBaseline = false } = {}) {
  let model;
  try {
    model = loadSource(root);
  } catch (err) {
    return { code: 1, lines: [`error: ${err.message}`] };
  }
  const findings = [...checkSource(model), ...(docs ? checkDocs(model) : [])];
  return applyBaseline({
    findings,
    baselineFile: join(root, 'scripts', 'baseline', 'refs.jsonl'),
    updateBaseline,
    writeInitial: writeBaseline,
    neverBaselined: NEVER_BASELINED,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: { root: { type: 'string' }, docs: { type: 'boolean' }, 'update-baseline': { type: 'boolean' }, 'write-baseline': { type: 'boolean' } },
  });
  const { code, lines } = checkRefs(resolve(values.root ?? REPO_ROOT), {
    docs: values.docs,
    updateBaseline: values['update-baseline'],
    writeBaseline: values['write-baseline'],
  });
  for (const line of lines) console.log(line);
  process.exitCode = code;
}
