import {
  MeasuredDocument,
  MeasuredWatermark,
  MeasuredSection,
  MeasuredRow,
  MeasuredTable,
} from "../measure/types";
import {
  exampleDocumentFooterRow,
  getPageDimensions,
  margin,
} from "../measure/measuring";
import { Cell, TextCell } from "../types";
import {
  paginate,
  splitSection,
  SectionSplitResult,
  paginateSection,
  splitTable,
  TableSplitResult,
  addHeadersAndFooters,
  PaginatingDoc,
} from "./pagination";
import { continuedOn, splitColumn } from "./splitColumn";
import { PaginatedDocument } from "./types";

const measureTextHeight = () => 0;
const creationDate = new Date("July 20, 69 00:20:18 GMT+00:00");
type rowParam = {
  rowHeight: number;
  value: string;
};
type rowsParams = {
  rowHeight: number;
  length: number;
  value?: string;
};
type pageNumberTimestampRowParam = {
  footerHeight: number;
  pageNum?: number;
  creationDate?: Date;
};
const createRows = (params: rowsParams) => {
  const { rowHeight, length: length, value } = params;
  return [...Array(length).keys()].map((_, index) => {
    return {
      height: rowHeight,
      data: [{ value: `${value ?? ""}${index}` }],
      columnHeights: [],
      columnWidths: [],
      columnStarts: [],
    };
  });
};

const createRow = (params: rowParam) => {
  const { rowHeight, value } = params;
  return {
    height: rowHeight,
    data: [{ value: `${value}` }],
    columnHeights: [],
    columnWidths: [],
    columnStarts: [],
  };
};

const createPageNumberTimeStampRow = (param: pageNumberTimestampRowParam) => {
  const { footerHeight, pageNum, creationDate } = param;
  return [...Array(pageNum).keys()].map((_, index) => {
    const timeStampVal = creationDate
      ? `${
          `${creationDate.toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })}`.split(/ GMT/)[0]
        }`
      : "";
    const pageNumVal = pageNum ? ` Page ${index + 1} of ${pageNum}` : "";
    return {
      ...exampleDocumentFooterRow,
      height: footerHeight,
      data: [
        {
          value: `${timeStampVal}${pageNumVal}`,
          align: "right",
          columnSpan: 1,
        },
      ],
      columnHeights: [],
      columnWidths: [756],
      columnStarts: [18],
    };
  });
};
describe("pagination", () => {
  it("puts single section with single table onto one page", () => {
    const input = makeSingleSectionMeasuredDoc(
      Array(4).fill({ ...defaultTableGapRow, height: 10 })
    );

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: input.sections[0].tables[0].rows,
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("splits single table across pages", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 4;
    const rows = createRows({ rowHeight: rowHeight, length: 10 });
    const input = makeSingleSectionMeasuredDoc(rows);

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: rows.slice(0, 4),
        },
        {
          sectionIndex: 0,
          rows: rows.slice(4, 8),
        },
        {
          sectionIndex: 0,
          rows: rows.slice(8, 10),
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("handles portrait layout", () => {
    const { pageInnerHeight } = getPageDimensions("portrait");

    const rowHeight = pageInnerHeight / 4;
    const rows = createRows({ rowHeight: rowHeight, length: 10 });
    const input: MeasuredDocument = {
      ...makeSingleSectionMeasuredDoc(rows),
      layout: "portrait",
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      pages: [
        {
          sectionIndex: 0,
          rows: rows.slice(0, 4),
        },
        {
          sectionIndex: 0,
          rows: rows.slice(4, 8),
        },
        {
          sectionIndex: 0,
          rows: rows.slice(8, 10),
        },
      ],
      layout: "portrait",
    };

    expect(result).toEqual(expected);
  });

  it("adds spacing between tables on same page", () => {
    const firstTableRow = createRow({ rowHeight: 10, value: "row 0" });
    const secondTableRow = createRow({ rowHeight: 10, value: "row 1" });
    const input = {
      ...emptyMeasuredDoc,
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: [firstTableRow],
            },
            {
              ...emptyTable,
              rows: [secondTableRow],
            },
          ],
        },
      ],
    };

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [firstTableRow, defaultTableGapRow, secondTableRow],
        },
      ],
    };

    expect(paginate(input, creationDate)).toEqual(expected);
  });

  it("splits single section's tables evenly across two pages", () => {
    const { pageInnerHeight } = getPageDimensions();
    const rowHeight = pageInnerHeight / 4;
    const firstTableRows = createRows({ rowHeight: rowHeight, length: 4 });
    const secondTableRows = createRows({ rowHeight: rowHeight, length: 3 });
    const input = {
      ...emptyMeasuredDoc,
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: firstTableRows,
            },
            {
              ...emptyTable,
              rows: secondTableRows,
            },
          ],
        },
      ],
    };

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: firstTableRows,
        },
        {
          sectionIndex: 0,
          rows: secondTableRows,
        },
      ],
    };

    expect(paginate(input, creationDate)).toEqual(expected);
  });

  it("single section, first table fits, second table needs split", () => {
    const { pageInnerHeight } = getPageDimensions();
    const rowHeight = pageInnerHeight / 4;
    const firstTableRows = createRows({ rowHeight: rowHeight, length: 2 });
    const secondTableRows = createRows({ rowHeight: rowHeight, length: 4 });
    const input = {
      ...emptyMeasuredDoc,
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: firstTableRows,
            },
            {
              ...emptyTable,
              rows: secondTableRows,
            },
          ],
        },
      ],
    };

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [...firstTableRows, defaultTableGapRow, secondTableRows[0]],
        },
        {
          sectionIndex: 0,
          rows: secondTableRows.slice(1, 4),
        },
      ],
    };

    expect(paginate(input, creationDate)).toEqual(expected);
  });

  it("starts new section on new page", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 8;
    const firstSectionRows = createRows({
      rowHeight: rowHeight,
      length: 9,
      value: "Section 0 -",
    });
    const secondSectionRows = createRows({
      rowHeight: rowHeight,
      length: 2,
      value: "Section 1 -",
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: firstSectionRows,
            },
          ],
        },
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: secondSectionRows,
            },
          ],
        },
      ],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: firstSectionRows.slice(0, 8),
        },
        {
          sectionIndex: 0,
          rows: [firstSectionRows[8]],
        },
        {
          sectionIndex: 0,
          rows: secondSectionRows,
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("should split second table when section headers are present", () => {
    const { pageInnerHeight } = getPageDimensions();

    const sectionHeaderHeight = pageInnerHeight / 4;
    const rowHeight = margin - 2;
    const tableHeaderHeight = rowHeight * 3;

    const sectionHeader = createRow({
      rowHeight: sectionHeaderHeight,
      value: "section header",
    });
    const firstTableHeader = createRow({
      rowHeight: tableHeaderHeight,
      value: "table 0 header",
    });
    const firstTableRow = createRow({
      rowHeight: rowHeight * 11,
      value: "table 0 row",
    });

    const secondTableHeader = createRow({
      rowHeight: tableHeaderHeight,
      value: "table 1 header",
    });
    const secondTableRows = createRows({
      rowHeight: rowHeight,
      length: 12,
      value: "table 1 row ",
    });

    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      repeatSectionHeaders: true,
      sections: [
        {
          index: 0,
          headers: [sectionHeader],
          tables: [
            {
              headers: [firstTableHeader],
              rows: [firstTableRow],
              columns: [{ width: { value: 1, unit: "fr" } }],
              measureTextHeight,
            },
            {
              headers: [secondTableHeader],
              rows: secondTableRows,
              measureTextHeight,
              columns: [{ width: { value: 1, unit: "fr" } }],
            },
          ],
        },
      ],
    };

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            sectionHeader,
            defaultTableGapRow,
            firstTableHeader,
            firstTableRow,
            defaultTableGapRow,
            secondTableHeader,
            ...secondTableRows.slice(0, 7),
          ],
        },
        {
          sectionIndex: 0,
          rows: [
            sectionHeader,
            defaultTableGapRow,
            secondTableHeader,
            ...secondTableRows.slice(7, 12),
          ],
        },
      ],
    };

    const result = paginate(input, creationDate);
    expect(result).toEqual(expected);
  });

  it("does not repeat report header by default", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 3;
    const docHeaders = createRows({
      rowHeight: rowHeight / 2,
      length: 2,
      value: "report header ",
    });
    const rows = createRows({ rowHeight: rowHeight, length: 7, value: "row " });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      headers: docHeaders,
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: rows,
            },
          ],
        },
      ],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [...docHeaders, defaultTableGapRow, rows[0]],
        },
        {
          sectionIndex: 0,
          rows: rows.slice(1, 4),
        },
        {
          sectionIndex: 0,
          rows: rows.slice(4, 7),
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("accounts for report header in splitting sections", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 3;
    const docHeaders = createRows({
      rowHeight: rowHeight / 2,
      length: 2,
      value: "report header ",
    });
    const rows = createRows({ rowHeight: rowHeight, length: 3, value: "row " });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      repeatReportHeaders: true,
      headers: docHeaders,
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: rows,
            },
          ],
        },
      ],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [...docHeaders, defaultTableGapRow, rows[0]],
        },
        {
          sectionIndex: 0,
          rows: [...docHeaders, defaultTableGapRow, rows[1]],
        },
        {
          sectionIndex: 0,
          rows: [...docHeaders, defaultTableGapRow, rows[2]],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("accounts for report footer in splitting sections", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 3;
    const docFooters = createRow({
      rowHeight: rowHeight,
      value: "report footer",
    });
    const rows = createRows({ rowHeight: rowHeight, length: 2, value: "row " });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      footers: [docFooters],
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: rows,
            },
          ],
        },
      ],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            rows[0],
            { ...defaultTableGapRow, height: rowHeight },
            docFooters,
          ],
        },
        {
          sectionIndex: 0,
          rows: [
            rows[1],
            { ...defaultTableGapRow, height: rowHeight },
            docFooters,
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("adds page numbers", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 3;
    const docFooter = createRow({ rowHeight: rowHeight / 2, value: "footer" });
    const rows = createRows({ rowHeight: rowHeight, length: 2, value: "row " });
    const pageNumberRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight / 2,
      pageNum: 2,
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      layout: "landscape",
      footers: [docFooter],
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: rows,
            },
          ],
        },
      ],
      documentFooterHeight: rowHeight / 2,
      pageNumbers: true,
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            rows[0],
            { ...defaultTableGapRow, height: rowHeight },
            docFooter,
            pageNumberRow[0],
          ],
        },
        {
          sectionIndex: 0,
          rows: [
            rows[1],
            { ...defaultTableGapRow, height: rowHeight },
            docFooter,
            pageNumberRow[1],
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("adds timestamp", () => {
    jest.useFakeTimers().setSystemTime(creationDate);

    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 3;
    const row = createRow({ rowHeight: rowHeight, value: "row 0" });
    const timeStampRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,

      creationDate: creationDate,
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      layout: "landscape",
      footers: [],
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: [row],
            },
          ],
        },
      ],
      documentFooterHeight: rowHeight,
      timestamp: true,
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            row,
            { ...defaultTableGapRow, height: rowHeight },
            ...timeStampRow,
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("adds page numbers and timestamp", () => {
    jest.useFakeTimers().setSystemTime(creationDate);

    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 3;
    const rows = createRows({ rowHeight: rowHeight, length: 2, value: "row " });
    const timeStampPageNumRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,
      pageNum: 2,
      creationDate,
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      layout: "landscape",
      footers: [],
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: rows,
            },
          ],
        },
      ],
      documentFooterHeight: rowHeight,
      timestamp: true,
      pageNumbers: true,
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            rows[0],
            {
              ...defaultTableGapRow,
              height: rowHeight,
            },
            timeStampPageNumRow[0],
          ],
        },
        {
          sectionIndex: 0,
          rows: [
            rows[1],
            {
              ...defaultTableGapRow,
              height: rowHeight,
            },
            timeStampPageNumRow[1],
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });
  it("adds page numbers and timestamp with timeStampPageNumberFontSetting set", () => {
    jest.useFakeTimers().setSystemTime(creationDate);

    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 3;
    const rows = createRows({ rowHeight: rowHeight, length: 2, value: "row " });
    const timeStampPageNumRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,
      pageNum: 2,
      creationDate,
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      layout: "landscape",
      footers: [],
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: rows,
            },
          ],
        },
      ],
      documentFooterHeight: rowHeight,
      timestamp: true,
      pageNumbers: true,
      timeStampPageNumberFontSetting: { fontFace: "Times-Roman", fontSize: 8 },
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            rows[0],
            {
              ...defaultTableGapRow,
              height: rowHeight,
            },
            {
              ...timeStampPageNumRow[0],
              data: [
                {
                  ...timeStampPageNumRow[0].data[0],
                  fontFace: "Times-Roman",
                  fontSize: 8,
                } as Cell,
              ],
            },
          ],
        },
        {
          sectionIndex: 0,
          rows: [
            rows[1],
            {
              ...defaultTableGapRow,
              height: rowHeight,
            },
            {
              ...timeStampPageNumRow[1],
              data: [
                {
                  ...timeStampPageNumRow[1].data[0],
                  fontFace: "Times-Roman",
                  fontSize: 8,
                } as Cell,
              ],
            },
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });
  it("adds water mark", () => {
    jest.useFakeTimers().setSystemTime(creationDate);

    const { pageInnerHeight } = getPageDimensions();
    const watermark: MeasuredWatermark = {
      text: "waterMark",
      color: "black",
      fontFace: "Helvetica",
      fontSize: 108,
      x: margin,
      y: 252,
      origin: [396, 306],
    };
    const rowHeight = pageInnerHeight / 2;
    const rows = createRows({
      rowHeight: rowHeight * 1.5,
      length: 2,
      value: "row ",
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      layout: "landscape",
      footers: [],
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: rows,
            },
          ],
          watermark: watermark,
        },
      ],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [rows[0]],
          watermark: watermark,
        },
        {
          sectionIndex: 0,
          rows: [rows[1]],
          watermark: watermark,
        },
      ],
    };

    expect(result).toEqual(expected);
  });
  it("handle tableGap between tables and section headers", () => {
    jest.useFakeTimers().setSystemTime(creationDate);

    const rowHeight = 100;
    const firstTableRows = createRows({
      rowHeight: rowHeight,
      length: 2,
      value: "row ",
    });
    const secondTableRows = createRows({
      rowHeight: rowHeight,
      length: 2,
      value: "row ",
    });
    const sectionHeader = createRow({
      rowHeight: rowHeight,
      value: "table header",
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      layout: "landscape",
      footers: [],
      sections: [
        {
          ...emptySection,
          headers: [sectionHeader],
          tables: [
            {
              ...emptyTable,
              rows: firstTableRows,
            },
            {
              ...emptyTable,
              rows: secondTableRows,
            },
          ],
          tableGap: 10,
        },
      ],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            sectionHeader,
            { ...defaultTableGapRow, height: 10 },
            ...firstTableRows,
            { ...defaultTableGapRow, height: 10 },
            ...secondTableRows,
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });
  it("handle tableGap with on multiple pages while tableGap set at section", () => {
    jest.useFakeTimers().setSystemTime(creationDate);

    const rowHeight = 100;
    const firstTableRows = createRows({
      rowHeight: rowHeight,
      length: 6,
      value: "table 0 row ",
    });
    const secondTableRow = createRow({
      rowHeight: rowHeight,
      value: "table 1 row",
    });

    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      layout: "landscape",
      footers: [],
      sections: [
        {
          ...emptySection,
          tables: [
            {
              ...emptyTable,
              rows: firstTableRows,
            },
            {
              ...emptyTable,
              rows: [secondTableRow],
            },
          ],
          tableGap: 10,
        },
      ],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [...firstTableRows.slice(0, 5)],
        },
        {
          sectionIndex: 0,
          rows: [
            firstTableRows[5],
            { ...defaultTableGapRow, height: 10 },
            secondTableRow,
          ],
        },
      ],
    };
    expect(result).toEqual(expected);
  });
  // table gap on repeat section headers
  // TODO - eventually do orphan control
});

it("handles section page numbers", () => {
  jest.useFakeTimers().setSystemTime(creationDate);

  const { pageInnerHeight } = getPageDimensions();

  const rowHeight = pageInnerHeight / 3;

  const createSection = (index: number, rowCount: number) => ({
    ...emptySection,
    index,
    tables: [
      {
        ...emptyTable,
        rows: createRows({
          rowHeight: rowHeight,
          length: rowCount,
          value: "row ",
        }),
      },
    ],
  });
  const firstSectionPageNumberRow = createPageNumberTimeStampRow({
    footerHeight: rowHeight,
    pageNum: 3,
    creationDate,
  });
  const secondSectionPageNumberRow = createPageNumberTimeStampRow({
    footerHeight: rowHeight,
    pageNum: 2,
    creationDate,
  });
  const firstSection = createSection(0, 3);
  const secondSection = createSection(1, 2);
  const input: MeasuredDocument = {
    ...emptyMeasuredDoc,
    layout: "landscape",
    footers: [],
    sections: [firstSection, secondSection],
    documentFooterHeight: rowHeight,
    timestamp: true,
    sectionPageNumbers: true,
  };
  const result = paginate(input, creationDate);

  const expected: PaginatedDocument = {
    layout: "landscape",
    pages: [
      {
        sectionIndex: 0,
        rows: [
          firstSection.tables[0].rows[0],
          { ...defaultTableGapRow, height: rowHeight },
          firstSectionPageNumberRow[0],
        ],
      },
      {
        sectionIndex: 0,
        rows: [
          firstSection.tables[0].rows[1],
          { ...defaultTableGapRow, height: rowHeight },
          firstSectionPageNumberRow[1],
        ],
      },
      {
        sectionIndex: 0,
        rows: [
          firstSection.tables[0].rows[2],
          { ...defaultTableGapRow, height: rowHeight },
          firstSectionPageNumberRow[2],
        ],
      },
      {
        sectionIndex: 1,
        rows: [
          secondSection.tables[0].rows[0],
          { ...defaultTableGapRow, height: rowHeight },
          secondSectionPageNumberRow[0],
        ],
      },
      {
        sectionIndex: 1,
        rows: [
          secondSection.tables[0].rows[1],
          { ...defaultTableGapRow, height: rowHeight },
          secondSectionPageNumberRow[1],
        ],
      },
    ],
  };

  expect(result).toEqual(expected);
});

it("throws if both pageNumbers and sectionPageNumbers true", () => {
  const doc = { pageNumbers: true, sectionPageNumbers: true } as PaginatingDoc;
  expect(() => addHeadersAndFooters(doc, creationDate)).toThrowError(
    "A document cannot have both pageNumbers and sectionPageNumbers set to true"
  );
});

describe("pagination - splitSection(...)", () => {
  it("single table spans > 1 page", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 4;
    const rows = createRows({ rowHeight: rowHeight, length: 10 });
    const input: MeasuredSection = {
      index: 0,
      headers: [
        {
          height: 0,
          data: [{ value: "i should not be copied later" }],
          columnHeights: [],
          columnWidths: [],
          columnStarts: [],
        },
      ],
      tables: [
        {
          ...emptyTable,
          rows: rows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...input.tables[0],
            rows: rows.slice(0, 4),
          },
        ],
      },
      rest: {
        ...emptySection,
        tables: [
          {
            ...input.tables[0],
            rows: rows.slice(4, 10),
          },
        ],
      },
    };

    expect(
      splitSection(input, pageInnerHeight + margin, emptyMeasuredDoc)
    ).toEqual(expected);
  });

  it("multiple tables, second needs split", () => {
    const { pageInnerHeight } = getPageDimensions();
    const rowHeight = pageInnerHeight / 4;
    const firstTableRows = createRows({ rowHeight: rowHeight, length: 2 });
    const secondTableRows = createRows({ rowHeight: rowHeight, length: 4 });
    const input = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: firstTableRows,
        },
        {
          ...emptyTable,
          rows: secondTableRows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: firstTableRows,
          },
          {
            ...emptyTable,
            rows: [secondTableRows[0]],
          },
        ],
      },
      rest: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: secondTableRows.slice(1, 4),
          },
        ],
      },
    };

    expect(splitSection(input, pageInnerHeight, emptyMeasuredDoc)).toEqual(
      expected
    );
  });

  it("does not split to create widow", () => {
    const pageHeight = 100;
    const headerHeight = 15;

    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [
            {
              ...defaultTableGapRow,
              height: pageHeight - margin - headerHeight - 1,
            },
          ],
        },
        {
          headers: [{ ...defaultTableGapRow, height: headerHeight }],
          rows: Array(4).fill({ ...defaultTableGapRow, height: 5 }),
          measureTextHeight,
          columns: [],
        },
      ],
    };

    const expected: SectionSplitResult = {
      first: {
        ...input,
        tables: [input.tables[0]],
      },
      rest: {
        ...input,
        tables: [input.tables[1]],
      },
    };

    expect(splitSection(input, pageHeight, emptyMeasuredDoc)).toEqual(expected);
  });

  it("copies headers when repeatSectionHeaders is true", () => {
    const pageHeight = margin * 5;

    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      repeatSectionHeaders: true,
    };
    const sectionHeader = createRow({ rowHeight: margin, value: "header" });
    const rows = createRows({ rowHeight: margin, length: 6, value: "row " });
    const input: MeasuredSection = {
      index: 0,
      headers: [sectionHeader],
      tables: [
        {
          ...emptyTable,
          rows: rows,
        },
      ],
    };

    const expected: SectionSplitResult = {
      first: {
        index: 0,
        headers: [sectionHeader],
        tables: [
          {
            ...emptyTable,
            rows: rows.slice(0, 3),
          },
        ],
      },
      rest: {
        index: 0,
        headers: [sectionHeader],
        tables: [
          {
            ...emptyTable,
            rows: rows.slice(3, 6),
          },
        ],
      },
    };

    expect(splitSection(input, pageHeight, doc)).toEqual(expected);
  });

  it("should account for margin between all tables", () => {
    const available = 300 + margin;
    const rowHeight = 20;
    const bigRowHeight = 100;
    const firstTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 0 row",
    });
    const secondTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 1 row",
    });
    const thirdTableRows = createRows({ rowHeight: rowHeight, length: 5 });
    const input = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [firstTableRow],
        },
        {
          ...emptyTable,
          rows: [secondTableRow],
        },
        {
          ...emptyTable,
          rows: thirdTableRows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [firstTableRow],
          },
          {
            ...emptyTable,
            rows: [secondTableRow],
          },
          {
            ...emptyTable,
            rows: thirdTableRows.slice(0, 4),
          },
        ],
      },
      rest: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [thirdTableRows[4]],
          },
        ],
      },
    };

    expect(splitSection(input, available, emptyMeasuredDoc)).toEqual(expected);
  });
  it("should account for margin between all tables with TableGap set", () => {
    const available = 300 + margin;
    const rowHeight = 20;
    const bigRowHeight = 100;
    const firstTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 0 row",
    });
    const secondTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 1 row",
    });
    const thirdTableRows = createRows({ rowHeight: rowHeight, length: 7 });
    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [firstTableRow],
        },
        {
          ...emptyTable,
          rows: [secondTableRow],
        },
        {
          ...emptyTable,
          rows: thirdTableRows,
        },
      ],
    };

    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [firstTableRow],
          },
          {
            ...emptyTable,
            rows: [secondTableRow],
          },
          {
            ...emptyTable,
            rows: thirdTableRows.slice(0, 5),
          },
        ],
        tableGap: 8,
      },
      rest: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: thirdTableRows.slice(5, 7),
          },
        ],
        tableGap: 8,
      },
    };

    expect(
      splitSection({ ...input, tableGap: 8 }, available, emptyMeasuredDoc)
    ).toEqual(expected);
  });
  it("should account for TableGap with Headers", () => {
    const available = 300 + margin;
    const rowHeight = margin;
    const bigRowHeight = 100;
    const sectionHeader = createRow({
      rowHeight: bigRowHeight,
      value: "section header",
    });
    const firstTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 0 row",
    });
    const secondTableRow = createRow({
      rowHeight: bigRowHeight,
      value: "table 1 row",
    });
    const thirdTableRow = createRows({
      rowHeight: rowHeight,
      length: 7,
      value: "table 3 row",
    });
    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          ...emptyTable,
          rows: [firstTableRow],
        },
        {
          ...emptyTable,
          rows: [secondTableRow],
        },
        {
          ...emptyTable,
          rows: thirdTableRow,
        },
      ],
    };
    const expected = {
      first: {
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: [firstTableRow],
          },
          {
            ...emptyTable,
            rows: [secondTableRow],
          },
        ],
        headers: [sectionHeader],
        tableGap: 8,
      },
      rest: {
        ...input,
        headers: [],
        tables: [
          {
            ...emptyTable,
            rows: thirdTableRow,
          },
        ],
        tableGap: 8,
      },
    };
    expect(
      splitSection(
        { ...input, tableGap: 8, headers: [sectionHeader] },
        available,
        emptyMeasuredDoc
      )
    ).toEqual(expected);
  });
});

describe("pagination - paginateSection(...)", () => {
  it("paginates table headers", () => {
    const tableHeader = createRow({ rowHeight: 1, value: "header" });
    const tableRows = createRows({ rowHeight: 1, length: 4, value: "row " });
    const input: MeasuredSection = {
      ...emptySection,
      tables: [
        {
          headers: [tableHeader],
          rows: tableRows,
          columns: [{ width: { value: 1, unit: "fr" } }],
          measureTextHeight,
        },
      ],
    };

    const expected: MeasuredRow[] = [tableHeader, ...tableRows];

    expect(paginateSection(input)).toEqual(expected);
  });

  it("paginates section headers", () => {
    const sectionHeaders = createRows({
      rowHeight: 7,
      length: 2,
      value: "header ",
    });
    const tableRows = createRows({ rowHeight: 8, length: 2, value: "row " });
    const input: MeasuredSection = {
      index: 0,
      headers: sectionHeaders,
      tables: [
        {
          ...emptyTable,
          rows: tableRows,
        },
      ],
    };

    const expected: MeasuredRow[] = [
      ...sectionHeaders,
      { ...defaultTableGapRow, height: margin },
      ...tableRows,
    ];

    expect(paginateSection(input)).toEqual(expected);
  });
  it("paginates section headers with lineGap", () => {
    const sectionHeaders = createRows({
      rowHeight: 7,
      length: 2,
      value: "header ",
    });
    const firstTableRows = createRows({
      rowHeight: 8,
      length: 2,
      value: "row ",
    });
    const secondTableRows = createRows({
      rowHeight: 8,
      length: 2,
      value: "row ",
    });
    const input: MeasuredSection = {
      index: 0,
      headers: sectionHeaders,
      tables: [
        {
          ...emptyTable,
          rows: firstTableRows,
        },
        {
          ...emptyTable,
          rows: secondTableRows,
        },
      ],
      tableGap: 2,
    };

    const expected: MeasuredRow[] = [
      ...sectionHeaders,
      { ...defaultTableGapRow, height: 2 },
      ...firstTableRows,
      { ...defaultTableGapRow, height: 2 },
      ...secondTableRows,
    ];

    expect(paginateSection(input)).toEqual(expected);
  });
});

describe("pagination - splitTable(...)", () => {
  const availableSpace = 40;
  const lineHeight = 10;
  const splitter = (
    text: string,
    measure,
    availableSpace
  ): [string, string] => {
    const lines = text.split("\n");
    const nextLines = [];

    while (measure(lines.join("\n")) > availableSpace) {
      nextLines.unshift(lines.pop());
    }

    return [lines.join("\n"), nextLines.join("\n")];
  };
  const measureTextHeight = (text: string) => {
    return text.split("\n").length * lineHeight;
  };
  const makeLines = (n, start = 1) =>
    Array(n)
      .fill("example text")
      .map((x, idx) => `${x} ${idx + start}`)
      .join("\n");
  it("splits long row", () => {
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          columnHeights: [lineHeight * 9],
          data: [{ value: makeLines(9) }],
          height: lineHeight * 9,

          columnWidths: [],
          columnStarts: [],
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [
          {
            columnHeights: [lineHeight * 4],
            data: [{ value: makeLines(4) }],
            height: lineHeight * 4,

            columnWidths: [],
            columnStarts: [],
          },
        ],
        columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
      },
      rest: {
        ...table,
        rows: [
          {
            columnHeights: [lineHeight * 5],
            data: [{ value: makeLines(5, 5) }],
            height: lineHeight * 5,

            columnWidths: [],
            columnStarts: [],
          },
        ],
        columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
      },
    };

    expect(splitTable(table, availableSpace)).toEqual(expected);
  });

  it("doesn't leave split widow", () => {
    // this test checks for cases where a tiny split with no data but ${continuedOn}
    const notes = `a long line that will wrap and will need a fair amount of space in order for it to render appropriately
and another line that should go on the next page as well but it needs to be long to trigger the widow thing`;

    const measure = (txt) => Math.ceil(txt.length / 50);
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight: measure,
      rows: [
        {
          columnHeights: [measure(notes)],
          data: [{ value: notes }],
          height: measure(notes),

          columnWidths: [],
          columnStarts: [],
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitColumn }],
    };

    expect(splitTable(table, 4).first.rows).toHaveLength(1);
    expect((splitTable(table, 4).first.rows[0].data[0] as TextCell).value).toBe(
      notes.split("\n")[0] + continuedOn
    );
  });

  it("only splits row if splittable column is tallest", () => {
    const col1Text = Array(10).fill("123456789").join(" ");
    const splittable = Array(5).fill("123456789").join(" ");
    const measure = (txt) => Math.ceil(txt.length / 10);
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight: measure,
      rows: [
        {
          columnHeights: [measure(col1Text), measure(splittable)],
          data: [{ value: col1Text }, { value: splittable }],
          height: measure(col1Text),

          columnWidths: [],
          columnStarts: [],
        },
      ],
      columns: [
        { width: { value: 1, unit: "fr" } },
        { width: { value: 1, unit: "fr" }, splitFn: splitColumn },
      ],
    };

    expect(splitTable(table, 4).first.rows).toHaveLength(0);
  });

  it("split table shows a breakPage row", () => {
    const tallRow = {
      columnHeights: [lineHeight * 3],
      data: [{ value: "data" }],
      height: lineHeight * 3,
      columnWidths: [],
      columnStarts: [],
    };
    const regularRow = {
      columnHeights: [lineHeight],
      data: [{ value: "data" }],
      height: lineHeight,
      columnWidths: [],
      columnStarts: [],
    };
    const pageBreakRow = {
      columnHeights: [lineHeight],
      data: [{ value: "page break" }],
      height: lineHeight,

      columnWidths: [],
      columnStarts: [],
    };
    const table: MeasuredTable = {
      ...emptyTable,
      rows: [tallRow, regularRow],
      columns: [{ width: { value: 1, unit: "fr" } }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [tallRow, pageBreakRow],
        columns: [{ width: { value: 1, unit: "fr" } }],
      },
      rest: {
        ...table,
        rows: [regularRow],
        columns: [{ width: { value: 1, unit: "fr" } }],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: [pageBreakRow],
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
  it("split table shows multiple breakPage rows ", () => {
    const tallRow = {
      columnHeights: [lineHeight * 2],
      data: [{ value: "data" }],
      height: lineHeight * 2,
      columnWidths: [],
      columnStarts: [],
    };
    const regularRow = {
      columnHeights: [lineHeight],
      data: [{ value: "data" }],
      height: lineHeight,
      columnWidths: [],
      columnStarts: [],
    };
    const pageBreakRows = [
      {
        data: [{ value: "page break" }],
        height: lineHeight,
        columnHeights: [lineHeight],
        columnWidths: [],
        columnStarts: [],
      },
      {
        data: [{ value: "page break" }],
        height: lineHeight,
        columnHeights: [lineHeight],
        columnWidths: [],
        columnStarts: [],
      },
    ];
    const table: MeasuredTable = {
      ...emptyTable,
      rows: [tallRow, regularRow],
      columns: [{ width: { value: 1, unit: "fr" } }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [tallRow, ...pageBreakRows],
        columns: [{ width: { value: 1, unit: "fr" } }],
      },
      rest: {
        ...table,
        rows: [regularRow],
        columns: [{ width: { value: 1, unit: "fr" } }],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: pageBreakRows,
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
  it("split table shows breakPage rows with a splitted long row", () => {
    const pageBreakRows = [
      {
        data: [{ value: "page break" }],
        height: lineHeight,
        columnHeights: [lineHeight],
        columnWidths: [],
        columnStarts: [],
      },
      {
        data: [{ value: "page break" }],
        height: lineHeight,
        columnHeights: [lineHeight],
        columnWidths: [],
        columnStarts: [],
      },
    ];
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          columnHeights: [lineHeight * 9],
          data: [{ value: makeLines(9) }],
          height: lineHeight * 9,

          columnWidths: [],
          columnStarts: [],
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [
          {
            columnHeights: [lineHeight * 2],
            data: [{ value: makeLines(2) }],
            height: lineHeight * 2,

            columnWidths: [],
            columnStarts: [],
          },
          ...pageBreakRows,
        ],
        columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
      },
      rest: {
        ...table,
        rows: [
          {
            columnHeights: [lineHeight * 7],
            data: [{ value: makeLines(7, 3) }],
            height: lineHeight * 7,

            columnWidths: [],
            columnStarts: [],
          },
        ],
        columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: pageBreakRows,
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
});

const emptyMeasuredDoc: MeasuredDocument = {
  layout: "landscape",
  headers: [],
  footers: [],
  sections: [],
  documentFooterHeight: 0,
};

const emptySection: MeasuredSection = {
  headers: [],
  tables: [],
  index: 0,
};

const emptyTable: MeasuredTable = {
  headers: [],
  rows: [],
  measureTextHeight,
  columns: [],
};

function makeSingleSectionMeasuredDoc(rows: MeasuredRow[]): MeasuredDocument {
  return {
    ...emptyMeasuredDoc,
    sections: [
      {
        ...emptySection,
        tables: [
          {
            ...emptyTable,
            rows,
          },
        ],
      },
    ],
  };
}
const defaultTableGapRow: MeasuredRow = {
  data: [],
  columnHeights: [],
  columnWidths: [],
  columnStarts: [],
  height: margin,
};
