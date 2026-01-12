import { useState, useMemo, useEffect } from "react";
import { FolderItem, FileItem } from "../types";
import Folder from "./Folder";
import File from "./File";
import AddVideoModal from "./AddVideoModal";
import CreatePlaylistModal from "./CreatePlaylistModal";
import ImportPlaylistModal from "./ImportPlaylistModal";
import { useYouTubePlaylists } from "../hooks/useYouTubePlaylists";
import { usePlaylistItems } from "../hooks/usePlaylistItems";
import { useAuth } from "../contexts/AuthContext";
import {
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  addVideosToPlaylist,
} from "../services/youtubeApi";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface PaneContentProps {
  paneId: string;
  breadcrumb: BreadcrumbItem[];
  onFolderClick: (folderId: string, folderName: string) => void;
  onBreadcrumbClick: (index: number) => void;
  onFileDrop?: (
    playlistId: string,
    videoId: string,
    sourcePlaylistId: string,
    playlistItemId: string
  ) => void;
}

type DragVideoData = {
  videoId?: string;
  playlistItemId?: string;
  sourcePaneId?: string;
  sourcePlaylistId?: string;
};

export default function PaneContent({
  paneId,
  breadcrumb,
  onFolderClick,
  onBreadcrumbClick,
  onFileDrop,
}: PaneContentProps) {
  const currentFolderId =
    breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : null;
  const {
    playlists,
    loading: playlistsLoading,
    createPlaylist,
    loadPlaylists,
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
  const [isImportPlaylistModalOpen, setIsImportPlaylistModalOpen] =
    useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMovingVideo, setIsMovingVideo] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const getDragData = (): DragVideoData | undefined => {
    return (window as unknown as { __dragVideoData?: DragVideoData })
      .__dragVideoData;
  };

  // Listen for reload events
  useEffect(() => {
    const handleReload = (e: Event) => {
      const customEvent = e as CustomEvent<{ playlistId: string }>;
      const playlistId = customEvent.detail?.playlistId;
      // Set loading state if this pane is viewing the playlist that was modified
      if (currentFolderId && playlistId === currentFolderId) {
        setIsMovingVideo(true);
        reloadPlaylistItems().then(() => {
          setIsMovingVideo(false);
        });
      }
      // Also reload playlists if we're at root view (to update playlist counts)
      if (!currentFolderId && playlistId) {
        setIsMovingVideo(true);
        loadPlaylists().then(() => {
          setIsMovingVideo(false);
        });
      }
    };
    window.addEventListener("reloadPane", handleReload);
    return () => {
      window.removeEventListener("reloadPane", handleReload);
    };
  }, [currentFolderId, reloadPlaylistItems, loadPlaylists]);

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

  const handleImportPlaylist = async (
    playlistId: string,
    videoIds: string[]
  ) => {
    if (!token) {
      throw new Error("Missing authentication token");
    }

    setImportProgress({ current: 0, total: videoIds.length });
    try {
      await addVideosToPlaylist(token, playlistId, videoIds, (current, total) =>
        setImportProgress({ current, total })
      );
      // Reload playlist items if we're viewing the imported playlist
      if (currentFolderId === playlistId) {
        await reloadPlaylistItems();
      }
      // Reload playlists to update counts
      await loadPlaylists();
    } finally {
      setImportProgress(null);
    }
  };

  const handleCreateAndImportPlaylist = async (
    title: string,
    description: string,
    privacyStatus: "private" | "unlisted" | "public",
    videoIds: string[]
  ) => {
    if (!token) {
      throw new Error("Missing authentication token");
    }

    setImportProgress({ current: 0, total: videoIds.length + 1 });
    try {
      // Create the playlist first
      const newPlaylist = await createPlaylist(
        title,
        description,
        privacyStatus
      );
      if (!newPlaylist) {
        throw new Error("Failed to create playlist");
      }
      setImportProgress({ current: 1, total: videoIds.length + 1 });

      // Then import videos
      await addVideosToPlaylist(
        token,
        newPlaylist.id,
        videoIds,
        (current, total) =>
          setImportProgress({ current: current + 1, total: total + 1 })
      );

      // Reload playlists to show the new one
      await loadPlaylists();
    } finally {
      setImportProgress(null);
    }
  };

  const handleFileDrop = async (
    videoId: string,
    sourcePaneId: string,
    sourcePlaylistId: string,
    playlistItemId: string
  ) => {
    if (
      onFileDrop &&
      currentFolderId &&
      sourcePaneId !== paneId &&
      sourcePlaylistId !== currentFolderId
    ) {
      try {
        setIsMovingVideo(true);
        // Add to target playlist
        await onFileDrop(
          currentFolderId,
          videoId,
          sourcePlaylistId,
          playlistItemId
        );
        // Reload this pane after adding
        await reloadPlaylistItems();
        setIsMovingVideo(false);
      } catch (error) {
        console.error("Failed to move video:", error);
        setIsMovingVideo(false);
        throw error;
      }
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
        {/* Toolbar with Breadcrumb */}
        <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
          <div className="toolbar-container flex items-center justify-between gap-4 min-w-0">
            <nav
              className="flex items-center gap-2 min-w-0 flex-1"
              aria-label="Breadcrumb"
            >
              <button
                onClick={() => onBreadcrumbClick(-1)}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800"
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium">YouTube Playlists</span>
              </button>
              {breadcrumb.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <button
                    onClick={() => onBreadcrumbClick(index)}
                    className={`text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-gray-800 ${
                      index === breadcrumb.length - 1
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsAddVideoModalOpen(true)}
                className="toolbar-button flex items-center gap-2 px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm font-medium"
                title="Add Video"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
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
                <span className="toolbar-button-text">Add Video</span>
              </button>
              <button
                onClick={() => setIsImportPlaylistModalOpen(true)}
                className="toolbar-button flex items-center gap-2 px-2 md:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white text-sm font-medium"
                title="Import Playlist"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="toolbar-button-text">Import Playlist</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid area */}
        <div
          className={`flex-1 overflow-auto p-6 transition-all duration-200 ${
            isDragOver
              ? "bg-blue-900/50 border-4 border-blue-400 border-dashed ring-4 ring-blue-500/50"
              : "bg-gray-800"
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use global drag data (set in File drag start) because getData is unreliable during drag
            const dragData = getDragData();
            if (
              dragData?.videoId &&
              dragData?.sourcePaneId &&
              dragData.sourcePaneId !== paneId &&
              currentFolderId &&
              dragData.sourcePlaylistId &&
              dragData.sourcePlaylistId !== currentFolderId
            ) {
              setIsDragOver(true);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const dragData = getDragData();
            if (
              dragData?.videoId &&
              dragData?.sourcePaneId &&
              dragData.sourcePaneId !== paneId &&
              currentFolderId &&
              dragData.sourcePlaylistId &&
              dragData.sourcePlaylistId !== currentFolderId
            ) {
              e.dataTransfer.dropEffect = "move";
              setIsDragOver(true);
            } else {
              e.dataTransfer.dropEffect = "none";
              setIsDragOver(false);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            // Only set drag over to false if we're actually leaving the element
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            if (
              x < rect.left ||
              x > rect.right ||
              y < rect.top ||
              y > rect.bottom
            ) {
              setIsDragOver(false);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragOver(false);
            const dragData = getDragData() || {};
            const videoId =
              dragData.videoId || e.dataTransfer.getData("videoId");
            const sourcePaneId =
              dragData.sourcePaneId || e.dataTransfer.getData("sourcePaneId");
            const sourcePlaylistId =
              dragData.sourcePlaylistId ||
              e.dataTransfer.getData("sourcePlaylistId");
            const playlistItemId =
              dragData.playlistItemId ||
              e.dataTransfer.getData("playlistItemId");

            if (
              videoId &&
              sourcePaneId &&
              sourcePaneId !== paneId &&
              currentFolderId &&
              sourcePlaylistId &&
              sourcePlaylistId !== currentFolderId
            ) {
              await handleFileDrop(
                videoId,
                sourcePaneId,
                sourcePlaylistId,
                playlistItemId
              );
            }
            // Clear global drag data after drop
            (
              window as unknown as { __dragVideoData?: DragVideoData | null }
            ).__dragVideoData = null;
          }}
        >
          {(isMovingVideo || importProgress) && (
            <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 border border-gray-700">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div className="text-white text-sm">
                  {importProgress
                    ? `Importing videos... ${importProgress.current}/${importProgress.total}`
                    : "Moving video..."}
                </div>
              </div>
            </div>
          )}
          {itemsLoading ? (
            <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
              <div className="text-white">Loading videos...</div>
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              }}
            >
              {files.map((file) => (
                <File
                  key={file.id}
                  file={file}
                  paneId={paneId}
                  playlistId={currentFolderId!}
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
        <ImportPlaylistModal
          isOpen={isImportPlaylistModalOpen}
          onClose={() => setIsImportPlaylistModalOpen(false)}
          onImport={handleImportPlaylist}
          playlists={playlists}
          currentPlaylistId={currentFolderId}
        />
      </>
    );
  }

  // Root view - show all folders
  return (
    <>
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="toolbar-container flex items-center justify-between gap-4 min-w-0">
          <h1 className="text-2xl font-bold truncate">YouTube Playlists</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsCreatePlaylistModalOpen(true)}
              className="toolbar-button flex items-center gap-2 px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm font-medium"
              title="Create Playlist"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
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
              <span className="toolbar-button-text">Create Playlist</span>
            </button>
            <button
              onClick={() => setIsImportPlaylistModalOpen(true)}
              className="toolbar-button flex items-center gap-2 px-2 md:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white text-sm font-medium"
              title="Import Playlist"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="toolbar-button-text">Import Playlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-800">
        {playlistsLoading ? (
          <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
            <div className="text-white">Loading playlists...</div>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            }}
          >
            {folders.map((folder) => (
              <Folder
                key={folder.id}
                folder={{
                  ...folder,
                  files: [],
                }}
                onDelete={() => {}}
                onFileDrop={() => {}}
                onClick={() => onFolderClick(folder.id, folder.name)}
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
      <ImportPlaylistModal
        isOpen={isImportPlaylistModalOpen}
        onClose={() => setIsImportPlaylistModalOpen(false)}
        onImport={handleImportPlaylist}
        onCreateAndImport={handleCreateAndImportPlaylist}
        playlists={playlists}
        currentPlaylistId={null}
      />
    </>
  );
}
