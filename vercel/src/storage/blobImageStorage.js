import { get, put } from "@vercel/blob";
import {
  assertSafeImagePath,
  blobPathnameForImage,
  contentTypeForImagePath,
  newImageRelPath,
} from "../mdsPaths.js";

/**
 * @returns {import("./index.js").ImageStorage}
 */
export function createBlobImageStorage() {
  return {
    async upload(originalName, buffer, mimeType) {
      const relPath = newImageRelPath(originalName);
      const contentType =
        mimeType || contentTypeForImagePath(relPath);
      await put(blobPathnameForImage(relPath), buffer, {
        access: "private",
        contentType,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      return { path: relPath, contentType };
    },

    async read(relPath) {
      const normalized = assertSafeImagePath(relPath);
      try {
        const result = await get(blobPathnameForImage(normalized), {
          access: "private",
          useCache: false,
        });
        if (result == null || result.statusCode !== 200 || result.stream == null) {
          return null;
        }
        const data = new Uint8Array(await new Response(result.stream).arrayBuffer());
        return {
          path: normalized,
          contentType: contentTypeForImagePath(normalized),
          data,
        };
      } catch (e) {
        const err = /** @type {Error & { status?: number; name?: string }} */ (e);
        if (err.status === 404 || err.name === "BlobNotFoundError") {
          return null;
        }
        throw e;
      }
    },
  };
}
