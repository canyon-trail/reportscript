import { rs } from "../rs";
import { HeaderFooters, FontSetting, Document } from "types";
import { TextTemplate } from "types/textTemplate";
import { normalizedColumnSetting } from "./normalizeColumnSetting";
import { normalizeRow } from "./normalizeRow";
import { NormalizedHeaderFooter, NormalizedColumnSetting } from "./types";

export function normalizeHeaders(
  headerFooter: HeaderFooters,
  normalizedFontSetting: FontSetting
): NormalizedHeaderFooter {
  if (!headerFooter) return { rows: [] };
  const { rows, columns, style } = headerFooter;
  const normalizedStyle = { ...normalizedFontSetting, ...style };
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, normalizedStyle, settings)),
    columns: settings,
  };
}
export function normalizeDocumentFooter(
  normalizedFontSetting: FontSetting,
  document: Document
): NormalizedHeaderFooter {
  const { footers, timestamp, pageNumbers, sectionPageNumbers } = document;
  const timeStampPageNumTemplate = normalizeDocPageNumTimestamp(
    sectionPageNumbers,
    pageNumbers,
    timestamp
  );

  if (footers && timeStampPageNumTemplate) {
    throw new Error(
      "Cannot set footer, and pageNumber || timestamp || sectionPageNumber at the same time. Please use TextTemplateCell to set pageNumber || timestamp || sectionPageNumber"
    );
  }
  if (timeStampPageNumTemplate) {
    const pageNumTimeStampColumnSetting: NormalizedColumnSetting = {
      align: "right",
      width: { value: 1, unit: "fr" },
    };
    const normalizedTemplateRow = normalizeRow(
      { data: [{ template: timeStampPageNumTemplate }] },
      normalizedFontSetting,
      [pageNumTimeStampColumnSetting]
    );
    return {
      rows: [normalizedTemplateRow],
      columns: [pageNumTimeStampColumnSetting],
    };
  }
  if (footers) {
    const { rows, columns, style } = footers;
    const normalizedSettings = normalizedColumnSetting(rows, columns);
    const normalizedStyle = { ...normalizedFontSetting, ...style };
    const normalizedRows = rows.map((r) =>
      normalizeRow(r, normalizedStyle, normalizedSettings)
    );
    return {
      rows: normalizedRows,
      columns: normalizedSettings,
    };
  }
  return { rows: [] };
}
export function normalizeDocPageNumTimestamp(
  sectionPageNumbers: boolean,
  pageNumbers: boolean,
  timestamp: boolean
): TextTemplate | undefined {
  if (sectionPageNumbers && pageNumbers) {
    throw new Error(
      "A document cannot have both pageNumbers and sectionPageNumbers set to true"
    );
  }

  if (timestamp) {
    if (sectionPageNumbers) {
      return rs`{{timestamp}} Page {{sectionPageNumber}} of {{sectionPageCount}}`;
    } else if (pageNumbers) {
      return rs`{{timestamp}} Page {{documentPageNumber}} of {{documentPageCount}}`;
    } else {
      return rs`{{timestamp}}`;
    }
  } else {
    if (sectionPageNumbers) {
      return rs`Page {{sectionPageNumber}} of {{sectionPageCount}}`;
    } else if (pageNumbers) {
      return rs`Page {{documentPageNumber}} of {{documentPageCount}}`;
    }
  }
  return undefined;
}
