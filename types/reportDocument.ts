export type DocumentCall = {
  functionName: string;
  args?: Record<string, any>;
};

type PdfKitFunctions = Pick<
  PDFKit.PDFDocument,
  | "heightOfString"
  | "fontSize"
  | "save"
  | "restore"
  | "stroke"
  | "clip"
  | "rect"
  | "text"
  | "fillColor"
  | "rotate"
  | "font"
  | "image"
  | "strokeColor"
  | "moveTo"
  | "lineTo"
  | "fill"
  | "addPage"
  | "switchToPage"
  | "pipe"
  | "end"
>;

export type PdfKitApi = PdfKitFunctions & Pick<PDFKit.PDFDocument, "info">;

export class SnapshottingDocument implements PdfKitApi {
  #pdfDoc: PDFKit.PDFDocument;
  documentCalls: DocumentCall[] = [];
  constructor(pdfDoc: PDFKit.PDFDocument) {
    this.#pdfDoc = pdfDoc;
  }
  private doCall(functionName: keyof PdfKitFunctions, args: any) {
    this.logCall(functionName, args);
    return this.#pdfDoc[functionName].apply(this.#pdfDoc, args);
  }
  private logCall(functionName: keyof PdfKitApi, args) {
    this.documentCalls.push({
      functionName: functionName,
      args: args,
    });
  }
  get info() {
    return this.#pdfDoc.info;
  }
  heightOfString(...args) {
    return this.doCall("heightOfString", args);
  }
  fontSize(...args) {
    return this.doCall("fontSize", args);
  }
  save(...args) {
    return this.doCall("save", args);
  }
  restore(...args) {
    return this.doCall("restore", args);
  }
  stroke(...args) {
    return this.doCall("stroke", args);
  }
  clip(...args) {
    return this.doCall("clip", args);
  }
  rect(...args) {
    return this.doCall("rect", args);
  }
  text(...args) {
    return this.doCall("text", args);
  }
  fillColor(...args) {
    return this.doCall("fillColor", args);
  }
  rotate(...args) {
    return this.doCall("rotate", args);
  }
  font(...args) {
    return this.doCall("font", args);
  }
  image(...args) {
    return this.doCall("image", args);
  }
  strokeColor(...args) {
    return this.doCall("strokeColor", args);
  }
  moveTo(...args) {
    return this.doCall("moveTo", args);
  }
  lineTo(...args) {
    return this.doCall("lineTo", args);
  }
  fill(...args) {
    return this.doCall("fill", args);
  }
  addPage(...args) {
    return this.doCall("addPage", args);
  }
  switchToPage(...args) {
    return this.doCall("switchToPage", args);
  }
  pipe(...args) {
    return this.doCall("pipe", args);
  }
  end(...args) {
    return this.doCall("end", args);
  }
}
