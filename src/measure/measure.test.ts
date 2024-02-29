import { Cell, Table, TextCell, Watermark } from "../types";
import PDFDocument from "pdfkit";
import {
  measureCellHeights,
  getCellHeightWithText,
  getRowHeight,
  lineGap,
  margin,
  measure,
  calculateCellLeftCoords,
  getCellHeight,
  getColumnWidthsForRow,
  getPageDimensions,
} from ".";
import { Image } from "../types";
import {
  defaultBoldFace,
  defaultFontFace,
  normalizeHeaderFooter,
  normalizeTable,
} from "../normalize";
import { calculateColumnWidths } from "../paginate/calculateColumnWidths";
import {
  NormalizedRow,
  NormalizedPageBreakRows,
  NormalizedColumnSetting,
  NormalizedDocument,
  NormalizedCell,
} from "../normalize/types";
import { MeasuredDocument, MeasuredWatermark } from "./types";
import { rs } from "../rs/index";

describe("measuring functions", () => {
  describe("getRowHeight", () => {
    let doc;
    beforeEach(() => {
      doc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
    });

    it("returns the min height as font size plus half lineGap and max height as height of largest string plus half lineGap", () => {
      const longString =
        "this is a really really really really really really long column string";

      const data = [
        { value: "hello", columnSpan: 1 },
        { value: longString, columnSpan: 1 },
        { value: "world", columnSpan: 1 },
        { value: "d", columnSpan: 1 },
        { value: "e", columnSpan: 1 },
        { value: "test", columnSpan: 1 },
        { value: "hello world", columnSpan: 1 },
      ];

      const fontSize = 8;

      const row: NormalizedRow = {
        data,
        options: { fontSize },
      };
      const columnWidth = new Array(7).fill(756 / 7);
      const result = getRowHeight(row, doc, columnWidth);

      const expectedHeight =
        doc.heightOfString(longString, {
          width: 756 / 7,
          lineGap,
          align: "center",
        }) +
        lineGap * 0.5;

      expect(result).toEqual({
        maxHeight: expectedHeight,
        minHeight: expectedHeight,
      });
    });

    it("includes height of image", () => {
      const data: Cell[] = [
        { value: "hello", columnSpan: 1 },
        { value: "world", columnSpan: 1 },
      ];

      const fontSize = 8;

      const image = { height: 100 } as Image;
      const row: NormalizedRow = {
        image,
        data,
        options: { fontSize },
      };
      const columnWidth = new Array(2).fill(756 / 2);
      const result = getRowHeight(row, doc, columnWidth);

      const expected =
        doc.heightOfString("hello", {
          width: 756 / 7,
          lineGap,
          align: "center",
        }) +
        lineGap * 0.5 +
        image.height;

      expect(result).toEqual({
        minHeight: expected,
        maxHeight: expected,
      });
    });

    it("sets maxHeight to undefined with an expandable chart (undefined maxHeight)", () => {
      const data: Cell[] = [
        { value: "hello", columnSpan: 1 },
        { value: "world", columnSpan: 1 },
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
            minHeight: 200,
          },
        },
      ];

      const fontSize = 8;

      const row: NormalizedRow = {
        data,
        options: { fontSize },
      };

      const columnWidth = new Array(2).fill(756 / 2);
      const result = getRowHeight(row, doc, columnWidth);

      expect(result).toEqual({
        minHeight: 200 + lineGap * 2,
        maxHeight: undefined,
      });
    });
  });

  describe("getCellHeightWithText", () => {
    let doc;

    beforeEach(() => {
      doc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
    });

    it("returns the height of each column", () => {
      const longString =
        "this is a really really really really really really long column string";

      const data = [
        { value: "hello", columnSpan: 1 },
        { value: longString, columnSpan: 1 },
        { value: "world", columnSpan: 1 },
        { value: "d", columnSpan: 1 },
        { value: "e", columnSpan: 1 },
        { value: "test", columnSpan: 1 },
        { value: "hello world", columnSpan: 1 },
      ];

      const fontSize = 8;

      const row = {
        data,
        options: { fontSize },
      };
      const columnWidth = new Array(7).fill(756 / 7);
      const result = measureCellHeights(row, doc, columnWidth);

      const expected = data.map((d, idx) =>
        getCellHeightWithText(row, idx, doc, d.value, columnWidth)
      );

      expect(result).toEqual(expected);
    });
  });

  describe("getCellHeight", () => {
    let doc;
    beforeEach(() => {
      doc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
    });

    it("uses image height if defined", () => {
      const cell = { image: { height: 40, width: 40 }, lineGap: 1 } as Cell;
      const result = getCellHeight(cell, 100, doc).maxHeight;

      expect(result).toBe(40 + lineGap + 1);
    });
    it("get text template cell Height ", () => {
      const cell: NormalizedCell = {
        template: rs`Page {{documentPageNumber}} of {{documentPageCount}}`,
        columnSpan: 1,
        fontSize: 10,
      };
      const options = {
        width: 50,
        lineGap,
        align: cell.horizontalAlign,
        height: 10,
      };
      const result = getCellHeight(cell, 50, doc);

      const highBound =
        doc.heightOfString("Page 1000 of 1000", options) + lineGap * 0.5;
      expect(result).toStrictEqual({
        minHeight: highBound,
        maxHeight: highBound,
      });
    });
    it("throws for undefined cell", () => {
      expect(() => getCellHeight(undefined, 100, doc)).toThrow(
        "Cell is undefined"
      );
    });

    it("returns height of single line of text when noWrap true", () => {
      const longString =
        "this is a really really really really really really long column string";
      const cell = {
        value: longString,
        noWrap: true,
        columnSpan: 1,
        fontSize: 10,
      } as TextCell;
      const result = getCellHeight(cell, 20, doc).maxHeight;

      const expected =
        doc.heightOfString("X", {
          width: 20,
          lineGap,
          align: cell.horizontalAlign,
          height: 10,
        }) +
        lineGap * 0.5;

      expect(result).toBe(expected);
    });
    it("returns height of single line of text", () => {
      const string = "this";
      const cell = {
        value: string,
        columnSpan: 1,
        fontSize: 10,
      } as TextCell;
      const result = getCellHeight(cell, 20, doc).maxHeight;

      const expected =
        doc.heightOfString("X", {
          width: 20,
          lineGap,
          align: cell.horizontalAlign,
          height: 10,
        }) +
        lineGap * 0.5;

      expect(result).toBe(expected);
    });
  });

  describe("calculateCellLeftCoords", () => {
    it("measures column starts with no setting", () => {
      const columnWidths = [100, 200, 300];
      expect(calculateCellLeftCoords(columnWidths)).toEqual([
        margin,
        margin + 100,
        margin + 100 + 200,
      ]);
    });
  });

  describe("getColumnWidthsForRow", () => {
    it(" does not adjust when widths has no cell span", () => {
      const widths = [100, 100, 100];
      const row: NormalizedRow = {
        data: [
          {
            columnSpan: 1,
            value: "column 1",
          },
          {
            columnSpan: 1,
            value: "column 2",
          },
          {
            columnSpan: 1,
            value: "column 3",
          },
        ],
      };
      expect(getColumnWidthsForRow(widths, row)).toEqual([100, 100, 100]);
    });
    it("adjust when widths has cell span", () => {
      const widths = [100, 100, 100];
      const row: NormalizedRow = {
        data: [
          {
            columnSpan: 2,
            value: "column 1",
          },
          {
            columnSpan: 1,
            value: "column 2",
          },
        ],
      };
      expect(getColumnWidthsForRow(widths, row)).toEqual([200, 100]);
    });
  });
  describe("getPageDimensions", () => {
    it("return default landscape dimensions", () => {
      expect(getPageDimensions()).toEqual({
        pageHeight: 612,
        pageWidth: 792,
        availableWidth: 756,
        pageInnerHeight: 576,
      });
    });
    it("return landscape dimensions", () => {
      expect(getPageDimensions("landscape")).toEqual({
        pageHeight: 612,
        pageWidth: 792,
        availableWidth: 756,
        pageInnerHeight: 576,
      });
    });
    it("return portrait dimensions", () => {
      expect(getPageDimensions("portrait")).toEqual({
        pageWidth: 612,
        pageHeight: 792,
        pageInnerHeight: 756,
        availableWidth: 576,
      });
    });
  });
  describe("measure", () => {
    let doc;
    const defaultNormalizedFontSetting = {
      fontFace: defaultFontFace,
      boldFace: defaultBoldFace,
    };
    beforeEach(() => {
      doc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });

      measuredSimpleSingleTableDocument = {
        layout: "landscape",
        headers: [],
        footers: [],
        sections: [
          {
            headers: [],
            index: 0,
            tables: [
              {
                headers: [],
                rows: normalizedSimpleSingleTableDocument.sections[0].tables[0].rows.map(
                  (r) => ({
                    data: r.data,
                    options: r.options,
                    ...getRowHeight(r, doc, tableColumnWidths),
                    columnHeights: measureCellHeights(
                      r,
                      doc,
                      tableColumnWidths
                    ),
                    columnWidths: tableColumnWidths,
                    columnStarts: calculateCellLeftCoords(tableColumnWidths),
                  })
                ),
                measureTextHeight: expect.any(Function),
                columns:
                  normalizedSimpleSingleTableDocument.sections[0].tables[0]
                    .columns,
              },
            ],
          },
        ],
      };
    });

    it("returns measured document", () => {
      const headers = normalizeHeaderFooter(
        {
          rows: [
            {
              data: [{ value: "A Report" }],
              options: { fontSize: 11 },
            },
          ],
        },
        defaultNormalizedFontSetting
      );

      const tables = [
        {
          headers: [
            {
              data: [{ value: "A Table", columnSpan: 3 }],
              options: { fontSize: 10 },
            },
            {
              data: [{ value: "One" }, { value: "Two" }, { value: "Three" }],
              options: { fontSize: 9.5 },
            },
          ],
          rows: [
            {
              data: [{ value: "a" }, { value: "b" }, { value: "c" }],
              options: { fontSize: 8 },
            },
            {
              data: [{ value: "d" }, { value: "e" }, { value: "f" }],
              options: { fontSize: 8 },
            },
            {
              data: [{ value: "g" }, { value: "h" }, { value: "i" }],
              options: { fontSize: 8 },
            },
          ],
        } as Table,
      ];

      const sections = [
        {
          headers: normalizeHeaderFooter(
            {
              rows: [
                { data: [{ value: "A Section" }], options: { fontSize: 10 } },
              ],
            },
            defaultNormalizedFontSetting
          ),
          tables: [normalizeTable(tables[0], defaultNormalizedFontSetting)],
        },
      ];

      const footers = normalizeHeaderFooter(
        {
          rows: [
            {
              data: [{ value: "05/01/2022" }],
              options: { fontSize: 6 },
            },
          ],
        },
        defaultNormalizedFontSetting
      );

      const table = normalizeTable(tables[0], defaultNormalizedFontSetting);

      const document = { headers, sections, footers };
      const result = measure(document, doc);
      const docHeaderColumnWidths = calculateColumnWidths(headers.columns, 756);
      const sectionHeaderColumnWidths = calculateColumnWidths(
        sections[0].headers.columns,
        756
      );
      const tableColumnWidths = calculateColumnWidths(table.columns, 756);
      const docFooterColumnWidths = calculateColumnWidths(footers.columns, 756);
      expect(result).toEqual({
        layout: "landscape",
        headers: [
          {
            options: headers.rows[0].options,
            ...getRowHeight(headers.rows[0], doc, docHeaderColumnWidths),
            columnHeights: measureCellHeights(
              headers.rows[0],
              doc,
              docHeaderColumnWidths
            ),
            data: headers.rows[0].data,
            columnWidths: docHeaderColumnWidths,
            columnStarts: calculateCellLeftCoords(docHeaderColumnWidths),
          },
        ],
        sections: [
          {
            headers: [
              {
                options: sections[0].headers.rows[0].options,
                ...getRowHeight(
                  sections[0].headers.rows[0],
                  doc,
                  sectionHeaderColumnWidths
                ),
                columnWidths: sectionHeaderColumnWidths,
                columnStarts: calculateCellLeftCoords(
                  sectionHeaderColumnWidths
                ),
                columnHeights: measureCellHeights(
                  sections[0].headers.rows[0],
                  doc,
                  sectionHeaderColumnWidths
                ),
                data: sections[0].headers.rows[0].data,
              },
            ],
            index: 0,
            tables: [
              {
                headers: [
                  {
                    options: sections[0].tables[0].headers[0].options,
                    ...getRowHeight(table.headers[0], doc, [756]),
                    columnWidths: [756],
                    columnStarts: calculateCellLeftCoords([756]),
                    columnHeights: measureCellHeights(
                      document.sections[0].tables[0].headers[0],
                      doc,
                      [756]
                    ),
                    data: sections[0].tables[0].headers[0].data,
                  },
                  {
                    options: sections[0].tables[0].headers[1].options,
                    ...getRowHeight(table.headers[1], doc, tableColumnWidths),
                    columnWidths: tableColumnWidths,
                    columnStarts: calculateCellLeftCoords(tableColumnWidths),
                    columnHeights: measureCellHeights(
                      table.headers[1],
                      doc,
                      tableColumnWidths
                    ),
                    data: sections[0].tables[0].headers[1].data,
                  },
                ],
                rows: table.rows.map((r) => ({
                  data: r.data,
                  options: r.options,
                  ...getRowHeight(r, doc, tableColumnWidths),
                  columnHeights: measureCellHeights(r, doc, tableColumnWidths),
                  columnWidths: tableColumnWidths,
                  columnStarts: calculateCellLeftCoords(tableColumnWidths),
                })),
                measureTextHeight: expect.any(Function),
                columns: table.columns,
              },
            ],
          },
        ],
        footers: [
          {
            options: footers.rows[0].options,
            data: footers.rows[0].data,
            ...getRowHeight(footers.rows[0], doc, docFooterColumnWidths),
            columnHeights: measureCellHeights(
              footers.rows[0],
              doc,
              docFooterColumnWidths
            ),
            columnWidths: docFooterColumnWidths,
            columnStarts: calculateCellLeftCoords(docFooterColumnWidths),
          },
        ],
      });
    });
    it("return document without footer/headers", () => {
      const tables = [
        {
          headers: [
            {
              data: [{ value: "A Table", columnSpan: 3 }],
              options: { fontSize: 10 },
            },
            {
              data: [{ value: "One" }, { value: "Two" }, { value: "Three" }],
              options: { fontSize: 9.5 },
            },
          ],
          rows: [
            {
              data: [{ value: "a" }, { value: "b" }, { value: "c" }],
              options: { fontSize: 8 },
            },
            {
              data: [{ value: "d" }, { value: "e" }, { value: "f" }],
              options: { fontSize: 8 },
            },
            {
              data: [{ value: "g" }, { value: "h" }, { value: "i" }],
              options: { fontSize: 8 },
            },
          ],
        } as Table,
      ];

      const sections = [
        {
          headers: normalizeHeaderFooter(
            {
              rows: [
                { data: [{ value: "A Section" }], options: { fontSize: 10 } },
              ],
            },
            defaultNormalizedFontSetting
          ),
          tables: [normalizeTable(tables[0], defaultNormalizedFontSetting)],
        },
      ];

      const table = normalizeTable(tables[0], defaultNormalizedFontSetting);

      const document = { sections };
      const result = measure(document, doc);
      const sectionHeaderColumnWidths = calculateColumnWidths(
        sections[0].headers.columns,
        756
      );
      const tableColumnWidths = calculateColumnWidths(table.columns, 756);
      expect(result).toEqual({
        ...measuredSimpleSingleTableDocument,
        sections: [
          {
            headers: [
              {
                options: sections[0].headers.rows[0].options,
                ...getRowHeight(
                  sections[0].headers.rows[0],
                  doc,
                  sectionHeaderColumnWidths
                ),
                columnWidths: sectionHeaderColumnWidths,
                columnStarts: calculateCellLeftCoords(
                  sectionHeaderColumnWidths
                ),
                columnHeights: measureCellHeights(
                  sections[0].headers.rows[0],
                  doc,
                  sectionHeaderColumnWidths
                ),
                data: sections[0].headers.rows[0].data,
              },
            ],
            index: 0,
            tables: [
              {
                headers: [
                  {
                    options: sections[0].tables[0].headers[0].options,
                    ...getRowHeight(table.headers[0], doc, [756]),
                    columnWidths: [756],
                    columnStarts: calculateCellLeftCoords([756]),
                    columnHeights: measureCellHeights(
                      document.sections[0].tables[0].headers[0],
                      doc,
                      [756]
                    ),
                    data: sections[0].tables[0].headers[0].data,
                  },
                  {
                    options: sections[0].tables[0].headers[1].options,
                    ...getRowHeight(table.headers[1], doc, tableColumnWidths),
                    columnWidths: tableColumnWidths,
                    columnStarts: calculateCellLeftCoords(tableColumnWidths),
                    columnHeights: measureCellHeights(
                      table.headers[1],
                      doc,
                      tableColumnWidths
                    ),
                    data: sections[0].tables[0].headers[1].data,
                  },
                ],
                rows: table.rows.map((r) => ({
                  data: r.data,
                  options: r.options,
                  ...getRowHeight(r, doc, tableColumnWidths),
                  columnHeights: measureCellHeights(r, doc, tableColumnWidths),
                  columnWidths: tableColumnWidths,
                  columnStarts: calculateCellLeftCoords(tableColumnWidths),
                })),
                measureTextHeight: expect.any(Function),
                columns: table.columns,
              },
            ],
          },
        ],
      });
    });
    it("return document with pageBreakRow", () => {
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
      const normalizedDocument: NormalizedDocument = {
        ...normalizedSimpleSingleTableDocument,
        pageBreakRows: normalizedPageBreakRows,
      };

      const pageBreakColumnWidths = calculateColumnWidths(
        normalizedDocument.pageBreakRows.columns,
        756
      );
      const expected: MeasuredDocument = {
        ...measuredSimpleSingleTableDocument,
        pageBreakRows: normalizedDocument.pageBreakRows.rows.map((r) => ({
          data: r.data,
          options: r.options,
          ...getRowHeight(r, doc, pageBreakColumnWidths),
          columnHeights: measureCellHeights(r, doc, pageBreakColumnWidths),
          columnWidths: pageBreakColumnWidths,
          columnStarts: calculateCellLeftCoords(pageBreakColumnWidths),
        })),
      };
      const result = measure(normalizedDocument, doc);
      expect(result).toEqual(expected);
    });
    it("returns document with watermark", () => {
      const watermark: Watermark = {
        text: "waterMark",
        color: "black",
        fontFace: "Helvetica",
      };
      const expectedWatermark: MeasuredWatermark = {
        ...watermark,
        fontSize: 108,
        x: margin,
        y: 252,
        origin: [396, 306],
      };
      const normalizedDocument: NormalizedDocument = {
        ...normalizedSimpleSingleTableDocument,

        watermark: watermark,
      };

      const expected: MeasuredDocument = {
        ...measuredSimpleSingleTableDocument,
        watermark: expectedWatermark,
      };
      const result = measure(normalizedDocument, doc);
      expect(result).toEqual(expected);
    });
    it("return document with section watermark", () => {
      const watermark: Watermark = {
        text: "waterMark",
        color: "black",
        fontFace: "Helvetica",
      };
      const exepctedWatermark: MeasuredWatermark = {
        ...watermark,
        fontSize: 108,
        x: margin,
        y: 252,
        origin: [396, 306],
      };
      const normalizedSection = {
        ...normalizedSimpleSingleTableDocument.sections[0],
        watermark: watermark,
      };
      const measuredSection = {
        ...measuredSimpleSingleTableDocument.sections[0],
        watermark: exepctedWatermark,
      };

      const normalizedDocument: NormalizedDocument = {
        ...normalizedSimpleSingleTableDocument,
        sections: [normalizedSection],
      };

      const expected: MeasuredDocument = {
        ...measuredSimpleSingleTableDocument,
        sections: [measuredSection],
      };
      const result = measure(normalizedDocument, doc);
      expect(result).toEqual(expected);
    });
  });
});
const normalizedSimpleSingleTableDocument: NormalizedDocument = {
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
              data: [
                { value: "row", columnSpan: 1, horizontalAlign: "center" },
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
          ],
        },
      ],
    },
  ],
};

const tableColumnWidths = calculateColumnWidths(
  normalizedSimpleSingleTableDocument.sections[0].tables[0].columns,
  756
);

let measuredSimpleSingleTableDocument: MeasuredDocument;
