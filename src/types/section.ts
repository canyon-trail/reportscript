import { HeaderFooters, Watermark } from "./document";
import { Table } from "./table";

/**
 * A section consists of tables and optional headers.
 * Sections can span multiple pages, and each new section begins on a new page.
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
