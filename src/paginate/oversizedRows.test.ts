import PDFDocument from "pdfkit";
import { Document } from "../types";
import { MeasuredRow } from "../measure/types";
import { normalize } from "../normalize";
import { measure } from "../measure";
import { paginate } from "./index";

/**
 * These tests cover the termination-critical behavior for rows that are too
 * tall to fit a page. The pagination loop must always make forward progress:
 * every step either commits a row to a page or starts a fresh page for
 * deferred content. A step that re-queues its input unchanged is the defect
 * under test.
 *
 * `paginate` has a built-in forward-progress guard: a stalled loop throws
 * rather than hanging, so these tests can drive the public entry point
 * directly and a regression surfaces as a fast, clear failure.
 */

const creationDate = new Date("July 20, 69 00:20:18 GMT+00:00");

/** First cell's text for a paginated row, or "" if it has no text data. */
const firstCellText = (row: MeasuredRow): string => {
  const cell = row.data?.[0];
  return cell && "value" in cell ? String(cell.value ?? "") : "";
};

// Every `normalRow` leads with this date cell, so committed rows carrying it
// are exactly the table data rows -- distinct from section/table headers, gap
// rows, and page-number rows, which the paginator also emits.
const DATA_ROW_MARKER = "2026-05-03";

/** Drives the real normalize -> measure -> paginate pipeline. */
function runPaginate(document: Document): {
  pages: number;
  rowsPerPage: number[];
  /** Count of committed table data rows (identified by their date cell). */
  dataRowsCommitted: number;
  /** Count of committed rows stamped isOversized. */
  oversizedCommitted: number;
} {
  const pdfDoc = new PDFDocument({
    layout: document.layout ?? "landscape",
    margin: 0,
    bufferPages: true,
  });
  const measuredDoc = measure(normalize(document), pdfDoc as never);
  const result = paginate(measuredDoc, creationDate);

  const allRows = result.pages.flatMap((p) => p.rows);

  return {
    pages: result.pages.length,
    rowsPerPage: result.pages.map((p) => p.rows.length),
    dataRowsCommitted: allRows.filter(
      (r) => firstCellText(r) === DATA_ROW_MARKER
    ).length,
    oversizedCommitted: allRows.filter(
      (r) => (r as { isOversized?: boolean }).isOversized
    ).length,
  };
}

describe("pagination - oversized rows", () => {
  // ~250 newlines + a short trailing line. Mirrors the downstream
  // "all-expense-report" payload's pathological Notes cell: a user mashed
  // Enter in a notes field, producing a single cell taller than a whole page.
  const oversizedNotes =
    "\n".repeat(250) + "Company truck not available, used personal vehicle";

  // The downstream payload's 12 columns. Note: NO splitFn on any column, so
  // the oversized row is also unsplittable.
  const twelveColumns = [
    { width: "1.6 fr" },
    { width: "1 fr" },
    { width: "1.6 fr" },
    { width: "1.6 fr" },
    { width: "3.3 fr" },
    { width: "4.6 fr" },
    { width: "1 fr" },
    { width: "1 fr" },
    { width: "1 fr" },
    { width: "1 fr" },
    { width: "1 fr" },
    { width: "1 fr" },
  ];

  const headerRow = {
    data: [
      "Date",
      "PID",
      "EE Code",
      "Location",
      "Item Name",
      "Notes",
      "Meals",
      "Lodging",
      "Mlg",
      "Mlg Amt",
      "Fuel",
      "Other",
    ],
    options: { fontSize: 8 },
  };

  const normalRow = (notes: string) => ({
    data: [
      { value: "2026-05-03", bold: true },
      "1021390",
      "001686",
      "OK-CHEROKEE",
      { value: "MILEAGE", horizontalAlign: "left" as const },
      { value: notes, horizontalAlign: "left" as const },
      { value: "0.00", horizontalAlign: "right" as const },
      { value: "0.00", horizontalAlign: "right" as const },
      { value: "299.00", horizontalAlign: "right" as const },
      { value: "209.30", horizontalAlign: "right" as const },
      { value: "0.00", horizontalAlign: "right" as const },
      { value: "0.00", horizontalAlign: "right" as const },
    ],
    options: { fontSize: 7 },
  });

  const singleTableDoc = (rows: ReturnType<typeof normalRow>[]): Document =>
    ({
      repeatSectionHeaders: true,
      pageNumbers: true,
      sections: [
        {
          headers: {
            rows: [
              {
                data: [
                  { value: "OKLA", horizontalAlign: "left" },
                  { value: "Atkinson, Deanna" },
                  "",
                ],
              },
            ],
            style: { fontSize: 9, bold: true },
          },
          tables: [
            {
              headers: [headerRow],
              rows,
              columns: twelveColumns,
              style: { grid: true },
            },
          ],
        },
      ],
    } as unknown as Document);

  // The original reproduction: oversized cell in the middle of a table.
  it("terminates with one oversized, unsplittable Notes cell", () => {
    const result = runPaginate(
      singleTableDoc([
        normalRow("first note"),
        normalRow(oversizedNotes),
        normalRow("third note"),
      ])
    );
    expect(result.pages).toBeGreaterThan(1);
    // The oversized row is not dropped: all three data rows are committed,
    // exactly one of them stamped oversized.
    expect(result.dataRowsCommitted).toBe(3);
    expect(result.oversizedCommitted).toBe(1);
  });

  // Position of the oversized row in its table does not matter.
  it("terminates with the oversized row first in the table", () => {
    const result = runPaginate(
      singleTableDoc([
        normalRow(oversizedNotes),
        normalRow("second note"),
        normalRow("third note"),
      ])
    );
    expect(result.pages).toBeGreaterThan(1);
    expect(result.dataRowsCommitted).toBe(3);
    expect(result.oversizedCommitted).toBe(1);
  });

  it("terminates with the oversized row last in the table", () => {
    const result = runPaginate(
      singleTableDoc([
        normalRow("first note"),
        normalRow("second note"),
        normalRow(oversizedNotes),
      ])
    );
    expect(result.pages).toBeGreaterThan(1);
    expect(result.dataRowsCommitted).toBe(3);
    expect(result.oversizedCommitted).toBe(1);
  });

  // Multiple oversized rows are each force-placed independently.
  it("terminates with multiple oversized rows in one table", () => {
    const result = runPaginate(
      singleTableDoc([
        normalRow("first note"),
        normalRow(oversizedNotes),
        normalRow("third note"),
        normalRow(oversizedNotes),
        normalRow("fifth note"),
      ])
    );
    // Two oversized rows, each on its own page, plus pages for the normals.
    expect(result.pages).toBeGreaterThanOrEqual(3);
    // All five data rows committed; both oversized rows force-placed, not lost.
    expect(result.dataRowsCommitted).toBe(5);
    expect(result.oversizedCommitted).toBe(2);
  });

  // An oversized row in one table does not disturb sibling tables in the same
  // section.
  it("terminates with an oversized row in a multi-table section", () => {
    const document: Document = {
      repeatSectionHeaders: true,
      pageNumbers: true,
      sections: [
        {
          tables: [
            {
              headers: [headerRow],
              rows: [normalRow("table-1 row a"), normalRow("table-1 row b")],
              columns: twelveColumns,
              style: { grid: true },
            },
            {
              headers: [headerRow],
              rows: [normalRow(oversizedNotes), normalRow("table-2 row b")],
              columns: twelveColumns,
              style: { grid: true },
            },
            {
              headers: [headerRow],
              rows: [normalRow("table-3 row a")],
              columns: twelveColumns,
              style: { grid: true },
            },
          ],
        },
      ],
    } as unknown as Document;

    const result = runPaginate(document);
    expect(result.pages).toBeGreaterThan(1);
    // All five data rows across the three tables are committed; only the one
    // oversized row in table 2 is force-placed.
    expect(result.dataRowsCommitted).toBe(5);
    expect(result.oversizedCommitted).toBe(1);
  });

  // Negative case: a tall-but-not-oversized table (many normal rows) must
  // paginate normally -- deferred across pages, never force-placed/overflowed.
  it("paginates a tall table of normal rows without overflowing any of them", () => {
    const manyRows = Array.from({ length: 60 }, (_, i) =>
      normalRow(`note ${i}`)
    );
    const result = runPaginate(singleTableDoc(manyRows));

    expect(result.pages).toBeGreaterThan(1);
    // Every page holds more than one row: normal rows are packed, never each
    // forced alone (which is the oversized-overflow behavior).
    expect(Math.max(...result.rowsPerPage)).toBeGreaterThan(1);
    // All 60 rows committed; none force-placed as oversized.
    expect(result.dataRowsCommitted).toBe(60);
    expect(result.oversizedCommitted).toBe(0);
  });

  // repeatReportHeaders changes page geometry; termination must hold either way.
  it.each([true, false])(
    "terminates with repeatReportHeaders=%s",
    (repeatReportHeaders) => {
      const document: Document = {
        repeatReportHeaders,
        repeatSectionHeaders: true,
        headers: {
          rows: [{ data: [{ value: "Report Header" }] }],
        },
        sections: [
          {
            tables: [
              {
                headers: [headerRow],
                rows: [
                  normalRow("first note"),
                  normalRow(oversizedNotes),
                  normalRow("third note"),
                ],
                columns: twelveColumns,
                style: { grid: true },
              },
            ],
          },
        ],
      } as unknown as Document;

      const result = runPaginate(document);
      expect(result.pages).toBeGreaterThan(1);
    }
  );
});
