/**
 * @param {string | null | undefined} selectedPath
 */
export function parentFolderFromSelectedFile(selectedPath) {
  if (!selectedPath) return "";
  const normalized = selectedPath.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? "" : normalized.slice(0, idx);
}

/** @param {string} filePath @param {string} targetFolder */
export function destinationPathInFolder(filePath, targetFolder) {
  const base = filePath.replace(/\\/g, "/").split("/").pop() || filePath;
  const folder = targetFolder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  return folder ? `${folder}/${base}` : base;
}

export const INTERNAL_DRAG_TYPE = "application/x-md-viewer-path";
