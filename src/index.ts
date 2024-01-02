import PDFDocument from "pdfkit";
import { PaginatedRow, PaginatedDocument } from "./paginate/types";
import { PdfKitApi, SnapshottingDocument } from "./reportDocument";
import { margin, measure } from "./measure";
import _ from "lodash";
import { renderWatermark, writeRow } from "./render";
import { paginate } from "./paginate";
import { normalize } from "./normalize";
import fs from "fs";
import { Document } from "./types";
export { splitColumn } from "./paginate/splitColumn";
type SnapshotResult = {
  snapshot: string;
  rendered: string;
};

export function renderPdf(
  document: Document,
  response: NodeJS.WritableStream
): void {
  renderDocument(document, undefined, response);
}

export function renderSnapshot(
  path: string,
  document: Document
): SnapshotResult {
  const reportDocument = renderDocument(document, true) as SnapshottingDocument;
  let snapshot;
  const rendered = JSON.stringify(reportDocument.documentCalls, null, 2);

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, rendered);
    snapshot = rendered;
  } else {
    const rawSnapshot = fs.readFileSync(path, { encoding: "utf8", flag: "r" });
    const parsedSnapshot = JSON.parse(rawSnapshot);
    snapshot = JSON.stringify(parsedSnapshot, null, 2);
  }
  return { snapshot, rendered };
}

function renderDocument(
  document: Document,
  isSnapshot?: boolean,
  outStream?: NodeJS.WritableStream
): PdfKitApi {
  const pdfDoc = new PDFDocument({
    layout: document.layout ?? "landscape",
    margin: 0,
    bufferPages: true,
    info: isSnapshot
      ? { CreationDate: new Date("July 20, 69 00:20:18 GMT+00:00") }
      : { CreationDate: new Date() },
  });
  if (outStream) {
    // important for this to happen prior to rendering to enable streaming responses
    // for large documents that would potentially cause memory usage problems.
    pdfDoc.pipe(outStream);
  }
  const reportDocument = isSnapshot ? new SnapshottingDocument(pdfDoc) : pdfDoc;
  const normalizeDoc = normalize(document);
  const measuredDoc = measure(normalizeDoc, reportDocument);
  const paginatedDocument = paginate(
    measuredDoc,
    reportDocument.info.CreationDate as Date
  );
  render(paginatedDocument, reportDocument);
  reportDocument.end();
  return reportDocument;
}

function render(doc: PaginatedDocument, pdfDoc: PdfKitApi): void {
  doc.pages.forEach((p, idx) => {
    const rows: PaginatedRow[] = p.rows.map((x) => ({ ...x, start: 0 }));

    let startPos = margin;
    rows.forEach((r) => {
      r.start = startPos;
      startPos += r.height;

      writeRow(r, pdfDoc);
    });
    if (p?.watermark) {
      renderWatermark(p.watermark, pdfDoc);
    } else {
      doc?.watermark && renderWatermark(doc.watermark, pdfDoc);
    }

    if (idx !== doc.pages.length - 1) {
      pdfDoc.addPage();
      pdfDoc.switchToPage(idx + 1);
    }
  });
}

export type {
  Document,
  Image,
  Table,
  Row,
  RowOptions,
  Section,
  Layout,
  Watermark,
  HeaderFooters,
  Unit,
  ColumnSetting,
  ColumnSplitFn,
  PageBreakRows,
  VerticalAlignment,
  HorizontalAlignment,
  CellStyle,
  TableStyle,
  Cell,
  CellValue,
  FontSetting,
  ImageCell,
  TextCell,
} from "./types";
