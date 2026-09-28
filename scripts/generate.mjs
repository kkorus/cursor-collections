#!/usr/bin/env node
// Generates the native Cursor / Claude Code / Codex outputs from src/.
// Usage: node scripts/generate.mjs [--check] [--root <dir>]
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadSource } from './lib/load-source.mjs';
import { renderAgents } from './lib/render-agents.mjs';
import { MCP_OUTPUTS, renderMcp } from './lib/render-mcp.mjs';
import { renderSkills } from './lib/render-skills.mjs';
import { SKILL_TYPES, validateModel } from './lib/schema.mjs';
import { checkOutputs, writeOutputs } from './lib/write-or-check.mjs';

export const REPO_ROOT = resolve(import.meta.dirname, '..');

/**
 * The MCP files become owned only once src/mcp/servers.json exists, so a model without it never
 * deletes or checks the hand-maintained .cursor/mcp.json.
 */
export function ownedGlobs(model) {
  if (!model.targets) return [];
  return model.targets.owned.filter((glob) => model.mcp || !MCP_OUTPUTS.includes(glob));
}

export function renderAll(model) {
  return new Map([...renderSkills(model), ...renderAgents(model), ...renderMcp(model)]);
}

/** @returns {{ code: number, lines: string[] }} */
export function generate(root, { check = false } = {}) {
  const lines = [];
  let model;
  try {
    model = loadSource(root);
  } catch (err) {
    return { code: 1, lines: [`error: ${err.message}`] };
  }
  const errors = validateModel(model);
  if (errors.length) {
    return { code: 1, lines: errors.map((e) => `error: ${e.file}: ${e.key}: ${e.message}`) };
  }

  let outputs;
  try {
    outputs = renderAll(model);
  } catch (err) {
    return { code: 1, lines: [`error: ${err.message}`] };
  }
  const globs = ownedGlobs(model);
  let code = 0;
  if (check) {
    const { missing, changed, extra } = checkOutputs(root, outputs, globs);
    for (const rel of missing) lines.push(`missing: ${rel}`);
    for (const rel of changed) lines.push(`changed: ${rel}`);
    for (const rel of extra) lines.push(`extra:   ${rel}`);
    if (missing.length + changed.length + extra.length > 0) {
      code = 1;
      lines.push('Generated outputs are out of date. Run `npm run generate`.');
    } else {
      lines.push(`Generated outputs are up to date (${outputs.size} files).`);
    }
  } else {
    const { written, deleted } = writeOutputs(root, outputs, globs);
    for (const rel of written) lines.push(`wrote:   ${rel}`);
    for (const rel of deleted) lines.push(`deleted: ${rel}`);
    lines.push(`${outputs.size} files generated (${written.length} written, ${deleted.length} deleted).`);
  }
  lines.push(summary(model));
  return { code, lines };
}

function summary(model) {
  const perType = SKILL_TYPES.map((t) => `${t} ${model.skills.filter((s) => s.data.type === t).length}`);
  const servers = model.mcp ? Object.keys(model.mcp.servers).length : 0;
  return `skills: ${model.skills.length} (${perType.join(', ')}); agents: ${model.agents.length}; mcp servers: ${servers}`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { check: { type: 'boolean' }, root: { type: 'string' } } });
  const { code, lines } = generate(resolve(values.root ?? REPO_ROOT), { check: values.check });
  for (const line of lines) console.log(line);
  process.exitCode = code;
}
