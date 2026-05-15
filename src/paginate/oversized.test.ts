import { getPageDimensions, margin } from "../measure";
import {
  MeasuredDocument,
  MeasuredRow,
  MeasuredSection,
} from "../measure/types";
import {
  getMostGenerousPageSpace,
  isRowOversized,
  stampOversizedRows,
} from "./oversized";
import { emptyMeasuredDoc } from "./testUtils";

/**
 * "oversized" is a page-independent worst-case property: a row is oversized
 * only if it fits on no page the row could reach.
 */

const { pageInnerHeight } = getPageDimensions("landscape");

const row = (minHeight: number): MeasuredRow =>
  ({
    data: [],
    columnHeights: [],
    columnWidths: [],
    columnStarts: [],
    minHeight,
    maxHeight: minHeight,
  } as MeasuredRow);

const section = (over: Partial<MeasuredSection> = {}): MeasuredSection => ({
  headers: [],
  tables: [],
  index: 0,
  ...over,
});

describe("oversized - getMostGenerousPageSpace", () => {
  it("is the full inner height when there are no report headers or footers", () => {
    expect(getMostGenerousPageSpace(emptyMeasuredDoc)).toBe(pageInnerHeight);
  });

  it("always subtracts footer space", () => {
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      footers: [row(20)],
    };
    expect(getMostGenerousPageSpace(doc)).toBe(pageInnerHeight - (margin + 20));
  });

  it("ignores the report header when it does not repeat", () => {
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      headers: [row(30)],
      repeatReportHeaders: false,
    };
    // A non-first page has no report header, so it does not reduce the
    // roomiest page.
    expect(getMostGenerousPageSpace(doc)).toBe(pageInnerHeight);
  });

  it("subtracts the report header when it repeats", () => {
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      headers: [row(30)],
      repeatReportHeaders: true,
    };
    expect(getMostGenerousPageSpace(doc)).toBe(pageInnerHeight - (margin + 30));
  });
});

describe("oversized - isRowOversized", () => {
  it("a short row is never oversized", () => {
    expect(isRowOversized(50, emptyMeasuredDoc, section(), 0)).toBe(false);
  });

  it("a row taller than a bare page is oversized", () => {
    expect(
      isRowOversized(pageInnerHeight + 1, emptyMeasuredDoc, section(), 0)
    ).toBe(true);
  });

  it("a row exactly equal to the roomiest page is not oversized (boundary)", () => {
    expect(
      isRowOversized(pageInnerHeight, emptyMeasuredDoc, section(), 0)
    ).toBe(false);
  });

  it("table headers always count against the row", () => {
    const tableHeaderHeight = 40;
    // Fits without table headers, oversized once they are accounted for.
    expect(
      isRowOversized(pageInnerHeight - 10, emptyMeasuredDoc, section(), 0)
    ).toBe(false);
    expect(
      isRowOversized(
        pageInnerHeight - 10,
        emptyMeasuredDoc,
        section(),
        tableHeaderHeight
      )
    ).toBe(true);
  });

  it("section headers count only when repeatSectionHeaders is set", () => {
    const sectionHeaders = [row(50)];
    const rowHeight = pageInnerHeight - 10;

    const notRepeated: MeasuredDocument = {
      ...emptyMeasuredDoc,
      repeatSectionHeaders: false,
    };
    // Without repeated section headers, a continuation page has none, so the
    // row still fits somewhere -> not oversized.
    expect(
      isRowOversized(
        rowHeight,
        notRepeated,
        section({ headers: sectionHeaders }),
        0
      )
    ).toBe(false);

    const repeated: MeasuredDocument = {
      ...emptyMeasuredDoc,
      repeatSectionHeaders: true,
    };
    // With repeated section headers, every page the row can reach loses that
    // space -> oversized.
    expect(
      isRowOversized(
        rowHeight,
        repeated,
        section({ headers: sectionHeaders }),
        0
      )
    ).toBe(true);
  });

  it("report header repetition shifts the threshold", () => {
    const reportHeader = [row(60)];
    const rowHeight = pageInnerHeight - 20;

    const notRepeated: MeasuredDocument = {
      ...emptyMeasuredDoc,
      headers: reportHeader,
      repeatReportHeaders: false,
    };
    expect(isRowOversized(rowHeight, notRepeated, section(), 0)).toBe(false);

    const repeated: MeasuredDocument = {
      ...emptyMeasuredDoc,
      headers: reportHeader,
      repeatReportHeaders: true,
    };
    expect(isRowOversized(rowHeight, repeated, section(), 0)).toBe(true);
  });
});

describe("oversized - stampOversizedRows", () => {
  it("stamps each data row with isOversized", () => {
    const tallRow = row(pageInnerHeight + 100);
    const shortRow = row(40);
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [
        section({
          tables: [
            {
              headers: [],
              rows: [shortRow, tallRow],
              measureTextHeight: () => ({ minHeight: 0, maxHeight: 0 }),
              columns: [],
            },
          ],
        }),
      ],
    };

    stampOversizedRows(doc);

    expect(doc.sections[0].tables[0].rows[0].isOversized).toBe(false);
    expect(doc.sections[0].tables[0].rows[1].isOversized).toBe(true);
  });

  it("accounts for table header height when stamping", () => {
    const rowHeight = pageInnerHeight - 10;
    const tableHeader = row(40);
    const dataRow = row(rowHeight);
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [
        section({
          tables: [
            {
              headers: [tableHeader],
              rows: [dataRow],
              measureTextHeight: () => ({ minHeight: 0, maxHeight: 0 }),
              columns: [],
            },
          ],
        }),
      ],
    };

    stampOversizedRows(doc);

    // rowHeight alone fits a bare page, but not once the table header is added.
    expect(doc.sections[0].tables[0].rows[0].isOversized).toBe(true);
  });
});
