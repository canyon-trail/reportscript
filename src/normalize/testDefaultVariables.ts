import { HorizontalAlignment } from "types";
import { NormalizedColumnSetting } from "./types";
export const defaultFontFace = "Helvetica";
export const defaultBoldFace = "Helvetica-Bold";
export const emptyNormalizedDocument = {
  headers: { rows: [] },
  footers: { rows: [] },
  pageBreakRows: undefined,
};
export const defaultNormalizedFontSetting = {
  fontFace: defaultFontFace,
  boldFace: defaultBoldFace,
};
export const defaultNormalizedRowOptions = {
  ...defaultNormalizedFontSetting,
  border: false,
};
export const defaultCellAlignmentWidthOptions = {
  horizontalAlign: "center" as HorizontalAlignment,
  columnSpan: 1,
};
export const defaultNormalizedCellOptions = {
  ...defaultNormalizedFontSetting,
  ...defaultCellAlignmentWidthOptions,
};
export const defaultNormalizedColumnSetting: NormalizedColumnSetting = {
  width: { value: 1, unit: "fr" },
  align: "center",
};
export const defaultNormalizedColumnSettings: NormalizedColumnSetting[] = [
  defaultNormalizedColumnSetting,
];
export const mockVariables = {
  documentPageNumber: 1,
  documentPageCount: 3,
  sectionPageNumber: 1,
  sectionPageCount: 1,
  timestamp: "10:00:00",
};
