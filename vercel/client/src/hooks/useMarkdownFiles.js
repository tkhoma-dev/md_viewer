import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../lib/api.js";
import { createFolder } from "../lib/createFolder.js";
import { deleteFolder } from "../lib/deleteFolder.js";
import { deleteMarkdownFile } from "../lib/deleteMarkdownFile.js";
import { downloadMarkdownFile } from "../lib/downloadMarkdownFile.js";
import { moveMarkdownFile } from "../lib/moveMarkdownFile.js";
import { saveMarkdownFile } from "../lib/saveMarkdownFile.js";
import {
  destinationPathInFolder,
  parentFolderFromSelectedFile,
} from "../utils/parentFolder.js";
import { collectMarkdownFromDrop } from "../utils/dropMarkdownFiles.js";

export function useMarkdownFiles({ onFileLoaded }) {
  const [tree, setTree] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [draft, setDraft] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [saveState, setSaveState] = useState(null);
  const [deleteState, setDeleteState] = useState(null);
  const [uploadState, setUploadState] = useState(null);
  const [treeActionState, setTreeActionState] = useState(null);

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

  const download = useCallback(() => {
    if (!selectedPath) return;
    downloadMarkdownFile(selectedPath, draft);
  }, [selectedPath, draft]);

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

  const createFolderAt = useCallback(
    async (parentDir = "") => {
      const name = window.prompt("New folder name");
      if (!name?.trim()) return;
      if (name.includes("/") || name.includes("\\")) {
        setTreeActionState("Folder name cannot contain slashes");
        return;
      }
      setTreeActionState("creating…");
      try {
        await createFolder({ parent: parentDir, name: name.trim() });
        await refreshList();
        setTreeActionState("Folder created");
      } catch (e) {
        setTreeActionState(String(e));
      }
    },
    [refreshList],
  );

  const createFolderNearSelection = useCallback(() => {
    createFolderAt(parentFolderFromSelectedFile(selectedPath));
  }, [createFolderAt, selectedPath]);

  const deleteFolderAt = useCallback(
    async (folderPath) => {
      if (!folderPath) return;
      if (
        !window.confirm(
          `Delete folder "${folderPath}" and everything inside it?`,
        )
      ) {
        return;
      }
      setTreeActionState("deleting folder…");
      try {
        await deleteFolder(folderPath);
        if (
          selectedPath &&
          (selectedPath === folderPath ||
            selectedPath.startsWith(`${folderPath}/`))
        ) {
          setSelectedPath(null);
          setDraft("");
        }
        await refreshList();
        setTreeActionState("Folder deleted");
      } catch (e) {
        setTreeActionState(String(e));
      }
    },
    [refreshList, selectedPath],
  );

  const moveFileToFolder = useCallback(
    async (fromPath, targetFolder) => {
      const toPath = destinationPathInFolder(fromPath, targetFolder);
      if (toPath === fromPath) return;
      setTreeActionState("moving…");
      try {
        await moveMarkdownFile(fromPath, toPath);
        if (selectedPath === fromPath) {
          setSelectedPath(toPath);
        }
        await refreshList();
        setTreeActionState("Moved");
      } catch (e) {
        setTreeActionState(String(e));
      }
    },
    [refreshList, selectedPath],
  );

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
    download,
    remove,
    uploadDroppedFiles,
    uploadState,
    createFolderAt,
    createFolderNearSelection,
    moveFileToFolder,
    deleteFolderAt,
    treeActionState,
  };
}
