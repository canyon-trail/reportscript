import { MeasuredRow, MeasuredWatermark } from "../measure/types";
import { Cell, Layout } from "../types";

export type PaginatedRow = Omit<MeasuredRow, "data"> & {
  data: Cell[];
  start: number;
};

export type Page = {
  rows: MeasuredRow[];
  sectionIndex: number;
  watermark?: MeasuredWatermark;
};

export type PaginatedDocument = {
  pages: Page[];
  layout?: Layout;
  watermark?: MeasuredWatermark;
};
