import { insertInTextarea } from "./insertInTextarea.js";

/**
 * Wrap the current textarea selection in `<mark>…</mark>` for preview highlighting.
 * @returns {{ nextValue: string, cursor: number } | null}
 */
export function wrapMarkInTextarea(value, selectionStart, selectionEnd) {
  const start = selectionStart ?? 0;
  const end = selectionEnd ?? start;
  if (start === end) {
    return null;
  }
  const selected = value.slice(start, end);
  const insert = `<mark>${selected}</mark>`;
  return insertInTextarea(value, start, end, insert);
}
