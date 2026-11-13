import { API_BASE } from "./api.js";

export async function createFolder({ parent = "", name }) {
  const r = await fetch(`${API_BASE}/mds/folder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parent, name }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `create folder failed: ${r.status}`);
  return body;
}
