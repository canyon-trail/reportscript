import {
  Cell,
  Document,
  PageBreakRows,
  FontSetting,
  SimpleDocument,
  TextTemplateCell,
} from "../types";
import {
  normalize,
  normalizePageBreakRows,
  normalizeFontSetting,
  normalizeWatermark,
} from ".";
import {
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedHeaderFooter,
  NormalizedPageBreakRows,
  NormalizedRow,
  NormalizedSection,
} from "./types";
import {
  defaultNormalizedFontSetting,
  defaultNormalizedCellOptions,
  defaultNormalizedRowOptions,
  defaultNormalizedColumnSettings,
  emptyNormalizedDocument,
  mockVariables,
} from "./testDefaultVariables";

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
