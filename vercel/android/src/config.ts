/**
 * Remote API for markdown list/read.
 *
 * Local USB: `adb reverse tcp:3000 tcp:3000`, set USE_LOCAL_API true.
 */

const DEPLOY_ORIGIN = 'https://md-viewer-3ub2.vercel.app';

/** Production list: …/md_viewer/api/mds */
export const PRODUCTION_API = `${DEPLOY_ORIGIN}/md_viewer/api`;

const LOCAL_USB_API = 'http://127.0.0.1:3000/md_viewer/api';

/** Set true when using adb reverse and a local `vercel` server. */
export const USE_LOCAL_API = false;

let resolvedApiBase: string | null = null;

export function getResolvedApiBase(): string | null {
  return resolvedApiBase;
}

export function setResolvedApiBase(base: string): void {
  resolvedApiBase = base.replace(/\/$/, '');
}

export function clearResolvedApiBase(): void {
  resolvedApiBase = null;
}

export function getApiBase(): string {
  const override = (globalThis as { __MD_VIEWER_API__?: string })
    .__MD_VIEWER_API__;
  if (override) {
    return override.replace(/\/$/, '');
  }
  if (resolvedApiBase) {
    return resolvedApiBase;
  }
  return (USE_LOCAL_API ? LOCAL_USB_API : PRODUCTION_API).replace(/\/$/, '');
}

/** Order matters: first match wins during probe. */
export function getApiBaseCandidates(): string[] {
  const override = (globalThis as { __MD_VIEWER_API__?: string })
    .__MD_VIEWER_API__;
  const localBases = USE_LOCAL_API ? [LOCAL_USB_API] : [];
  const bases = [
    ...(override ? [override] : []),
    ...localBases,
    PRODUCTION_API,
    `${DEPLOY_ORIGIN}/api`,
  ];
  return [...new Set(bases.map(b => b.replace(/\/$/, '')))];
}
