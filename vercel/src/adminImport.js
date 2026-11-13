import { Router } from "express";
import express from "express";
import { assertSafeMdPath } from "./mdsPaths.js";
import { importFilesToStorage, importMarkdownDirToStorage } from "./importMds.js";

/**
 * @param {import("express").Request} req
 * @returns {boolean}
 */
function importSecretOk(req) {
  const secret = process.env.MDS_IMPORT_SECRET;
  if (!secret || !secret.trim()) {
    return false;
  }
  const header =
    req.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    req.get("x-mds-import-secret")?.trim();
  return header === secret;
}

/**
 * @param {import("./storage/index.js").MdsStorage} mdsStorage
 * @param {string} mdsDir
 */
export function createAdminMdsImportRouter(mdsStorage, mdsDir) {
  const router = Router();

  router.use(express.json({ limit: "12mb" }));

  router.use((req, res, next) => {
    if (!process.env.MDS_IMPORT_SECRET?.trim()) {
      res.status(503).json({
        error: "MDS_IMPORT_SECRET is not configured on the server",
      });
      return;
    }
    if (!importSecretOk(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (mdsStorage.backend !== "blob") {
      res.status(503).json({
        error: "Import targets Vercel Blob; set BLOB_READ_WRITE_TOKEN and redeploy",
      });
      return;
    }
    next();
  });

  /**
   * Read every .md under MDS_DIR (or default vercel/mds) and upload to Blob.
   * On Vercel, bundle mds/ once (vercel.json includeFiles) before removing from git.
   */
  router.post("/import-from-disk", async (_req, res) => {
    try {
      const result = await importMarkdownDirToStorage(mdsStorage, mdsDir);
      if (result.count === 0) {
        res.status(404).json({
          error: "no .md files found on disk",
          sourceDir: result.sourceDir,
        });
        return;
      }
      res.json({
        ok: true,
        mode: "import-from-disk",
        ...result,
      });
    } catch (e) {
      res.status(500).json({ error: String(/** @type {Error} */ (e).message) });
    }
  });

  /**
   * Bulk import: { "files": [ { "path": "a/b.md", "content": "..." }, ... ] }
   */
  router.post("/import", async (req, res) => {
    const raw = req.body?.files;
    if (!Array.isArray(raw) || raw.length === 0) {
      res.status(400).json({ error: "body must include non-empty files array" });
      return;
    }
    if (raw.length > 500) {
      res.status(400).json({ error: "at most 500 files per request" });
      return;
    }

    try {
      /** @type {Array<{ path: string, content: string }>} */
      const files = [];
      for (const item of raw) {
        if (typeof item?.path !== "string" || typeof item?.content !== "string") {
          res.status(400).json({
            error: "each file must have path and content strings",
          });
          return;
        }
        const path = assertSafeMdPath(item.path);
        files.push({ path, content: item.content });
      }

      const paths = await importFilesToStorage(mdsStorage, files);
      res.json({
        ok: true,
        mode: "import",
        count: paths.length,
        paths,
      });
    } catch (e) {
      const err = /** @type {Error} */ (e);
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
