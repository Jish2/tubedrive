import { useState } from "react";
import { FileItem } from "../types";

interface FileProps {
  file: FileItem;
  paneId: string;
  playlistId: string;
  onDelete: (id: string) => void;
}

export default function File({
  file,
  paneId,
  playlistId,
  onDelete,
}: FileProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity bg-gray-800 rounded-full p-1"
        aria-label="Delete file"
      >
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
