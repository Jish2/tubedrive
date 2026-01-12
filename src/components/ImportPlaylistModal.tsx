import { useState, useRef, useEffect } from "react";
import { YouTubePlaylist } from "../services/youtubeApi";

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (playlistId: string, videoIds: string[]) => Promise<void>;
  onCreateAndImport?: (
    title: string,
    description: string,
    privacyStatus: "private" | "unlisted" | "public",
    videoIds: string[],
  ) => Promise<void>;
  playlists: YouTubePlaylist[];
  currentPlaylistId?: string | null;
}

export default function ImportPlaylistModal({
  isOpen,
  onClose,
  onImport,
  onCreateAndImport,
  playlists,
  currentPlaylistId,
}: ImportPlaylistModalProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    currentPlaylistId || "",
  );
  const [createNewPlaylist, setCreateNewPlaylist] =
    useState<boolean>(!currentPlaylistId);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [newPlaylistPrivacy, setNewPlaylistPrivacy] = useState<
    "private" | "unlisted" | "public"
  >("private");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaylistId(currentPlaylistId || "");
      setCreateNewPlaylist(!currentPlaylistId);
      setNewPlaylistTitle("");
      setNewPlaylistDescription("");
      setNewPlaylistPrivacy("private");
      setCsvFile(null);
      setVideoCount(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, currentPlaylistId]);

  if (!isOpen) return null;

  const parseCSV = (text: string): string[] => {
    const lines = text.split("\n");
    const videoIds: string[] = [];

    // Skip header row if present
    const startIndex = lines[0]?.includes("Video ID") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma and take the first column (Video ID)
      const columns = line.split(",");
      const videoId = columns[0]?.trim();

      // YouTube video IDs are typically 11 characters
      if (videoId && videoId.length >= 10) {
        videoIds.push(videoId);
      }
    }

    return videoIds;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setCsvFile(file);
    setError(null);

    // Read and parse the file to count videos
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const videoIds = parseCSV(text);
      setVideoCount(videoIds.length);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!csvFile) {
      setError("Please select a CSV file");
      return;
    }

    if (createNewPlaylist) {
      if (!onCreateAndImport) {
        setError("Cannot create new playlist from this view");
        return;
      }
      if (!newPlaylistTitle.trim()) {
        setError("Please enter a playlist title");
        return;
      }
    } else {
      if (!selectedPlaylistId) {
        setError("Please select a playlist");
        return;
      }
    }

    setIsLoading(true);
    try {
      const text = await csvFile.text();
      const videoIds = parseCSV(text);

      if (videoIds.length === 0) {
        setError("No valid video IDs found in the CSV file");
        setIsLoading(false);
        return;
      }

      if (createNewPlaylist && onCreateAndImport) {
        await onCreateAndImport(
          newPlaylistTitle.trim(),
          newPlaylistDescription.trim(),
          newPlaylistPrivacy,
          videoIds,
        );
      } else {
        await onImport(selectedPlaylistId, videoIds);
      }

      setCsvFile(null);
      setVideoCount(null);
      setNewPlaylistTitle("");
      setNewPlaylistDescription("");
      setNewPlaylistPrivacy("private");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import playlist",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCsvFile(null);
      setVideoCount(null);
      setError(null);
      setSelectedPlaylistId(currentPlaylistId || "");
      setCreateNewPlaylist(!currentPlaylistId);
      setNewPlaylistTitle("");
      setNewPlaylistDescription("");
      setNewPlaylistPrivacy("private");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const currentPlaylist = currentPlaylistId
    ? playlists.find((p) => p.id === currentPlaylistId)
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Import Playlist</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
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
        </div>

        <form onSubmit={handleSubmit}>
          {currentPlaylistId ? (
            // When viewing a specific playlist, show it as read-only
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Playlist
              </label>
              <div className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                {currentPlaylist?.snippet.title || "Current Playlist"}
              </div>
            </div>
          ) : (
            // When on homepage, allow creating new or selecting existing
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Playlist <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setCreateNewPlaylist(true)}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    createNewPlaylist
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  } disabled:opacity-50`}
                >
                  Create New Playlist
                </button>
                <button
                  type="button"
                  onClick={() => setCreateNewPlaylist(false)}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    !createNewPlaylist
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  } disabled:opacity-50`}
                >
                  Use Existing
                </button>
              </div>
              {createNewPlaylist ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newPlaylistTitle}
                    onChange={(e) => setNewPlaylistTitle(e.target.value)}
                    placeholder="Playlist title"
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 disabled:opacity-50"
                    required
                  />
                  <textarea
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    placeholder="Description (optional)"
                    disabled={isLoading}
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 disabled:opacity-50 resize-none"
                  />
                  <select
                    value={newPlaylistPrivacy}
                    onChange={(e) =>
                      setNewPlaylistPrivacy(
                        e.target.value as "private" | "unlisted" | "public",
                      )
                    }
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-50"
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              ) : (
                <select
                  id="playlist"
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-50"
                  required
                >
                  <option value="">Select a playlist...</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.snippet.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="csvFile"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              CSV File <span className="text-red-400">*</span>
            </label>
            <input
              ref={fileInputRef}
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
              required
            />
            {videoCount !== null && (
              <p className="mt-2 text-sm text-gray-400">
                Found {videoCount} video{videoCount !== 1 ? "s" : ""} in CSV
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                (!createNewPlaylist && !selectedPlaylistId) ||
                (createNewPlaylist && !newPlaylistTitle.trim()) ||
                !csvFile ||
                videoCount === 0
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
