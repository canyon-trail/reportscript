import {
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedRow,
} from "../normalize/types";
import { Cell, Layout, Watermark } from "../types";

export type MeasuredTable = {
  rows: MeasuredRow[];
  headers: MeasuredRow[];
  measureTextHeight: (
    text: string,
    index: number,
    row: NormalizedRow | MeasuredRow
  ) => VerticalMeasure;
  columns: NormalizedColumnSetting[];
};
export type MeasuredSection = {
  headers: MeasuredRow[];
  tables: MeasuredTable[];
  index: number;
  tableGap?: number;
  watermark?: MeasuredWatermark;
};

export type VerticalMeasure = {
  minHeight: number;
  maxHeight?: number;
};

export type MeasuredRow = Omit<NormalizedRow, "data"> & {
  data: Cell[];
  columnHeights: VerticalMeasure[];
  columnWidths: number[];
  columnStarts: number[];
  maxHeight?: number;
  minHeight: number;
  /**
   * True when this row cannot fit on any page of the document. Stamped during
   * prepareDoc; consumed by the splitting layers to force-place the row
   * instead of looping forever.
   */
  isOversized?: boolean;
};
export type MeasuredDocument = Omit<
  NormalizedDocument,
  "headers" | "footers" | "sections" | "pageBreakRows" | "watermark"
> & {
  headers: MeasuredRow[];
  footers: MeasuredRow[];
  sections: MeasuredSection[];
  layout: Layout;
  pageBreakRows?: MeasuredRow[];
  watermark?: MeasuredWatermark;
};
export type MeasuredWatermark = Watermark & {
  x: number;
  y: number;
  origin: number[];
  fontSize: number;
};
export class UndefinedCellError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, UndefinedCellError.prototype);
  }
}
