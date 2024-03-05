import { mockVariables } from "./normalize.test";
import { rs } from "../rs";
import { ImageCell, TextTemplateCell } from "../types";
import { normalizeCell } from "./normalizeCell";

describe("normalizeCell", () => {
  it("normalize string", () => {
    expect(normalizeCell("value")).toEqual({ value: "value", columnSpan: 1 });
  });
  it("normalizes image", () => {
    const image: ImageCell = {
      image: { image: "image", height: 100 },
    };
    expect(normalizeCell(image)).toEqual({ ...image, columnSpan: 1 });
  });
  it("throw errors on invalid image", () => {
    const image: ImageCell = {
      image: undefined,
    };
    expect(() => normalizeCell(image)).toThrowError(
      "Cell image is null or undefined"
    );
  });
  it("normalize number", () => {
    expect(normalizeCell(1)).toEqual({ value: 1, columnSpan: 1 });
  });
  it("normalize cell", () => {
    expect(normalizeCell({ value: "value" })).toEqual({
      value: "value",
      columnSpan: 1,
    });
  });

  it("normalize null cell", () => {
    expect(() => normalizeCell({ value: null })).toThrowError(
      "Cell value is null or undefined"
    );
  });

  it("normalize null", () => {
    expect(() => normalizeCell(null)).toThrowError("Cell is null or undefined");
  });
  it("normalize undefined", () => {
    expect(() => normalizeCell(undefined)).toThrowError(
      "Cell is null or undefined"
    );
  });
  it("normalize 0 as number", () => {
    expect(normalizeCell(0)).toEqual({ value: 0, columnSpan: 1 });
  });
  it("allows 0 value", () => {
    expect(normalizeCell({ value: 0 })).toEqual({
      value: 0,
      columnSpan: 1,
    });
  });
  it("normalize text template cell", () => {
    const cell: TextTemplateCell = {
      template: rs`Page {{documentPageNumber}} of {{documentPageCount}}`,
    };
    const normalizedCell = normalizeCell(cell);
    expect(normalizedCell).toMatchObject({
      template: cell.template,
      columnSpan: 1,
    });
  });
  it("normalize null text template cell", () => {
    const cell: TextTemplateCell = {
      template: null,
    };
    expect(() => normalizeCell(cell)).toThrowError(
      "Cell template is null or undefined"
    );
  });
  it("normalize cell override columnSpan", () => {
    expect(normalizeCell({ value: "value", columnSpan: 2 })).toEqual({
      value: "value",
      columnSpan: 2,
    });
  });
  it("normalize textTemplateCell", () => {
    const template = rs`Page {{documentPageNumber}} of {{documentPageCount}}`;
    const normalizedCell = normalizeCell(template) as TextTemplateCell;
    expect(normalizedCell.template.renderTemplate(mockVariables)).toEqual(
      "Page 1 of 3"
    );
  });
});
