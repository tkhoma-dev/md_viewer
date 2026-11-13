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

/** Blob subdirectory for uploaded images (hidden from the file tree). */
export const IMAGE_STORAGE_DIR = "image";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

/** @param {string} relPath */
export function isHiddenFromFileTree(relPath) {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  return (
    normalized === IMAGE_STORAGE_DIR ||
    normalized.startsWith(`${IMAGE_STORAGE_DIR}/`)
  );
}

/**
 * @param {string} rel e.g. `image/abc.png`
 * @returns {string}
 */
export function assertSafeImagePath(rel) {
  if (typeof rel !== "string" || !rel.trim()) {
    throw new Error("path is required");
  }
  const normalized = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..") || pathIsAbsolute(normalized)) {
    throw new Error("invalid path");
  }
  if (!normalized.startsWith(`${IMAGE_STORAGE_DIR}/`)) {
    throw new Error("invalid image path");
  }
  const ext = normalized.split(".").pop()?.toLowerCase() ?? "";
  if (!IMAGE_EXT.has(ext)) {
    throw new Error("unsupported image type");
  }
  return normalized;
}

/** @param {string} relPath */
export function blobPathnameForImage(relPath) {
  const normalized = assertSafeImagePath(relPath);
  return `${MDS_BLOB_PREFIX}/${normalized}`;
}

const MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/** @param {string} imagePath */
export function contentTypeForImagePath(imagePath) {
  const ext = imagePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

/**
 * @param {string} originalFilename
 * @returns {string} relative path under `image/`
 */
export function newImageRelPath(originalFilename) {
  const base = String(originalFilename || "image")
    .replace(/\\/g, "/")
    .split("/")
    .pop() ?? "image";
  const dot = base.lastIndexOf(".");
  const ext = (dot === -1 ? "png" : base.slice(dot + 1)).toLowerCase();
  const safeExt = IMAGE_EXT.has(ext) ? ext : "png";
  const id = crypto.randomUUID();
  return `${IMAGE_STORAGE_DIR}/${id}.${safeExt}`;
}

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
