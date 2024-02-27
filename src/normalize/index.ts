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
  TextTemplateCell,
} from "../types";
import {
  CellSettings,
  NormalizedCell,
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedHeaderFooter,
  NormalizedPageBreakRows,
  NormalizedRow,
  NormalizedSection,
  NormalizedTable,
  NormalizedWidth,
} from "./types";
import { TextTemplate, rs } from "../rs/index";

export const defaultFontFace = "Helvetica";
export const defaultBoldFace = "Helvetica-Bold";

type TemplateRow = {
  data: TextTemplateCell[];
  options?: RowOptions;
};

export function normalize(document: Document): NormalizedDocument {
  const {
    headers,
    sections,
    footers,
    pageBreakRows,
    defaultFontSettings,
    timestampPageNumberFontSetting,
    watermark,
    sectionPageNumbers,
    pageNumbers,
    timestamp,
  } = document;
  const normalizedFontSetting = normalizeFontSetting(defaultFontSettings);
  const normalizedTimestampPageNumberFontSetting = {
    ...normalizedFontSetting,
    ...timestampPageNumberFontSetting,
  };
  const normalizedTimeStampPageNum = normalizeDocPageNumTimeStamp(
    sectionPageNumbers,
    pageNumbers,
    timestamp
  );
  const normalizedFooters = normalizeFooter(
    normalizeSetting(footers, normalizedFontSetting),
    normalizedTimeStampPageNum,
    normalizedFontSetting
  );

  return {
    ...document,
    headers: headers
      ? normalizeHeaderFooter(normalizeSetting(headers, normalizedFontSetting))
      : { rows: [] },
    sections: sections.map((section) =>
      normalizeSection(
        section,
        normalizedFontSetting,
        document?.tableGap,
        watermark
      )
    ),
    footers: normalizedFooters,
    pageBreakRows: pageBreakRows
      ? normalizePageBreakRows(
          normalizeSetting(pageBreakRows, normalizedFontSetting)
        )
      : undefined,
    timestampPageNumberFontSetting: normalizedTimestampPageNumberFontSetting,
  };
}

export function normalizeDocPageNumTimeStamp(
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
    } else {
      return undefined;
    }
  }
}

export function normalizeFooter(
  footer: HeaderFooters,
  timeStampPageNumTemplate: TextTemplate,
  normalizedFontSetting: FontSetting
): NormalizedHeaderFooter {
  if (footer && timeStampPageNumTemplate) {
    throw new Error(
      "Cannot set footer, and page number or timestamp at the same time. Please use TextTemplateCell to set page number or timestamp"
    );
  }

  if (timeStampPageNumTemplate) {
    const pageNumTimeStampColumnSetting: NormalizedColumnSetting = {
      align: "right",
      width: { value: 1, unit: "fr" },
    };
    const defaultRowOptions: RowOptions = {
      fontFace: defaultFontFace,
      boldFace: defaultBoldFace,
    };
    const normalizedTemplateRow = normalizeRow(
      { data: [{ template: timeStampPageNumTemplate }] },
      {
        ...defaultRowOptions,
        ...normalizedFontSetting,
      },
      [pageNumTimeStampColumnSetting]
    );
    return {
      rows: [normalizedTemplateRow],
      columns: [pageNumTimeStampColumnSetting],
    };
  }
  if (footer) {
    const { rows, columns, style } = footer;
    const settings = normalizedColumnSetting(rows, columns);
    const normalizedRows = rows.map((r) => normalizeRow(r, style, settings));
    return {
      rows: normalizedRows,
      columns: settings,
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

export function normalizeSetting(
  component: PageBreakRows | Table | HeaderFooters,
  documentFontSetting: FontSetting
): PageBreakRows | Table | HeaderFooters {
  const style = { ...documentFontSetting, ...component?.style };
  return component
    ? {
        ...component,
        style,
      }
    : undefined;
}

export function normalizeOptions(
  data: NormalizedCell[],
  cellOptions: CellSettings
): NormalizedCell[] {
  return data.map((d) => ({
    ...cellOptions,
    ...d,
  }));
}

export function validateCellSpan(
  cells: NormalizedCell[],
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
  cells: NormalizedCell[]
): HorizontalAlignment[] {
  let cellIndex = 0;
  return cells.map((cell) => {
    const alignment: HorizontalAlignment = columnSettings[cellIndex].align;
    cellIndex += cell.columnSpan;
    return alignment;
  });
}

export function normalizeAlignment(
  cells: NormalizedCell[],
  alignments: HorizontalAlignment[]
): NormalizedCell[] {
  return cells.map((cell, index) => ({
    horizontalAlign: alignments[index],
    ...cell,
  }));
}

export function normalizeCell(
  cell: Cell | CellValue | TextTemplateCell
): NormalizedCell {
  const defaultProps: CellSettings = {
    columnSpan: 1,
  };
  if (cell == null || cell === undefined) {
    return {
      ...defaultProps,
      value: "",
    };
  } else {
    if (_.isString(cell)) {
      return { value: cell as string, ...defaultProps };
    } else if (_.isNumber(cell)) {
      return { value: cell, ...defaultProps };
    } else if (cell && "image" in (cell as Cell)) {
      return {
        ...defaultProps,
        ...cell,
      };
    } else if (
      cell &&
      "value" in cell &&
      ![undefined, null].includes(cell.value)
    ) {
      return {
        ...defaultProps,
        ...cell,
        value: cell.value,
      };
    } else if (
      cell &&
      "template" in cell &&
      ![undefined, null].includes(cell.template)
    ) {
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
}
export function normalizeRow(
  row: Row | TemplateRow,
  tableStyle: RowOptions,
  settingsFromTable: NormalizedColumnSetting[]
): NormalizedRow {
  const { data, options } = row;
  let normalizedData: NormalizedCell[] = data.map((d) => normalizeCell(d));
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
  pageBreakRow: PageBreakRows
): NormalizedPageBreakRows {
  const { rows, columns, style } = pageBreakRow;
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, style, settings)),
    columns: settings,
  };
}

export function normalizeTable(table: Table): NormalizedTable {
  const { rows, headers, columns, style } = table;
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, style, settings)),
    headers: headers
      ? headers.map((h) => normalizeRow(h, style, settings))
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
  headerFooter: HeaderFooters
): NormalizedHeaderFooter {
  const { rows, columns, style } = headerFooter;
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, style, settings)),
    columns: settings,
  };
}
export function normalizeSection(
  section: Section,
  fontSetting: FontSetting,
  tableGap?: number,
  docWatermark?: Watermark
): NormalizedSection {
  const { headers, tables, watermark } = section;
  const sectionWatermark = watermark ?? docWatermark;
  return {
    tableGap: tableGap ?? undefined,

    ...section,
    headers: headers
      ? normalizeHeaderFooter(normalizeSetting(headers, fontSetting))
      : { rows: [] },
    tables: tables.map((table) =>
      normalizeTable(normalizeSetting(table, fontSetting))
    ),
    watermark: normalizeWatermark(sectionWatermark, fontSetting),
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
