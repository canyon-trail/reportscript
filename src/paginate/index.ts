import { TextCell } from "../types";
import { getPageDimensions, margin } from "../measure";
import _ from "lodash";
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
  footerSpace: number;
  headerSpace: number;
};
export type TableSplitResult = {
  first: MeasuredTable;
  rest: MeasuredTable;
};
export type TextTemplateVariables = {
  documentPageNumber: number;
  documentPageCount: number;
  sectionPageNumber: number;
  sectionPageCount: number;
  currentSection: number;
  timestamp: string;
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
    const paginated = paginateSection(currentSection, remainingSpace);
    currentPage.rows = [...currentPage.rows, ...paginated];
    currentSection?.watermark &&
      (currentPage.watermark = currentSection.watermark);
    if (doc.remaining.length > 0) {
      doc.pages.push({ rows: [], sectionIndex: doc.remaining[0].index });
    }
  }
}

function prepareDoc(doc: MeasuredDocument): PaginatingDoc {
  const headerSpace = handleHeaderFooterSpace(doc.headers);
  const footerSpace = handleHeaderFooterSpace(doc.footers);
  return {
    ...doc,
    pages: [{ rows: [], sectionIndex: 0 }],
    remaining: [...doc.sections],
    headerSpace,
    footerSpace,
  };
}

export function handleHeaderFooterSpace(measuredRows: MeasuredRow[]): number {
  return measuredRows.length > 0 ? margin + sumOfRowHeights(measuredRows) : 0;
}

function addHeadersAndFooters(doc: PaginatingDoc, creationDate: Date): void {
  const timestamp = `${creationDate.toLocaleString("en-US", {
    timeZone: "America/Chicago",
  })}`.split(/ GMT/)[0];
  const variables: TextTemplateVariables = {
    documentPageNumber: 0,
    documentPageCount: doc.pages.length,
    sectionPageNumber: 0,
    sectionPageCount: 0,
    currentSection: 0,
    timestamp: timestamp,
  };
  doc.pages.forEach((_, idx) => {
    handleHeaders(idx, doc);
    handleFooters(idx, doc, variables);
  });
}

function handleHeaders(index: number, doc: PaginatingDoc) {
  const page = doc.pages[index];
  if (doc.headerSpace > 0 && (doc.repeatReportHeaders || index === 0)) {
    page.rows.unshift({
      data: [],
      minHeight: margin,
      maxHeight: margin,
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
  textTemplateVariables: TextTemplateVariables
) {
  const page = doc.pages[index];

  const { pageInnerHeight } = getPageDimensions(doc.layout);

  if (doc.footerSpace > 0) {
    const usedSpace = sumOfRowHeights(page.rows);
    const marginSpace = pageInnerHeight - usedSpace - doc.footerSpace + margin;

    page.rows.push({
      data: [],
      minHeight: marginSpace,
      maxHeight: marginSpace,
      columnHeights: [],
      columnWidths: [],
      columnStarts: [],
    });
    updateTextTemplateVariables(index, doc, textTemplateVariables);

    const footers = doc.footers.map((x) =>
      handleFooter(x, textTemplateVariables)
    );
    page.rows.push(...footers);
  }
}

export function updateTextTemplateVariables(
  index: number,
  doc: PaginatingDoc,
  textTemplateVariables: TextTemplateVariables
): void {
  const page = doc.pages[index];
  textTemplateVariables.documentPageNumber = index + 1;
  textTemplateVariables.sectionPageNumber =
    textTemplateVariables.currentSection === page.sectionIndex
      ? textTemplateVariables.sectionPageNumber + 1
      : 1;
  textTemplateVariables.currentSection = page.sectionIndex;
  textTemplateVariables.sectionPageCount = doc.pages.filter(
    (x) => x.sectionIndex === textTemplateVariables.currentSection
  ).length;
}

export function handleFooter(
  row: MeasuredRow,
  variables: TextTemplateVariables
): MeasuredRow {
  return {
    ...row,
    data: row.data.map((cell) => {
      if ("template" in cell) {
        const { template, ...rest } = cell;
        return {
          ...rest,
          value: template.renderTemplate(variables),
        };
      } else {
        return cell;
      }
    }),
  };
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
      usedSpace += row.minHeight;
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
    if (row.columnHeights[columnIdx].minHeight <= availableSpace) {
      continue;
    }

    if (!table.columns[columnIdx].splitFn) {
      return false;
    }
  }

  const minHeight = table.measureTextHeight("X", 0, row);

  return availableSpace >= minHeight.maxHeight;
}

function splitRow(
  row: MeasuredRow,
  availableSpace: number,
  table: MeasuredTable
): [MeasuredRow, MeasuredRow] {
  const first: MeasuredRow = {
    ...row,
    data: [...row.data.map((x) => ({ ...x }))],
    columnHeights: [],
    minHeight: 0,
    maxHeight: 0,
  };
  const rest: MeasuredRow = {
    ...row,
    data: [...row.data.map((x) => ({ ...x }))],
    columnHeights: [],
    minHeight: 0,
    maxHeight: 0,
  };

  row.data.forEach((d, idx) => {
    const splitFn = table.columns[idx]?.splitFn;
    if ("chart" in d) {
      throw new Error("A cell cannot be split with a chart");
    }

    if (
      splitFn &&
      row.columnHeights[idx].maxHeight > availableSpace &&
      "value" in d
    ) {
      if (row.image) {
        throw new Error("A row cannot be split with an image");
      }

      const measure = (text: string) => table.measureTextHeight(text, idx, row);

      const [next, remaining] = splitFn(`${d.value}`, measure, availableSpace);

      (first.data[idx] as TextCell).value = next;
      first.columnHeights.push(measure(next));

      (rest.data[idx] as TextCell).value = remaining;
      rest.columnHeights.push(measure(remaining));
    }
  });
  const firstMinHeights = first.columnHeights.map((x) => x.minHeight);
  const firstMaxHeights = first.columnHeights.map((x) => x.maxHeight);
  const restMinHeights = rest.columnHeights.map((x) => x.minHeight);
  const restMaxHeights = rest.columnHeights.map((x) => x.maxHeight);

  first.minHeight = Math.max(...firstMinHeights);
  first.maxHeight = Math.max(...firstMaxHeights);
  rest.minHeight = Math.max(...restMinHeights);
  rest.maxHeight = Math.max(...restMaxHeights);
  return [first, rest];
}

function canFitRow(
  row: MeasuredRow,
  usedSpace: number,
  availableSpace: number
) {
  return row.minHeight + usedSpace <= availableSpace;
}

function canFitTable(table: MeasuredTable, availableSpace: number): boolean {
  return getTableHeight(table) <= availableSpace;
}

export function paginateSection(
  section: MeasuredSection,
  availableSpace: number
): MeasuredRow[] {
  const rows: MeasuredRow[] = [];

  const separationHeight = section?.tableGap ?? margin;
  const separationRow = {
    minHeight: separationHeight,
    maxHeight: separationHeight,
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

  const expandableRows = rows.filter(
    (x) =>
      !x.maxHeight && x.data.some((d) => "chart" in d && !d.chart.maxHeight)
  );

  const expandableRowCount = expandableRows.length;

  const totalExpandableSpace = availableSpace - sumOfRowHeights(rows);

  expandableRows.forEach((r) => {
    const expandableHeight =
      totalExpandableSpace / expandableRowCount + r.minHeight;

    r.minHeight = expandableHeight;
    r.maxHeight = expandableHeight;

    r.data.forEach((d) => {
      if ("chart" in d && !d.chart.maxHeight) {
        d.chart.maxHeight = expandableHeight;
      }
    });
  });

  return rows;
}

function sumOfRowHeights(rows: MeasuredRow[]): number {
  return _.chain(rows)
    .map((x) => x.minHeight)
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
