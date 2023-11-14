import PDFDocument from "pdfkit";
import {
  Cell,
  Image,
  ImageCell,
} from "../types";
import { SnapshottingDocument } from "../reportDocument";
import {
  calculateCellLeftCoords,
  defaultFontSize,
  lineGap,
  margin,
  textHPadding,
} from "../measure/measuring";
import {
  defaultBoldFace,
  defaultFontFace,
  getCellColor,
  getCellFont,
  bottomBorder,
  writeCellGrids,
  writeCellContents,
  writeRow,
  writeCellBackground,
  writeBorder,
  getTextYOffset,
  getImageXOffset,
  renderWatermark,
} from "./rendering";
import { calculateColumnWidths } from "../paginate/calculateColumnWidths";
import { MeasuredWatermark } from "../measure/types";
import { NormalizedColumnSetting, NormalizedRow } from "../normalize/types";
import { PaginatedRow } from "../paginate/types";

const mockMoveTo = jest.spyOn(PDFDocument.prototype, "moveTo");
const mockLineTo = jest.spyOn(PDFDocument.prototype, "lineTo");
const mockStroke = jest.spyOn(PDFDocument.prototype, "stroke");
const mockStrokeColor = jest.spyOn(PDFDocument.prototype, "strokeColor");
const mockFill = jest.spyOn(PDFDocument.prototype, "fill");
const mockRect = jest.spyOn(PDFDocument.prototype, "rect");
const mockText = jest.spyOn(PDFDocument.prototype, "text");
PDFDocument.prototype.image = jest.fn();
const mockImage = jest.spyOn(PDFDocument.prototype, "image");

describe("rendering functions", () => {
  describe("writeCellGrids", () => {
    const data = [
      { value: "hi", grid: true },
      { value: "hello", grid: true },
      { value: "world" },
      { value: "goodbye" },
    ];

    const columns: NormalizedColumnSetting[] = [
      { width: { value: 1, unit: "fr" } },
      { width: { value: 1.5, unit: "fr" } },
      { width: { value: 0.5, unit: "fr" } },
    ];
    const rowHeight = 130;
    const image = { height: 100 };
    const dataHeight = rowHeight - image.height;

    const row = {
      image,
      data,
      height: rowHeight,
      start: margin,

      columnWidths: calculateColumnWidths(columns, 756),
      columnStarts: calculateCellLeftCoords(
        calculateColumnWidths(columns, 756)
      ),
    } as PaginatedRow;

    const rowWidth = calculateColumnWidths(columns, 756);
    beforeEach(() => {
      const pdfDoc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
      const doc = new SnapshottingDocument(pdfDoc);
      writeCellGrids(row, doc, 0);
    });
    it("calls stroke for each line", () => {
      expect(mockStroke).toBeCalledTimes(4);
    });
    it("uses black color", () => {
      expect(mockStrokeColor).toBeCalledTimes(1);
      expect(mockStrokeColor).toBeCalledWith("black");
    });
    it("draws column top border", () => {
      expect(mockMoveTo).nthCalledWith(1, margin, margin);
      expect(mockLineTo).nthCalledWith(1, margin + rowWidth[0], margin);
    });
    it("draws column bottom border", () => {
      expect(mockMoveTo).nthCalledWith(2, margin, margin + dataHeight);
      expect(mockLineTo).nthCalledWith(
        2,
        margin + rowWidth[0],
        margin + dataHeight
      );
    });
    it("draws column left border", () => {
      expect(mockMoveTo).nthCalledWith(3, margin, margin);
      expect(mockLineTo).nthCalledWith(3, margin, margin + dataHeight);
    });
    it("draws column right border", () => {
      expect(mockMoveTo).nthCalledWith(4, margin + rowWidth[0], margin);
      expect(mockLineTo).nthCalledWith(
        4,
        margin + rowWidth[0],
        margin + dataHeight
      );
    });
  });
  describe("writeBorder", () => {
    const data = [{ value: "hi" }];

    const columns: NormalizedColumnSetting[] = [
      { width: { value: 1, unit: "fr" } },
    ];
    const rowHeight = 130;
    const image = { height: 100 };
    const dataHeight = rowHeight - image.height;

    const row = {
      image,
      data,
      height: rowHeight,
      start: margin,
      options: { border: true },
      columnWidths: calculateColumnWidths(columns, 756),
    } as PaginatedRow;

    const rowWidth = calculateColumnWidths(columns, 756);
    beforeEach(() => {
      const pdfDoc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
      const doc = new SnapshottingDocument(pdfDoc);
      writeBorder(row, doc);
    });

    it("draws column top border", () => {
      expect(mockMoveTo).nthCalledWith(1, margin, margin);
      expect(mockLineTo).nthCalledWith(1, margin + rowWidth[0], margin);
    });
    it("draws column bottom border", () => {
      expect(mockMoveTo).nthCalledWith(2, margin, margin + dataHeight);
      expect(mockLineTo).nthCalledWith(
        2,
        margin + rowWidth[0],
        margin + dataHeight
      );
    });
    it("draws column left border", () => {
      expect(mockMoveTo).nthCalledWith(3, margin, margin);
      expect(mockLineTo).nthCalledWith(3, margin, margin + dataHeight);
    });
    it("draws column right border", () => {
      expect(mockMoveTo).nthCalledWith(4, margin + rowWidth[0], margin);
      expect(mockLineTo).nthCalledWith(
        4,
        margin + rowWidth[0],
        margin + dataHeight
      );
    });
  });
  describe("bottomBorder", () => {
    const data = [{ value: "test", bottomBorder: true }];
    const columns: NormalizedColumnSetting[] = [
      { width: { value: 1, unit: "fr" } },
    ];
    const columnWidths = calculateColumnWidths(columns, 756);
    const row = {
      data,
      height: 12,
      start: margin,
      columnWidths,
      columnStarts: calculateCellLeftCoords(columnWidths),
    } as PaginatedRow;

    beforeEach(() => {
      const pdfDoc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
      const doc = new SnapshottingDocument(pdfDoc);
      bottomBorder(row, doc, 0);
    });

    it("creates bottom border", () => {
      expect(mockMoveTo).nthCalledWith(1, margin, margin + 12);
      expect(mockLineTo).nthCalledWith(
        1,
        margin + columnWidths[0],
        margin + 12
      );
    });
  });

  describe("writeRowBackground", () => {
    const row = { start: margin, height: 15, data: [] } as PaginatedRow;

    let doc: SnapshottingDocument;

    beforeEach(() => {
      doc = new SnapshottingDocument(
        new PDFDocument({
          layout: "landscape",
          margin: 0,
          bufferPages: true,
        })
      );
    });

    it("does nothing if striped or backgroundColor not included in options", () => {
      writeCellBackground(row, doc, 0);
      expect(mockRect).not.toHaveBeenCalled();
    });

    it("uses specified background color", () => {
      const data = [{ value: "", backgroundColor: "green" }];
      const columns: NormalizedColumnSetting[] = [
        { width: { value: 1, unit: "fr" } },
      ];
      writeCellBackground(
        {
          ...row,
          data,
          columnWidths: calculateColumnWidths(columns, 756),
          columnStarts: calculateCellLeftCoords(
            calculateColumnWidths(columns, 756)
          ),
        },
        doc,
        0
      );
      expect(mockFill).toHaveBeenCalledWith("green");
    });
  });

  describe("cell Color", () => {
    it("calculators cell color using value, index, and optional cell color function", () => {
      const args = [
        { cell: { value: 1 }, expected: "black" },
        {
          cell: { value: -1, color: "red" },
          expected: "red",
        },
      ];

      args.forEach(({ cell, expected }) => {
        expect(getCellColor(cell)).toBe(expected);
      });
    });
  });

  describe("getCellFont", () => {
    it("calculators cell font face using value, and optional bold function", () => {
      const value = 0;

      const args = [
        {
          cell: { value: value, bold: value > 0 },
          expected: defaultFontFace,
        },
        {
          cell: { value: value, bold: value == 0 },
          expected: defaultBoldFace,
        },
        {
          cell: { value: value, bold: value == 0 },
          expected: defaultBoldFace,
        },
      ];

      args.forEach(({ cell, expected }) => {
        expect(getCellFont(cell)).toBe(expected);
      });
    });

    it("returns bold font if row bold option is true", () => {
      const args = [
        { cell: { value: 0 }, expected: defaultFontFace },
        {
          cell: { value: 1, bold: false },
          expected: defaultFontFace,
        },
        {
          cell: { value: 2, bold: true },
          expected: defaultBoldFace,
        },
      ];

      args.forEach(({ cell, expected }) => {
        expect(getCellFont(cell)).toBe(expected);
      });
    });
  });

  describe("writeColumnText", () => {
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
          { value: "world", columnSpan: 1, align: "left" },
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
        height: 12,
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

  describe("writeRow", () => {
    let doc: SnapshottingDocument;
    const buffer = Buffer.from([1, 2, 3]);
    const start = margin;
    const imageHeight = 100;
    const rowHeight = 130;

    beforeEach(async () => {
      doc = new SnapshottingDocument(
        new PDFDocument({
          layout: "landscape",
          margin: 0,
          bufferPages: true,
        })
      );

      const image = { height: imageHeight, image: buffer };
      const row: NormalizedRow = {
        data: [
          { value: "hello", columnSpan: 1 },
          { value: "world", columnSpan: 1 },
        ],
      };
      const columns: NormalizedColumnSetting[] = [
        { width: { value: 1, unit: "fr" } },
        { width: { value: 0.5, unit: "fr" }, align: "left" },
      ];
      const paginatedRow = {
        ...row,
        image,
        start,
        height: rowHeight,
        columnWidths: calculateColumnWidths(columns, 756),
        columnStarts: calculateCellLeftCoords(
          calculateColumnWidths(columns, 756)
        ),
      } as PaginatedRow;

      writeRow(paginatedRow, doc);
    });

    it("writes image", () => {
      expect(mockImage).toBeCalledWith(
        buffer,
        margin,
        start + rowHeight - imageHeight + 2,
        { height: imageHeight }
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
      const cell = { image, align: "center" } as ImageCell;

      const result = getImageXOffset(cell, maxContentWidth);
      expect(result).toBe(10);
    });

    it("returns right setting offset if align is right", () => {
      const cell = { image, align: "right" } as ImageCell;

      const result = getImageXOffset(cell, maxContentWidth);
      expect(result).toBe(20 - textHPadding);
    });
  });

  describe("renderWatermark", () => {
    const watermark: MeasuredWatermark = {
      text: "watermark",
      color: "black",
      fontFace: "Helvetica",
      fontSize: 108,
      x: margin,
      y: 252,
      origin: [396, 306],
    };
    beforeEach(() => {
      const doc = new SnapshottingDocument(
        new PDFDocument({
          layout: "landscape",
          margin: 0,
          bufferPages: true,
        })
      );

      renderWatermark(watermark, doc);
    });
    it("calls text", () => {
      expect(mockText).nthCalledWith(1, "watermark", margin, 252, {
        align: "center",
      });
    });
  });
});
