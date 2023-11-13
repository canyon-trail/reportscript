import _ from "lodash";
import { NormalizedColumnSetting } from "../types/types";

export function calculateColumnWidths(
  columns: NormalizedColumnSetting[],
  availableWidth: number
): number[] {
  const availableFractionalWidth = calculateAvailableFractionalWidth(
    columns,
    availableWidth
  );
  validateWidths(availableFractionalWidth, columns);
  const totalFractionalCount = getUnitFilteredSum(columns, "fr");
  const widths = columns.map(({ width }) => {
    if (width.unit == "%") {
      return measurePercentageUnit(width.value, availableWidth);
    } else if (width.unit == "pt") {
      return width.value;
    } else {
      return measureFractionalUnit(
        width.value,
        availableFractionalWidth,
        totalFractionalCount
      );
    }
  });

  return widths;
}
function getUnitFilteredSum(
  columns: NormalizedColumnSetting[],
  unit: string
): number {
  return columns
    .filter((x) => x.width.unit == unit)
    .reduce((sum, { width }) => {
      return width.value + sum;
    }, 0);
}
function calculateAvailableFractionalWidth(
  columns: NormalizedColumnSetting[],
  availableWidth: number
): number {
  const totalPercentage =
    (availableWidth * getUnitFilteredSum(columns, "%")) / 100;
  const totalPoint = getUnitFilteredSum(columns, "pt");
  return availableWidth - (totalPoint + totalPercentage);
}
function validateWidths(
  availableFractionalWidth: number,
  columns: NormalizedColumnSetting[]
): void {
  const hasFractional = columns.some((x) => x.width.unit == "fr");
  const isExceeding = hasFractional
    ? availableFractionalWidth <= 0
    : availableFractionalWidth < 0;

  if (isExceeding) {
    const errorString = columns
      .map((c) => `${c.width.value} ${c.width.unit}`)
      .join(", ");
    throw new Error(`Column widths ${errorString} exceeds page width`);
  }
}

function measureFractionalUnit(
  widthValue: number,
  fractionalAvailableWidth: number,
  fractionalCount: number
): number {
  return widthValue * (fractionalAvailableWidth / fractionalCount);
}

function measurePercentageUnit(
  widthValue: number,
  availableWidth: number
): number {
  return (availableWidth / 100) * widthValue;
}
