import { useState, useMemo, useEffect } from "react";
import { FolderItem, FileItem } from "../types";
import Folder from "./Folder";
import File from "./File";
import AddVideoButton from "./AddVideoButton";
import AddVideoModal from "./AddVideoModal";
import CreatePlaylistButton from "./CreatePlaylistButton";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { useYouTubePlaylists } from "../hooks/useYouTubePlaylists";
import { usePlaylistItems } from "../hooks/usePlaylistItems";
import { useAuth } from "../contexts/AuthContext";
import { addVideoToPlaylist, removeVideoFromPlaylist } from "../services/youtubeApi";

interface PaneContentProps {
  paneId: string;
  currentFolderId: string | null;
  onFolderClick: (folderId: string) => void;
  onBackClick: () => void;
  onFileDrop?: (playlistId: string, videoId: string) => void;
}

export default function PaneContent({
  paneId,
  currentFolderId,
  onFolderClick,
  onBackClick,
  onFileDrop,
}: PaneContentProps) {
  const {
    playlists,
    loading: playlistsLoading,
    createPlaylist,
  } = useYouTubePlaylists();
  const { token } = useAuth();
  const {
    items: playlistItems,
    loading: itemsLoading,
    reload: reloadPlaylistItems,
  } = usePlaylistItems(currentFolderId);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] =
    useState(false);

  // Listen for reload events
  useEffect(() => {
    const handleReload = (e: CustomEvent) => {
      if (currentFolderId && e.detail?.playlistId === currentFolderId) {
        reloadPlaylistItems();
      }
    };
    window.addEventListener('reloadPane', handleReload as EventListener);
    return () => {
      window.removeEventListener('reloadPane', handleReload as EventListener);
    };
  }, [currentFolderId, reloadPlaylistItems]);

  // Convert YouTube playlists to FolderItem format
  const folders = useMemo<FolderItem[]>(() => {
    return playlists.map((playlist) => {
      const isEmpty = playlist.contentDetails?.itemCount === 0;
      return {
        id: playlist.id,
        name: playlist.snippet.title,
        type: "folder" as const,
        files: [],
        thumbnailUrl: isEmpty
          ? undefined
          : playlist.snippet.thumbnails?.high?.url ||
            playlist.snippet.thumbnails?.medium?.url ||
            playlist.snippet.thumbnails?.default?.url,
      };
    });
  }, [playlists]);

  // Convert YouTube playlist items to FileItem format
  const files = useMemo<FileItem[]>(() => {
    return playlistItems.map((item) => ({
      id: item.id,
      name: item.snippet.title,
      type: "file" as const,
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url,
      videoId: item.snippet.resourceId?.videoId,
    }));
  }, [playlistItems]);

  const handleAddVideo = async (videoId: string) => {
    if (!token || !currentFolderId) {
      throw new Error("Missing token or playlist ID");
    }
    await addVideoToPlaylist(token, currentFolderId, videoId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await reloadPlaylistItems();
  };

  const handleCreatePlaylist = async (
    title: string,
    description: string,
    privacyStatus: "private" | "unlisted" | "public"
  ) => {
    await createPlaylist(title, description, privacyStatus);
  };

  const handleFileDrop = async (videoId: string, sourcePaneId: string) => {
    if (onFileDrop && currentFolderId && sourcePaneId !== paneId) {
      await onFileDrop(currentFolderId, videoId);
      // Reload this pane after adding
      await reloadPlaylistItems();
    }
  };

  const handleFileDelete = async (playlistItemId: string) => {
    if (!token || !currentFolderId) return;
    try {
      await removeVideoFromPlaylist(token, playlistItemId);
      await reloadPlaylistItems();
    } catch (error) {
      console.error("Failed to remove video:", error);
    }
  };

  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  // When viewing a folder, show its contents
  if (currentFolder) {
    return (
      <>
        {/* Toolbar */}
        <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackClick}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <svg
                className="w-7 h-7 text-yellow-400"
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
              {currentFolder.name}
            </h1>
          </div>
        </div>

        {/* Grid area */}
        <div
          className="flex-1 overflow-auto p-6 bg-gray-800"
          onDragOver={(e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData("type");
            if (type === "video") {
              e.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            const videoId = e.dataTransfer.getData("videoId");
            const sourcePaneId = e.dataTransfer.getData("sourcePaneId");
            const playlistItemId = e.dataTransfer.getData("playlistItemId");
            if (videoId && sourcePaneId && sourcePaneId !== paneId && currentFolderId) {
              await handleFileDrop(videoId, sourcePaneId);
              // Remove from source playlist if it was dragged from another pane
              if (playlistItemId && token) {
                try {
                  await removeVideoFromPlaylist(token, playlistItemId);
                } catch (error) {
                  console.error("Failed to remove video from source:", error);
                }
              }
            }
          }}
        >
          {itemsLoading ? (
            <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
              <div className="text-white">Loading videos...</div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              <AddVideoButton onClick={() => setIsAddVideoModalOpen(true)} />
              {files.map((file) => (
                <File
                  key={file.id}
                  file={file}
                  paneId={paneId}
                  onDelete={() => handleFileDelete(file.id)}
                />
              ))}
            </div>
          )}
        </div>
        <AddVideoModal
          isOpen={isAddVideoModalOpen}
          onClose={() => setIsAddVideoModalOpen(false)}
          onAdd={handleAddVideo}
          playlistName={currentFolder.name}
        />
      </>
    );
  }

  // Root view - show all folders
  return (
    <>
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold mr-6">YouTube Playlists</h1>
        </div>
      </div>

      {/* Grid area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-800">
        {playlistsLoading ? (
          <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
            <div className="text-white">Loading playlists...</div>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            <CreatePlaylistButton
              onClick={() => setIsCreatePlaylistModalOpen(true)}
            />
            {folders.map((folder) => (
              <Folder
                key={folder.id}
                folder={{
                  ...folder,
                  files: [],
                }}
                onDelete={() => {}}
                onFileDrop={() => {}}
                onClick={() => onFolderClick(folder.id)}
              />
            ))}
          </div>
        )}
      </div>
      <CreatePlaylistModal
        isOpen={isCreatePlaylistModalOpen}
        onClose={() => setIsCreatePlaylistModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />
    </>
  );
}

