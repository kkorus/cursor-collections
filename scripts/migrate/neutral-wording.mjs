#!/usr/bin/env node
// One-off pass (plan Task 3.1): neutral wording across src/. Idempotent, with --dry-run.
// Usage: node scripts/migrate/neutral-wording.mjs [--root <dir>] [--dry-run]
// Skips the lint-allowlisted skills where tool syntax is the subject (tsh-creating-*,
// tsh-migrating-copilot-customizations, tsh-engineering-prompts).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const SKIP = [/^src\/skills\/tsh-creating-/, /^src\/skills\/tsh-migrating-copilot-customizations\//, /^src\/skills\/tsh-engineering-prompts\//];
const PI = 'project instructions (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.claude/rules/`)';
const TIER_WORD = { 'GPT-5.4 mini': 'fast', 'Gemini 3.1 Pro (Preview)': 'deep', 'Claude Sonnet 4.6': 'balanced', 'GPT-5.4': 'deep' };

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}

/** Transforms one file's text. `kindOf(name)` returns 'agent' | 'skill'. */
export function transform(text, kindOf, inAgent = false) {
  // Agent bodies may not use delegation words (lint agent-no-delegation), so say "agent" there.
  const SA = inAgent ? 'agent' : 'subagent';
  const label = (name) => `\`${name}\` ${kindOf(name) === 'agent' ? SA : 'skill'}`;
  let out = text;

  // --- @tsh-x references (type-aware, m8) ---
  out = out.replace(/\(`@tsh-\*`\)/g, '(the `tsh-*` subagents)');
  out = out.replace(/(\*\*)?`?@(tsh-[a-z0-9]+(?:-[a-z0-9]+)*)`?(\*\*)?( \(full-stack subagent\)| agent skill| agent)?/g,
    (m, open = '', name, close = '', _suffix, offset, whole) => {
      const before = whole.slice(0, offset);
      const lineStart = /(^|\n)(?:[-*]|\d+\.)? ?$/.test(before);
      const article = /\b(the|The) $/.test(before) || /\b(to|by|of) the $/.test(before);
      const l = label(name);
      return `${lineStart || article ? '' : 'the '}${open}${l}${close}`;
    });
  // Preceding "the " is kept by the lead group; normalise leftovers such as "the the".
  // --- "agent skill" / "agent" after a name ---
  out = out.replace(/(?<![\w`])(the )?`?(tsh-[a-z0-9]+(?:-[a-z0-9]+)*)`? agent skill\b/g, (_, the, name) => `${the ?? 'the '}${label(name)}`);
  out = out.replace(/(?<![\w`])(the )?`(tsh-[a-z0-9]+(?:-[a-z0-9]+)*)` agent\b/g, (m, the, name) => (kindOf(name) === 'agent' ? `${the ?? 'the '}\`${name}\` ${SA}` : m));
  out = out.replace(/\b(invoke|Invoke) the agent skill the `(tsh-[a-z0-9-]+)` skill for `(tsh-[a-z0-9-]+)`/g,
    (_, v, skill, agent) => `delegate to the \`${agent}\` ${SA}, instructing it to follow the \`${skill}\` skill`);
  out = out.replace(/\b(invoke|Invoke) the agent skill the `(tsh-[a-z0-9-]+)` skill\b/g,
    (_, v, name) => (kindOf(name) === 'agent' ? `delegate to the \`${name}\` ${SA}` : `load the \`${name}\` skill`));
  out = out.replace(/invoke the `(tsh-[a-z0-9-]+)` agent skill \(the `\1` skill\)/gi, (_, name) => `delegate to the ${label(name)}`);
  out = out.replace(/(the `tsh-[a-z0-9-]+` (?:sub)?agent) \(the `tsh-[a-z0-9-]+` skill\)/g, '$1');
  // Commands routed to an agent delegate to it; an orchestrator skill is still loaded.
  out = out.replace(/Load and follow the (`tsh-[a-z0-9-]+` (?:sub)?agent)\./g, 'Delegate to the $1.');
  out = out.replace(/\bthe the\b/g, 'the').replace(/\bskill skill\b/g, 'skill');

  // --- Task tool / agentId ---
  out = out.replace(/ via Task tool —/g, ' —');
  out = out.replace(/\bdelegated by (tsh-[a-z0-9-]+)/g, (_, n) => `delegated by the \`${n}\` ${kindOf(n) === 'agent' ? SA : 'skill'}`);
  out = out.replace(/Delegated to by (tsh-[a-z0-9-]+)/g, (_, n) => `Delegated to by the \`${n}\` ${kindOf(n) === 'agent' ? SA : 'skill'}`);
  out = out.replace(/You use the \*\*Task\*\* tool to delegate ([^.]*?) to (?:specialized |worker )?agent skills \(([^)]*)\)/g,
    (_, what, list) => `You delegate ${what} to specialized subagents (${list})`);
  out = out.replace(/Use the \*\*Task\*\* tool to delegate — the reviewer/g, 'Delegate to it — the reviewer');
  out = out.replace(/\(this is the task description inside your delegation prompt, not the Cursor Task tool itself\)/g,
    '(this is the task description inside your delegation prompt)');
  out = out.replace(/Use the \*\*Task\*\* tool to delegate to these specialized worker agent skills:/g, 'Delegate to these specialized worker subagents:');
  out = out.replace(/Delegate via Task tool per /g, 'Delegate to a subagent per ');
  out = out.replace(/When delegating workers with the Task tool:/g, 'When delegating to workers:');
  out = out.replace(/Use the `agent` tool with `agentId: "(tsh-[a-z0-9-]+)"`/g, (_, n) => `${inAgent ? 'Invoke' : 'Delegate to'} the \`${n}\` ${SA}`);
  out = out.replace(/\bthe Task tool\b/g, 'subagent delegation').replace(/\bvia Task tool\b/g, 'as a subagent').replace(/\bTask tool\b/g, 'subagent delegation');

  // --- rules / project instructions ---
  out = out.replace(/\(\.cursor\/rules\/\*\.mdc or cursor-instructions\.md\)/g, '(`.cursor/rules/*.mdc` or `AGENTS.md`)');
  out = out.replace(/cursor-instructions\.md or any other \\?\*\.mdc rules/g, PI);
  out = out.replace(/`\.cursor\/rules\/cursor-instructions\.md`/g, '`AGENTS.md`');
  out = out.replace(/`cursor-instructions\.md`/g, '`AGENTS.md`');
  out = out.replace(/`?\\?\*\.mdc rules`?( files)?/g, PI);
  out = out.replace(/\\\*\.mdc rules/g, PI);
  out = out.replace(/`\.mdc rules`/g, 'project instructions');
  out = out.replace(/\.mdc rules\b/g, 'project instructions');
  out = out.replace(/cursor-instructions\.md/g, PI);

  // --- tool names ---
  out = out.replace(/ \(`read_file` on the `([^`]+)` skill and `([^`]+)`\)/g, ' (including its `$2` reference)');
  out = out.replace(/ \(`read_file` on the `([^`]+)` skill\)/g, '');
  out = out.replace(/\(use `search` or `grep_search` instead\)/g, '(use code search instead)');
  out = out.replace(/use the `create_file` capability/g, 'create them directly').replace(/For new files, create them directly\./g, 'For new files, create them directly.');
  out = out.replace(/\bgrep_search\b/g, 'code search').replace(/\bcreate_file\b/g, 'file creation');
  out = out.replace(/\bsemantic search\b/gi, (m) => (m[0] === 'S' ? 'Code search' : 'code search'));
  out = out.replace(/This tool connects to the local Figma desktop app running in Dev Mode\./g, 'This tool is provided by the Figma MCP server.');
  out = out.replace(/Figma desktop app[^.\n]*Dev Mode/g, 'the Figma MCP server');

  // --- popup ---
  out = out.replace(/\*\*One suggestion per popup\*\*: Present exactly \*\*one suggestion per question\*\*\. Each popup must be self-contained — the user should be able to make a decision without needing context from a previous popup\./,
    '**One suggestion per question**: Ask the user about exactly one suggestion at a time. Each question must be self-contained — the user should be able to make a decision without needing context from a previous question.');
  out = out.replace(/Ask questions to the user to clarify these items with the user\. Ask exactly \*\*one question per question\*\*\./, 'Ask the user to clarify these items. Ask exactly **one question at a time**.');
  out = out.replace(/This ensures each popup is self-contained/g, 'This ensures each question is self-contained');
  out = out.replace(/\bpop-?ups?\b/gi, 'question');

  // --- model names (worker tiers) ---
  out = out.replace(/\(`(GPT-5\.4 mini|Gemini 3\.1 Pro \(Preview\)|Claude Sonnet 4\.6|GPT-5\.4)`\)/g, (_, m) => `(${TIER_WORD[m]} tier)`);
  out = out.replace(/ Use GPT-5\.4 mini for this use case when appropriate\./g, '');
  out = out.replace(/Vertex AI \(Gemini\)/g, 'Vertex AI (Google foundation models)');
  // Tidy-ups after the replacements above.
  out = out.replace(/project instructions or (project instructions \()/g, '$1');
  out = out.replace(/- Instructions \(project instructions\) = RULES/g, '- Project instructions = RULES');
  return out;
}

export function run({ root, dryRun = false, log = () => {} }) {
  const kinds = new Map();
  const agentsDir = join(root, 'src', 'agents');
  if (existsSync(agentsDir)) for (const f of readdirSync(agentsDir)) kinds.set(f.replace(/\.md$/, ''), 'agent');
  const kindOf = (name) => kinds.get(name) ?? 'skill';
  let changed = 0;
  for (const abs of walk(join(root, 'src'))) {
    const rel = relative(root, abs).split('\\').join('/');
    if (SKIP.some((re) => re.test(rel))) continue;
    const before = readFileSync(abs, 'utf8');
    const after = transform(before, kindOf, rel.startsWith('src/agents/'));
    if (after !== before) {
      changed += 1;
      log(`${dryRun ? 'would change' : 'change'} ${rel}`);
      if (!dryRun) writeFileSync(abs, after);
    }
  }
  return { changed };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, 'dry-run': { type: 'boolean' } } });
  const { changed } = run({ root: resolve(values.root ?? join(import.meta.dirname, '..', '..')), dryRun: values['dry-run'], log: console.log });
  console.log(`${changed} file(s) ${values['dry-run'] ? 'would change' : 'changed'}`);
}
