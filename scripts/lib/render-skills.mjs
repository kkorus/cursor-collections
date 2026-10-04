// Renders src/skills/* into .agents/skills (Cursor, Codex) and .claude/skills (Claude), per plan D2.
import { generatedNote, mergeTargets, normalizeBody, toFrontmatter, toYaml } from './format.mjs';

// Both trees get byte-identical renderings.
// TODO(spike 1.1 Q2): split rendering per tree goes here if Cursor rejects the Claude-only keys.
export const SKILL_TREES = ['.agents/skills', '.claude/skills'];

/** @param {import('./load-source.mjs').SourceSkill} skill */
export function renderSkillMarkdown(skill) {
  const { data, file } = skill;
  const fm = { name: data.name, description: data.description };
  if (data.paths) fm.paths = data.paths;
  if (data.license) fm.license = data.license;
  if (data['requires-mcp']?.length) fm.compatibility = `Requires MCP servers: ${data['requires-mcp'].join(', ')}`;
  if (data.metadata) fm.metadata = data.metadata;
  if (data.type === 'command') {
    fm['disable-model-invocation'] = true;
    if (data['argument-hint']) fm['argument-hint'] = data['argument-hint'];
  }
  // only commands are meant to be typed by a user; every other type is loaded by name (model or agent)
  if (data.type !== 'command') fm['user-invocable'] = false;

  const cursorExtra = data.targets?.cursor ?? {};
  const claudeExtra = data.targets?.claude ?? {};
  for (const key of Object.keys(cursorExtra)) {
    if (key in claudeExtra) throw new Error(`${file}: targets.claude.${key}: collides with targets.cursor.${key}`);
  }
  const merged = mergeTargets(mergeTargets(fm, cursorExtra), claudeExtra);
  return `${toFrontmatter(merged)}<!-- ${generatedNote(file)} -->\n\n${normalizeBody(skill.body)}`;
}

/** Codex `agents/openai.yaml` for commands: never implicitly invoked. */
export function renderOpenAiYaml(skill) {
  const config = mergeTargets({ policy: { allow_implicit_invocation: false } }, skill.data.targets?.codex);
  return `# ${generatedNote(skill.file)}\n${toYaml(config)}`;
}

/**
 * @param {import('./load-source.mjs').SourceModel} model
 * @returns {Map<string, string | Buffer>} repo-relative output path -> content
 */
export function renderSkills(model) {
  const out = new Map();
  for (const skill of model.skills) {
    const markdown = renderSkillMarkdown(skill);
    const openAi = skill.data.type === 'command' ? renderOpenAiYaml(skill) : null;
    for (const tree of SKILL_TREES) {
      const base = `${tree}/${skill.name}`;
      out.set(`${base}/SKILL.md`, markdown);
      for (const support of skill.supportFiles) out.set(`${base}/${support.path}`, support.content);
    }
    // Codex reads only .agents/skills, so its per-skill config lives in that tree only.
    if (openAi) out.set(`.agents/skills/${skill.name}/agents/openai.yaml`, openAi);
  }
  return out;
}
