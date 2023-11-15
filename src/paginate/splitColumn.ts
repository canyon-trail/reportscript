export const continuedOn = " (continued on next page)";
export const continuedFrom = "(continued from prev page) ";

export function splitColumn(
  value: string,
  measure: (text: string) => number,
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
    } while (measure(result[0]) > availableSpace);
  }

  return result;
}

function trySplitNewlines(
  value: string,
  measure: (text: string) => number,
  availableSpace: number
): [string, string] | null {
  return trySplitDelimiter(value, measure, availableSpace, "\n");
}
function trySplitSpaces(
  value: string,
  measure: (text: string) => number,
  availableSpace: number
): [string, string] | null {
  return trySplitDelimiter(value, measure, availableSpace, " ");
}

function trySplitDelimiter(
  value: string,
  measure: (text: string) => number,
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

  while (measure(parts.join(delimiter) + continuedOn) > availableSpace) {
    restParts.unshift(parts.pop());
  }

  return [
    parts.join(delimiter) + continuedOn,
    continuedFrom + restParts.join(delimiter),
  ];
}
