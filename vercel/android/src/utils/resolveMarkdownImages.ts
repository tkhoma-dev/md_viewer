import { getApiBase } from '../config';

/** Host origin derived from resolved API base (`…/md_viewer/api` or `…/api`). */
export function getApiOrigin(): string {
  const base = getApiBase();
  if (base.endsWith('/md_viewer/api')) {
    return base.slice(0, -'/md_viewer/api'.length);
  }
  if (base.endsWith('/api')) {
    return base.slice(0, -'/api'.length);
  }
  return base;
}

/** Turn web-relative or storage paths into absolute image URLs for React Native. */
export function resolveImageUrl(href: string): string {
  const raw = href.trim();
  if (!raw) {
    return raw;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const origin = getApiOrigin();
  if (raw.startsWith('/md_viewer/api/mds/image')) {
    return `${origin}${raw}`;
  }
  if (raw.startsWith('/api/mds/image')) {
    return `${origin}/md_viewer${raw}`;
  }
  if (raw.startsWith('/md_viewer/api/') || raw.startsWith('/api/')) {
    return `${origin}${raw}`;
  }
  if (raw.startsWith('/')) {
    return `${origin}${raw}`;
  }
  if (raw.startsWith('image/')) {
    return `${getApiBase()}/mds/image?path=${encodeURIComponent(raw)}`;
  }
  return raw;
}

/** Rewrite `![alt](url)` image targets for mobile rendering. */
export function resolveMarkdownImageUrls(md: string): string {
  return md.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, alt, href) => {
    return `![${alt}](${resolveImageUrl(href)})`;
  });
}
