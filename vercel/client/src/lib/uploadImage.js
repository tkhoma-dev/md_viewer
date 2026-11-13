import { API_BASE } from "./api.js";

/** @param {File} file */
export async function uploadMarkdownImage(file) {
  const body = new FormData();
  body.append("file", file, file.name);
  const res = await fetch(`${API_BASE}/mds/image`, {
    method: "POST",
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `upload failed: ${res.status}`);
  }
  return data;
}

/** @param {string} imagePath from API e.g. `image/uuid.png` */
export function imageUrlForMarkdown(imagePath) {
  return `${API_BASE}/mds/image?path=${encodeURIComponent(imagePath)}`;
}
