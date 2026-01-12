import { useState, useCallback, useEffect, useRef } from "react";
import Pane from "./Pane";
import { useAuth } from "../contexts/AuthContext";
import { useYouTubePlaylists } from "../hooks/useYouTubePlaylists";
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

// Load pane state from URL
function loadPanesFromURL(
  playlists: Array<{ id: string; snippet: { title: string } }>
): PaneState[] {
  const params = new URLSearchParams(window.location.search);
  const panes: PaneState[] = [];

  // Find all pane-N parameters and sort them
  const paneKeys: number[] = [];
  params.forEach((_, key) => {
    if (key.startsWith("pane-")) {
      const index = parseInt(key.replace("pane-", ""), 10);
      if (!isNaN(index)) {
        paneKeys.push(index);
      }
    }
  });
  paneKeys.sort((a, b) => a - b);

  // Load each pane in order
  for (const paneIndex of paneKeys) {
    const paneKey = `pane-${paneIndex}`;
    const paneValue = params.get(paneKey);

    if (paneValue === null) continue;

    // Parse breadcrumb path (e.g., "jazz house" or "parent/child")
    const breadcrumbNames = paneValue
      .split("/")
      .map((name) => decodeURIComponent(name.trim()))
      .filter((name) => name);
    const breadcrumb: BreadcrumbItem[] = [];

    // Resolve each breadcrumb name to an ID
    for (const name of breadcrumbNames) {
      // Find playlist by name (case-insensitive, take first match)
      const playlist = playlists.find(
        (p) => p.snippet.title.toLowerCase() === name.toLowerCase()
      );

      if (playlist) {
        breadcrumb.push({
          id: playlist.id,
          name: playlist.snippet.title, // Use the actual title from API
        });
      } else {
        // If we can't find the playlist, skip this breadcrumb
        // This handles cases where playlists were deleted or renamed
        console.warn(`Could not find playlist with name: ${name}`);
      }
    }

    panes.push({
      id: `pane-${paneIndex}`,
      breadcrumb,
    });
  }

  // Fallback: try old JSON format for backward compatibility
  if (panes.length === 0) {
    const panesParam = params.get("panes");
    if (panesParam) {
      try {
        const decoded = decodeURIComponent(panesParam);
        const parsed = JSON.parse(decoded) as PaneState[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (error) {
        console.error("Failed to parse panes from URL:", error);
      }
    }
  }

  // Default state if no panes found
  if (panes.length === 0) {
    return [{ id: "pane-1", breadcrumb: [] }];
  }

  return panes;
}

// Save pane state to URL in readable format
function savePanesToURL(panes: PaneState[]) {
  try {
    const url = new URL(window.location.href);

    // Remove old pane parameters
    const keysToRemove: string[] = [];
    url.searchParams.forEach((_, key) => {
      if (key.startsWith("pane-")) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach((key) => url.searchParams.delete(key));

    // Remove old "panes" parameter if it exists
    url.searchParams.delete("panes");

    // Add new pane parameters in readable format
    panes.forEach((pane, index) => {
      const paneIndex = index + 1;
      const paneKey = `pane-${paneIndex}`;

      if (pane.breadcrumb.length > 0) {
        // Join breadcrumb names with "/" separator
        const breadcrumbPath = pane.breadcrumb
          .map((item) => encodeURIComponent(item.name))
          .join("/");
        url.searchParams.set(paneKey, breadcrumbPath);
      }
      // Empty panes are not added to URL to keep it clean
    });

    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    console.error("Failed to save panes to URL:", error);
  }
}

export default function MultiPaneView() {
  const { token } = useAuth();
  const { playlists, loading: playlistsLoading } = useYouTubePlaylists();
  const hasLoadedFromURL = useRef(false);
  const [panes, setPanes] = useState<PaneState[]>(() => {
    // Start with default - we'll load from URL once playlists are ready
    return [{ id: "pane-1", breadcrumb: [] }];
  });

  // Load panes from URL once playlists are available (only on initial load)
  useEffect(() => {
    if (
      !hasLoadedFromURL.current &&
      !playlistsLoading &&
      playlists.length > 0
    ) {
      const params = new URLSearchParams(window.location.search);
      const hasPaneParams = Array.from(params.keys()).some((key) =>
        key.startsWith("pane-")
      );

      if (hasPaneParams) {
        const urlPanes = loadPanesFromURL(playlists);
        if (urlPanes.length > 0) {
          setPanes(urlPanes);
        }
        hasLoadedFromURL.current = true;
      } else {
        // No pane params in URL, mark as loaded
        hasLoadedFromURL.current = true;
      }
    }
  }, [playlists, playlistsLoading]);

  // Update URL whenever panes change (but not during initial load)
  useEffect(() => {
    if (hasLoadedFromURL.current && !playlistsLoading) {
      savePanesToURL(panes);
    }
  }, [panes, playlistsLoading]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (!playlistsLoading && playlists.length > 0) {
        const newPanes = loadPanesFromURL(playlists);
        setPanes(newPanes);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [playlists, playlistsLoading]);

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
