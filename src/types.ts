export interface FileItem {
  id: string;
  name: string;
  type: "file";
  thumbnailUrl?: string;
  videoId?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  type: "folder";
  files: FileItem[];
  thumbnailUrl?: string;
  itemCount?: number;
}

export type Item = FileItem | FolderItem;
