import { getPageDimensions, margin } from "../measure";
import _ from "lodash";
import {
  MeasuredDocument,
  MeasuredRow,
  MeasuredSection,
  MeasuredTable,
} from "../measure/types";
import { Page, PaginatedDocument } from "./types";
import { TextTemplateVariables } from "../types";
import { splitSection } from "./splitSection";
export type PaginatingDoc = MeasuredDocument & {
  remaining: MeasuredSection[];
  pages: Page[];
  footerSpace: number;
  headerSpace: number;
};
export type PaginationTextTemplateVariables = TextTemplateVariables & {
  currentSection: number;
};
export function paginate(
  doc: MeasuredDocument,
  creationDate: Date
): PaginatedDocument {
  const pagingDoc = prepareDoc(doc);
  while (pagingDoc.remaining.length > 0) {
    paginateStep(pagingDoc);
  }

  handlePages(pagingDoc, creationDate);
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

function handlePages(doc: PaginatingDoc, creationDate: Date): void {
  const timestamp = `${creationDate.toLocaleString("en-US", {
    timeZone: "America/Chicago",
  })}`.split(/ GMT/)[0];
  const variables: PaginationTextTemplateVariables = {
    documentPageNumber: 0,
    documentPageCount: doc.pages.length,
    sectionPageNumber: 0,
    sectionPageCount: 0,
    currentSection: 0,
    timestamp: timestamp,
  };
  doc.pages.forEach((page, idx) => {
    handleHeaders(idx, doc);
    handleFooters(idx, doc);
    updateTextTemplateVariables(idx, doc, variables);
    doc.pages[idx] = handleTemplatePerPage(page, variables);
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

function handleFooters(index: number, doc: PaginatingDoc) {
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

    page.rows.push(...doc.footers);
  }
}

export function updateTextTemplateVariables(
  index: number,
  doc: PaginatingDoc,
  textTemplateVariables: PaginationTextTemplateVariables
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

function handleTemplatePerPage(
  page: Page,
  variables: PaginationTextTemplateVariables
): Page {
  const { rows } = page;
  return {
    ...page,
    rows: rows.map((row) => {
      return handleTemplate(row, variables);
    }),
  };
}

export function handleTemplate(
  row: MeasuredRow,
  variables: PaginationTextTemplateVariables
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

export function getTableHeight(table: MeasuredTable): number {
  const rowHeight = sumOfRowHeights(table.rows);

  const headerHeight = sumOfRowHeights(table.headers);

  return rowHeight + headerHeight;
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

export function sumOfRowHeights(rows: MeasuredRow[]): number {
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
