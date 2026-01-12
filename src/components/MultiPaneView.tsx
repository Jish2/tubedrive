import { useState, useCallback } from "react";
import Pane from "./Pane";
import { useAuth } from "../contexts/AuthContext";
import {
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from "../services/youtubeApi";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface PaneState {
  id: string;
  breadcrumb: BreadcrumbItem[];
}

export default function MultiPaneView() {
  const { token } = useAuth();
  const [panes, setPanes] = useState<PaneState[]>([
    { id: "pane-1", breadcrumb: [] },
  ]);

  const handleFolderClick = useCallback(
    (paneId: string, folderId: string, folderName: string) => {
      setPanes((prev) =>
        prev.map((p) =>
          p.id === paneId
            ? {
                ...p,
                breadcrumb: [
                  ...p.breadcrumb,
                  { id: folderId, name: folderName },
                ],
              }
            : p
        )
      );
    },
    []
  );

  const handleBreadcrumbClick = useCallback((paneId: string, index: number) => {
    setPanes((prev) =>
      prev.map((p) =>
        p.id === paneId
          ? {
              ...p,
              breadcrumb: index === -1 ? [] : p.breadcrumb.slice(0, index + 1),
            }
          : p
      )
    );
  }, []);

  const handleAddPane = useCallback(() => {
    const newPaneId = `pane-${Date.now()}`;
    setPanes((prev) => [...prev, { id: newPaneId, breadcrumb: [] }]);
  }, []);

  const handleClosePane = useCallback(
    (paneId: string) => {
      if (panes.length > 1) {
        setPanes((prev) => prev.filter((p) => p.id !== paneId));
      }
    },
    [panes.length]
  );

  const handleFileDrop = useCallback(
    async (
      targetPlaylistId: string,
      videoId: string,
      sourcePlaylistId: string,
      playlistItemId: string
    ) => {
      if (!token) return;

      try {
        // Add video to target playlist
        await addVideoToPlaylist(token, targetPlaylistId, videoId);

        // Remove video from source playlist
        if (sourcePlaylistId && playlistItemId) {
          await removeVideoFromPlaylist(token, playlistItemId);
        }

        // Add a small delay to ensure YouTube API has processed the changes
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Reload panes that are viewing either the target or source playlist
        window.dispatchEvent(
          new CustomEvent("reloadPane", {
            detail: { playlistId: targetPlaylistId },
          })
        );
        if (sourcePlaylistId && sourcePlaylistId !== targetPlaylistId) {
          // Dispatch separately with a small delay to ensure both reload
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("reloadPane", {
                detail: { playlistId: sourcePlaylistId },
              })
            );
          }, 100);
        }
      } catch (error) {
        console.error("Failed to move video:", error);
        throw error;
      }
    },
    [token]
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Panes container */}
      <div className="flex-1 overflow-hidden flex flex-row">
        {panes.map((pane, index) => (
          <div
            key={pane.id}
            className="flex flex-col min-w-0 relative flex-shrink-0"
            style={{
              width: `${100 / panes.length}%`,
              maxWidth: `${100 / panes.length}%`,
            }}
          >
            {/* Pane header */}
            <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800 px-4 py-2 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Pane {index + 1}</span>
                {panes.length > 1 && (
                  <button
                    onClick={() => handleClosePane(pane.id)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title="Close Pane"
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
                )}
              </div>
              {index === panes.length - 1 && (
                <button
                  onClick={handleAddPane}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Add Pane"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Resizer/Divider */}
            {index < panes.length - 1 && (
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-700 z-20 pointer-events-none" />
            )}
            <Pane
              paneId={pane.id}
              breadcrumb={pane.breadcrumb}
              onFolderClick={(folderId, folderName) =>
                handleFolderClick(pane.id, folderId, folderName)
              }
              onBreadcrumbClick={(index) =>
                handleBreadcrumbClick(pane.id, index)
              }
              onFileDrop={handleFileDrop}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
