import { MeasuredRow } from "../measure/types";
import { getSplitRowMinMaxHeights } from ".";

describe("splitRow", () => {
  const first = {
    columnHeights: [{ minHeight: 10, maxHeight: 10 }],
  } as MeasuredRow;

  const rest = {
    columnHeights: [
      { minHeight: 10, maxHeight: 10 },
      { minHeight: 15, maxHeight: 15 },
    ],
  } as MeasuredRow;

  it("sets 'rest' minHeight to max column height when less than available space", () => {
    const availableSpace = 50;

    const result = getSplitRowMinMaxHeights(first, rest, availableSpace);
    expect(result.restMinHeight).toBe(15);
  });

  it("sets 'rest' minHeight to available space when less than available space", () => {
    const availableSpace = 14;

    const result = getSplitRowMinMaxHeights(first, rest, availableSpace);
    expect(result.restMinHeight).toBe(14);
  });
});
