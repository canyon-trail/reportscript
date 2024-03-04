import { normalizeWatermark } from ".";
import { Section, FontSetting, Watermark, Table } from "types";
import { normalizedColumnSetting } from "./normalizeColumnSetting";
import { normalizeRow } from "./normalizeRow";
import { NormalizedSection, NormalizedTable } from "./types";
import { normalizeHeaders } from "./normalizeHeaderAndFooter";

export function normalizeSection(
  section: Section,
  normalizedFontSetting: FontSetting,
  tableGap?: number,
  docWatermark?: Watermark
): NormalizedSection {
  const { headers, tables, watermark } = section;
  const sectionWatermark = watermark ?? docWatermark;
  return {
    tableGap: tableGap ?? undefined,
    ...section,
    headers: normalizeHeaders(headers, normalizedFontSetting),
    tables: tables.map((table) => normalizeTable(table, normalizedFontSetting)),
    watermark: normalizeWatermark(sectionWatermark, normalizedFontSetting),
  };
}

export function normalizeTable(
  table: Table,
  normalizedFontSetting: FontSetting
): NormalizedTable {
  const { rows, headers, columns, style } = table;
  const normalizedStyle = { ...normalizedFontSetting, ...style };
  const settings = normalizedColumnSetting(rows, columns);
  return {
    rows: rows.map((r) => normalizeRow(r, normalizedStyle, settings)),
    headers: headers
      ? headers.map((h) => normalizeRow(h, normalizedStyle, settings))
      : [],
    columns: settings,
  };
}
