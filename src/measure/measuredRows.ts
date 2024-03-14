import { PdfKitApi } from "../reportDocument";
import { NormalizedRow } from "../normalize/types";
import { MeasuredRow, VerticalMeasure } from "./types";
import {
  calculateColumnWidthsWithoutPadding,
  getCellHeight,
  margin,
} from "../measure";
import { Cell } from "../types";

export function measuredRows(
  doc: PdfKitApi,
  rows: NormalizedRow[],
  columnwidths: number[]
): MeasuredRow[] {
  return rows.map((r) => {
    const adjustedWidths = getColumnWidthsForRow(columnwidths, r);
    return {
      ...r,
      ...getRowHeight(r, doc, adjustedWidths),
      columnHeights: measureCellHeights(r, doc, adjustedWidths),
      columnWidths: adjustedWidths,
      columnStarts: calculateCellLeftCoords(adjustedWidths),
    };
  });
}
export function getRowHeight(
  row: NormalizedRow,
  doc: PdfKitApi,
  columnwidths?: number[]
): VerticalMeasure {
  const { data, image } = row;
  let minHeight = -Infinity;
  let maxHeight = -Infinity;

  const widthsWithoutPadding =
    calculateColumnWidthsWithoutPadding(columnwidths);

  let hasExpandableChart = false;

  data.forEach((cell, idx) => {
    hasExpandableChart = "chart" in cell && !cell.chart.maxHeight;
    const heights = getCellHeight(cell, widthsWithoutPadding[idx], doc);
    minHeight = Math.max(minHeight, heights.minHeight);

    maxHeight = hasExpandableChart
      ? undefined
      : Math.max(maxHeight, heights.maxHeight);
  });

  if (image) {
    minHeight += image.height;
    maxHeight = !hasExpandableChart ? maxHeight + image.height : undefined;
  }

  return { minHeight, maxHeight };
}
export function measureCellHeights(
  row: NormalizedRow,
  doc: PdfKitApi,
  columnWidths: number[]
): VerticalMeasure[] {
  const widths = calculateColumnWidthsWithoutPadding(columnWidths);
  return row.data.map((cell, idx) => getCellHeight(cell, widths[idx], doc));
}
export function getCellAlign(cell: Cell): string {
  return cell?.horizontalAlign ?? "center";
}
export function calculateCellLeftCoords(widths: number[]): number[] {
  return widths.map((_, index) => {
    return index == 0
      ? margin
      : widths.slice(0, index).reduce((w, cur) => w + cur, margin);
  });
}
export function getColumnWidthsForRow(
  widths: number[],
  row: NormalizedRow
): number[] {
  let cellIndex = 0;
  return row.data.map((cell) => {
    const columnWidth = widths
      .slice(cellIndex, cell.columnSpan + cellIndex)
      .reduce((a, b) => a + b, 0);
    cellIndex += cell.columnSpan;
    return columnWidth;
  });
}
