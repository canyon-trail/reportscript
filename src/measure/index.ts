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

export const exampleDocumentFooterRow: NormalizedHeaderFooter = Object.freeze({
  rows: [
    {
      data: [{ value: "Page N of N", columnSpan: 1, align: "right" }],
      options: {
        border: false,
        fontSize: 9,
      },
    },
  ],
  columns: [{ width: { value: 1, unit: "fr" } }],
});

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
    documentFooterHeight: measureFooterHeight(document, doc, availableWidth),
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
      s?.watermark && getMeasuredWatermark(s?.watermark, pageHeight, pageWidth),
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
      height: getRowHeight(r, doc, adjustedWidths),
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
): number {
  const { data, image } = row;
  let rowHeight = 0;
  const widthsWithoutPadding =
    calculateColumnWidthsWithoutPadding(columnwidths);
  data.forEach((cell, idx) => {
    const height = getCellHeight(cell, widthsWithoutPadding[idx], doc);
    rowHeight = Math.max(rowHeight, height.maxHeight);
  });

  if (image) {
    rowHeight += image.height;
  }
  return rowHeight;
}

export function getCellHeight(
  cell: Cell,
  width: number,
  doc: PdfKitApi,
  text?: string | number
): VerticalMeasure {
  const gap = lineGap * 0.5;
  const rowLineGap = cell?.lineGap ?? lineGap;

  if (!cell) {
    throw new UndefinedCellError("Cell is undefined");
  }

  if ("image" in cell) {
    return {
      minHeight: cell.image.height + rowLineGap + lineGap,
      maxHeight: cell.image.height + rowLineGap + lineGap,
    };
  }
  doc.fontSize(cell?.fontSize ?? defaultFontSize);

  const textContent = text ?? cell?.value;

  const textVal = textContent ? (cell?.noWrap ? "X" : `${textContent}`) : "";

  const height = doc.heightOfString(textVal, {
    width,
    lineGap: rowLineGap,
    align: cell.align,
    height: cell.noWrap ? cell.fontSize : undefined,
  });
  return { minHeight: height + gap, maxHeight: height + gap };
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
  return cell?.align ?? "center";
}

function measureFooterHeight(
  document: NormalizedDocument,
  doc: PdfKitApi,
  availableWidth: number
): number {
  const hasFooter =
    document.timestamp || document.pageNumbers || document.sectionPageNumbers;

  if (!hasFooter) {
    return 0;
  }
  const { rows, columns } = exampleDocumentFooterRow;
  const columnwidths = calculateColumnWidths(columns, availableWidth);
  return getRowHeight(rows[0], doc, columnwidths);
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
