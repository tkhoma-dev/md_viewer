import { useCallback, useRef, useState } from "react";
import { dataTransferHasFiles } from "../utils/dropMarkdownFiles.js";
import { INTERNAL_DRAG_TYPE } from "../utils/parentFolder.js";
import { FileTree } from "./FileTree.jsx";

function uploadStatusText(uploadState) {
  if (uploadState === "uploading") return "Uploading…";
  if (typeof uploadState === "string" && uploadState.startsWith("uploaded:")) {
    const n = uploadState.slice("uploaded:".length);
    return `Saved ${n} file${n === "1" ? "" : "s"} to storage`;
  }
  if (uploadState && uploadState !== "uploading") {
    return uploadState;
  }
  return null;
}

export function FilesSidebar({
  tree,
  selectedPath,
  onSelect,
  loadError,
  onUploadToFolder,
  uploadState,
  treeActionState,
  onCreateFolder,
  onCreateSubfolder,
  onMoveFile,
  onDeleteFolder,
}) {
  const depthRef = useRef(0);
  const [rootOver, setRootOver] = useState(false);
  const statusText = uploadStatusText(uploadState) || treeActionState;
  const statusIsError =
    statusText &&
    uploadState !== "uploading" &&
    !String(uploadState).startsWith("uploaded:") &&
    ![
      "creating…",
      "moving…",
      "deleting folder…",
      "Folder created",
      "Moved",
      "Folder deleted",
    ].includes(statusText);

  const onRootDragEnter = useCallback((e) => {
    const hasInternal = e.dataTransfer.types.includes(INTERNAL_DRAG_TYPE);
    const hasFiles = dataTransferHasFiles(e.dataTransfer);
    if (!hasInternal && !hasFiles) return;
    e.preventDefault();
    depthRef.current += 1;
    setRootOver(true);
  }, []);

  const onRootDragOver = useCallback((e) => {
    const hasInternal = e.dataTransfer.types.includes(INTERNAL_DRAG_TYPE);
    const hasFiles = dataTransferHasFiles(e.dataTransfer);
    if (!hasInternal && !hasFiles) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = hasInternal ? "move" : "copy";
  }, []);

  const onRootDragLeave = useCallback((e) => {
    e.preventDefault();
    depthRef.current -= 1;
    if (depthRef.current <= 0) {
      depthRef.current = 0;
      setRootOver(false);
    }
  }, []);

  const onRootDrop = useCallback(
    (e) => {
      const from = e.dataTransfer.getData(INTERNAL_DRAG_TYPE);
      if (from) {
        e.preventDefault();
        depthRef.current = 0;
        setRootOver(false);
        onMoveFile?.(from, "");
        return;
      }
      if (dataTransferHasFiles(e.dataTransfer)) {
        e.preventDefault();
        depthRef.current = 0;
        setRootOver(false);
        onUploadToFolder(e.dataTransfer, "");
      }
    },
    [onMoveFile, onUploadToFolder],
  );

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-800">Files</h2>
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={onCreateFolder}
          title="Create folder at root or inside selected file's parent"
        >
          New folder
        </button>
      </div>
      <p className="mb-2 shrink-0 text-xs text-slate-500">
        Drop .md files to upload. Drag a file onto a folder (or the root) to
        move it. Use + on a folder for a subfolder.
      </p>
      {statusText && (
        <p
          className={
            statusIsError
              ? "mb-2 shrink-0 text-xs text-red-700"
              : "mb-2 shrink-0 text-xs text-emerald-700"
          }
        >
          {statusText}
        </p>
      )}
      <div
        className={`min-h-0 flex-1 overflow-auto rounded-lg border border-dashed p-2 transition ${
          rootOver
            ? "border-sky-400 bg-sky-50"
            : "border-slate-200 bg-slate-50/50"
        }`}
        onDragEnter={onRootDragEnter}
        onDragOver={onRootDragOver}
        onDragLeave={onRootDragLeave}
        onDrop={onRootDrop}
      >
        <FileTree
          tree={tree}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onUploadToFolder={onUploadToFolder}
          onCreateSubfolder={onCreateSubfolder}
          onMoveFile={onMoveFile}
          onDeleteFolder={onDeleteFolder}
        />
        {tree.length === 0 && !loadError && (
          <p className="text-sm text-slate-500">
            No files yet. Create a folder or drop markdown here.
          </p>
        )}
      </div>
    </aside>
  );
}
