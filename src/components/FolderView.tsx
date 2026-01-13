import { useState, useMemo } from "react";
import { FolderItem, FileItem } from "../types";
import Folder from "./Folder";
import File from "./File";
import AddVideoButton from "./AddVideoButton";
import AddVideoModal from "./AddVideoModal";
import CreatePlaylistButton from "./CreatePlaylistButton";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { useYouTubePlaylists } from "../hooks/useYouTubePlaylists";
import { usePlaylistItems } from "../hooks/usePlaylistItems";
import { usePinnedPlaylists } from "../hooks/usePinnedPlaylists";
import { useAuth } from "../contexts/AuthContext";
import { addVideoToPlaylist } from "../services/youtubeApi";

export default function FolderView() {
  const {
    playlists,
    loading: playlistsLoading,
    createPlaylist,
  } = useYouTubePlaylists();
  const { togglePin, isPinned } = usePinnedPlaylists();
  const { token } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const {
    items: playlistItems,
    loading: itemsLoading,
    reload: reloadPlaylistItems,
  } = usePlaylistItems(currentFolderId);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] =
    useState(false);

  // Convert YouTube playlists to FolderItem format and sort by pinned status
  const folders = useMemo<FolderItem[]>(() => {
    const folderItems = playlists.map((playlist) => {
      // Don't show thumbnail for empty playlists - use folder icon instead
      const isEmpty = playlist.contentDetails?.itemCount === 0;
      return {
        id: playlist.id,
        name: playlist.snippet.title,
        type: "folder" as const,
        files: [], // Files will be loaded when folder is opened
        thumbnailUrl: isEmpty
          ? undefined
          : playlist.snippet.thumbnails?.high?.url ||
            playlist.snippet.thumbnails?.medium?.url ||
            playlist.snippet.thumbnails?.default?.url,
      };
    });

    // Sort folders: pinned playlists first, then others
    return folderItems.sort((a, b) => {
      const aIsPinned = isPinned(a.id);
      const bIsPinned = isPinned(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0; // Keep original order for items with same pinned status
    });
  }, [playlists, isPinned]);

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
    }));
  }, [playlistItems]);

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBackClick = () => {
    setCurrentFolderId(null);
  };

  const handleAddVideo = async (videoId: string) => {
    if (!token || !currentFolderId) {
      throw new Error("Missing token or playlist ID");
    }
    await addVideoToPlaylist(token, currentFolderId, videoId);
    // Reload the playlist items to show the new video
    // Add a small delay to ensure YouTube API has processed the addition
    await new Promise((resolve) => setTimeout(resolve, 500));
    await reloadPlaylistItems();
  };

  const handleCreatePlaylist = async (
    title: string,
    description: string,
    privacyStatus: "private" | "unlisted" | "public",
  ) => {
    await createPlaylist(title, description, privacyStatus);
  };

  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

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

        {/* Grid area - takes remaining space */}
        <div className="flex-1 overflow-auto p-6 bg-gray-800">
          {itemsLoading ? (
            <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
              <div className="text-white">Loading videos...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              <AddVideoButton onClick={() => setIsAddVideoModalOpen(true)} />
              {files.map((file) => (
                <File
                  key={file.id}
                  file={file}
                  onDelete={() => {}} // Disable delete for now
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
      </div>
    );
  }

  // Root view - show all folders and files
  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold mr-6">YouTube Playlists</h1>
        </div>
      </div>

      {/* Grid area - takes remaining space */}
      <div className="flex-1 overflow-auto p-6 bg-gray-800">
        {playlistsLoading ? (
          <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
            <div className="text-white">Loading playlists...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            <CreatePlaylistButton
              onClick={() => setIsCreatePlaylistModalOpen(true)}
            />
            {folders.map((folder) => (
              <Folder
                key={folder.id}
                folder={{
                  ...folder,
                  files: [], // Don't show file count badge for now
                }}
                onDelete={() => {}} // Disable delete for now
                onFileDrop={() => {}} // Disable drag and drop for now
                onClick={handleFolderClick}
                isPinned={isPinned(folder.id)}
                onTogglePin={togglePin}
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
    </div>
  );
}
