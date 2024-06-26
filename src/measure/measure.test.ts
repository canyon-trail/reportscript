import { Table, Watermark } from "../types";
import PDFDocument from "pdfkit";
import { margin, measure, getPageDimensions } from ".";
import {
  calculateCellLeftCoords,
  measureCellHeights,
  getRowHeight,
} from "./measuredRowsAndCells";
import { calculateColumnWidths } from "../paginate/calculateColumnWidths";
import {
  NormalizedPageBreakRows,
  NormalizedColumnSetting,
  NormalizedDocument,
} from "../normalize/types";
import { MeasuredDocument, MeasuredWatermark } from "./types";
import { defaultBoldFace, defaultFontFace } from "../normalize/";
import { normalizeHeaders } from "../normalize/normalizeHeaderAndFooter";
import { normalizeTable } from "../normalize/normalizeSection";

describe("measuring functions", () => {
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
      const headers = normalizeHeaders(
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
          headers: normalizeHeaders(
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

      const footers = normalizeHeaders(
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
          headers: normalizeHeaders(
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
