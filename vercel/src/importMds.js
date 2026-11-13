import fs from "fs/promises";
import path from "path";

/**
 * @param {string} dir
 * @param {string} [base]
 * @returns {Promise<Array<{ path: string, full: string }>>}
 */
export async function collectMarkdownFromDisk(dir, base = "") {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code === "ENOENT") {
      return [];
    }
    throw e;
  }

  const out = [];
  for (const ent of entries) {
    const rel = base ? `${base}/${ent.name}` : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await collectMarkdownFromDisk(full, rel)));
    } else if (ent.isFile() && ent.name.endsWith(".md")) {
      out.push({ path: rel.replace(/\\/g, "/"), full });
    }
  }
  return out;
}

/**
 * @param {import("./storage/index.js").MdsStorage} mdsStorage
 * @param {Array<{ path: string, content: string }>} files
 * @returns {Promise<string[]>}
 */
export async function importFilesToStorage(mdsStorage, files) {
  const imported = [];
  for (const file of files) {
    await mdsStorage.writeFile(file.path, file.content);
    imported.push(file.path);
  }
  imported.sort((a, b) => a.localeCompare(b));
  return imported;
}

/**
 * @param {import("./storage/index.js").MdsStorage} mdsStorage
 * @param {string} mdsDir
 * @returns {Promise<{ count: number, paths: string[], sourceDir: string }>}
 */
export async function importMarkdownDirToStorage(mdsStorage, mdsDir) {
  const onDisk = await collectMarkdownFromDisk(mdsDir);
  onDisk.sort((a, b) => a.path.localeCompare(b.path));

  const batch = [];
  for (const { path: relPath, full } of onDisk) {
    const content = await fs.readFile(full, "utf8");
    batch.push({ path: relPath, content });
  }

  const paths = await importFilesToStorage(mdsStorage, batch);
  return { count: paths.length, paths, sourceDir: path.resolve(mdsDir) };
}
