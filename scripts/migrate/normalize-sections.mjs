#!/usr/bin/env node
// One-off pass (plan Task 3.2): section and description normalization across src/skills.
// Idempotent, with --dry-run. Data (descriptions, short descriptions, Connected Skills lists)
// lives in normalize-metadata.json next to this file.
//   - "Related Skills"/"References" headings -> "Connected Skills"; missing Connected Skills sections added
//   - body "When to Use" sections removed (their triggers are folded into the descriptions)
//   - duplicate H1 removed
//   - "## Contents" added to reference/asset files over 100 lines
//   - "Use when" added to skill/command descriptions; metadata.short-description added everywhere
// Usage: node scripts/migrate/normalize-sections.mjs [--root <dir>] [--dry-run]
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const HERE = import.meta.dirname;
const TOC_THRESHOLD = 100;
const WHEN_TO_USE_SKILLS = new Set(['tsh-designing-multi-cloud-architecture', 'tsh-implementing-backend', 'tsh-implementing-ci-cd',
  'tsh-implementing-kubernetes', 'tsh-implementing-observability', 'tsh-managing-secrets', 'tsh-optimizing-cloud-cost',
  'tsh-implementing-terraform-modules', 'tsh-discovering-technical-context']);

const slug = (heading) => heading.toLowerCase().replace(/[`*_]/g, '').replace(/[^\p{L}\p{N} -]/gu, '').trim().replace(/ /g, '-');

function splitFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) throw new Error('no frontmatter');
  return { data: parseYaml(m[1]), body: text.slice(m[0].length) };
}
const joinFrontmatter = (data, body) => `---\n${stringifyYaml(data, { lineWidth: 0 })}---\n${body}`;

/** Removes the "## <title>" section up to the next H2 (code fences respected). */
function removeSection(body, title) {
  const lines = body.split('\n');
  let fence = false;
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^```/.test(lines[i])) fence = !fence;
    if (fence) continue;
    if (start < 0 && lines[i] === `## ${title}`) start = i;
    else if (start >= 0 && /^## /.test(lines[i])) return [...lines.slice(0, start), ...lines.slice(i)].join('\n');
  }
  return start < 0 ? body : lines.slice(0, start).join('\n').replace(/\n+$/, '\n');
}

function h2s(text) {
  const out = [];
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^```/.test(line)) fence = !fence;
    const m = !fence && /^## +(.+?)\s*$/.exec(line);
    if (m) out.push(m[1]);
  }
  return out;
}

/** Adds (or renames to) "## Contents" as the first H2 of a long reference/asset file. */
export function addContents(text, isTemplate) {
  if (text.split('\n').length <= TOC_THRESHOLD) return text;
  const first = /^## +(.+?)\s*$/m.exec(text);
  if (!first || first[1] === 'Contents') return text;
  if (/^table of contents$/i.test(first[1])) {
    return text.replace(/^## Table of Contents[ \t]*$/im, '## Contents').replace(/\(#table-of-contents\)/g, '(#contents)').replace(/\[Table of Contents\]/g, '[Contents]');
  }
  const entries = h2s(text).map((h) => `- [${h}](#${slug(h)})`);
  const note = isTemplate ? '_Template navigation only: omit this section from the generated document._\n\n' : '';
  const block = `## Contents\n\n${note}${entries.join('\n')}\n\n`;
  return `${text.slice(0, first.index)}${block}${text.slice(first.index)}`;
}

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? markdownFiles(p) : p.endsWith('.md') ? [p] : [];
  });
}

/** @returns {{ changed: number }} */
export function run({ root, dryRun = false, log = () => {} }) {
  const meta = JSON.parse(readFileSync(join(HERE, 'normalize-metadata.json'), 'utf8'));
  const skillsDir = join(root, 'src', 'skills');
  const writes = new Map();
  const stage = (abs, next) => {
    if (next !== readFileSync(abs, 'utf8')) writes.set(abs, next);
  };

  for (const name of readdirSync(skillsDir)) {
    const dir = join(skillsDir, name);
    const skillFile = join(dir, 'SKILL.md');
    if (!existsSync(skillFile)) continue;
    const { data, body: original } = splitFrontmatter(readFileSync(skillFile, 'utf8'));
    let body = original;

    // Description: explicit text, else "Use for" -> "Use when".
    if (meta.descriptions[name]) data.description = meta.descriptions[name];
    else if (['skill', 'command'].includes(data.type) && !data.description.includes('Use when')) {
      data.description = data.description.replace('Use for ', 'Use when ');
    }
    if (!meta.shortDescriptions[name]) throw new Error(`no short-description for ${name}`);
    data.metadata = { ...(data.metadata ?? {}), 'short-description': meta.shortDescriptions[name] };

    // Headings and sections.
    body = body.replace(/^## Related Skills[ \t]*$/m, '## Connected Skills');
    if (name === 'tsh-committing') {
      body = body.replace(/^## References\n\n(- Full spec:[^\n]*)\n?$/m, '## Specification\n\n$1\n');
    }
    if (WHEN_TO_USE_SKILLS.has(name)) body = removeSection(body, 'When to Use');
    // Two adjacent H1 lines: keep the second.
    body = body.replace(/^# [^\n]+\n\n(# [^\n]+\n)/m, '$1');
    if (meta.connectedSkills[name] && !/^## Connected Skills[ \t]*$/m.test(body)) {
      const items = meta.connectedSkills[name].map(([skill, why]) => `- \`${skill}\` — ${why}`).join('\n');
      body = `${body.replace(/\n*$/, '\n')}\n## Connected Skills\n\n${items}\n`;
    }
    stage(skillFile, joinFrontmatter(data, body));

    for (const abs of markdownFiles(dir)) {
      const rel = relative(dir, abs).split('\\').join('/');
      if (!/^(references|assets)\//.test(rel)) continue;
      stage(abs, addContents(readFileSync(abs, 'utf8'), rel.startsWith('assets/')));
    }
  }

  for (const [abs, next] of writes) {
    log(`${dryRun ? 'would change' : 'change'} ${relative(root, abs).split('\\').join('/')}`);
    if (!dryRun) writeFileSync(abs, next);
  }
  return { changed: writes.size };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, 'dry-run': { type: 'boolean' } } });
  const { changed } = run({ root: resolve(values.root ?? join(HERE, '..', '..')), dryRun: values['dry-run'], log: console.log });
  console.log(`${changed} file(s) ${values['dry-run'] ? 'would change' : 'changed'}`);
}
