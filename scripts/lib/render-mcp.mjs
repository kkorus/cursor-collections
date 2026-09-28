// Renders src/mcp/servers.json into the three native MCP configs (plan D2). Server names are kept verbatim.
import { stringify as stringifyToml } from 'smol-toml';
import { generatedNote } from './format.mjs';

export const MCP_OUTPUTS = ['.cursor/mcp.json', '.mcp.json', '.codex/config.toml'];

/**
 * @param {import('./load-source.mjs').SourceModel} model
 * @returns {Map<string, string>} repo-relative output path -> content (empty without src/mcp/servers.json)
 */
export function renderMcp(model) {
  const out = new Map();
  if (!model.mcp) return out;
  const cursor = {};
  const claude = {};
  const codex = {};
  for (const [name, server] of Object.entries(model.mcp.servers)) {
    const native = nativeEntry(server);
    cursor[name] = native;
    claude[name] = { type: server.transport, ...native };
    codex[name] = native;
  }
  out.set('.cursor/mcp.json', toJson({ mcpServers: cursor }));
  out.set('.mcp.json', toJson({ mcpServers: claude }));
  out.set('.codex/config.toml', `# ${generatedNote(model.mcp.file)}\n\n${stringifyToml({ mcp_servers: codex })}`);
  return out;
}

function nativeEntry(server) {
  if (server.transport === 'http') return { url: server.url };
  const entry = { command: server.command };
  if (server.args) entry.args = server.args;
  if (server.env) entry.env = server.env;
  return entry;
}

function toJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
