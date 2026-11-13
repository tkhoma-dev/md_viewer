/**
 * @param {string} rel
 * @returns {string} normalized relative path
 */
export function assertSafeMdPath(rel) {
  if (typeof rel !== "string" || !rel.trim()) {
    throw new Error("path is required");
  }
  const normalized = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..") || pathIsAbsolute(normalized)) {
    throw new Error("invalid path");
  }
  if (!normalized.endsWith(".md")) {
    throw new Error("only .md files are allowed");
  }
  return normalized;
}

function pathIsAbsolute(p) {
  return p.startsWith("/") || /^[A-Za-z]:[/\\]/.test(p);
}

export const MDS_BLOB_PREFIX = "mds";

/** Hidden marker so empty folders exist in Blob storage. */
export const FOLDER_PLACEHOLDER_NAME = "_folder.md";

/** @param {string} relPath */
export function blobPathnameForMd(relPath) {
  const normalized = assertSafeMdPath(relPath);
  return `${MDS_BLOB_PREFIX}/${normalized}`;
}

/**
 * @param {string} rel Folder path without trailing slash (e.g. `guides` or `a/b`)
 * @returns {string}
 */
export function assertSafeFolderPath(rel) {
  if (typeof rel !== "string" || !rel.trim()) {
    throw new Error("folder path is required");
  }
  const normalized = rel.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.includes("..") || pathIsAbsolute(normalized)) {
    throw new Error("invalid folder path");
  }
  const parts = normalized.split("/");
  for (const part of parts) {
    if (!part || part === "." || part === "..") {
      throw new Error("invalid folder path");
    }
  }
  return normalized;
}

/** @param {string} folderPath */
export function folderPlaceholderMdPath(folderPath) {
  const dir = assertSafeFolderPath(folderPath);
  return `${dir}/${FOLDER_PLACEHOLDER_NAME}`;
}

/** @param {string} mdPath */
export function isFolderPlaceholderPath(mdPath) {
  return (
    typeof mdPath === "string" &&
    mdPath.endsWith(`/${FOLDER_PLACEHOLDER_NAME}`)
  );
}

/** @param {string} mdPath */
export function parentFolderPath(mdPath) {
  const normalized = mdPath.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? "" : normalized.slice(0, idx);
}
