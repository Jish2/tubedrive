import { useState } from 'react';
import { FolderItem } from '../types';

interface FolderProps {
  folder: FolderItem;
  onDelete: (id: string) => void;
  onFileDrop: (folderId: string, fileId: string) => void;
  onClick: (folderId: string) => void;
}

export default function Folder({ folder, onDelete, onFileDrop, onClick }: FolderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if dragging a file by looking at drag data types
    if (e.dataTransfer.types.includes('text/plain')) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
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

    const fileId = e.dataTransfer.getData('text/plain');
    const type = e.dataTransfer.getData('type');

    if (type === 'file' && fileId) {
      onFileDrop(folder.id, fileId);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(folder.id);
  };

  const handleClick = () => {
    onClick(folder.id);
  };

  return (
    <div
      className={`group relative aspect-square bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer border-2 transition-all flex flex-col items-center justify-center p-4 ${
        isDragOver 
          ? 'border-blue-500 bg-blue-900/70 scale-105 shadow-2xl shadow-blue-500/50 ring-4 ring-blue-500/30' 
          : 'border-transparent hover:border-gray-500'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center z-10">
          <div className="bg-blue-600/90 rounded-full p-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      )}
      <svg
        className={`w-16 h-16 mb-2 transition-colors ${
          isDragOver ? 'text-blue-300' : 'text-yellow-400'
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
      <span className={`text-sm text-center truncate w-full px-2 transition-colors ${
        isDragOver ? 'text-blue-200 font-semibold' : 'text-gray-200'
      }`} title={folder.name}>
        {folder.name}
      </span>
      {folder.files.length > 0 && (
        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
          {folder.files.length}
        </span>
      )}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity bg-gray-800 rounded-full p-1 z-20"
        aria-label="Delete folder"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

