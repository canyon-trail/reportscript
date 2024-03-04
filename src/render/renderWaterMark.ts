import { MeasuredWatermark } from "../measure/types";
import { PdfKitApi } from "../reportDocument";

export function renderWatermark(
  watermark: MeasuredWatermark,
  doc: PdfKitApi
): void {
  const { text, fontFace, color, x, y, fontSize, origin } = watermark;
  doc.font(fontFace, undefined, fontSize);
  doc.save();
  doc.rotate(-45, { origin: origin });
  doc.fillColor(color ?? "#ff0000", 0.1);
  doc.text(`${text}`.replace(/\t/g, "    "), x, y, { align: "center" });
  doc.restore();
}
