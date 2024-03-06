import { RowOptions, Row, Cell, HorizontalAlignment } from "../types";
import {
  normalizeRow,
  computeCellAlignments,
  validateCellSpan,
  normalizeAlignment,
} from "./normalizeRow";
import { NormalizedColumnSetting } from "./types";

describe("normalizeRow", () => {
  const mockTableColumnSetting: NormalizedColumnSetting[] = [
    {
      align: "left",
      width: { value: 1, unit: "fr" },
    },
    {
      align: "left",
      width: { value: 1, unit: "fr" },
    },
  ];

  const mockRowOptions: RowOptions = {
    fontSize: 10,
    fontFace: "font",
    boldFace: "font",
    grid: true,
    gridColor: "white",
    backgroundColor: "white",
    lineGap: 1,
    bottomBorder: true,
    bold: true,
    color: "white",
  };
  const mockTableOptions: RowOptions = {
    fontSize: 9,
    fontFace: "font",
    boldFace: "font",
    grid: true,
    gridColor: "black",
    backgroundColor: "black",
    lineGap: 1,
    bottomBorder: true,
    bold: true,
    color: "black",
  };
  const mockRowWithString: Row = {
    data: ["one", "two"],
  };

  it("Row and cell carries tableStyle and tableColumnSetting", () => {
    expect(
      normalizeRow(mockRowWithString, mockTableOptions, mockTableColumnSetting)
    ).toEqual({
      data: [
        {
          value: "one",
          ...mockTableOptions,
          horizontalAlign: "left",
          columnSpan: 1,
        },
        {
          value: "two",
          ...mockTableOptions,
          horizontalAlign: "left",
          columnSpan: 1,
        },
      ],
      options: {
        ...mockTableOptions,
        border: false,
      },
    });
  });
  it("Row override tableStyle", () => {
    expect(
      normalizeRow(
        {
          ...mockRowWithString,
          options: mockRowOptions,
        } as Row,
        mockTableOptions,
        mockTableColumnSetting
      )
    ).toEqual({
      data: [
        {
          value: "one",
          ...mockRowOptions,
          horizontalAlign: "left",
          columnSpan: 1,
        },
        {
          value: "two",
          ...mockRowOptions,
          horizontalAlign: "left",
          columnSpan: 1,
        },
      ],
      options: {
        ...mockRowOptions,
        border: false,
      },
    });
  });
  it("adjust to columnSpan", () => {
    expect(
      normalizeRow(
        {
          data: [{ value: "one", columnSpan: 2 }],
          options: mockRowOptions,
        } as Row,
        mockTableOptions,
        mockTableColumnSetting
      )
    ).toEqual({
      data: [
        {
          value: "one",
          ...mockRowOptions,
          horizontalAlign: "left",
          columnSpan: 2,
        },
      ],
      options: {
        ...mockRowOptions,
        border: false,
      },
    });
  });
});
describe("computeCellAlignments", () => {
  it("keep alignment if cell don't have alignment", () => {
    const mockColumnSettingWithAlignment: NormalizedColumnSetting[] = [
      {
        align: "right",
        width: { value: 1, unit: "fr" },
      },
      {
        align: "right",
        width: { value: 1, unit: "fr" },
      },
      {
        align: "left",
        width: { value: 1, unit: "fr" },
      },
    ];
    const mockCells: Cell[] = [
      {
        value: "1",
        columnSpan: 1,
      },
      {
        value: "1",
        columnSpan: 1,
      },
      {
        value: "1",
        columnSpan: 1,
      },
    ];
    expect(
      computeCellAlignments(mockColumnSettingWithAlignment, mockCells)
    ).toEqual(["right", "right", "left"]);
  });
  it("return align with ajusted to cellSpan ", () => {
    const mockColumnSettingWithAlignment: NormalizedColumnSetting[] = [
      {
        width: { value: 1, unit: "fr" },
        align: "right",
      },
      {
        width: { value: 1, unit: "fr" },
        align: "left",
      },
      {
        width: { value: 1, unit: "fr" },
        align: "center",
      },
    ];
    const mockCells: Cell[] = [
      {
        value: "1",
        columnSpan: 2,
      },
      {
        value: "1",
        columnSpan: 1,
      },
    ];
    expect(
      computeCellAlignments(mockColumnSettingWithAlignment, mockCells)
    ).toEqual(["right", "center"]);
  });
});
describe("validateCellSpan", () => {
  it("return throw an error if a text row has columnSpan exceed required columnSetting ", () => {
    const mockColumnSettingWithAlignment: NormalizedColumnSetting[] = [
      {
        width: { value: 1, unit: "fr" },
      },
      {
        width: { value: 1, unit: "fr" },
      },
      {
        width: { value: 1, unit: "fr" },
      },
    ];
    const mockCells: Cell[] = [
      {
        value: "1",
        columnSpan: 3,
      },
      {
        value: "1",
        columnSpan: 1,
      },
    ];

    expect(() =>
      validateCellSpan(mockCells, mockColumnSettingWithAlignment)
    ).toThrowError(
      "Sum of column spans (4) is greater than number of columns (3)"
    );
  });
  it("return throw an error if a text row has columnSpan less than required columnSetting ", () => {
    const mockColumnSettingWithAlignment: NormalizedColumnSetting[] = [
      {
        width: { value: 1, unit: "fr" },
      },
      {
        width: { value: 1, unit: "fr" },
      },
      {
        width: { value: 1, unit: "fr" },
      },
    ];
    const mockCells: Cell[] = [
      {
        value: "1",
        columnSpan: 1,
      },
      {
        value: "2",
        columnSpan: 1,
      },
    ];

    expect(() =>
      validateCellSpan(mockCells, mockColumnSettingWithAlignment)
    ).toThrowError(
      "Sum of column spans (2) is less than number of columns (3)"
    );
  });
});
describe("normalizeAlignment", () => {
  const mockColumnSetting: HorizontalAlignment[] = [
    "center",
    "center",
    "center",
  ];
  it("gives cell alignment from columnsSetting", () => {
    const mockCell: Cell[] = [
      {
        value: "1",
        columnSpan: 1,
      },
      {
        value: "1",
        columnSpan: 1,
      },
      {
        value: "1",
        columnSpan: 1,
      },
    ];

    expect(normalizeAlignment(mockCell, mockColumnSetting)).toEqual([
      {
        value: "1",
        columnSpan: 1,
        horizontalAlign: "center",
      },
      {
        value: "1",
        columnSpan: 1,
        horizontalAlign: "center",
      },
      {
        value: "1",
        columnSpan: 1,
        horizontalAlign: "center",
      },
    ]);
  });
  it("gives cell override alignment from columnsSetting", () => {
    const mockCell: Cell[] = [
      {
        value: "1",
        columnSpan: 1,
        horizontalAlign: "left",
      },
      {
        value: "1",
        columnSpan: 1,
        horizontalAlign: "left",
      },
      {
        value: "1",
        columnSpan: 1,
        horizontalAlign: "left",
      },
    ];

    expect(normalizeAlignment(mockCell, mockColumnSetting)).toEqual(mockCell);
  });
});
