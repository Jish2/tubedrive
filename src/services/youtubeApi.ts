const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  contentDetails: {
    itemCount: number;
  };
}

export interface YouTubePlaylistItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    resourceId: {
      videoId: string;
    };
  };
}

export interface YouTubePlaylistResponse {
  items: YouTubePlaylist[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubePlaylistItemsResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

/**
 * Fetch all playlists for the authenticated user
 */
export async function fetchUserPlaylists(
  accessToken: string,
  maxResults: number = 50,
  pageToken?: string,
): Promise<YouTubePlaylistResponse> {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    mine: "true",
    maxResults: maxResults.toString(),
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/playlists?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Failed to fetch playlists: ${
        error.error?.message || response.statusText
      }`,
    );
  }

  return response.json();
}

/**
 * Fetch all items in a specific playlist
 */
export async function fetchPlaylistItems(
  accessToken: string,
  playlistId: string,
  maxResults: number = 50,
  pageToken?: string,
): Promise<YouTubePlaylistItemsResponse> {
  const params = new URLSearchParams({
    part: "snippet",
    playlistId,
    maxResults: maxResults.toString(),
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Failed to fetch playlist items: ${
        error.error?.message || response.statusText
      }`,
    );
  }

  return response.json();
}

/**
 * Fetch all items in a playlist (handles pagination automatically)
 */
export async function fetchAllPlaylistItems(
  accessToken: string,
  playlistId: string,
): Promise<YouTubePlaylistItem[]> {
  const allItems: YouTubePlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const response = await fetchPlaylistItems(
      accessToken,
      playlistId,
      50,
      pageToken,
    );
    allItems.push(...response.items);
    pageToken = response.nextPageToken;
  } while (pageToken);

  return allItems;
}

/**
 * Create a new playlist
 */
export async function createPlaylist(
  accessToken: string,
  title: string,
  description: string = "",
  privacyStatus: "private" | "unlisted" | "public" = "private",
): Promise<YouTubePlaylist> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/playlists?part=snippet,status`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Failed to create playlist: ${
        error.error?.message || response.statusText
      }`,
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Update an existing playlist
 */
export async function updatePlaylist(
  accessToken: string,
  playlistId: string,
  title: string,
  description: string = "",
): Promise<YouTubePlaylist> {
  const response = await fetch(`${YOUTUBE_API_BASE}/playlists?part=snippet`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: playlistId,
      snippet: {
        title,
        description,
      },
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Failed to update playlist: ${
        error.error?.message || response.statusText
      }`,
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Add a video to a playlist
 */
export async function addVideoToPlaylist(
  accessToken: string,
  playlistId: string,
  videoId: string,
): Promise<YouTubePlaylistItem> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?part=snippet`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Failed to add video to playlist: ${
        error.error?.message || response.statusText
      }`,
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Add multiple videos to a playlist (batch import)
 * Adds videos sequentially with a small delay to avoid rate limiting
 */
export async function addVideosToPlaylist(
  accessToken: string,
  playlistId: string,
  videoIds: string[],
  onProgress?: (current: number, total: number) => void,
): Promise<YouTubePlaylistItem[]> {
  const results: YouTubePlaylistItem[] = [];
  const errors: string[] = [];

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    try {
      const result = await addVideoToPlaylist(accessToken, playlistId, videoId);
      results.push(result);
      onProgress?.(i + 1, videoIds.length);

      // Small delay to avoid rate limiting (50ms between requests)
      if (i < videoIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`Video ${videoId}: ${errorMessage}`);
      // Continue with next video even if one fails
      onProgress?.(i + 1, videoIds.length);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    // If all videos failed, throw an error
    throw new Error(
      `Failed to add videos: ${errors.slice(0, 3).join("; ")}${
        errors.length > 3 ? ` (and ${errors.length - 3} more)` : ""
      }`,
    );
  }

  if (errors.length > 0) {
    // If some videos failed, log warnings but don't throw
    console.warn(
      `Some videos failed to import: ${errors.slice(0, 5).join("; ")}${
        errors.length > 5 ? ` (and ${errors.length - 5} more)` : ""
      }`,
    );
  }

  return results;
}

/**
 * Remove a video from a playlist
 */
export async function removeVideoFromPlaylist(
  accessToken: string,
  playlistItemId: string,
): Promise<void> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?id=${playlistItemId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Failed to remove video from playlist: ${
        error.error?.message || response.statusText
      }`,
    );
  }
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(
  accessToken: string,
  playlistId: string,
): Promise<void> {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/playlists?id=${playlistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Failed to delete playlist: ${
        error.error?.message || response.statusText
      }`,
    );
  }
}
