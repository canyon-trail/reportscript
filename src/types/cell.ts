import { HorizontalAlignment, VerticalAlignment } from "types/alignment";
import { FontSetting } from "./font";
import { Chart } from "./chart";
import { TextTemplate } from "rs";

export type Cell = ImageCell | TextCell | ChartCell;

/**
 * An Image can be added to a row cell with optional styles.
 *
 */
export type ImageCell = CellStyle &
  CellLayout & {
    /** An ImageCell requires an Image data object. */
    image: Image;
  };

export type ChartCell = CellLayout &
  CellStyle & {
    chart: Chart;
  };

/**
 * A text cell includes data as a string or number, as well as optional styles.
 */
export type TextCell = CellStyle &
  FontSetting &
  CellLayout & {
    /** A TextCell requires a string or number value. */
    value: CellValue;
  };

export type TextTemplateCell = CellStyle &
  FontSetting &
  CellLayout & {
    template: TextTemplate;
  };

export type CellStyle = {
  /** Prevents a text from wrapping within a cell. If true, adds an ellipsis ("...") at the end of the text if cutoff. */
  noWrap?: boolean;
  /** Adds a border around the cell. */
  grid?: boolean;
  /** Sets the color of the grid borders. Default is black. */
  gridColor?: string;
  /** Sets the background color of the cell (example: “yellow” or “#e6e6e6”). */
  backgroundColor?: string;
  /**
   * Sets the line spacing around the cell contents.
   *    */
  lineGap?: number;
  /** Adds a bottom border to the cell */
  bottomBorder?: boolean;
};

export type CellValue = string | number;

export type CellLayout = {
  /** Sets the horizontal alignment of a cell's contents within the table row. Default is "center". */
  horizontalAlign?: HorizontalAlignment;
  /** Sets the vertical alignment of a cell's contents within the table row. Default is "center". */
  verticalAlign?: VerticalAlignment;
  /** Sets how many columns within a row a cell will span. Default is 1. */
  columnSpan?: number;
};

/**
 * A data object for adding an image to a row or cell. Accepts either a Buffer or string path.
 */
export type Image = {
  /** Sets the image from a buffer or path string. */
  image: Buffer | string;
  /** An image requires a height value (see {@link Document | “Document size and measurements”}). */
  height: number;
  width?: number;
};
