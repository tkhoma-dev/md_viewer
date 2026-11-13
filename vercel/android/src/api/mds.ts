import type { TreeNode } from '../types';
import { ensureApiBase } from './ensureApi';
import { pushHttpDebug } from './httpDebug';

async function parseError(
  res: Response,
  url: string,
  bodyText: string,
): Promise<string> {
  try {
    const data = JSON.parse(bodyText) as { error?: string };
    if (data?.error) {
      return `${data.error} (${res.status})\n${url}`;
    }
  } catch {
    /* not JSON — likely Vercel HTML 404 */
  }
  const snippet = bodyText.replace(/\s+/g, ' ').trim().slice(0, 120);
  return `HTTP ${res.status} — ${url}${snippet ? `\n${snippet}` : ''}`;
}

async function fetchJson(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  const bodyText = await res.text();
  pushHttpDebug({ url, status: res.status, body: bodyText.slice(0, 400) });
  if (!res.ok) {
    throw new Error(await parseError(res, url, bodyText));
  }
  return new Response(bodyText, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function fetchMdsTree(): Promise<TreeNode[]> {
  const base = await ensureApiBase();
  const urls = [`${base}/mds/`, `${base}/mds`];
  let lastErr: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetchJson(url);
      const data = (await res.json()) as { tree?: TreeNode[] };
      return data.tree ?? [];
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('Failed to load file tree');
}

export async function fetchMdFile(path: string): Promise<string> {
  const base = await ensureApiBase();
  const url = `${base}/mds/file?path=${encodeURIComponent(path)}`;
  const res = await fetchJson(url);
  const data = (await res.json()) as { content?: string };
  return data.content ?? '';
}
