import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tubedrive_pinned_playlists";

/**
 * Custom hook to manage pinned playlists in local storage
 * Pinned playlists are stored as an array of playlist IDs
 */
export function usePinnedPlaylists() {
  const [pinnedPlaylistIds, setPinnedPlaylistIds] = useState<Set<string>>(
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          return new Set(parsed);
        }
      } catch (error) {
        console.error(
          "Failed to load pinned playlists from localStorage:",
          error,
        );
      }
      return new Set();
    },
  );

  // Save to localStorage whenever the set changes
  useEffect(() => {
    try {
      const array = Array.from(pinnedPlaylistIds);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (error) {
      console.error("Failed to save pinned playlists to localStorage:", error);
    }
  }, [pinnedPlaylistIds]);

  const togglePin = useCallback((playlistId: string) => {
    setPinnedPlaylistIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  }, []);

  const isPinned = useCallback(
    (playlistId: string) => {
      return pinnedPlaylistIds.has(playlistId);
    },
    [pinnedPlaylistIds],
  );

  const clearAll = useCallback(() => {
    setPinnedPlaylistIds(new Set());
  }, []);

  return {
    pinnedPlaylistIds,
    togglePin,
    isPinned,
    clearAll,
  };
}
