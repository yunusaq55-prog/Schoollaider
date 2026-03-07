import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { PDFParse } from 'pdf-parse';
import { env } from '../../config/env.js';

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

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
 * Download a PDF from S3 and extract its text content.
 * Returns full text + per-page text with page numbers.
 *
 * Uses pdf-parse v2.x API (class-based PDFParse).
 */
export async function extractPdfFromS3(s3Key: string): Promise<ExtractionResult> {
  // Download from S3
  const response = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: s3Key }),
  );

  if (!response.Body) {
    throw new Error(`Leeg bestand voor key: ${s3Key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // Parse PDF using pdf-parse v2.x API
  const parser = new PDFParse({ data: buffer });
  const textResult = await parser.getText();

  // textResult.pages is an array of { text, num } per page
  const pages: ExtractedPage[] = textResult.pages.map((p) => ({
    pageNumber: p.num,
    text: p.text.trim(),
  }));

  const fullText = textResult.text;
  const totalPages = textResult.total;

  // Clean up
  await parser.destroy();

  return {
    fullText,
    pages,
    totalPages,
  };
}
