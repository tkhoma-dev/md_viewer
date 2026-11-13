import {
  assertSafeFolderPath,
  assertSafeMdPath,
  folderPlaceholderMdPath,
  isFolderPlaceholderPath,
  parentFolderPath,
} from "./mdsPaths.js";

/**
 * @param {import("./storage/index.js").MdsStorage} storage
 * @param {string} folderPath
 */
export async function createFolder(storage, folderPath) {
  const dir = assertSafeFolderPath(folderPath);
  const placeholder = folderPlaceholderMdPath(dir);
  const paths = await storage.listRelativePaths();
  const prefix = `${dir}/`;
  const exists = paths.some((p) => p === placeholder || p.startsWith(prefix));
  if (exists) {
    const err = new Error("folder already exists");
    err.status = 409;
    throw err;
  }
  const title = dir.split("/").pop() || dir;
  await storage.writeFile(placeholder, `# ${title}\n`);
  return { path: dir, placeholder };
}

/**
 * @param {import("./storage/index.js").MdsStorage} storage
 * @param {string} fromPath
 * @param {string} toPath
 */
export async function moveMarkdownFile(storage, fromPath, toPath) {
  const from = assertSafeMdPath(fromPath);
  const to = assertSafeMdPath(toPath);
  if (isFolderPlaceholderPath(from)) {
    throw new Error("cannot move folder marker files");
  }
  if (isFolderPlaceholderPath(to)) {
    throw new Error("invalid destination");
  }
  if (from === to) {
    return { from, to, moved: false };
  }

  const oldDir = parentFolderPath(from);
  const newDir = parentFolderPath(to);
  if (newDir === from || newDir.startsWith(`${from}/`)) {
    throw new Error("cannot move a file into itself");
  }

  const content = await storage.readFile(from);
  if (content == null) {
    const err = new Error("not found");
    err.status = 404;
    throw err;
  }

  const destExists = await storage.readFile(to);
  if (destExists != null) {
    const err = new Error("destination already exists");
    err.status = 409;
    throw err;
  }

  await storage.writeFile(to, content);
  await storage.deleteFile(from);

  if (oldDir !== newDir && oldDir) {
    await pruneEmptyFolder(storage, oldDir);
  }

  if (newDir) {
    const marker = folderPlaceholderMdPath(newDir);
    const markerContent = await storage.readFile(marker);
    if (markerContent == null) {
      const title = newDir.split("/").pop();
      await storage.writeFile(marker, `# ${title}\n`);
    }
  }

  return { from, to, moved: true };
}

/**
 * @param {import("./storage/index.js").MdsStorage} storage
 * @param {string} folderPath
 */
/**
 * @param {import("./storage/index.js").MdsStorage} storage
 * @param {string} folderPath
 */
export async function deleteFolder(storage, folderPath) {
  const dir = assertSafeFolderPath(folderPath);
  const paths = await storage.listRelativePaths();
  const prefix = `${dir}/`;
  const marker = folderPlaceholderMdPath(dir);
  const toDelete = paths.filter(
    (p) => p === marker || p.startsWith(prefix),
  );
  if (toDelete.length === 0) {
    const err = new Error("folder not found");
    err.status = 404;
    throw err;
  }
  for (const rel of toDelete) {
    await storage.deleteFile(rel);
  }
  const parent = parentFolderPath(`${dir}/x.md`);
  if (parent) {
    await pruneEmptyFolder(storage, parent);
  }
  return { path: dir, deletedFiles: toDelete.length };
}

export async function pruneEmptyFolder(storage, folderPath) {
  const dir = assertSafeFolderPath(folderPath);
  const paths = await storage.listRelativePaths();
  const prefix = `${dir}/`;
  const realFiles = paths.filter(
    (p) =>
      p.startsWith(prefix) &&
      p !== folderPlaceholderMdPath(dir) &&
      !isFolderPlaceholderPath(p),
  );
  if (realFiles.length > 0) {
    return;
  }
  const placeholder = folderPlaceholderMdPath(dir);
  const hasMarker = paths.includes(placeholder);
  if (hasMarker) {
    await storage.deleteFile(placeholder);
  }
  const parent = parentFolderPath(dir);
  if (parent) {
    await pruneEmptyFolder(storage, parent);
  }
}
