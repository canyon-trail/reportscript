import { Cell, CellStyle, CellValue, Image } from "./cell";
import { FontSetting } from "./font";

/**
 * A row contains data for an entry in a table, and can accept options to apply a default style to each cell in the row.
 *
 * Example:
 *
 * ```javascript
 * const row = {
 *   data: [
 *     100,
 *     "",
 *     { value: "Hello", columnSpan: 2 },
 *     { value: 0, color: "red" },
 *   ],
 *   options: {
 *     grid: true,
 *     lineGap: 5,
 *     backgroundColor: "e6e6e6"
 *   }
 * }
 * ```
 */
export type Row = {
  /** A row’s data requires an array of either ImageCell or TextCell objects, strings, or numbers. */
  data: (Cell | CellValue)[];
  /** Sets styling options for the cell. Overrides any row or table level styling options. */
  options?: RowOptions;
  /** Adds an image for the entire row with no other data. */
  image?: Image;
};

/** Set default cell styling for an entire row. Any options set at the cell level will override row options. */
export type RowOptions = CellStyle &
  FontSetting & {
    /** Adds a bottom border to the entire row */
    border?: boolean;
  };