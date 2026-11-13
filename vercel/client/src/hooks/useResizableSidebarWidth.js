import { useCallback, useRef, useState } from "react";

const STORAGE_KEY = "md-viewer-files-sidebar-width";
export const SIDEBAR_WIDTH_DEFAULT = 220;
export const SIDEBAR_WIDTH_MIN = 140;
export const SIDEBAR_WIDTH_MAX = 720;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function readStoredWidth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const n = stored ? Number(stored) : SIDEBAR_WIDTH_DEFAULT;
    return Number.isFinite(n)
      ? clamp(n, SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX)
      : SIDEBAR_WIDTH_DEFAULT;
  } catch {
    return SIDEBAR_WIDTH_DEFAULT;
  }
}

function storeWidth(width) {
  try {
    localStorage.setItem(STORAGE_KEY, String(width));
  } catch {
    /* ignore */
  }
}

export function useResizableSidebarWidth() {
  const [width, setWidth] = useState(readStoredWidth);
  const dragRef = useRef(null);

  const endDrag = useCallback((finalWidth) => {
    const d = dragRef.current;
    if (!d?.active) return;
    dragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    storeWidth(finalWidth);
  }, []);

  const onResizePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startWidth: width,
        pointerId: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width],
  );

  const onResizePointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d?.active) return;
    const next = clamp(
      d.startWidth + (e.clientX - d.startX),
      SIDEBAR_WIDTH_MIN,
      SIDEBAR_WIDTH_MAX,
    );
    setWidth(next);
  }, []);

  const onResizePointerUp = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d?.active) return;
      const final = clamp(
        d.startWidth + (e.clientX - d.startX),
        SIDEBAR_WIDTH_MIN,
        SIDEBAR_WIDTH_MAX,
      );
      setWidth(final);
      endDrag(final);
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    },
    [endDrag],
  );

  const onResizeDoubleClick = useCallback(() => {
    setWidth(SIDEBAR_WIDTH_DEFAULT);
    storeWidth(SIDEBAR_WIDTH_DEFAULT);
  }, []);

  return {
    sidebarWidth: width,
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp,
    onResizeDoubleClick,
  };
}
