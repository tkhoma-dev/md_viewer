import { getApiBaseCandidates, setResolvedApiBase, getResolvedApiBase } from '../config';
import { pushHttpDebug } from './httpDebug';

async function tryMdsList(base: string): Promise<boolean> {
  for (const suffix of ['/mds', '/mds/']) {
    const url = `${base}${suffix}`;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      const body = await res.text();
      pushHttpDebug({ url, status: res.status, body: body.slice(0, 400) });
      if (!res.ok) {
        continue;
      }
      const json = JSON.parse(body) as { tree?: unknown };
      if (json && Array.isArray(json.tree)) {
        setResolvedApiBase(base);
        return true;
      }
    } catch (e) {
      pushHttpDebug({
        url,
        status: 0,
        body: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return false;
}

export async function ensureApiBase(): Promise<string> {
  const cached = getResolvedApiBase();
  if (cached) {
    return cached;
  }

  for (const base of getApiBaseCandidates()) {
    const healthUrl = `${base}/health`;
    try {
      const hres = await fetch(healthUrl);
      const hbody = await hres.text();
      pushHttpDebug({
        url: healthUrl,
        status: hres.status,
        body: hbody.slice(0, 200),
      });
    } catch (e) {
      pushHttpDebug({
        url: healthUrl,
        status: 0,
        body: e instanceof Error ? e.message : String(e),
      });
    }

    if (await tryMdsList(base)) {
      return getResolvedApiBase() ?? base;
    }
  }

  throw new Error(
    'Could not reach MD API. Tap the API line at the bottom for request debug.',
  );
}
