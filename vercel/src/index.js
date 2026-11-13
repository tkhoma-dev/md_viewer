import express from "express";
import { createMdsRouter } from "./mds.js";
import { createMdsStorage } from "./storage/index.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

const mdsStorage = createMdsStorage();

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
    blobConfigured: true,
    mds: {
      backend: mdsStorage.backend,
      location: mdsStorage.location,
    },
  });
});

app.use("/api/mds", createMdsRouter(mdsStorage));

export default app;

if (!process.env.VERCEL) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on ${port} (mds: ${mdsStorage.backend})`);
  });
}
