const youtube_api = "https://developers.google.com/apis-explorer/#p/youtube/v3/youtube";

export const retrieveAllPlaylists = async () => {
  const response = await fetch(`${youtube_api}.playlists.list?
    part=snippet,contentDetails
    &mine=true`
  );
  const json = response.json();
  console.log("fetch results", json);
  return json;
}
    
const retrievePlaylistData = (id: string) => `${youtube_api}.playlists.list?
  part=contentDetails
  &id=${id}`;

const createPlaylist = () => `${youtube_api}.playlists.insert?
  part=snippet,status`;

const updatePlaylist = () => `${youtube_api}.playlists.update?
  part=snippet,status`;

export const results = { playlist: "", some: "bar" };
