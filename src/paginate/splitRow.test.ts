import { NormalizedColumnSetting, NormalizedRow } from "../normalize/types";
import { MeasuredRow, MeasuredTable, VerticalMeasure } from "../measure/types";
import { splitRow } from "./splitRow";

describe("splitRow", () => {
  let first: MeasuredRow;
  let rest: MeasuredRow;

  const defaultMeasure = ((text: string) => {
    if (text === "first long") {
      return { minHeight: 25, maxHeight: 25 };
    } else {
      return { minHeight: 5, maxHeight: 5 };
    }
  }) as (
    text: string,
    index: number,
    row: NormalizedRow | MeasuredRow
  ) => VerticalMeasure;

  const splitFn = () => ["first long", "rest long"] as [string, string];

  beforeEach(() => {
    const row = {
      data: [{ value: "short" }, { value: "long" }, { value: "short" }],
      columnHeights: [
        { minHeight: 14, maxHeight: 14 },
        { minHeight: 30, maxHeight: 30 },
        { minHeight: 10, maxHeight: 10 },
      ],
    } as MeasuredRow;

    const table = {
      measureTextHeight: defaultMeasure,
      columns: [
        { width: { value: 1, unit: "fr" } },
        { width: { value: 1, unit: "fr" }, splitFn },
        { width: { value: 1, unit: "fr" } },
      ] as NormalizedColumnSetting[],
    } as MeasuredTable;

    const availableSpace = 25;

    const result = splitRow(row, availableSpace, table);
    first = result[0];
    rest = result[1];
  });

  it("sets correct column heights on first, rest", () => {
    expect(first.columnHeights).toEqual([
      { minHeight: 14, maxHeight: 14 },
      { minHeight: 25, maxHeight: 25 },
      { minHeight: 10, maxHeight: 10 },
    ]);

    expect(rest.columnHeights).toEqual([
      { minHeight: 14, maxHeight: 14 },
      { minHeight: 5, maxHeight: 5 },
      { minHeight: 10, maxHeight: 10 },
    ]);
  });

  it("sets correct data values on first, rest", () => {
    expect(first.data).toEqual([
      { value: "short" },
      { value: "first long" },
      { value: "short" },
    ]);

    expect(rest.data).toEqual([
      { value: "short" },
      { value: "rest long" },
      { value: "short" },
    ]);
  });
});
