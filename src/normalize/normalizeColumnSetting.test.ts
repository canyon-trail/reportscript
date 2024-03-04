import { ColumnSetting } from "types";
import { parseWidth, parseColumnSetting } from "./normalizeColumnSetting";

describe("parseWidth", () => {
  const testCases = [
    {
      input: "1 fr",
      exepct: { value: 1, unit: "fr" },
    },
    { input: "1.5 fr", exepct: { value: 1.5, unit: "fr" } },
    { input: "1fr", exepct: { value: 1, unit: "fr" } },
    { input: "1.5fr", exepct: { value: 1.5, unit: "fr" } },
    { input: "1.5%", exepct: { value: 1.5, unit: "%" } },
    { input: "1.5 %", exepct: { value: 1.5, unit: "%" } },
    { input: "0.5 %", exepct: { value: 0.5, unit: "%" } },
    { input: ".5 %", exepct: { value: 0.5, unit: "%" } },
    { input: "0 %", exepct: { value: 0, unit: "%" } },
    { input: ".0 %", exepct: { value: 0, unit: "%" } },
    { input: "0.0 %", exepct: { value: 0, unit: "%" } },
    { input: "1.0 %", exepct: { value: 1, unit: "%" } },
    { input: "1.5 pt", exepct: { value: 1.5, unit: "pt" } },
    { input: "1.5pt", exepct: { value: 1.5, unit: "pt" } },
  ];
  testCases.forEach(({ input, exepct }) => {
    it(`returns width with unit if passed a string ${input}`, () => {
      expect(parseWidth(input)).toEqual(exepct);
    });
  });

  const errorTestCase = [
    "1 fr 2",
    "1 fr ",
    " 1 fr",
    " 1 %",
    "1 po",
    "funny fr",
    "1 fr %",
    "1 fr 2 fr",
    "1 fr%",
    "1 fthi that fr",
    "fr",
    "%",
    ".",
    "1.5.5",
    "1.5",
    "",
  ];
  errorTestCase.forEach((input) => {
    it(`throw error if input was not valid ${input}`, () => {
      expect(() => parseWidth(input)).toThrowError(
        `Invalid width input ${input}`
      );
    });
  });
});
describe("parseColumnSetting", () => {
  const rows = [{ data: ["column 1", "column 2", "column 3"] }];
  const testCases = [undefined, null, []];

  testCases.forEach((columnSetting) => {
    it(`return default column setting if no column setting is set ${columnSetting}`, () => {
      const defaultColumnSetting = Array(3).fill({
        width: "1fr",
        align: "center",
      });
      expect(parseColumnSetting(rows, columnSetting)).toEqual(
        defaultColumnSetting
      );
    });
  });
  it("return filled column setting when only alignment was set", () => {
    const columnSetting: ColumnSetting[] = Array(3).fill({ align: "left" });
    expect(parseColumnSetting(rows, columnSetting)).toEqual(
      Array(3).fill({ width: "1fr", align: "left" })
    );
  });
  it("return filled column setting when only width was set", () => {
    const columnSetting: ColumnSetting[] = Array(3).fill({ width: "2fr" });
    expect(parseColumnSetting(rows, columnSetting)).toEqual(
      Array(3).fill({ width: "2fr", align: "center" })
    );
  });
  it("return column setting that was set as string", () => {
    const columnSetting: ColumnSetting[] = Array(3).fill({ width: "1 fr" });
    expect(parseColumnSetting(rows, columnSetting)).toEqual(
      Array(3).fill({ width: "1 fr", align: "center" })
    );
  });
});
