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

export type TableStyle = FontSetting & {
  grid?: boolean;
  border?: boolean;
  gridColor?: string;
  backgroundColor?: string;
  lineGap?: number;
  bottomBorder?: boolean;
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
  timeStampPageNumberFontSetting?: FontSetting;
  pageBreakRows?: PageBreakRows;
  watermark?: Watermark;
};

export type Watermark = Omit<
  FontSetting,
  "fontSize" | "bold" | "boldFace" | "underline"
> & {
  text: string;
};

export type FontSetting = {
  fontFace?: string;
  fontSize?: number;
  color?: string;
  boldFace?: string;
  underline?: boolean;
  bold?: boolean;
};
