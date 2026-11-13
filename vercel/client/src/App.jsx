import { useState } from "react";
import { ActionFooter } from "./components/ActionFooter.jsx";
import { EditorPane } from "./components/EditorPane.jsx";
import { FilesSidebar } from "./components/FilesSidebar.jsx";
import { PreviewPane } from "./components/PreviewPane.jsx";
import { SidebarResizeHandle } from "./components/SidebarResizeHandle.jsx";
import { useMarkdownFiles } from "./hooks/useMarkdownFiles.js";
import { useResizableSidebarWidth } from "./hooks/useResizableSidebarWidth.js";
import { useScrollSync } from "./hooks/useScrollSync.js";

export default function App() {
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  const {
    editorScrollRef,
    previewScrollRef,
    handleEditorScroll,
    handlePreviewScroll,
    resetScroll,
  } = useScrollSync();

  const {
    tree,
    selectedPath,
    setSelectedPath,
    draft,
    setDraft,
    loadError,
    saveState,
    isDirty,
    deleteState,
    refreshList,
    save,
    download,
    remove,
    uploadDroppedFiles,
    uploadState,
    createFolderNearSelection,
    createFolderAt,
    moveFileToFolder,
    deleteFolderAt,
    treeActionState,
  } = useMarkdownFiles({ onFileLoaded: resetScroll });

  const {
    sidebarWidth,
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp,
    onResizeDoubleClick,
  } = useResizableSidebarWidth();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-50 px-4 pb-4 pt-4 text-slate-900 antialiased sm:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-[140rem] flex-1 flex-col">
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">
            MD Viewer
          </h1>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={refreshList}
          >
            Refresh list
          </button>
        </header>

        {loadError && (
          <p className="mb-4 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {loadError}
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-1">
          <div
            className="flex min-h-0 w-full min-w-0 flex-col lg:w-[var(--files-sidebar-w)] lg:max-w-[50vw] lg:shrink-0"
            style={{ "--files-sidebar-w": `${sidebarWidth}px` }}
          >
            <FilesSidebar
              tree={tree}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              loadError={loadError}
              onUploadToFolder={uploadDroppedFiles}
              uploadState={uploadState}
              treeActionState={treeActionState}
              onCreateFolder={createFolderNearSelection}
              onCreateSubfolder={createFolderAt}
              onMoveFile={moveFileToFolder}
              onDeleteFolder={deleteFolderAt}
            />
          </div>

          <SidebarResizeHandle
            width={sidebarWidth}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onDoubleClick={onResizeDoubleClick}
          />

          <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-3">
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-4">
              <EditorPane
                collapsed={editorCollapsed}
                onExpand={() => setEditorCollapsed(false)}
                selectedPath={selectedPath}
                draft={draft}
                onDraftChange={setDraft}
                editorScrollRef={editorScrollRef}
                onEditorScroll={handleEditorScroll}
              />
              <PreviewPane
                collapsed={previewCollapsed}
                onExpand={() => setPreviewCollapsed(false)}
                selectedPath={selectedPath}
                draft={draft}
                previewScrollRef={previewScrollRef}
                onPreviewScroll={handlePreviewScroll}
              />
            </div>

            <ActionFooter
              editorCollapsed={editorCollapsed}
              previewCollapsed={previewCollapsed}
              onCollapseEditor={() => setEditorCollapsed(true)}
              onCollapsePreview={() => setPreviewCollapsed(true)}
              selectedPath={selectedPath}
              onSave={save}
              saveState={saveState}
              isDirty={isDirty}
              onDownload={download}
              onDelete={remove}
              deleteState={deleteState}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
