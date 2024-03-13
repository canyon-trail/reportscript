import { TextCell } from "../types";
import { MeasuredRow, MeasuredTable } from "../measure/types";
import _ from "lodash";

export function splitRow(
  row: MeasuredRow,
  availableSpace: number,
  table: MeasuredTable
): [MeasuredRow, MeasuredRow] {
  const first: MeasuredRow = {
    ...row,
    data: [...row.data.map((x) => ({ ...x }))],
    columnHeights: [...row.columnHeights],
    minHeight: 0,
    maxHeight: 0,
  };
  const rest: MeasuredRow = {
    ...row,
    data: [...row.data.map((x) => ({ ...x }))],
    columnHeights: [...row.columnHeights],
    minHeight: 0,
    maxHeight: 0,
  };

  row.data.forEach((d, idx) => {
    const splitFn = table.columns[idx]?.splitFn;
    if ("chart" in d) {
      throw new Error("A cell cannot be split with a chart");
    }

    if (
      splitFn &&
      row.columnHeights[idx].maxHeight > availableSpace &&
      "value" in d
    ) {
      if (row.image) {
        throw new Error("A row cannot be split with an image");
      }

      const measure = (text: string) => table.measureTextHeight(text, idx, row);

      const [next, remaining] = splitFn(`${d.value}`, measure, availableSpace);

      (first.data[idx] as TextCell).value = next;
      first.columnHeights[idx] = measure(next);

      (rest.data[idx] as TextCell).value = remaining;
      rest.columnHeights[idx] = measure(remaining);
    }
  });

  const { firstMinHeight, firstMaxHeight, restMinHeight, restMaxHeight } =
    getSplitRowMinMaxHeights(first, rest);

  first.minHeight = firstMinHeight;
  first.maxHeight = firstMaxHeight;
  rest.minHeight = restMinHeight;
  rest.maxHeight = restMaxHeight;
  return [first, rest];
}

function getSplitRowMinMaxHeights(
  first: MeasuredRow,
  rest: MeasuredRow
): {
  firstMinHeight: number;
  firstMaxHeight: number;
  restMinHeight: number;
  restMaxHeight: number;
} {
  const firstMinHeight = _.maxBy(
    first.columnHeights,
    (x) => x.minHeight
  ).minHeight;

  const firstMaxHeight = _.maxBy(
    first.columnHeights,
    (x) => x.maxHeight
  ).maxHeight;

  const restMaxHeight = _.maxBy(
    rest.columnHeights,
    (x) => x.maxHeight
  ).maxHeight;

  const restMinHeight = _.maxBy(
    rest.columnHeights,
    (x) => x.minHeight
  ).minHeight;

  return {
    firstMinHeight,
    firstMaxHeight,
    restMinHeight,
    restMaxHeight,
  };
}
