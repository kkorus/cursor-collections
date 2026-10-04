import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generate } from '../generate.mjs';
import { loadSource } from '../lib/load-source.mjs';
import { validateModel } from '../lib/schema.mjs';
import { TARGETS, doc, makeRoot, sourceFiles, withFrontmatter } from './helpers.mjs';

const SKILL = 'src/skills/tsh-reviewing-code/SKILL.md';
const COMMAND = 'src/skills/tsh-review/SKILL.md';
const INTERNAL = 'src/skills/tsh-implement-task/SKILL.md';
const AGENT = 'src/agents/tsh-code-reviewer.md';

function errorsFor(edit = (files) => files) {
  return validateModel(loadSource(makeRoot(edit(sourceFiles()))));
}

function edit(rel, changes) {
  return (files) => ({ ...files, [rel]: withFrontmatter(files, rel, changes) });
}

test('the clean fixture has no schema errors', () => {
  assert.deepEqual(errorsFor(), []);
});

test('src/config/targets.json matches plan D1', () => {
  assert.deepEqual(Object.keys(TARGETS.modelTiers), ['deep', 'balanced', 'fast', 'inherit']);
  assert.deepEqual(TARGETS.modelTiers.balanced, { cursor: null, claude: 'sonnet', codex: { model: 'gpt-5.4', model_reasoning_effort: 'medium' } });
  assert.deepEqual(TARGETS.modelTiers.fast, { cursor: null, claude: 'haiku', codex: { model: 'gpt-5.4-mini' } });
  assert.equal(TARGETS.owned.length, 8);
  assert.ok(TARGETS.owned.includes('.cursor/mcp.json'));
});

const failing = [
  ['required: skill description', edit(SKILL, { description: undefined }), SKILL, 'description'],
  ['required: skill type', edit(SKILL, { type: undefined }), SKILL, 'type'],
  ['required: agent model-tier', edit(AGENT, { 'model-tier': undefined }), AGENT, 'model-tier'],
  ['required: agent access', edit(AGENT, { access: undefined }), AGENT, 'access'],
  ['name regex', (f) => ({ ...f, 'src/skills/tsh-Bad_Name/SKILL.md': doc({ name: 'tsh-Bad_Name', description: 'x', type: 'skill' }) }),
    'src/skills/tsh-Bad_Name/SKILL.md', 'name'],
  ['name length', (f) => {
    const name = `tsh-${'a'.repeat(61)}`;
    return { ...f, [`src/skills/${name}/SKILL.md`]: doc({ name, description: 'x', type: 'skill' }) };
  }, `src/skills/tsh-${'a'.repeat(61)}/SKILL.md`, 'name'],
  ['name equals folder name', edit(SKILL, { name: 'tsh-other-name' }), SKILL, 'name'],
  ['name equals agent file name', edit(AGENT, { name: 'tsh-other-agent' }), AGENT, 'name'],
  ['type enum (skill)', edit(SKILL, { type: 'workflow' }), SKILL, 'type'],
  ['type enum (agent)', edit(AGENT, { type: 'skill' }), AGENT, 'type'],
  ['routes-to required on commands', edit(COMMAND, { 'routes-to': undefined }), COMMAND, 'routes-to'],
  ['routes-to must exist', edit(COMMAND, { 'routes-to': 'tsh-nobody' }), COMMAND, 'routes-to'],
  ['routes-to must be an agent or orchestrator', edit(COMMAND, { 'routes-to': 'tsh-reviewing-code' }), COMMAND, 'routes-to'],
  ['standalone must be boolean', edit(COMMAND, { standalone: 'yes' }), COMMAND, 'standalone'],
  ['argument-hint only on commands', edit(SKILL, { 'argument-hint': '<x>' }), SKILL, 'argument-hint'],
  ['routes-to only on commands', edit(INTERNAL, { 'routes-to': 'tsh-code-reviewer' }), INTERNAL, 'routes-to'],
  ['standalone only on commands', edit(SKILL, { standalone: true }), SKILL, 'standalone'],
  ['paths only on type skill', edit(COMMAND, { paths: ['**/*.md'] }), COMMAND, 'paths'],
  ['requires-mcp must exist (skill)', edit(SKILL, { 'requires-mcp': ['jira'] }), SKILL, 'requires-mcp'],
  ['requires-mcp must exist (agent)', edit(AGENT, { 'requires-mcp': ['jira'] }), AGENT, 'requires-mcp'],
  ['preload-skills at most 2', edit(AGENT, { 'preload-skills': ['tsh-reviewing-code', 'tsh-implement-task', 'tsh-engineering-manager'] }), AGENT, 'preload-skills'],
  ['preload-skills must exist', edit(AGENT, { 'preload-skills': ['tsh-missing'] }), AGENT, 'preload-skills'],
  ['preload-skills cannot be a command', edit(AGENT, { 'preload-skills': ['tsh-review'] }), AGENT, 'preload-skills'],
  ['model-tier enum', edit(AGENT, { 'model-tier': 'huge' }), AGENT, 'model-tier'],
  ['access enum', edit(AGENT, { access: 'admin' }), AGENT, 'access'],
  ['unknown key (skill)', edit(SKILL, { 'disable-model-invocation': true }), SKILL, 'disable-model-invocation'],
  ['unknown key (agent)', edit(AGENT, { tools: ['read'] }), AGENT, 'tools'],
  ['targets must be an object', edit(SKILL, { targets: ['cursor'] }), SKILL, 'targets'],
  ['targets.<tool> must be an object', edit(AGENT, { targets: { claude: 'blue' } }), AGENT, 'targets.claude'],
  ['targets tool must be known', edit(AGENT, { targets: { copilot: {} } }), AGENT, 'targets.copilot'],
  ['mcp transport enum', (f) => ({ ...f, 'src/mcp/servers.json': { servers: { context7: { transport: 'sse', url: 'x' }, figma: { transport: 'http', url: 'y' } } } }),
    'src/mcp/servers.json', 'servers.context7.transport'],
  ['mcp stdio requires command', (f) => ({ ...f, 'src/mcp/servers.json': { servers: { context7: { transport: 'stdio' }, figma: { transport: 'http', url: 'y' } } } }),
    'src/mcp/servers.json', 'servers.context7.command'],
  ['mcp unknown server key', (f) => ({ ...f, 'src/mcp/servers.json': { servers: { context7: { transport: 'stdio', command: 'npx', type: 'stdio' }, figma: { transport: 'http', url: 'y' } } } }),
    'src/mcp/servers.json', 'servers.context7.type'],
];

for (const [title, change, file, key] of failing) {
  test(`schema rule fails: ${title}`, () => {
    const errors = errorsFor(change);
    assert.ok(errors.some((e) => e.file === file && e.key === key), `expected ${file} ${key} in ${JSON.stringify(errors)}`);
  });
}

const passing = [
  ['routes-to may name an orchestrator', edit(COMMAND, { 'routes-to': 'tsh-engineering-manager' })],
  ['standalone command needs no routes-to', edit(COMMAND, { 'routes-to': undefined, standalone: true })],
  ['optional keys on a skill', edit(SKILL, { license: 'MIT', targets: { cursor: { icon: 'x' }, claude: {} } })],
  ['preload-skills with 2 entries', edit(AGENT, { 'preload-skills': ['tsh-reviewing-code', 'tsh-implement-task'] })],
  ['every model tier and access value', edit(AGENT, { 'model-tier': 'inherit', access: 'read-only', shell: false })],
];

for (const [title, change] of passing) {
  test(`schema rule passes: ${title}`, () => {
    assert.deepEqual(errorsFor(change), []);
  });
}

test('a servers.json without a servers key gives a schema error, not a TypeError', () => {
  const errors = errorsFor((f) => ({ ...f, 'src/mcp/servers.json': {} }));
  assert.ok(errors.some((e) => e.file === 'src/mcp/servers.json' && e.key === 'servers'), JSON.stringify(errors));
});

test('error messages include the file path and the key name', () => {
  const root = makeRoot(edit(COMMAND, { 'routes-to': 'tsh-nobody' })(sourceFiles()));
  const { code, lines } = generate(root);
  assert.equal(code, 1);
  assert.ok(lines.some((l) => l.includes('src/skills/tsh-review/SKILL.md') && l.includes('routes-to')), lines.join('\n'));
});
