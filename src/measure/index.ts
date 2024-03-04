import { Watermark } from "../types";
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
import {
  calculateCellLeftCoords,
  getCellHeightWithText,
  getColumnWidthsForRow,
  getPageDimensions,
  getRowHeight,
  measureCellHeights,
} from "./measureRowAndCell";
import { ptsPerInch, margin } from "./defaultMeasurement";

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
    sections: measureSections(
      doc,
      sections,
      availableWidth,
      pageHeight,
      pageWidth
    ),
    pageBreakRows:
      pageBreakRows && measurePageBreakRows(doc, pageBreakRows, availableWidth),
    watermark:
      watermark && getMeasuredWatermark(watermark, pageHeight, pageWidth),
  };
}

export function measureSections(
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
    headers: measureRows(doc, headers, columnwidths),
    rows: measureRows(doc, rows, columnwidths),
    measureTextHeight: (
      text: string,
      index: number,
      row: NormalizedRow | MeasuredRow
    ) => getCellHeightWithText(row, index, doc, text, columnwidths),
    columns: columns,
  };
}

export function measurePageBreakRows(
  doc: PdfKitApi,
  pageBreakRows: NormalizedPageBreakRows,
  availableWidth: number
): MeasuredRow[] {
  const { rows, columns } = pageBreakRows;
  return measureRows(doc, rows, calculateColumnWidths(columns, availableWidth));
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
  return measureRows(doc, rows, columnwidths);
}

export function measureRows(
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
