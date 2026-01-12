import PaneContent from './PaneContent';

interface PaneProps {
  paneId: string;
  currentFolderId: string | null;
  onFolderClick: (folderId: string) => void;
  onBackClick: () => void;
  onClose: () => void;
  onFileDrop?: (playlistId: string, videoId: string) => void;
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
    <div className="w-full h-full flex flex-col bg-gray-900 overflow-hidden">
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

