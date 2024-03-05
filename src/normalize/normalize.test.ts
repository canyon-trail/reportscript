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
  TextTemplateCell,
} from "../types";
import {
  computeCellAlignments,
  normalizeAlignment,
  normalize,
  normalizeRow,
  normalizeSection,
  normalizeTable,
  normalizeHeaders,
  parseWidth,
  parseColumnSetting,
  validateCellSpan,
  normalizePageBreakRows,
  defaultFontFace,
  defaultBoldFace,
  normalizeFontSetting,
  normalizeWatermark,
  normalizeDocPageNumTimestamp,
  normalizeDocumentFooter,
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
const defaultNormalizedRowOptions = {
  ...defaultNormalizedFontSetting,
  border: false,
};
const defaultCellAlignmentWidthOptions = {
  horizontalAlign: "center" as HorizontalAlignment,
  columnSpan: 1,
};
const defaultNormalizedCellOptions = {
  ...defaultNormalizedFontSetting,
  ...defaultCellAlignmentWidthOptions,
};
const defaultNormalizedColumnSetting: NormalizedColumnSetting = {
  width: { value: 1, unit: "fr" },
  align: "center",
};
const defaultNormalizedColumnSettings: NormalizedColumnSetting[] = [
  defaultNormalizedColumnSetting,
];
export const mockVariables = {
  documentPageNumber: 1,
  documentPageCount: 3,
  sectionPageNumber: 1,
  sectionPageCount: 1,
  timestamp: "10:00:00",
};
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
describe("normalizeHeaders", () => {
  const headerStyle: RowOptions = {
    fontSize: 9,
    color: "white",
  };

  const rows: Row[] = [{ data: ["first column", "second column"] }];

  it("header/footer with header get default settings", () => {
    const header: HeaderFooters = {
      rows: rows,
    };
    expect(normalizeHeaders(header, defaultNormalizedFontSetting)).toEqual({
      rows: [
        {
          data: [
            { ...defaultNormalizedCellOptions, value: "first column" },
            { ...defaultNormalizedCellOptions, value: "second column" },
          ],
          options: defaultNormalizedRowOptions,
        },
      ],
      columns: [defaultNormalizedColumnSetting, defaultNormalizedColumnSetting],
    });
  });
  it("passes down settings to cells", () => {
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
    expect(normalizeHeaders(header, defaultNormalizedFontSetting)).toEqual({
      rows: [
        {
          data: [
            {
              ...defaultNormalizedCellOptions,
              value: "first column",
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
            },
            {
              ...defaultNormalizedCellOptions,
              value: "second column",
              horizontalAlign: "right",
              fontSize: 9,
              color: "white",
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
  it("returns empty header/footer with empty row if undefined", () => {
    expect(normalizeHeaders(undefined, defaultNormalizedFontSetting)).toEqual({
      rows: [],
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
      ...defaultNormalizedRowOptions,
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
          options: { ...defaultNormalizedRowOptions, ...fontSetting },
        },
      ],
      columns: [
        defaultNormalizedColumnSettings[0],
        defaultNormalizedColumnSettings[0],
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
    columns: defaultNormalizedColumnSettings,
  };
  const normalizedDocumentSections: NormalizedSection[] = [
    {
      headers: {
        rows: [createNormalizedRow("section header")],
        columns: defaultNormalizedColumnSettings,
      },
      tables: [
        {
          headers: [createNormalizedRow("table header")],
          rows: [createNormalizedRow("row")],
          columns: defaultNormalizedColumnSettings,
        },
      ],
    },
  ];
  const normalizedDocumentFooters: NormalizedHeaderFooter = {
    rows: [createNormalizedRow("document footer")],
    columns: defaultNormalizedColumnSettings,
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
    expect(normalize({ ...document, layout: "landscape" })).toEqual({
      ...normalizedDocument,
      layout: "landscape",
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
    };
    expect(normalize(document)).toEqual(expected);
  });

  it("normalize with pageNumber and timestamp without footer", () => {
    const document: Document = {
      sections: documentSections,
      pageNumbers: true,
      timestamp: true,
    };
    const normalizedDocument: NormalizedDocument = normalize(document);
    const normalizedTemplateCell = normalizedDocument.footers.rows[0]
      .data[0] as TextTemplateCell;

    expect(
      normalizedTemplateCell.template.renderTemplate(mockVariables)
    ).toEqual("10:00:00 Page 1 of 3");
  });
  it("normalize with pageNumber and timestamp with footer", () => {
    const document: Document = {
      sections: documentSections,
      footers: documentFooters,
      pageNumbers: true,
      timestamp: true,
    };

    expect(() => normalize(document)).toThrowError(
      "Cannot set footer, and pageNumber || timestamp || sectionPageNumber at the same time. Please use TextTemplateCell to set pageNumber || timestamp || sectionPageNumber"
    );
  });
  describe("fonts setting", () => {
    const fontSetting = {
      fontFace: "Arial",
      boldFace: "Arial-Bold",
      bold: true,
    };
    const normalizedDocumentHeader: NormalizedHeaderFooter = {
      rows: [createNormalizedRow("document header", fontSetting)],
      columns: defaultNormalizedColumnSettings,
    };
    const normalizedDocumentSections: NormalizedSection[] = [
      {
        headers: {
          rows: [createNormalizedRow("section header", fontSetting)],
          columns: defaultNormalizedColumnSettings,
        },
        tables: [
          {
            headers: [createNormalizedRow("table header", fontSetting)],
            rows: [createNormalizedRow("row", fontSetting)],
            columns: defaultNormalizedColumnSettings,
          },
        ],
      },
    ];
    const normalizedDocumentFooters: NormalizedHeaderFooter = {
      rows: [createNormalizedRow("document footer", fontSetting)],
      columns: defaultNormalizedColumnSettings,
    };
    const expectedDocument: NormalizedDocument = {
      headers: normalizedDocumentHeader,
      sections: normalizedDocumentSections,
      footers: normalizedDocumentFooters,
      defaultFontSettings: fontSetting,
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
  });

  describe("with simple document", () => {
    it("converts simple document with only tables into normalized document", () => {
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
            tables: normalizedDocumentSections[0].tables,
          },
        ],
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
            { ...defaultNormalizedCellOptions, value: "column 1" },
            { ...defaultNormalizedCellOptions, value: "column 2" },
          ],
          options: { ...defaultNormalizedRowOptions, border: true },
        },
      ],
      columns: Array(2).fill({
        width: { value: 1, unit: "fr" },
        align: "center",
      }) as NormalizedColumnSetting[],
    };
    expect(
      normalizePageBreakRows(pageBreakRows, defaultNormalizedFontSetting)
    ).toEqual(normalizedPageBreakRows);
  });
  it("returns undefined if pageBreakRows is undefined", () => {
    expect(
      normalizePageBreakRows(undefined, defaultNormalizedFontSetting)
    ).toEqual(undefined);
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

describe("normalizeDocPageNumTimeStamp", () => {
  it("throws error if section and doc page numbers are enable", () => {
    expect(() =>
      normalizeDocPageNumTimestamp(true, true, undefined)
    ).toThrowError(
      "A document cannot have both pageNumbers and sectionPageNumbers set to true"
    );
  });
  it("return undefine if nothing is set", () => {
    expect(
      normalizeDocPageNumTimestamp(undefined, undefined, undefined)
    ).toEqual(undefined);
  });
  it("return template for section page number", () => {
    const result = normalizeDocPageNumTimestamp(
      true,
      undefined,
      undefined
    ).renderTemplate(mockVariables);
    expect(result).toBe("Page 1 of 1");
  });
  it("return template for document page number", () => {
    const result = normalizeDocPageNumTimestamp(
      undefined,
      true,
      undefined
    ).renderTemplate(mockVariables);
    expect(result).toBe("Page 1 of 3");
  });
  it("return template for document page number and timestamp", () => {
    const result = normalizeDocPageNumTimestamp(
      undefined,
      true,
      true
    ).renderTemplate(mockVariables);
    expect(result).toBe("10:00:00 Page 1 of 3");
  });
  it("return template for document section page number and timestamp", () => {
    const result = normalizeDocPageNumTimestamp(
      true,
      undefined,
      true
    ).renderTemplate(mockVariables);
    expect(result).toBe("10:00:00 Page 1 of 1");
  });
});
describe("normalizeDocumentFooter", () => {
  const rows: Row[] = [{ data: ["data"] }];
  let mockDocument;
  beforeEach(() => {
    mockDocument = {
      sections: [
        {
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
      ],
    } as Document;
  });

  it("return empty row if no footer and template", () => {
    expect(
      normalizeDocumentFooter(defaultNormalizedFontSetting, mockDocument)
    ).toEqual({
      rows: [],
    });
  });
  it("return footer with template including default settings and when no footer is set", () => {
    mockDocument.pageNumbers = true;
    const normalizedFooter = normalizeDocumentFooter(
      defaultNormalizedFontSetting,
      mockDocument
    );
    const { rows, columns } = normalizedFooter;
    const { template, ...rest } = rows[0].data[0] as TextTemplateCell;
    expect(columns[0]).toEqual({
      align: "right",
      width: { value: 1, unit: "fr" },
    });
    expect(rows[0].options).toEqual(defaultNormalizedRowOptions);
    expect(rest).toEqual({
      ...defaultNormalizedCellOptions,
      horizontalAlign: "right",
    });
    expect(template.renderTemplate(mockVariables)).toEqual("Page 1 of 3");
  });

  it("return footer with default settings", () => {
    mockDocument.footers = { rows: rows };
    expect(
      normalizeDocumentFooter(defaultNormalizedFontSetting, mockDocument)
    ).toEqual({
      rows: [
        {
          data: [
            {
              value: "data",
              ...defaultNormalizedCellOptions,
            },
          ],
          options: {
            ...defaultNormalizedRowOptions,
            border: false,
          },
        },
      ],
      columns: [defaultNormalizedColumnSetting],
    });
  });
  it("throw error if both footer and template are set", () => {
    mockDocument.footers = [{ rows: rows }];
    mockDocument.pageNumbers = true;
    expect(() =>
      normalizeDocumentFooter(defaultNormalizedFontSetting, mockDocument)
    ).toThrowError(
      "Cannot set footer, and pageNumber || timestamp || sectionPageNumber at the same time. Please use TextTemplateCell to set pageNumber || timestamp || sectionPageNumber"
    );
  });
});
