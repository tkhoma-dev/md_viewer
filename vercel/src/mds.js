import { Router } from "express";
import { assertSafeMdPath } from "./mdsPaths.js";

/**
 * @param {import("./storage/index.js").MdsStorage} mdsStorage
 */
export function createMdsRouter(mdsStorage) {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const tree = await mdsStorage.buildTree();
      res.json({ tree });
    } catch (e) {
      res.status(500).json({ error: String(/** @type {Error} */ (e).message) });
    }
  });

  router.get("/file", async (req, res) => {
    const rel = req.query.path;
    if (typeof rel !== "string") {
      res.status(400).json({ error: "query path is required" });
      return;
    }
    try {
      const normalized = assertSafeMdPath(rel);
      const content = await mdsStorage.readFile(normalized);
      if (content == null) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.json({ path: normalized, content });
    } catch (e) {
      const err = /** @type {Error} */ (e);
      res.status(400).json({ error: err.message });
    }
  });

  router.put("/file", async (req, res) => {
    const rel = req.body?.path;
    const content = req.body?.content;
    if (typeof rel !== "string" || typeof content !== "string") {
      res.status(400).json({ error: "body must include path and content strings" });
      return;
    }
    try {
      const normalized = assertSafeMdPath(rel);
      await mdsStorage.writeFile(normalized, content);
      res.json({ ok: true, path: normalized });
    } catch (e) {
      const err = /** @type {Error} */ (e);
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
