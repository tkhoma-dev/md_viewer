import { API_BASE } from "./api.js";

/**
 * @param {string | undefined | null} href
 * @returns {string | undefined | null}
 */
export function resolveImageUrl(href) {
  if (href == null || href === "") return href;
  const raw = String(href).trim();

  if (raw.startsWith("image/")) {
    return `${API_BASE}/mds/image?path=${encodeURIComponent(raw)}`;
  }

  if (raw.startsWith(`${API_BASE}/mds/image`)) {
    return raw;
  }

  if (raw.startsWith("/md_viewer/api/mds/image")) {
    return raw;
  }

  if (raw.startsWith("/api/mds/image")) {
    return `/md_viewer${raw}`;
  }

  return raw;
}
