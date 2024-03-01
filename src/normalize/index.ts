import _ from "lodash";
import {
  Cell,
  CellValue,
  ColumnSetting,
  Row,
  Section,
  Table,
  RowOptions,
  Document,
  HeaderFooters,
  Unit,
  HorizontalAlignment,
  PageBreakRows,
  FontSetting,
  Watermark,
  DocumentWithSections,
} from "../types";
import {
  CellSettings,
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedHeaderFooter,
  NormalizedPageBreakRows,
  NormalizedRow,
  NormalizedSection,
  NormalizedTable,
  NormalizedWidth,
} from "./types";
import { rs } from "../rs/index";
import { TextTemplate } from "../types/textTemplate";

export const defaultFontFace = "Helvetica";
export const defaultBoldFace = "Helvetica-Bold";

export function normalize(document: Document): NormalizedDocument {
  const documentProps = getDocumentProps(document);

  const {
    headers,
    sections,
    pageBreakRows,
    defaultFontSettings,
    watermark,
    tableGap,
  } = documentProps;
  const normalizedFontSetting = normalizeFontSetting(defaultFontSettings);

  return {
    ...documentProps,
    headers: normalizeHeaderFooter(headers, normalizedFontSetting),
    sections: sections.map((section) =>
      normalizeSection(section, normalizedFontSetting, tableGap, watermark)
    ),
    footers: normalizeDocumentFooter(normalizedFontSetting, document),
    pageBreakRows: normalizePageBreakRows(pageBreakRows, normalizedFontSetting),
  };
}

export function normalizeDocPageNumTimestamp(
  sectionPageNumbers: boolean,
  pageNumbers: boolean,
  timestamp: boolean
): TextTemplate | undefined {
  if (sectionPageNumbers && pageNumbers) {
    throw new Error(
      "A document cannot have both pageNumbers and sectionPageNumbers set to true"
    );
  }

  if (timestamp) {
    if (sectionPageNumbers) {
      return rs`{{timestamp}} Page {{sectionPageNumber}} of {{sectionPageCount}}`;
    } else if (pageNumbers) {
      return rs`{{timestamp}} Page {{documentPageNumber}} of {{documentPageCount}}`;
    } else {
      return rs`{{timestamp}}`;
    }
  } else {
    if (sectionPageNumbers) {
      return rs`Page {{sectionPageNumber}} of {{sectionPageCount}}`;
    } else if (pageNumbers) {
      return rs`Page {{documentPageNumber}} of {{documentPageCount}}`;
    }
  }
  return undefined;
}

export function normalizeDocumentFooter(
  normalizedFontSetting: FontSetting,
  document: Document
): NormalizedHeaderFooter {
  const { footers, timestamp, pageNumbers, sectionPageNumbers } = document;
  const timeStampPageNumTemplate = normalizeDocPageNumTimestamp(
    sectionPageNumbers,
    pageNumbers,
    timestamp
  );

  if (footers && timeStampPageNumTemplate) {
    throw new Error(
      "Cannot set footer, and pageNumber || timestamp || sectionPageNumber at the same time. Please use TextTemplateCell to set pageNumber || timestamp || sectionPageNumber"
    );
  }
  if (timeStampPageNumTemplate) {
    const pageNumTimeStampColumnSetting: NormalizedColumnSetting = {
      align: "right",
      width: { value: 1, unit: "fr" },
    };
    const normalizedTemplateRow = normalizeRow(
      { data: [{ template: timeStampPageNumTemplate }] },
      normalizedFontSetting,
      [pageNumTimeStampColumnSetting]
    );
    return {
      rows: [normalizedTemplateRow],
      columns: [pageNumTimeStampColumnSetting],
    };
  }
  if (footers) {
    const { rows, columns, style } = footers;
    const normalizedSettings = normalizedColumnSetting(rows, columns);
    const normalizedStyle = { ...normalizedFontSetting, ...style };
    const normalizedRows = rows.map((r) =>
      normalizeRow(r, normalizedStyle, normalizedSettings)
    );
    return {
      rows: normalizedRows,
      columns: normalizedSettings,
    };
  }
  return { rows: [] };
}

export function normalizeFontSetting(
  documentFontSetting: FontSetting
): FontSetting {
  return {
    ...documentFontSetting,
    fontFace: documentFontSetting?.fontFace ?? defaultFontFace,
    boldFace: documentFontSetting?.boldFace ?? defaultBoldFace,
  };
}

export function normalizeOptions(
  data: Cell[],
  cellOptions: CellSettings
): Cell[] {
  return data.map((d) => ({
    ...cellOptions,
    ...d,
  }));
}

export function validateCellSpan(
  cells: Cell[],
  columnSettings: NormalizedColumnSetting[]
): void {
  const totalWidth = columnSettings?.length;
  const totalColumnSpan = cells.reduce((sum, cell) => cell.columnSpan + sum, 0);
  if (totalWidth > totalColumnSpan) {
    throw new Error(
      `Sum of column spans (${totalColumnSpan}) is less than number of columns (${totalWidth})`
    );
  }
  if (totalWidth < totalColumnSpan) {
    throw new Error(
      `Sum of column spans (${totalColumnSpan}) is greater than number of columns (${totalWidth})`
    );
  }
}

export function computeCellAlignments(
  columnSettings: NormalizedColumnSetting[],
  cells: Cell[]
): HorizontalAlignment[] {
  let cellIndex = 0;
  return cells.map((cell) => {
    const alignment: HorizontalAlignment = columnSettings[cellIndex].align;
    cellIndex += cell.columnSpan;
    return alignment;
  });
}

export function normalizeAlignment(
  cells: Cell[],
  alignments: HorizontalAlignment[]
): Cell[] {
  return cells.map((cell, index) => ({
    horizontalAlign: alignments[index],
    ...cell,
  }));
}

export function normalizeCell(cell: Cell | CellValue | TextTemplate): Cell {
  const defaultProps: CellSettings = {
    columnSpan: 1,
  };
  if (cell == null || cell === undefined) {
    throw new Error("Cell is null or undefined");
  }

  if (_.isString(cell)) {
    return { value: cell as string, ...defaultProps };
  } else if (_.isNumber(cell)) {
    return { value: cell, ...defaultProps };
  } else if ("renderTemplate" in cell) {
    return {
      ...defaultProps,
      template: cell,
    };
  } else if (cell && "image" in cell) {
    if (!cell.image) {
      throw new Error("Cell image is null or undefined");
    }
    return {
      ...defaultProps,
      ...cell,
    };
  } else if (cell && "value" in cell) {
    if (cell.value == null || cell.value === undefined) {
      throw new Error("Cell value is null or undefined");
    }
    return {
      ...defaultProps,
      ...cell,
      value: cell.value,
    };
  } else if (cell && "template" in cell) {
    if (!cell.template) {
      throw new Error("Cell template is null or undefined");
    }
    return {
      ...defaultProps,
      ...cell,
      template: cell.template,
    };
  } else {
    return {
      ...defaultProps,
      ...cell,
      value: "",
    };
  }
}
export function normalizeRow(
  row: Row,
  tableStyle: RowOptions,
  settingsFromTable: NormalizedColumnSetting[]
): NormalizedRow {
  const { data, options } = row;
  let normalizedData: Cell[] = data.map((d) => normalizeCell(d));
  validateCellSpan(normalizedData, settingsFromTable);

  let cellOptions: CellSettings = {};
  if (tableStyle) {
    const { border, ...rest } = tableStyle; // eslint-disable-line
    cellOptions = rest;
  }

  if (options) {
    const { border, ...rest } = options; // eslint-disable-line
    cellOptions = { ...cellOptions, ...rest };
  }
  normalizedData = normalizeOptions(normalizedData, cellOptions);

  const cellAlignments = computeCellAlignments(
    settingsFromTable,
    normalizedData
  );

  normalizedData = normalizeAlignment(normalizedData, cellAlignments);
  const border = options?.border ?? tableStyle?.border ?? false;
  return {
    ...row,
    data: normalizedData,
    options: {
      ...cellOptions,
      border,
    },
  };
}

export function normalizePageBreakRows(
  pageBreakRow: PageBreakRows,
  normalizedFontSetting: FontSetting
): NormalizedPageBreakRows | undefined {
  if (!pageBreakRow) return undefined;
  const { rows, columns, style } = pageBreakRow;
  const normalizedStyle = { ...normalizedFontSetting, ...style };
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, normalizedStyle, settings)),
    columns: settings,
  };
}

export function normalizeTable(
  table: Table,
  normalizedFontSetting: FontSetting
): NormalizedTable {
  const { rows, headers, columns, style } = table;
  const normalizedStyle = { ...normalizedFontSetting, ...style };
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, normalizedStyle, settings)),
    headers: headers
      ? headers.map((h) => normalizeRow(h, normalizedStyle, settings))
      : [],
    columns: settings,
  };
}
export function normalizedColumnSetting(
  rows: Row[],
  columns: ColumnSetting[]
): NormalizedColumnSetting[] {
  const setting: ColumnSetting[] = parseColumnSetting(rows, columns);
  const normalizedSettings: NormalizedColumnSetting[] = setting.map(
    (columnSetting) => ({
      ...columnSetting,
      width: parseWidth(columnSetting.width),
    })
  );
  return normalizedSettings;
}
export function parseColumnSetting(
  rows: Row[],
  columns: ColumnSetting[]
): ColumnSetting[] {
  const maxColumnSpan = Math.max(
    ...rows.map((row) =>
      row.data
        .map((cell) => {
          return _.isString(cell) ||
            _.isNumber(cell) ||
            "renderTemplate" in cell
            ? 1
            : cell?.columnSpan ?? 1;
        })
        .reduce((sum, span) => sum + span, 0)
    )
  );
  const columnCount = columns?.length > 0 ? columns.length : maxColumnSpan ?? 1;
  const settings = new Array<ColumnSetting>(columnCount)
    .fill({
      width: "1fr",
      align: "center",
    })
    .map((defaultSettings, idx) => ({
      ...defaultSettings,
      ...(columns && columns[idx]),
    }));
  return settings;
}

export function parseWidth(width: string): NormalizedWidth {
  const match = width.match(/^(\d+|\d*\.\d+) ?(fr|%|pt)$/);

  if (!match) {
    throw new Error(`Invalid width input ${width}`);
  }
  const value = Number(match[1]);
  const unit = match[2] as Unit;
  return { value, unit };
}

export function normalizeHeaderFooter(
  headerFooter: HeaderFooters,
  normalizedFontSetting: FontSetting
): NormalizedHeaderFooter {
  if (!headerFooter) return { rows: [] };
  const { rows, columns, style } = headerFooter;
  const normalizedStyle = { ...normalizedFontSetting, ...style };
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, normalizedStyle, settings)),
    columns: settings,
  };
}
export function normalizeSection(
  section: Section,
  normalizedFontSetting: FontSetting,
  tableGap?: number,
  docWatermark?: Watermark
): NormalizedSection {
  const { headers, tables, watermark } = section;
  const sectionWatermark = watermark ?? docWatermark;
  return {
    tableGap: tableGap ?? undefined,
    ...section,
    headers: normalizeHeaderFooter(headers, normalizedFontSetting),
    tables: tables.map((table) => normalizeTable(table, normalizedFontSetting)),
    watermark: normalizeWatermark(sectionWatermark, normalizedFontSetting),
  };
}

export function normalizeWatermark(
  watermark: Watermark,
  fontSetting: FontSetting
): Watermark {
  return watermark
    ? {
        fontFace: fontSetting?.fontFace,
        color: fontSetting?.color,
        ...watermark,
      }
    : undefined;
}

function getDocumentProps(document: Document): DocumentWithSections {
  return "sections" in document
    ? document
    : { sections: [{ tables: document.tables }] };
}
