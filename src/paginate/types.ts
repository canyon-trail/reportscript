import { MeasuredRow, MeasuredWatermark } from "../measure/types";
import { ChartCell, ImageCell, Layout, TextCell } from "../types";

export type PaginatedRow = Omit<MeasuredRow, "data"> & {
  data: PaginatedCell[];
  start: number;
};

export type PaginatedCell = ImageCell | TextCell | ChartCell;

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
