const youtube_api = "https://developers.google.com/apis-explorer/#p/youtube/v3/youtube";

const retrieveAllPlaylists = () => `${youtube_api}.playlists.list?
  part=snippet,contentDetails
  &mine=true`;

const retrievePlaylistData = () => `${youtube_api}.playlists.list?
  part=contentDetails
  &id=${id}`;

const createPlaylist = () => `${youtube_api}.playlists.insert?
  part=snippet,status`;

const updatePlaylist = () => `${youtube_api}.playlists.update?
  part=snippet,status`;

export const results = { playlist: playlists, some: "bar" };
