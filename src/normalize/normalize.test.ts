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
  FontSetting,
  Watermark,
  SimpleDocument,
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
  defaultFontFace,
  defaultBoldFace,
  normalizeFontSetting,
  normalizeSetting,
  normalizeWatermark,
} from ".";
import {
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedHeaderFooter,
  NormalizedPageBreakRows,
  NormalizedRow,
  NormalizedSection,
  NormalizedTable,
} from "./types";

const emptyNormalizedDocument = {
  headers: { rows: [] },
  footers: { rows: [] },
  pageBreakRows: undefined,
};
const defaultNormalizedFontSetting = {
  fontFace: defaultFontFace,
  boldFace: defaultBoldFace,
};
const defaultRowOptions = {
  ...defaultNormalizedFontSetting,
  border: false,
};
const defaultNormalizedCellOptions = {
  ...defaultNormalizedFontSetting,
  horizontalAlign: "center",
  columnSpan: 1,
};

const defaultNormalizedColumnSetting: NormalizedColumnSetting[] = [
  {
    width: { value: 1, unit: "fr" },
    align: "center",
  },
];
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
  it("normalize null", () => {
    expect(normalizeCell(null)).toEqual({ value: "", columnSpan: 1 });
  });
  it("allows 0 value", () => {
    expect(normalizeCell({ value: 0 })).toEqual({
      value: 0,
      columnSpan: 1,
    });
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
              horizontalAlign: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              horizontalAlign: "center",
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
              horizontalAlign: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              horizontalAlign: "center",
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
              horizontalAlign: "center",
              columnSpan: 1,
            },
            {
              value: "header 2",
              horizontalAlign: "center",
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
              horizontalAlign: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              horizontalAlign: "center",
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
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              value: "header 2",
              horizontalAlign: "right",
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
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              value: "second column",
              horizontalAlign: "right",
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
          data: [
            { value: "first column", columnSpan: 3, horizontalAlign: "center" },
          ],
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
              horizontalAlign: "center",
              columnSpan: 1,
            },
            {
              value: "second column",
              horizontalAlign: "center",
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
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
              columnSpan: 1,
            },
            {
              value: "second column",
              horizontalAlign: "right",
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
        options: defaultRowOptions,
      },
    ],
    rows: [
      {
        data: [{ ...defaultNormalizedCellOptions, value: "row" }],
        options: defaultRowOptions,
      },
    ],
    columns: defaultNormalizedColumnSetting,
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
          options: { ...defaultRowOptions, border: true },
        },
      ],
      rows: [
        {
          data: [{ ...defaultNormalizedCellOptions, value: "row" }],
          options: { ...defaultRowOptions, border: true },
        },
      ],
      columns: defaultNormalizedColumnSetting,
    };

    expect(normalizeSection(section, defaultNormalizedFontSetting)).toEqual({
      headers: {
        rows: [
          {
            data: [
              { ...defaultNormalizedCellOptions, value: "section header" },
            ],
            options: { ...defaultRowOptions, border: false },
          },
        ],
        columns: defaultNormalizedColumnSetting,
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

describe("normalizeDocument", () => {
  const createNormalizedRow = (
    text: string,
    fontSetting?: FontSetting
  ): NormalizedRow => {
    const cellOptions = {
      ...defaultNormalizedCellOptions,
      ...fontSetting,
    };
    const rowOptions = {
      ...defaultRowOptions,
      ...fontSetting,
    };
    return {
      data: [{ ...cellOptions, value: text } as Cell],
      options: rowOptions,
    };
  };
  const createNormalizedPageBreakRows = (
    fontSetting?: FontSetting
  ): NormalizedPageBreakRows => {
    return {
      rows: [
        {
          data: [
            {
              ...defaultNormalizedCellOptions,
              ...fontSetting,
              value: "column 1",
            },
            {
              ...defaultNormalizedCellOptions,
              ...fontSetting,
              value: "column 2",
            },
          ] as Cell[],
          options: { ...defaultRowOptions, ...fontSetting },
        },
      ],
      columns: [
        defaultNormalizedColumnSetting[0],
        defaultNormalizedColumnSetting[0],
      ] as NormalizedColumnSetting[],
    };
  };
  const documentHeaders = {
    rows: [
      {
        data: ["document header"],
      },
    ],
  };
  const documentSections = [
    {
      headers: {
        rows: [
          {
            data: ["section header"],
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
        },
      ],
    },
  ];
  const documentFooters = {
    rows: [
      {
        data: ["document footer"],
      },
    ],
  };
  const normalizedDocumentHeader: NormalizedHeaderFooter = {
    rows: [createNormalizedRow("document header")],
    columns: defaultNormalizedColumnSetting,
  };
  const normalizedDocumentSections: NormalizedSection[] = [
    {
      headers: {
        rows: [createNormalizedRow("section header")],
        columns: defaultNormalizedColumnSetting,
      },
      tables: [
        {
          headers: [createNormalizedRow("table header")],
          rows: [createNormalizedRow("row")],
          columns: defaultNormalizedColumnSetting,
        },
      ],
    },
  ];
  const normalizedDocumentFooters: NormalizedHeaderFooter = {
    rows: [createNormalizedRow("document footer")],
    columns: defaultNormalizedColumnSetting,
  };
  const document: Document = {
    headers: documentHeaders,
    sections: documentSections,
    footers: documentFooters,
  };
  const normalizedDocument: NormalizedDocument = {
    headers: normalizedDocumentHeader,
    sections: normalizedDocumentSections,
    footers: normalizedDocumentFooters,
    timestampPageNumberFontSetting: defaultNormalizedFontSetting,
  };
  const pageBreakRows: PageBreakRows = {
    rows: [
      {
        data: ["column 1", "column 2"],
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
  it("normalizes document with default options", () => {
    expect(normalize(document)).toEqual(normalizedDocument);
  });
  it("keeps document settings", () => {
    expect(normalize({ ...document, timestamp: true })).toEqual({
      ...normalizedDocument,
      timestamp: true,
    });
  });
  it("passes down tableGap setting", () => {
    const normalizedSection: NormalizedSection = {
      ...normalizedDocumentSections[0],
      tableGap: 2,
      tables: [
        {
          ...normalizedDocumentSections[0].tables[0],
        },
      ],
    };
    expect(normalize({ ...document, tableGap: 2 })).toEqual({
      ...normalizedDocument,
      sections: [normalizedSection],
      tableGap: 2,
    });
  });

  it("return document with empty headers and footers", () => {
    const document: Document = {
      sections: documentSections,
    };
    expect(normalize(document)).toEqual({
      ...emptyNormalizedDocument,
      sections: normalizedDocumentSections,
      timestampPageNumberFontSetting: defaultNormalizedFontSetting,
    });
  });

  it("handles defined headers and undefined footers", () => {
    const document: Document = {
      headers: documentHeaders,
      sections: documentSections,
    };
    expect(normalize(document)).toEqual({
      ...emptyNormalizedDocument,
      headers: normalizedDocumentHeader,
      sections: normalizedDocumentSections,
      timestampPageNumberFontSetting: defaultNormalizedFontSetting,
    });
  });

  it("normalized with pageBreakRow", () => {
    const document: Document = {
      sections: documentSections,
      pageBreakRows: pageBreakRows,
    };
    const normalizedPageBreakRows: NormalizedPageBreakRows =
      createNormalizedPageBreakRows();
    const expected: NormalizedDocument = {
      ...emptyNormalizedDocument,
      sections: normalizedDocumentSections,
      pageBreakRows: normalizedPageBreakRows,
      timestampPageNumberFontSetting: defaultNormalizedFontSetting,
    };
    expect(normalize(document)).toEqual(expected);
  });

  describe("fonts setting", () => {
    const fontSetting = {
      fontFace: "Arial",
      boldFace: "Arial-Bold",
      bold: true,
    };
    const timestampPageNumberFontSetting = {
      fontFace: "Times",
      boldFace: "Times-Bold",
      bold: false,
    };
    const normalizedDocumentHeader: NormalizedHeaderFooter = {
      rows: [createNormalizedRow("document header", fontSetting)],
      columns: defaultNormalizedColumnSetting,
    };
    const normalizedDocumentSections: NormalizedSection[] = [
      {
        headers: {
          rows: [createNormalizedRow("section header", fontSetting)],
          columns: defaultNormalizedColumnSetting,
        },
        tables: [
          {
            headers: [createNormalizedRow("table header", fontSetting)],
            rows: [createNormalizedRow("row", fontSetting)],
            columns: defaultNormalizedColumnSetting,
          },
        ],
      },
    ];
    const normalizedDocumentFooters: NormalizedHeaderFooter = {
      rows: [createNormalizedRow("document footer", fontSetting)],
      columns: defaultNormalizedColumnSetting,
    };
    const expectedDocument: NormalizedDocument = {
      headers: normalizedDocumentHeader,
      sections: normalizedDocumentSections,
      footers: normalizedDocumentFooters,
      defaultFontSettings: fontSetting,
      timestampPageNumberFontSetting: fontSetting,
    };
    it("override default FontSetting by setting it at Document", () => {
      expect(
        normalize({ ...document, defaultFontSettings: fontSetting })
      ).toEqual(expectedDocument);
    });
    it("passed down fontSetting to pageBreakRow", () => {
      expect(
        normalize({
          ...document,
          defaultFontSettings: fontSetting,
          pageBreakRows: pageBreakRows,
        })
      ).toEqual({
        ...expectedDocument,
        pageBreakRows: createNormalizedPageBreakRows(fontSetting),
      });
    });
    it("overridden by timestampPageNumber", () => {
      expect(
        normalize({
          ...document,
          defaultFontSettings: fontSetting,
          timestampPageNumberFontSetting,
        })
      ).toEqual({ ...expectedDocument, timestampPageNumberFontSetting });
    });
  });

  describe("with simple document", () => {
    it("convertes simple document with only tables into normalized document", () => {
      const simpleDoc: SimpleDocument = {
        tables: documentSections[0].tables,
      };

      const result = normalize(simpleDoc);

      expect(result).toEqual({
        headers: { rows: [] },
        footers: { rows: [] },
        sections: [
          {
            headers: { rows: [] },
            tables: [
              {
                headers: [createNormalizedRow("table header")],
                rows: [createNormalizedRow("row")],
                columns: defaultNormalizedColumnSetting,
              },
            ],
          },
        ],
        timestampPageNumberFontSetting: defaultNormalizedFontSetting,
      });
    });
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
      columns: Array(2).fill({ width: "1 fr" }),
    };
    const normalizedPageBreakRows: NormalizedPageBreakRows = {
      rows: [
        {
          data: [
            { value: "column 1", columnSpan: 1, horizontalAlign: "center" },
            { value: "column 2", columnSpan: 1, horizontalAlign: "center" },
          ],
          options: {
            border: true,
          },
        },
      ],
      columns: Array(2).fill({
        width: { value: 1, unit: "fr" },
        align: "center",
      }) as NormalizedColumnSetting[],
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
      const defaultColumnSetting = Array(3).fill({
        width: "1fr",
        align: "center",
      });
      expect(parseColumnSetting(rows, columnSetting)).toEqual(
        defaultColumnSetting
      );
    });
  });
  it("return filled column setting when only alignment was set", () => {
    const columnSetting: ColumnSetting[] = Array(3).fill({ align: "left" });
    expect(parseColumnSetting(rows, columnSetting)).toEqual(
      Array(3).fill({ width: "1fr", align: "left" })
    );
  });
  it("return filled column setting when only width was set", () => {
    const columnSetting: ColumnSetting[] = Array(3).fill({ width: "2fr" });
    expect(parseColumnSetting(rows, columnSetting)).toEqual(
      Array(3).fill({ width: "2fr", align: "center" })
    );
  });
  it("return column setting that was set as string", () => {
    const columnSetting: ColumnSetting[] = Array(3).fill({ width: "1 fr" });
    expect(parseColumnSetting(rows, columnSetting)).toEqual(
      Array(3).fill({ width: "1 fr", align: "center" })
    );
  });
});
describe("normalizeFontSetting", () => {
  it("return default fontSettings", () => {
    expect(normalizeFontSetting(undefined)).toEqual(
      defaultNormalizedFontSetting
    );
  });
  it("overrides default fontSettings", () => {
    const fontSetting = {
      fontFace: "Times-New-Romans",
      bold: true,
      boldFace: "Times-Bold",
    };
    expect(normalizeFontSetting(fontSetting)).toEqual(fontSetting);
  });
});

describe("normalizeSetting", () => {
  const table: Table = {
    rows: [{ data: ["hello"] }],
  };
  const fontSetting: FontSetting = {
    fontFace: "Times-News",
  };
  it("return setting default font if component style is empty", () => {
    expect(normalizeSetting(table, fontSetting)).toEqual({
      ...table,
      style: { ...fontSetting },
    });
  });
  it("return setting default font along with component style", () => {
    const tableWithStyle: Table = {
      ...table,
      style: {
        border: true,
        bold: true,
      },
    };
    expect(normalizeSetting(tableWithStyle, fontSetting)).toEqual({
      ...tableWithStyle,
      style: { ...fontSetting, ...tableWithStyle.style },
    });
  });
  it("return setting default font overridden by component style", () => {
    const tableWithStyle: Table = {
      ...table,
      style: {
        bold: true,
        fontFace: "Arial",
      },
    };
    expect(normalizeSetting(tableWithStyle, fontSetting)).toEqual(
      tableWithStyle
    );
  });
});

describe("normalizeWatermark", () => {
  it("return empty if no watermark found", () => {
    expect(normalizeWatermark(undefined, defaultNormalizedFontSetting)).toEqual(
      undefined
    );
  });
  it("passed fontSetting to watermark", () => {
    const watermark = { text: "hello" };
    const { fontFace } = defaultNormalizedFontSetting;
    expect(normalizeWatermark(watermark, defaultNormalizedFontSetting)).toEqual(
      { ...watermark, fontFace }
    );
  });
  it("override fontSetting", () => {
    const watermark = { text: "hello", fontFace: "Times" };
    expect(normalizeWatermark(watermark, defaultNormalizedFontSetting)).toEqual(
      watermark
    );
  });
});
