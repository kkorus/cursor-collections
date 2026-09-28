#!/usr/bin/env node
// Lints src/ (plan Task 1.11). Content findings may be baselined in scripts/baseline/lint.jsonl.
// Usage: node scripts/lint.mjs [--root <dir>] [--update-baseline]
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { applyBaseline } from './lib/baseline.mjs';
import { SUPPORT_DIRS, loadSource, markdownFiles } from './lib/load-source.mjs';
import { validateModel } from './lib/schema.mjs';

const REPO_ROOT = resolve(import.meta.dirname, '..');
export const STRUCTURAL_RULES = ['schema', 'name-collision', 'skill-layout', 'no-dot-tool-dirs'];
export const WARN_ONLY_RULES = ['description-length'];

const MAX_SKILL_LINES = 500;
const TOC_THRESHOLD = 100;
const DESCRIPTION_WARN = 500;
const SHORT_DESCRIPTION_MAX = 120;
// Tuned to the spike 1.3 Q7 measurement of the Codex skill-listing budget (m5).
const LISTING_BUDGET = 6000;
const DOT_TOOL_DIRS = ['.agents', '.claude', '.cursor', '.codex'];

const TOOL_SYNTAX = [
  ['@tsh-', /@tsh-/g],
  ['Task tool', /\bTask tool\b/gi],
  ['agentId', /\bagentId\b/g],
  ['runSubagent', /\brunSubagent\b/g],
  ['read_file', /\bread_file\b/g],
  ['grep_search', /\bgrep_search\b/g],
  ['create_file', /\bcreate_file\b/g],
  ['usages tool', /`?usages`? tool\b/gi],
  ['semantic search', /\bsemantic search\b/gi],
  ['popup', /\bpop-?ups?\b/gi],
  ['Dev Mode', /\bDev Mode\b/gi],
  ['cursor-instructions.md', /cursor-instructions\.md/g],
  ['*.mdc rules', /\.mdc rules?\b/gi],
  ['GPT-', /\bGPT-/g],
  ['Claude Sonnet', /\bClaude Sonnet\b/g],
  ['Claude Opus', /\bClaude Opus\b/g],
  ['Gemini', /\bGemini\b/g],
];
const TOOL_SYNTAX_ALLOW = [/^tsh-creating-/, /^tsh-migrating-copilot-customizations$/, /^tsh-engineering-prompts$/];
const DELEGATION_WORDS = /\b(delegate to|spawn\w*|subagents?)\b/gi;
const DELEGATION_ALLOW = ['tsh-ai-customization-researcher', 'tsh-ai-customization-creator',
  'tsh-ai-customization-reviewer', 'tsh-prompt-engineer'];
const LINK = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/** @returns {{ findings: object[], notes: string[] }} */
export function lintModel(model) {
  const findings = [];
  const notes = [];
  const add = (rule, file, key, extra = {}) => findings.push({ rule, file, key, ...extra });

  // Structural rules (never baselined).
  for (const e of validateModel(model)) add('schema', e.file, e.key, { message: e.message });
  const agentNames = new Set(model.agents.map((a) => a.name));
  for (const skill of model.skills) {
    if (agentNames.has(skill.name)) add('name-collision', skill.file, skill.name);
    for (const entry of skill.entries) {
      if (entry !== 'SKILL.md' && !SUPPORT_DIRS.includes(entry)) add('skill-layout', `${skill.dir}/${entry}`, entry);
    }
  }
  for (const dir of dotToolDirs(join(model.root, 'src'), 'src')) add('no-dot-tool-dirs', dir, posix.basename(dir));

  // Frontmatter-based content rules.
  let shortTotal = 0;
  let descriptionTotal = 0;
  for (const skill of model.skills) {
    const { data, file } = skill;
    const second = skill.name.split('-')[1] ?? '';
    if (data.type === 'skill' && !/^tsh-[a-z]+ing(-[a-z0-9]+)*$/.test(skill.name)) add('naming-by-type', file, skill.name);
    if ((data.type === 'command' || data.type === 'internal') && second.endsWith('ing')) add('naming-by-type', file, skill.name);
    if (skill.text.replace(/\n$/, '').split('\n').length > MAX_SKILL_LINES) add('max-lines', file, 'SKILL.md');
    const description = typeof data.description === 'string' ? data.description : '';
    descriptionTotal += description.length;
    if ((data.type === 'skill' || data.type === 'command') && !description.includes('Use when')) {
      add('description-trigger', file, 'description');
    }
    if (description.length > DESCRIPTION_WARN) add('description-length', file, 'description', { message: `${description.length} chars` });
    const short = data.metadata?.['short-description'];
    if (typeof short !== 'string' || short.length > SHORT_DESCRIPTION_MAX) {
      add('short-description', file, 'metadata.short-description');
    }
    shortTotal += typeof short === 'string' ? short.length : 0;
    const routesToAgent = data.type === 'command' && agentNames.has(data['routes-to']);
    if ((data.type === 'orchestrator' || routesToAgent) && !skill.includes.includes('caller-status-handling')) {
      add('caller-status-handling', file, 'caller-status-handling');
    }
  }
  if (shortTotal > LISTING_BUDGET) add('listing-budget', 'src/skills', 'metadata.short-description', { message: `${shortTotal} > ${LISTING_BUDGET} chars` });
  if (model.skills.length) notes.push(`listing: short-description total ${shortTotal} chars, description total ${descriptionTotal} chars`);

  for (const agent of model.agents) {
    const { data, file } = agent;
    if (typeof data.description === 'string' && data.description.length > DESCRIPTION_WARN) {
      add('description-length', file, 'description', { message: `${data.description.length} chars` });
    }
    if (!agent.includes.includes('agent-modes')) add('agent-contract', file, 'agent-modes');
    if (!DELEGATION_ALLOW.includes(agent.name)) {
      for (const m of agent.rawBody.matchAll(DELEGATION_WORDS)) {
        const word = m[1].toLowerCase().replace(/^spawn\w*/, 'spawn').replace(/^subagents$/, 'subagent');
        add('agent-no-delegation', file, word);
      }
    }
    for (const name of data['preload-skills'] ?? []) {
      if (!new RegExp(`(?<![a-z0-9-])${name}(?![a-z0-9-])`).test(agent.rawBody)) add('preload-mentioned', file, name);
    }
  }

  // Text rules over every Markdown file.
  for (const doc of markdownFiles(model)) {
    const { file, text } = doc;
    if (doc.skill && /^(references|assets)\//.test(doc.skillPath) && text.split('\n').length > TOC_THRESHOLD) {
      const firstH2 = /^## +(.+?)\s*$/m.exec(text);
      if (!firstH2 || firstH2[1] !== 'Contents') add('reference-toc', file, '## Contents');
    }
    for (const m of text.matchAll(/^#{1,6}[ \t]+(Related Skills|References)[ \t]*$/gim)) {
      add('connected-skills-heading', file, m[1], { line: lineOf(text, m.index) });
    }
    for (const m of text.matchAll(LINK)) {
      if (isPathRef(doc, m[2])) add('no-path-refs', file, m[2], { line: lineOf(text, m.index) });
    }
    const unlinked = text.replace(LINK, (_, label) => `[${label}]()`);
    for (const m of unlinked.matchAll(/\.cursor\/skills\//g)) add('no-path-refs', file, '.cursor/skills/', { line: lineOf(unlinked, m.index) });
    for (const m of unlinked.matchAll(/\bread_file\b[^\n]*?[\w.-]+\/[\w./-]+/g)) add('no-path-refs', file, 'read_file', { line: lineOf(unlinked, m.index) });
    if (!TOOL_SYNTAX_ALLOW.some((re) => doc.owner && re.test(doc.owner))) {
      for (const [key, re] of TOOL_SYNTAX) for (const m of text.matchAll(re)) add('no-tool-syntax', file, key, { line: lineOf(text, m.index) });
    }
  }
  return { findings, notes };
}

/**
 * D6: a skill may link only to its own references/, assets/ and scripts/ files, one level deep.
 * Agents and partials have no support files, so any relative link is a path reference.
 */
function isPathRef(doc, rawTarget) {
  const target = rawTarget.replace(/[#?].*$/, '');
  if (target === '' || /^[a-z][a-z0-9+.-]*:/i.test(rawTarget)) return false;
  if (!doc.skill || target.startsWith('/')) return true;
  const resolved = posix.normalize(posix.join(posix.dirname(doc.skillPath), target));
  return !new RegExp(`^(${SUPPORT_DIRS.join('|')})/[^/]+$`).test(resolved);
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function dotToolDirs(abs, rel) {
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((entry) => {
    const childAbs = join(abs, entry);
    if (!statSync(childAbs).isDirectory()) return [];
    const childRel = `${rel}/${entry}`;
    return [...(DOT_TOOL_DIRS.includes(entry) ? [childRel] : []), ...dotToolDirs(childAbs, childRel)];
  });
}

/** @returns {{ code: number, lines: string[] }} */
export function lint(root, { updateBaseline = false } = {}) {
  let model;
  try {
    model = loadSource(root);
  } catch (err) {
    return { code: 1, lines: [`error: ${err.message}`] };
  }
  const { findings, notes } = lintModel(model);
  const result = applyBaseline({
    findings,
    baselineFile: join(root, 'scripts', 'baseline', 'lint.jsonl'),
    updateBaseline,
    neverBaselined: STRUCTURAL_RULES,
    warnOnly: WARN_ONLY_RULES,
  });
  return { code: result.code, lines: [...notes, ...result.lines] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, 'update-baseline': { type: 'boolean' } } });
  const { code, lines } = lint(resolve(values.root ?? REPO_ROOT), { updateBaseline: values['update-baseline'] });
  for (const line of lines) console.log(line);
  process.exitCode = code;
}
