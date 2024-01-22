import PDFDocument from "pdfkit";
import { PaginatedRow, PaginatedDocument } from "./paginate/types";
import { PdfKitApi, SnapshottingDocument } from "./reportDocument";
import { margin, measure } from "./measure";
import _ from "lodash";
import { renderWatermark, writeRow } from "./render";
import { paginate } from "./paginate";
import { normalize } from "./normalize";
import fs from "fs";
import { Document, SnapshotResult } from "./types";
export { splitColumn } from "./paginate/splitColumn";

type RenderDocumentResult = {
  reportDocument: PdfKitApi;
  stream?: NodeJS.WritableStream;
};

/**
 * Writes a Document to a NodeJS.WriteableStream and returns the stream.
 *
 * Examples:
 * Writing to an Express HTTP response:
 * ```javascript
 * router.get("/" (req, res) => {
 *   const document = tranformData(req);
 *   renderPdf(document, res);
 * }
 *
 * function tranformData(req: Request): Document {...}
 * ```
 *
 * Writing to a blob stream and displaying in an iframe:
 * ```javascript
 * import blobStream from "blob-stream";
 *
 * const blob = blobStream();
 * const stream = reportscript.renderPdf(document, blob);
 * stream.on("finish", function () {
 *   const url = stream.toBlobURL("application/pdf");
 *   iframe.src = url;
 * });
 * ```
 */
export function renderPdf(
  document: Document,
  response: NodeJS.WritableStream
): NodeJS.WritableStream {
  const { stream } = renderDocument(document, undefined, response);
  return stream;
}

export function renderSnapshot(
  path: string,
  document: Document
): SnapshotResult {
  const { reportDocument } = renderDocument(document, true);
  const doc = reportDocument as SnapshottingDocument;
  let snapshot;
  const rendered = JSON.stringify(doc.documentCalls, null, 2);

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
): RenderDocumentResult {
  let stream: NodeJS.WritableStream;
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
    stream = pdfDoc.pipe(outStream);
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
  return { reportDocument, stream };
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
  Cell,
  CellValue,
  FontSetting,
  ImageCell,
  TextCell,
  SnapshotResult,
} from "./types";
