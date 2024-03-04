import { createCanvas } from "canvas";
import {
  defaultFontSize,
  lineGap,
  textHPadding,
} from "../measure/defaultMeasurement";
import { getCellHeight, getCellAlign } from "../measure/measureRowAndCell";
import { PaginatedRow } from "../paginate/types";
import { PdfKitApi } from "reportDocument";
import { Cell, ImageCell } from "types";
import SVGtoPDF from "svg-to-pdfkit";
import { Chart } from "types/chart";
import { Chart as ChartJS, registerables, ChartConfiguration } from "chart.js";
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
    const offset = getImageXOffset(cell, columnWidths[index]);
    const imageStart = x + offset;
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
  if (!width) {
    return 0;
  }
  const align = cell.horizontalAlign;
  const imageStart =
    align === "center"
      ? maxContentWidth / 2 - width / 2
      : align === "right"
      ? maxContentWidth - width - textHPadding
      : 0;

  return imageStart;
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

  ChartJS.register(...registerables);

  if (typeof window === "undefined") {
    const canvas = createCanvas(chartWidth, chart.maxHeight, "svg");
    new ChartJS(canvas as any, config as ChartConfiguration);
    const svg = canvas.toBuffer();

    SVGtoPDF(doc, svg.toString(), x, y);
  } else {
    config.options.devicePixelRatio = 4;

    const canvas = Object.assign(document.createElement("canvas"), {
      height: chart.maxHeight,
      width: chartWidth,
    });

    new ChartJS(canvas, config as ChartConfiguration);

    const dataUrl = canvas.toDataURL();
    const buffer = Buffer.from(
      dataUrl.replace("data:image/png;base64,", ""),
      "base64"
    );
    doc
      .save()
      .rect(x, y, chartWidth, chart.maxHeight)
      .clip()
      .image(buffer, x, y, { height: chart.maxHeight, width: chartWidth })
      .restore();

    canvas.remove();
  }
}
