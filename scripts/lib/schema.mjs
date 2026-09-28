// Validates the neutral source schema (plan D1). Returns a list of { file, key, message } errors.

export const NAME_RE = /^tsh-[a-z0-9]+(-[a-z0-9]+)*$/;
export const SKILL_TYPES = ['skill', 'command', 'internal', 'orchestrator'];
export const MODEL_TIERS = ['deep', 'balanced', 'fast', 'inherit'];
export const ACCESS = ['read-only', 'read-write'];
const TOOLS = ['cursor', 'claude', 'codex'];

const SKILL_KEYS = ['name', 'description', 'type', 'routes-to', 'standalone', 'argument-hint', 'paths',
  'requires-mcp', 'license', 'metadata', 'targets'];
const COMMAND_ONLY = ['routes-to', 'standalone', 'argument-hint'];
const AGENT_KEYS = ['name', 'description', 'type', 'model-tier', 'access', 'shell', 'requires-mcp',
  'preload-skills', 'targets'];
const STDIO_KEYS = ['transport', 'command', 'args', 'env'];
const HTTP_KEYS = ['transport', 'url'];

/** @param {import('./load-source.mjs').SourceModel} model */
export function validateModel(model) {
  const errors = [];
  const add = (file, key, message) => errors.push({ file, key, message });
  const servers = model.mcp ? model.mcp.servers : {};
  const skillTypes = new Map(model.skills.map((s) => [s.name, s.data.type]));
  const agentNames = new Set(model.agents.map((a) => a.name));

  if (model.mcp) validateServers(model.mcp, add);
  if (model.targets) validateTargetsConfig(model.targets, add);

  for (const skill of model.skills) {
    const { file, data } = skill;
    rejectUnknownKeys(data, SKILL_KEYS, file, add);
    validateCommon(skill, add);
    if (!SKILL_TYPES.includes(data.type)) {
      add(file, 'type', `must be one of ${SKILL_TYPES.join(' | ')}`);
    }
    if (data.type !== 'command') {
      for (const key of COMMAND_ONLY) if (key in data) add(file, key, 'is allowed only on type: command');
    } else {
      if ('standalone' in data && typeof data.standalone !== 'boolean') add(file, 'standalone', 'must be a boolean');
      if (data.standalone === true && 'routes-to' in data) add(file, 'routes-to', 'must not be set when standalone: true');
      if (data.standalone !== true) {
        const target = data['routes-to'];
        if (target === undefined) add(file, 'routes-to', 'is required for commands unless standalone: true');
        else if (!agentNames.has(target) && skillTypes.get(target) !== 'orchestrator') {
          add(file, 'routes-to', `"${target}" is not an existing agent or orchestrator`);
        }
      }
      if ('argument-hint' in data && typeof data['argument-hint'] !== 'string') add(file, 'argument-hint', 'must be a string');
    }
    if ('paths' in data) {
      if (data.type !== 'skill') add(file, 'paths', 'is allowed only on type: skill');
      else if (!isStringArray(data.paths)) add(file, 'paths', 'must be a list of strings');
    }
    if ('license' in data && typeof data.license !== 'string') add(file, 'license', 'must be a string');
    if ('metadata' in data && !(isObject(data.metadata) && Object.values(data.metadata).every((v) => typeof v === 'string'))) {
      add(file, 'metadata', 'must map strings to strings');
    }
    if (isObject(data.targets) && data.type !== 'command' && isObject(data.targets.codex)
      && Object.keys(data.targets.codex).length > 0) {
      add(file, 'targets.codex', 'is supported only on type: command (rendered into agents/openai.yaml)');
    }
    checkMcpRefs(data, servers, file, add);
  }

  for (const agent of model.agents) {
    const { file, data } = agent;
    rejectUnknownKeys(data, AGENT_KEYS, file, add);
    validateCommon(agent, add);
    if (data.type !== 'agent') add(file, 'type', 'must be agent');
    if (!MODEL_TIERS.includes(data['model-tier'])) add(file, 'model-tier', `must be one of ${MODEL_TIERS.join(' | ')}`);
    else if (model.targets && !isObject(model.targets.modelTiers?.[data['model-tier']])) {
      add(file, 'model-tier', `"${data['model-tier']}" is not defined in src/config/targets.json`);
    }
    if (!ACCESS.includes(data.access)) add(file, 'access', `must be one of ${ACCESS.join(' | ')}`);
    if ('shell' in data && typeof data.shell !== 'boolean') add(file, 'shell', 'must be a boolean');
    if ('preload-skills' in data) {
      const preload = data['preload-skills'];
      if (!isStringArray(preload)) add(file, 'preload-skills', 'must be a list of skill names');
      else {
        if (preload.length > 2) add(file, 'preload-skills', 'must have at most 2 entries');
        for (const name of preload) {
          if (!skillTypes.has(name)) add(file, 'preload-skills', `"${name}" is not an existing skill`);
          else if (skillTypes.get(name) === 'command') add(file, 'preload-skills', `"${name}" is a command and cannot be preloaded`);
        }
      }
    }
    checkMcpRefs(data, servers, file, add);
  }
  return errors;
}

/** Rules shared by skills and agents: name, description, targets. */
function validateCommon({ name, file, data }, add) {
  if (typeof data.name !== 'string') add(file, 'name', 'is required');
  else {
    if (!NAME_RE.test(data.name) || data.name.length > 64) add(file, 'name', `must match ${NAME_RE} and be <= 64 chars`);
    if (data.name !== name) add(file, 'name', `"${data.name}" must equal the ${file.endsWith('SKILL.md') ? 'folder' : 'file'} name "${name}"`);
  }
  if (typeof data.description !== 'string' || data.description.trim() === '') add(file, 'description', 'is required');
  else if (data.description.length > 1024) add(file, 'description', 'must be <= 1024 chars');
  if (!('type' in data)) add(file, 'type', 'is required');
  if ('targets' in data) {
    if (!isObject(data.targets)) add(file, 'targets', 'must be an object');
    else {
      for (const [tool, value] of Object.entries(data.targets)) {
        if (!TOOLS.includes(tool)) add(file, `targets.${tool}`, `unknown tool (allowed: ${TOOLS.join(', ')})`);
        else if (!isObject(value)) add(file, `targets.${tool}`, 'must be an object');
      }
    }
  }
}

function checkMcpRefs(data, servers, file, add) {
  if (!('requires-mcp' in data)) return;
  if (!isStringArray(data['requires-mcp'])) return add(file, 'requires-mcp', 'must be a list of server names');
  for (const server of data['requires-mcp']) {
    if (!Object.hasOwn(servers, server)) add(file, 'requires-mcp', `"${server}" is not defined in src/mcp/servers.json`);
  }
}

function validateServers(mcp, add) {
  const { file, servers } = mcp;
  if (!isObject(servers)) return add(file, 'servers', 'must be an object');
  for (const [name, server] of Object.entries(servers)) {
    const key = `servers.${name}`;
    if (!isObject(server)) {
      add(file, key, 'must be an object');
      continue;
    }
    if (server.transport === 'stdio') {
      rejectUnknownKeys(server, STDIO_KEYS, file, add, `${key}.`);
      if (typeof server.command !== 'string') add(file, `${key}.command`, 'is required for stdio');
      if ('args' in server && !isStringArray(server.args)) add(file, `${key}.args`, 'must be a list of strings');
      if ('env' in server && !(isObject(server.env) && Object.values(server.env).every((v) => typeof v === 'string'))) {
        add(file, `${key}.env`, 'must map strings to strings');
      }
    } else if (server.transport === 'http') {
      rejectUnknownKeys(server, HTTP_KEYS, file, add, `${key}.`);
      if (typeof server.url !== 'string') add(file, `${key}.url`, 'is required for http');
    } else {
      add(file, `${key}.transport`, 'must be stdio | http');
    }
  }
}

function validateTargetsConfig(targets, add) {
  const file = 'src/config/targets.json';
  if (!isObject(targets.modelTiers)) add(file, 'modelTiers', 'must be an object');
  if (!isStringArray(targets.owned)) add(file, 'owned', 'must be a list of globs');
  if ('inlinePreload' in targets) {
    if (!isStringArray(targets.inlinePreload) || targets.inlinePreload.some((t) => !['cursor', 'codex'].includes(t))) {
      add(file, 'inlinePreload', 'must be a list of cursor | codex');
    }
  }
}

function rejectUnknownKeys(obj, allowed, file, add, prefix = '') {
  for (const key of Object.keys(obj)) if (!allowed.includes(key)) add(file, `${prefix}${key}`, 'unknown key');
}

export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}
