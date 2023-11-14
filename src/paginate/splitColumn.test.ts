import { splitColumn, continuedOn, continuedFrom } from "./splitColumn";

const newlineSample = `a short line
and another short line
and a further short line
and a rather long line that takes up a bit of space
and a short line`;

describe("splitColumn", () => {
  describe("on newlines", () => {
    const measureLine = (txt: string) => Math.ceil(txt.length / 50);
    const measure = (txt: string) =>
      txt
        .split("\n")
        .map(measureLine)
        .reduce((acc, x) => acc + x, 0);

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
    const measure = (txt: string) => txt.length;

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

  describe("when it's just awful", () => {
    const longString = Array(20).fill("1234567890").join("");

    const measure = (txt: string) => txt.length;

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
