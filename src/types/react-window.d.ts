declare module "react-window" {
  import * as React from "react";

  export interface ListOnItemsRenderedProps {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }

  export interface ListChildComponentProps<T = any> {
    data: T;
    index: number;
    style: React.CSSProperties;
  }

  export interface FixedSizeListProps<T = any> {
    children: (props: ListChildComponentProps<T>) => React.ReactElement | null;
    height: number;
    itemCount: number;
    itemSize: number;
    width: number | string;
    overscanCount?: number;
    onItemsRendered?: (props: ListOnItemsRenderedProps) => void;
  }

  export class FixedSizeList<T = any> extends React.Component<
    FixedSizeListProps<T>
  > {}

  export interface GridOnItemsRenderedProps {
    visibleColumnStartIndex: number;
    visibleColumnStopIndex: number;
    visibleRowStartIndex: number;
    visibleRowStopIndex: number;
    overscanColumnStartIndex: number;
    overscanColumnStopIndex: number;
    overscanRowStartIndex: number;
    overscanRowStopIndex: number;
  }

  export interface GridChildComponentProps {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }

  export interface FixedSizeGridProps {
    children: (props: GridChildComponentProps) => React.ReactElement | null;
    columnCount: number;
    columnWidth: number;
    height: number;
    rowCount: number;
    rowHeight: number;
    width: number;
    overscanRowCount?: number;
    overscanColumnCount?: number;
    onItemsRendered?: (props: GridOnItemsRenderedProps) => void;
  }

  export class FixedSizeGrid extends React.Component<FixedSizeGridProps> {}
}
