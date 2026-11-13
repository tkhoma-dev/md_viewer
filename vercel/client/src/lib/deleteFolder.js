import { API_BASE } from "./api.js";

/** @param {string} folderPath */
export async function deleteFolder(folderPath) {
  const res = await fetch(`${API_BASE}/mds/folder`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: folderPath }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `delete folder failed: ${res.status}`);
  }
  return data;
}
