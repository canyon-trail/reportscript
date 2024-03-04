import { VerticalMeasure } from "../measure/types";
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
  measure: (text: string) => VerticalMeasure,
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
 * **% - percentage unit:** Sets the column width as a percentage of the available width. An error will be thrown if
 * the sum of all column percentages exceeds 100%.

 *
 * **pt - point unit:** Sets the column width as points on the page. An error will be thrown if the total points
 * exceeds the available page width (See {@link Document | “Document size and measurements”}).
 *
 * **Combining units:** Units can also be combined, as long as the total combined width does not exceed the
 * available row width.
 */
export type ColumnWidth = string;
export type Unit = "fr" | "%" | "pt";

/**
 * Tables consist of rows and optional headers.  Column and style settings can be set at the table level.
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
