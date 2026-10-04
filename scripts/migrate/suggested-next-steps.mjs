#!/usr/bin/env node
// One-off pass (plan Task 3.5): handoffs become "Suggested next steps" that name commands.
// Idempotent, with --dry-run.
//   - "## Handoffs" sections of agents and the BA orchestrator are replaced (ui-reviewer: removed)
//   - the "Before starting any task, you check all available skills ..." boilerplate is removed (AG-X8)
// Usage: node scripts/migrate/suggested-next-steps.mjs [--root <dir>] [--dry-run]
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const HEADING = '## Suggested next steps';
const NEXT_STEPS = {
  'src/agents/tsh-architect.md': [
    'Once the plan is ready, recommend these commands to the user:',
    '',
    '- **Start implementation**: run `/tsh-implement Implement feature according to the plan`',
    '- **Start infrastructure implementation**: run `/tsh-implement Implement the infrastructure according to the architectural plan`. The engineering manager routes the infrastructure tasks to the DevOps engineer.',
  ],
  'src/agents/tsh-code-reviewer.md': [
    'After the review, recommend these commands to the user:',
    '',
    '- **Fix the requested changes**: run `/tsh-implement Implement changes requested after code review`',
  ],
  'src/agents/tsh-context-engineer.md': [
    'Once the context is gathered, recommend these commands to the user:',
    '',
    '- **Start implementation**: run `/tsh-implement Start implementation for the current task`',
  ],
  'src/agents/tsh-devops-engineer.md': [
    'After the infrastructure work, recommend these commands to the user:',
    '',
    '- **Review IaC and pipeline code**: run `/tsh-review Review the infrastructure-as-code and CI/CD pipeline changes`',
  ],
  'src/agents/tsh-e2e-engineer.md': [
    'When testing uncovered a bug, recommend these commands to the user:',
    '',
    '- **Fix the bug found during E2E testing**: run `/tsh-implement Fix the bug discovered during E2E testing`',
  ],
  'src/agents/tsh-software-engineer.md': [
    'After the implementation, recommend these commands to the user:',
    '',
    '- **Review the code**: run `/tsh-review Review the implementation against the plan and feature context`',
    '- **Write E2E tests**: run `/tsh-implement Write E2E tests for the implemented feature`',
  ],
  'src/skills/tsh-business-analyst/SKILL.md': [
    'After the tasks are approved and pushed, recommend these commands to the user:',
    '',
    '- **Start implementation**: run `/tsh-implement Start implementation for the current task`',
  ],
  'src/agents/tsh-ui-reviewer.md': null, // the handoff is removed; the caller decides what follows
};
const BOILERPLATE = /^Before starting any task, you check all available skills and decide which one is the best fit for the task at hand\.[^\n]*\n+/m;

/** Replaces (or, with null, removes) the "## Handoffs" section up to the next H2 or the end. */
export function replaceHandoffs(text, lines) {
  const m = /^## Handoffs\n[\s\S]*?(?=^## |\n?<!-- include:|(?![\s\S]))/m.exec(text);
  if (!m) return text;
  const replacement = lines ? `${HEADING}\n\n${lines.join('\n')}\n\n` : '';
  return (text.slice(0, m.index) + replacement + text.slice(m.index + m[0].length)).replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n');
}

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? markdownFiles(p) : p.endsWith('.md') ? [p] : [];
  });
}

export function run({ root, dryRun = false, log = () => {} }) {
  let changed = 0;
  for (const abs of markdownFiles(join(root, 'src'))) {
    const rel = relative(root, abs).split('\\').join('/');
    const before = readFileSync(abs, 'utf8');
    let after = before.replace(BOILERPLATE, '');
    if (rel in NEXT_STEPS) after = replaceHandoffs(after, NEXT_STEPS[rel]);
    if (after === before) continue;
    changed += 1;
    log(`${dryRun ? 'would change' : 'change'} ${rel}`);
    if (!dryRun) writeFileSync(abs, after);
  }
  return { changed };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, 'dry-run': { type: 'boolean' } } });
  const { changed } = run({ root: resolve(values.root ?? join(import.meta.dirname, '..', '..')), dryRun: values['dry-run'], log: console.log });
  console.log(`${changed} file(s) ${values['dry-run'] ? 'would change' : 'changed'}`);
}
