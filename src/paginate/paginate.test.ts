import {
  MeasuredDocument,
  MeasuredWatermark,
  MeasuredSection,
  MeasuredRow,
} from "../measure/types";
import { getPageDimensions, margin } from "../measure";
import { ChartCell } from "../types";
import {
  paginate,
  splitSection,
  SectionSplitResult,
  paginateSection,
  handleTemplate,
  updateTextTemplateVariables,
} from ".";

import { Page, PaginatedDocument, PaginatedRow } from "./types";
import { rs } from "../rs";
import { TextTemplate } from "../types";
import {
  emptyMeasuredRow,
  emptyMeasuredDoc,
  emptySection,
  emptyTable,
  defaultTableGapRow,
  measureTextHeight,
} from "./testUtils";

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
      ...emptyMeasuredRow,
      minHeight: rowHeight,
      maxHeight: rowHeight,
      data: [{ value: `${value ?? ""}${index}` }],
    };
  });
};

const createRow = (params: rowParam) => {
  const { rowHeight, value } = params;
  return {
    ...emptyMeasuredRow,
    minHeight: rowHeight,
    maxHeight: rowHeight,
    data: [{ value: `${value}` }],
  };
};

const createPageNumberTimeStampRow = (param: pageNumberTimestampRowParam) => {
  const { footerHeight, pageNum, creationDate } = param;
  return [...Array(pageNum).keys()].map((_, index) => {
    const timestampVal = creationDate
      ? `${
          `${creationDate.toLocaleString("en-US", {
            timeZone: "America/Chicago",
          })}`.split(/ GMT/)[0]
        }`
      : "";
    const pageNumVal = pageNum ? `Page ${index + 1} of ${pageNum}` : "";
    const footerTimeStampPageNumVal =
      timestampVal.length > 0 && pageNumVal.length > 0
        ? `${timestampVal} ${pageNumVal}`
        : `${timestampVal}${pageNumVal}`;
    return {
      minHeight: footerHeight,
      maxHeight: footerHeight,
      data: [
        {
          value: footerTimeStampPageNumVal,
          horizontalAlign: "right",
          columnSpan: 1,
        },
      ],
      columnHeights: [],
      columnWidths: [756],
      columnStarts: [18],
    };
  });
};

const createTemplateRow = (
  template: TextTemplate,
  footerHeight: number
): MeasuredRow => {
  return {
    minHeight: footerHeight,
    maxHeight: footerHeight,
    data: [
      {
        template: template,
        horizontalAlign: "right",
        columnSpan: 1,
      },
    ],
    columnHeights: [],
    columnWidths: [756],
    columnStarts: [18],
  };
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
            {
              ...defaultTableGapRow,
              maxHeight: rowHeight,
              minHeight: rowHeight,
            },
            docFooters,
          ],
        },
        {
          sectionIndex: 0,
          rows: [
            rows[1],
            {
              ...defaultTableGapRow,
              maxHeight: rowHeight,
              minHeight: rowHeight,
            },
            docFooters,
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("adds water mark", () => {
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
  it("handle tableGap between tables and section headers", () => {
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
            { ...defaultTableGapRow, maxHeight: 10, minHeight: 10 },
            ...tableRows,
            { ...defaultTableGapRow, maxHeight: 10, minHeight: 10 },
            ...tableRows,
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });
  it("handle tableGap with on multiple pages while tableGap set at section", () => {
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
            { ...defaultTableGapRow, minHeight: 10, maxHeight: 10 },
            secondTableRow,
          ],
        },
      ],
    };
    expect(result).toEqual(expected);
  });
});

describe("handleTemplate", () => {
  const variables = {
    documentPageNumber: 1,
    documentPageCount: 5,
    sectionPageNumber: 0,
    sectionPageCount: 0,
    currentSection: 0,
    timestamp: "",
  };
  it("return row if not template cell", () => {
    const measuredRow = createRow({ rowHeight: 100, value: "row " });
    expect(handleTemplate(measuredRow, variables)).toEqual(measuredRow);
  });
  it("return row resolved template cell", () => {
    const template = rs`Page {{documentPageNumber}} of {{documentPageCount}}`;
    const templateRow: MeasuredRow = {
      ...emptyMeasuredRow,
      minHeight: 100,
      maxHeight: 100,
      data: [{ template: template }],
    };
    const expected = {
      ...templateRow,
      data: [{ value: "Page 1 of 5" }],
    };
    expect(handleTemplate(templateRow, variables)).toEqual(expected);
  });
  it("return row resolved template cell with style", () => {
    const template = rs`Page {{documentPageNumber}} of {{documentPageCount}}`;
    const templateRow: MeasuredRow = {
      ...emptyMeasuredRow,
      minHeight: 100,
      maxHeight: 100,
      data: [{ template: template, color: "red" }],
    };
    const expected = {
      ...templateRow,
      data: [{ value: "Page 1 of 5", color: "red" }],
    };
    expect(handleTemplate(templateRow, variables)).toEqual(expected);
  });
});
describe("updateTextTemplateVariables", () => {
  let paginatingDocument;
  let textTemplateVariables;
  beforeEach(() => {
    const tableRows = createRows({
      rowHeight: 10,
      length: 2,
      value: "row ",
    });
    paginatingDocument = {
      pages: [
        {
          sectionIndex: 0,
          rows: [...tableRows],
        } as Page,
        {
          sectionIndex: 0,
          rows: [...tableRows],
        } as Page,
        {
          sectionIndex: 1,
          rows: [...tableRows],
        } as Page,
      ],
      remaining: undefined,
      footerSpace: undefined,
      headerSpace: undefined,
    };
    textTemplateVariables = {
      documentPageNumber: 0,
      documentPageCount: paginatingDocument.pages.length,
      sectionPageNumber: 0,
      sectionPageCount: 0,
      currentSection: 0,
      timestamp: "",
    };
  });
  it("update first page", () => {
    updateTextTemplateVariables(0, paginatingDocument, textTemplateVariables);
    expect(textTemplateVariables).toEqual({
      documentPageNumber: 1,
      documentPageCount: paginatingDocument.pages.length,
      sectionPageNumber: 1,
      sectionPageCount: 2,
      currentSection: 0,
      timestamp: "",
    });
  });
  it("update second page", () => {
    updateTextTemplateVariables(0, paginatingDocument, textTemplateVariables);
    updateTextTemplateVariables(1, paginatingDocument, textTemplateVariables);

    expect(textTemplateVariables).toEqual({
      documentPageNumber: 2,
      documentPageCount: paginatingDocument.pages.length,
      sectionPageNumber: 2,
      sectionPageCount: 2,
      currentSection: 0,
      timestamp: "",
    });
  });
  it("update third page", () => {
    updateTextTemplateVariables(0, paginatingDocument, textTemplateVariables);
    updateTextTemplateVariables(1, paginatingDocument, textTemplateVariables);
    updateTextTemplateVariables(2, paginatingDocument, textTemplateVariables);

    expect(textTemplateVariables).toEqual({
      documentPageNumber: 3,
      documentPageCount: paginatingDocument.pages.length,
      sectionPageNumber: 1,
      sectionPageCount: 1,
      currentSection: 1,
      timestamp: "",
    });
  });
});
describe("page numbers and timestamp", () => {
  let pageInnerHeight: number;
  let rowHeight: number;
  type sectionParam = {
    index: number;
    rowCount: number;
  };
  const createSection = (param: sectionParam): MeasuredSection => ({
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
  });

  it("handles section page numbers", () => {
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
      footers: [
        createTemplateRow(
          rs`{{timestamp}} Page {{sectionPageNumber}} of {{sectionPageCount}}`,
          rowHeight
        ),
      ],
    };
    const firstSectionPages = firstSection.tables[0].rows.map((row, index) => ({
      sectionIndex: 0,
      rows: [
        row,
        { ...defaultTableGapRow, maxHeight: rowHeight, minHeight: rowHeight },
        firstSectionPageNumberRow[index],
      ],
    }));
    const secondSectionPages = secondSection.tables[0].rows.map(
      (row, index) => ({
        sectionIndex: 1,
        rows: [
          row,
          { ...defaultTableGapRow, maxHeight: rowHeight, minHeight: rowHeight },
          secondSectionPageNumberRow[index],
        ],
      })
    );
    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [...firstSectionPages, ...secondSectionPages] as Page[],
    };

    expect(result).toEqual(expected);
  });

  it("adds timestamp", () => {
    const timestampRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,
      creationDate: creationDate,
    });
    const section = createSection({ index: 0, rowCount: 1 });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [section],
      footers: [createTemplateRow(rs`{{timestamp}}`, rowHeight)],
    };

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: [
        {
          sectionIndex: 0,
          rows: [
            section.tables[0].rows[0],
            {
              ...defaultTableGapRow,
              minHeight: rowHeight,
              maxHeight: rowHeight,
            },
            ...(timestampRow as PaginatedRow[]),
          ],
        },
      ],
    };

    expect(result).toEqual(expected);
  });

  it("adds page numbers and timestamp", () => {
    const section = createSection({ index: 0, rowCount: 2 });
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [section],
      footers: [
        createTemplateRow(
          rs`{{timestamp}} Page {{documentPageNumber}} of {{documentPageCount}}`,
          rowHeight
        ),
      ],
    };
    const timestampPageNumRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,
      pageNum: 2,
      creationDate,
    });
    const expectedPages = section.tables[0].rows.map((row, index) => ({
      sectionIndex: 0,
      rows: [
        row,
        { ...defaultTableGapRow, minHeight: rowHeight, maxHeight: rowHeight },
        timestampPageNumRow[index],
      ],
    }));

    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: expectedPages as Page[],
    };

    expect(result).toEqual(expected);
  });
  it("adds page numbers and timestamp to section", () => {
    const inputSection = createSection({ index: 0, rowCount: 2 });
    inputSection.tables[0].rows.push(
      createTemplateRow(
        rs`{{timestamp}} Page {{documentPageNumber}} of {{documentPageCount}}`,
        rowHeight
      )
    );
    const input: MeasuredDocument = {
      ...emptyMeasuredDoc,
      sections: [inputSection],
      footers: [
        createTemplateRow(
          rs`{{timestamp}} Page {{documentPageNumber}} of {{documentPageCount}}`,
          rowHeight
        ),
      ],
      timestamp: true,
      pageNumbers: true,
    };

    const timestampPageNumRow = createPageNumberTimeStampRow({
      footerHeight: rowHeight,
      pageNum: 3,
      creationDate,
    });

    const section = createSection({ index: 0, rowCount: 2 });
    section.tables[0].rows.push(timestampPageNumRow[2] as PaginatedRow);

    const expectedPages = section.tables[0].rows.map((row, index) => ({
      sectionIndex: 0,
      rows: [
        row,
        { ...defaultTableGapRow, minHeight: rowHeight, maxHeight: rowHeight },
        timestampPageNumRow[index],
      ],
    }));
    const result = paginate(input, creationDate);

    const expected: PaginatedDocument = {
      layout: "landscape",
      pages: expectedPages as Page[],
    };

    expect(result).toEqual(expected);
  });
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
          ...emptyMeasuredRow,
          minHeight: 0,
          maxHeight: 0,
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
              maxHeight: pageHeight - margin - headerHeight - 1,
              minHeight: pageHeight - margin - headerHeight - 1,
            },
          ],
        },
        {
          headers: [
            {
              ...defaultTableGapRow,
              maxHeight: headerHeight,
              minHeight: headerHeight,
            },
          ],
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

  it("should account for page break rows", () => {
    const available = 300 + margin * 2;
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
    const thirdTableRow = createRow({
      rowHeight: rowHeight,
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
          rows: [thirdTableRow],
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
            rows: [thirdTableRow],
          },
        ],
        tableGap: 8,
      },
    };

    const doc = {
      ...emptyMeasuredDoc,
      pageBreakRows: [
        createRow({
          rowHeight: rowHeight,
          value: "page break",
        }),
      ],
    };
    expect(
      splitSection(
        { ...input, tableGap: 8, headers: [sectionHeader] },
        available,
        doc
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

    expect(paginateSection(input, 500)).toEqual(expected);
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
      { ...defaultTableGapRow, minHeight: margin, maxHeight: margin },
      ...tableRows,
    ];

    expect(paginateSection(input, 500)).toEqual(expected);
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
      { ...defaultTableGapRow, minHeight: 2, maxHeight: 2 },
      ...firstTableRows,
      { ...defaultTableGapRow, minHeight: 2, maxHeight: 2 },
      ...secondTableRows,
    ];

    expect(paginateSection(input, 500)).toEqual(expected);
  });

  it("splits expandable space for expandable rows", () => {
    const firstRow = createRows({
      rowHeight: 100,
      length: 1,
    })[0];

    const lastRow = createRows({
      rowHeight: 100,
      length: 1,
    })[0];

    const createChartCell = (minHeight: number) =>
      ({
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
          minHeight,
        },
      } as ChartCell);

    const chartCellOne = createChartCell(150);
    const chartCellTwo = createChartCell(200);

    const chartRowOne = {
      ...createRows({
        rowHeight: 150,
        length: 1,
      })[0],
      data: [chartCellOne],
      maxHeight: undefined,
    };

    const chartRowTwo = {
      ...createRows({
        rowHeight: 150,
        length: 1,
      })[0],
      data: [chartCellTwo],
      maxHeight: undefined,
    };

    const section: MeasuredSection = {
      headers: [],
      index: 0,
      tables: [
        {
          ...emptyTable,
          rows: [firstRow, chartRowOne, chartRowTwo, lastRow],
        },
      ],
      tableGap: 2,
    };

    const expandableRowCount = 2;

    const availableSpace = 600;
    const totalExpandableSpace =
      availableSpace -
      firstRow.minHeight -
      lastRow.minHeight -
      chartRowOne.minHeight -
      chartRowTwo.minHeight;
    const expectedChartRowOneHeight =
      totalExpandableSpace / expandableRowCount + chartRowOne.minHeight;
    const expectedChartRowTwoHeight =
      totalExpandableSpace / expandableRowCount + chartRowTwo.minHeight;

    const expected: MeasuredRow[] = [
      firstRow,
      {
        ...chartRowOne,
        data: [
          {
            chart: {
              ...chartCellOne.chart,
              maxHeight: expectedChartRowOneHeight,
            },
          },
        ],
        maxHeight: expectedChartRowOneHeight,
        minHeight: expectedChartRowOneHeight,
      },
      {
        ...chartRowTwo,
        data: [
          {
            chart: {
              ...chartCellTwo.chart,
              maxHeight: expectedChartRowTwoHeight,
            },
          },
        ],
        maxHeight: expectedChartRowTwoHeight,
        minHeight: expectedChartRowTwoHeight,
      },
      lastRow,
    ];

    expect(paginateSection(section, availableSpace)).toEqual(expected);
  });
});
