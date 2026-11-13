import path from "path";
import { fileURLToPath } from "url";
import { createBlobMdsStorage } from "./blobMdsStorage.js";
import { createFilesystemMdsStorage } from "./filesystemMdsStorage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} MdsStorage
 * @property {"filesystem" | "blob"} backend
 * @property {string} location
 * @property {() => Promise<unknown[]>} buildTree
 * @property {(relPath: string) => Promise<string | null>} readFile
 * @property {(relPath: string, content: string) => Promise<void>} writeFile
 * @property {(relPath: string) => Promise<void>} deleteFile
 */

/**
 * @param {{ mdsDir?: string }} [options]
 * @returns {MdsStorage}
 */
export function createMdsStorage(options = {}) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return createBlobMdsStorage();
  }

  const defaultDir = path.join(__dirname, "..", "..", "mds");
  const mdsDir = options.mdsDir || process.env.MDS_DIR || defaultDir;
  return createFilesystemMdsStorage(mdsDir);
}
