import { useRef } from "react";

/** Last known editor selection (used when toolbar buttons would steal focus). */
function useEditorSelectionRef() {
  const selectionRef = useRef({ start: 0, end: 0 });
  const rememberSelection = (ta) => {
    if (!ta) return;
    selectionRef.current = {
      start: ta.selectionStart,
      end: ta.selectionEnd,
    };
  };
  const selectionForAction = (ta) => {
    if (!ta) return null;
    const liveStart = ta.selectionStart;
    const liveEnd = ta.selectionEnd;
    if (liveStart !== liveEnd) {
      return { start: liveStart, end: liveEnd };
    }
    const { start, end } = selectionRef.current;
    if (start !== end) {
      return { start, end };
    }
    return null;
  };
  return { rememberSelection, selectionForAction };
}
import { CollapseIcon } from "./icons.jsx";
import { insertInTextarea } from "../utils/insertInTextarea.js";
import { wrapMarkInTextarea } from "../utils/wrapMark.js";

export function EditorPane({
  collapsed,
  onExpand,
  selectedPath,
  draft,
  onDraftChange,
  editorScrollRef,
  onEditorScroll,
  onInsertImage,
  imageUploadState,
}) {
  const fileInputRef = useRef(null);
  const { rememberSelection, selectionForAction } = useEditorSelectionRef();

  const keepTextareaSelection = (event) => {
    event.preventDefault();
  };
  return (
    <section
      className={
        collapsed
          ? "flex h-11 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm lg:h-auto lg:min-h-0 lg:w-12 lg:min-w-12 lg:max-w-12 lg:flex-shrink-0"
          : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:basis-0"
      }
    >
      {collapsed ? (
        <button
          type="button"
          className="flex h-full w-full flex-row items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200/80 lg:flex-col lg:py-3"
          onClick={onExpand}
          title="Expand editor"
        >
          <CollapseIcon direction="right" />
          <span className="max-w-[8rem] truncate sm:max-w-none lg:max-w-none lg:[writing-mode:vertical-rl] lg:rotate-180">
            Editor
          </span>
        </button>
      ) : (
        <>
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm text-slate-500">
              {selectedPath ? selectedPath : "Select a file"}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file || !onInsertImage) return;
                  const ta = editorScrollRef?.current;
                  const sel = selectionForAction(ta);
                  const result = await onInsertImage(
                    file,
                    sel?.start,
                    sel?.end,
                  );
                  if (!result) return;
                  const { nextValue, cursor } = insertInTextarea(
                    draft,
                    result.selectionStart,
                    result.selectionEnd,
                    result.snippet,
                  );
                  onDraftChange(nextValue);
                  requestAnimationFrame(() => {
                    if (ta) {
                      ta.focus();
                      ta.setSelectionRange(cursor, cursor);
                    }
                  });
                }}
              />
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!selectedPath || imageUploadState === "uploading"}
                onMouseDown={keepTextareaSelection}
                onClick={() => fileInputRef.current?.click()}
                title="Upload image to storage and insert markdown"
              >
                {imageUploadState === "uploading" ? "Uploading…" : "Image"}
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!selectedPath}
                onMouseDown={keepTextareaSelection}
                onClick={() => {
                  const ta = editorScrollRef?.current;
                  if (!ta) return;
                  const sel = selectionForAction(ta);
                  if (!sel) return;
                  const result = wrapMarkInTextarea(
                    draft,
                    sel.start,
                    sel.end,
                  );
                  if (!result) return;
                  onDraftChange(result.nextValue);
                  requestAnimationFrame(() => {
                    ta.focus();
                    ta.setSelectionRange(result.cursor, result.cursor);
                  });
                }}
                title="Wrap selection in highlight (mark) — shown in preview; save to keep"
              >
                Mark
              </button>
            </div>
          </div>
          <textarea
            ref={editorScrollRef}
            className="min-h-0 w-full flex-1 resize-none overflow-auto rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 shadow-inner outline-none ring-sky-500/30 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            value={draft}
            onScroll={onEditorScroll}
            onSelect={(e) => rememberSelection(e.currentTarget)}
            onKeyUp={(e) => rememberSelection(e.currentTarget)}
            onMouseUp={(e) => rememberSelection(e.currentTarget)}
            onBlur={(e) => rememberSelection(e.currentTarget)}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={
              selectedPath ? "Edit markdown…" : "Pick a file from the list"
            }
            spellCheck={false}
            disabled={!selectedPath}
          />
        </>
      )}
    </section>
  );
}
