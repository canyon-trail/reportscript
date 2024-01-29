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
