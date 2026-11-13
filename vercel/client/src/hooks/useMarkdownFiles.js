import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../lib/api.js";
import { deleteMarkdownFile } from "../lib/deleteMarkdownFile.js";
import { saveMarkdownFile } from "../lib/saveMarkdownFile.js";
import { collectMarkdownFromDrop } from "../utils/dropMarkdownFiles.js";

export function useMarkdownFiles({ onFileLoaded }) {
  const [tree, setTree] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [draft, setDraft] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [saveState, setSaveState] = useState(null);
  const [deleteState, setDeleteState] = useState(null);
  const [uploadState, setUploadState] = useState(null);

  const refreshList = useCallback(() => {
    return fetch(`${API_BASE}/mds`)
      .then((r) => {
        if (!r.ok) throw new Error(`list failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setTree(data.tree ?? []);
        setLoadError(null);
        return data;
      })
      .catch((e) => {
        setLoadError(String(e));
        throw e;
      });
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (!selectedPath) {
      setDraft("");
      return;
    }
    setSaveState(null);
    setDeleteState(null);
    const q = new URLSearchParams({ path: selectedPath });
    fetch(`${API_BASE}/mds/file?${q}`)
      .then((r) => {
        if (!r.ok) throw new Error(`load failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDraft(data.content ?? "");
        setLoadError(null);
        onFileLoaded?.();
      })
      .catch((e) => {
        setLoadError(String(e));
        setDraft("");
      });
  }, [selectedPath, onFileLoaded]);

  const save = useCallback(() => {
    if (!selectedPath) return;
    setSaveState("saving");
    saveMarkdownFile(selectedPath, draft)
      .then(() => {
        setSaveState("saved");
        refreshList();
      })
      .catch((e) => setSaveState(String(e)));
  }, [selectedPath, draft, refreshList]);

  const remove = useCallback(() => {
    if (!selectedPath) return;
    const ok = window.confirm(
      `Delete "${selectedPath}" permanently? This removes the file from storage and cannot be undone.`,
    );
    if (!ok) return;
    setDeleteState("deleting");
    setSaveState(null);
    deleteMarkdownFile(selectedPath)
      .then(async () => {
        setDeleteState("deleted");
        setSelectedPath(null);
        setDraft("");
        await refreshList();
      })
      .catch((e) => setDeleteState(String(e)));
  }, [selectedPath, refreshList]);

  const uploadDroppedFiles = useCallback(
    async (dataTransfer, targetDir = "") => {
      setUploadState("uploading");
      try {
        const files = await collectMarkdownFromDrop(dataTransfer, targetDir);
        if (files.length === 0) {
          throw new Error("Drop only .md files or folders containing them");
        }
        for (const { path, content } of files) {
          await saveMarkdownFile(path, content);
        }
        await refreshList();
        setSelectedPath(files[files.length - 1].path);
        setUploadState(`uploaded:${files.length}`);
      } catch (e) {
        setUploadState(String(e));
      }
    },
    [refreshList]
  );

  return {
    tree,
    selectedPath,
    setSelectedPath,
    draft,
    setDraft,
    loadError,
    saveState,
    deleteState,
    refreshList,
    save,
    remove,
    uploadDroppedFiles,
    uploadState,
  };
}
