import { NormalizedColumnSetting, Unit } from "../types/types";
import { calculateColumnWidths } from "./calculateColumnWidths";

describe("calculateColumnWidths", () => {
  const testUnit = (testCases) => {
    testCases.forEach(({ unit, columns, availableWidth, expected }) => {
      const name = testCases?.name ?? `column widths with ${unit}`;
      it(`return ${name}`, () => {
        const normalizedColumns: NormalizedColumnSetting[] = columns.map(
          (x) => ({
            width: { value: x, unit: unit as Unit },
          })
        );
        expect(
          calculateColumnWidths(normalizedColumns, availableWidth)
        ).toEqual(expected);
      });
    });
  };
  describe("test for layout", () => {
    const testCases = [
      {
        name: "landscape",
        unit: "fr",
        columns: [1, 1, 1],
        availableWidth: 756,
        expected: [252, 252, 252],
      },
      {
        name: "portrait",
        unit: "fr",
        columns: [1, 1, 1],
        availableWidth: 576,
        expected: [192, 192, 192],
      },
    ];
    testUnit(testCases);
  });

  describe("test for fractional unit", () => {
    const testCases = [
      {
        name: "all equal fractional values",
        unit: "fr",
        columns: [100, 100, 100],
        availableWidth: 756,
        expected: [252, 252, 252],
      },
      {
        name: "uneven fractional values",
        unit: "fr",
        columns: [100, 200, 100],
        availableWidth: 756,
        expected: [189, 378, 189],
      },
    ];
    testUnit(testCases);
  });

  describe("test for percentage unit", () => {
    const testCases = [
      {
        unit: "%",
        columns: [50, 25, 25],
        availableWidth: 1000,
        expected: [500, 250, 250],
      },
    ];
    testUnit(testCases);
  });
  describe("test for point unit", () => {
    const testCases = [
      {
        unit: "pt",
        columns: [500, 250, 250],
        availableWidth: 1000,
        expected: [500, 250, 250],
      },
    ];
    testUnit(testCases);
  });
  describe("test for mixed units", () => {
    const testCases = [
      {
        name: "fractional and percentage unit",
        columns: [
          { width: { value: 1, unit: "fr" } },
          { width: { value: 50, unit: "%" } },
          { width: { value: 25, unit: "%" } },
        ],
        availableWidth: 1000,
        expected: [250, 500, 250],
      },
      {
        name: "multiple fractional, and percentage unit",
        columns: [
          { width: { value: 1, unit: "fr" } },
          { width: { value: 1, unit: "fr" } },
          { width: { value: 50, unit: "%" } },
          { width: { value: 25, unit: "%" } },
        ],
        availableWidth: 1000,
        expected: [125, 125, 500, 250],
      },
      {
        name: "fractional, point, and percentage unit",
        columns: [
          { width: { value: 1, unit: "fr" } },
          { width: { value: 50, unit: "pt" } },
          { width: { value: 50, unit: "%" } },
          { width: { value: 25, unit: "%" } },
        ],
        availableWidth: 1000,
        expected: [200, 50, 500, 250],
      },
      {
        name: "point and fractional unit",
        columns: [
          { width: { value: 1, unit: "fr" } },
          { width: { value: 125, unit: "pt" } },
          { width: { value: 500, unit: "pt" } },
          { width: { value: 250, unit: "pt" } },
        ],
        availableWidth: 1000,
        expected: [125, 125, 500, 250],
      },
      {
        name: "point and percentage unit",
        columns: [
          { width: { value: 250, unit: "pt" } },
          { width: { value: 50, unit: "%" } },
          { width: { value: 25, unit: "%" } },
        ],
        availableWidth: 1000,
        expected: [250, 500, 250],
      },
      {
        name: "less than max width",
        columns: [
          { width: { value: 50, unit: "%" } },
          { width: { value: 25, unit: "%" } },
        ],
        availableWidth: 1000,
        expected: [500, 250],
      },
    ];
    testCases.forEach(({ name, columns, availableWidth, expected }) => {
      it(`return column widths ${name}`, () => {
        expect(
          calculateColumnWidths(
            columns as NormalizedColumnSetting[],
            availableWidth
          )
        ).toEqual(expected);
      });
    });
  });

  describe("test for exceeding page width", () => {
    const testCases = [
      {
        columns: [
          { width: { value: 100, unit: "%" } },
          { width: { value: 1, unit: "%" } },
        ],
        availableWidth: 1000,
      },
      {
        columns: [
          { width: { value: 100, unit: "%" } },
          { width: { value: 1, unit: "fr" } },
        ],
        availableWidth: 1000,
      },
      {
        columns: [
          { width: { value: 100, unit: "%" } },
          { width: { value: 2, unit: "pt" } },
        ],
        availableWidth: 1000,
      },
      {
        columns: [
          { width: { value: 99, unit: "%" } },
          { width: { value: 2, unit: "%" } },
        ],
        availableWidth: 1000,
      },
      {
        columns: [
          { width: { value: 1000, unit: "pt" } },
          { width: { value: 1, unit: "%" } },
        ],
        availableWidth: 1000,
      },
      {
        columns: [
          { width: { value: 1000, unit: "pt" } },
          { width: { value: 1, unit: "fr" } },
        ],
        availableWidth: 1000,
      },
      {
        columns: [
          { width: { value: 1000, unit: "pt" } },
          { width: { value: 1, unit: "pt" } },
        ],

        availableWidth: 1000,
      },
      {
        columns: [{ width: { value: 1200, unit: "pt" } }],
        availableWidth: 1000,
      },
    ];
    testCases.forEach(({ columns, availableWidth }) => {
      const errorString = columns
        .map((c) => `${c.width.value} ${c.width.unit}`)
        .join(", ");
      it(`throws errors on row ${errorString}`, () => {
        expect(() =>
          calculateColumnWidths(
            columns as NormalizedColumnSetting[],
            availableWidth
          )
        ).toThrowError(`Column widths ${errorString} exceeds page width`);
      });
    });
  });
});
