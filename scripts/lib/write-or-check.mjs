// Writes rendered outputs to the owned paths, or compares them (--check). Never touches unowned files.
import { lstatSync, mkdirSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Owned globs are repo-relative paths whose last segment may contain `*` (e.g. `.claude/skills/tsh-*`).
 * A matching directory owns everything below it.
 */
function compile(glob) {
  const slash = glob.lastIndexOf('/');
  const dir = slash === -1 ? '' : glob.slice(0, slash);
  const pattern = glob.slice(slash + 1).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return { dir, re: new RegExp(`^${pattern}$`) };
}

/** True if `relPath` equals or lies below a path matched by one of the globs. */
export function isOwned(relPath, globs) {
  return globs.map(compile).some(({ dir, re }) => {
    const prefix = dir ? `${dir}/` : '';
    if (!relPath.startsWith(prefix)) return false;
    return re.test(relPath.slice(prefix.length).split('/')[0]);
  });
}

/** Lists the existing files (and symlinks) that fall under the owned globs. */
export function listOwnedFiles(root, globs) {
  const files = new Set();
  for (const { dir, re } of globs.map(compile)) {
    const abs = join(root, dir);
    if (!isDir(abs)) continue;
    for (const entry of readdirSync(abs)) {
      if (!re.test(entry)) continue;
      const rel = dir ? `${dir}/${entry}` : entry;
      for (const file of walk(root, rel)) files.add(file);
    }
  }
  return files;
}

/** @returns {{ missing: string[], changed: string[], extra: string[] }} */
export function checkOutputs(root, outputs, globs) {
  assertOwned(outputs, globs);
  const result = { missing: [], changed: [], extra: [] };
  for (const [rel, content] of outputs) {
    const abs = join(root, rel);
    if (!lexists(abs)) result.missing.push(rel);
    else if (!isFile(abs) || !readFileSync(abs).equals(Buffer.from(content))) result.changed.push(rel);
  }
  for (const rel of listOwnedFiles(root, globs)) if (!outputs.has(rel)) result.extra.push(rel);
  for (const list of Object.values(result)) list.sort();
  return result;
}

/** @returns {{ written: string[], deleted: string[] }} */
export function writeOutputs(root, outputs, globs) {
  // Delete stale files first (this also removes owned symlinks), then re-diff and write.
  const { extra } = checkOutputs(root, outputs, globs);
  for (const rel of extra) {
    unlinkSync(join(root, rel));
    pruneEmptyDirs(root, dirname(rel), globs);
  }
  const { missing, changed } = checkOutputs(root, outputs, globs);
  for (const rel of [...missing, ...changed]) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    if (lexists(abs) && lstatSync(abs).isSymbolicLink()) unlinkSync(abs); // never write through a symlink
    writeFileSync(abs, outputs.get(rel));
  }
  return { written: [...missing, ...changed].sort(), deleted: extra };
}

function assertOwned(outputs, globs) {
  for (const rel of outputs.keys()) {
    if (!isOwned(rel, globs)) throw new Error(`${rel}: rendered path is not covered by the owned globs`);
  }
}

/** Removes empty directories upwards, but only while they are themselves owned. */
function pruneEmptyDirs(root, relDir, globs) {
  while (relDir !== '.' && isOwned(relDir, globs)) {
    const abs = join(root, relDir);
    if (!isDir(abs) || readdirSync(abs).length > 0) return;
    rmdirSync(abs);
    relDir = dirname(relDir);
  }
}

function walk(root, rel) {
  const abs = join(root, rel);
  if (!isDir(abs)) return [rel];
  return readdirSync(abs).flatMap((entry) => walk(root, `${rel}/${entry}`));
}

function lexists(abs) {
  return lstatSync(abs, { throwIfNoEntry: false }) !== undefined;
}

function isDir(abs) {
  return lexists(abs) && lstatSync(abs).isDirectory();
}

function isFile(abs) {
  return lstatSync(abs).isFile();
}
