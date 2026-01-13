import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchPlaylistItems,
  type YouTubePlaylistItem,
} from "../services/youtubeApi";

const PAGE_SIZE = 50;

export function usePlaylistItems(playlistId: string | null) {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<YouTubePlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const initialLoadRef = useRef(false);
  const loadingRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    if (!token || !isAuthenticated || !playlistId) {
      setItems([]);
      setNextPageToken(null);
      setError(null);
      initialLoadRef.current = false;
      return;
    }

    // Prevent concurrent loads
    if (loadingRef.current) {
      return;
    }

    initialLoadRef.current = false;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPlaylistItems(token, playlistId, PAGE_SIZE);
      setItems(response.items);
      setNextPageToken(response.nextPageToken ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load playlist items",
      );
      console.error("Error loading playlist items:", err);
      setItems([]);
      setNextPageToken(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      initialLoadRef.current = true;
    }
  }, [token, isAuthenticated, playlistId]);

  const loadMore = useCallback(async () => {
    if (
      !token ||
      !isAuthenticated ||
      !playlistId ||
      loadingMore ||
      loading ||
      !nextPageToken ||
      !initialLoadRef.current
    ) {
      console.log("loadMore skipped:", {
        hasToken: !!token,
        isAuthenticated,
        hasPlaylistId: !!playlistId,
        loadingMore,
        loading,
        hasNextPageToken: !!nextPageToken,
        initialLoaded: initialLoadRef.current,
      });
      return;
    }

    console.log(`Loading more items for playlist ${playlistId}...`);
    setLoadingMore(true);
    try {
      const response = await fetchPlaylistItems(
        token,
        playlistId,
        PAGE_SIZE,
        nextPageToken,
      );
      console.log(`Loaded ${response.items.length} more items`);
      setItems((prev) => [...prev, ...response.items]);
      setNextPageToken(response.nextPageToken ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more videos",
      );
      console.error("Error loading more playlist items:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [token, isAuthenticated, playlistId, loadingMore, loading, nextPageToken]);

  const reload = useCallback(async () => {
    initialLoadRef.current = false;
    setItems([]);
    setNextPageToken(null);
    await loadFirstPage();
  }, [loadFirstPage]);

  // Optimistic update: add an item
  const addItem = useCallback((item: YouTubePlaylistItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  // Optimistic update: remove an item
  const removeItem = useCallback((playlistItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== playlistItemId));
  }, []);

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, playlistId]);

  return {
    items,
    loading,
    loadingMore,
    error,
    loadMore,
    reload,
    hasMore: Boolean(nextPageToken),
    addItem,
    removeItem,
  };
}
