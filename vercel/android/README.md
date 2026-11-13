# MD Viewer (React Native)

**Read-only** Android client: browse the markdown **file tree** and **view** rendered files. No create, edit, move, or delete.

Data comes from the same API as the web app (`GET /api/mds`, `GET /api/mds/file?path=…`).

## API URL

Default production base is in [`src/config.ts`](src/config.ts):

`https://md-viewer-pied.vercel.app/md_viewer/api`

For a **local** Vercel/Express server on your machine (USB debugging):

1. `adb reverse tcp:3000 tcp:3000` (forwards device port 3000 → host 3000)
2. Set `USE_LOCAL_API = true` in `src/config.ts`
3. Run the API on the host (`cd vercel && npm start`)

## Prerequisites

- Node.js **≥ 22.11** (see `package.json` `engines`)
- [React Native environment](https://reactnative.dev/docs/set-up-your-environment)

## Run on Android

| Make target | What it does |
|-------------|----------------|
| `make start` | Metro bundler |
| `make build-debug` | Debug APK with bundled JS (`android/app/build/outputs/apk/debug/app-debug.apk`) |
| `make install-debug` | Build and install APK (no Metro) |
| `make clean` | Gradle clean |

```bash
cd vercel/android
npm install
make install-debug          # offline-style install
# or dev with Metro:
make start                  # terminal 1
npm run android             # terminal 2
```

## UI

- **Phone:** file tree → tap a `.md` file → rendered preview; **← Files** returns to the tree.
- **Wide screen (tablet / landscape):** tree and preview side by side.
- Pull down on the tree to refresh.

## Layout

| Path | Role |
|------|------|
| `src/ViewerApp.tsx` | Main screen |
| `src/components/FileTree.tsx` | Collapsible tree (view only) |
| `src/components/MarkdownPreview.tsx` | Rendered markdown |
| `src/api/mds.ts` | List + read API calls |
| `android/` | Native Android project |
