import { useState } from 'react';
import { FileItem } from '../types';

interface FileProps {
  file: FileItem;
  onDelete: (id: string) => void;
}

export default function File({ file, onDelete }: FileProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.setData('type', 'file');
  };

  const handleDragEnd = () => {
    setIsDragging(false);
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
      className={`group relative aspect-square bg-gray-700 rounded-lg hover:bg-gray-600 cursor-move border-2 transition-all flex flex-col items-center justify-center p-4 ${
        isDragging 
          ? 'opacity-50 scale-95 border-blue-500' 
          : 'border-transparent hover:border-gray-500'
      }`}
    >
      <svg
        className="w-16 h-16 text-blue-400 mb-2"
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
      <span className="text-sm text-center text-gray-200 truncate w-full px-2" title={file.name}>
        {file.name}
      </span>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity bg-gray-800 rounded-full p-1"
        aria-label="Delete file"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

