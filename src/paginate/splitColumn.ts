import { VerticalMeasure } from "measure/types";

export const continuedOn = " (continued on next page)";
export const continuedFrom = "(continued from prev page) ";

/**
 * Use this function for the 'splitFn' {@link ColumnSetting} prop for a
 * column that may have a variable height for its text, such as
 * long notes text.
 *
 * If a row is taller than the available vertical space on a page,
 * this function splits the column text at a line break or space. Also,
 * '(continued on next page)' is inserted before the page break, and
 * '(continued from previous page)' is inserted after the page break.
 *
 * Example:
 *
 * ```javascript
 * import { splitColumn } from "report-script";
 *
 * const columnSettings = [
 *   { width: "1fr" },
 *   { width: "2fr", splitFn: splitColumn, align: "left" },
 *   { width: "1fr" },
 * ]
 * ```
 */
export function splitColumn(
  value: string,
  measure: (text: string) => VerticalMeasure,
  availableSpace: number
): [string, string] {
  let result = trySplitNewlines(value, measure, availableSpace);

  if (!result) {
    result = trySplitSpaces(value, measure, availableSpace);
  }

  if (!result) {
    let splitPosition = value.length;
    do {
      result = [
        value.substring(0, splitPosition) + continuedOn,
        continuedFrom + value.substring(splitPosition),
      ];
      splitPosition--;
    } while (measure(result[0]).maxHeight > availableSpace);
  }

  return result;
}

function trySplitNewlines(
  value: string,
  measure: (text: string) => VerticalMeasure,
  availableSpace: number
): [string, string] | null {
  return trySplitDelimiter(value, measure, availableSpace, "\n");
}
function trySplitSpaces(
  value: string,
  measure: (text: string) => VerticalMeasure,
  availableSpace: number
): [string, string] | null {
  return trySplitDelimiter(value, measure, availableSpace, " ");
}

function trySplitDelimiter(
  value: string,
  measure: (text: string) => VerticalMeasure,
  availableSpace: number,
  delimiter: string
): [string, string] | null {
  const parts = value
    .split(delimiter)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  if (parts.length <= 1) {
    return null;
  }

  const restParts = [parts.pop()];

  while (
    measure(parts.join(delimiter) + continuedOn).maxHeight > availableSpace
  ) {
    restParts.unshift(parts.pop());
  }

  return [
    parts.join(delimiter) + continuedOn,
    continuedFrom + restParts.join(delimiter),
  ];
}
