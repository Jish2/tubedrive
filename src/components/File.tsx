import { useState } from "react";
import { FileItem } from "../types";
import { ViewMode } from "./PaneContent";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";

interface FileProps {
  file: FileItem;
  paneId: string;
  playlistId: string;
  onDelete: (id: string) => void;
  viewMode?: ViewMode;
}

export default function File({
  file,
  paneId,
  playlistId,
  onDelete,
  viewMode = "grid",
}: FileProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", file.id);
    e.dataTransfer.setData("type", "video");
    e.dataTransfer.setData("playlistItemId", file.id);
    if (file.videoId) {
      e.dataTransfer.setData("videoId", file.videoId);
    }
    e.dataTransfer.setData("sourcePaneId", paneId);
    e.dataTransfer.setData("sourcePlaylistId", playlistId);

    // Also store drag data globally for reliable access during dragover
    (window as any).__dragVideoData = {
      videoId: file.videoId,
      playlistItemId: file.id,
      sourcePaneId: paneId,
      sourcePlaylistId: playlistId,
    };
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    (window as any).__dragVideoData = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "Visit Video",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      ),
      onClick: () => {
        if (file.videoId) {
          window.open(
            `https://www.youtube.com/watch?v=${file.videoId}`,
            "_blank",
          );
        }
      },
      className: "text-gray-200",
    },
    {
      label: "Delete Video",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      onClick: () => onDelete(file.id),
      className: "text-red-400 hover:text-red-300",
    },
  ];

  if (viewMode === "list") {
    return (
      <>
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onContextMenu={handleContextMenu}
          className={`group relative bg-gray-700 rounded-lg hover:bg-gray-600 cursor-move border-2 transition-all flex items-center gap-4 p-3 ${
            isDragging
              ? "opacity-50 scale-95 border-blue-500"
              : "border-transparent hover:border-gray-500"
          }`}
        >
          <div className="flex-shrink-0 w-24 h-16 flex items-center justify-center relative">
            {file.thumbnailUrl && !thumbnailError ? (
              <img
                draggable={false}
                src={file.thumbnailUrl}
                alt={file.name}
                className="w-full h-full object-cover rounded"
                onError={() => setThumbnailError(true)}
                onDragStart={(e) => e.preventDefault()}
              />
            ) : (
              <svg
                className="w-12 h-12 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
          </div>
          <span
            className="flex-1 text-sm text-gray-200 truncate"
            title={file.name}
          >
            {file.name}
          </span>
        </div>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenuItems}
            onClose={() => setContextMenu(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        className={`group relative aspect-square bg-gray-700 rounded-lg hover:bg-gray-600 cursor-move border-2 transition-all flex flex-col items-stretch p-2 ${
          isDragging
            ? "opacity-50 scale-95 border-blue-500"
            : "border-transparent hover:border-gray-500"
        }`}
      >
        <div className="w-full flex-1 flex items-center justify-center mb-2 relative min-h-0">
          {file.thumbnailUrl && !thumbnailError ? (
            <img
              draggable={false}
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-full object-cover rounded"
              onError={() => setThumbnailError(true)}
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            <svg
              className="w-16 h-16 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
        </div>
        <span
          className="text-sm text-center text-gray-200 truncate w-full px-2"
          title={file.name}
        >
          {file.name}
        </span>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
