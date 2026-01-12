import { useState } from 'react';
import { FolderItem, FileItem } from '../types';
import Folder from './Folder';
import File from './File';

export default function FolderView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showNewFileInput, setShowNewFileInput] = useState(false);

  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: FolderItem = {
        id: `folder-${Date.now()}`,
        name: newFolderName.trim(),
        type: 'folder',
        files: [],
      };
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const createFile = () => {
    if (newFileName.trim()) {
      const newFile: FileItem = {
        id: `file-${Date.now()}`,
        name: newFileName.trim(),
        type: 'file',
      };
      setFiles([...files, newFile]);
      setNewFileName('');
      setShowNewFileInput(false);
    }
  };

  const deleteFolder = (folderId: string) => {
    setFolders(folders.filter((f) => f.id !== folderId));
  };

  const deleteFile = (fileId: string) => {
    // Remove from root files
    setFiles(files.filter((f) => f.id !== fileId));
    // Remove from all folders
    setFolders(
      folders.map((folder) => ({
        ...folder,
        files: folder.files.filter((f) => f.id !== fileId),
      }))
    );
  };

  const handleFileDrop = (folderId: string, fileId: string) => {
    // Find the file being moved
    const fileToMove = files.find((f) => f.id === fileId);
    if (!fileToMove) {
      // Check if it's in a folder
      const sourceFolder = folders.find((f) => f.files.some((file) => file.id === fileId));
      if (sourceFolder) {
        const fileToMove = sourceFolder.files.find((f) => f.id === fileId);
        if (fileToMove) {
          // Remove from source folder
          setFolders(
            folders.map((folder) => {
              if (folder.id === sourceFolder.id) {
                return {
                  ...folder,
                  files: folder.files.filter((f) => f.id !== fileId),
                };
              }
              if (folder.id === folderId) {
                return {
                  ...folder,
                  files: [...folder.files, fileToMove],
                };
              }
              return folder;
            })
          );
        }
      }
      return;
    }

    // Move from root to folder
    setFiles(files.filter((f) => f.id !== fileId));
    setFolders(
      folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            files: [...folder.files, fileToMove],
          };
        }
        return folder;
      })
    );
  };

  const handleFileDeleteFromFolder = (folderId: string, fileId: string) => {
    setFolders(
      folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            files: folder.files.filter((f) => f.id !== fileId),
          };
        }
        return folder;
      })
    );
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBackClick = () => {
    setCurrentFolderId(null);
  };

  const currentFolder = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null;

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain');
    const type = e.dataTransfer.getData('type');

    if (type === 'file' && fileId) {
      // Find the file in folders
      const sourceFolder = folders.find((f) => f.files.some((file) => file.id === fileId));
      if (sourceFolder) {
        const fileToMove = sourceFolder.files.find((f) => f.id === fileId);
        if (fileToMove) {
          // Move from folder to root
          setFolders(
            folders.map((folder) => {
              if (folder.id === sourceFolder.id) {
                return {
                  ...folder,
                  files: folder.files.filter((f) => f.id !== fileId),
                };
              }
              return folder;
            })
          );
          setFiles([...files, fileToMove]);
        }
      }
    }
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type === 'file') {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // When viewing a folder, show its contents
  if (currentFolder) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {currentFolder.name}
            </h1>
          </div>
        </div>

        {/* Grid area - takes remaining space */}
        <div
          onDragOver={handleRootDragOver}
          onDrop={handleRootDrop}
          className="flex-1 overflow-auto p-6 bg-gray-800"
        >
          {currentFolder.files.length === 0 ? (
            <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
              <svg className="w-24 h-24 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">This folder is empty</p>
              <p className="text-sm mt-2">Drag files here from the root view</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              {currentFolder.files.map((file) => (
                <File
                  key={file.id}
                  file={file}
                  onDelete={(fileId) => handleFileDeleteFromFolder(currentFolder.id, fileId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Root view - show all folders and files
  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold mr-6">Folder Manager</h1>

          {/* Action buttons */}
          {!showNewFolderInput ? (
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Folder
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createFolder();
                  } else if (e.key === 'Escape') {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }
                }}
                placeholder="Folder name"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {!showNewFileInput ? (
            <button
              onClick={() => setShowNewFileInput(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New File
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createFile();
                  } else if (e.key === 'Escape') {
                    setShowNewFileInput(false);
                    setNewFileName('');
                  }
                }}
                placeholder="File name"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button
                onClick={createFile}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFileInput(false);
                  setNewFileName('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid area - takes remaining space */}
      <div
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
        className="flex-1 overflow-auto p-6 bg-gray-800"
      >
        {folders.length === 0 && files.length === 0 ? (
          <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
            <p className="text-lg">No folders or files yet</p>
            <p className="text-sm mt-2">Create a folder or file to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {folders.map((folder) => (
              <Folder
                key={folder.id}
                folder={folder}
                onDelete={deleteFolder}
                onFileDrop={handleFileDrop}
                onClick={handleFolderClick}
              />
            ))}
            {files.map((file) => (
              <File key={file.id} file={file} onDelete={deleteFile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

