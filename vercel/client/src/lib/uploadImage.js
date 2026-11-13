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
