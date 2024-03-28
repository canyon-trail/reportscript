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

type rowParam = {
  rowHeight: number;
  value: string;
};
type rowsParams = {
  rowHeight: number;
  length: number;
  value?: string;
};

export const createRows = (params: rowsParams) => {
  const { rowHeight, length: length, value } = params;
  return [...Array(length).keys()].map((_, index) => {
    return {
      ...emptyMeasuredRow,
      minHeight: rowHeight,
      maxHeight: rowHeight,
      data: [{ value: `${value ?? ""}${index}` }],
    };
  });
};

export const createRow = (params: rowParam) => {
  const { rowHeight, value } = params;
  return {
    ...emptyMeasuredRow,
    minHeight: rowHeight,
    maxHeight: rowHeight,
    data: [{ value: `${value}` }],
  };
};
