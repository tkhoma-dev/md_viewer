# MD Viewer

React (Vite) frontend in `client/`, Node (Express) API in `server/`, and an **nginx** reverse proxy so everything is reachable under **`http://localhost/md_viewer/`**.

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) with the **Compose plugin** (`docker compose version` should work). Legacy `docker-compose` (hyphen) is not required if you use `docker compose` (space).

## Run with Docker Compose

From the project root (`md_viewer/`, where `docker-compose.yml` lives):

### Build and start (foreground)

Logs from all services stream to the terminal. Press **Ctrl+C** to stop containers.

```bash
docker compose up --build
```

`--build` rebuilds images when you change Dockerfiles or app code copied into the image. Omit `--build` if images are already up to date:

```bash
docker compose up
```

### Run in the background

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop and remove containers (keeps images and named volumes, if any):

```bash
docker compose down
```

### Build images only

```bash
docker compose build
```

## After it is running

| What | URL |
|------|-----|
| Web app | http://localhost/md_viewer/ |
| API example | http://localhost/md_viewer/api/health |

The Compose file maps host **port 80** to nginx. If something else already uses port 80, change `docker-compose.yml` under the `nginx` service, for example:

```yaml
ports:
  - "8080:80"
```

Then use **http://localhost:8080/md_viewer/** (and the same host/port for API paths under `/md_viewer/api/`).

## Services (Compose)

- **nginx** — Public entrypoint; proxies `/md_viewer/` to the client container and `/md_viewer/api/` to the server.
- **client** — Built static assets served by nginx inside that container.
- **server** — Express on port 3000 (internal to the Compose network).

### Markdown storage

| Environment | Backend |
|-------------|---------|
| **Vercel** (production) | **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set — each file is stored as `mds/<relative-path>.md` |
| **Local / Docker** | Filesystem: **`./mds`** bind-mounted as `/data/mds` when the Blob token is **not** set |

On Vercel the deployment disk is read-only, so saves go to Blob, not to `mds/` in the repo.

#### One-time import from `mds/` into Blob

1. In Vercel: **Storage → Blob**, create a store.
2. Add environment variables (Production, and Preview if needed):
   - **`BLOB_READ_WRITE_TOKEN`** — from the Blob store
   - **`MDS_IMPORT_SECRET`** — a long random string you choose (protects import endpoints)
3. Redeploy so the server uses Blob.

**Option A — import on Vercel (HTTP, good when you cannot run CLI against prod)**

While `vercel/mds/` still exists in the repo, temporarily add to `vercel.json` under the Node build:

```json
"config": { "includeFiles": "mds/**" }
```

Deploy, then call (replace host and secret):

```bash
curl -sS -X POST "https://YOUR_APP.vercel.app/api/admin/mds/import-from-disk" \
  -H "Authorization: Bearer YOUR_MDS_IMPORT_SECRET"
```

Response example: `{ "ok": true, "count": 12, "paths": ["..."], "sourceDir": "..." }`.

Then remove `includeFiles` and delete **`vercel/mds/`** from git; redeploy again.

**Option B — import from your laptop (CLI)**

```bash
cd vercel
npm install
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
npm run import-mds-to-blob
# or: make import-mds-to-blob
```

**Option C — bulk JSON (no `mds/` on server)**

```bash
curl -sS -X POST "https://YOUR_APP.vercel.app/api/admin/mds/import" \
  -H "Authorization: Bearer YOUR_MDS_IMPORT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"files":[{"path":"notes.md","content":"# Hello\n"}]}'
```

4. Check **`GET /api/health`** — `blobConfigured: true`, `mds.backend: "blob"`, and tree at **`GET /api/mds`**.

Import routes (require **`MDS_IMPORT_SECRET`** + **`BLOB_READ_WRITE_TOKEN`**):

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/admin/mds/import-from-disk` | Upload all `.md` under `MDS_DIR` / bundled `mds/` |
| `POST` | `/api/admin/mds/import` | Body `{ "files": [{ "path", "content" }] }` (max 500) |

You can send the secret as `Authorization: Bearer …` or header **`X-Mds-Import-Secret`**.

Local Docker can keep using `./mds` until you set `BLOB_READ_WRITE_TOKEN` on the server service (optional).

API (also proxied under `/md_viewer/api/…` in the browser):

- `GET /api/mds` — folder tree (`tree`: nested `dir` / `file` nodes).
- `GET /api/mds/file?path=…` — read one file.
- `PUT /api/mds/file` — JSON `{ "path": "…", "content": "…" }` to save (filesystem or Blob).

## Local development (without Docker)

```bash
# API
cd server && npm install && PORT=3000 npm start

# Frontend (another terminal)
cd client && npm install && npm run dev
```

Use the URL Vite prints; with `base: '/md_viewer/'`, paths like `http://localhost:5173/md_viewer/` match production routing. The browser will call `/md_viewer/api/...`; you may need a Vite dev proxy to the API or run requests against a Compose stack for API during UI work.
