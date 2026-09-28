// Shrinking baseline shared by lint.mjs and check-refs.mjs (plan Task 1.11, M5, N5).
// A finding is { rule, file, key, line?, message? }. Identical { rule, file, key } findings collapse into one
// entry with a count. Line numbers are only printed, never stored.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const id = (e) => JSON.stringify([e.rule, e.file, e.key]);

/** Groups findings by { rule, file, key } and counts them. */
export function aggregate(findings) {
  const groups = new Map();
  for (const f of findings) {
    const group = groups.get(id(f)) ?? { rule: f.rule, file: f.file, key: f.key, message: f.message, count: 0, lines: [] };
    group.count += 1;
    if (f.message && group.message && !group.message.split('; ').includes(f.message)) group.message += `; ${f.message}`;
    if (f.line && !group.lines.includes(f.line)) group.lines.push(f.line);
    groups.set(id(f), group);
  }
  return [...groups.values()].sort(compareEntries);
}

export function readBaseline(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`${path}:${i + 1}: invalid JSON line`);
      }
    });
}

export function writeBaseline(path, entries) {
  const lines = [...entries].sort(compareEntries).map((e) => JSON.stringify({ rule: e.rule, file: e.file, key: e.key, count: e.count }));
  writeFileSync(path, lines.length ? `${lines.join('\n')}\n` : '');
}

/**
 * Compares findings with the baseline.
 * - not baselined, count above baseline, stale entry, count below baseline ("baseline can shrink"): error
 * - count equal to the baseline: warning
 * With `updateBaseline`, stale entries are removed and counts are lowered; entries are never added or raised.
 *
 * @param {{ findings: object[], baselineFile: string, updateBaseline?: boolean,
 *   neverBaselined?: string[], warnOnly?: string[] }} options
 * @returns {{ code: number, lines: string[] }}
 */
export function applyBaseline({ findings, baselineFile, updateBaseline = false, neverBaselined = [], warnOnly = [] }) {
  const baseline = readBaseline(baselineFile);
  const entries = new Map((baseline ?? []).map((e) => [id(e), { ...e }]));
  const errors = [];
  const warnings = [];
  const where = (g) => `${g.file}${g.lines.length ? `:${g.lines.join(',')}` : ''}`;
  const label = (g) => `${where(g)}: ${g.rule}: ${g.key}${g.message ? ` - ${g.message}` : ''}${g.count > 1 ? ` (x${g.count})` : ''}`;
  const matched = new Set();

  for (const group of aggregate(findings)) {
    if (warnOnly.includes(group.rule)) {
      warnings.push(`warning: ${label(group)}`);
      continue;
    }
    const entry = neverBaselined.includes(group.rule) ? undefined : entries.get(id(group));
    if (!entry) {
      errors.push(`error: ${label(group)}`);
      continue;
    }
    matched.add(id(group));
    if (group.count === entry.count) warnings.push(`warning: ${label(group)} (baselined)`);
    else if (group.count > entry.count) errors.push(`error: ${label(group)}: count ${group.count} exceeds baseline ${entry.count}`);
    else if (updateBaseline) {
      entry.count = group.count;
      warnings.push(`warning: ${label(group)} (baselined, count lowered to ${group.count})`);
    } else {
      errors.push(`error: ${label(group)}: baseline can shrink from ${entry.count} to ${group.count} (run with --update-baseline)`);
    }
  }

  for (const [key, entry] of entries) {
    if (matched.has(key)) continue;
    if (updateBaseline) entries.delete(key);
    else if (neverBaselined.includes(entry.rule)) errors.push(`error: ${baselineFile}: rule "${entry.rule}" cannot be baselined`);
    else errors.push(`error: stale baseline entry: ${JSON.stringify(entry)} (run with --update-baseline)`);
  }

  if (updateBaseline && baseline) writeBaseline(baselineFile, [...entries.values()]);
  const lines = [...warnings, ...errors];
  lines.push(`${errors.length} error(s), ${warnings.length} warning(s).`);
  return { code: errors.length ? 1 : 0, lines };
}

function compareEntries(a, b) {
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
  return cmp(a.file, b.file) || cmp(a.rule, b.rule) || cmp(a.key, b.key);
}
