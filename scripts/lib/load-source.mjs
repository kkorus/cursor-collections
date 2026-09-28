// Loads the neutral source tree (src/) into an in-memory model.
// A missing src/ yields an empty model, so the repo stays valid before the migration.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const INCLUDE_LINE = /^[ \t]*<!-- include: ([a-z0-9-]+) -->[ \t]*$/gm;
export const SUPPORT_DIRS = ['references', 'assets', 'scripts'];

/**
 * @typedef {{ name: string, file: string, text: string, data: Record<string, any>, rawBody: string, body: string, includes: string[] }} SourceDoc
 * @typedef {SourceDoc & { dir: string, entries: string[], supportFiles: { path: string, content: Buffer }[] }} SourceSkill
 * @typedef {{ root: string, hasSource: boolean, targets: any, skills: SourceSkill[], agents: SourceDoc[],
 *   partials: { name: string, file: string, content: string }[], mcp: { file: string, servers: Record<string, any> } | null }} SourceModel
 */

/** @param {string} root absolute repo root; @returns {SourceModel} */
export function loadSource(root) {
  const model = { root, hasSource: false, targets: null, skills: [], agents: [], partials: [], mcp: null };
  const srcDir = join(root, 'src');
  if (!existsSync(srcDir)) return model;
  model.hasSource = true;

  const targetsFile = join(srcDir, 'config', 'targets.json');
  if (!existsSync(targetsFile)) throw new Error('src/config/targets.json: file is missing');
  model.targets = readJson(targetsFile, 'src/config/targets.json');

  model.partials = listDir(join(srcDir, 'partials'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ name: f.slice(0, -3), file: `src/partials/${f}`, content: readText(join(srcDir, 'partials', f)) }));
  const partials = new Map(model.partials.map((p) => [p.name, p]));

  for (const name of listDir(join(srcDir, 'skills'))) {
    const dirAbs = join(srcDir, 'skills', name);
    if (!statSync(dirAbs).isDirectory()) continue;
    const file = `src/skills/${name}/SKILL.md`;
    if (!existsSync(join(dirAbs, 'SKILL.md'))) throw new Error(`${file}: file is missing`);
    const doc = parseDoc(readText(join(dirAbs, 'SKILL.md')), file, partials);
    const supportFiles = SUPPORT_DIRS.flatMap((d) => walkFiles(join(dirAbs, d), d)).map((path) => ({
      path,
      content: readFileSync(join(dirAbs, path)),
    }));
    model.skills.push({ name, file, dir: `src/skills/${name}`, ...doc, entries: listDir(dirAbs), supportFiles });
  }

  for (const f of listDir(join(srcDir, 'agents'))) {
    if (!f.endsWith('.md')) continue;
    const file = `src/agents/${f}`;
    model.agents.push({ name: f.slice(0, -3), file, ...parseDoc(readText(join(srcDir, 'agents', f)), file, partials) });
  }

  const mcpFile = join(srcDir, 'mcp', 'servers.json');
  if (existsSync(mcpFile)) {
    const json = readJson(mcpFile, 'src/mcp/servers.json');
    model.mcp = { file: 'src/mcp/servers.json', servers: json.servers };
  }
  return model;
}

/** Splits frontmatter from body and resolves partial includes. */
function parseDoc(text, file, partials) {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) throw new Error(`${file}: frontmatter: missing or not closed with ---`);
  let data;
  try {
    data = parseYaml(match[1]);
  } catch (err) {
    throw new Error(`${file}: frontmatter: invalid YAML (${err.message.split('\n')[0]})`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${file}: frontmatter: must be a YAML mapping`);
  }
  const rawBody = text.slice(match[0].length);
  const includes = [];
  const body = rawBody.replace(INCLUDE_LINE, (_, name) => {
    const partial = partials.get(name);
    if (!partial) throw new Error(`${file}: include: partial "${name}" not found in src/partials/`);
    if (new RegExp(INCLUDE_LINE.source, 'm').test(partial.content)) {
      throw new Error(`${partial.file}: include: nested includes are not allowed (included from ${file})`);
    }
    includes.push(name);
    return partial.content.replace(/\n+$/, '');
  });
  return { text, data, rawBody, body, includes };
}

/**
 * Every Markdown file of the source (skills, their support files, agents, partials), for the text rules.
 * `owner` is the skill or agent name, `skillPath` the path inside the skill dir (support files and SKILL.md).
 */
export function markdownFiles(model) {
  const files = [];
  for (const skill of model.skills) {
    files.push({ file: skill.file, text: skill.text, owner: skill.name, skill, skillPath: 'SKILL.md' });
    for (const support of skill.supportFiles.filter((f) => f.path.endsWith('.md'))) {
      files.push({ file: `${skill.dir}/${support.path}`, text: support.content.toString('utf8').replace(/\r\n/g, '\n'),
        owner: skill.name, skill, skillPath: support.path });
    }
  }
  for (const agent of model.agents) files.push({ file: agent.file, text: agent.text, owner: agent.name, agent });
  for (const partial of model.partials) files.push({ file: partial.file, text: partial.content, owner: null });
  return files;
}

function readText(path) {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function readJson(path, file) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`${file}: invalid JSON (${err.message})`);
  }
}

function listDir(path) {
  return existsSync(path) ? readdirSync(path).sort() : [];
}

/** Recursively lists files below `abs`, returned as paths prefixed with `rel`. */
function walkFiles(abs, rel) {
  return listDir(abs).flatMap((entry) => {
    const childAbs = join(abs, entry);
    const childRel = `${rel}/${entry}`;
    return statSync(childAbs).isDirectory() ? walkFiles(childAbs, childRel) : [childRel];
  });
}
