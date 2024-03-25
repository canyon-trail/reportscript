import { sumOfRowHeights } from ".";

import { MeasuredTable, MeasuredDocument, MeasuredRow } from "../measure/types";
import { splitRow } from "./splitRow";

export type TableSplitResult = {
  first: MeasuredTable;
  rest: MeasuredTable;
};

export function splitTable(
  table: MeasuredTable,
  availableSpace: number,
  doc?: MeasuredDocument
): TableSplitResult {
  let usedSpace = sumOfRowHeights(table.headers);
  doc?.pageBreakRows ? (usedSpace += sumOfRowHeights(doc?.pageBreakRows)) : 0;

  const fitRows: MeasuredRow[] = [];
  const remainingRows = [...table.rows];

  while (remainingRows.length > 0) {
    const row = remainingRows.shift();
    if (canFitRow(row, usedSpace, availableSpace)) {
      usedSpace += row.minHeight;
      fitRows.push(row);
    } else if (canSplitRow(row, availableSpace - usedSpace, table)) {
      const [first, rest] = splitRow(row, availableSpace - usedSpace, table);
      fitRows.push(first);
      remainingRows.unshift(rest);
      break;
    } else {
      remainingRows.unshift(row);
      break;
    }
  }
  const pageBreakRows = doc?.pageBreakRows ? doc.pageBreakRows : [];
  return {
    first: {
      ...table,
      rows: [...fitRows, ...pageBreakRows],
    },
    rest: {
      ...table,
      rows: remainingRows,
    },
  };
}
export function canSplitRow(
  row: MeasuredRow,
  availableSpace: number,
  table: MeasuredTable
): boolean {
  const hasSplitFn = table.columns?.some((x) => x.splitFn);

  if (!hasSplitFn) {
    return false;
  }

  for (let columnIdx = 0; columnIdx < row.data.length; columnIdx++) {
    if (row.columnHeights[columnIdx].minHeight <= availableSpace) {
      continue;
    }

    if (!table.columns[columnIdx].splitFn) {
      return false;
    }
  }

  const minHeight = table.measureTextHeight("X", 0, row);

  return availableSpace >= minHeight.maxHeight;
}

export function canFitRow(
  row: MeasuredRow,
  usedSpace: number,
  availableSpace: number
) {
  return row.minHeight + usedSpace <= availableSpace;
}
