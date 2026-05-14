import { VerticalMeasure } from "measure/types";

export const continuedOn = " (continued on next page)";
export const continuedFrom = "(continued from prev page) ";
export const truncated = " (truncated)";

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
  let result =
    trySplitNewlines(value, measure, availableSpace) ??
    trySplitSpaces(value, measure, availableSpace) ??
    trySplitCharacters(value, measure, availableSpace);

  // A split only counts if the continued-onto content is strictly shorter
  // than the input; otherwise pagination would never make progress and loop
  // forever. Compare undecorated content: result[1] carries a continuedFrom
  // prefix that would otherwise inflate the length past the original.
  const carriedForward = result?.[1].startsWith(continuedFrom)
    ? result[1].substring(continuedFrom.length)
    : result?.[1];
  if (!result || carriedForward.length >= value.length) {
    result = truncate(value, measure, availableSpace);
  }

  return result;
}

/**
 * Last-resort hard break at a character boundary. Returns null when not even
 * a single character of content plus the marker fits in availableSpace.
 */
function trySplitCharacters(
  value: string,
  measure: (text: string) => VerticalMeasure,
  availableSpace: number
): [string, string] | null {
  for (
    let splitPosition = value.length - 1;
    splitPosition >= 1;
    splitPosition--
  ) {
    const result: [string, string] = [
      value.substring(0, splitPosition) + continuedOn,
      continuedFrom + value.substring(splitPosition),
    ];
    if (measure(result[0]).maxHeight <= availableSpace) {
      return result;
    }
  }
  return null;
}

/**
 * When the value cannot be split to fit at all, drop content. Append
 * '(truncated)' to as much of the value as fits; if even the marker alone
 * does not fit, fall back to as many periods as fit.
 */
function truncate(
  value: string,
  measure: (text: string) => VerticalMeasure,
  availableSpace: number
): [string, string] {
  for (let keep = value.length; keep >= 0; keep--) {
    const candidate = value.substring(0, keep) + truncated;
    if (measure(candidate).maxHeight <= availableSpace) {
      return [candidate, ""];
    }
  }

  let dots = "";
  while (measure(dots + ".").maxHeight <= availableSpace) {
    dots += ".";
  }
  return [dots, ""];
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
    parts.length > 1 &&
    measure(parts.join(delimiter) + continuedOn).maxHeight > availableSpace
  ) {
    restParts.unshift(parts.pop());
  }

  // The first part alone still does not fit; let another strategy handle it.
  if (measure(parts.join(delimiter) + continuedOn).maxHeight > availableSpace) {
    return null;
  }

  return [
    parts.join(delimiter) + continuedOn,
    continuedFrom + restParts.join(delimiter),
  ];
}
