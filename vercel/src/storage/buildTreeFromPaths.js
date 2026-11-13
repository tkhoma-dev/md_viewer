import { isFolderPlaceholderPath } from "../mdsPaths.js";

/**
 * @param {string[]} paths Relative .md paths (e.g. `notes/a.md`)
 * @returns {Array<{ type: 'dir', name: string, path: string, children: unknown[] } | { type: 'file', name: string, path: string }>}
 */
export function buildTreeFromPaths(paths) {
  const sorted = [...paths].sort((a, b) => a.localeCompare(b));
  const root = [];

  for (const relPath of sorted) {
    if (!relPath.endsWith(".md")) continue;
    if (isFolderPlaceholderPath(relPath)) continue;
    const parts = relPath.split("/");
    let nodes = root;
    let pathSoFar = "";

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      pathSoFar = pathSoFar ? `${pathSoFar}/${name}` : name;

      if (isLast) {
        nodes.push({ type: "file", name, path: relPath });
      } else {
        let dir = nodes.find((n) => n.type === "dir" && n.name === name);
        if (!dir) {
          dir = { type: "dir", name, path: pathSoFar, children: [] };
          nodes.push(dir);
        }
        nodes = /** @type {{ children: typeof root }} */ (dir).children;
      }
    }
  }

  sortTreeLevel(root);
  return root;
}

/** @param {Array<{ type: string, name: string, children?: unknown[] }>} nodes */
function sortTreeLevel(nodes) {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "dir" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  for (const node of nodes) {
    if (node.type === "dir" && node.children) {
      sortTreeLevel(/** @type {typeof nodes} */ (node.children));
    }
  }
}
