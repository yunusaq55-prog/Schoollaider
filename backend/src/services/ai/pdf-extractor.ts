import { PDFParse } from 'pdf-parse';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  fullText: string;
  pages: ExtractedPage[];
  totalPages: number;
}

/**
 * Extract text content from a buffer.
 * - If the buffer starts with "%PDF", parses as PDF using pdf-parse v2.x.
 * - Otherwise, treats the buffer as UTF-8 plain text (e.g. seeded/demo documents).
 */
export async function extractPdfFromBuffer(buffer: Buffer): Promise<ExtractionResult> {
  const isPdf = buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF';

  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();

    const pages: ExtractedPage[] = textResult.pages.map((p) => ({
      pageNumber: p.num,
      text: p.text.trim(),
    }));

    await parser.destroy();

    return {
      fullText: textResult.text,
      pages,
      totalPages: textResult.total,
    };
  }

  // Plain text fallback (demo documents stored as UTF-8 text in base64)
  const fullText = buffer.toString('utf-8');
  const lines = fullText.split('\n');

  // Split into pseudo-pages of ~50 lines each for section detection
  const pageSize = 50;
  const pages: ExtractedPage[] = [];
  for (let i = 0; i < lines.length; i += pageSize) {
    pages.push({
      pageNumber: Math.floor(i / pageSize) + 1,
      text: lines.slice(i, i + pageSize).join('\n').trim(),
    });
  }

  return {
    fullText,
    pages,
    totalPages: pages.length,
  };
}
