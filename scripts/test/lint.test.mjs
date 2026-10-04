import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadSource } from '../lib/load-source.mjs';
import { lint, lintModel } from '../lint.mjs';
import { REPO_ROOT, doc, makeRoot, sourceFiles, withFrontmatter, writeFiles } from './helpers.mjs';

const SKILL = 'src/skills/tsh-reviewing-code/SKILL.md';
const AGENT = 'src/agents/tsh-code-reviewer.md';
const BASELINE = 'scripts/baseline/lint.jsonl';

const findingsFor = (files) => lintModel(loadSource(makeRoot(files))).findings;
const withBody = (rel, body, changes = {}) => (files) => ({ ...files, [rel]: withFrontmatter(files, rel, changes, body) });
const edit = (rel, changes) => (files) => ({ ...files, [rel]: withFrontmatter(files, rel, changes) });
const add = (extra) => (files) => ({ ...files, ...extra });
const lines = (n, first = '# Long') => `${[first, ...Array.from({ length: n }, (_, i) => `line ${i}`)].join('\n')}\n`;
const skill = (name, type, extra = {}, body = '\nBody.\n') => ({
  [`src/skills/${name}/SKILL.md`]: doc({ name, description: 'Does things. Use when needed.', type,
    metadata: { 'short-description': 'Short' }, ...extra }, body),
});

test('the clean fixture has no lint findings', () => {
  assert.deepEqual(findingsFor(sourceFiles()), []);
  const { code } = lint(makeRoot(sourceFiles()));
  assert.equal(code, 0);
});

// [rule, violating change, clean change (or null when the base fixture is the clean case)]
const cases = [
  ['schema', edit(SKILL, { tools: ['x'] }), null],
  ['name-collision', add(skill('tsh-ui-reviewer', 'orchestrator', {}, '\n<!-- include: caller-status-handling -->\n')), null],
  ['skill-layout', add({ 'src/skills/tsh-reviewing-code/examples/a.md': 'x\n' }),
    add({ 'src/skills/tsh-reviewing-code/scripts/a.sh': 'x\n' })],
  ['no-dot-tool-dirs', add({ 'src/skills/tsh-reviewing-code/references/.claude/a.md': 'x\n' }),
    add({ 'src/skills/tsh-reviewing-code/references/claude/a.md': 'x\n' })],
  ['naming-by-type', add(skill('tsh-code-helper', 'skill')), add(skill('tsh-helping-code', 'skill'))],
  ['naming-by-type', add(skill('tsh-reviewing-stuff', 'internal')), add(skill('tsh-review-stuff', 'internal'))],
  ['max-lines', withBody(SKILL, lines(500)), withBody(SKILL, lines(480))],
  ['reference-toc', add({ 'src/skills/tsh-reviewing-code/references/long.md': lines(120) }),
    add({ 'src/skills/tsh-reviewing-code/references/long.md': `# Long\n\n## Contents\n\n- a\n\n## A\n${lines(120, '')}` })],
  ['description-trigger', edit(SKILL, { description: 'Reviews code changes.' }), null],
  ['no-path-refs', withBody(SKILL, '\nLoad [x](../tsh-other/SKILL.md).\n'), withBody(SKILL, '\nLoad [x](references/checklist.md).\n')],
  ['no-path-refs', withBody(SKILL, '\nRead `.cursor/skills/workflows/tsh-x/SKILL.md`.\n'), null],
  ['no-path-refs', withBody(SKILL, '\nUse read_file on references/deep/x.md.\n'), null],
  ['no-path-refs', withBody(AGENT, '\nSee [a](notes.md). tsh-reviewing-code\n<!-- include: agent-modes -->\n'), null],
  ['no-tool-syntax', withBody(SKILL, '\nAsk @tsh-architect in Dev Mode.\n'),
    add(skill('tsh-creating-skills', 'skill', {}, '\nExplain @tsh-architect and GPT-5.\n'))],
  ['agent-no-delegation', withBody(AGENT, '\nFollow tsh-reviewing-code, then delegate to someone.\n<!-- include: agent-modes -->\n'),
    (files) => ({ ...files, 'src/partials/agent-modes.md': 'A subagent may spawn nothing; delegate to nobody.\n' })],
  ['agent-no-delegation', withBody('src/agents/tsh-ui-reviewer.md', '\nSpawns subagents.\n<!-- include: agent-modes -->\n'),
    add({ 'src/agents/tsh-prompt-engineer.md': doc({ name: 'tsh-prompt-engineer', description: 'Writes prompts. Use when prompting.',
      type: 'agent', 'model-tier': 'deep', access: 'read-write' }, '\nExplains subagents and how to delegate to them.\n<!-- include: agent-modes -->\n') })],
  ['agent-contract', withBody(AGENT, '\nFollow `tsh-reviewing-code`.\n'), null],
  ['caller-status-handling', withBody('src/skills/tsh-review/SKILL.md', '\nRoute to `tsh-code-reviewer`.\n'),
    withBody('src/skills/tsh-commit/SKILL.md', '\nNo include needed for a standalone command.\n')],
  ['caller-status-handling', withBody('src/skills/tsh-engineering-manager/SKILL.md', '\nOrchestrate.\n'), null],
  ['short-description', edit(SKILL, { metadata: undefined }), null],
  ['short-description', edit(SKILL, { metadata: { 'short-description': 'x'.repeat(121) } }),
    edit(SKILL, { metadata: { 'short-description': 'x'.repeat(120) } })],
  ['listing-budget', (files) => {
    const extra = {};
    for (let i = 0; i < 51; i += 1) Object.assign(extra, skill(`tsh-testing-${i}`, 'skill', { metadata: { 'short-description': 'x'.repeat(120) } }));
    return { ...files, ...extra };
  }, (files) => {
    const extra = {};
    for (let i = 0; i < 49; i += 1) Object.assign(extra, skill(`tsh-testing-${i}`, 'skill', { metadata: { 'short-description': 'x'.repeat(120) } }));
    return { ...files, ...extra };
  }],
  ['preload-mentioned', withBody(AGENT, '\nReview things.\n<!-- include: agent-modes -->\n'), null],
  ['connected-skills-heading', withBody(SKILL, '\n## Related Skills\n\n- none\n'), withBody(SKILL, '\n## Connected skills\n\n- none\n')],
];

for (const [rule, violate, clean] of cases) {
  test(`lint rule ${rule}: violating fixture is flagged, clean fixture is not`, () => {
    const bad = findingsFor(violate(sourceFiles()));
    assert.ok(bad.some((f) => f.rule === rule), `${rule} expected in ${JSON.stringify(bad)}`);
    const good = findingsFor((clean ?? ((f) => f))(sourceFiles()));
    assert.deepEqual(good.filter((f) => f.rule === rule), []);
  });
}

test('description-length is a warning only (exit 0)', () => {
  const root = makeRoot(edit(SKILL, { description: `${'x'.repeat(520)} Use when long.` })(sourceFiles()));
  const { code, lines: out } = lint(root);
  assert.equal(code, 0);
  assert.ok(out.some((l) => l.startsWith('warning:') && l.includes('description-length')), out.join('\n'));
});

// Baseline behavior (M5, N5, m7).
const VIOLATION = '\nAsk @tsh-architect, then @tsh-architect again, in Dev Mode.\n';
const entry = (key, count, file = SKILL) => JSON.stringify({ rule: 'no-tool-syntax', file, key, count });
const rootWith = (body, baseline) => makeRoot({ ...withBody(SKILL, body)(sourceFiles()), [BASELINE]: baseline });

test('a non-baselined finding exits 1', () => {
  const { code, lines: out } = lint(makeRoot(withBody(SKILL, VIOLATION)(sourceFiles())));
  assert.equal(code, 1);
  assert.ok(out.includes(`error: ${SKILL}:13: no-tool-syntax: @tsh- (x2)`), out.join('\n'));
});

test('a baselined finding prints a warning and exits 0; identical matches collapse into one counted entry', () => {
  const { code, lines: out } = lint(rootWith(VIOLATION, `${entry('@tsh-', 2)}\n${entry('Dev Mode', 1)}\n`));
  assert.equal(code, 0, out.join('\n'));
  assert.ok(out.some((l) => l.startsWith('warning:') && l.includes('@tsh- (x2) (baselined)')));
});

test('a stale baseline entry exits 1', () => {
  const { code, lines: out } = lint(rootWith(VIOLATION, `${entry('@tsh-', 2)}\n${entry('Dev Mode', 1)}\n${entry('Gemini', 1)}\n`));
  assert.equal(code, 1);
  assert.ok(out.some((l) => l.startsWith('error: stale baseline entry') && l.includes('Gemini')));
});

test('a count above the baseline exits 1', () => {
  const { code, lines: out } = lint(rootWith(VIOLATION, `${entry('@tsh-', 1)}\n${entry('Dev Mode', 1)}\n`));
  assert.equal(code, 1);
  assert.ok(out.some((l) => l.includes('count 2 exceeds baseline 1')));
});

test('a count below the baseline exits 1 with "baseline can shrink"', () => {
  const { code, lines: out } = lint(rootWith(VIOLATION, `${entry('@tsh-', 3)}\n${entry('Dev Mode', 1)}\n`));
  assert.equal(code, 1);
  assert.ok(out.some((l) => l.includes('baseline can shrink from 3 to 2')));
});

test('--update-baseline lowers counts and removes stale entries, but never adds or raises', () => {
  const root = rootWith(`${VIOLATION}Also Gemini.\n`, `${entry('@tsh-', 3)}\n${entry('Claude Opus', 1)}\n${entry('Dev Mode', 1)}\n`);
  const { code, lines: out } = lint(root, { updateBaseline: true });
  assert.equal(code, 1, 'the new Gemini finding is still an error');
  assert.ok(out.some((l) => l.startsWith('error:') && l.includes('Gemini')));
  assert.equal(readFileSync(join(root, BASELINE), 'utf8'), `${entry('@tsh-', 2)}\n${entry('Dev Mode', 1)}\n`);
  // Once the new finding is fixed, the shrunk baseline passes.
  writeFiles(root, withBody(SKILL, VIOLATION)(sourceFiles()));
  assert.equal(lint(root).code, 0);
});

test('--write-baseline records content findings (creating the directory) and leaves structural findings as errors', () => {
  const files = withBody(SKILL, VIOLATION)(sourceFiles());
  const root = makeRoot(files);
  const { code } = lint(root, { writeBaseline: true });
  assert.equal(code, 0);
  assert.equal(readFileSync(join(root, BASELINE), 'utf8'), `${entry('@tsh-', 2)}\n${entry('Dev Mode', 1)}\n`);
  assert.equal(lint(root).code, 0);
  // A structural finding (schema) is never recorded and stays an error.
  const bad = makeRoot(edit(SKILL, { tools: ['x'] })(withBody(SKILL, VIOLATION)(sourceFiles())));
  assert.equal(lint(bad, { writeBaseline: true }).code, 1);
  assert.ok(!readFileSync(join(bad, BASELINE), 'utf8').includes('"schema"'));
});

test('inserting unrelated lines above a baselined finding keeps its entry valid (no line numbers in keys)', () => {
  const baseline = `${entry('@tsh-', 2)}\n${entry('Dev Mode', 1)}\n`;
  assert.equal(lint(rootWith(VIOLATION, baseline)).code, 0);
  assert.equal(lint(rootWith(`\n# Intro\n\nMore text.\n\nEven more.\n${VIOLATION}`, baseline)).code, 0);
});

test('structural rules cannot be baselined', () => {
  const files = edit(SKILL, { tools: ['x'] })(sourceFiles());
  const root = makeRoot({ ...files, [BASELINE]: `${JSON.stringify({ rule: 'schema', file: SKILL, key: 'tools', count: 1 })}\n` });
  const { code, lines: out } = lint(root);
  assert.equal(code, 1);
  assert.ok(out.some((l) => l.startsWith('error:') && l.includes('schema: tools')));
  assert.ok(out.some((l) => l.includes('rule "schema" cannot be baselined')));
});

test('CLI: exit code and --update-baseline flag', () => {
  const root = rootWith(VIOLATION, `${entry('@tsh-', 3)}\n${entry('Dev Mode', 1)}\n`);
  const run = (...args) => spawnSync(process.execPath, [join(REPO_ROOT, 'scripts/lint.mjs'), '--root', root, ...args], { encoding: 'utf8' });
  assert.equal(run().status, 1);
  assert.equal(run('--update-baseline').status, 0);
  assert.equal(run().status, 0);
});
