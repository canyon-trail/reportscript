import { Layout, Watermark } from "../types";
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
import { measuredRows } from "./measuredRowsAndCells";
import { getCellHeightWithText } from "./measuredRowsAndCells";
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
