// Cross-group contracts of the upstream port (plan Task S1.3). Hard-coded expectations.
// Source facts (includes, tiers, requires-mcp) come from loadSource; rendered text comes from the generated trees.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadSource } from '../lib/load-source.mjs';
import { REPO_ROOT } from './helpers.mjs';

const source = loadSource(REPO_ROOT);
const read = (rel) => readFileSync(join(REPO_ROOT, rel), 'utf8');
const walk = (dir) =>
  readdirSync(join(REPO_ROOT, dir)).flatMap((e) => {
    const rel = `${dir}/${e}`;
    return statSync(join(REPO_ROOT, rel)).isDirectory() ? walk(rel) : [rel];
  });
const count = (text, needle) => text.split(needle).length - 1;
const partial = (name) => read(`src/partials/${name}.md`).trim();
const agent = (name) => source.agents.find((a) => a.name === name);
const skill = (name) => source.skills.find((s) => s.name === name);
const AGENT_FILES = (name) => [`.cursor/agents/${name}.md`, `.claude/agents/${name}.md`, `.codex/agents/${name}.toml`];
const SKILL_TREES = ['.agents/skills', '.claude/skills'];
const srcMarkdown = () => walk('src').filter((f) => f.endsWith('.md'));
/** Rendered text of a whole skill directory (SKILL.md and support files) in one tree. */
const renderedSkill = (tree, name) => walk(`${tree}/${name}`).map(read).join('\n');

const ALL_AGENTS = [
  'tsh-ai-customization-creator', 'tsh-ai-customization-researcher', 'tsh-ai-customization-reviewer', 'tsh-architect',
  'tsh-ba-analysis-worker', 'tsh-ba-extraction-worker', 'tsh-ba-formatting-worker', 'tsh-ba-quality-worker',
  'tsh-ba-transcript-worker', 'tsh-code-reviewer', 'tsh-context-engineer', 'tsh-devops-engineer', 'tsh-e2e-engineer',
  'tsh-plan-implementor', 'tsh-plan-reviewer', 'tsh-prompt-engineer', 'tsh-software-engineer', 'tsh-technical-writer',
  'tsh-ui-capture-worker', 'tsh-ui-engineer', 'tsh-ui-reviewer',
];
const PRECONDITION_AGENTS = ['tsh-software-engineer', 'tsh-plan-implementor', 'tsh-ui-engineer', 'tsh-e2e-engineer',
  'tsh-devops-engineer', 'tsh-prompt-engineer', 'tsh-technical-writer'];
const VCS_AGENTS = ['tsh-software-engineer', 'tsh-plan-implementor'];

test('the source has exactly the 21 expected agents', () => {
  assert.deepEqual(source.agents.map((a) => a.name).sort(), [...ALL_AGENTS].sort());
});

// (a)
test('(a) exactly seven agents include and render the approval precondition, in all three targets', () => {
  const text = partial('human-approval-precondition');
  const included = source.agents.filter((a) => a.includes.includes('human-approval-precondition')).map((a) => a.name);
  assert.deepEqual(included.sort(), [...PRECONDITION_AGENTS].sort());
  for (const name of ALL_AGENTS) {
    const expected = PRECONDITION_AGENTS.includes(name) ? 1 : 0;
    for (const file of AGENT_FILES(name)) assert.equal(count(read(file), text), expected, file);
  }
});

// (b)
test('(b) version-control-safety is included and rendered in exactly software-engineer and plan-implementor', () => {
  const text = partial('version-control-safety');
  const included = source.agents.filter((a) => a.includes.includes('version-control-safety')).map((a) => a.name);
  assert.deepEqual(included.sort(), [...VCS_AGENTS].sort());
  for (const name of ALL_AGENTS) {
    const expected = VCS_AGENTS.includes(name) ? 1 : 0;
    for (const file of AGENT_FILES(name)) assert.equal(count(read(file), text), expected, file);
  }
});

// (c)
test('(c) tsh-implement and tsh-review-ui both route to the engineering manager', () => {
  for (const name of ['tsh-implement', 'tsh-review-ui']) {
    assert.equal(skill(name).data.type, 'command', name);
    assert.equal(skill(name).data['routes-to'], 'tsh-engineering-manager', name);
  }
});

// (d)
test('(d) the manager names the four new agents; task-routing names the three task executors', () => {
  const manager = read('src/skills/tsh-engineering-manager/SKILL.md');
  const routing = read('src/skills/tsh-engineering-manager/references/task-routing.md');
  for (const name of ['tsh-plan-implementor', 'tsh-technical-writer', 'tsh-ui-capture-worker', 'tsh-ui-engineer']) {
    assert.ok(manager.includes(name), `manager SKILL.md lacks ${name}`);
  }
  // The capture worker is dispatched by the UI verification loop, not by task routing.
  for (const name of ['tsh-plan-implementor', 'tsh-technical-writer', 'tsh-ui-engineer']) {
    assert.ok(routing.includes(name), `task-routing lacks ${name}`);
  }
});

test('(d) the UI loop tokens appear in the manager, the orchestrate skill and tsh-review-ui', () => {
  const texts = {
    manager: read('src/skills/tsh-engineering-manager/SKILL.md'),
    orchestrate: read('src/skills/tsh-orchestrate-ui-verification/SKILL.md'),
    review: read('src/skills/tsh-review-ui/SKILL.md'),
  };
  for (const token of ['SINGLE_PASS', 'UI_VERIFICATION_DIR', 'ITERATION_DIR', '<component-slug>']) {
    for (const [where, text] of Object.entries(texts)) assert.ok(text.includes(token), `${where} lacks ${token}`);
  }
});

// (e)
test('(e) the seam sentence and the material-change definition live only in plan-governance', () => {
  const seam = 'A task is an actionable low-risk seam when it lists its `Files`';
  const material = 'A revision of an approved plan is **material** when it:';
  for (const needle of [seam, material]) {
    const holders = srcMarkdown().filter((f) => read(f).includes(needle));
    assert.deepEqual(holders, ['src/partials/plan-governance.md'], needle);
  }
  assert.deepEqual(source.skills.filter((s) => s.includes.includes('plan-governance')).map((s) => s.name).sort(),
    ['tsh-designing-architecture', 'tsh-engineering-manager']);
  assert.deepEqual(source.agents.filter((a) => a.includes.includes('plan-governance')), []);
});

test('(e) both sentences render in exactly two skills in both skill trees', () => {
  const seam = 'A task is an actionable low-risk seam when it lists its `Files`';
  const material = 'A revision of an approved plan is **material** when it:';
  for (const tree of SKILL_TREES) {
    for (const needle of [seam, material]) {
      const holders = walk(tree).filter((f) => read(f).includes(needle));
      assert.deepEqual(holders, [`${tree}/tsh-designing-architecture/SKILL.md`, `${tree}/tsh-engineering-manager/SKILL.md`], `${tree}: ${needle}`);
      for (const f of holders) assert.equal(count(read(f), needle), 1, f);
    }
  }
});

// (f) Plan wording is haiku/sonnet/opus; the source uses tiers fast/balanced/deep, which targets.json maps to them.
test('(f) model tiers: source tier and rendered Claude model per agent', () => {
  const expected = {
    'tsh-ui-capture-worker': ['fast', 'haiku'],
    'tsh-plan-implementor': ['fast', 'haiku'],
    'tsh-technical-writer': ['fast', 'haiku'],
    'tsh-ui-engineer': ['balanced', 'sonnet'],
    'tsh-software-engineer': ['deep', 'opus'],
    'tsh-ui-reviewer': ['deep', 'opus'],
  };
  const targets = JSON.parse(read('src/config/targets.json'));
  for (const [name, [tier, model]] of Object.entries(expected)) {
    assert.equal(agent(name).data['model-tier'], tier, name);
    assert.equal(targets.modelTiers[tier].claude, model, `${tier} maps to ${model}`);
    assert.match(read(`.claude/agents/${name}.md`), new RegExp(`^model: ${model}$`, 'm'), name);
  }
});

// (g)
test('(g) TSH_UI_LOGIN appears in exactly two src files', () => {
  const holders = srcMarkdown().filter((f) => read(f).includes('TSH_UI_LOGIN'));
  assert.deepEqual(holders, ['src/agents/tsh-ui-capture-worker.md', 'src/skills/tsh-verifying-ui/references/authenticated-capture.md']);
});

test('(g) MCP: playwright only in the e2e agent; no figma in software-engineer or the capture worker', () => {
  const withPlaywright = source.agents.filter((a) => (a.data['requires-mcp'] ?? []).includes('playwright')).map((a) => a.name);
  assert.deepEqual(withPlaywright, ['tsh-e2e-engineer']);
  assert.deepEqual(agent('tsh-software-engineer').data['requires-mcp'], ['context7', 'sequential-thinking']);
  assert.equal(agent('tsh-ui-capture-worker').data['requires-mcp'], undefined);
  assert.deepEqual(agent('tsh-ui-reviewer').data['requires-mcp'], ['context7', 'figma', 'sequential-thinking']);
});

test('(g) the reviewer and the software engineer preload no playwright skill', () => {
  for (const name of ['tsh-ui-reviewer', 'tsh-software-engineer']) {
    for (const s of agent(name).data['preload-skills'] ?? []) assert.ok(!/playwright/.test(s), `${name} preloads ${s}`);
  }
});

// (h)
test('(h) no removed names, no literal .cursor/skills/ and no old discussion wording in src', () => {
  const removed = ['tsh-orchestrating-implementation', 'tsh-creating-implementation-plans', 'tsh-resolving-skill-references'];
  const all = walk('src').filter((f) => /\.(md|json)$/.test(f));
  for (const f of all) {
    const text = read(f);
    for (const name of removed) assert.ok(!text.includes(name), `${f} names removed ${name}`);
    assert.ok(!text.includes('.cursor/skills/'), `${f} contains .cursor/skills/`);
    assert.ok(!/new discussion|Implementation Discussion/.test(text), `${f} has old discussion wording`);
  }
  assert.ok(!existsSync(join(REPO_ROOT, 'src/skills/playwright-cli')));
  assert.ok(!existsSync(join(REPO_ROOT, 'src/skills/tsh-orchestrating-implementation')));
});

// (i)
test('(i) gate protocol: manager text has the labels and record_human_approval; architect text lacks the labels', () => {
  for (const tree of SKILL_TREES) {
    const manager = renderedSkill(tree, 'tsh-engineering-manager');
    for (const needle of ['`Approve plan`', '`I have comments`', '`Stop`', 'record_human_approval']) {
      assert.ok(manager.includes(needle), `${tree} manager lacks ${needle}`);
    }
  }
  for (const file of AGENT_FILES('tsh-architect')) {
    const architect = read(file);
    assert.ok(architect.includes('record_human_approval'), `${file} lacks record_human_approval`);
    assert.equal(count(architect, 'Approve plan'), 0, file);
    assert.equal(count(architect, 'I have comments'), 0, file);
  }
});

test('plan template ends with a newline and holds the dispatch gate and the approval table', () => {
  const template = read('src/skills/tsh-designing-architecture/assets/plan.template.md');
  assert.ok(template.endsWith('\n'));
  assert.equal(count(template, '<!-- Dispatch gate:'), 1);
  assert.equal(count(template, '## Human Approval'), 1);
});
