import { getApiBase } from '../config';
import type { TreeNode } from '../types';

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error) {
      return String(data.error);
    }
  } catch {
  }
  return `HTTP ${res.status}`;
}

export async function fetchMdsTree(): Promise<TreeNode[]> {
  const res = await fetch(`${getApiBase()}/mds`);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const data = (await res.json()) as { tree?: TreeNode[] };
  return data.tree ?? [];
}

export async function fetchMdFile(path: string): Promise<string> {
  const url = `${getApiBase()}/mds/file?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const data = (await res.json()) as { content?: string };
  return data.content ?? '';
}
