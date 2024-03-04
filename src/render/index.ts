import { Image, TextCell } from "../types";
import { PdfKitApi } from "../reportDocument";

import { PaginatedRow } from "../paginate/types";
import { margin } from "../measure/defaultMeasurement";
import { writeCellContents } from "./writeCellContents";

export async function writeRow(
  row: PaginatedRow,
  doc: PdfKitApi
): Promise<void> {
  const { image, start, data, maxHeight } = row;

  for (const [idx, cell] of data.entries()) {
    writeCellBackground(row, doc, idx);

    if ("value" in cell) {
      doc.fillColor(getCellColor(cell));
      doc.font(getCellFont(cell));
    }
    await writeCellContents(idx, row, doc);
    bottomBorder(row, doc, idx);
    writeCellGrids(row, doc, idx);
  }

  writeBorder(row, doc);

  if (image) {
    const imageStart = start + maxHeight - image.height + 2;
    const { image: imageBuffer, ...size } = image;
    doc.image(imageBuffer, margin, imageStart, { ...size });
  }
}

export function bottomBorder(
  row: PaginatedRow,
  doc: PdfKitApi,
  index: number
): void {
  if (!row.data[index].bottomBorder) {
    return;
  }
  const { start, maxHeight, columnWidths, columnStarts } = row;

  horizontalLine(
    columnStarts[index],
    start + maxHeight,
    columnStarts[index] + columnWidths[index],
    doc
  );
}

export function writeCellGrids(
  row: PaginatedRow,
  doc: PdfKitApi,
  index: number
): void {
  const { start, maxHeight, data, image, columnWidths, columnStarts } = row;
  if (!data[index].grid) {
    return;
  }

  const dataHeight = getDataHeight(maxHeight, image);

  doc.strokeColor(data[index]?.gridColor || "black");

  horizontalLine(
    columnStarts[index],
    start,
    columnStarts[index] + columnWidths[index],
    doc
  );
  horizontalLine(
    columnStarts[index],
    start + dataHeight,
    columnStarts[index] + columnWidths[index],
    doc
  );
  verticalLine(columnStarts[index], start, start + dataHeight, doc);
  verticalLine(
    columnStarts[index] + columnWidths[index],
    start,
    start + dataHeight,
    doc
  );
}

export function writeBorder(row: PaginatedRow, doc: PdfKitApi): void {
  const { start, maxHeight, image, options } = row;
  if (!options?.border) {
    return;
  }
  const dataHeight = getDataHeight(maxHeight, image);
  const rowWidth = row.columnWidths.reduce((a, b) => a + b, 0);
  horizontalLine(margin, start, rowWidth + margin, doc);
  horizontalLine(margin, start + dataHeight, rowWidth + margin, doc);
  verticalLine(margin, start, start + dataHeight, doc);
  verticalLine(rowWidth + margin, start, start + dataHeight, doc);
}

function horizontalLine(
  xPos: number,
  yPos: number,
  xEnd: number,
  doc: PdfKitApi
): void {
  doc.moveTo(xPos, yPos).lineTo(xEnd, yPos).stroke();
}

function verticalLine(
  xPos: number,
  yStart: number,
  yEnd: number,
  doc: PdfKitApi
): void {
  doc.moveTo(xPos, yStart).lineTo(xPos, yEnd).stroke();
}

export function writeCellBackground(
  row: PaginatedRow,
  doc: PdfKitApi,
  index: number
): void {
  const { start, maxHeight, image, data, columnWidths, columnStarts } = row;
  const dataHeight = getDataHeight(maxHeight, image);

  const backgroundColor = data[index]?.backgroundColor ?? null;

  if (backgroundColor) {
    doc
      .rect(columnStarts[index], start, columnWidths[index], dataHeight)
      .fill(backgroundColor);
  }
}

export function getCellFont(cell: TextCell): string {
  const defaultFont = cell?.bold ? cell?.boldFace : cell?.fontFace;
  return defaultFont;
}

export function getCellColor(cell: TextCell): string {
  const { color } = cell;

  const defaultColor = color ?? "black";
  return defaultColor;
}

function getDataHeight(height: number, image?: Image) {
  return height - (image?.height ?? 0);
}
