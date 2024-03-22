import { PdfKitApi } from "../reportDocument";
import { NormalizedRow } from "../normalize/types";
import { MeasuredRow, UndefinedCellError, VerticalMeasure } from "./types";
import { Cell } from "../types";
import { margin, textHPadding, lineGap, defaultFontSize } from ".";

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
export function calculateColumnWidthsWithoutPadding(columnwidths: number[]) {
  return columnwidths.map((x) => x - textHPadding * 2);
}
export function getCellHeight(
  cell: Cell,
  width: number,
  doc: PdfKitApi,
  text?: string | number
): VerticalMeasure {
  const gap = lineGap * 0.5;
  const rowLineGap = cell?.lineGap ?? lineGap;

  const heightOptions = {
    width,
    lineGap: rowLineGap,
    align: cell?.horizontalAlign,
  };

  if (!cell) {
    throw new UndefinedCellError("Cell is undefined");
  }

  if ("image" in cell) {
    const height = cell.image.height + rowLineGap + lineGap;
    return {
      minHeight: height,
      maxHeight: height,
    };
  }

  if ("chart" in cell) {
    return {
      minHeight: cell.chart.minHeight + rowLineGap + lineGap,
      maxHeight: cell.chart.maxHeight
        ? cell.chart.maxHeight + rowLineGap + lineGap
        : undefined,
    };
  }

  if ("template" in cell) {
    const highVariable = {
      documentPageNumber: 1000,
      documentPageCount: 1000,
      sectionPageNumber: 1000,
      sectionPageCount: 1000,
      timestamp: "Thu Jun 01 2023 19:10:58",
    };
    const highBoundTemplate = cell.template.renderTemplate(highVariable);
    const options = {
      ...heightOptions,
      height: cell.noWrap ? cell.fontSize : undefined,
    };
    const height = doc.heightOfString(highBoundTemplate, options) + gap;
    return {
      minHeight: height,
      maxHeight: height,
    };
  }

  doc.fontSize(cell?.fontSize ?? defaultFontSize);

  const textContent = text ?? cell?.value;

  const textVal = textContent ? (cell?.noWrap ? "X" : `${textContent}`) : "";

  const height =
    doc.heightOfString(textVal, {
      ...heightOptions,
      height: cell.noWrap ? cell.fontSize : undefined,
    }) + gap;

  return { minHeight: height, maxHeight: height };
}

export function getCellHeightWithText(
  row: NormalizedRow,
  index: number,
  doc: PdfKitApi,
  text?: string | number,
  columnwidths?: number[]
): VerticalMeasure {
  const widths = calculateColumnWidthsWithoutPadding(columnwidths);
  return getCellHeight(row.data[index], widths[index], doc, text);
}
