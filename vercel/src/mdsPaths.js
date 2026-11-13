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

/** @param {string} relPath */
export function blobPathnameForMd(relPath) {
  const normalized = assertSafeMdPath(relPath);
  return `${MDS_BLOB_PREFIX}/${normalized}`;
}
