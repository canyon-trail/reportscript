export type Section = {
  headers?: HeaderFooters;
  tables: Table[];
  tableGap?: number;
  watermark?: Watermark;
};

export type RenderPdf = (document: Document, response: NodeJS.WritableStream) => NodeJS.WritableStream

export type Layout = "landscape" | "portrait";

export type CellValue = string | number;

export type Cell = ImageCell | TextCell;

export type ImageCell = {
  image: Image;
  align: HorizontalAlignment;
  columnSpan?: number;
  verticalAlign?: VerticalAlignment;
  noWrap?: boolean;
  grid?: boolean;
  gridColor?: string;
  backgroundColor?: string;
  lineGap?: number;
  bottomBorder?: boolean;
};

export type TextCell = {
  value: CellValue;
} & CellStyle;

export type RowOptions = {
  grid?: boolean;
  border?: boolean;
  gridColor?: string;
  backgroundColor?: string;
  lineGap?: number;
  bottomBorder?: boolean;
  fontFace?: string;
  fontSize?: number;
  color?: string;
  boldFace?: string;
  underline?: boolean;
  bold?: boolean;
};

export type CellStyle = {
  align?: HorizontalAlignment;
  columnSpan?: number;
  verticalAlign?: VerticalAlignment;
  noWrap?: boolean;
  grid?: boolean;
  gridColor?: string;
  backgroundColor?: string;
  lineGap?: number;
  bottomBorder?: boolean;
  fontFace?: string;
  fontSize?: number;
  color?: string;
  boldFace?: string;
  underline?: boolean;
  bold?: boolean;
};

export type HorizontalAlignment = "left" | "center" | "right";
export type VerticalAlignment = "top" | "center" | "bottom";

export type Table = {
  rows: Row[];
  headers?: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type PageBreakRows = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type Image = {
  height: number;
  width?: number;
  image: Buffer | string;
};

export type Row = {
  data: (Cell | CellValue)[];
  options?: RowOptions;
  image?: Image;
};

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

export type Unit = "fr" | "%" | "pt";

export type HeaderFooters = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
}

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

export type Watermark = {
  text: string;
  fontFace?: string;
  color?: string;
};

export type FontSetting = {
  fontFace?: string;
  fontSize?: number;
  color?: string;
  boldFace?: string;
  underline?: boolean;
  bold?: boolean;
};

export type SnapshotResult = {
  snapshot: string;
  rendered: string;
};
