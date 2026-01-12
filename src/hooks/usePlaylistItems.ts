import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchAllPlaylistItems,
  type YouTubePlaylistItem,
} from "../services/youtubeApi";

export function usePlaylistItems(playlistId: string | null) {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<YouTubePlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!token || !isAuthenticated || !playlistId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const allItems = await fetchAllPlaylistItems(token, playlistId);
      setItems(allItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load playlist items",
      );
      console.error("Error loading playlist items:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, playlistId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    reload: loadItems,
  };
}
