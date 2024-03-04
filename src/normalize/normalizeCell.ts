import _ from "lodash";
import { Cell, CellValue } from "../types";
import { TextTemplate } from "types/textTemplate";
import { CellSettings } from "./types";

export function normalizeCell(cell: Cell | CellValue | TextTemplate): Cell {
  const defaultProps: CellSettings = {
    columnSpan: 1,
  };
  if (cell == null || cell === undefined) {
    throw new Error("Cell is null or undefined");
  }

  if (_.isString(cell)) {
    return { value: cell as string, ...defaultProps };
  } else if (_.isNumber(cell)) {
    return { value: cell, ...defaultProps };
  } else if ("renderTemplate" in cell) {
    return {
      ...defaultProps,
      template: cell,
    };
  } else if (cell && "image" in cell) {
    if (!cell.image) {
      throw new Error("Cell image is null or undefined");
    }
    return {
      ...defaultProps,
      ...cell,
    };
  } else if (cell && "value" in cell) {
    if (cell.value == null || cell.value === undefined) {
      throw new Error("Cell value is null or undefined");
    }
    return {
      ...defaultProps,
      ...cell,
      value: cell.value,
    };
  } else if (cell && "template" in cell) {
    if (!cell.template) {
      throw new Error("Cell template is null or undefined");
    }
    return {
      ...defaultProps,
      ...cell,
      template: cell.template,
    };
  } else {
    return {
      ...defaultProps,
      ...cell,
      value: "",
    };
  }
}
