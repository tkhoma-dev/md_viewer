import { del, get, list, put } from "@vercel/blob";
import { blobPathnameForMd, MDS_BLOB_PREFIX } from "../mdsPaths.js";
import { buildTreeFromPaths } from "./buildTreeFromPaths.js";

/**
 * @returns {import("./index.js").MdsStorage}
 */
export function createBlobMdsStorage() {
  async function listRelativePaths() {
    const paths = [];
    let cursor;

    do {
      const result = await list({
        prefix: `${MDS_BLOB_PREFIX}/`,
        limit: 1000,
        cursor,
      });
      for (const blob of result.blobs) {
        const name = blob.pathname;
        if (!name.startsWith(`${MDS_BLOB_PREFIX}/`) || !name.endsWith(".md")) {
          continue;
        }
        paths.push(name.slice(`${MDS_BLOB_PREFIX}/`.length));
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);

    return paths;
  }

  return {
    backend: "blob",
    location: `vercel-blob:${MDS_BLOB_PREFIX}/`,

    listRelativePaths,

    async buildTree() {
      const paths = await listRelativePaths();
      return buildTreeFromPaths(paths);
    },

    async readFile(relPath) {
      try {
        const result = await get(blobPathnameForMd(relPath), {
          access: "private",
          useCache: false,
        });
        if (result == null || result.statusCode !== 200 || result.stream == null) {
          return null;
        }
        return await new Response(result.stream).text();
      } catch (e) {
        const err = /** @type {Error & { status?: number; name?: string }} */ (e);
        if (err.status === 404 || err.name === "BlobNotFoundError") {
          return null;
        }
        throw e;
      }
    },

    async writeFile(relPath, content) {
      await put(blobPathnameForMd(relPath), content, {
        access: "private",
        contentType: "text/markdown; charset=utf-8",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },

    async deleteFile(relPath) {
      try {
        await del(blobPathnameForMd(relPath));
      } catch (e) {
        const err = /** @type {Error & { status?: number; name?: string }} */ (e);
        if (err.status === 404 || err.name === "BlobNotFoundError") {
          return;
        }
        throw e;
      }
    },
  };
}
