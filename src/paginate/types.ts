import { MeasuredRow, MeasuredWatermark } from "../measure/types";
import { Layout } from "../types";

export type PaginatedRow = MeasuredRow & {
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
