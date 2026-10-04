#!/usr/bin/env node
// One-off pass (plan Task 3.3): wires the partials into src/. Idempotent, with --dry-run.
//   - agent-modes into every agent (before the first section after the role section)
//   - caller-status-handling into every orchestrator and every command routed to an agent
//   - plan-progress replaces the inline "Plan Progress and Definition of Done" block
// Usage: node scripts/migrate/add-partials.mjs [--root <dir>] [--dry-run]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parse as parseYaml } from 'yaml';

const include = (name) => `<!-- include: ${name} -->`;
const ROLE_HEADINGS = new Set(['Agent Role and Responsibilities', 'Agent Role', 'Persona']);
const PLAN_PROGRESS = /^## Plan Progress and Definition of Done\n[\s\S]*?— only check boxes\.\n/m;

function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  return m ? parseYaml(m[1]) : {};
}

/** H2 line indexes outside code fences. */
function h2Lines(lines) {
  let fence = false;
  const out = [];
  lines.forEach((line, i) => {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && /^## /.test(line)) out.push(i);
  });
  return out;
}

const insertAt = (lines, index, name) => [...lines.slice(0, index), include(name), '', ...lines.slice(index)];

export function addAgentModes(text) {
  if (text.includes(include('agent-modes'))) return text;
  const lines = text.split('\n');
  const h2 = h2Lines(lines);
  if (!h2.length) throw new Error('agent has no H2 section');
  const firstTitle = lines[h2[0]].slice(3).trim();
  const at = ROLE_HEADINGS.has(firstTitle) && h2.length > 1 ? h2[1] : h2[0];
  return insertAt(lines, at, 'agent-modes').join('\n');
}

export function addCallerHandling(text) {
  if (text.includes(include('caller-status-handling'))) return text;
  const lines = text.split('\n');
  const h2 = h2Lines(lines);
  const trailing = h2.find((i) => /^## (Connected Skills|Related commands|Related Commands)\s*$/.test(lines[i]));
  if (trailing !== undefined) return insertAt(lines, trailing, 'caller-status-handling').join('\n');
  return `${text.replace(/\n*$/, '\n')}\n${include('caller-status-handling')}\n`;
}

export function usePlanProgress(text) {
  if (!PLAN_PROGRESS.test(text)) return text;
  return text.replace(PLAN_PROGRESS, `${include('plan-progress')}\n`);
}

export function run({ root, dryRun = false, log = () => {} }) {
  const src = join(root, 'src');
  const agentNames = new Set(readdirSync(join(src, 'agents')).map((f) => f.replace(/\.md$/, '')));
  let changed = 0;
  const apply = (abs, fn) => {
    const before = readFileSync(abs, 'utf8');
    const after = fn(before);
    if (after === before) return;
    changed += 1;
    log(`${dryRun ? 'would change' : 'change'} ${relative(root, abs).split('\\').join('/')}`);
    if (!dryRun) writeFileSync(abs, after);
  };
  for (const name of agentNames) {
    apply(join(src, 'agents', `${name}.md`), (t) => addAgentModes(usePlanProgress(t)));
  }
  for (const name of readdirSync(join(src, 'skills'))) {
    const file = join(src, 'skills', name, 'SKILL.md');
    if (!existsSync(file)) continue;
    const data = frontmatter(readFileSync(file, 'utf8'));
    const routed = data.type === 'orchestrator' || (data.type === 'command' && agentNames.has(data['routes-to']));
    if (routed) apply(file, addCallerHandling);
  }
  return { changed };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, 'dry-run': { type: 'boolean' } } });
  const { changed } = run({ root: resolve(values.root ?? join(import.meta.dirname, '..', '..')), dryRun: values['dry-run'], log: console.log });
  console.log(`${changed} file(s) ${values['dry-run'] ? 'would change' : 'changed'}`);
}
