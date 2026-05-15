import { getPageDimensions, margin } from "../measure";
import {
  MeasuredDocument,
  MeasuredRow,
  MeasuredSection,
} from "../measure/types";

const sumOfRowHeights = (rows: MeasuredRow[]): number =>
  rows.reduce((total, row) => total + row.minHeight, 0);

/**
 * "Oversized" — a row is oversized when it cannot fit on ANY page of the
 * document, no matter which page it lands on. This is a page-independent,
 * worst-case property: compare the row's height against the roomiest page it
 * could ever reach.
 *
 * The roomiest page subtracts only the header space that is *unavoidable* for
 * a row in the given section/table:
 *  - report header: only when repeatReportHeaders (else page 1+ has none)
 *  - section headers + gap: only when repeatSectionHeaders (else a continuation
 *    page of the section has none)
 *  - table headers: always (re-drawn on every page the table spans)
 *  - footers: always reserved (footerSpace is unconditional)
 *
 * An oversized row must be force-placed and allowed to overflow; a row that is
 * merely too tall for the *current* page but not oversized must instead be
 * deferred to a roomier page.
 */
export function getMostGenerousPageSpace(doc: MeasuredDocument): number {
  const { pageInnerHeight } = getPageDimensions(doc.layout);

  const footerSpace =
    doc.footers.length > 0 ? margin + sumOfRowHeights(doc.footers) : 0;
  const reportHeaderSpace =
    doc.repeatReportHeaders && doc.headers.length > 0
      ? margin + sumOfRowHeights(doc.headers)
      : 0;

  return pageInnerHeight - footerSpace - reportHeaderSpace;
}

/**
 * Header space that is unavoidable for any row inside this section's tables:
 * the section headers (plus their gap) only when they repeat, and — added by
 * the caller per table — that table's own headers.
 */
function unavoidableSectionHeaderSpace(
  doc: MeasuredDocument,
  section: MeasuredSection
): number {
  if (!doc.repeatSectionHeaders || section.headers.length === 0) {
    return 0;
  }
  return (section.tableGap ?? margin) + sumOfRowHeights(section.headers);
}

/**
 * True when `rowMinHeight` cannot fit on any page the row could land on, given
 * the section and table it belongs to.
 */
export function isRowOversized(
  rowMinHeight: number,
  doc: MeasuredDocument,
  section: MeasuredSection,
  tableHeaderHeight: number
): boolean {
  const roomiest =
    getMostGenerousPageSpace(doc) -
    unavoidableSectionHeaderSpace(doc, section) -
    tableHeaderHeight;

  return rowMinHeight > roomiest;
}

/**
 * Stamp every data row in the document with `isOversized`, computed once
 * up front so the splitting layers can read a flag instead of recomputing
 * page geometry per row.
 */
export function stampOversizedRows(doc: MeasuredDocument): void {
  for (const section of doc.sections) {
    for (const table of section.tables) {
      const tableHeaderHeight = sumOfRowHeights(table.headers);
      for (const row of table.rows) {
        row.isOversized = isRowOversized(
          row.minHeight,
          doc,
          section,
          tableHeaderHeight
        );
      }
    }
  }
}
