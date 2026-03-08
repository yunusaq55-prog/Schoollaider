-- AlterTable: Add file_data and mime_type to documents for database storage
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "file_data" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "mime_type" VARCHAR(255) NOT NULL DEFAULT 'application/pdf';
ALTER TABLE "documents" ALTER COLUMN "s3_key" SET DEFAULT '';

-- AlterTable: Add file_data to document_versions
ALTER TABLE "document_versions" ADD COLUMN IF NOT EXISTS "file_data" TEXT;
ALTER TABLE "document_versions" ALTER COLUMN "s3_key" SET DEFAULT '';
