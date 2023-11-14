import { Image, Cell, ImageCell, TextCell } from "../types";
import { PdfKitApi } from "../reportDocument";
import {
  defaultFontSize,
  getCellAlign,
  getCellHeight,
  lineGap,
  margin,
  textHPadding,
} from "../measure/measuring";
import { PaginatedRow } from "../paginate/types";
import { MeasuredWatermark } from "../measure/types";

export const defaultFontFace = "Helvetica";
export const defaultBoldFace = "Helvetica-Bold";
export const defaultBackgroundColor = "#e6e0e0";
export const defaultHeaderColor = "#5a5858";

export function bottomBorder(
  row: PaginatedRow,
  doc: PdfKitApi,
  index: number
): void {
  if (!row.data[index].bottomBorder) {
    return;
  }
  const { start, height, columnWidths, columnStarts } = row;

  horizontalLine(
    columnStarts[index],
    start + height,
    columnStarts[index] + columnWidths[index],
    doc
  );
}

export function writeRow(row: PaginatedRow, doc: PdfKitApi): void {
  const { image, start, data, height } = row;
  data.forEach((cell, idx) => {
    writeCellBackground(row, doc, idx);

    if ("value" in cell) {
      doc.fillColor(getCellColor(cell));
      doc.font(getCellFont(cell));
    }
    writeCellContents(idx, row, doc);
    bottomBorder(row, doc, idx);
    writeCellGrids(row, doc, idx);
  });

  writeBorder(row, doc);

  if (image) {
    const imageStart = start + height - image.height + 2;
    const { image: imageBuffer, ...size } = image;
    doc.image(imageBuffer, margin, imageStart, { ...size });
  }
}

export function writeCellGrids(
  row: PaginatedRow,
  doc: PdfKitApi,
  index: number
): void {
  const { start, height, data, image, columnWidths, columnStarts } = row;
  if (!data[index].grid) {
    return;
  }

  const dataHeight = getDataHeight(height, image);

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
  const { start, height, image, options } = row;
  if (!options?.border) {
    return;
  }
  const dataHeight = getDataHeight(height, image);
  const rowWidth = row.columnWidths.reduce((a, b) => a + b, 0);
  horizontalLine(margin, start, rowWidth + margin, doc);
  horizontalLine(margin, start + dataHeight, rowWidth + margin, doc);
  verticalLine(margin, start, start + dataHeight, doc);
  verticalLine(rowWidth + margin, start, start + dataHeight, doc);
}

export function horizontalLine(
  xPos: number,
  yPos: number,
  xEnd: number,
  doc: PdfKitApi
): void {
  doc.moveTo(xPos, yPos).lineTo(xEnd, yPos).stroke();
}

export function verticalLine(
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
  const { start, height, image, data, columnWidths, columnStarts } = row;
  const dataHeight = getDataHeight(height, image);

  const backgroundColor = data[index]?.backgroundColor ?? null;

  if (backgroundColor) {
    doc
      .rect(columnStarts[index], start, columnWidths[index], dataHeight)
      .fill(backgroundColor);
  }
}

export function getCellFont(cell: TextCell): string {
  const fontFace = cell?.fontFace || defaultFontFace;
  const boldFace = cell?.boldFace || defaultBoldFace;
  const defaultFont = cell?.bold ? boldFace : fontFace;

  return defaultFont;
}

export function getCellColor(cell: TextCell): string {
  const { color } = cell;

  const defaultColor = color ?? "black";
  return defaultColor;
}

export function writeCellContents(
  index: number,
  row: PaginatedRow,
  doc: PdfKitApi
): void {
  const { start, options, data, columnWidths, columnStarts, height } = row;
  const cell = data[index];

  const fontSize =
    "value" in cell ? cell.fontSize ?? defaultFontSize : defaultFontSize;
  doc.fontSize(fontSize);

  const x = columnStarts[index] + textHPadding;
  const cellHeight = getCellHeight(data[index], columnWidths[index], doc);

  const y = start + lineGap + getTextYOffset(data[index], cellHeight, height);

  const align = getCellAlign(data[index]);
  const maxTextWidth = columnWidths[index] - textHPadding * 2;
  const cellLineGap = cell.lineGap ?? options?.lineGap ?? lineGap;

  if ("image" in cell) {
    const { image, ...size } = cell.image;
    const imageStart = x + getImageXOffset(cell, maxTextWidth);

    doc
      .save()
      .rect(columnStarts[index], start, columnWidths[index], height)
      .clip()
      .image(image, imageStart, y, { ...size })
      .restore();
  } else {
    doc.text(`${cell.value}`.replace(/\t/g, "    "), x, y, {
      width: maxTextWidth,
      underline: options?.underline ?? undefined,
      align,
      lineGap: cellLineGap,
      height: cell.noWrap ? fontSize : undefined,
      ellipsis: cell.noWrap || undefined,
    });
  }
}

function getDataHeight(height: number, image?: Image) {
  return height - (image?.height ?? 0);
}

export function getTextYOffset(
  cell: Cell,
  cellHeight: number,
  rowHeight: number
): number {
  const vertAlign = cell.verticalAlign;

  const yOffset =
    vertAlign === "center"
      ? rowHeight / 2 - cellHeight / 2 + lineGap * 0.5
      : vertAlign === "bottom"
      ? rowHeight - cellHeight
      : 0;

  return yOffset;
}

export function getImageXOffset(
  cell: ImageCell,
  maxContentWidth: number
): number {
  const width = cell.image?.width;
  const align = cell.align;

  const imageStart =
    align === "center"
      ? maxContentWidth / 2 - width / 2
      : align === "right"
      ? maxContentWidth - width - textHPadding
      : 0;

  return imageStart;
}

export function renderWatermark(
  watermark: MeasuredWatermark,
  doc: PdfKitApi
): void {
  const { text, fontFace, color, x, y, fontSize, origin } = watermark;
  doc.font(fontFace ?? defaultBoldFace, undefined, fontSize);
  doc.save();
  doc.rotate(-45, { origin: origin });
  doc.fillColor(color ?? "#ff0000", 0.1);
  doc.text(`${text}`.replace(/\t/g, "    "), x, y, { align: "center" });
  doc.restore();
}
