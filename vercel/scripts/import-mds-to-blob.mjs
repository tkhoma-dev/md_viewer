#!/usr/bin/env node
/**
 * Upload every .md file under vercel/mds/ to Vercel Blob (prefix `mds/`).
 *
 * Requires BLOB_READ_WRITE_TOKEN in the environment (from Vercel → Storage → Blob).
 *
 * Usage:
 *   cd vercel
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_... npm run import-mds-to-blob
 */
import path from "path";
import { fileURLToPath } from "url";
import { createMdsStorage } from "../src/storage/index.js";
import { importMarkdownDirToStorage } from "../src/importMds.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdsRoot = path.resolve(__dirname, "..", "mds");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Set BLOB_READ_WRITE_TOKEN (Vercel Blob read/write token).");
  process.exit(1);
}

const storage = createMdsStorage({ mdsDir: mdsRoot });
if (storage.backend !== "blob") {
  console.error("Expected blob backend (check BLOB_READ_WRITE_TOKEN).");
  process.exit(1);
}

const result = await importMarkdownDirToStorage(storage, mdsRoot);
if (result.count === 0) {
  console.error(`No .md files under ${mdsRoot}`);
  process.exit(1);
}

console.log(`Uploaded ${result.count} file(s):`);
for (const p of result.paths) {
  console.log(`  mds/${p}`);
}
console.log("Done.");
