import PDFDocument from "pdfkit";
import { Cell, Image, ImageCell } from "../types";
import { SnapshottingDocument } from "../reportDocument";
import { calculateColumnWidths } from "../paginate/calculateColumnWidths";
import { NormalizedColumnSetting, NormalizedRow } from "../normalize/types";
import { PaginatedRow } from "../paginate/types";
import { calculateCellLeftCoords } from "../measure/measureRowAndCell";
import {
  margin,
  textHPadding,
  defaultFontSize,
  lineGap,
} from "../measure/defaultMeasurement";
import {
  getImageXOffset,
  getTextYOffset,
  writeCellContents,
} from "./writeCellContents";
const mockText = jest.spyOn(PDFDocument.prototype, "text");

describe("writeCellContent", () => {
  let doc: SnapshottingDocument;
  let columnWidths: number[];

  const longString = "hello world hello world hello world hello world";

  beforeEach(() => {
    doc = new SnapshottingDocument(
      new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      })
    );
    const row: NormalizedRow = {
      data: [
        { value: "hello", columnSpan: 1 },
        { value: "world", columnSpan: 1, horizontalAlign: "left" },
        { value: "hello\t", columnSpan: 1 },
        { value: longString, columnSpan: 1, noWrap: true },
        { value: 8, columnSpan: 1 },
      ],
    };
    const column: NormalizedColumnSetting[] = [
      { width: { value: 1, unit: "fr" } },
      { width: { value: 0.5, unit: "fr" }, align: "left" },
      { width: { value: 1, unit: "fr" } },
      { width: { value: 1, unit: "fr" } },
    ];
    columnWidths = calculateColumnWidths(column, 756);
    const pagedRow = {
      ...row,
      start: margin,
      maxHeight: 12,
      columnWidths,
      columnStarts: calculateCellLeftCoords(columnWidths),
    } as PaginatedRow;

    writeCellContents(0, pagedRow, doc);
    writeCellContents(1, pagedRow, doc);
    writeCellContents(2, pagedRow, doc);
    writeCellContents(3, pagedRow, doc);
  });

  it("writes first column text", () => {
    expect(mockText).nthCalledWith(
      1,
      "hello",
      margin + textHPadding,
      margin + lineGap,
      { width: columnWidths[0] - textHPadding * 2, align: "center", lineGap }
    );
  });

  it("writes second column text", () => {
    expect(mockText).nthCalledWith(
      2,
      "world",
      margin + columnWidths[0] + textHPadding,
      margin + lineGap,
      { width: columnWidths[1] - textHPadding * 2, align: "left", lineGap }
    );
  });
  it("writes text with tab", () => {
    expect(mockText).nthCalledWith(
      3,
      "hello    ",
      margin + columnWidths[0] + columnWidths[1] + textHPadding,
      margin + lineGap,
      { width: columnWidths[2] - textHPadding * 2, align: "center", lineGap }
    );
  });
  it("writes text with noWrap", () => {
    expect(mockText).nthCalledWith(
      4,
      longString,
      margin +
        columnWidths[0] +
        columnWidths[1] +
        columnWidths[2] +
        textHPadding,
      margin + lineGap,
      {
        width: columnWidths[2] - textHPadding * 2,
        align: "center",
        lineGap,
        height: defaultFontSize,
        ellipsis: true,
      }
    );
  });
});
describe("getTextYOffset", () => {
  const cellHeight = 10;
  const rowHeight = 20;

  it("returns 0 if vertical align is undefined or top", () => {
    const options = [undefined, "top"];

    options.forEach((o) => {
      const cell = { verticalAlign: o } as Cell;
      const result = getTextYOffset(cell, 10, 10);

      expect(result).toBe(0);
    });
  });

  it("adds centering offset if vertical align is center", () => {
    const cell = { verticalAlign: "center" } as Cell;

    const result = getTextYOffset(cell, cellHeight, rowHeight);
    expect(result).toBe(5 + lineGap * 0.5);
  });

  it("adds bottom setting offset if vertical align is bottom", () => {
    const cell = { verticalAlign: "bottom" } as Cell;

    const result = getTextYOffset(cell, cellHeight, rowHeight);
    expect(result).toBe(10);
  });
});

describe("getImageXOffset", () => {
  const maxContentWidth = 100;
  const image = { width: 80 } as Image;

  it("returns 0 if align is undefined or left", () => {
    const cell = { image } as ImageCell;

    const result = getImageXOffset(cell, maxContentWidth);
    expect(result).toBe(0);
  });

  it("returns centering offset if align is center", () => {
    const cell = { image, horizontalAlign: "center" } as ImageCell;

    const result = getImageXOffset(cell, maxContentWidth);
    expect(result).toBe(10);
  });

  it("returns right setting offset if align is right", () => {
    const cell = { image, horizontalAlign: "right" } as ImageCell;

    const result = getImageXOffset(cell, maxContentWidth);
    expect(result).toBe(20 - textHPadding);
  });
});
