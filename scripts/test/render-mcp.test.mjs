import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseToml } from 'smol-toml';
import { loadSource } from '../lib/load-source.mjs';
import { renderMcp } from '../lib/render-mcp.mjs';
import { makeRoot, sourceFiles } from './helpers.mjs';

const render = (files = sourceFiles()) => renderMcp(loadSource(makeRoot(files)));
const NAMES = ['context7', 'awslabs.aws-api-mcp-server', 'figma'];

test('no output has a top-level servers key', () => {
  const out = render();
  const cursor = JSON.parse(out.get('.cursor/mcp.json'));
  const claude = JSON.parse(out.get('.mcp.json'));
  const codex = parseToml(out.get('.codex/config.toml'));
  for (const config of [cursor, claude, codex]) assert.equal('servers' in config, false);
  assert.deepEqual(Object.keys(cursor), ['mcpServers']);
  assert.deepEqual(Object.keys(claude), ['mcpServers']);
  assert.deepEqual(Object.keys(codex), ['mcp_servers']);
});

test('Cursor: stdio -> command/args/env, http -> url; names preserved', () => {
  const { mcpServers } = JSON.parse(render().get('.cursor/mcp.json'));
  assert.deepEqual(Object.keys(mcpServers), NAMES);
  assert.deepEqual(mcpServers['awslabs.aws-api-mcp-server'], { command: 'uvx', args: ['x'], env: { LOG: 'ERROR' } });
  assert.deepEqual(mcpServers.figma, { url: 'https://mcp.figma.com/mcp' });
});

test('Claude: every entry has a type, and every http entry has type http', () => {
  const { mcpServers } = JSON.parse(render().get('.mcp.json'));
  assert.deepEqual(Object.keys(mcpServers), NAMES);
  assert.deepEqual(mcpServers.figma, { type: 'http', url: 'https://mcp.figma.com/mcp' });
  assert.equal(mcpServers.context7.type, 'stdio');
  for (const entry of Object.values(mcpServers)) assert.ok(['stdio', 'http'].includes(entry.type));
});

test('Codex: the TOML parses and contains every server with quoted dotted names', () => {
  const text = render().get('.codex/config.toml');
  assert.match(text, /^# Generated from src\/mcp\/servers.json/);
  assert.match(text, /\[mcp_servers\."awslabs\.aws-api-mcp-server"\]/);
  // smol-toml returns null-prototype objects; normalize them for deepEqual.
  const { mcp_servers: servers } = JSON.parse(JSON.stringify(parseToml(text)));
  assert.deepEqual(Object.keys(servers), NAMES);
  assert.deepEqual(servers.context7, { command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] });
  assert.deepEqual(servers['awslabs.aws-api-mcp-server'].env, { LOG: 'ERROR' });
  assert.deepEqual(servers.figma, { url: 'https://mcp.figma.com/mcp' });
});

test('no src/mcp/servers.json renders no MCP files', () => {
  assert.equal(render(sourceFiles({ 'src/mcp/servers.json': null })).size, 0);
});
