import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUserPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  type YouTubePlaylist,
} from "../services/youtubeApi";

export function useYouTubePlaylists() {
  const { token, isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchUserPlaylists(token);
      setPlaylists(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists");
      console.error("Error loading playlists:", err);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  const handleCreatePlaylist = async (
    title: string,
    description: string = "",
    privacyStatus: "private" | "unlisted" | "public" = "private",
  ) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const newPlaylist = await createPlaylist(
        token,
        title,
        description,
        privacyStatus,
      );
      setPlaylists((prev) => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create playlist";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlaylist = async (
    playlistId: string,
    title: string,
    description: string = "",
  ) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const updatedPlaylist = await updatePlaylist(
        token,
        playlistId,
        title,
        description,
      );
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? updatedPlaylist : p)),
      );
      return updatedPlaylist;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update playlist";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await deletePlaylist(token, playlistId);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete playlist";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadPlaylists();
    }
  }, [isAuthenticated, token, loadPlaylists]);

  return {
    playlists,
    loading,
    error,
    loadPlaylists,
    createPlaylist: handleCreatePlaylist,
    updatePlaylist: handleUpdatePlaylist,
    deletePlaylist: handleDeletePlaylist,
  };
}
