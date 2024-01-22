export type Cell = ImageCell | TextCell;

export interface CellOptions {
  align?: HorizontalAlignment;
  columnSpan?: number;
}

export interface CellStyle {
  verticalAlign?: VerticalAlignment;
  noWrap?: boolean;
  grid?: boolean;
  gridColor?: string;
  backgroundColor?: string;
  lineGap?: number;
  bottomBorder?: boolean;
}

export type CellValue = string | number;

export type ColumnSplitFn = (
  value: string,
  measure: (text: string) => number,
  availableSpace: number
) => [string, string] | [string];

export type ColumnSetting = {
  align?: HorizontalAlignment;
  width?: string;
  splitFn?: ColumnSplitFn;
};

export type Document = {
  headers?: HeaderFooters;
  footers?: HeaderFooters;
  sections: Section[];
  pageNumbers?: boolean;
  sectionPageNumbers?: boolean;
  timestamp?: boolean;
  layout?: Layout;
  repeatSectionHeaders?: boolean;
  repeatReportHeaders?: boolean;
  tableGap?: number;
  timeStampPageNumberFontSetting?: FontSetting;
  pageBreakRows?: PageBreakRows;
  watermark?: Watermark;
};

export type FontSetting = {
  fontFace?: string;
  fontSize?: number;
  color?: string;
  boldFace?: string;
  underline?: boolean;
  bold?: boolean;
};

export type HeaderFooters = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type HorizontalAlignment = "left" | "center" | "right";

export type Image = {
  height: number;
  width?: number;
  image: Buffer | string;
};

export interface ImageCell extends CellStyle, CellOptions {
  image: Image;
  align: HorizontalAlignment;
}

export type Layout = "landscape" | "portrait";

export type PageBreakRows = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type RenderPdf = (
  document: Document,
  response: NodeJS.WritableStream
) => NodeJS.WritableStream;

export type Row = {
  data: (Cell | CellValue)[];
  options?: RowOptions;
  image?: Image;
};

export type RowOptions = CellStyle &
  FontSetting & {
    border?: boolean;
  };

export type Section = {
  headers?: HeaderFooters;
  tables: Table[];
  tableGap?: number;
  watermark?: Watermark;
};

export type SnapshotResult = {
  snapshot: string;
  rendered: string;
};

export type Table = {
  rows: Row[];
  headers?: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type TextCell = CellStyle &
  FontSetting &
  CellOptions & {
    value: CellValue;
  };

export type Unit = "fr" | "%" | "pt";

export type VerticalAlignment = "top" | "center" | "bottom";

export type Watermark = {
  text: string;
  fontFace?: string;
  color?: string;
};
