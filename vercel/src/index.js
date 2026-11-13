import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createAdminMdsImportRouter } from "./adminImport.js";
import { createMdsRouter } from "./mds.js";
import { createMdsStorage } from "./storage/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = Number(process.env.PORT) || 3000;

const mdsDir = process.env.MDS_DIR || path.join(__dirname, "..", "mds");
const mdsStorage = createMdsStorage({ mdsDir });

app.use(express.json({ limit: "2mb" }));

// Docker nginx strips this prefix before proxying. Vercel forwards the
// browser path (/md_viewer/api/...) straight to this app.
app.use((req, _res, next) => {
  if (req.url === "/md_viewer" || req.url.startsWith("/md_viewer/")) {
    req.url = req.url.slice("/md_viewer".length) || "/";
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "md-viewer-server",
    vercel: Boolean(process.env.VERCEL),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    mdsImportEndpointConfigured: Boolean(process.env.MDS_IMPORT_SECRET?.trim()),
    mds: {
      backend: mdsStorage.backend,
      location: mdsStorage.location,
      filesystemDir: mdsStorage.backend === "filesystem" ? mdsDir : undefined,
      filesystemExists:
        mdsStorage.backend === "filesystem" ? fs.existsSync(mdsDir) : undefined,
    },
  });
});

app.use("/api/mds", createMdsRouter(mdsStorage));
app.use(
  "/api/admin/mds",
  createAdminMdsImportRouter(mdsStorage, mdsDir),
);

export default app;

if (!process.env.VERCEL) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on ${port} (mds: ${mdsStorage.backend})`);
  });
}
