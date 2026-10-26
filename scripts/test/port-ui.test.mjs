// Group G3 (UI verification stack) tests over the real source tree. Hard-coded expected values.
// Covers tasks 4.1a, 4.1b, 4.2, 4.4 and 4.7. The assertions for the capture worker (4.3), the reviewer (4.5)
// and the orchestrate-ui-verification contract tokens (4.6) are added with those gated tasks.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadSource } from '../lib/load-source.mjs';
import { renderAgents } from '../lib/render-agents.mjs';
import { REPO_ROOT } from './helpers.mjs';

const model = loadSource(REPO_ROOT);
const rendered = renderAgents(model);
const read = (rel) => readFileSync(join(REPO_ROOT, rel), 'utf8');
const walk = (dir) =>
  readdirSync(join(REPO_ROOT, dir)).flatMap((e) => {
    const rel = `${dir}/${e}`;
    return statSync(join(REPO_ROOT, rel)).isDirectory() ? walk(rel) : [rel];
  });
const skill = (name) => model.skills.find((s) => s.name === name);
const count = (text, needle) => text.split(needle).length - 1;
const PW = 'src/skills/tsh-using-playwright-cli';
const PW_REFS = [
  'element-attributes.md', 'playwright-tests.md', 'request-mocking.md', 'running-code.md', 'session-management.md',
  'spec-driven-testing.md', 'storage-state.md', 'test-generation.md', 'tracing.md', 'video-recording.md',
];

test('tsh-using-playwright-cli: knowledge skill without MCP, at most 400 lines, no allowed-tools', () => {
  const s = skill('tsh-using-playwright-cli');
  assert.equal(s.data.type, 'skill');
  assert.equal(s.data['requires-mcp'], undefined);
  assert.equal(s.data['allowed-tools'], undefined);
  assert.match(s.data.description, /Use when/);
  assert.ok(s.data.metadata['short-description'].length <= 120);
  assert.ok(read(`${PW}/SKILL.md`).split('\n').length <= 401);
});

test('tsh-using-playwright-cli: exactly 10 references; Contents on the long ones only', () => {
  assert.deepEqual(readdirSync(join(REPO_ROOT, PW, 'references')).sort(), PW_REFS);
  const without = PW_REFS.filter((f) => !/^## Contents$/m.test(read(`${PW}/references/${f}`)));
  assert.deepEqual(without, ['element-attributes.md', 'playwright-tests.md', 'request-mocking.md']);
  for (const f of PW_REFS) {
    if (read(`${PW}/references/${f}`).split('\n').length > 100) {
      assert.match(read(`${PW}/references/${f}`), /^## Contents$/m, `${f} is over 100 lines without Contents`);
    }
  }
});

test('tsh-using-playwright-cli: four references forbid use during an authenticated capture', () => {
  const marked = PW_REFS.filter((f) => read(`${PW}/references/${f}`).includes('Not allowed during an authenticated capture.'));
  assert.deepEqual(marked, ['request-mocking.md', 'running-code.md', 'tracing.md', 'video-recording.md']);
  assert.match(read(`${PW}/SKILL.md`), /### Restricted use/);
});

test('tsh-using-playwright-cli: fixed snippets are versioned, single block, no env, network or require', () => {
  for (const name of ['stabilize', 'screenshot-fallback']) {
    const text = read(`${PW}/assets/${name}.snippet.md`);
    assert.equal(count(text, '```js'), 1);
    assert.equal(count(text, `// snippet: ${name} v1`), 1);
    assert.match(text, new RegExp('```js\\n// snippet: ' + name + ' v1\\n'));
    for (const banned of ['process.env', 'fetch', 'require']) assert.equal(count(text, banned), 0, `${name} contains ${banned}`);
  }
});

test('tsh-using-playwright-cli: mktemp -u appears only in never-lines and the auth section is a pointer', () => {
  for (const rel of walk(PW).filter((f) => f.endsWith('.md'))) {
    for (const line of read(rel).split('\n').filter((l) => l.includes('mktemp -u'))) {
      assert.match(line, /never/i, `${rel}: ${line}`);
    }
  }
  assert.doesNotMatch(read(`${PW}/SKILL.md`), /TSH_UI_LOGIN/);
  assert.match(read(`${PW}/SKILL.md`), /`tsh-verifying-ui` skill/);
});

test('tsh-verifying-ui: figma only, at most 500 lines, authenticated-capture is the single owner of the hardening list', () => {
  const s = skill('tsh-verifying-ui');
  assert.deepEqual(s.data['requires-mcp'], ['figma']);
  assert.ok(read('src/skills/tsh-verifying-ui/SKILL.md').split('\n').length <= 500);
  const auth = read('src/skills/tsh-verifying-ui/references/authenticated-capture.md');
  for (const token of ['printenv', 'form action', 'chmod 600', 'check-ignore', 'AUTH_FIELDS', 'TSH_UI_LOGIN_EMAIL', 'NEEDS_INPUT']) {
    assert.ok(auth.includes(token), `authenticated-capture.md lacks ${token}`);
  }
  for (const letter of ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)']) assert.ok(auth.includes(letter), letter);
  assert.match(auth, /^## Contents$/m);
});

test('TSH_UI_LOGIN is confined to the authenticated-capture reference and the capture worker', () => {
  const holders = walk('src').filter((f) => /\.(md|json)$/.test(f) && read(f).includes('TSH_UI_LOGIN'));
  const allowed = ['src/agents/tsh-ui-capture-worker.md', 'src/skills/tsh-verifying-ui/references/authenticated-capture.md'];
  assert.ok(holders.includes(allowed[1]));
  for (const f of holders) assert.ok(allowed.includes(f), `${f} must not mention TSH_UI_LOGIN`);
});

test('no instruction to read a .env file: every .env line in the UI skills and agents says never', () => {
  const files = [...walk('src/skills/tsh-verifying-ui'), ...walk(PW), 'src/agents/tsh-ui-engineer.md'].filter((f) => f.endsWith('.md'));
  for (const f of files) {
    for (const line of read(f).split('\n').filter((l) => l.includes('.env'))) assert.match(line, /never/i, `${f}: ${line}`);
  }
});

test('tsh-verifying-ui: report template carries the Figma node, the artifact and the blocker sections', () => {
  const t = read('src/skills/tsh-verifying-ui/assets/ui-verification-report.template.md');
  for (const part of [
    'Figma node id / version', 'VERIFICATION NOT RUN', '### Sources', '### Artifact Directory', '### Artifact Status',
    '### Clarification Needed', '### Blocker Resolution', 'Re-verify After Fix',
  ]) assert.ok(t.includes(part), `template lacks ${part}`);
  const body = read('src/skills/tsh-verifying-ui/SKILL.md');
  for (const part of ['ITERATION_DIR', 'VERIFICATION NOT RUN', 'PASS Gate (strict)', 'Second-failure stop rule', '`..` segment']) {
    assert.ok(body.includes(part), `SKILL.md lacks ${part}`);
  }
});

test('tsh-ui-engineer: frontmatter and rendered Claude output', () => {
  const a = model.agents.find((x) => x.name === 'tsh-ui-engineer');
  assert.equal(a.data['model-tier'], 'balanced');
  assert.equal(a.data.access, 'read-write');
  assert.equal(a.data.shell, true);
  assert.deepEqual(a.data['requires-mcp'], ['context7', 'figma', 'sequential-thinking']);
  assert.deepEqual(a.data['preload-skills'], ['tsh-implement-task', 'tsh-implementing-frontend']);
  const claude = rendered.get('.claude/agents/tsh-ui-engineer.md');
  assert.match(claude, /^model: sonnet$/m);
  assert.match(claude, /disallowedTools:\n {2}- Agent\n/);
  assert.equal(count(claude, '## Human Approval Precondition'), 1);
});

test('tsh-ui-engineer: Figma gate, clean-build rule and no capture or review loop text', () => {
  const body = model.agents.find((x) => x.name === 'tsh-ui-engineer').body;
  for (const part of ['Figma before code (hard gate)', 'A clean build is never UI verification', '`PRIOR_OUTPUT`', 'ALL differences', 'never open figma.com']) {
    assert.ok(body.toLowerCase().includes(part.toLowerCase()), `engineer lacks ${part}`);
  }
  for (const banned of ['tsh-ui-capture-worker', 'tsh-ui-reviewer', 'capture -> review', 'delegate to', 'spawn', 'subagent']) {
    assert.ok(!body.includes(banned), `engineer body contains ${banned}`);
  }
});

test('tsh-review-ui routes to the engineering manager in UI-only mode', () => {
  const s = skill('tsh-review-ui');
  assert.equal(s.data['routes-to'], 'tsh-engineering-manager');
  assert.equal(count(s.text, 'routes-to: tsh-engineering-manager'), 1);
  assert.match(s.data.description, /Routes to the engineering manager \(UI-only mode\)/);
  for (const token of ['UI_TASKS', 'FIGMA_URLS', 'DEV_SERVER_URL', 'UI_VERIFICATION_DIR', 'SINGLE_PASS: true', 'ITERATION_DIR', '<component-slug>/iteration-<n>/', 'VERIFICATION NOT RUN']) {
    assert.ok(s.body.includes(token), `tsh-review-ui lacks ${token}`);
  }
  assert.doesNotMatch(s.body, /tsh-ui-reviewer/);
});

test('tsh-implementing-frontend has Step 0 exactly once; tsh-using-mcp-servers points at the CLI skill', () => {
  const fe = skill('tsh-implementing-frontend').body;
  assert.equal(count(fe, '**Step 0: Fetch and review Figma design**'), 1);
  assert.equal(count(fe, '- [ ] Step 0: Fetch and review Figma design'), 1);
  const mcp = skill('tsh-using-mcp-servers');
  assert.ok(mcp.data['requires-mcp'].includes('playwright'));
  assert.ok(mcp.body.includes('`tsh-using-playwright-cli`'));
  const pw = read('src/skills/tsh-using-mcp-servers/references/playwright.md');
  assert.ok(pw.includes('Not used for Figma UI verification (see `tsh-using-playwright-cli` and `tsh-verifying-ui`).'));
});

test('traps: no literal old skills path and no removed names in the UI stack', () => {
  const files = [
    ...walk(PW), ...walk('src/skills/tsh-verifying-ui'), ...walk('src/skills/tsh-review-ui'),
    ...walk('src/skills/tsh-implementing-frontend'), ...walk('src/skills/tsh-using-mcp-servers'), 'src/agents/tsh-ui-engineer.md',
  ].filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const text = read(f);
    assert.ok(!text.includes('.cursor/skills/'), `${f} contains the old skills path`);
    for (const removed of ['tsh-resolving-skill-references', 'tsh-orchestrating-implementation', 'tsh-creating-implementation-plans']) {
      assert.ok(!text.includes(removed), `${f} contains ${removed}`);
    }
  }
});
