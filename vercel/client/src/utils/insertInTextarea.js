/**
 * @param {string} value
 * @param {number | null | undefined} selectionStart
 * @param {number | null | undefined} selectionEnd
 * @param {string} insert
 */
export function insertInTextarea(value, selectionStart, selectionEnd, insert) {
  const start = selectionStart ?? value.length;
  const end = selectionEnd ?? start;
  return {
    nextValue: value.slice(0, start) + insert + value.slice(end),
    cursor: start + insert.length,
  };
}
