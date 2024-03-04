import { Row, RowOptions, Cell, HorizontalAlignment } from "types";
import { normalizeCell } from "./normalizeCell";
import { NormalizedColumnSetting, NormalizedRow, CellSettings } from "./types";

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
export function normalizeOptions(
  data: Cell[],
  cellOptions: CellSettings
): Cell[] {
  return data.map((d) => ({
    ...cellOptions,
    ...d,
  }));
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
