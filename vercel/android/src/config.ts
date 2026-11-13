/**
 * Remote API for markdown list/read (read-only mobile client).
 *
 * Production default matches Vercel routing (`/md_viewer/api/...`).
 * Local API on a device via USB: `adb reverse tcp:3000 tcp:3000`, then set USE_LOCAL_API below.
 */

const PRODUCTION_API = 'https://md-viewer-pied.vercel.app/md_viewer/api';

/** After `adb reverse tcp:3000 tcp:3000`, Node API on the host at port 3000. */
const LOCAL_USB_API = 'http://127.0.0.1:3000/md_viewer/api';

/** Set true when using adb reverse and a local `vercel` server. */
const USE_LOCAL_API = false;

export function getApiBase(): string {
  const override = (globalThis as { __MD_VIEWER_API__?: string })
    .__MD_VIEWER_API__;
  if (override) {
    return override.replace(/\/$/, '');
  }
  return (USE_LOCAL_API ? LOCAL_USB_API : PRODUCTION_API).replace(/\/$/, '');
}
