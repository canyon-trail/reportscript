import { margin } from "../measure";
import {
  MeasuredDocument,
  MeasuredSection,
  MeasuredTable,
  MeasuredRow,
  VerticalMeasure,
} from "../measure/types";

export const measureTextHeight = (): VerticalMeasure => ({
  maxHeight: 0,
  minHeight: 0,
});

export const emptyMeasuredRow = {
  columnHeights: [],
  columnWidths: [],
  columnStarts: [],
};

export const emptyMeasuredDoc: MeasuredDocument = {
  layout: "landscape",
  headers: [],
  footers: [],
  sections: [],
};

export const emptySection: MeasuredSection = {
  headers: [],
  tables: [],
  index: 0,
};

export const emptyTable: MeasuredTable = {
  headers: [],
  rows: [],
  measureTextHeight,
  columns: [],
};

export const defaultTableGapRow: MeasuredRow = {
  ...emptyMeasuredRow,
  data: [],
  minHeight: margin,
  maxHeight: margin,
};
