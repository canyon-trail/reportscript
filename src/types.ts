export type Cell = ImageCell | TextCell;

export type CellOptions = {
  /** Sets the horizontal alignment of the contents within a cell. */
  align?: HorizontalAlignment;
  /** Sets how many columns within a row a cell will span. Default is 1. */
  columnSpan?: number;
};

export type CellStyle = {
  /** Sets the vertical alignment of a cell's contents within the table row. */
  verticalAlign?: VerticalAlignment;
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
   * Default value is 4.5 (see {@link Document | “Document size and measurements”}).
   */
  lineGap?: number;
  /** Adds a bottom border to the cell */
  bottomBorder?: boolean;
};

export type CellValue = string | number;

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

/**
 * Sets optional column settings for table rows.
 *
 * The width of a column can be set using the following unit options:
 *
 * **fr - fractional unit:** - Sets column widths as relative parts of the available row width, where "1fr" equals 1 part.
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
 * **% - percentage unit:** - Sets the column width as a percentage of the available width. An error will be thrown if
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
 * **pt - point unit:** - Sets the column width as points on the page. An error will be thrown if the total points
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
 * **Combining units:** - Units can also be combined, as long as the total combined width does not exceed the
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
export type ColumnSetting = {
  /** Sets the horizontal alignment of the contents in each column.  Default is “center”. */
  align?: HorizontalAlignment;
  /** See examples above. */
  width?: string;
  /** **Note**: Setting a splitFn on a column containing an image will throw an error. */
  splitFn?: ColumnSplitFn;
};

/**
 * A document is the main data object that gets passed to {@link renderPdf}.
 *
 * Example:
 *
 * ```javascript
 * const document = {
 *   headers: {
 *     rows: [{
 *   data: ["My Header"],
 *        columns: [{ align: "left" }]
 *     }]
 *   },
 *   footers: {
 *     rows: [{
 *   data: ["My Footer"],
 *        columns: [{ align: "left" }]
 *     }]
 *   },
 *   sections: [...mySections],
 *   layout: "portrait",
 *   timestamp: true,
 *   pageNumbers: true
 * }
 * ```
 *
 * Document size and measurements:
 *
 * The document is standard letter size (8.5in x 11in) and measured in PostScript points (612 x 792), where there are 72 points per inch.
 * Some default values for the document include the following:
 * - tableGap:      18
 * - lineGap:       4.5
 * - page margin:   18
 *
 * The available page widths for tables are as follows:
 * - landscape layout:    756 (792 - 2 * page margin)
 * - portrait layout:     576 (612 - 2 * page margin)
 */
export type Document = {
  /** A document requires an array of sections. */
  sections: Section[];
  /**
   * Headers are displayed at the top of a pdf page.
   * By default, the headers are only displayed on the first page.
   */
  headers?: HeaderFooters;
  /** Document footers are displayed at the bottom of every page. */
  footers?: HeaderFooters;
  /** Displays the document page number at the bottom of every page. Example: “Page 1 of 10” */
  pageNumbers?: boolean;
  /**
   * Displays the section page number at the bottom of every page, and resets to 1 for every section.
   * An error will be thrown if both pageNumbers and sectionPageNumbers are set to true.
   */
  sectionPageNumbers?: boolean;
  /** Displays the timestamp at time of render on every page. Example: “Wed Apr 05 2023 04:05:58” */
  timestamp?: boolean;
  /** The orientation of the pdf document. Default is “landscape”. */
  layout?: Layout;
  /** Repeat section headers if a section is split between multiple pages. */
  repeatSectionHeaders?: boolean;
  /** Display the document headers on every page. */
  repeatReportHeaders?: boolean;
  /**
   * Sets the spacing between tables in the document.
   * Default value is 18 (see “Document size and measurements”).
   * Any section tableGap settings will override the document tableGap.
   */
  tableGap?: number;
  /** Sets the font settings for any page numbers or timestamps. */
  timeStampPageNumberFontSetting?: FontSetting;
  /** Adds custom rows for page breaks */
  pageBreakRows?: PageBreakRows;
  /**
   * Displays a Watermark on every page of the pdf. If a section has a watermark set,
   * it will override the document watermark setting.
   */
  watermark?: Watermark;
};

/** Style text font */
export type FontSetting = {
  /** Default is "Helvetica" */
  fontFace?: string;
  /** Default value is 7. */
  fontSize?: number;
  /** Example: “yellow” or ”#f6f6f6”. Default value is black. See https://pdfkit.org/docs/text.html#fonts */
  color?: string;
  /**
   * Sets the font face for bold (when "bold" is true on the cell, row, or table).
   * Default value is “Helvetica-Bold” See https://pdfkit.org/docs/text.html#fonts.
   */
  boldFace?: string;
  underline?: boolean;
  bold?: boolean;
};

export type HeaderFooters = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type HorizontalAlignment = "left" | "center" | "right";

export type Image = {
  height: number;
  width?: number;
  image: Buffer | string;
};

/**
 * An Image can be added to a row cell with optional styles.
 *
 * Example:
 *
 * ```javascript
 * const imageBuffer = fs.readFileSync("./my-image.png");
 *
 * const imageCell = {
 *   image: { image: imageBuffer, height: 35, width: 150 },
 *   align: "center",
 *   columnSpan: 3
 * }
 * ```
 */
export type ImageCell = CellStyle &
  CellOptions & {
    /** An ImageCell requires an Image data object. */
    image: Image;
    /** An ImageCell requires a horizontal alignment value. */
    align: HorizontalAlignment;
  };

export type Layout = "landscape" | "portrait";

/**
 * Adds rows at the bottom of each page where a table is split across multiple pages.
 *
 * Example:
 *
 * ```javascript
 * const document = {
 *   ...documentProperties,
 *   pageBreakRows: {
 *     rows: [{
 *       data: ["", { value: "(continued on next page)", align: "left" }]
 *     }],
 *     columns: [{ width: "1fr" }, { width: "2fr" }]
 *   }
 * }
 * ```
 */
export type PageBreakRows = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type RenderPdf = (
  document: Document,
  response: NodeJS.WritableStream
) => NodeJS.WritableStream;

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

export type RowOptions = CellStyle &
  FontSetting & {
    border?: boolean;
  };

/**
 * A section consists of tables and optional headers.
 * Sections can span multiple pages, and each new section begins on a new page.
 *
 * Example:
 *
 * ```javascript
 * const section = {
 *   headers: {
 *     rows: [{
 *   data: ["My Section Header"],
 *        columns: [{ align: "left" }]
 *     }]
 *   },
 *   tables: [...sectionTables],
 *   tableGap: 12
 * }
 * ```
 */
export type Section = {
  /** A section requires an array of tables. */
  tables: Table[];
  /**
   * Section headers appear at the top of the page, below any document headers.
   * If {@link Document | repeatSectionHeaders} is set to true on the document,
   * the section headers will be repeated if any sections span multiple pages.
   */
  headers?: HeaderFooters;
  /**
   * Sets the spacing between tables in the section. If not set,
   * the section will inherit the document’s tableGap or the default value, 18
   * (see {@link Document | “Document size and measurements”}).
   */
  tableGap?: number;
  /**
   * Accepts a Watermark data object for setting a diagonal text watermark on any of the section’s pages.
   * Overrides any watermark setting on the document.
   */
  watermark?: Watermark;
};

export type SnapshotResult = {
  snapshot: string;
  rendered: string;
};

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

/**
 * A text cell includes data as a string or number, as well as optional styles.
 *
 * Example:
 *
 * ```javascript
 * const cell = {
 *   value: "Project 1123",
 *   align: "left",
 *   backgroundColor: "#e6e6e6"
 * }
 * ```
 */
export type TextCell = CellStyle &
  FontSetting &
  CellOptions & {
    /** A TextCell requires a string or number value. */
    value: CellValue;
  };

export type Unit = "fr" | "%" | "pt";

export type VerticalAlignment = "top" | "center" | "bottom";

/**
 * A data object for displaying a diagonal text watermark on a page.
 *
 * Example:
 *
 * ```javascript
 * const document = {
 *   ...documentProperties,
 *   watermark: {
 *     text: "Draft",
 *     fontFace: "Times-Bold",
 *     color: "ff0000"
 *   }
 * }
 * ```
 */
export type Watermark = {
  /** The watermark text */
  text: string;
  /** Font face of the watermark text. Default is “Helvetica-Bold”. See https://pdfkit.org/docs/text.html#fonts */
  fontFace?: string;
  /** Watermark text color (example: “yellow”, “#f6f6f6”). Default is “ff0000”. */
  color?: string;
};
