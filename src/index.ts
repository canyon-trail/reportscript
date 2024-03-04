import PDFDocument from "pdfkit";
import { PaginatedRow, PaginatedDocument } from "./paginate/types";
import { PdfKitApi, SnapshottingDocument } from "./reportDocument";
import { measure } from "./measure";
import _ from "lodash";
import { writeRow } from "./render";
import { paginate } from "./paginate";
import { normalize } from "./normalize";
import fs from "fs";
import { Document, SnapshotResult } from "./types";
import { margin } from "./measure/defaultMeasurement";
import { renderWatermark } from "./render/renderWaterMark";
export { rs } from "./rs/index";
export { splitColumn } from "./paginate/splitColumn";

type RenderDocumentResult = {
  reportDocument: PdfKitApi;
  stream?: NodeJS.WritableStream;
};

/**
 * Writes a Document to a NodeJS.WriteableStream and returns the stream.
 */
export async function renderPdf(
  document: Document,
  response: NodeJS.WritableStream
): Promise<NodeJS.WritableStream> {
  const { stream } = await renderDocument(document, undefined, response);
  return stream;
}

/**
 * Creates and returns a new JSON snapshot of a given document rendering
 * or returns the existing snapshot at a designated path,
 * as well as returning the current rendering of the document.
 * This is useful for seeing how new changes to a document compare to a previous state.
 */
export async function renderSnapshot(
  path: string,
  document: Document
): Promise<SnapshotResult> {
  const { reportDocument } = await renderDocument(document, true);
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

async function renderDocument(
  document: Document,
  isSnapshot?: boolean,
  outStream?: NodeJS.WritableStream
): Promise<RenderDocumentResult> {
  let stream: NodeJS.WritableStream;
  const pdfDoc = new PDFDocument({
    layout:
      "layout" in document && document.layout ? document.layout : "landscape",
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
  await render(paginatedDocument, reportDocument);
  reportDocument.end();
  return { reportDocument, stream };
}

async function render(
  doc: PaginatedDocument,
  pdfDoc: PdfKitApi
): Promise<void> {
  for (const [idx, p] of doc.pages.entries()) {
    const rows: PaginatedRow[] = p.rows.map(
      (x) => ({ ...x, start: 0 } as PaginatedRow)
    );

    let startPos = margin;

    for (const r of rows) {
      r.start = startPos;
      startPos += r.maxHeight;

      await writeRow(r, pdfDoc);
    }

    if (p?.watermark) {
      renderWatermark(p.watermark, pdfDoc);
    }

    if (idx !== doc.pages.length - 1) {
      pdfDoc.addPage();
      pdfDoc.switchToPage(idx + 1);
    }
  }
}

export type {
  Document,
  SimpleDocument,
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
  ColumnWidth,
  PageBreakRows,
  VerticalAlignment,
  HorizontalAlignment,
  CellLayout as CellOptions,
  CellStyle,
  Cell,
  CellValue,
  FontSetting,
  ImageCell,
  TextCell,
  SnapshotResult,
} from "./types";
