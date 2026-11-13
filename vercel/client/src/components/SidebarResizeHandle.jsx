/**
 * Vertical splitter between the files panel and the editor (Cursor-style).
 */
export function SidebarResizeHandle({
  width,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(width)}
      aria-valuemin={140}
      aria-valuemax={720}
      title="Drag to resize files panel. Double-click to reset."
      className="group relative hidden w-2 shrink-0 cursor-col-resize touch-none select-none lg:block"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="absolute inset-y-0 -left-0.5 -right-0.5 z-10"
        aria-hidden
      />
      <div
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200 transition group-hover:w-0.5 group-hover:bg-sky-400 group-active:bg-sky-500"
        aria-hidden
      />
    </div>
  );
}
