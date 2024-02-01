import { FontSetting } from "./font";
import { Row, RowOptions } from "./row";
import { Section } from "./section";
import { ColumnSetting } from "./table";

/**
 * A document is the main data object that gets passed to {@link renderPdf}.
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

export type HeaderFooters = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

export type Layout = "landscape" | "portrait";

/**
 * Adds rows at the bottom of each page where a table is split across multiple pages.
 */
export type PageBreakRows = {
  rows: Row[];
  columns?: ColumnSetting[];
  style?: RowOptions;
};

/**
 * A data object for displaying a diagonal text watermark on a page.
 */
export type Watermark = {
  /** The watermark text */
  text: string;
  /** Font face of the watermark text. Default is “Helvetica-Bold”. See https://pdfkit.org/docs/text.html#fonts */
  fontFace?: string;
  /** Watermark text color (example: “yellow”, “#f6f6f6”). Default is “ff0000”. */
  color?: string;
};
