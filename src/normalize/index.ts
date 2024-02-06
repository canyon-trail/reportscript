import _ from "lodash";
import {
  Cell,
  CellStyle,
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
  CellOptions,
  FontSetting,
} from "../types";
import {
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedHeaderFooter,
  NormalizedPageBreakRows,
  NormalizedRow,
  NormalizedSection,
  NormalizedTable,
  NormalizedWidth,
} from "./types";

export const defaultFontFace = "Helvetica";
export const defaultBoldFace = "Helvetica-Bold";

export function normalize(document: Document): NormalizedDocument {
  const { headers, sections, footers, pageBreakRows, defaultFontSettings } =
    document;
  const normalizedFontSetting = normalizeFontSetting(defaultFontSettings);
  return {
    ...document,
    headers: headers
      ? normalizeHeaderFooter(headers, normalizedFontSetting)
      : { rows: [] },
    sections: sections.map((section) =>
      normalizeSection(section, document?.tableGap)
    ),
    footers: footers
      ? normalizeHeaderFooter(footers, normalizedFontSetting)
      : { rows: [] },
    pageBreakRows: pageBreakRows
      ? normalizePageBreakRows(pageBreakRows, normalizedFontSetting)
      : undefined,
  };
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

export function normalizeOptions(data: Cell[], cellOptions: CellStyle): Cell[] {
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
  return cells.map((cell, index) => {
    const cellWithAlign = {
      align: alignments[index],
      ...cell,
    };
    return cellWithAlign;
  });
}

export function normalizeCell(cell: Cell | CellValue): Cell {
  const defaultProps: CellOptions = {
    columnSpan: 1,
  };

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
  settingsFromTable: NormalizedColumnSetting[],
  fontSetting: FontSetting
): NormalizedRow {
  const { data, options } = row;
  let normalizedData: Cell[] = data.map((d) => normalizeCell(d));

  validateCellSpan(normalizedData, settingsFromTable);

  let cellOptions: CellStyle = {};
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
      ...fontSetting,
      border,
    },
  };
}

export function normalizePageBreakRows(
  pageBreakRow: PageBreakRows,
  fontSetting: FontSetting
): NormalizedPageBreakRows {
  const { rows, columns, style } = pageBreakRow;
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, style, settings, fontSetting)),
    columns: settings,
  };
}

export function normalizeTable(
  table: Table,
  fontSetting: FontSetting
): NormalizedTable {
  const { rows, headers, columns, style } = table;
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, style, settings, fontSetting)),
    headers: headers
      ? headers.map((h) => normalizeRow(h, style, settings, fontSetting))
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
          return _.isString(cell) || _.isNumber(cell)
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
  fontSetting: FontSetting
): NormalizedHeaderFooter {
  const { rows, columns, style } = headerFooter;
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, style, settings, fontSetting)),
    columns: settings,
  };
}
export function normalizeSection(
  section: Section,
  tableGap?: number,
  fontSetting?: FontSetting
): NormalizedSection {
  const { headers, tables } = section;
  return {
    tableGap: tableGap ?? undefined,
    ...section,
    headers: headers
      ? normalizeHeaderFooter(headers, fontSetting)
      : { rows: [] },
    tables: tables.map((table) => normalizeTable(table, fontSetting)),
  };
}
