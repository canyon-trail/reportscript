import { Cell, TextCell } from "../types";
import {
  exampleDocumentFooterRow,
  getPageDimensions,
  margin,
} from "../measure";
import _ from "lodash";
import { calculateCellLeftCoords } from "../measure";
import { calculateColumnWidths } from "./calculateColumnWidths";
import {
  MeasuredDocument,
  MeasuredRow,
  MeasuredSection,
  MeasuredTable,
} from "../measure/types";
import { Page, PaginatedDocument } from "./types";
export type PaginatingDoc = MeasuredDocument & {
  remaining: MeasuredSection[];
  pages: Page[];
  hasHeaders: boolean;
  hasFooters: boolean;
  footerSpace: number;
  headerSpace: number;
};

export type TableSplitResult = {
  first: MeasuredTable;
  rest: MeasuredTable;
};

type PageSectionCount = {
  sectionPage: number;
  currentSection: number;
};

export type SectionSplitResult = {
  first: MeasuredSection;
  rest: MeasuredSection;
};

export function paginate(
  doc: MeasuredDocument,
  creationDate: Date
): PaginatedDocument {
  const pagingDoc = prepareDoc(doc);

  while (pagingDoc.remaining.length > 0) {
    paginateStep(pagingDoc);
  }

  addHeadersAndFooters(pagingDoc, creationDate);
  return {
    pages: pagingDoc.pages,
    layout: doc.layout,
    watermark: doc?.watermark,
  };
}

function paginateStep(doc: PaginatingDoc) {
  const pageIndex = doc.pages.length - 1;

  const pageSpace = getAvailablePageSpace(doc, pageIndex);
  const currentPage = doc.pages[pageIndex];

  const currentSection = doc.remaining.shift();
  const remainingSpace = pageSpace - sumOfRowHeights(currentPage.rows);

  const sectionHeight = getSectionHeight(currentSection);

  if (sectionHeight > remainingSpace) {
    const { first, rest } = splitSection(currentSection, remainingSpace, doc);

    if (rest.tables.length > 0) {
      doc.remaining.unshift(rest);
    }
    if (first.tables.length > 0) {
      doc.remaining.unshift(first);
    }
  } else {
    const paginated = paginateSection(currentSection);
    currentPage.rows = [...currentPage.rows, ...paginated];
    currentSection?.watermark &&
      (currentPage.watermark = currentSection.watermark);
    if (doc.remaining.length > 0) {
      doc.pages.push({ rows: [], sectionIndex: doc.remaining[0].index });
    }
  }
}

function prepareDoc(doc: MeasuredDocument): PaginatingDoc {
  const hasHeaders = doc.headers.length > 0;
  const headerSpace = hasHeaders ? margin + sumOfRowHeights(doc.headers) : 0;
  const hasFooters = doc.footers.length > 0 || doc.documentFooterHeight > 0;
  const footerSpace = hasFooters
    ? margin + sumOfRowHeights(doc.footers) + doc.documentFooterHeight
    : 0;
  return {
    ...doc,
    pages: [{ rows: [], sectionIndex: 0 }],
    remaining: [...doc.sections],
    hasHeaders,
    hasFooters,
    headerSpace,
    footerSpace,
  };
}

export function addHeadersAndFooters(
  doc: PaginatingDoc,
  creationDate: Date
): void {
  if (doc.pageNumbers && doc.sectionPageNumbers) {
    throw new Error(
      "A document cannot have both pageNumbers and sectionPageNumbers set to true"
    );
  }

  const pageSectionCount = {
    sectionPage: 0,
    currentSection: 0,
  };

  doc.pages.forEach((_, idx) => {
    handleHeaders(idx, doc);

    handleFooters(idx, doc, pageSectionCount, creationDate);
  });
}

function handleHeaders(index: number, doc: PaginatingDoc) {
  const page = doc.pages[index];
  if (doc.hasHeaders && (doc.repeatReportHeaders || index === 0)) {
    page.rows.unshift({
      data: [],
      height: margin,
      columnHeights: [],
      columnWidths: [],
      columnStarts: [],
    });
    page.rows.unshift(...doc.headers);
  }
}

function handleFooters(
  index: number,
  doc: PaginatingDoc,
  pageSectionCount: PageSectionCount,
  creationDate: Date
) {
  const page = doc.pages[index];

  const { pageInnerHeight } = getPageDimensions(doc.layout);

  if (doc.hasFooters) {
    const usedSpace = sumOfRowHeights(page.rows);
    const marginSpace = pageInnerHeight - usedSpace - doc.footerSpace + margin;

    page.rows.push({
      data: [],
      height: marginSpace,
      columnHeights: [],
      columnWidths: [],
      columnStarts: [],
    });
    page.rows.push(...doc.footers);

    handlePageNumTimestamp(index, doc, pageSectionCount, creationDate);
  }
}

function handlePageNumTimestamp(
  index: number,
  doc: PaginatingDoc,
  pageSectionCount: PageSectionCount,
  creationDate: Date
) {
  const page = doc.pages[index];

  const docFooterText = getFooterText(
    index,
    doc,
    pageSectionCount,
    creationDate
  );
  const timeStampPageNumFontSetting = doc?.timeStampPageNumberFontSetting;
  const dataCell: Cell = {
    value: docFooterText,
    align: "right",
    columnSpan: 1,
    ...timeStampPageNumFontSetting
  };
  const { availableWidth } = getPageDimensions(doc.layout);
  if (docFooterText.length) {
    const widths = calculateColumnWidths(
      [{ width: { value: 1, unit: "fr" } }],
      availableWidth
    );
    page.rows.push({
      ...exampleDocumentFooterRow,
      data: [dataCell],
      height: doc.documentFooterHeight,
      columnHeights: [],
      columnWidths: widths,
      columnStarts: calculateCellLeftCoords(widths),
    });
  }
}

function getFooterText(
  index: number,
  doc: PaginatingDoc,
  pageSectionCount: PageSectionCount,
  creationDate: Date
) {
  const page = doc.pages[index];

  const timeStamp = `${creationDate.toLocaleString("en-US", {
    timeZone: "America/Chicago",
  })}`;
  const pageNum = ` Page ${index + 1} of ${doc.pages.length}`;

  pageSectionCount.sectionPage =
    pageSectionCount.currentSection === page.sectionIndex
      ? pageSectionCount.sectionPage + 1
      : 1;

  pageSectionCount.currentSection = page.sectionIndex;

  const sectionPageCount = doc.pages.filter(
    (x) => x.sectionIndex === pageSectionCount.currentSection
  ).length;

  const sectionPageText = ` Page ${pageSectionCount.sectionPage} of ${sectionPageCount}`;

  return `${doc.timestamp ? `${timeStamp.split(/ GMT/)[0]}` : ""}${
    doc.pageNumbers ? pageNum : doc.sectionPageNumbers ? sectionPageText : ""
  }`;
}

function getSectionHeight(section: MeasuredSection): number {
  const totalMargin =
    (section.tables.length - 1) * (section?.tableGap ?? margin);
  const headerHeight =
    sumOfRowHeights(section.headers) +
    (section.headers.length > 0 ? section?.tableGap ?? margin : 0);

  const tableHeights = _.chain(section.tables)
    .map((x) => getTableHeight(x))
    .sum()
    .value();

  return totalMargin + headerHeight + tableHeights;
}

function getTableHeight(table: MeasuredTable): number {
  const rowHeight = sumOfRowHeights(table.rows);

  const headerHeight = sumOfRowHeights(table.headers);

  return rowHeight + headerHeight;
}

export function splitSection(
  section: MeasuredSection,
  availableSpace: number,
  doc: MeasuredDocument
): SectionSplitResult {
  let remainingSpace = availableSpace;
  if (section.headers.length > 0) {
    remainingSpace -=
      (section?.tableGap ?? margin) + sumOfRowHeights(section.headers);
  }

  const fitTables: MeasuredTable[] = [];
  const remainingTables = [...section.tables];

  while (remainingTables.length > 0) {
    const tableMargin = fitTables.length > 0 ? section?.tableGap ?? margin : 0;

    remainingSpace -= tableMargin;

    const table = remainingTables.shift();

    if (canFitTable(table, remainingSpace)) {
      remainingSpace -= getTableHeight(table);
      fitTables.push(table);
    } else {
      const { first, rest } = splitTable(table, remainingSpace, doc);
      if (rest.rows.length > 0) {
        remainingTables.unshift(rest);
      }

      if (first.rows.length > 0) {
        fitTables.push(first);
      }

      break;
    }
  }

  const first = {
    ...section,
    tables: fitTables,
  };

  return {
    first,
    rest: {
      headers: doc.repeatSectionHeaders ? section.headers : [],
      tables: remainingTables,
      index: section.index,
      watermark: section?.watermark,
      tableGap: section?.tableGap,
    },
  };
}

export function splitTable(
  table: MeasuredTable,
  availableSpace: number,
  doc?: MeasuredDocument
): TableSplitResult {
  let usedSpace = sumOfRowHeights(table.headers);
  doc?.pageBreakRows ? (usedSpace += sumOfRowHeights(doc?.pageBreakRows)) : 0;

  const fitRows: MeasuredRow[] = [];
  const remainingRows = [...table.rows];

  while (remainingRows.length > 0) {
    const row = remainingRows.shift();
    if (canFitRow(row, usedSpace, availableSpace)) {
      usedSpace += row.height;
      fitRows.push(row);
    } else if (canSplitRow(row, availableSpace - usedSpace, table)) {
      const [first, rest] = splitRow(row, availableSpace - usedSpace, table);
      fitRows.push(first);
      remainingRows.unshift(rest);
      break;
    } else {
      remainingRows.unshift(row);
      break;
    }
  }
  const pageBreakRows = doc?.pageBreakRows ? doc.pageBreakRows : [];
  return {
    first: {
      ...table,
      rows: [...fitRows, ...pageBreakRows],
    },
    rest: {
      ...table,
      rows: remainingRows,
    },
  };
}

function canSplitRow(
  row: MeasuredRow,
  availableSpace: number,
  table: MeasuredTable
): boolean {
  const hasSplitFn = table.columns?.some((x) => x.splitFn);
  if (!hasSplitFn) {
    return false;
  }

  for (let columnIdx = 0; columnIdx < row.data.length; columnIdx++) {
    if (row.columnHeights[columnIdx] <= availableSpace) {
      continue;
    }

    if (!table.columns[columnIdx].splitFn) {
      return false;
    }
  }

  const minHeight = table.measureTextHeight("X", 0, row);

  return availableSpace >= minHeight;
}

function splitRow(
  row: MeasuredRow,
  availableSpace: number,
  table: MeasuredTable
): [MeasuredRow, MeasuredRow] {
  const first: MeasuredRow = {
    ...row,
    data: [...row.data.map((x) => ({ ...x }))],
    columnHeights: [...row.columnHeights],
    height: row.height,
  };
  const rest: MeasuredRow = {
    ...row,
    data: [...row.data.map((x) => ({ ...x }))],
    columnHeights: [...row.columnHeights],
    height: row.height,
  };

  row.data.forEach((d, idx) => {
    const splitFn = table.columns[idx]?.splitFn;

    if (splitFn && row.columnHeights[idx] > availableSpace && "value" in d) {
      if (row.image) {
        throw new Error("A row cannot be split with an image");
      }

      const measure = (text: string) => table.measureTextHeight(text, idx, row);

      const [next, remaining] = splitFn(`${d.value}`, measure, availableSpace);

      (first.data[idx] as TextCell).value = next;
      first.columnHeights[idx] = measure(next);

      (rest.data[idx] as TextCell).value = remaining;
      rest.columnHeights[idx] = measure(remaining);
    }
  });

  first.height = Math.max(...first.columnHeights);
  rest.height = Math.max(...rest.columnHeights);

  return [first, rest];
}

function canFitRow(
  row: MeasuredRow,
  usedSpace: number,
  availableSpace: number
) {
  return row.height + usedSpace <= availableSpace;
}

function canFitTable(table: MeasuredTable, availableSpace: number): boolean {
  return getTableHeight(table) <= availableSpace;
}

export function paginateSection(section: MeasuredSection): MeasuredRow[] {
  const rows: MeasuredRow[] = [];

  const separationRow = {
    height: section?.tableGap ?? margin,
    data: [],
    columnHeights: [],
    columnWidths: [],
    columnStarts: [],
  };
  section.tables.forEach((table, idx) => {
    if (idx !== 0) {
      rows.push(separationRow);
    }

    if (idx === 0 && section.headers.length > 0) {
      rows.push(...section.headers);
      rows.push(separationRow);
    }
    rows.push(...table.headers);
    rows.push(...table.rows);
  });

  return rows;
}

function sumOfRowHeights(rows: MeasuredRow[]): number {
  return _.chain(rows)
    .map((x) => x.height)
    .sum()
    .value();
}

function getAvailablePageSpace(doc: PaginatingDoc, pageIdx: number): number {
  const { pageInnerHeight } = getPageDimensions(doc.layout);

  let pageSpace = pageInnerHeight - doc.footerSpace;

  if (pageIdx === 0 || doc.repeatReportHeaders) {
    pageSpace -= doc.headerSpace;
  }

  return pageSpace;
}
