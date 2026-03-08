import prisma from '../../utils/prisma.js';
import { env } from '../../config/env.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { extractPdfFromBuffer } from './pdf-extractor.js';
import { analyzeDocument } from './llm-client.js';

// ─── Start analysis ────────────────────────────────────────

/**
 * Trigger AI analysis for a document.
 * Runs the analysis inline (no Redis/BullMQ required).
 */
export async function startDocumentAnalysis(
  tenantId: string,
  documentId: string,
): Promise<{ jobId: string; analysisId: string }> {
  if (!env.AI_ENABLED) {
    throw new AppError(400, 'AI-analyse is uitgeschakeld. Stel AI_ENABLED=true in om te activeren.');
  }

  // Verify document exists and belongs to tenant
  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Check if there's already a running analysis for this version
  const existingJob = await prisma.analysisJob.findFirst({
    where: {
      documentId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  });

  if (existingJob) {
    throw new AppError(409, 'Er loopt al een analyse voor dit document. Wacht tot deze is afgerond.');
  }

  // Check if document has file data
  const docFile = await prisma.document.findUnique({
    where: { id: documentId },
    select: { fileData: true },
  });

  if (!docFile?.fileData) {
    throw new AppError(400, 'Dit document heeft geen bestandsdata. Upload het document opnieuw om het te kunnen analyseren.');
  }

  // Create AnalysisJob record
  const job = await prisma.analysisJob.create({
    data: {
      tenantId,
      documentId,
      jobType: 'full_analysis',
      status: 'PENDING',
      progress: 0,
    },
  });

  // Run analysis inline (fire-and-forget)
  processAnalysisInline(job.id, document).catch((err) => {
    console.error(`[AI] Inline analyse mislukt voor ${document.titel}:`, (err as Error).message);
  });

  return { jobId: job.id, analysisId: job.id };
}

// ─── Inline processing (no Redis needed) ──────────────────

async function processAnalysisInline(
  analysisJobId: string,
  document: { id: string; versie: number; type: string; titel: string },
): Promise<void> {
  try {
    // Update status → PROCESSING
    await prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: { status: 'PROCESSING', progress: 10, attempts: 1 },
    });

    // Remove any previous failed analysis for this version (unique constraint)
    await prisma.documentAnalysis.deleteMany({
      where: { documentId: document.id, documentVersion: document.versie, status: 'FAILED' },
    });

    // Create DocumentAnalysis record
    const analysis = await prisma.documentAnalysis.create({
      data: {
        documentId: document.id,
        documentVersion: document.versie,
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Step 1: Extract PDF text from database
    await prisma.analysisJob.update({ where: { id: analysisJobId }, data: { progress: 20 } });

    const docWithFile = await prisma.document.findUnique({
      where: { id: document.id },
      select: { fileData: true },
    });

    if (!docWithFile?.fileData) {
      throw new Error('Document heeft geen bestandsdata in de database');
    }

    const pdfBuffer = Buffer.from(docWithFile.fileData, 'base64');
    const extraction = await extractPdfFromBuffer(pdfBuffer);

    await prisma.documentAnalysis.update({
      where: { id: analysis.id },
      data: { extractedText: extraction.fullText },
    });

    // Step 2: LLM analysis
    await prisma.analysisJob.update({ where: { id: analysisJobId }, data: { progress: 40 } });
    const { result, tokensUsed } = await analyzeDocument(
      extraction.fullText,
      document.type,
      document.titel,
    );

    await prisma.analysisJob.update({ where: { id: analysisJobId }, data: { progress: 80 } });

    // Step 3: Store sections + standaard links
    await prisma.documentSection.deleteMany({ where: { analysisId: analysis.id } });

    for (let i = 0; i < result.sections.length; i++) {
      const section = result.sections[i];
      const createdSection = await prisma.documentSection.create({
        data: {
          analysisId: analysis.id,
          titel: section.titel,
          inhoud: section.inhoud,
          startPagina: section.startPagina ?? null,
          eindPagina: section.eindPagina ?? null,
          volgorde: i,
        },
      });

      for (const mapping of section.standaarden) {
        const standaard = await prisma.inspectieStandaard.findUnique({
          where: { code: mapping.code },
        });
        if (standaard) {
          await prisma.sectionStandaardLink.create({
            data: {
              sectionId: createdSection.id,
              standaardId: standaard.id,
              relevance: mapping.relevance,
              evidence: mapping.evidence,
            },
          });
          const existingDocLink = await prisma.documentStandaardLink.findFirst({
            where: { documentId: document.id, standaardId: standaard.id },
          });
          if (!existingDocLink) {
            await prisma.documentStandaardLink.create({
              data: { documentId: document.id, standaardId: standaard.id },
            });
          }
        }
      }
    }

    // Mark complete
    await prisma.documentAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sections: JSON.parse(JSON.stringify(result.sections)),
        mappings: JSON.parse(JSON.stringify(result.sections.flatMap((s) => s.standaarden))),
        gaps: JSON.parse(JSON.stringify(result.gaps)),
        overlaps: JSON.parse(JSON.stringify(result.overlaps)),
        summary: result.summary,
        tokenCount: tokensUsed,
        costCents: Math.ceil(tokensUsed * 0.003),
      },
    });

    await prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: { status: 'COMPLETED', progress: 100, resultId: analysis.id },
    });

    console.log(`[AI] Analyse voltooid: ${document.titel}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    console.error(`[AI] Analyse mislukt: ${document.titel}:`, errorMessage);

    await prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: { status: 'FAILED', errorMessage },
    });

    const existingAnalysis = await prisma.documentAnalysis.findFirst({
      where: { documentId: document.id, documentVersion: document.versie },
    });
    if (existingAnalysis) {
      await prisma.documentAnalysis.update({
        where: { id: existingAnalysis.id },
        data: { status: 'FAILED', errorMessage },
      });
    }
  }
}

// ─── Auto-trigger (called after document upload) ───────────

/**
 * Automatically trigger analysis after document upload if AI is enabled.
 * Silently fails if AI is disabled or any error occurs.
 */
export async function autoTriggerAnalysis(
  tenantId: string,
  documentId: string,
): Promise<void> {
  if (!env.AI_ENABLED || !env.OPENAI_API_KEY) {
    return; // Silently skip
  }

  try {
    await startDocumentAnalysis(tenantId, documentId);
    console.log(`[AI] Auto-analyse gestart voor document ${documentId}`);
  } catch (error) {
    // Don't fail the upload if auto-trigger fails
    console.warn(`[AI] Auto-analyse overgeslagen:`, (error as Error).message);
  }
}

// ─── Get analysis status ───────────────────────────────────

export async function getAnalysisStatus(
  tenantId: string,
  documentId: string,
): Promise<{
  status: string;
  progress: number;
  jobId: string | null;
  errorMessage: string | null;
}> {
  // Get the latest job for this document
  const job = await prisma.analysisJob.findFirst({
    where: { documentId, tenantId },
    orderBy: { createdAt: 'desc' },
  });

  if (!job) {
    return { status: 'NONE', progress: 0, jobId: null, errorMessage: null };
  }

  return {
    status: job.status,
    progress: job.progress,
    jobId: job.id,
    errorMessage: job.errorMessage,
  };
}

// ─── Get analysis results ──────────────────────────────────

export async function getDocumentAnalysis(tenantId: string, documentId: string) {
  // Verify document belongs to tenant
  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  const analysis = await prisma.documentAnalysis.findFirst({
    where: { documentId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    include: {
      documentSections: {
        orderBy: { volgorde: 'asc' },
        include: {
          standaardLinks: {
            include: { standaard: true },
          },
        },
      },
    },
  });

  if (!analysis) {
    throw new NotFoundError('Analyse');
  }

  return analysis;
}

// ─── Retry failed analysis ─────────────────────────────────

export async function retryAnalysis(
  tenantId: string,
  documentId: string,
): Promise<{ jobId: string }> {
  // Clean up failed jobs so startDocumentAnalysis doesn't see them as blocking
  await prisma.analysisJob.deleteMany({
    where: { documentId, tenantId, status: 'FAILED' },
  });

  const result = await startDocumentAnalysis(tenantId, documentId);
  return { jobId: result.jobId };
}

// ─── School analysis overview ──────────────────────────────

export async function getSchoolAnalysisOverview(tenantId: string, schoolId: string) {
  // Verify school belongs to tenant
  const school = await prisma.school.findFirst({
    where: { id: schoolId, tenantId: tenantId },
  });

  if (!school) {
    throw new NotFoundError('School');
  }

  // Get all documents for this school with their analysis status
  const documents = await prisma.document.findMany({
    where: { schoolId, tenantId },
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          summary: true,
          completedAt: true,
          tokenCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get latest jobs for each document
  const documentIds = documents.map((d) => d.id);
  const latestJobs = await prisma.analysisJob.findMany({
    where: { documentId: { in: documentIds } },
    orderBy: { createdAt: 'desc' },
    distinct: ['documentId'],
  });

  const jobMap = new Map(latestJobs.map((j) => [j.documentId, j]));

  return documents.map((doc) => ({
    id: doc.id,
    titel: doc.titel,
    type: doc.type,
    status: doc.status,
    versie: doc.versie,
    createdAt: doc.createdAt,
    analysis: doc.analyses[0] ?? null,
    job: jobMap.get(doc.id) ?? null,
  }));
}

// ─── List jobs (for admin overview) ────────────────────────

export async function listAnalysisJobs(tenantId: string, limit = 50) {
  return prisma.analysisJob.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
