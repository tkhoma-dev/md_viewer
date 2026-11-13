import fs from "fs/promises";
import path from "path";
import { assertSafeMdPath } from "../mdsPaths.js";

/**
 * @param {string} mdsDir
 * @returns {import("./index.js").MdsStorage}
 */
export function createFilesystemMdsStorage(mdsDir) {
  const root = path.resolve(mdsDir);

  function resolveFull(rel) {
    const normalized = assertSafeMdPath(rel);
    const full = path.resolve(root, normalized);
    const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
    if (full !== root && !full.startsWith(rootWithSep)) {
      throw new Error("path outside mds root");
    }
    return full;
  }

  async function buildTree(dir = root, base = "") {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (e) {
      if (/** @type {NodeJS.ErrnoException} */ (e).code === "ENOENT") {
        return [];
      }
      throw e;
    }

    const dirs = [];
    const files = [];
    for (const ent of entries) {
      if (ent.isDirectory()) {
        dirs.push(ent);
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        files.push(ent);
      }
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    const nodes = [];
    for (const ent of dirs) {
      const rel = base ? `${base}/${ent.name}` : ent.name;
      const children = await buildTree(path.join(dir, ent.name), rel);
      if (children.length > 0) {
        nodes.push({
          type: "dir",
          name: ent.name,
          path: rel.replace(/\\/g, "/"),
          children,
        });
      }
    }
    for (const ent of files) {
      const rel = base ? `${base}/${ent.name}` : ent.name;
      nodes.push({
        type: "file",
        name: ent.name,
        path: rel.replace(/\\/g, "/"),
      });
    }
    return nodes;
  }

  return {
    backend: "filesystem",
    location: root,

    buildTree() {
      return buildTree();
    },

    async readFile(relPath) {
      const full = resolveFull(relPath);
      try {
        return await fs.readFile(full, "utf8");
      } catch (e) {
        if (/** @type {NodeJS.ErrnoException} */ (e).code === "ENOENT") {
          return null;
        }
        throw e;
      }
    },

    async writeFile(relPath, content) {
      const full = resolveFull(relPath);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content, "utf8");
    },

    async deleteFile(relPath) {
      const full = resolveFull(relPath);
      try {
        await fs.unlink(full);
      } catch (e) {
        if (/** @type {NodeJS.ErrnoException} */ (e).code === "ENOENT") {
          return;
        }
        throw e;
      }
    },
  };
}
