import { API_BASE } from "./api.js";

export async function deleteMarkdownFile(path) {
  const r = await fetch(`${API_BASE}/mds/file`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `delete failed: ${r.status}`);
  return body;
}
