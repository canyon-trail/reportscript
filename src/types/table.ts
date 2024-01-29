import { HorizontalAlignment } from "./alignment";
import { Row, RowOptions } from "./row";

/**
 * If your table has data columns that can be of variable height,
 * such as a notes column that may have very long text, and the height of the row exceeds the available page height,
 * the table will be split with the row added to the next page.
 * Sometimes you may not want that behavior, and prefer the row itself to be split.
 * Use the {@link ColumnSetting | splitFn} property on a column to cleanly break the text and continue it on the next page.
 * You can import {@link splitColumn} to accomplish this, or use your own custom split function.
 */
export type ColumnSplitFn = (
  value: string,
  measure: (text: string) => number,
  availableSpace: number
) => [string, string] | [string];

/** Sets optional column settings for table rows. */
export type ColumnSetting = {
  /** Sets the horizontal alignment of the contents in each column.  Default is “center”. */
  align?: HorizontalAlignment;
  width?: ColumnWidth;
  /** **Note**: Setting a splitFn on a column containing an image will throw an error. */
  splitFn?: ColumnSplitFn;
};

/**
 * The width of a column can be set using the following unit options:
 *
 * **fr - fractional unit:** Sets column widths as relative parts of the available row width, where "1fr" equals 1 part.
 *
 * Examples:
 *
 * ```javascript
 * // Column 2 will be twice the width of column 1, and column 3 will be half the width of column 1.
 * const columnSettings1 = [
 *   { width: "1fr" },
 *   { width: "2fr" },
 *   { width: "0.5fr" },
 * ]
 *
 * // All columns are equal width. This is the default width setting.
 * const columnSettings2 = [
 *   { width: "1fr" },
 *   { width: "1fr" },
 *   { width: "1fr" },
 * ]
 * ```
 *
 * **% - percentage unit:** Sets the column width as a percentage of the available width. An error will be thrown if
 * the sum of all column percentages exceeds 100%.
 *
 * Examples:
 *
 * ```javascript
 * // Valid column settings with percentage units.
 * const columnSettings1 = [
 *   { width: "50%" },
 *   { width: "25%" },
 *   { width: "25%" },
 * ]
 *
 * // Invalid percentage column settings. Will throw an error.
 * const columnSettings2 = [
 *   { width: "50%" },
 *   { width: "25%" },
 *   { width: "30%" },
 * ]
 * ```
 *
 * **pt - point unit:** Sets the column width as points on the page. An error will be thrown if the total points
 * exceeds the available page width (See {@link Document | “Document size and measurements”}).
 *
 * Examples:
 *
 * ```javascript
 * // Valid point unit usage for columns in landscape layout (available width = 756).
 * const columnSettings1 = [
 *   { width: "300pt" },
 *   { width: "300pt" },
 *   { width: "156pt" },
 * ]
 *
 * // Valid point unit usage for columns in portrait layout (available width = 576).
 * const columnSettings2 = [
 *   { width: "300pt" },
 *   { width: "200pt" },
 *   { width: "76pt" },
 * ]
 *
 * // Invalid point unit usage (landscape layout). Will throw an error.
 * const columnSettings3 = [
 *   { width: "300pt" },
 *   { width: "300pt" },
 *   { width: "180pt" },
 * ]
 * ```
 *
 * **Combining units:** Units can also be combined, as long as the total combined width does not exceed the
 * available row width.
 *
 * Examples:
 *
 * ```javascript
 * // Valid combinations (available width = 756).
 *
 * const columnSettings1 = [
 *   { width: "50%" },
 *   { width: "1fr" },
 *   { width: "350pt" },
 * ]
 *
 * const columnSettings2 = [
 *   { width: "1fr" },
 *   { width: "2fr" },
 *   { width: "250pt" },
 * ]
 *
 * // Invalid combinations (available width = 756).
 * const columnSettings3 = [
 *   { width: "50%" },
 *   { width: "50%" },
 *   { width: "1fr" },
 * ]
 *
 * const columnSettings4 = [
 *   { width: "50%" },
 *   { width: "25%" },
 *   { width: "200pt" },
 * ]
 * ```
 */
export type ColumnWidth = string;
export type Unit = "fr" | "%" | "pt";

/**
 * Tables consist of rows and optional headers.  Column and style settings can be set at the table level.
 *
 * Example:
 *
 * ```javascript
 * const table = {
 *   headers: [{
 *     rows: [{
 *   data: ["Label","Quantity","Rate","Total"],
 *   options: { bold: true },
 *     }]
 *   }],
 *   rows: [...dataRows],
 *   columns: [
 *    { width: "2fr" },
 *    { width: "1fr" },
 *    { width: "1fr" },
 *    { width: "1fr" },
 *   ],
 *   style: { grid: true }
 * }
 * ```
 */
export type Table = {
  /** Tables require an array of rows. */
  rows: Row[];
  /** Sets table header rows, which will be repeated if a table spans multiple pages. */
  headers?: Row[];
  /** Sets the default column settings for each row in the table. */
  columns?: ColumnSetting[];
  /** Sets the default style options for each row in the table. */
  style?: RowOptions;
};
