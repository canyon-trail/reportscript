export type Section = {
  headers?: HeaderFooters;
  tables: Table[];
  tableGap?: number;
  watermark?: Watermark;
};

export type MeasuredSection = {
  headers: MeasuredRow[];
  tables: MeasuredTable[];
  index: number;
  tableGap?: number;
  watermark?: MeasuredWatermark;
};

export type Layout = "landscape" | "portrait";

export type CellValue = string | number;

export type Cell = ImageCell | TextCell;

export type ImageCell = {
  image: Image;
  align: HorizontalAlignment;
} & Omit<CellStyle, "fontSize" | "fontFace" | "boldFace" | "bold" | "color">;

export type TextCell = {
  value: CellValue;
} & CellStyle;

export type TableStyle = {
  fontSize?: number;
  fontFace?: string;
  boldFace?: string;
  grid?: boolean;
  border?: boolean;
  gridColor?: string;
  backgroundColor?: string;
  lineGap?: number;
  bottomBorder?: boolean;
  underline?: boolean;
  bold?: boolean;
  color?: string;
};

export type RowOptions = TableStyle;

export type CellStyle = Omit<TableStyle, "border"> & {
  align?: HorizontalAlignment;
  columnSpan?: number;
  verticalAlign?: VerticalAlignment;
  noWrap?: boolean;
};

export type HorizontalAlignment = "left" | "center" | "right";
export type VerticalAlignment = "top" | "center" | "bottom";

export type PaginatedRow = MeasuredRow & {
  start: number;
};

export type Page = {
  rows: MeasuredRow[];
  sectionIndex: number;
  watermark?: MeasuredWatermark;
};

export type Table = {
  rows: Row[];
  headers?: Row[];
  columns?: ColumnSetting[];
  style?: TableStyle;
};

export type PageBreakRows = Omit<Table, "headers">;
export type NormalizedPageBreakRows = Omit<NormalizedTable, "headers">;

export type MeasuredTable = {
  rows: MeasuredRow[];
  headers: MeasuredRow[];
  measureTextHeight: (text: string, index: number, row: Row) => number;
  columns: NormalizedColumnSetting[];
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

export type MeasuredRow = Omit<NormalizedRow, "data"> & {
  height: number;
  data: Cell[];
  columnHeights: number[];
  columnWidths: number[];
  columnStarts: number[];
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

export class UndefinedCellError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, UndefinedCellError.prototype);
  }
}

export type Unit = "fr" | "%" | "pt";
export type NormalizedWidth = { value: number; unit: Unit };
export type NormalizedColumnSetting = Omit<ColumnSetting, "width"> & {
  width: NormalizedWidth;
};
export type NormalizedRow = {
  data: Cell[];
  options?: RowOptions;
  image?: Image;
};
export type NormalizedTable = {
  rows: NormalizedRow[];
  headers?: NormalizedRow[];
  columns?: NormalizedColumnSetting[];
};

export type NormalizedHeaderFooter = Omit<NormalizedTable, "headers">;

export type NormalizedSection = {
  headers?: NormalizedHeaderFooter;
  tables: NormalizedTable[];
  tableGap?: number;
  watermark?: Watermark;
};
export type HeaderFooters = Omit<Table, "headers">;
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
  timeStampPageNumberFontSetting?: TimeStampPageNumberFontSetting;
  pageBreakRows?: PageBreakRows;
  watermark?: Watermark;
};

export type TimeStampPageNumberFontSetting = {
  fontFace?: string;
  fontSize?: number;
};

export type NormalizedDocument = Omit<
  Document,
  "headers" | "footers" | "sections" | "pageBreakRows"
> & {
  headers?: NormalizedHeaderFooter;
  footers?: NormalizedHeaderFooter;
  sections: NormalizedSection[];
  pageBreakRows?: NormalizedPageBreakRows;
};

export type MeasuredDocument = Omit<
  NormalizedDocument,
  "headers" | "footers" | "sections" | "pageBreakRows" | "watermark"
> & {
  headers: MeasuredRow[];
  footers: MeasuredRow[];
  sections: MeasuredSection[];
  layout: Layout;
  documentFooterHeight: number;
  pageBreakRows?: MeasuredRow[];
  watermark?: MeasuredWatermark;
};

export type PaginatedDocument = {
  pages: Page[];
  layout?: Layout;
  watermark?: MeasuredWatermark;
};

export type Watermark = {
  text: string;
  fontFace?: string;
  color?: string;
};

export type MeasuredWatermark = Watermark & {
  x: number;
  y: number;
  origin: number[];
  fontSize: number;
};
