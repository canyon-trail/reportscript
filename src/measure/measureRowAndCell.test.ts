import { Cell, TextCell } from "../types";
import PDFDocument from "pdfkit";
import { Image } from "../types";
import { NormalizedRow } from "../normalize/types";
import { rs } from "../rs/index";
import { margin } from "./defaultMeasurement";
import { lineGap } from "./defaultMeasurement";
import {
  getRowHeight,
  measureCellHeights,
  getCellHeightWithText,
  getCellHeight,
  calculateCellLeftCoords,
  getColumnWidthsForRow,
  getPageDimensions,
} from "./measureRowAndCell";
describe("measure row functions", () => {
  describe("getRowHeight", () => {
    let doc;
    beforeEach(() => {
      doc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
    });

    it("returns the min height as font size plus half lineGap and max height as height of largest string plus half lineGap", () => {
      const longString =
        "this is a really really really really really really long column string";

      const data = [
        { value: "hello", columnSpan: 1 },
        { value: longString, columnSpan: 1 },
        { value: "world", columnSpan: 1 },
        { value: "d", columnSpan: 1 },
        { value: "e", columnSpan: 1 },
        { value: "test", columnSpan: 1 },
        { value: "hello world", columnSpan: 1 },
      ];

      const fontSize = 8;

      const row: NormalizedRow = {
        data,
        options: { fontSize },
      };
      const columnWidth = new Array(7).fill(756 / 7);
      const result = getRowHeight(row, doc, columnWidth);

      const expectedHeight =
        doc.heightOfString(longString, {
          width: 756 / 7,
          lineGap,
          align: "center",
        }) +
        lineGap * 0.5;

      expect(result).toEqual({
        maxHeight: expectedHeight,
        minHeight: expectedHeight,
      });
    });

    it("includes height of image", () => {
      const data: Cell[] = [
        { value: "hello", columnSpan: 1 },
        { value: "world", columnSpan: 1 },
      ];

      const fontSize = 8;

      const image = { height: 100 } as Image;
      const row: NormalizedRow = {
        image,
        data,
        options: { fontSize },
      };
      const columnWidth = new Array(2).fill(756 / 2);
      const result = getRowHeight(row, doc, columnWidth);

      const expected =
        doc.heightOfString("hello", {
          width: 756 / 7,
          lineGap,
          align: "center",
        }) +
        lineGap * 0.5 +
        image.height;

      expect(result).toEqual({
        minHeight: expected,
        maxHeight: expected,
      });
    });

    it("sets maxHeight to undefined with an expandable chart (undefined maxHeight)", () => {
      const data: Cell[] = [
        { value: "hello", columnSpan: 1 },
        { value: "world", columnSpan: 1 },
        {
          chart: {
            config: {
              type: "bar",
              data: {
                labels: ["test"],
                datasets: [
                  {
                    label: "test",
                    data: [12],
                  },
                ],
              },
            },
            minHeight: 200,
          },
        },
      ];

      const fontSize = 8;

      const row: NormalizedRow = {
        data,
        options: { fontSize },
      };

      const columnWidth = new Array(2).fill(756 / 2);
      const result = getRowHeight(row, doc, columnWidth);

      expect(result).toEqual({
        minHeight: 200 + lineGap * 2,
        maxHeight: undefined,
      });
    });
  });

  describe("getCellHeightWithText", () => {
    let doc;

    beforeEach(() => {
      doc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
    });

    it("returns the height of each column", () => {
      const longString =
        "this is a really really really really really really long column string";

      const data = [
        { value: "hello", columnSpan: 1 },
        { value: longString, columnSpan: 1 },
        { value: "world", columnSpan: 1 },
        { value: "d", columnSpan: 1 },
        { value: "e", columnSpan: 1 },
        { value: "test", columnSpan: 1 },
        { value: "hello world", columnSpan: 1 },
      ];

      const fontSize = 8;

      const row = {
        data,
        options: { fontSize },
      };
      const columnWidth = new Array(7).fill(756 / 7);
      const result = measureCellHeights(row, doc, columnWidth);

      const expected = data.map((d, idx) =>
        getCellHeightWithText(row, idx, doc, d.value, columnWidth)
      );

      expect(result).toEqual(expected);
    });
  });

  describe("getCellHeight", () => {
    let doc;
    beforeEach(() => {
      doc = new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      });
    });

    it("uses image height if defined", () => {
      const cell = { image: { height: 40, width: 40 }, lineGap: 1 } as Cell;
      const result = getCellHeight(cell, 100, doc).maxHeight;

      expect(result).toBe(40 + lineGap + 1);
    });
    it("get text template cell Height ", () => {
      const cell: Cell = {
        template: rs`Page {{documentPageNumber}} of {{documentPageCount}}`,
        columnSpan: 1,
        fontSize: 10,
      };
      const options = {
        width: 50,
        lineGap,
        align: cell.horizontalAlign,
        height: 10,
      };
      const result = getCellHeight(cell, 50, doc);

      const highBound =
        doc.heightOfString("Page 1000 of 1000", options) + lineGap * 0.5;
      expect(result).toStrictEqual({
        minHeight: highBound,
        maxHeight: highBound,
      });
    });
    it("throws for undefined cell", () => {
      expect(() => getCellHeight(undefined, 100, doc)).toThrow(
        "Cell is undefined"
      );
    });

    it("returns height of single line of text when noWrap true", () => {
      const longString =
        "this is a really really really really really really long column string";
      const cell = {
        value: longString,
        noWrap: true,
        columnSpan: 1,
        fontSize: 10,
      } as TextCell;
      const result = getCellHeight(cell, 20, doc).maxHeight;

      const expected =
        doc.heightOfString("X", {
          width: 20,
          lineGap,
          align: cell.horizontalAlign,
          height: 10,
        }) +
        lineGap * 0.5;

      expect(result).toBe(expected);
    });
    it("returns height of single line of text", () => {
      const string = "this";
      const cell = {
        value: string,
        columnSpan: 1,
        fontSize: 10,
      } as TextCell;
      const result = getCellHeight(cell, 20, doc).maxHeight;

      const expected =
        doc.heightOfString("X", {
          width: 20,
          lineGap,
          align: cell.horizontalAlign,
          height: 10,
        }) +
        lineGap * 0.5;

      expect(result).toBe(expected);
    });
  });

  describe("calculateCellLeftCoords", () => {
    it("measures column starts with no setting", () => {
      const columnWidths = [100, 200, 300];
      expect(calculateCellLeftCoords(columnWidths)).toEqual([
        margin,
        margin + 100,
        margin + 100 + 200,
      ]);
    });
  });

  describe("getColumnWidthsForRow", () => {
    it(" does not adjust when widths has no cell span", () => {
      const widths = [100, 100, 100];
      const row: NormalizedRow = {
        data: [
          {
            columnSpan: 1,
            value: "column 1",
          },
          {
            columnSpan: 1,
            value: "column 2",
          },
          {
            columnSpan: 1,
            value: "column 3",
          },
        ],
      };
      expect(getColumnWidthsForRow(widths, row)).toEqual([100, 100, 100]);
    });
    it("adjust when widths has cell span", () => {
      const widths = [100, 100, 100];
      const row: NormalizedRow = {
        data: [
          {
            columnSpan: 2,
            value: "column 1",
          },
          {
            columnSpan: 1,
            value: "column 2",
          },
        ],
      };
      expect(getColumnWidthsForRow(widths, row)).toEqual([200, 100]);
    });
  });
  describe("getPageDimensions", () => {
    it("return default landscape dimensions", () => {
      expect(getPageDimensions()).toEqual({
        pageHeight: 612,
        pageWidth: 792,
        availableWidth: 756,
        pageInnerHeight: 576,
      });
    });
    it("return landscape dimensions", () => {
      expect(getPageDimensions("landscape")).toEqual({
        pageHeight: 612,
        pageWidth: 792,
        availableWidth: 756,
        pageInnerHeight: 576,
      });
    });
    it("return portrait dimensions", () => {
      expect(getPageDimensions("portrait")).toEqual({
        pageWidth: 612,
        pageHeight: 792,
        pageInnerHeight: 756,
        availableWidth: 576,
      });
    });
  });
});
