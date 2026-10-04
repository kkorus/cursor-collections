#!/usr/bin/env node
// One-off migration (plan Task 2.1): .cursor/skills/{agents,commands,internal,workflows} -> src/.
// Idempotent: the output is a pure function of the source tree, and unchanged files are not rewritten.
// With the source already removed, only the MCP source and legacy-names.json steps run (both idempotent).
// Usage: node scripts/migrate/migrate-structure.mjs [--root <dir>] [--source <dir>] [--dry-run]
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const HERE = import.meta.dirname;
const CATEGORIES = ['agents', 'commands', 'internal', 'workflows'];
const CATEGORY_TYPE = { commands: 'command', internal: 'internal', workflows: 'skill' };
const NAME = 'tsh-[a-z0-9]+(?:-[a-z0-9]+)*';

const readJson = (file) => JSON.parse(readFileSync(join(HERE, file), 'utf8'));

/**
 * @param {{ root: string, sourceDir?: string, dryRun?: boolean, log?: (line: string) => void }} options
 * @returns {{ created: number, updated: number, unchanged: number, warnings: string[], items: object[] }}
 */
export function migrate({ root, sourceDir = join(root, '.cursor', 'skills'), dryRun = false, log = () => {} }) {
  const renames = readJson('rename-map.json');
  const agentMeta = readJson('agent-metadata.json').agents;
  const skillMeta = readJson('skill-metadata.json');
  const warnings = [];
  const outputs = new Map(); // repo-relative path -> string | Buffer

  const items = scan(sourceDir, renames, skillMeta);
  const skillNames = new Set(items.filter((i) => i.kind !== 'agent').map((i) => i.newName));
  const rewriteNames = nameRewriter(renames);

  for (const item of items) {
    const isAgent = item.kind === 'agent';
    const skillFiles = planSupportFiles(item);
    const rewrite = (text, fromFile, toFile) => rewriteNames(rewritePathRefs(applyFileMap(text, skillFiles.map, fromFile, toFile)));
    const raw = readFileSync(join(item.dir, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
    const { data, body } = splitFrontmatter(rewrite(raw, 'SKILL.md', 'SKILL.md'),`${item.cat}/${item.oldName}`);

    const description = cleanDescription(String(data.description ?? ''));
    let frontmatter;
    if (isAgent) {
      const meta = agentMeta[item.newName];
      if (!meta) throw new Error(`agent-metadata.json has no entry for ${item.newName}`);
      frontmatter = agentFrontmatter(item.newName, description, meta, skillNames, warnings);
    } else {
      frontmatter = { name: item.newName, description, type: item.type };
      if (item.type === 'command') {
        if (skillMeta.standalone.includes(item.newName)) frontmatter.standalone = true;
        else if (skillMeta.commandRoutes[item.newName]) frontmatter['routes-to'] = skillMeta.commandRoutes[item.newName];
        else warnings.push(`${item.newName}: no routes-to in skill-metadata.json`);
      }
    }
    const newBody = item.kind === 'agent' || item.type === 'orchestrator' ? stripRecommended(body, item, warnings, agentMeta) : body;
    const target = isAgent ? `src/agents/${item.newName}.md` : `src/skills/${item.newName}/SKILL.md`;
    put(outputs, target, `---\n${stringifyYaml(frontmatter, { lineWidth: 0 })}---\n${newBody}`);
    item.target = target;

    for (const file of skillFiles.files) {
      const dest = `src/skills/${item.newName}/${file.to}`;
      const content = readFileSync(join(item.dir, file.from));
      put(outputs, dest, file.to.endsWith('.md') ? rewrite(content.toString('utf8').replace(/\r\n/g, '\n'), file.from, file.to) : content);
    }
  }

  convertMcp(root, outputs, log);
  put(outputs, 'scripts/legacy-names.json', legacyNames(renames, agentMeta, skillMeta));

  // Write (or only report) the files that differ from the current state.
  const stats = { created: 0, updated: 0, unchanged: 0, warnings, items };
  for (const [rel, content] of [...outputs].sort(([a], [b]) => a.localeCompare(b))) {
    const abs = join(root, rel);
    const next = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const action = !existsSync(abs) ? 'created' : readFileSync(abs).equals(next) ? 'unchanged' : 'updated';
    stats[action] += 1;
    if (action !== 'unchanged') {
      log(`${dryRun ? 'would write' : 'write'} ${action === 'created' ? 'new' : 'changed'} ${rel}`);
      if (!dryRun) {
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, next);
      }
    }
  }
  return stats;
}

/** Lists every artifact of the source tree with its old/new name, kind and neutral type. */
function scan(sourceDir, renames, skillMeta) {
  const items = [];
  if (!existsSync(sourceDir)) return items;
  const seen = new Map();
  for (const cat of CATEGORIES) {
    const catDir = join(sourceDir, cat);
    if (!existsSync(catDir)) continue;
    for (const oldName of readdirSync(catDir).sort()) {
      const dir = join(catDir, oldName);
      if (!statSync(dir).isDirectory() || !existsSync(join(dir, 'SKILL.md'))) continue;
      const newName = renames[oldName] ?? oldName;
      const orchestrator = cat === 'agents' && skillMeta.orchestrators.includes(oldName);
      const kind = cat === 'agents' && !orchestrator ? 'agent' : 'skill';
      const type = cat === 'agents' ? (orchestrator ? 'orchestrator' : 'agent') : CATEGORY_TYPE[cat];
      if (seen.has(newName)) throw new Error(`name collision: ${cat}/${oldName} and ${seen.get(newName)} both map to ${newName}`);
      seen.set(newName, `${cat}/${oldName}`);
      items.push({ cat, oldName, newName, dir, kind, type });
    }
  }
  return items;
}

/** Support-file layout (D7): root templates and examples -> assets/, examples/ -> references/. */
function planSupportFiles(item) {
  const files = [];
  const map = new Map(); // old relative path -> new relative path
  const used = new Map();
  for (const from of walk(item.dir, '')) {
    if (from === 'SKILL.md') continue;
    const to = supportTarget(from);
    if (!to) throw new Error(`${item.cat}/${item.oldName}/${from}: no layout rule (expected SKILL.md, references/, assets/, scripts/, examples/ or a root template/example)`);
    if (used.has(to)) throw new Error(`${item.cat}/${item.oldName}: ${from} and ${used.get(to)} both map to ${to}`);
    used.set(to, from);
    files.push({ from, to });
    if (from !== to) map.set(from, to);
  }
  return { files, map };
}

function supportTarget(rel) {
  if (/^(references|assets|scripts)\//.test(rel)) return rel;
  if (rel.startsWith('examples/')) return `references/${rel.slice('examples/'.length)}`;
  if (!rel.includes('/') && rel.endsWith('.template.md')) return `assets/${rel}`;
  if (!rel.includes('/') && rel.endsWith('.example.md')) return `assets/${rel.replace(/\.example\.md$/, '.template.md')}`;
  return null;
}

function walk(abs, rel) {
  return readdirSync(join(abs, rel)).sort().flatMap((entry) => {
    const childRel = rel ? `${rel}/${entry}` : entry;
    return statSync(join(abs, childRel)).isDirectory() ? walk(abs, childRel) : [childRel];
  });
}

/**
 * Rewrites references to moved support files (`plan.example.md`, `examples/x.md`, `examples/`).
 * Links are relative to the file that contains them, so each one is resolved from the old location of that
 * file and re-expressed from its new location.
 */
function applyFileMap(text, map, fromFile, toFile) {
  let out = text;
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rel = (fromDir, target) => posix.relative(fromDir, target);
  for (const [from, to] of [...map].sort(([a], [b]) => b.length - a.length)) {
    const oldLink = rel(posix.dirname(fromFile), from);
    const newLink = rel(posix.dirname(toFile), to);
    out = out.replace(new RegExp(`(?<![\\w./-])(?:\\./)?${escape(oldLink)}(?![\\w-])`, 'g'), newLink);
  }
  if (fromFile === 'SKILL.md' && [...map.keys()].some((k) => k.startsWith('examples/'))) {
    out = out.replace(/(?<![\w./-])examples\//g, 'references/');
  }
  return out;
}

/** One pass over the rename map, so renamed names never chain (M5 step 2). */
function nameRewriter(renames) {
  const keys = Object.keys(renames).sort((a, b) => b.length - a.length);
  const re = new RegExp(`(?<![A-Za-z0-9_-])(${keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z0-9_-])`, 'g');
  return (text) => text.replace(re, (name) => renames[name]);
}

/** Path references become skill-name references (M5). Old names are still in place; renaming follows. */
function rewritePathRefs(text) {
  const SKILL_PATH = `(?:\\.cursor/skills/|(?:\\.\\./)+)?(?:(?:agents|commands|internal|workflows)/)?(${NAME})/SKILL\\.md`;
  return text
    // [label](path/to/<name>/SKILL.md) -> the `name` skill
    .replace(new RegExp(`\\[([^\\]]*)\\]\\(${SKILL_PATH}\\)`, 'g'), (_, label, name) => {
      const plain = label.replace(/`/g, '').replace(/\/SKILL\.md$/, '').trim();
      return plain.includes(name) ? `the \`${name}\` skill` : `${label} (the \`${name}\` skill)`;
    })
    // [label](../<name>/references/<file>) -> the <file> reference of the `name` skill
    .replace(new RegExp(`\\[([^\\]]*)\\]\\((?:\\.\\./)+(${NAME})/(references|assets)/([\\w.-]+)\\)`, 'g'), (_, label, name, dir, file) => {
      if (file === 'react-patterns.md') return `the React patterns reference of the \`${name}\` skill`;
      return `the \`${file}\` ${dir === 'assets' ? 'template' : 'reference'} of the \`${name}\` skill`;
    })
    // at `.cursor/skills/<cat>/<name>/SKILL.md` -> the `name` skill
    .replace(new RegExp(`\\bat \`${SKILL_PATH}\``, 'g'), (_, name) => `the \`${name}\` skill`)
    .replace(new RegExp(`\`${SKILL_PATH}\``, 'g'), (_, name) => `the \`${name}\` skill`);
}

/** AG-X3, CI-CC12: strip "Invoke with @...", "Not user-invokable." and "Internal skill used by ...". */
function cleanDescription(description) {
  return description
    .replace(/\s*Invoke with @[\w-]+\.?/g, '')
    .replace(/\s*Not user-invokable\.?/g, '')
    .replace(/\s*Internal skill used by [^.]*\./g, '')
    .trim();
}

function agentFrontmatter(name, description, meta, skillNames, warnings) {
  const fm = { name, description, type: 'agent', 'model-tier': meta['model-tier'], access: meta.access };
  if (meta.shell === false) fm.shell = false;
  if (meta['requires-mcp']?.length) fm['requires-mcp'] = meta['requires-mcp'];
  const preload = meta['preload-skills'] ?? [];
  const existing = preload.filter((s) => skillNames.has(s));
  for (const s of preload.filter((n) => !skillNames.has(n))) {
    warnings.push(`${name}: preload-skills "${s}" does not exist yet (Phase 3); not emitted`);
  }
  if (existing.length) fm['preload-skills'] = existing;
  if (meta.targets) fm.targets = meta.targets;
  return fm;
}

const TIER_BY_MODEL = { 'GPT-5.4': 'deep', 'Gemini 3.1 Pro (Preview)': 'deep', 'Claude Sonnet 4.6': 'balanced', 'GPT-5.4 mini': 'fast' };

/** Removes the "> Recommended model/tools" blockquotes; notes any mismatch with the metadata table. */
function stripRecommended(body, item, warnings, agentMeta) {
  const match = /^> Recommended model:\s*([^\n]*)\n(?:> Recommended tools:[^\n]*\n)?(?:[ \t]*\n)*/m.exec(body);
  if (!match) {
    warnings.push(`${item.newName}: no "> Recommended model" blockquote found`);
    return body;
  }
  const tier = TIER_BY_MODEL[match[1].trim()];
  const meta = agentMeta[item.newName];
  if (meta && tier && tier !== meta['model-tier']) {
    warnings.push(`${item.newName}: blockquote model "${match[1].trim()}" maps to ${tier}, metadata table says ${meta['model-tier']} (table wins)`);
  }
  return body.slice(0, match.index) + body.slice(match.index + match[0].length);
}

function splitFrontmatter(text, label) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) throw new Error(`${label}: frontmatter missing`);
  return { data: parseYaml(match[1]) ?? {}, body: text.slice(match[0].length) };
}

/** Task 2.3: .cursor/mcp.json (`servers`) -> src/mcp/servers.json with a transport per entry. */
function convertMcp(root, outputs, log) {
  const target = join(root, 'src', 'mcp', 'servers.json');
  const source = join(root, '.cursor', 'mcp.json');
  if (existsSync(target) || !existsSync(source)) return;
  const json = JSON.parse(readFileSync(source, 'utf8'));
  const servers = json.servers ?? json.mcpServers;
  if (!servers) throw new Error('.cursor/mcp.json: neither "servers" nor "mcpServers" key found');
  const out = {};
  for (const [name, server] of Object.entries(servers)) {
    const transport = server.command ? 'stdio' : server.url ? 'http' : null;
    if (!transport) throw new Error(`.cursor/mcp.json: server "${name}" has neither command nor url`);
    if (server.type && server.type !== transport) throw new Error(`.cursor/mcp.json: server "${name}" type ${server.type} does not match its ${transport} fields`);
    out[name] = transport === 'stdio'
      ? { transport, command: server.command, ...(server.args && { args: server.args }), ...(server.env && { env: server.env }) }
      : { transport, url: server.url };
  }
  log(`converted ${Object.keys(out).length} MCP servers`);
  put(outputs, 'src/mcp/servers.json', `${JSON.stringify({ servers: out }, null, 2)}\n`);
}

/** Task 2.1 step 8. Shape agreed with scripts/install.mjs. */
function legacyNames(renames, agentMeta, skillMeta) {
  const deleted = new Set(skillMeta.deletedInPhase3);
  const nowSubagents = Object.keys(agentMeta).filter((n) => !deleted.has(n));
  return `${JSON.stringify({ renamed: renames, deleted: [...deleted], nowSubagents }, null, 2)}\n`;
}

function put(outputs, rel, content) {
  outputs.set(rel, content);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { root: { type: 'string' }, source: { type: 'string' }, 'dry-run': { type: 'boolean' } } });
  const root = resolve(values.root ?? join(HERE, '..', '..'));
  const sourceDir = values.source ? resolve(values.source) : join(root, '.cursor', 'skills');
  if (!existsSync(sourceDir)) console.log(`source ${posix.relative(root, sourceDir)} not found: skipping the skill/agent move (already migrated?)`);
  const result = migrate({ root, sourceDir, dryRun: values['dry-run'], log: (l) => console.log(l) });
  for (const item of result.items) console.log(`${item.cat}/${item.oldName} -> ${item.target} (${item.type}${item.oldName !== item.newName ? `, renamed to ${item.newName}` : ''})`);
  for (const w of result.warnings) console.log(`warning: ${w}`);
  console.log(`${values['dry-run'] ? 'dry run: ' : ''}${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged`);
}
