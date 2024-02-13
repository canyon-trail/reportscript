import {
  Cell,
  ColumnSetting,
  RowOptions,
  Unit,
  Watermark,
  Image,
  Document,
  CellStyle,
  CellLayout,
} from "../types";

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
export type NormalizedPageBreakRows = Omit<NormalizedTable, "headers">;
export type NormalizedDocument = Omit<
  Document,
  "headers" | "footers" | "sections" | "pageBreakRows"
> & {
  headers?: NormalizedHeaderFooter;
  footers?: NormalizedHeaderFooter;
  sections: NormalizedSection[];
  pageBreakRows?: NormalizedPageBreakRows;
};

export type CellSettings = CellStyle & CellLayout;
