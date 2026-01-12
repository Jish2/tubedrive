export interface FileItem {
  id: string;
  name: string;
  type: 'file';
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  files: FileItem[];
}

export type Item = FileItem | FolderItem;

