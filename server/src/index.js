import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createMdsRouter } from "./mds.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = Number(process.env.PORT) || 3000;

const mdsDir = process.env.MDS_DIR || path.join(__dirname, "..", "mds");

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
    mdsDir,
    mdsExists: fs.existsSync(mdsDir),
    vercel: Boolean(process.env.VERCEL),
  });
});

app.use("/api/mds", createMdsRouter(mdsDir));

export default app;

if (!process.env.VERCEL) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on ${port}`);
  });
}
