// Renders src/agents/*.md into native subagents for Cursor, Claude Code and Codex (plan D2, D5, M1, M4).
import { stringify as stringifyToml } from 'smol-toml';
import { generatedNote, mergeTargets, normalizeBody, toFrontmatter } from './format.mjs';
import { isObject } from './schema.mjs';

const READ_ONLY_CLAUDE_DENY = ['Write', 'Edit', 'NotebookEdit'];

/**
 * @param {import('./load-source.mjs').SourceModel} model
 * @returns {Map<string, string>} repo-relative output path -> content
 */
export function renderAgents(model) {
  const out = new Map();
  for (const agent of model.agents) {
    out.set(`.cursor/agents/${agent.name}.md`, renderCursorAgent(agent, model));
    out.set(`.claude/agents/${agent.name}.md`, renderClaudeAgent(agent, model));
    // TODO(spike 1.3 Q1): map `-` to `_` in the Codex agent name and file name here if Codex rejects hyphens.
    out.set(`.codex/agents/${agent.name}.toml`, renderCodexAgent(agent, model));
  }
  return out;
}

export function renderCursorAgent(agent, model) {
  const { data } = agent;
  const fm = { name: data.name, description: data.description };
  const cursorModel = tier(agent, model).cursor;
  if (cursorModel) fm.model = cursorModel;
  if (data.access === 'read-only') fm.readonly = true;
  const body = instructions(agent, model, 'cursor');
  return `${toFrontmatter(mergeTargets(fm, data.targets?.cursor))}<!-- ${generatedNote(agent.file)} -->\n\n${body}`;
}

export function renderClaudeAgent(agent, model) {
  const { data } = agent;
  const fm = { name: data.name, description: data.description };
  const claudeModel = tier(agent, model).claude;
  if (claudeModel) fm.model = claudeModel;
  // Leaf enforcement (M1): no Claude subagent may spawn another one.
  const deny = ['Agent'];
  if (data.access === 'read-only') deny.push(...READ_ONLY_CLAUDE_DENY);
  if (data.shell === false) deny.push('Bash');
  fm.disallowedTools = deny;
  if (data['preload-skills']?.length) fm.skills = data['preload-skills'];
  return `${toFrontmatter(mergeTargets(fm, data.targets?.claude))}<!-- ${generatedNote(agent.file)} -->\n\n${normalizeBody(agent.body)}`;
}

export function renderCodexAgent(agent, model) {
  const { data } = agent;
  let config = { name: data.name, description: data.description, ...tier(agent, model).codex };
  if (data.access === 'read-only') config.sandbox_mode = 'read-only';
  // TODO(spike 1.3 Q10): emit the Codex per-agent no-spawn key here if the spike finds one.
  config = mergeTargets(config, data.targets?.codex);

  // smol-toml emits tables after plain keys; developer_instructions goes between them as a multi-line string.
  const plain = {};
  const tables = {};
  for (const [key, value] of Object.entries(config)) (isObject(value) ? tables : plain)[key] = value;
  const parts = [`# ${generatedNote(agent.file)}\n`, stringifyToml(plain)];
  parts.push(`developer_instructions = ${tomlMultiline(instructions(agent, model, 'codex'))}\n`);
  if (Object.keys(tables).length) parts.push('\n', stringifyToml(tables).replace(/^\n+/, ''));
  return parts.join('');
}

function tier(agent, model) {
  return model.targets.modelTiers[agent.data['model-tier']];
}

/** Cursor and Codex have no preload field: prepend a "Required skills" line, or inline the skills (M4, N2). */
function instructions(agent, model, tool) {
  const preload = agent.data['preload-skills'] ?? [];
  const body = normalizeBody(agent.body);
  if (preload.length === 0) return body;
  const names = preload.map((n) => `\`${n}\``).join(' and ');
  if (!(model.targets.inlinePreload ?? []).includes(tool)) {
    return `Required skills: load ${names} by name before starting.\n\n${body}`;
  }
  const inlined = preload.map((name) => inlineSkill(model.skills.find((s) => s.name === name)));
  return `Required skills: ${names} ${preload.length > 1 ? 'are' : 'is'} inlined at the end of these instructions. Follow ${preload.length > 1 ? 'them' : 'it'} before starting.\n\n${body}\n${inlined.join('\n')}`;
}

/**
 * Inlines a preloaded skill body plus the contents of its references/ files (N2). Relative links are
 * turned into plain text, so the agent file never links into the .agents/ or .claude/ skill trees.
 */
function inlineSkill(skill) {
  const sections = [`## Preloaded skill: \`${skill.name}\`\n\n${unlink(skill.body, skill.name)}`];
  for (const file of skill.supportFiles.filter((f) => f.path.startsWith('references/'))) {
    sections.push(`### \`${skill.name}\` reference: ${file.path}\n\n${unlink(file.content.toString('utf8'), skill.name)}`);
  }
  return sections.join('\n');
}

function unlink(markdown, skillName) {
  const text = markdown.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (link, label, target) => {
    if (/^([a-z][a-z0-9+.-]*:|#)/i.test(target)) return link;
    const path = target.replace(/^\.\//, '').replace(/^\.\.\/references\//, 'references/');
    return path.startsWith('references/')
      ? `${label} (\`${path}\`, inlined below)`
      : `${label} (\`${path}\` in the \`${skillName}\` skill)`;
  });
  return normalizeBody(text);
}

/** TOML multi-line basic string. Escapes backslashes, `"""` runs and control characters. */
export function tomlMultiline(text) {
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '""\\"')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return `"""\n${escaped}"""`;
}
