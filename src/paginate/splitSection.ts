import { margin } from "../measure";
import {
  MeasuredDocument,
  MeasuredSection,
  MeasuredTable,
} from "../measure/types";
import { splitTable } from "./splitTable";
import { sumOfRowHeights, getTableHeight } from ".";

export function splitSection(
  section: MeasuredSection,
  availableSpace: number,
  doc: MeasuredDocument
): SectionSplitResult {
  let remainingSpace = availableSpace;
  if (section.headers.length > 0) {
    remainingSpace -=
      (section?.tableGap ?? margin) + sumOfRowHeights(section.headers);
  }

  const fitTables: MeasuredTable[] = [];
  const remainingTables = [...section.tables];

  while (remainingTables.length > 0) {
    const tableMargin = fitTables.length > 0 ? section?.tableGap ?? margin : 0;

    remainingSpace -= tableMargin;

    const table = remainingTables.shift();

    if (canFitTable(table, remainingSpace)) {
      remainingSpace -= getTableHeight(table);
      fitTables.push(table);
    } else {
      if (canSplitTable(table, remainingSpace, doc)) {
        const { first, rest } = splitTable(table, remainingSpace, doc);
        if (rest.rows.length > 0) {
          remainingTables.unshift(rest);
        }
        if (first.rows.length > 0) {
          fitTables.push(first);
        }
        break;
      } else {
        remainingTables.unshift(table);
        break;
      }
    }
  }

  const first = {
    ...section,
    tables: fitTables,
  };

  return {
    first,
    rest: {
      headers: doc.repeatSectionHeaders ? section.headers : [],
      tables: remainingTables,
      index: section.index,
      watermark: section?.watermark,
      tableGap: section?.tableGap,
    },
  };
}
export type SectionSplitResult = {
  first: MeasuredSection;
  rest: MeasuredSection;
};
export function canFitTable(
  table: MeasuredTable,
  availableSpace: number
): boolean {
  return getTableHeight(table) <= availableSpace;
}
export function canSplitTable(
  table: MeasuredTable,
  availableSpace: number,
  doc?: MeasuredDocument
): boolean {
  let usedSpace = sumOfRowHeights(table.headers);
  usedSpace += table.measureTextHeight("X", 0, table.rows[0]).maxHeight;
  usedSpace += doc?.pageBreakRows ? sumOfRowHeights(doc.pageBreakRows) : 0;

  return availableSpace >= usedSpace;
}
