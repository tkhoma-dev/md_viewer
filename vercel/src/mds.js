import { Router } from "express";
import multer from "multer";
import {
  createFolder,
  deleteFolder,
  moveMarkdownFile,
  pruneEmptyFolder,
} from "./mdsFileOps.js";
import {
  assertSafeFolderPath,
  assertSafeMdPath,
  assertSafeImagePath,
  isHiddenFromFileTree,
  parentFolderPath,
} from "./mdsPaths.js";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

/**
 * @param {import("./storage/index.js").MdsStorage} mdsStorage
 * @param {import("./storage/index.js").ImageStorage} imageStorage
 */
export function createMdsRouter(mdsStorage, imageStorage) {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const tree = await mdsStorage.buildTree();
      res.json({ tree });
    } catch (e) {
      res.status(500).json({ error: String(/** @type {Error} */ (e).message) });
    }
  });

  router.post("/image", imageUpload.single("file"), async (req, res) => {
    if (!req.file?.buffer?.length) {
      res.status(400).json({ error: "multipart file field is required" });
      return;
    }
    try {
      const result = await imageStorage.upload(
        req.file.originalname,
        req.file.buffer,
        req.file.mimetype,
      );
      res.status(201).json({
        ok: true,
        path: result.path,
        url: `/api/mds/image?path=${encodeURIComponent(result.path)}`,
      });
    } catch (e) {
      const err = /** @type {Error} */ (e);
      res.status(400).json({ error: err.message });
    }
  });

  router.get("/image", async (req, res) => {
    const rel = req.query.path;
    if (typeof rel !== "string") {
      res.status(400).json({ error: "query path is required" });
      return;
    }
    try {
      const normalized = assertSafeImagePath(rel);
      const asset = await imageStorage.read(normalized);
      if (asset == null) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.setHeader("Content-Type", asset.contentType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.send(Buffer.from(asset.data));
    } catch (e) {
      const err = /** @type {Error} */ (e);
      res.status(400).json({ error: err.message });
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
      if (isHiddenFromFileTree(normalized)) {
        res.status(400).json({ error: "invalid path" });
        return;
      }
      await mdsStorage.writeFile(normalized, content);
      res.json({ ok: true, path: normalized });
    } catch (e) {
      const err = /** @type {Error} */ (e);
      res.status(400).json({ error: err.message });
    }
  });

  router.delete("/folder", async (req, res) => {
    const rel = req.body?.path ?? req.query.path;
    if (typeof rel !== "string" || !rel.trim()) {
      res.status(400).json({ error: "folder path is required (query or JSON body)" });
      return;
    }
    try {
      const folderPath = assertSafeFolderPath(rel.trim());
      const result = await deleteFolder(mdsStorage, folderPath);
      res.json({ ok: true, ...result });
    } catch (e) {
      const err = /** @type {Error & { status?: number }} */ (e);
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/folder", async (req, res) => {
    const parent =
      typeof req.body?.parent === "string" ? req.body.parent.trim() : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      res.status(400).json({ error: "body must include folder name" });
      return;
    }
    try {
      const parentNorm = parent ? assertSafeFolderPath(parent) : "";
      const folderPath = parentNorm ? `${parentNorm}/${name}` : name;
      assertSafeFolderPath(folderPath);
      const result = await createFolder(mdsStorage, folderPath);
      res.status(201).json({ ok: true, ...result });
    } catch (e) {
      const err = /** @type {Error & { status?: number }} */ (e);
      const status = err.status === 409 ? 409 : 400;
      res.status(status).json({ error: err.message });
    }
  });

  router.post("/file/move", async (req, res) => {
    const from = req.body?.from;
    const to = req.body?.to;
    if (typeof from !== "string" || typeof to !== "string") {
      res.status(400).json({
        error: "body must include from and to path strings",
      });
      return;
    }
    try {
      const result = await moveMarkdownFile(mdsStorage, from, to);
      res.json({ ok: true, ...result });
    } catch (e) {
      const err = /** @type {Error & { status?: number }} */ (e);
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.status === 409) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err.message });
    }
  });

  router.delete("/file", async (req, res) => {
    const rel = req.body?.path ?? req.query.path;
    if (typeof rel !== "string") {
      res.status(400).json({ error: "path is required (query or JSON body)" });
      return;
    }
    try {
      const normalized = assertSafeMdPath(rel);
      const existing = await mdsStorage.readFile(normalized);
      if (existing == null) {
        res.status(404).json({ error: "not found" });
        return;
      }
      await mdsStorage.deleteFile(normalized);
      const parent = parentFolderPath(normalized);
      if (parent) {
        await pruneEmptyFolder(mdsStorage, parent);
      }
      res.json({ ok: true, path: normalized, deleted: true });
    } catch (e) {
      const err = /** @type {Error} */ (e);
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
