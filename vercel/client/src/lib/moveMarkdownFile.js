import { API_BASE } from "./api.js";

export async function moveMarkdownFile(from, to) {
  const r = await fetch(`${API_BASE}/mds/file/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `move failed: ${r.status}`);
  return body;
}
