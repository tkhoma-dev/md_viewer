import { useCallback, useState } from "react";
import { dataTransferHasFiles } from "../utils/dropMarkdownFiles.js";
import { INTERNAL_DRAG_TYPE } from "../utils/parentFolder.js";
import { FileIcon, FolderIcon } from "./icons.jsx";

function dropHighlightClass(isOver) {
  return isOver
    ? "bg-sky-100 ring-2 ring-inset ring-sky-400"
    : "border-transparent";
}

function FileTreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
  onUploadToFolder,
  onCreateSubfolder,
  onMoveFile,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [dragOver, setDragOver] = useState(false);
  const pad = `${0.5 + depth * 0.75}rem`;

  const handleCombinedDrop = useCallback(
    (e) => {
      const from = e.dataTransfer.getData(INTERNAL_DRAG_TYPE);
      if (from) {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (node.type === "dir") {
          onMoveFile?.(from, node.path);
        }
        return;
      }
      if (node.type === "dir" && dataTransferHasFiles(e.dataTransfer)) {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        onUploadToFolder(e.dataTransfer, node.path);
      }
    },
    [node, onMoveFile, onUploadToFolder],
  );

  const handleDragOver = useCallback((e) => {
    const hasInternal = e.dataTransfer.types.includes(INTERNAL_DRAG_TYPE);
    const hasFiles = dataTransferHasFiles(e.dataTransfer);
    if (!hasInternal && !(node.type === "dir" && hasFiles)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = hasInternal ? "move" : "copy";
    setDragOver(true);
  }, [node.type]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  if (node.type === "file") {
    const active = node.path === selectedPath;
    return (
      <li>
        <button
          type="button"
          draggable
          style={{ paddingLeft: pad }}
          className={
            active
              ? "flex w-full cursor-grab items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-100 py-1.5 pr-2 text-left text-sm text-slate-800 transition hover:bg-sky-50 active:cursor-grabbing"
              : "flex w-full cursor-grab items-center gap-1.5 rounded-lg border border-transparent py-1.5 pr-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 active:cursor-grabbing"
          }
          onClick={() => onSelect(node.path)}
          onDragStart={(e) => {
            e.dataTransfer.setData(INTERNAL_DRAG_TYPE, node.path);
            e.dataTransfer.effectAllowed = "move";
          }}
          title={`${node.path} — drag onto a folder to move`}
        >
          <FileIcon />
          <span className="min-w-0 truncate">{node.name}</span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <div
        className={`flex w-full items-center gap-0.5 rounded-lg border py-0.5 pr-1 transition ${dropHighlightClass(dragOver)}`}
      >
        <button
          type="button"
          style={{ paddingLeft: pad }}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          title={`${node.path} — drop files here to upload or move`}
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleCombinedDrop}
        >
          <span
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-slate-400"
            aria-hidden
          >
            {open ? "▾" : "▸"}
          </span>
          <FolderIcon open={open} />
          <span className="min-w-0 truncate">{node.name}</span>
        </button>
        <button
          type="button"
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-800"
          title="New subfolder"
          onClick={(e) => {
            e.stopPropagation();
            onCreateSubfolder?.(node.path);
          }}
        >
          +
        </button>
      </div>
      {open && node.children?.length > 0 && (
        <ul className="mt-0.5 list-none space-y-0.5 p-0">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onUploadToFolder={onUploadToFolder}
              onCreateSubfolder={onCreateSubfolder}
              onMoveFile={onMoveFile}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileTree({
  tree,
  selectedPath,
  onSelect,
  onUploadToFolder,
  onCreateSubfolder,
  onMoveFile,
}) {
  if (!tree?.length) return null;
  return (
    <ul className="list-none space-y-0.5 p-0">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onUploadToFolder={onUploadToFolder}
          onCreateSubfolder={onCreateSubfolder}
          onMoveFile={onMoveFile}
        />
      ))}
    </ul>
  );
}
