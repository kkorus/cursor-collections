// Shared formatting helpers for the renderers: deterministic frontmatter and target merging.
import { stringify as stringifyYaml } from 'yaml';
import { isObject } from './schema.mjs';

/** `name`, `description`, then every other key alphabetically. */
export function orderKeys(obj) {
  const rest = Object.keys(obj).filter((k) => k !== 'name' && k !== 'description').sort();
  const ordered = {};
  for (const key of ['name', 'description', ...rest]) if (key in obj) ordered[key] = obj[key];
  return ordered;
}

export function toYaml(obj) {
  return stringifyYaml(obj, { lineWidth: 0 });
}

export function toFrontmatter(obj) {
  return `---\n${toYaml(orderKeys(obj))}---\n`;
}

export function generatedNote(sourceFile) {
  return `Generated from ${sourceFile} by scripts/generate.mjs. Do not edit.`;
}

/** Normalizes a Markdown body: no leading blank lines, exactly one trailing newline. */
export function normalizeBody(body) {
  const trimmed = body.replace(/^\n+/, '').replace(/\s+$/, '');
  return trimmed === '' ? '' : `${trimmed}\n`;
}

/**
 * Merges `extra` over `base` (the `targets.*` escape hatch). Objects merge deeply, arrays are
 * unioned (so generated entries such as `disallowedTools: [Agent]` survive), scalars are replaced.
 */
export function mergeTargets(base, extra) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (Array.isArray(out[key]) && Array.isArray(value)) out[key] = [...new Set([...out[key], ...value])];
    else if (isObject(out[key]) && isObject(value)) out[key] = mergeTargets(out[key], value);
    else out[key] = value;
  }
  return out;
}
