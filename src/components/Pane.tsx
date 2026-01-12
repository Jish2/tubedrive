import PaneContent from "./PaneContent";

interface PaneProps {
  paneId: string;
  currentFolderId: string | null;
  onFolderClick: (folderId: string) => void;
  onBackClick: () => void;
  onClose: () => void;
  onFileDrop?: (
    playlistId: string,
    videoId: string,
    sourcePlaylistId: string,
    playlistItemId: string
  ) => void;
}

export default function Pane({
  paneId,
  currentFolderId,
  onFolderClick,
  onBackClick,
  onClose,
  onFileDrop,
}: PaneProps) {
  return (
    <div
      className="w-full h-full flex flex-col bg-gray-900 overflow-hidden"
      onDragOver={(e) => {
        // Allow drag over on the entire pane
        if (e.dataTransfer.types.includes("videoId")) {
          e.preventDefault();
        }
      }}
    >
      <PaneContent
        paneId={paneId}
        currentFolderId={currentFolderId}
        onFolderClick={onFolderClick}
        onBackClick={onBackClick}
        onFileDrop={onFileDrop}
      />
    </div>
  );
}
