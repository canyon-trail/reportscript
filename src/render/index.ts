import { Image, Cell, ImageCell, TextCell } from "../types";
import { PdfKitApi } from "../reportDocument";
import {
  defaultFontSize,
  getCellAlign,
  getCellHeight,
  lineGap,
  margin,
  textHPadding,
} from "../measure";
import { PaginatedRow } from "../paginate/types";
import { MeasuredWatermark } from "../measure/types";
import SVGtoPDF from "svg-to-pdfkit";
import { Chart } from "types/chart";
import { ChartConfiguration, Chart as ChartJS } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { Context } from "svgcanvas";

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
  const { start, maxHeight, columnWidths, columnStarts } = row;

  horizontalLine(
    columnStarts[index],
    start + maxHeight,
    columnStarts[index] + columnWidths[index],
    doc
  );
}

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

export async function writeCellContents(
  index: number,
  row: PaginatedRow,
  doc: PdfKitApi
): Promise<void> {
  const { start, options, data, columnWidths, columnStarts, maxHeight } = row;
  const cell = data[index];

  const fontSize =
    "value" in cell ? cell.fontSize ?? defaultFontSize : defaultFontSize;
  doc.fontSize(fontSize);

  const x = columnStarts[index] + textHPadding;
  const cellHeight = getCellHeight(data[index], columnWidths[index], doc);

  const y =
    start +
    lineGap +
    getTextYOffset(data[index], cellHeight.maxHeight, maxHeight);

  const align = getCellAlign(data[index]);
  const maxTextWidth = columnWidths[index] - textHPadding * 2;
  const cellLineGap = cell.lineGap ?? options?.lineGap ?? lineGap;

  if ("image" in cell) {
    const { image, ...size } = cell.image;
    const imageStart = x + getImageXOffset(cell, maxTextWidth);

    doc
      .save()
      .rect(columnStarts[index], start, columnWidths[index], maxHeight)
      .clip()
      .image(image, imageStart, y, { ...size })
      .restore();
  } else if ("chart" in cell) {
    await writeChart(cell.chart, x, y, columnWidths[index], doc);
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

async function writeChart(
  chart: Chart,
  x: number,
  y: number,
  columnWidth: number,
  doc: PdfKitApi
): Promise<void> {
  const allowableChartWidth = columnWidth - textHPadding * 2;
  const chartWidth =
    chart.width <= allowableChartWidth ? chart.width : allowableChartWidth;

  const config = {
    ...chart.config,
    options: {
      ...(chart.config.options ?? {}),
      animation: false,
      responsive: false,
    },
  };

  if (typeof window === "undefined") {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      type: "svg",
      width: chartWidth,
      height: chart.maxHeight,
    });

    const buffer = chartJSNodeCanvas.renderToBufferSync(
      config as ChartConfiguration,
      "image/svg+xml"
    );

    SVGtoPDF(doc, buffer.toString(), x, y);
  } else {
    // needed for proper svg chart scaling on pdf
    const originalPixelRatio = window.devicePixelRatio;
    window.devicePixelRatio = 1;

    // approximately 1.33 pixels for every postscript point, leaving some margin on height
    const ctx = new Context(chartWidth * 1.33, chart.maxHeight * 1.3);

    Context.prototype.getContext = function (contextId) {
      if (contextId == "2d" || contextId == "2D") {
        return this;
      }
      return null;
    };

    Context.prototype.style = function () {
      return this.__canvas.style;
    };

    Context.prototype.getAttribute = function (name) {
      return this[name];
    };

    Context.prototype.addEventListener = function () {
      return;
    };

    new ChartJS(ctx, config as ChartConfiguration);

    SVGtoPDF(doc, ctx.getSvg(), x, y);

    window.devicePixelRatio = originalPixelRatio;
  }
}
