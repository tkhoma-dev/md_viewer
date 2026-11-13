/**
 * @param {string} relativePath e.g. `folder/note.md`
 * @param {string} content
 */
export function downloadMarkdownFile(relativePath, content) {
  const base = relativePath.replace(/\\/g, "/").split("/").pop() || "document.md";
  const blob = new Blob([content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = base.endsWith(".md") ? base : `${base}.md`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
