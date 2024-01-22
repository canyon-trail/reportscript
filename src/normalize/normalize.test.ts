import {
  Cell,
  ColumnSetting,
  Row,
  RowOptions,
  Table,
  Section,
  Document,
  HeaderFooters,
  PageBreakRows,
  HorizontalAlignment,
} from "../types";
import {
  computeCellAlignments,
  normalizeAlignment,
  normalizeCell,
  normalize,
  normalizeRow,
  normalizeSection,
  normalizeTable,
  normalizeHeaderFooter,
  parseWidth,
  parseColumnSetting,
  validateCellSpan,
  normalizePageBreakRows,
} from ".";
import {
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedPageBreakRows,
  NormalizedTable,
} from "./types";
describe("normalizeCell", () => {
  it("normalize string", () => {
    expect(normalizeCell("value")).toEqual({ value: "value", columnSpan: 1 });
  });
  it("normalize number", () => {
    expect(normalizeCell(1)).toEqual({ value: 1, columnSpan: 1 });
  });
  it("normalize cell", () => {
    expect(normalizeCell({ value: "value" })).toEqual({
      value: "value",
      columnSpan: 1,
    });
  });
  it("normalize null cell", () => {
    expect(normalizeCell({ value: null })).toEqual({
      value: "",
      columnSpan: 1,
    });
  });
  it("normalize null ", () => {
    expect(normalizeCell(null)).toEqual({ value: "", columnSpan: 1 });
  });
  it("normalize cell override columnSpan", () => {
    expect(normalizeCell({ value: "value", columnSpan: 2 })).toEqual({
      value: "value",
      columnSpan: 2,
    });
  });
});

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
        { value: "one", ...mockTableOptions, align: "left", columnSpan: 1 },
        { value: "two", ...mockTableOptions, align: "left", columnSpan: 1 },
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
        { value: "one", ...mockRowOptions, align: "left", columnSpan: 1 },
        { value: "two", ...mockRowOptions, align: "left", columnSpan: 1 },
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
      data: [{ value: "one", ...mockRowOptions, align: "left", columnSpan: 2 }],
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
  it("tables without header get default settings", () => {
    const table: Table = {
      rows: rows,
    };
    expect(normalizeTable(table)).toEqual({
      headers: [],
      rows: [
        {
          data: [
            {
              value: "first column",
              align: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              align: "center",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
          },
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
    expect(normalizeTable(table)).toEqual({
      headers: [],
      rows: [
        {
          data: [
            {
              value: "first column",
              align: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              align: "center",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
          },
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
    expect(normalizeTable(table)).toEqual({
      headers: [
        {
          data: [
            {
              value: "header 1",
              align: "center",
              columnSpan: 1,
            },
            {
              value: "header 2",
              align: "center",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
          },
        },
      ],
      rows: [
        {
          data: [
            {
              value: "first column",
              align: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              align: "center",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
          },
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
  it("tables get passes down settings", () => {
    const table: Table = {
      headers: headers,
      rows: rows,
      columns: tableColumnSetting,
      style: tableStyle,
    };
    expect(normalizeTable(table)).toEqual({
      headers: [
        {
          data: [
            {
              value: "header 1",
              align: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              value: "header 2",
              align: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
            fontSize: 9,
            color: "white",
          },
        },
      ],
      rows: [
        {
          data: [
            {
              value: "first column",
              align: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              value: "second column",
              align: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
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
          data: [{ value: "first column", columnSpan: 3, align: "center" }],
          options: { border: false },
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
    expect(normalizeTable(table)).toEqual(expectedTable);
  });
});
describe("normalizeHeaderFooter", () => {
  const headerStyle: RowOptions = {
    fontSize: 9,
    color: "white",
  };

  const rows: Row[] = [{ data: ["first column", "second column"] }];

  it("header/footer with header get default settings", () => {
    const header: HeaderFooters = {
      rows: rows,
    };
    expect(normalizeHeaderFooter(header)).toEqual({
      rows: [
        {
          data: [
            {
              value: "first column",
              align: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              align: "center",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
          },
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
  it("header/footer get passes down settings", () => {
    const header: HeaderFooters = {
      rows: rows,
      columns: [
        {
          align: "right",
          width: "1fr",
        },
        {
          align: "right",
          width: "1fr",
        },
      ],
      style: headerStyle,
    };
    expect(normalizeHeaderFooter(header)).toEqual({
      rows: [
        {
          data: [
            {
              value: "first column",
              align: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              value: "second column",
              align: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
          ],
          options: {
            border: false,
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
        align: "center",
      },
      {
        value: "1",
        columnSpan: 1,
        align: "center",
      },
      {
        value: "1",
        columnSpan: 1,
        align: "center",
      },
    ]);
  });
  it("gives cell override alignment from columnsSetting", () => {
    const mockCell: Cell[] = [
      {
        value: "1",
        columnSpan: 1,
        align: "left",
      },
      {
        value: "1",
        columnSpan: 1,
        align: "left",
      },
      {
        value: "1",
        columnSpan: 1,
        align: "left",
      },
    ];

    expect(normalizeAlignment(mockCell, mockColumnSetting)).toEqual(mockCell);
  });
});

describe("normalizeSection", () => {
  it("carries sections setting", () => {
    const section: Section = {
      headers: {
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
      },
      tables: [
        {
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
          style: { border: true },
          columns: [
            {
              width: "1fr",
            },
          ],
        },
      ],
      tableGap: 2,
    };
    expect(normalizeSection(section)).toEqual({
      headers: {
        rows: [
          {
            data: [{ value: "section header", align: "center", columnSpan: 1 }],
            options: {
              border: false,
            },
          },
        ],
        columns: [
          {
            width: { value: 1, unit: "fr" },
            align: "center",
          },
        ],
      },
      tables: [
        {
          headers: [
            {
              data: [{ value: "table header", columnSpan: 1, align: "center" }],
              options: {
                border: true,
              },
            },
          ],
          rows: [
            {
              data: [{ value: "row", columnSpan: 1, align: "center" }],
              options: {
                border: true,
              },
            },
          ],
          columns: [
            {
              width: { value: 1, unit: "fr" },
              align: "center",
            },
          ],
        },
      ],
      tableGap: 2,
    });
  });
  it("override doc tableGap setting", () => {
    const section: Section = {
      tables: [
        {
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
          style: { border: true },
          columns: [
            {
              width: "1fr",
            },
          ],
        },
      ],
      tableGap: 2,
    };
    expect(normalizeSection(section, 7)).toEqual({
      headers: {
        rows: [],
      },
      tables: [
        {
          headers: [
            {
              data: [{ value: "table header", columnSpan: 1, align: "center" }],
              options: {
                border: true,
              },
            },
          ],
          rows: [
            {
              data: [{ value: "row", columnSpan: 1, align: "center" }],
              options: {
                border: true,
              },
            },
          ],
          columns: [
            {
              width: { value: 1, unit: "fr" },
              align: "center",
            },
          ],
        },
      ],
      tableGap: 2,
    });
  });
});
describe("normalizeDocument", () => {
  it("carries sections setting", () => {
    const document: Document = {
      headers: {
        rows: [
          {
            data: ["document header"],
          },
        ],
        columns: [
          {
            width: "1fr",
          },
        ],
      },
      sections: [
        {
          headers: {
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
          },
          tables: [
            {
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
              style: { border: true },
              columns: [
                {
                  width: "1fr",
                },
              ],
            },
          ],
        },
      ],
      footers: {
        rows: [
          {
            data: ["document footer"],
          },
        ],

        columns: [
          {
            width: "1fr",
          },
        ],
      },
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
      tableGap: 2,
    };
    expect(normalize(document)).toEqual({
      headers: {
        rows: [
          {
            data: [
              { value: "document header", align: "center", columnSpan: 1 },
            ],
            options: {
              border: false,
            },
          },
        ],
        columns: [
          {
            width: { value: 1, unit: "fr" },
            align: "center",
          },
        ],
      },
      sections: [
        {
          headers: {
            rows: [
              {
                data: [
                  { value: "section header", align: "center", columnSpan: 1 },
                ],
                options: {
                  border: false,
                },
              },
            ],
            columns: [
              {
                width: { value: 1, unit: "fr" },
                align: "center",
              },
            ],
          },
          tables: [
            {
              headers: [
                {
                  data: [
                    { value: "table header", columnSpan: 1, align: "center" },
                  ],
                  options: {
                    border: true,
                  },
                },
              ],
              rows: [
                {
                  data: [{ value: "row", columnSpan: 1, align: "center" }],
                  options: {
                    border: true,
                  },
                },
              ],
              columns: [
                {
                  width: { value: 1, unit: "fr" },
                  align: "center",
                },
              ],
            },
          ],
          tableGap: 2,
        },
      ],
      footers: {
        rows: [
          {
            data: [
              { value: "document footer", align: "center", columnSpan: 1 },
            ],
            options: {
              border: false,
            },
          },
        ],
        columns: [
          {
            width: { value: 1, unit: "fr" },
            align: "center",
          },
        ],
      },
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
      tableGap: 2,
    });
  });

  it("return document with empty headers and footers", () => {
    const document: Document = {
      sections: [
        {
          headers: {
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
          },
          tables: [
            {
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
              style: { border: true },
              columns: [
                {
                  width: "1fr",
                },
              ],
            },
          ],
        },
      ],
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
    };
    expect(normalize(document)).toEqual({
      headers: { rows: [] },
      sections: [
        {
          headers: {
            rows: [
              {
                data: [
                  { value: "section header", align: "center", columnSpan: 1 },
                ],
                options: {
                  border: false,
                },
              },
            ],
            columns: [
              {
                width: { value: 1, unit: "fr" },
                align: "center",
              },
            ],
          },
          tables: [
            {
              headers: [
                {
                  data: [
                    { value: "table header", columnSpan: 1, align: "center" },
                  ],
                  options: {
                    border: true,
                  },
                },
              ],
              rows: [
                {
                  data: [{ value: "row", columnSpan: 1, align: "center" }],
                  options: {
                    border: true,
                  },
                },
              ],
              columns: [
                {
                  width: { value: 1, unit: "fr" },
                  align: "center",
                },
              ],
            },
          ],
        },
      ],
      footers: { rows: [] },
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
    });
  });

  it("handles defined headers and undefined footers", () => {
    const document: Document = {
      headers: {
        rows: [
          {
            data: ["document header"],
          },
        ],
        columns: [
          {
            width: "1fr",
          },
        ],
      },
      sections: [
        {
          headers: {
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
          },
          tables: [
            {
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
              style: { border: true },
              columns: [
                {
                  width: "1fr",
                },
              ],
            },
          ],
        },
      ],
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
    };
    expect(normalize(document)).toEqual({
      headers: {
        rows: [
          {
            data: [
              { value: "document header", align: "center", columnSpan: 1 },
            ],
            options: {
              border: false,
            },
          },
        ],
        columns: [
          {
            width: { value: 1, unit: "fr" },
            align: "center",
          },
        ],
      },
      sections: [
        {
          headers: {
            rows: [
              {
                data: [
                  { value: "section header", align: "center", columnSpan: 1 },
                ],
                options: {
                  border: false,
                },
              },
            ],
            columns: [
              {
                width: { value: 1, unit: "fr" },
                align: "center",
              },
            ],
          },
          tables: [
            {
              headers: [
                {
                  data: [
                    { value: "table header", columnSpan: 1, align: "center" },
                  ],
                  options: {
                    border: true,
                  },
                },
              ],
              rows: [
                {
                  data: [{ value: "row", columnSpan: 1, align: "center" }],
                  options: {
                    border: true,
                  },
                },
              ],
              columns: [
                {
                  width: { value: 1, unit: "fr" },
                  align: "center",
                },
              ],
            },
          ],
        },
      ],
      footers: { rows: [] },
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
    });
  });

  it("normalized pageBreakRow", () => {
    const pageBreakRows: PageBreakRows = {
      rows: [
        {
          data: ["column 1", "column 2"],
          options: {
            border: true,
          },
        },
      ],
      columns: [
        {
          width: "1fr",
        },
        {
          width: "1fr",
        },
      ],
    };
    const document: Document = {
      sections: [
        {
          tables: [
            {
              rows: [
                {
                  data: ["row"],
                },
              ],
              style: { border: true },
              columns: [
                {
                  width: "1fr",
                },
              ],
            },
          ],
        },
      ],
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
      tableGap: 2,
      pageBreakRows: pageBreakRows,
    };
    const normalizedPageBreakRows: NormalizedPageBreakRows = {
      rows: [
        {
          data: [
            { value: "column 1", columnSpan: 1, align: "center" },
            { value: "column 2", columnSpan: 1, align: "center" },
          ],
          options: {
            border: true,
          },
        },
      ],
      columns: [
        {
          width: { value: 1, unit: "fr" },
          align: "center",
        },
        {
          width: { value: 1, unit: "fr" },
          align: "center",
        },
      ] as NormalizedColumnSetting[],
    };
    const expected: NormalizedDocument = {
      headers: { rows: [] },
      footers: { rows: [] },
      sections: [
        {
          headers: { rows: [] },
          tables: [
            {
              headers: [],
              rows: [
                {
                  data: [{ value: "row", columnSpan: 1, align: "center" }],
                  options: {
                    border: true,
                  },
                },
              ],
              columns: [
                {
                  width: { value: 1, unit: "fr" },
                  align: "center",
                },
              ],
            },
          ],
          tableGap: 2,
        },
      ],
      pageNumbers: true,
      sectionPageNumbers: true,
      timestamp: true,
      repeatSectionHeaders: true,
      repeatReportHeaders: true,
      tableGap: 2,
      pageBreakRows: normalizedPageBreakRows,
    };
    expect(normalize(document)).toEqual(expected);
  });
});

describe("normalizePageBreakRows", () => {
  it("normalized pageBreakRow", () => {
    const pageBreakRows: PageBreakRows = {
      rows: [
        {
          data: ["column 1", "column 2"],
          options: {
            border: true,
          },
        },
      ],
      columns: [
        {
          width: "1fr",
        },
        {
          width: "1fr",
        },
      ],
    };
    const normalizedPageBreakRows: NormalizedPageBreakRows = {
      rows: [
        {
          data: [
            { value: "column 1", columnSpan: 1, align: "center" },
            { value: "column 2", columnSpan: 1, align: "center" },
          ],
          options: {
            border: true,
          },
        },
      ],
      columns: [
        {
          width: { value: 1, unit: "fr" },
          align: "center",
        },
        {
          width: { value: 1, unit: "fr" },
          align: "center",
        },
      ] as NormalizedColumnSetting[],
    };
    expect(normalizePageBreakRows(pageBreakRows)).toEqual(
      normalizedPageBreakRows
    );
  });
});

describe("parseWidth", () => {
  const testCases = [
    {
      input: "1 fr",
      exepct: { value: 1, unit: "fr" },
    },
    { input: "1.5 fr", exepct: { value: 1.5, unit: "fr" } },
    { input: "1fr", exepct: { value: 1, unit: "fr" } },
    { input: "1.5fr", exepct: { value: 1.5, unit: "fr" } },
    { input: "1.5%", exepct: { value: 1.5, unit: "%" } },
    { input: "1.5 %", exepct: { value: 1.5, unit: "%" } },
    { input: "0.5 %", exepct: { value: 0.5, unit: "%" } },
    { input: ".5 %", exepct: { value: 0.5, unit: "%" } },
    { input: "0 %", exepct: { value: 0, unit: "%" } },
    { input: ".0 %", exepct: { value: 0, unit: "%" } },
    { input: "0.0 %", exepct: { value: 0, unit: "%" } },
    { input: "1.0 %", exepct: { value: 1, unit: "%" } },
    { input: "1.5 pt", exepct: { value: 1.5, unit: "pt" } },
    { input: "1.5pt", exepct: { value: 1.5, unit: "pt" } },
  ];
  testCases.forEach(({ input, exepct }) => {
    it(`returns width with unit if passed a string ${input}`, () => {
      expect(parseWidth(input)).toEqual(exepct);
    });
  });

  const errorTestCase = [
    "1 fr 2",
    "1 fr ",
    " 1 fr",
    " 1 %",
    "1 po",
    "funny fr",
    "1 fr %",
    "1 fr 2 fr",
    "1 fr%",
    "1 fthi that fr",
    "fr",
    "%",
    ".",
    "1.5.5",
    "1.5",
    "",
  ];
  errorTestCase.forEach((input) => {
    it(`throw error if input was not valid ${input}`, () => {
      expect(() => parseWidth(input)).toThrowError(
        `Invalid width input ${input}`
      );
    });
  });
});
describe("parseColumnSetting", () => {
  const rows = [{ data: ["column 1", "column 2", "column 3"] }];
  const testCases = [undefined, null, []];
  testCases.forEach((columnSetting) => {
    it(`return default column setting if no column setting is set ${columnSetting}`, () => {
      const defaultColumnSetting = [
        { width: "1fr", align: "center" },
        { width: "1fr", align: "center" },
        { width: "1fr", align: "center" },
      ];
      expect(parseColumnSetting(rows, columnSetting)).toEqual(
        defaultColumnSetting
      );
    });
  });
  it("return filled column setting when only alignment was set", () => {
    const columnSetting: ColumnSetting[] = [
      { align: "left" },
      { align: "left" },
      { align: "left" },
    ];
    expect(parseColumnSetting(rows, columnSetting)).toEqual([
      { width: "1fr", align: "left" },
      { width: "1fr", align: "left" },
      { width: "1fr", align: "left" },
    ]);
  });
  it("return filled column setting when only width was set", () => {
    const columnSetting: ColumnSetting[] = [
      { width: "2fr" },
      { width: "2fr" },
      { width: "2fr" },
    ];
    expect(parseColumnSetting(rows, columnSetting)).toEqual([
      { width: "2fr", align: "center" },
      { width: "2fr", align: "center" },
      { width: "2fr", align: "center" },
    ]);
  });
  it("return column setting that was set as string", () => {
    const columnSetting: ColumnSetting[] = [
      { width: "1 fr" },
      { width: "1 fr" },
      { width: "1 fr" },
    ];
    expect(parseColumnSetting(rows, columnSetting)).toEqual([
      { width: "1 fr", align: "center" },
      { width: "1 fr", align: "center" },
      { width: "1 fr", align: "center" },
    ]);
  });
});
