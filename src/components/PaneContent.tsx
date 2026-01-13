import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type YouTubePlaylistItem,
} from "../services/youtubeApi";
import {
  FixedSizeGrid,
  FixedSizeList,
  type GridChildComponentProps,
  type GridOnItemsRenderedProps,
  type ListChildComponentProps,
  type ListOnItemsRenderedProps,
} from "react-window";

export type ViewMode = "grid" | "list";

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
    loadingMore: itemsLoadingMore,
    reload: reloadPlaylistItems,
    loadMore: loadMorePlaylistItems,
    hasMore: hasMorePlaylistItems,
    addItem: addPlaylistItem,
    removeItem: removePlaylistItem,
  } = usePlaylistItems(currentFolderId);
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] =
    useState(false);
  const [isImportPlaylistModalOpen, setIsImportPlaylistModalOpen] =
    useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Load view mode from localStorage or default to grid
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("viewMode");
    return (saved === "grid" || saved === "list" ? saved : "grid") as ViewMode;
  });

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("viewMode", viewMode);
  }, [viewMode]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Handle scroll for fallback (non-virtualized) views
  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = node;
      const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 200;

      if (
        scrolledToBottom &&
        hasMorePlaylistItems &&
        !itemsLoading &&
        !itemsLoadingMore
      ) {
        console.log("Scroll-based load more triggered");
        loadMorePlaylistItems();
      }
    };

    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [
    hasMorePlaylistItems,
    itemsLoading,
    itemsLoadingMore,
    loadMorePlaylistItems,
  ]);

  const getDragData = (): DragVideoData | undefined => {
    return (window as unknown as { __dragVideoData?: DragVideoData })
      .__dragVideoData;
  };

  // Listen for optimistic update events
  useEffect(() => {
    const handleOptimisticUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action: "add" | "remove";
        playlistId: string;
        item?: YouTubePlaylistItem;
        playlistItemId?: string;
      }>;
      const { action, playlistId, item, playlistItemId } = customEvent.detail;

      // Only update if this pane is viewing the affected playlist
      if (currentFolderId && playlistId === currentFolderId) {
        if (action === "add" && item) {
          addPlaylistItem(item);
        } else if (action === "remove" && playlistItemId) {
          removePlaylistItem(playlistItemId);
        }
      }

      // Also reload playlists if we're at root view (to update playlist counts)
      if (!currentFolderId && playlistId) {
        loadPlaylists();
      }
    };
    window.addEventListener("optimisticUpdate", handleOptimisticUpdate);
    return () => {
      window.removeEventListener("optimisticUpdate", handleOptimisticUpdate);
    };
  }, [currentFolderId, addPlaylistItem, removePlaylistItem, loadPlaylists]);

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

  const GRID_MIN_COLUMN_WIDTH = 180;
  const LIST_ITEM_HEIGHT = 88;

  const columnCount = useMemo(() => {
    if (!containerSize.width) return 1;
    return Math.max(1, Math.floor(containerSize.width / GRID_MIN_COLUMN_WIDTH));
  }, [containerSize.width]);

  const columnWidth = useMemo(() => {
    if (!containerSize.width) return GRID_MIN_COLUMN_WIDTH;
    return Math.floor(containerSize.width / columnCount);
  }, [columnCount, containerSize.width]);

  const gridRowHeight = useMemo(() => {
    // Accommodate square thumbnail plus name/padding
    return Math.max(220, columnWidth + 60);
  }, [columnWidth]);

  const maybeLoadMore = useCallback(
    (lastVisibleIndex: number) => {
      const threshold = Math.max(5, Math.ceil(columnCount * 1.5));
      const shouldLoad =
        hasMorePlaylistItems &&
        !itemsLoading &&
        !itemsLoadingMore &&
        lastVisibleIndex >= files.length - threshold;

      if (shouldLoad) {
        console.log(
          `Loading more: visible=${lastVisibleIndex}, total=${files.length}, threshold=${threshold}`
        );
        loadMorePlaylistItems();
      }
    },
    [
      columnCount,
      hasMorePlaylistItems,
      itemsLoading,
      itemsLoadingMore,
      loadMorePlaylistItems,
      files.length,
    ]
  );

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
        // No need to set loading state for optimistic updates
        await onFileDrop(
          currentFolderId,
          videoId,
          sourcePlaylistId,
          playlistItemId
        );
        // Optimistic updates are handled by the event listener
      } catch (error) {
        console.error("Failed to move video:", error);
        // On error, reload to get correct state
        await reloadPlaylistItems();
        throw error;
      }
    }
  };

  const handleFileDelete = async (playlistItemId: string) => {
    if (!token || !currentFolderId) return;
    try {
      // Optimistically remove from UI
      removePlaylistItem(playlistItemId);
      // Then make API call
      await removeVideoFromPlaylist(token, playlistItemId);
    } catch (error) {
      console.error("Failed to remove video:", error);
      // On error, reload to restore correct state
      await reloadPlaylistItems();
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
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  title="Grid View"
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
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  title="List View"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
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
          ref={contentRef}
          className={`relative flex-1 p-6 overflow-auto transition-all duration-200 ${
            isDragOver
              ? "bg-blue-900/50 border-4 border-blue-400 border-dashed ring-4 ring-blue-500/50"
              : "bg-gray-800"
          }`}
          style={{ minHeight: 0 }}
          onDragEnter={(e) => {
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

            (
              window as unknown as { __dragVideoData?: DragVideoData | null }
            ).__dragVideoData = null;
          }}
        >
          {importProgress && (
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
                  Importing videos... {importProgress.current}/
                  {importProgress.total}
                </div>
              </div>
            </div>
          )}

          {itemsLoading && playlistItems.length === 0 ? (
            <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
              <div className="text-white">Loading videos...</div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-gray-500 text-center py-16 h-full flex flex-col items-center justify-center">
              <div className="text-white">No videos yet</div>
            </div>
          ) : (
            <div className="w-full h-full">
              {viewMode === "list" ? (
                containerSize.height > 0 ? (
                  <FixedSizeList
                    height={containerSize.height || 400}
                    width={containerSize.width || "100%"}
                    itemCount={files.length}
                    itemSize={LIST_ITEM_HEIGHT}
                    overscanCount={6}
                    onItemsRendered={({
                      visibleStopIndex,
                    }: ListOnItemsRenderedProps) =>
                      maybeLoadMore(visibleStopIndex)
                    }
                  >
                    {({ index, style }: ListChildComponentProps<FileItem>) => {
                      const file = files[index];
                      return (
                        <div style={{ ...style, padding: 4 }}>
                          <File
                            file={file}
                            paneId={paneId}
                            playlistId={currentFolderId!}
                            onDelete={() => handleFileDelete(file.id)}
                            viewMode="list"
                          />
                        </div>
                      );
                    }}
                  </FixedSizeList>
                ) : (
                  <div className="flex flex-col gap-2">
                    {files.map((file) => (
                      <File
                        key={file.id}
                        file={file}
                        paneId={paneId}
                        playlistId={currentFolderId!}
                        onDelete={() => handleFileDelete(file.id)}
                        viewMode="list"
                      />
                    ))}
                  </div>
                )
              ) : containerSize.height > 0 ? (
                <FixedSizeGrid
                  height={containerSize.height || 400}
                  width={containerSize.width || 400}
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  rowCount={Math.ceil(files.length / columnCount)}
                  rowHeight={gridRowHeight}
                  overscanRowCount={2}
                  overscanColumnCount={1}
                  onItemsRendered={({
                    visibleRowStopIndex,
                    visibleColumnStopIndex,
                  }: GridOnItemsRenderedProps) =>
                    maybeLoadMore(
                      visibleRowStopIndex * columnCount + visibleColumnStopIndex
                    )
                  }
                >
                  {({
                    columnIndex,
                    rowIndex,
                    style,
                  }: GridChildComponentProps) => {
                    const fileIndex = rowIndex * columnCount + columnIndex;
                    if (fileIndex >= files.length) return null;
                    const file = files[fileIndex];
                    return (
                      <div style={{ ...style, padding: 8 }}>
                        <File
                          file={file}
                          paneId={paneId}
                          playlistId={currentFolderId!}
                          onDelete={() => handleFileDelete(file.id)}
                          viewMode="grid"
                        />
                      </div>
                    );
                  }}
                </FixedSizeGrid>
              ) : (
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                  }}
                >
                  {files.map((file) => (
                    <File
                      key={file.id}
                      file={file}
                      paneId={paneId}
                      playlistId={currentFolderId!}
                      onDelete={() => handleFileDelete(file.id)}
                      viewMode="grid"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {itemsLoadingMore && (
            <div className="absolute bottom-4 right-4 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg border border-gray-700 shadow-lg">
              Loading more videos...
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
          <nav
            className="flex items-center gap-2 min-w-0 flex-1"
            aria-label="Breadcrumb"
          >
            <button className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800">
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
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
                title="Grid View"
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
                title="List View"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
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
            className={
              viewMode === "grid" ? "grid gap-4" : "flex flex-col gap-2"
            }
            style={
              viewMode === "grid"
                ? {
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                  }
                : undefined
            }
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
                viewMode={viewMode}
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
