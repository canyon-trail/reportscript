export * from "./alignment";
export * from "./font";
export * from "./cell";
export * from "./row";
export * from "./table";
export * from "./section";
export * from "./document";

import { Document, SimpleDocument } from "./document";

export type SnapshotResult = {
  snapshot: string;
  rendered: string;
};

export type RenderPdf = (
  document: Document | SimpleDocument,
  response: NodeJS.WritableStream
) => NodeJS.WritableStream;
