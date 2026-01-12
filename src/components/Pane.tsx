import PaneContent from "./PaneContent";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface PaneProps {
  paneId: string;
  breadcrumb: BreadcrumbItem[];
  onFolderClick: (folderId: string, folderName: string) => void;
  onBreadcrumbClick: (index: number) => void;
  onFileDrop?: (
    playlistId: string,
    videoId: string,
    sourcePlaylistId: string,
    playlistItemId: string
  ) => void;
}

export default function Pane({
  paneId,
  breadcrumb,
  onFolderClick,
  onBreadcrumbClick,
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
        breadcrumb={breadcrumb}
        onFolderClick={onFolderClick}
        onBreadcrumbClick={onBreadcrumbClick}
        onFileDrop={onFileDrop}
      />
    </div>
  );
}
