import { TableSplitResult, splitTable } from "./splitTable";
import { continuedOn, splitColumn } from "./splitColumn";
import { TextCell } from "../types";
import {
  MeasuredDocument,
  MeasuredTable,
  VerticalMeasure,
} from "../measure/types";
import { emptyMeasuredRow, emptyTable, emptyMeasuredDoc } from "./testUtils";

describe("pagination - splitTable(...)", () => {
  const availableSpace = 40;
  const lineHeight = 10;
  const pageBreakRow = {
    ...emptyMeasuredRow,
    columnHeights: [{ maxHeight: lineHeight, minHeight: lineHeight }],
    data: [{ value: "page break" }],
    minHeight: lineHeight,
    maxHeight: lineHeight,
  };
  const splitter = (
    text: string,
    measure,
    availableSpace
  ): [string, string] => {
    const lines = text.split("\n");
    const nextLines = [];
    while (measure(lines.join("\n")).maxHeight > availableSpace) {
      nextLines.unshift(lines.pop());
    }

    return [lines.join("\n"), nextLines.join("\n")];
  };
  const measureTextHeight = (text: string): VerticalMeasure => {
    const height = text.split("\n").length * lineHeight;
    return {
      maxHeight: height,
      minHeight: height,
    };
  };
  const makeLines = (n, start = 1) =>
    Array(n)
      .fill("example text")
      .map((x, idx) => `${x} ${idx + start}`)
      .join("\n");
  const createMeasuredRows = (heightTimes: number) => ({
    ...emptyMeasuredRow,
    columnHeights: [
      {
        maxHeight: lineHeight * heightTimes,
        minHeight: lineHeight * heightTimes,
      },
    ],
    data: [{ value: "data" }],
    maxHeight: lineHeight * heightTimes,
    minHeight: lineHeight * heightTimes,
  });

  it("splits long row", () => {
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [
            { maxHeight: lineHeight * 9, minHeight: lineHeight * 9 },
          ],
          data: [{ value: makeLines(9) }],
          maxHeight: lineHeight * 9,
          minHeight: lineHeight * 9,
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [
          {
            columnHeights: [
              { maxHeight: lineHeight * 4, minHeight: lineHeight * 4 },
            ],
            data: [{ value: makeLines(4) }],
            maxHeight: lineHeight * 4,
            minHeight: lineHeight * 4,
            columnWidths: [],
            columnStarts: [],
          },
        ],
        columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
      },
      rest: {
        ...table,
        rows: [
          {
            columnHeights: [
              { maxHeight: lineHeight * 5, minHeight: lineHeight * 5 },
            ],
            data: [{ value: makeLines(5, 5) }],
            maxHeight: lineHeight * 5,
            minHeight: lineHeight * 5,
            columnWidths: [],
            columnStarts: [],
          },
        ],
        columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
      },
    };

    expect(splitTable(table, availableSpace)).toEqual(expected);
  });

  it("doesn't leave split widow", () => {
    // this test checks for cases where a tiny split with no data but ${continuedOn}
    const notes = `a long line that will wrap and will need a fair amount of space in order for it to render appropriately
  and another line that should go on the next page as well but it needs to be long to trigger the widow thing`;

    const measure = (txt): VerticalMeasure => ({
      maxHeight: Math.ceil(txt.length / 50),
      minHeight: Math.ceil(txt.length / 50),
    });
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight: measure,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [measure(notes)],
          data: [{ value: notes }],
          maxHeight: measure(notes).maxHeight,
          minHeight: measure(notes).maxHeight,
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitColumn }],
    };

    expect(splitTable(table, 4).first.rows).toHaveLength(1);
    expect((splitTable(table, 4).first.rows[0].data[0] as TextCell).value).toBe(
      notes.split("\n")[0] + continuedOn
    );
  });

  it("only splits row if splittable column is tallest", () => {
    const col1Text = Array(10).fill("123456789").join(" ");
    const splittable = Array(5).fill("123456789").join(" ");
    const measure = (txt) => ({
      maxHeight: Math.ceil(txt.length / 10),
      minHeight: Math.ceil(txt.length / 10),
    });
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight: measure,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [measure(col1Text), measure(splittable)],
          data: [{ value: col1Text }, { value: splittable }],
          maxHeight: measure(col1Text).maxHeight,
          minHeight: lineHeight,
        },
      ],
      columns: [
        { width: { value: 1, unit: "fr" } },
        { width: { value: 1, unit: "fr" }, splitFn: splitColumn },
      ],
    };

    expect(splitTable(table, 4).first.rows).toHaveLength(0);
  });

  it("split row throws if image in row", () => {
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [
            { minHeight: lineHeight * 9, maxHeight: lineHeight * 9 },
          ],
          data: [{ value: makeLines(9) }],
          maxHeight: lineHeight * 9,
          minHeight: lineHeight * 9,
          image: { image: "/test-image", height: 100 },
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitColumn }],
    };

    expect(() => splitTable(table, availableSpace)).toThrow(
      "A row cannot be split with an image"
    );
  });

  it("split row throws if chart in column with splitFn", () => {
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [
            { minHeight: lineHeight * 9, maxHeight: lineHeight * 9 },
          ],
          data: [
            {
              chart: {
                config: {
                  type: "bar",
                  data: {
                    labels: ["test"],
                    datasets: [
                      {
                        label: "test",
                        data: [12],
                      },
                    ],
                  },
                },
                maxHeight: lineHeight * 9,
                minHeight: lineHeight * 9,
              },
            },
          ],
          maxHeight: lineHeight * 9,
          minHeight: lineHeight * 9,
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitColumn }],
    };

    expect(() => splitTable(table, availableSpace)).toThrow(
      "A cell cannot be split with a chart"
    );
  });

  it("split table shows a breakPage row", () => {
    const tallRow = createMeasuredRows(3);
    const regularRow = createMeasuredRows(1);

    const table: MeasuredTable = {
      ...emptyTable,
      rows: [tallRow, regularRow],
      columns: [{ width: { value: 1, unit: "fr" } }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [tallRow, pageBreakRow],
      },
      rest: {
        ...table,
        rows: [regularRow],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: [pageBreakRow],
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
  it("split table shows multiple breakPage rows ", () => {
    const tallRow = createMeasuredRows(2);
    const regularRow = createMeasuredRows(1);
    const pageBreakRows = [pageBreakRow, pageBreakRow];
    const table: MeasuredTable = {
      ...emptyTable,
      rows: [tallRow, regularRow],
      columns: [{ width: { value: 1, unit: "fr" } }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [tallRow, ...pageBreakRows],
      },
      rest: {
        ...table,
        rows: [regularRow],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: pageBreakRows,
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
  it("split table shows breakPage rows with a splitted long row", () => {
    const pageBreakRows = [pageBreakRow, pageBreakRow];
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [{ maxHeight: lineHeight * 9, minHeight: lineHeight }],
          data: [{ value: makeLines(9) }],
          maxHeight: lineHeight * 9,
          minHeight: lineHeight * 9,
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [
          {
            ...emptyMeasuredRow,
            columnHeights: [
              { maxHeight: lineHeight * 2, minHeight: lineHeight * 2 },
            ],
            data: [{ value: makeLines(2) }],
            maxHeight: lineHeight * 2,
            minHeight: lineHeight * 2,
          },
          ...pageBreakRows,
        ],
      },
      rest: {
        ...table,
        rows: [
          {
            ...emptyMeasuredRow,
            columnHeights: [
              { maxHeight: lineHeight * 7, minHeight: lineHeight * 7 },
            ],
            data: [{ value: makeLines(7, 3) }],
            maxHeight: lineHeight * 7,
            minHeight: lineHeight * 7,
          },
        ],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: pageBreakRows,
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
});
