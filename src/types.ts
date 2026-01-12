export interface FileItem {
  id: string;
  name: string;
  type: 'file';
  thumbnailUrl?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  files: FileItem[];
  thumbnailUrl?: string;
}

export type Item = FileItem | FolderItem;

