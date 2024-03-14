import { Cell } from "../types";
import PDFDocument from "pdfkit";
import { lineGap, margin } from ".";
import {
  getColumnWidthsForRow,
  calculateCellLeftCoords,
  getRowHeight,
} from "./measuredRows";
import { Image } from "../types";
import { NormalizedRow } from "../normalize/types";

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
