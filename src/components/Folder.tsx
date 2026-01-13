import { useState } from "react";
import { FolderItem } from "../types";
import { ViewMode } from "./PaneContent";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";

interface FolderProps {
  folder: FolderItem;
  onDelete: (id: string) => void;
  onFileDrop: (folderId: string, fileId: string) => void;
  onClick: (folderId: string) => void;
  viewMode?: ViewMode;
  isPinned?: boolean;
  onTogglePin?: (folderId: string) => void;
}

export default function Folder({
  folder,
  onDelete,
  onFileDrop,
  onClick,
  viewMode = "grid",
  isPinned = false,
  onTogglePin,
}: FolderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if dragging a file by looking at drag data types
    if (e.dataTransfer.types.includes("text/plain")) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're actually leaving the element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const fileId = e.dataTransfer.getData("text/plain");
    const type = e.dataTransfer.getData("type");

    if (type === "file" && fileId) {
      onFileDrop(folder.id, fileId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    onClick(folder.id);
  };

  const contextMenuItems: ContextMenuItem[] = [];

  if (onTogglePin) {
    contextMenuItems.push({
      label: isPinned ? "Unpin Playlist" : "Pin Playlist",
      icon: (
        <svg
          className="w-4 h-4"
          fill={isPinned ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
      onClick: () => onTogglePin(folder.id),
      className: isPinned ? "text-yellow-400" : "text-gray-200",
    });
  }

  contextMenuItems.push({
    label: "Delete Playlist",
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
    onClick: () => onDelete(folder.id),
    className: "text-red-400 hover:text-red-300",
  });

  if (viewMode === "list") {
    return (
      <>
        <div
          draggable={false}
          className={`group relative bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer border-2 transition-all flex items-center gap-4 p-3 ${
            isDragOver
              ? "border-blue-500 bg-blue-900/70 scale-105 shadow-2xl shadow-blue-500/50 ring-4 ring-blue-500/30"
              : "border-transparent hover:border-gray-500"
          } ${isPinned ? "ring-1 ring-yellow-400/30" : ""}`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center z-10">
              <div className="bg-blue-600/90 rounded-full p-4">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </div>
          )}
          <div className="flex-shrink-0 w-24 h-16 flex items-center justify-center relative">
            {folder.thumbnailUrl && !thumbnailError ? (
              <img
                draggable={false}
                src={folder.thumbnailUrl}
                alt={folder.name}
                className="w-full h-full object-cover rounded"
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <svg
                className={`w-12 h-12 transition-colors ${
                  isDragOver ? "text-blue-300" : "text-yellow-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            )}
          </div>
          <span
            className={`flex-1 text-sm truncate transition-colors flex items-center gap-2 ${
              isDragOver ? "text-blue-200 font-semibold" : "text-gray-200"
            }`}
            title={folder.name}
          >
            {isPinned && (
              <svg
                className="w-3 h-3 text-yellow-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            )}
            <span className="truncate">{folder.name}</span>
          </span>
          {folder.files.length > 0 && (
            <span className="flex-shrink-0 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
              {folder.files.length}
            </span>
          )}
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
        draggable={false}
        className={`group relative aspect-square bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer border-2 transition-all flex flex-col items-stretch p-2 ${
          isDragOver
            ? "border-blue-500 bg-blue-900/70 scale-105 shadow-2xl shadow-blue-500/50 ring-4 ring-blue-500/30"
            : "border-transparent hover:border-gray-500"
        } ${isPinned ? "ring-1 ring-yellow-400/30" : ""}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center z-10">
            <div className="bg-blue-600/90 rounded-full p-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
        )}
        <div className="w-full flex-1 flex items-center justify-center mb-2 relative min-h-0">
          {folder.thumbnailUrl && !thumbnailError ? (
            <img
              draggable={false}
              src={folder.thumbnailUrl}
              alt={folder.name}
              className="w-full h-full object-cover rounded"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <svg
              className={`w-16 h-16 transition-colors ${
                isDragOver ? "text-blue-300" : "text-yellow-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          )}
        </div>
        <span
          className={`text-sm text-center truncate w-full px-2 transition-colors flex items-center justify-center gap-1 ${
            isDragOver ? "text-blue-200 font-semibold" : "text-gray-200"
          }`}
          title={folder.name}
        >
          {isPinned && (
            <svg
              className="w-3 h-3 text-yellow-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          )}
          <span className="truncate">{folder.name}</span>
        </span>
        {folder.files.length > 0 && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1 z-10">
            {folder.files.length}
          </span>
        )}
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
