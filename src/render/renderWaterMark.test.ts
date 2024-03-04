import { margin } from "../measure/defaultMeasurement";
import { MeasuredWatermark } from "../measure/types";
import { SnapshottingDocument } from "../reportDocument";
import { renderWatermark } from "./renderWaterMark";
import PDFDocument from "pdfkit";

const mockText = jest.spyOn(PDFDocument.prototype, "text");

describe("renderWatermark", () => {
  const watermark: MeasuredWatermark = {
    text: "watermark",
    color: "black",
    fontFace: "Helvetica",
    fontSize: 108,
    x: margin,
    y: 252,
    origin: [396, 306],
  };
  beforeEach(() => {
    const doc = new SnapshottingDocument(
      new PDFDocument({
        layout: "landscape",
        margin: 0,
        bufferPages: true,
      })
    );

    renderWatermark(watermark, doc);
  });
  it("calls text", () => {
    expect(mockText).nthCalledWith(1, "watermark", margin, 252, {
      align: "center",
    });
  });
});
