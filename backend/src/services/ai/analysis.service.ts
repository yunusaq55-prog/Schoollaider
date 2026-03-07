import prisma from '../../utils/prisma.js';
import { env } from '../../config/env.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { enqueueAnalysis, type AnalysisJobData } from './queue.js';

// ─── Start analysis ────────────────────────────────────────

/**
 * Trigger AI analysis for a document.
 * Creates an AnalysisJob and enqueues it for background processing.
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

  // Enqueue for background processing
  const jobData: AnalysisJobData = {
    analysisJobId: job.id,
    documentId: document.id,
    documentVersion: document.versie,
    s3Key: document.s3Key,
    documentType: document.type,
    documentTitle: document.titel,
    tenantId,
  };

  await enqueueAnalysis(jobData);

  return { jobId: job.id, analysisId: job.id };
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
  // Clean up failed jobs
  await prisma.analysisJob.updateMany({
    where: { documentId, tenantId, status: 'FAILED' },
    data: { status: 'FAILED' }, // Keep as is, we'll create a new one
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
