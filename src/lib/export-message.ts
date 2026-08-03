import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

const FOOTER =
  "\n\n---\nBu belge Türkiye Hukuk Master AI tarafından üretilmiştir. Yalnızca bilgilendirme amaçlıdır; hukuki tavsiye niteliği taşımaz.";

function safeName(base: string, ext: string) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const clean = base.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60) || "hukuk-belgesi";
  return `${clean}_${stamp}.${ext}`;
}

export function exportMarkdown(text: string, title = "hukuk-belgesi") {
  const blob = new Blob([`# ${title}\n\n${text}${FOOTER}`], {
    type: "text/markdown;charset=utf-8",
  });
  saveAs(blob, safeName(title, "md"));
}

export function exportPdf(text: string, title = "Hukuki Değerlendirme") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const marginY = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginX * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, marginX, marginY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const bodyStart = marginY + 28;

  // strip markdown-ish syntax lightly for a cleaner PDF
  const clean = text
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[*_`]/g, "");

  const lines = doc.splitTextToSize(clean + FOOTER, usableWidth);
  let y = bodyStart;
  const lineHeight = 15;
  for (const line of lines) {
    if (y > pageHeight - marginY) {
      doc.addPage();
      y = marginY;
    }
    doc.text(line, marginX, y);
    y += lineHeight;
  }

  doc.save(safeName(title, "pdf"));
}

export async function exportDocx(text: string, title = "Hukuki Değerlendirme") {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true })],
    }),
    new Paragraph({ children: [new TextRun("")] }),
  ];

  const blocks = text.split(/\n{2,}/);
  for (const block of blocks) {
    const isHeading = /^#{1,6}\s+/.test(block);
    if (isHeading) {
      const level = block.match(/^(#{1,6})/)?.[1].length ?? 2;
      const label = block.replace(/^#{1,6}\s+/, "").trim();
      const map: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      paragraphs.push(
        new Paragraph({
          heading: map[level] ?? HeadingLevel.HEADING_2,
          children: [new TextRun({ text: label, bold: true })],
        }),
      );
    } else {
      const clean = block.replace(/\*\*(.*?)\*\*/g, "$1").replace(/[*_`]/g, "");
      const lines = clean.split(/\n/);
      paragraphs.push(
        new Paragraph({
          children: lines.flatMap((l, i) =>
            i === 0 ? [new TextRun(l)] : [new TextRun({ text: l, break: 1 })],
          ),
        }),
      );
    }
  }

  paragraphs.push(
    new Paragraph({ children: [new TextRun("")] }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Bu belge Türkiye Hukuk Master AI tarafından üretilmiştir. Yalnızca bilgilendirme amaçlıdır; hukuki tavsiye niteliği taşımaz.",
          italics: true,
          size: 18,
        }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, safeName(title, "docx"));
}
