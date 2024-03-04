import {
  Section,
  Watermark,
  RowOptions,
  ColumnSetting,
  Row,
  Table,
} from "types";
import { normalizeSection, normalizeTable } from "./normalizeSection";
import { NormalizedTable } from "./types";
import {
  defaultNormalizedCellOptions,
  defaultNormalizedRowOptions,
  defaultNormalizedColumnSettings,
  defaultNormalizedFontSetting,
  defaultFontFace,
} from "./testDefaultVariables";

describe("normalizeSection", () => {
  const sectionHeaders = {
    rows: [
      {
        data: ["section header"],
      },
    ],
    columns: [
      {
        width: "1fr",
      },
    ],
  };
  const table = {
    headers: [
      {
        data: ["table header"],
      },
    ],
    rows: [
      {
        data: ["row"],
      },
    ],
    columns: [
      {
        width: "1fr",
      },
    ],
  };
  const normalizedTable = {
    headers: [
      {
        data: [{ ...defaultNormalizedCellOptions, value: "table header" }],
        options: defaultNormalizedRowOptions,
      },
    ],
    rows: [
      {
        data: [{ ...defaultNormalizedCellOptions, value: "row" }],
        options: defaultNormalizedRowOptions,
      },
    ],
    columns: defaultNormalizedColumnSettings,
  };
  it("carries sections setting", () => {
    const section: Section = {
      headers: sectionHeaders,
      tables: [{ ...table, style: { border: true } }],
      tableGap: 2,
    };
    const expectedTable = {
      headers: [
        {
          data: [{ ...defaultNormalizedCellOptions, value: "table header" }],
          options: { ...defaultNormalizedRowOptions, border: true },
        },
      ],
      rows: [
        {
          data: [{ ...defaultNormalizedCellOptions, value: "row" }],
          options: { ...defaultNormalizedRowOptions, border: true },
        },
      ],
      columns: defaultNormalizedColumnSettings,
    };

    expect(normalizeSection(section, defaultNormalizedFontSetting)).toEqual({
      headers: {
        rows: [
          {
            data: [
              { ...defaultNormalizedCellOptions, value: "section header" },
            ],
            options: { ...defaultNormalizedRowOptions, border: false },
          },
        ],
        columns: defaultNormalizedColumnSettings,
      },
      tables: [expectedTable],
      tableGap: 2,
    });
  });
  it("override doc tableGap setting", () => {
    const section: Section = {
      tables: [table],
      tableGap: 2,
    };

    expect(normalizeSection(section, defaultNormalizedFontSetting, 7)).toEqual({
      headers: {
        rows: [],
      },
      tables: [normalizedTable],
      tableGap: 2,
    });
  });
  it("passes normalizedWatermark from document", () => {
    const section: Section = {
      tables: [table],
    };
    const watermark: Watermark = {
      text: "Hello",
    };
    expect(
      normalizeSection(
        section,
        defaultNormalizedFontSetting,
        undefined,
        watermark
      )
    ).toEqual({
      headers: {
        rows: [],
      },
      tables: [normalizedTable],
      watermark: {
        text: "Hello",
        fontFace: defaultFontFace,
      },
    });
  });
  it("overriden normalizedWatermark from document", () => {
    const section: Section = {
      tables: [table],
      watermark: {
        text: "Bye Bye",
      },
    };
    const watermark: Watermark = {
      text: "Hello",
      fontFace: "Times",
    };
    expect(
      normalizeSection(
        section,
        defaultNormalizedFontSetting,
        undefined,
        watermark
      )
    ).toEqual({
      headers: {
        rows: [],
      },
      tables: [normalizedTable],
      watermark: {
        text: "Bye Bye",
        fontFace: defaultFontFace,
      },
    });
  });
});
describe("normalizeTable", () => {
  const tableStyle: RowOptions = {
    fontSize: 9,
    color: "white",
  };
  const tableColumnSetting: ColumnSetting[] = [
    {
      align: "right",
      width: "1fr",
    },
    {
      align: "right",
      width: "1fr",
    },
  ];
  const headers: Row[] = [{ data: ["header 1", "header 2"] }];
  const rows: Row[] = [{ data: ["first column", "second column"] }];
  it("tables without header get default settings + font settings", () => {
    const table: Table = {
      rows: rows,
    };
    expect(normalizeTable(table, defaultNormalizedFontSetting)).toEqual({
      headers: [],
      rows: [
        {
          data: [
            {
              ...defaultNormalizedCellOptions,
              value: "first column",
            },
            {
              ...defaultNormalizedCellOptions,
              value: "second column",
            },
          ],
          options: defaultNormalizedRowOptions,
        },
      ],
      columns: [
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
      ],
    });
  });
  it("tables without empty header get default settings", () => {
    const table: Table = {
      headers: [],
      rows: rows,
    };
    expect(normalizeTable(table, defaultNormalizedFontSetting)).toEqual({
      headers: [],
      rows: [
        {
          data: [
            {
              value: "first column",
              ...defaultNormalizedCellOptions,
            },
            {
              value: "second column",
              ...defaultNormalizedCellOptions,
            },
          ],
          options: defaultNormalizedRowOptions,
        },
      ],
      columns: [
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
      ],
    });
  });
  it("tables with header get default settings", () => {
    const table: Table = {
      headers: headers,
      rows: rows,
    };
    expect(normalizeTable(table, defaultNormalizedFontSetting)).toEqual({
      headers: [
        {
          data: [
            {
              value: "header 1",
              ...defaultNormalizedCellOptions,
            },
            {
              value: "header 2",
              ...defaultNormalizedCellOptions,
            },
          ],
          options: defaultNormalizedRowOptions,
        },
      ],
      rows: [
        {
          data: [
            {
              value: "first column",
              ...defaultNormalizedCellOptions,
            },
            {
              value: "second column",
              ...defaultNormalizedCellOptions,
            },
          ],
          options: defaultNormalizedRowOptions,
        },
      ],
      columns: [
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
      ],
    });
  });
  it("passes down settings to cells", () => {
    const table: Table = {
      headers: headers,
      rows: rows,
      columns: tableColumnSetting,
      style: tableStyle,
    };
    expect(normalizeTable(table, defaultNormalizedFontSetting)).toEqual({
      headers: [
        {
          data: [
            {
              ...defaultNormalizedCellOptions,
              value: "header 1",
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              ...defaultNormalizedCellOptions,
              value: "header 2",
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
          ],
          options: {
            ...defaultNormalizedRowOptions,
            fontSize: 9,
            color: "white",
          },
        },
      ],
      rows: [
        {
          data: [
            {
              ...defaultNormalizedCellOptions,
              value: "first column",
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              ...defaultNormalizedCellOptions,
              value: "second column",
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
          ],
          options: {
            ...defaultNormalizedRowOptions,
            fontSize: 9,
            color: "white",
          },
        },
      ],
      columns: [
        {
          align: "right",
          width: { value: 1, unit: "fr" },
        },
        {
          align: "right",
          width: { value: 1, unit: "fr" },
        },
      ],
    });
  });
  it("tables with one column with 10 columnSpan", () => {
    const table: Table = {
      rows: [
        {
          data: [{ value: "first column", columnSpan: 3 }],
        },
      ],
    };
    const expectedTable: NormalizedTable = {
      headers: [],
      rows: [
        {
          data: [
            {
              ...defaultNormalizedCellOptions,
              value: "first column",
              columnSpan: 3,
              horizontalAlign: "center",
            },
          ],
          options: defaultNormalizedRowOptions,
        },
      ],

      columns: [
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
        {
          align: "center",
          width: { value: 1, unit: "fr" },
        },
      ],
    };
    expect(normalizeTable(table, defaultNormalizedFontSetting)).toEqual(
      expectedTable
    );
  });
});
