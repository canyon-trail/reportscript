export type Section = {
  headers?: HeaderFooters;
  tables: Table[];
  tableGap?: number;
  watermark?: Watermark;
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

export type Table = {
  rows: Row[];
  headers?: Row[];
  columns?: ColumnSetting[];
  style?: TableStyle;
};

export type PageBreakRows = Omit<Table, "headers">;

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

export type Watermark = {
  text: string;
  fontFace?: string;
  color?: string;
};
