import _ from "lodash";
import {
  Document,
  PageBreakRows,
  FontSetting,
  Watermark,
  DocumentWithSections,
} from "../types";
import { NormalizedDocument, NormalizedPageBreakRows } from "./types";

import { normalizeRow } from "./normalizeRow";
import { normalizedColumnSetting } from "./normalizeColumnSetting";
import { normalizeSection } from "./normalizeSection";
import {
  normalizeDocumentFooter,
  normalizeHeaders,
} from "./normalizeHeaderAndFooter";
import { defaultFontFace, defaultBoldFace } from "./testDefaultVariables";

export function normalize(document: Document): NormalizedDocument {
  const documentProps = getDocumentProps(document);

  const {
    headers,
    sections,
    pageBreakRows,
    defaultFontSettings,
    watermark,
    tableGap,
  } = documentProps;
  const normalizedFontSetting = normalizeFontSetting(defaultFontSettings);

  return {
    ...documentProps,
    headers: normalizeHeaders(headers, normalizedFontSetting),
    sections: sections.map((section) =>
      normalizeSection(section, normalizedFontSetting, tableGap, watermark)
    ),
    footers: normalizeDocumentFooter(normalizedFontSetting, document),
    pageBreakRows: normalizePageBreakRows(pageBreakRows, normalizedFontSetting),
  };
}

export function normalizeFontSetting(
  documentFontSetting: FontSetting
): FontSetting {
  return {
    ...documentFontSetting,
    fontFace: documentFontSetting?.fontFace ?? defaultFontFace,
    boldFace: documentFontSetting?.boldFace ?? defaultBoldFace,
  };
}

export function normalizePageBreakRows(
  pageBreakRow: PageBreakRows,
  normalizedFontSetting: FontSetting
): NormalizedPageBreakRows | undefined {
  if (!pageBreakRow) return undefined;
  const { rows, columns, style } = pageBreakRow;
  const normalizedStyle = { ...normalizedFontSetting, ...style };
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, normalizedStyle, settings)),
    columns: settings,
  };
}

export function normalizeWatermark(
  watermark: Watermark,
  fontSetting: FontSetting
): Watermark {
  return watermark
    ? {
        fontFace: fontSetting?.fontFace,
        color: fontSetting?.color,
        ...watermark,
      }
    : undefined;
}

function getDocumentProps(document: Document): DocumentWithSections {
  return "sections" in document
    ? document
    : { sections: [{ tables: document.tables }] };
}
