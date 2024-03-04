import PDFDocument from "pdfkit";
import { SnapshottingDocument } from "../reportDocument";

import {
  getCellColor,
  getCellFont,
  bottomBorder,
  writeCellGrids,
  writeRow,
  writeCellBackground,
  writeBorder,
} from ".";
import { calculateColumnWidths } from "../paginate/calculateColumnWidths";
import { NormalizedColumnSetting, NormalizedRow } from "../normalize/types";
import { PaginatedRow } from "../paginate/types";
import { calculateCellLeftCoords } from "../measure/measureRowAndCell";
import { margin } from "../measure/defaultMeasurement";
import {
  defaultBoldFace,
  defaultFontFace,
} from "../normalize/testDefaultVariables";

const mockMoveTo = jest.spyOn(PDFDocument.prototype, "moveTo");
const mockLineTo = jest.spyOn(PDFDocument.prototype, "lineTo");
const mockStroke = jest.spyOn(PDFDocument.prototype, "stroke");
const mockStrokeColor = jest.spyOn(PDFDocument.prototype, "strokeColor");
const mockFill = jest.spyOn(PDFDocument.prototype, "fill");
const mockRect = jest.spyOn(PDFDocument.prototype, "rect");
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
      maxHeight: rowHeight,
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
      maxHeight: rowHeight,
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
      maxHeight: 12,
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
    const row = { start: margin, maxHeight: 15, data: [] } as PaginatedRow;

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
          cell: {
            value: value,
            bold: value > 0,
            boldFace: defaultBoldFace,
            fontFace: defaultFontFace,
          },
          expected: defaultFontFace,
        },
        {
          cell: {
            value: value,
            bold: value == 0,
            boldFace: defaultBoldFace,
            fontFace: defaultFontFace,
          },
          expected: defaultBoldFace,
        },
      ];

      args.forEach(({ cell, expected }) => {
        expect(getCellFont(cell)).toBe(expected);
      });
    });

    it("returns bold font if row bold option is true", () => {
      const args = [
        {
          cell: {
            value: 0,
            boldFace: defaultBoldFace,
            fontFace: defaultFontFace,
          },
          expected: defaultFontFace,
        },
        {
          cell: {
            value: 1,
            bold: false,
            boldFace: defaultBoldFace,
            fontFace: defaultFontFace,
          },
          expected: defaultFontFace,
        },
        {
          cell: {
            value: 2,
            bold: true,
            boldFace: defaultBoldFace,
            fontFace: defaultFontFace,
          },
          expected: defaultBoldFace,
        },
      ];

      args.forEach(({ cell, expected }) => {
        expect(getCellFont(cell)).toBe(expected);
      });
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
          {
            value: "hello",
            columnSpan: 1,
            fontFace: defaultFontFace,
            boldFace: defaultBoldFace,
          },
          {
            value: "world",
            columnSpan: 1,
            fontFace: defaultFontFace,
            boldFace: defaultBoldFace,
          },
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
        maxHeight: rowHeight,
        columnWidths: calculateColumnWidths(columns, 756),
        columnStarts: calculateCellLeftCoords(
          calculateColumnWidths(columns, 756)
        ),
      } as PaginatedRow;

      await writeRow(paginatedRow, doc);
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
});
