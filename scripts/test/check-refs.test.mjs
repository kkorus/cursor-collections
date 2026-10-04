import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkDocs, checkRefs, checkSource } from '../check-refs.mjs';
import { loadSource } from '../lib/load-source.mjs';
import { REPO_ROOT, makeRoot, sourceFiles, withFrontmatter } from './helpers.mjs';

const SKILL = 'src/skills/tsh-reviewing-code/SKILL.md';
const BASELINE = 'scripts/baseline/refs.jsonl';
const withBody = (body, rel = SKILL) => (files) => ({ ...files, [rel]: withFrontmatter(files, rel, {}, body) });
const findings = (files) => checkSource(loadSource(makeRoot(files)));
const rules = (list) => list.map((f) => `${f.rule}|${f.key}`);

test('the clean fixture has no unresolved references', () => {
  assert.deepEqual(findings(sourceFiles()), []);
  assert.equal(checkRefs(makeRoot(sourceFiles())).code, 0);
});

test('an unresolved name is reported with file:line', () => {
  const root = makeRoot(withBody('\nThen load `tsh-nope` or tsh-missing-skill.\n')(sourceFiles()));
  const { code, lines } = checkRefs(root);
  assert.equal(code, 1);
  assert.ok(lines.includes(`error: ${SKILL}:13: unresolved-name: tsh-nope`), lines.join('\n'));
  assert.ok(lines.includes(`error: ${SKILL}:13: unresolved-name: tsh-missing-skill`));
});

test('an unresolved /command: unknown, or not a command', () => {
  const list = findings(withBody('\nRun `/tsh-nope`, then /tsh-reviewing-code, then /tsh-review.\n')(sourceFiles()));
  assert.deepEqual(rules(list), ['unresolved-command|/tsh-nope', 'unresolved-command|/tsh-reviewing-code']);
});

test('path segments are names, not commands', () => {
  assert.deepEqual(findings(withBody('\nSee skills/tsh-review and @tsh-code-reviewer.\n')(sourceFiles())), []);
});

test('a broken relative link inside a skill', () => {
  const list = findings(withBody('\nSee [a](references/missing.md), [b](references/checklist.md#top), [c](https://x.y/z).\n')(sourceFiles()));
  assert.deepEqual(rules(list), ['broken-link|references/missing.md']);
});

test('a ../ link out of the skill is an error and cannot be baselined', () => {
  const files = withBody('\nSee [x](../tsh-review/SKILL.md).\n')(sourceFiles());
  assert.deepEqual(rules(findings(files)), ['link-outside-skill|../tsh-review/SKILL.md']);
  const baseline = `${JSON.stringify({ rule: 'link-outside-skill', file: SKILL, key: '../tsh-review/SKILL.md', count: 1 })}\n`;
  assert.equal(checkRefs(makeRoot({ ...files, [BASELINE]: baseline })).code, 1);
});

test('a relative link from an agent or partial is outside any skill', () => {
  const files = sourceFiles({ 'src/partials/caller-status-handling.md': 'See [x](notes.md).\n' });
  assert.deepEqual(rules(findings(files)), ['link-outside-skill|notes.md']);
});

test('an unresolved routes-to target', () => {
  const files = sourceFiles();
  files['src/skills/tsh-review/SKILL.md'] = withFrontmatter(files, 'src/skills/tsh-review/SKILL.md', { 'routes-to': 'tsh-ghost' });
  const list = findings(files);
  assert.ok(rules(list).includes('unresolved-routes-to|tsh-ghost'));
});

test('placeholder forms are allowlisted', () => {
  const body = '\nName it `tsh-<name>` or tsh-…; files like tsh-*; prefixes tsh-cursor- and tsh-copilot-;'
    + ' examples tsh-my-skill and tsh-example-agent.\n';
  assert.deepEqual(findings(withBody(body)(sourceFiles())), []);
});

test('tokens in fenced code are skipped only in assets/*.template.* files', () => {
  const fenced = '# T\n\n```\ntsh-anything-else\n```\n';
  assert.deepEqual(findings(sourceFiles({ 'src/skills/tsh-reviewing-code/assets/report.template.md': fenced })), []);
  const list = findings(sourceFiles({ 'src/skills/tsh-reviewing-code/references/checklist.md': fenced }));
  assert.deepEqual(rules(list), ['unresolved-name|tsh-anything-else']);
});

test('scope B is off by default and enabled with docs', () => {
  const root = makeRoot(sourceFiles({ 'README.md': 'Use tsh-ghost.\n', 'website/docs/intro.md': 'Run /tsh-ghost-command.\n' }));
  assert.equal(checkRefs(root).code, 0);
  const { code, lines } = checkRefs(root, { docs: true });
  assert.equal(code, 1);
  assert.ok(lines.includes('error: README.md:1: unresolved-name: tsh-ghost'));
  assert.ok(lines.includes('error: website/docs/intro.md:1: unresolved-command: /tsh-ghost-command'));
});

test('scope B: the CHANGELOG migration table is allowlisted and only the latest entry is checked', () => {
  const changelog = [
    '# Changelog',
    '',
    '## 2.0.0',
    '',
    'Renamed `tsh-code-reviewing` to `tsh-reviewing-code`.',
    '',
    '<!-- migration-table -->',
    '',
    '| Old | New |',
    '|---|---|',
    '| tsh-code-reviewing | tsh-reviewing-code |',
    '| /tsh-review-codebase | /tsh-review |',
    '',
    'After the table tsh-old-again is checked.',
    '',
    '## 1.0.0',
    '',
    'Old tsh-legacy-name.',
    '',
  ].join('\n');
  const list = checkDocs(loadSource(makeRoot(sourceFiles({ 'CHANGELOG.md': changelog }))));
  assert.deepEqual(list.map((f) => `${f.line}|${f.key}`), ['5|tsh-code-reviewing', '14|tsh-old-again']);
});

test('a baselined finding is a warning; --update-baseline removes fixed entries', () => {
  const files = withBody('\nLoad tsh-nope.\n')(sourceFiles());
  const entry = (key) => JSON.stringify({ rule: 'unresolved-name', file: SKILL, key, count: 1 });
  const root = makeRoot({ ...files, [BASELINE]: `${entry('tsh-nope')}\n${entry('tsh-fixed')}\n` });
  assert.equal(checkRefs(root).code, 1, 'the stale tsh-fixed entry fails');
  assert.equal(checkRefs(root, { updateBaseline: true }).code, 0);
  assert.equal(readFileSync(join(root, BASELINE), 'utf8'), `${entry('tsh-nope')}\n`);
  const { code, lines } = checkRefs(root);
  assert.equal(code, 0);
  assert.ok(lines.some((l) => l.startsWith('warning:') && l.includes('tsh-nope (baselined)')));
});

test('--write-baseline records unresolved names and the result then passes', () => {
  const root = makeRoot(withBody('\nLoad tsh-nope.\n')(sourceFiles()));
  assert.equal(checkRefs(root).code, 1);
  assert.equal(checkRefs(root, { writeBaseline: true }).code, 0);
  assert.ok(readFileSync(join(root, BASELINE), 'utf8').includes('tsh-nope'));
  assert.equal(checkRefs(root).code, 0);
});

test('CLI: --docs and exit codes', () => {
  const root = makeRoot(sourceFiles({ 'AGENTS.md': 'See tsh-ghost.\n' }));
  const run = (...args) => spawnSync(process.execPath, [join(REPO_ROOT, 'scripts/check-refs.mjs'), '--root', root, ...args], { encoding: 'utf8' });
  assert.equal(run().status, 0);
  const docs = run('--docs');
  assert.equal(docs.status, 1);
  assert.match(docs.stdout, /AGENTS\.md:1: unresolved-name: tsh-ghost/);
});
