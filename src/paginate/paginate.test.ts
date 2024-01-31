import {
  MeasuredDocument,
  MeasuredWatermark,
  MeasuredSection,
  MeasuredRow,
  MeasuredTable,
  VerticalMeasure,
} from "../measure/types";
import {
  exampleDocumentFooterRow,
  getPageDimensions,
  margin,
} from "../measure";
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
} from ".";
import { continuedOn, splitColumn } from "./splitColumn";
import { PaginatedDocument } from "./types";

const measureTextHeight = (): VerticalMeasure => ({
  maxHeight: 0,
  minHeight: 0,
});
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
const emptyMeasuredRow = {
  columnHeights: [],
  columnWidths: [],
  columnStarts: [],
};

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

const defaultTableGapRow: MeasuredRow = {
  ...emptyMeasuredRow,
  data: [],
  height: margin,
};
const createRows = (params: rowsParams) => {
  const { rowHeight, length: length, value } = params;
  return [...Array(length).keys()].map((_, index) => {
    return {
      ...emptyMeasuredRow,
      height: rowHeight,
      data: [{ value: `${value ?? ""}${index}` }],
    };
  });
};

const createRow = (params: rowParam) => {
  const { rowHeight, value } = params;
  return {
    ...emptyMeasuredRow,
    height: rowHeight,
    data: [{ value: `${value}` }],
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

describe("pagination", () => {
  xit("puts single section with single table onto one page", () => {
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

  xit("splits single table across pages", () => {
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

  xit("handles portrait layout", () => {
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

  xit("adds spacing between tables on same page", () => {
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

  xit("splits single section's tables evenly across two pages", () => {
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

  xit("single section, first table fits, second table needs split", () => {
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

  xit("starts new section on new page", () => {
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

  xit("should split second table when section headers are present", () => {
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

  xit("does not repeat report header by default", () => {
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

  xit("accounts for report header in splitting sections", () => {
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

  xit("accounts for report footer in splitting sections", () => {
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

  xit("adds water mark", () => {
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
  // table gap on repeat section headers
  // TODO - eventually do orphan control
});
describe("tableGap", () => {
  const rowHeight = 100;
  xit("handle tableGap between tables and section headers", () => {
    const tableRows = createRows({
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
      sections: [
        {
          ...emptySection,
          headers: [sectionHeader],
          tables: [
            {
              ...emptyTable,
              rows: tableRows,
            },
            {
              ...emptyTable,
              rows: tableRows,
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
            ...tableRows,
            { ...defaultTableGapRow, height: 10 },
            ...tableRows,
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });
  xit("handle tableGap with on multiple pages while tableGap set at section", () => {
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
});

describe("page numbers and timestamp", () => {
  let pageInnerHeight: number;
  let rowHeight: number;
  let timeStampPageNumRow;
  type sectionParam = {
    index: number;
    rowCount: number;
  };
  const createSection = (param: sectionParam) => ({
    ...emptySection,
    index: param.index,
    tables: [
      {
        ...emptyTable,
        rows: createRows({
          rowHeight: rowHeight,
          length: param.rowCount,
          value: "row ",
        }),
      },
    ],
  });
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(creationDate);
    const dimension = getPageDimensions();
    pageInnerHeight = dimension.pageInnerHeight;
    rowHeight = pageInnerHeight / 3;
    timeStampPageNumRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,
      pageNum: 2,
      creationDate,
    });
  });
  xit("handles section page numbers", () => {
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
    const firstSection = createSection({ index: 0, rowCount: 3 });
    const secondSection = createSection({ index: 1, rowCount: 2 });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [firstSection, secondSection],
      documentFooterHeight: rowHeight,
      timestamp: true,
      sectionPageNumbers: true,
    };
    const firstSectionPages = firstSection.tables[0].rows.map((row, index) => ({
      sectionIndex: 0,
      rows: [
        row,
        { ...defaultTableGapRow, height: rowHeight },
        firstSectionPageNumberRow[index],
      ],
    }));
    const secondSectionPages = secondSection.tables[0].rows.map(
      (row, index) => ({
        sectionIndex: 1,
        rows: [
          row,
          { ...defaultTableGapRow, height: rowHeight },
          secondSectionPageNumberRow[index],
        ],
      })
    );

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [...firstSectionPages, ...secondSectionPages],
    };

    expect(result).toEqual(expected);
  });

  xit("throws if both pageNumbers and sectionPageNumbers true", () => {
    const doc = {
      pageNumbers: true,
      sectionPageNumbers: true,
    } as PaginatingDoc;
    expect(() => addHeadersAndFooters(doc, creationDate)).toThrowError(
      "A document cannot have both pageNumbers and sectionPageNumbers set to true"
    );
  });

  xit("adds document page numbers", () => {
    const footerRowHeight = rowHeight / 2;
    const docFooter = createRow({
      rowHeight: footerRowHeight,
      value: "footer",
    });
    const section = createSection({ index: 0, rowCount: 2 });
    const pageNumberRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight / 2,
      pageNum: 2,
    });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      footers: [docFooter],
      sections: [section],
      documentFooterHeight: footerRowHeight,
      pageNumbers: true,
    };
    const expectedPages = section.tables[0].rows.map((row, index) => ({
      sectionIndex: 0,
      rows: [
        row,
        { ...defaultTableGapRow, height: rowHeight },
        docFooter,
        pageNumberRow[index],
      ],
    }));
    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: expectedPages,
    };

    expect(result).toEqual(expected);
  });

  xit("adds timestamp", () => {
    const timeStampRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,
      creationDate: creationDate,
    });
    const section = createSection({ index: 0, rowCount: 1 });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [section],
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
            section.tables[0].rows[0],
            { ...defaultTableGapRow, height: rowHeight },
            ...timeStampRow,
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  xit("adds page numbers and timestamp", () => {
    const section = createSection({ index: 0, rowCount: 2 });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [section],
      documentFooterHeight: rowHeight,
      timestamp: true,
      pageNumbers: true,
    };
    const expectedPages = section.tables[0].rows.map((row, index) => ({
      sectionIndex: 0,
      rows: [
        row,
        { ...defaultTableGapRow, height: rowHeight },
        timeStampPageNumRow[index],
      ],
    }));

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: expectedPages,
    };

    expect(result).toEqual(expected);
  });

  xit("adds page numbers and timestamp with timeStampPageNumberFontSetting set", () => {
    const section = createSection({ index: 0, rowCount: 2 });
    const fontSetting = {
      fontFace: "Times-Roman",
      fontSize: 8,
      color: "black",
      underline: true,
    };
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [section],
      documentFooterHeight: rowHeight,
      timestamp: true,
      pageNumbers: true,
      timeStampPageNumberFontSetting: fontSetting,
    };

    const expectedPages = section.tables[0].rows.map((row, index) => ({
      sectionIndex: 0,
      rows: [
        row,
        {
          ...defaultTableGapRow,
          height: rowHeight,
        },
        {
          ...timeStampPageNumRow[index],
          data: [
            {
              ...timeStampPageNumRow[index].data[0],
              fontFace: "Times-Roman",
              fontSize: 8,
              color: "black",
              underline: true,
            } as Cell,
          ],
        },
      ],
    }));

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: expectedPages,
    };

    expect(result).toEqual(expected);
  });
});

describe("pagination - splitSection(...)", () => {
  xit("single table spans > 1 page", () => {
    const { pageInnerHeight } = getPageDimensions();

    const rowHeight = pageInnerHeight / 4;
    const rows = createRows({ rowHeight: rowHeight, length: 10 });
    const input: MeasuredSection = {
      index: 0,
      headers: [
        {
          ...emptyMeasuredRow,
          height: 0,
          data: [{ value: "i should not be copied later" }],
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

  xit("multiple tables, second needs split", () => {
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

  xit("does not split to create widow", () => {
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

  xit("copies headers when repeatSectionHeaders is true", () => {
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
        ...input,
        tables: [
          {
            ...emptyTable,
            rows: rows.slice(0, 3),
          },
        ],
      },
      rest: {
        ...input,
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

  xit("should account for margin between all tables", () => {
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
  xit("should account for margin between all tables with TableGap set", () => {
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
  xit("should account for TableGap with Headers", () => {
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
  xit("paginates table headers", () => {
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

  xit("paginates section headers", () => {
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
  xit("paginates section headers with lineGap", () => {
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
  const pageBreakRow = {
    ...emptyMeasuredRow,
    columnHeights: [{ maxHeight: lineHeight, minHeight: lineHeight }],
    data: [{ value: "page break" }],
    height: lineHeight,
  };
  const splitter = (
    text: string,
    measure,
    availableSpace
  ): [string, string] => {
    const lines = text.split("\n");
    const nextLines = [];
    while (measure(lines.join("\n")).maxHeight > availableSpace) {
      nextLines.unshift(lines.pop());
    }

    return [lines.join("\n"), nextLines.join("\n")];
  };
  const measureTextHeight = (text: string): VerticalMeasure => {
    return {
      maxHeight: text.split("\n").length * lineHeight,
      minHeight: text.split("\n").length * lineHeight,
    };
  };
  const makeLines = (n, start = 1) =>
    Array(n)
      .fill("example text")
      .map((x, idx) => `${x} ${idx + start}`)
      .join("\n");
  const createMeasuredRows = (heightTimes: number) => ({
    ...emptyMeasuredRow,
    columnHeights: [
      {
        maxHeight: lineHeight * heightTimes,
        minHeight: lineHeight * heightTimes,
      },
    ],
    data: [{ value: "data" }],
    height: lineHeight * heightTimes,
  });
  it("splits long row", () => {
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [
            { maxHeight: lineHeight * 9, minHeight: lineHeight * 9 },
          ],
          data: [{ value: makeLines(9) }],
          height: lineHeight * 9,
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [
          {
            columnHeights: [
              { maxHeight: lineHeight * 4, minHeight: lineHeight * 4 },
            ],
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
            columnHeights: [
              { maxHeight: lineHeight * 5, minHeight: lineHeight * 5 },
            ],
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

  xit("doesn't leave split widow", () => {
    // this test checks for cases where a tiny split with no data but ${continuedOn}
    const notes = `a long line that will wrap and will need a fair amount of space in order for xit to render appropriately
and another line that should go on the next page as well but xit needs to be long to trigger the widow thing`;

    const measure = (txt): VerticalMeasure => ({
      maxHeight: Math.ceil(txt.length / 50),
      minHeight: Math.ceil(txt.length / 50),
    });
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight: measure,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [measure(notes)],
          data: [{ value: notes }],
          height: measure(notes).maxHeight,
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitColumn }],
    };

    expect(splitTable(table, 4).first.rows).toHaveLength(1);
    expect((splitTable(table, 4).first.rows[0].data[0] as TextCell).value).toBe(
      notes.split("\n")[0] + continuedOn
    );
  });

  xit("only splits row if splittable column is tallest", () => {
    const col1Text = Array(10).fill("123456789").join(" ");
    const splittable = Array(5).fill("123456789").join(" ");
    const measure = (txt) => ({
      maxHeight: Math.ceil(txt.length / 10),
      minHeight: Math.ceil(txt.length / 10),
    });
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight: measure,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [measure(col1Text), measure(splittable)],
          data: [{ value: col1Text }, { value: splittable }],
          height: measure(col1Text).maxHeight,
        },
      ],
      columns: [
        { width: { value: 1, unit: "fr" } },
        { width: { value: 1, unit: "fr" }, splitFn: splitColumn },
      ],
    };

    expect(splitTable(table, 4).first.rows).toHaveLength(0);
  });

  xit("split table shows a breakPage row", () => {
    const tallRow = createMeasuredRows(3);
    const regularRow = createMeasuredRows(1);

    const table: MeasuredTable = {
      ...emptyTable,
      rows: [tallRow, regularRow],
      columns: [{ width: { value: 1, unit: "fr" } }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [tallRow, pageBreakRow],
      },
      rest: {
        ...table,
        rows: [regularRow],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: [pageBreakRow],
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
  xit("split table shows multiple breakPage rows ", () => {
    const tallRow = createMeasuredRows(2);
    const regularRow = createMeasuredRows(1);
    const pageBreakRows = [pageBreakRow, pageBreakRow];
    const table: MeasuredTable = {
      ...emptyTable,
      rows: [tallRow, regularRow],
      columns: [{ width: { value: 1, unit: "fr" } }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [tallRow, ...pageBreakRows],
      },
      rest: {
        ...table,
        rows: [regularRow],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: pageBreakRows,
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
  xit("split table shows breakPage rows with a splitted long row", () => {
    const pageBreakRows = [pageBreakRow, pageBreakRow];
    const table: MeasuredTable = {
      ...emptyTable,
      measureTextHeight,
      rows: [
        {
          ...emptyMeasuredRow,
          columnHeights: [
            { maxHeight: lineHeight * 9, minHeight: lineHeight * 9 },
          ],
          data: [{ value: makeLines(9) }],
          height: lineHeight * 9,
        },
      ],
      columns: [{ width: { value: 1, unit: "fr" }, splitFn: splitter }],
    };

    const expected: TableSplitResult = {
      first: {
        ...table,
        rows: [
          {
            ...emptyMeasuredRow,
            columnHeights: [
              { maxHeight: lineHeight * 2, minHeight: lineHeight * 2 },
            ],
            data: [{ value: makeLines(2) }],
            height: lineHeight * 2,
          },
          ...pageBreakRows,
        ],
      },
      rest: {
        ...table,
        rows: [
          {
            ...emptyMeasuredRow,
            columnHeights: [
              { maxHeight: lineHeight * 7, minHeight: lineHeight * 7 },
            ],
            data: [{ value: makeLines(7, 3) }],
            height: lineHeight * 7,
          },
        ],
      },
    };
    const doc: MeasuredDocument = {
      ...emptyMeasuredDoc,
      pageBreakRows: pageBreakRows,
    };
    expect(splitTable(table, availableSpace, doc)).toEqual(expected);
  });
});
