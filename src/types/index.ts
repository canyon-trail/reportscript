export * from "./alignment";
export * from "./font";
export * from "./cell";
export * from "./row";
export * from "./table";
export * from "./section";
export * from "./document";
export * from "./alignment";
export * from "./textTemplate";
export * from "./chart";
import { Document } from "./document";

export type RenderPdf = (
  document: Document,
  response: NodeJS.WritableStream
) => NodeJS.WritableStream;
