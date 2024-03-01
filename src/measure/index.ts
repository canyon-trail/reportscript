import { Layout, Cell, Watermark } from "../types";
import { UndefinedCellError, VerticalMeasure } from "./types";
import { PdfKitApi } from "../reportDocument";
import { calculateColumnWidths } from "../paginate/calculateColumnWidths";
import {
  NormalizedDocument,
  NormalizedHeaderFooter,
  NormalizedPageBreakRows,
  NormalizedRow,
  NormalizedSection,
  NormalizedTable,
} from "../normalize/types";
import {
  MeasuredDocument,
  MeasuredRow,
  MeasuredSection,
  MeasuredTable,
  MeasuredWatermark,
} from "./types";
export const ptsPerInch = 72;
export const margin = ptsPerInch / 4;
export const defaultFontSize = 7;
export const textHPadding = 2;
export const lineGap = margin * 0.25;

export function measure(
  document: NormalizedDocument,
  doc: PdfKitApi
): MeasuredDocument {
  const { headers, footers, sections, pageBreakRows, watermark } = document;
  const layout = document?.layout ?? "landscape";
  const { availableWidth, pageHeight, pageWidth } = getPageDimensions(layout);

  return {
    ...document,
    layout,
    headers: measureHeaderFooter(doc, headers, availableWidth),
    footers: measureHeaderFooter(doc, footers, availableWidth),
    sections: getMeasuredSections(
      doc,
      sections,
      availableWidth,
      pageHeight,
      pageWidth
    ),
    pageBreakRows:
      pageBreakRows &&
      getMeasuredPageBreakRows(doc, pageBreakRows, availableWidth),
    watermark:
      watermark && getMeasuredWatermark(watermark, pageHeight, pageWidth),
  };
}

export function getMeasuredSections(
  doc: PdfKitApi,
  sections: NormalizedSection[],
  availableWidth: number,
  pageHeight?: number,
  pageWidth?: number
): MeasuredSection[] {
  return sections.map((s, idx) => ({
    ...s,
    headers: measureHeaderFooter(doc, s.headers, availableWidth),
    tables: s.tables.map((t) => measureTable(doc, t, availableWidth)),
    index: idx,
    watermark:
      s?.watermark && getMeasuredWatermark(s.watermark, pageHeight, pageWidth),
  }));
}

export function measureTable(
  doc: PdfKitApi,
  table: NormalizedTable,
  availableWidth: number
): MeasuredTable {
  const { headers, rows, columns } = table;
  const columnwidths = calculateColumnWidths(columns, availableWidth);
  return {
    headers: measuredRows(doc, headers, columnwidths),
    rows: measuredRows(doc, rows, columnwidths),
    measureTextHeight: (
      text: string,
      index: number,
      row: NormalizedRow | MeasuredRow
    ) => getCellHeightWithText(row, index, doc, text, columnwidths),
    columns: columns,
  };
}

export function getMeasuredPageBreakRows(
  doc: PdfKitApi,
  pageBreakRows: NormalizedPageBreakRows,
  availableWidth: number
): MeasuredRow[] {
  const { rows, columns } = pageBreakRows;
  return measuredRows(
    doc,
    rows,
    calculateColumnWidths(columns, availableWidth)
  );
}

export function measureHeaderFooter(
  doc: PdfKitApi,
  headerfooter: NormalizedHeaderFooter,
  availableWidth: number
): MeasuredRow[] {
  if (!headerfooter?.rows) {
    return [];
  }
  const { rows, columns } = headerfooter;
  if (rows.length === 0) {
    return [];
  }
  const columnwidths = calculateColumnWidths(columns, availableWidth);
  return measuredRows(doc, rows, columnwidths);
}

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
function calculateColumnWidthsWithoutPadding(columnwidths: number[]) {
  return columnwidths.map((x) => x - textHPadding * 2);
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

type PageDimensions = {
  pageHeight: number;
  pageWidth: number;
  availableWidth: number;
  pageInnerHeight: number;
};

export function getPageDimensions(
  layout: Layout = "landscape"
): PageDimensions {
  const portrait = layout === "portrait";
  const pageHeight = portrait ? 11 * ptsPerInch : 8.5 * ptsPerInch;
  const pageWidth = portrait ? 8.5 * ptsPerInch : 11 * ptsPerInch;
  const availableWidth = pageWidth - 2 * margin;
  const pageInnerHeight = pageHeight - 2 * margin;

  return { pageHeight, pageWidth, availableWidth, pageInnerHeight };
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
//TODO: Long text will break since font size is fixed
export function getMeasuredWatermark(
  watermark: Watermark,
  pageHeight: number,
  pageWidth: number
): MeasuredWatermark {
  const fontSize = ptsPerInch * 1.5;
  return {
    ...watermark,
    fontSize: fontSize,
    x: margin,
    y: (pageHeight - fontSize) / 2,
    origin: [pageWidth / 2, pageHeight / 2],
  };
}
