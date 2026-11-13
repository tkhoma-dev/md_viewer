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

### Markdown storage (Vercel Blob only)

There is **no `mds/` folder in the repo**. All list / read / write goes to **Vercel Blob** under keys `mds/<relative-path>.md`.

**Required environment variable:**

- **`BLOB_READ_WRITE_TOKEN`** — on Vercel, in Docker, and for `npm start` locally

Add or upload markdown via the web UI (drag-and-drop) or `PUT /api/mds/file`.

#### Docker Compose

Create `vercel/.env` (gitignored):

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Then `make up`. The server container does **not** mount a local `mds/` volume.

#### Health check

`GET /api/health` should show `mds.backend: "blob"` and `blobConfigured: true`.

API (also proxied under `/md_viewer/api/…` in the browser):

- `GET /api/mds` — folder tree from Blob (`tree`: nested `dir` / `file` nodes).
- `GET /api/mds/file?path=…` — read one file.
- `PUT /api/mds/file` — JSON `{ "path": "…", "content": "…" }` to save to Blob.
- `DELETE /api/mds/file` — JSON `{ "path": "…" }` (or `?path=…`) to remove the blob permanently.
- `POST /api/mds/folder` — JSON `{ "parent": "optional/parent", "name": "folder-name" }` creates an empty folder (stores a hidden `…/_folder.md` marker in Blob).
- `DELETE /api/mds/folder` — JSON `{ "path": "folder/path" }` removes the folder and all markdown blobs under it.
- `POST /api/mds/file/move` — JSON `{ "from": "old/path.md", "to": "new/path.md" }` moves a file within Blob storage.

In the sidebar, use **New folder** (or **+** on a folder row). Drag a file onto a folder—or onto the dashed root area—to move it. The `_folder.md` markers are omitted from the tree UI.

## Local development (without Docker)

```bash
# API (requires BLOB_READ_WRITE_TOKEN)
cd vercel
npm install
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
npm start

# Frontend (another terminal)
cd vercel/client && npm install && npm run dev
```

Use the URL Vite prints; with `base: '/md_viewer/'`, paths like `http://localhost:5173/md_viewer/` match production routing. The browser will call `/md_viewer/api/...`; you may need a Vite dev proxy to the API or run requests against a Compose stack for API during UI work.
