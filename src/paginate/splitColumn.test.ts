import {
  splitColumn,
  continuedOn,
  continuedFrom,
  truncated,
} from "./splitColumn";
import { VerticalMeasure } from "measure/types";

const newlineSample = `a short line
and another short line
and a further short line
and a rather long line that takes up a bit of space
and a short line`;

describe("splitColumn", () => {
  describe("on newlines", () => {
    const measureLine = (txt: string) => Math.ceil(txt.length / 50);
    const measure = (txt: string): VerticalMeasure => {
      const x = txt
        .split("\n")
        .map(measureLine)
        .reduce((acc, x) => acc + x, 0);
      return {
        maxHeight: x,
        minHeight: x,
      };
    };
    const cases = [
      {
        available: 1,
        expected: [
          `a short line${continuedOn}`,
          `${continuedFrom}${newlineSample.substring(13)}`,
        ],
      },
      {
        available: 2,
        expected: [
          `a short line\nand another short line${continuedOn}`,
          `${continuedFrom}${newlineSample.substring(36)}`,
        ],
      },
    ];

    cases.forEach(({ available, expected }, idx) => {
      it(`should split, case ${idx + 1}`, () => {
        const actual = {
          available,
          result: splitColumn(newlineSample, measure, available),
        };
        const expectedObj = {
          available,
          result: expected,
        };
        expect(actual).toEqual(expectedObj);
      });
    });
  });

  describe("on word boundaries", () => {
    const measure = (txt: string): VerticalMeasure => ({
      maxHeight: txt.length,
      minHeight: txt.length,
    });

    const makeWords = (n, start = 1) =>
      Array(n)
        .fill("wordy")
        .map((x, idx) => `${x}${idx + start}`)
        .join(" ");

    const cases = [
      {
        input: makeWords(10),
        available: 57,
        expected: [
          `${makeWords(4)}${continuedOn}`,
          `${continuedFrom}${makeWords(6, 5)}`,
        ],
      },
    ];
    cases.forEach(({ input, available, expected }, idx) => {
      it(`should split, case ${idx + 1}`, () => {
        const actual = {
          input,
          available,
          result: splitColumn(input, measure, available),
        };
        const expectedObj = {
          input,
          available,
          result: expected,
        };
        expect(actual).toEqual(expectedObj);
      });
    });
  });

  describe("when available space is smaller than a single part plus the continued marker", () => {
    // measure: 1 unit per character
    const measure = (txt: string): VerticalMeasure => ({
      maxHeight: txt.length,
      minHeight: txt.length,
    });

    it("should truncate instead of infinite looping when no single part fits", () => {
      const input = "word1 word2 word3";
      // availableSpace smaller than even the shortest possible left side
      // ("word1" + continuedOn), so no split strategy can make progress.
      const available = 3;

      const result = splitColumn(input, measure, available);

      // continuation must be strictly shorter than the input, otherwise
      // pagination would never terminate
      expect(result[1].length).toBeLessThan(input.length);
      // nothing left to continue onto the next page
      expect(result[1]).toBe("");
      // the rendered cell fits the available space
      expect(measure(result[0]).maxHeight).toBeLessThanOrEqual(available);
    });

    it("falls back to periods when even the truncated marker does not fit", () => {
      const input = "word1 word2 word3";
      const available = 2;

      const result = splitColumn(input, measure, available);

      expect(result[1]).toBe("");
      expect(result[0]).toBe("..");
      expect(measure(result[0]).maxHeight).toBeLessThanOrEqual(available);
    });

    it("appends the truncated marker with whatever content fits", () => {
      const input = Array(20).fill("1234567890").join("");
      // smaller than continuedOn (25) so no character split can make
      // progress, but large enough to fit truncated (12) plus some content
      const available = 20;

      const result = splitColumn(input, measure, available);

      expect(result[1]).toBe("");
      expect(result[0].endsWith(truncated)).toBe(true);
      expect(measure(result[0]).maxHeight).toBeLessThanOrEqual(available);
      // it kept as much as could fit
      expect(result[0]).toBe(
        input.substring(0, available - truncated.length) + truncated
      );
    });
  });

  describe("when it's just awful", () => {
    const longString = Array(20).fill("1234567890").join("");

    const measure = (txt: string): VerticalMeasure => ({
      maxHeight: txt.length,
      minHeight: txt.length,
    });

    const cases = [
      {
        available: 57,
        expected: [
          `${longString.substring(0, 57 - continuedOn.length)}${continuedOn}`,
          `${continuedFrom}${longString.substring(57 - continuedOn.length)}`,
        ],
      },
    ];
    cases.forEach(({ available, expected }, idx) => {
      it(`should split, case ${idx + 1}`, () => {
        const actual = {
          available,
          result: splitColumn(longString, measure, available),
        };
        const expectedObj = {
          available,
          result: expected,
        };
        expect(actual).toEqual(expectedObj);
      });
    });
  });
});
