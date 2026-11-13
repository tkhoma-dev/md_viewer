import { createBlobMdsStorage } from "./blobMdsStorage.js";

/**
 * @typedef {Object} MdsStorage
 * @property {"blob"} backend
 * @property {string} location
 * @property {() => Promise<string[]>} listRelativePaths
 * @property {() => Promise<unknown[]>} buildTree
 * @property {(relPath: string) => Promise<string | null>} readFile
 * @property {(relPath: string, content: string) => Promise<void>} writeFile
 * @property {(relPath: string) => Promise<void>} deleteFile
 */

/**
 * @returns {MdsStorage}
 */
export function createMdsStorage() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required — markdown is stored only in Vercel Blob.",
    );
  }
  return createBlobMdsStorage();
}
