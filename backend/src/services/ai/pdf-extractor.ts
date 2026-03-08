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
 * Extract text content from a PDF buffer.
 * Uses pdf-parse v2.x API (class-based PDFParse).
 */
export async function extractPdfFromBuffer(buffer: Buffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  const textResult = await parser.getText();

  const pages: ExtractedPage[] = textResult.pages.map((p) => ({
    pageNumber: p.num,
    text: p.text.trim(),
  }));

  const fullText = textResult.text;
  const totalPages = textResult.total;

  await parser.destroy();

  return {
    fullText,
    pages,
    totalPages,
  };
}
