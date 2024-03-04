import {
  RowOptions,
  Row,
  HeaderFooters,
  TextTemplateCell,
  Document,
} from "../types";
import {
  normalizeDocPageNumTimestamp,
  normalizeDocumentFooter,
  normalizeHeaders,
} from "./normalizeHeaderAndFooter";
import {
  defaultNormalizedFontSetting,
  defaultNormalizedCellOptions,
  defaultNormalizedRowOptions,
  defaultNormalizedColumnSetting,
  mockVariables,
} from "./testDefaultVariables";

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
