import { MeasuredDocument, MeasuredSection } from "../measure/types";
import { getPageDimensions, margin } from "../measure";
import { SectionSplitResult, splitSection } from "./splitSection";
import {
  emptyMeasuredRow,
  emptyMeasuredDoc,
  emptySection,
  emptyTable,
  defaultTableGapRow,
  measureTextHeight,
  createRows,
  createRow,
} from "./testUtils";

describe("pagination - splitSection(...)", () => {
  it("single table spans > 1 page", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 4;
    const rows = createRows({ rowHeight: rowHeight, length: 10 });
    const input: MeasuredSection = {
      index: 0,
      headers: [
        {
          ...emptyMeasuredRow,
          minHeight: 0,
          maxHeight: 0,
          data: [{ value: "i should not be copied later" }],
        },
      ],
      tables: [
        {
          ...emptyTable,
          rows: rows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...input.tables[0],
            rows: rows.slice(0, 4),
          },
        ],
      },
      rest: {
        ...emptySection,
        tables: [
          {
            ...input.tables[0],
            rows: rows.slice(4, 10),
          },
        ],
      },
    };

    expect(
      splitSection(input, pageInnerHeight + margin, emptyMeasuredDoc)
    ).toEqual(expected);
  });

  it("multiple tables, second needs split", () => {
    const { pageInnerHeight } = getPageDimensions();
    const rowHeight = pageInnerHeight / 4;
    const firstTableRows = createRows({ rowHeight: rowHeight, length: 2 });
    const secondTableRows = createRows({ rowHeight: rowHeight, length: 4 });
    const input = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: firstTableRows,
        },
        {
          ...emptyTable,
          rows: secondTableRows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: firstTableRows,
          },
          {
            ...emptyTable,
            rows: [secondTableRows[0]],
          },
        ],
      },
      rest: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: secondTableRows.slice(1, 4),
          },
        ],
      },
    };

    expect(splitSection(input, pageInnerHeight, emptyMeasuredDoc)).toEqual(
      expected
    );
  });

  it("does not split to create widow", () => {
    const pageHeight = 100;
    const headerHeight = 15;

    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [
            {
              ...defaultTableGapRow,
              maxHeight: pageHeight - margin - headerHeight - 1,
              minHeight: pageHeight - margin - headerHeight - 1,
            },
          ],
        },
        {
          headers: [
            {
              ...defaultTableGapRow,
              maxHeight: headerHeight,
              minHeight: headerHeight,
            },
          ],
          rows: Array(4).fill({ ...defaultTableGapRow, height: 5 }),
          measureTextHeight,
          columns: [],
        },
      ],
    };

    const expected: SectionSplitResult = {
      first: {
        ...input,
        tables: [input.tables[0]],
      },
      rest: {
        ...input,
        tables: [input.tables[1]],
      },
    };

    expect(splitSection(input, pageHeight, emptyMeasuredDoc)).toEqual(expected);
  });

  it("copies headers when repeatSectionHeaders is true", () => {
    const pageHeight = margin * 5;

    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      repeatSectionHeaders: true,
    };
    const sectionHeader = createRow({ rowHeight: margin, value: "header" });
    const rows = createRows({ rowHeight: margin, length: 6, value: "row " });
    const input: MeasuredSection = {
      index: 0,
      headers: [sectionHeader],
      tables: [
        {
          ...emptyTable,
          rows: rows,
        },
      ],
    };

    const expected: SectionSplitResult = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: rows.slice(0, 3),
          },
        ],
      },
      rest: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: rows.slice(3, 6),
          },
        ],
      },
    };

    expect(splitSection(input, pageHeight, doc)).toEqual(expected);
  });

  it("should account for margin between all tables", () => {
    const available = 300 + margin;
    const rowHeight = 20;
    const bigRowHeight = 100;
    const firstTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 0 row",
    });
    const secondTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 1 row",
    });
    const thirdTableRows = createRows({ rowHeight: rowHeight, length: 5 });
    const input = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [firstTableRow],
        },
        {
          ...emptyTable,
          rows: [secondTableRow],
        },
        {
          ...emptyTable,
          rows: thirdTableRows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [firstTableRow],
          },
          {
            ...emptyTable,
            rows: [secondTableRow],
          },
          {
            ...emptyTable,
            rows: thirdTableRows.slice(0, 4),
          },
        ],
      },
      rest: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [thirdTableRows[4]],
          },
        ],
      },
    };

    expect(splitSection(input, available, emptyMeasuredDoc)).toEqual(expected);
  });
  it("should account for margin between all tables with TableGap set", () => {
    const available = 300 + margin;
    const rowHeight = 20;
    const bigRowHeight = 100;
    const firstTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 0 row",
    });
    const secondTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 1 row",
    });
    const thirdTableRows = createRows({ rowHeight: rowHeight, length: 7 });
    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [firstTableRow],
        },
        {
          ...emptyTable,
          rows: [secondTableRow],
        },
        {
          ...emptyTable,
          rows: thirdTableRows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [firstTableRow],
          },
          {
            ...emptyTable,
            rows: [secondTableRow],
          },
          {
            ...emptyTable,
            rows: thirdTableRows.slice(0, 5),
          },
        ],
        tableGap: 8,
      },
      rest: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: thirdTableRows.slice(5, 7),
          },
        ],
        tableGap: 8,
      },
    };

    expect(
      splitSection({ ...input, tableGap: 8 }, available, emptyMeasuredDoc)
    ).toEqual(expected);
  });

  it("should account for TableGap with Headers", () => {
    const available = 300 + margin;
    const rowHeight = margin;
    const bigRowHeight = 100;
    const sectionHeader = createRow({
      rowHeight: bigRowHeight,
      value: "section header",
    });
    const firstTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 0 row",
    });
    const secondTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 1 row",
    });
    const thirdTableRow = createRows({
      rowHeight: rowHeight,
      length: 7,
      value: "table 3 row",
    });
    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [firstTableRow],
        },
        {
          ...emptyTable,
          rows: [secondTableRow],
        },
        {
          ...emptyTable,
          rows: thirdTableRow,
        },
      ],
    };
    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [firstTableRow],
          },
          {
            ...emptyTable,
            rows: [secondTableRow],
          },
        ],
        headers: [sectionHeader],
        tableGap: 8,
      },
      rest: {
        ...input,
        headers: [],
        tables: [
          {
            ...emptyTable,
            rows: thirdTableRow,
          },
        ],
        tableGap: 8,
      },
    };
    expect(
      splitSection(
        { ...input, tableGap: 8, headers: [sectionHeader] },
        available,
        emptyMeasuredDoc
      )
    ).toEqual(expected);
  });

  it("should account for page break rows", () => {
    const available = 300 + margin * 2;
    const rowHeight = margin;
    const bigRowHeight = 100;
    const sectionHeader = createRow({
      rowHeight: bigRowHeight,
      value: "section header",
    });
    const firstTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 0 row",
    });
    const secondTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 1 row",
    });
    const thirdTableRow = createRow({
      rowHeight: rowHeight,
      value: "table 3 row",
    });
    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [firstTableRow],
        },
        {
          ...emptyTable,
          rows: [secondTableRow],
        },
        {
          ...emptyTable,
          rows: [thirdTableRow],
        },
      ],
    };
    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [firstTableRow],
          },
          {
            ...emptyTable,
            rows: [secondTableRow],
          },
        ],
        headers: [sectionHeader],
        tableGap: 8,
      },
      rest: {
        ...input,
        headers: [],
        tables: [
          {
            ...emptyTable,
            rows: [thirdTableRow],
          },
        ],
        tableGap: 8,
      },
    };

    const doc = {
      ...emptyMeasuredDoc,
      pageBreakRows: [
        createRow({
          rowHeight: rowHeight,
          value: "page break",
        }),
      ],
    };
    expect(
      splitSection(
        { ...input, tableGap: 8, headers: [sectionHeader] },
        available,
        doc
      )
    ).toEqual(expected);
  });

  // splitSection must propagate splitTable's force-placed oversized row, and
  // must not let an oversized row get diverted away from splitTable by the
  // canSplitTable gate. Sibling tables in the same section paginate normally.
  describe("oversized rows", () => {
    const { pageInnerHeight } = getPageDimensions();

    const oversizedRow = (value: string) => ({
      ...emptyMeasuredRow,
      data: [{ value }],
      minHeight: pageInnerHeight + 500,
      maxHeight: pageInnerHeight + 500,
      isOversized: true,
    });

    it("force-places an oversized row alone, defers the rest of its table", () => {
      const over = oversizedRow("oversized");
      const after = createRow({ rowHeight: margin, value: "after" });
      const input: MeasuredSection = {
        ...emptySection,
        tables: [{ ...emptyTable, rows: [over, after] }],
      };

      const result = splitSection(input, pageInnerHeight, emptyMeasuredDoc);

      expect(result.first.tables).toEqual([{ ...emptyTable, rows: [over] }]);
      expect(result.rest.tables).toEqual([{ ...emptyTable, rows: [after] }]);
    });

    it("does not divert an oversized row away from splitTable", () => {
      // canSplitTable must still be true on a fresh page (one line fits), so
      // splitTable runs and force-places the oversized row -- it is never
      // re-queued unchanged by the canSplitTable=false branch.
      const over = oversizedRow("oversized");
      const input: MeasuredSection = {
        ...emptySection,
        tables: [{ ...emptyTable, rows: [over] }],
      };

      const result = splitSection(input, pageInnerHeight, emptyMeasuredDoc);

      expect(result.first.tables).toEqual([{ ...emptyTable, rows: [over] }]);
      expect(result.rest.tables).toEqual([]);
    });

    it("leaves sibling tables in the section unaffected", () => {
      // First table is normal and fits; second table leads with an oversized
      // row. The normal table is committed; the oversized row is force-placed;
      // nothing about the first table changes.
      const normalRow = createRow({ rowHeight: margin, value: "normal" });
      const over = oversizedRow("oversized");
      const input: MeasuredSection = {
        ...emptySection,
        tables: [
          { ...emptyTable, rows: [normalRow] },
          { ...emptyTable, rows: [over] },
        ],
      };

      const result = splitSection(input, pageInnerHeight, emptyMeasuredDoc);

      // The normal table is placed; the oversized table is force-placed too,
      // since one line still fits after the first table.
      expect(result.first.tables[0]).toEqual({
        ...emptyTable,
        rows: [normalRow],
      });
      expect(result.first.tables[1]).toEqual({ ...emptyTable, rows: [over] });
      expect(result.rest.tables).toEqual([]);
    });
  });
});
