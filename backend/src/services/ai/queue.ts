import { Queue, Worker, type Job } from 'bullmq';
import { getRedisConnection } from '../../config/redis.js';
import { extractPdfFromS3 } from './pdf-extractor.js';
import { analyzeDocument, type DocumentAnalysisResult } from './llm-client.js';
import prisma from '../../utils/prisma.js';

// ─── Queue definition ──────────────────────────────────────

const QUEUE_NAME = 'document-analysis';

let queue: Queue | null = null;

export function getAnalysisQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return queue;
}

// ─── Job data types ────────────────────────────────────────

export interface AnalysisJobData {
  analysisJobId: string;
  documentId: string;
  documentVersion: number;
  s3Key: string;
  documentType: string;
  documentTitle: string;
  tenantId: string;
}

// ─── Add job to queue ──────────────────────────────────────

export async function enqueueAnalysis(data: AnalysisJobData): Promise<string> {
  const q = getAnalysisQueue();
  const job = await q.add('analyze', data, {
    jobId: data.analysisJobId,
  });
  return job.id ?? data.analysisJobId;
}

// ─── Worker logic ──────────────────────────────────────────

async function processAnalysisJob(job: Job<AnalysisJobData>): Promise<void> {
  const { analysisJobId, documentId, documentVersion, s3Key, documentType, documentTitle } = job.data;

  console.log(`[Queue] Start analyse: ${documentTitle} (job ${analysisJobId})`);

  try {
    // Update job status → PROCESSING
    await prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });

    // Create or find DocumentAnalysis record
    let analysis = await prisma.documentAnalysis.findFirst({
      where: { documentId, documentVersion },
    });

    if (!analysis) {
      analysis = await prisma.documentAnalysis.create({
        data: {
          documentId,
          documentVersion,
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      });
    } else {
      await prisma.documentAnalysis.update({
        where: { id: analysis.id },
        data: { status: 'PROCESSING', startedAt: new Date() },
      });
    }

    // Step 1: Extract PDF text (30%)
    await updateProgress(job, analysisJobId, 10);
    const extraction = await extractPdfFromS3(s3Key);
    await updateProgress(job, analysisJobId, 30);

    // Save extracted text
    await prisma.documentAnalysis.update({
      where: { id: analysis.id },
      data: { extractedText: extraction.fullText },
    });

    // Step 2: LLM analysis (30% → 80%)
    await updateProgress(job, analysisJobId, 40);
    const { result, tokensUsed } = await analyzeDocument(
      extraction.fullText,
      documentType,
      documentTitle,
    );
    await updateProgress(job, analysisJobId, 80);

    // Step 3: Store results (80% → 100%)
    await storeAnalysisResults(analysis.id, documentId, result, tokensUsed);
    await updateProgress(job, analysisJobId, 100);

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
        costCents: Math.ceil(tokensUsed * 0.003), // rough GPT-4o pricing
      },
    });

    await prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: { status: 'COMPLETED', progress: 100, resultId: analysis.id },
    });

    console.log(`[Queue] Analyse voltooid: ${documentTitle}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    console.error(`[Queue] Analyse mislukt: ${documentTitle}:`, errorMessage);

    // Update failure status
    await prisma.analysisJob.update({
      where: { id: analysisJobId },
      data: { status: 'FAILED', errorMessage },
    });

    // Also update the DocumentAnalysis if it exists
    const existingAnalysis = await prisma.documentAnalysis.findFirst({
      where: { documentId, documentVersion },
    });
    if (existingAnalysis) {
      await prisma.documentAnalysis.update({
        where: { id: existingAnalysis.id },
        data: { status: 'FAILED', errorMessage },
      });
    }

    throw error; // Let BullMQ handle retry
  }
}

// ─── Store sections + standaard links ──────────────────────

async function storeAnalysisResults(
  analysisId: string,
  documentId: string,
  result: DocumentAnalysisResult,
  _tokensUsed: number,
): Promise<void> {
  // Delete any existing sections for this analysis (in case of retry)
  await prisma.documentSection.deleteMany({ where: { analysisId } });

  for (let i = 0; i < result.sections.length; i++) {
    const section = result.sections[i];

    const createdSection = await prisma.documentSection.create({
      data: {
        analysisId,
        titel: section.titel,
        inhoud: section.inhoud,
        startPagina: section.startPagina ?? null,
        eindPagina: section.eindPagina ?? null,
        volgorde: i,
      },
    });

    // Create links to standards
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

        // Also auto-create document-level standaard link if not exists
        const existingDocLink = await prisma.documentStandaardLink.findFirst({
          where: { documentId, standaardId: standaard.id },
        });
        if (!existingDocLink) {
          await prisma.documentStandaardLink.create({
            data: { documentId, standaardId: standaard.id },
          });
        }
      }
    }
  }
}

// ─── Progress helper ───────────────────────────────────────

async function updateProgress(job: Job, analysisJobId: string, progress: number): Promise<void> {
  await job.updateProgress(progress);
  await prisma.analysisJob.update({
    where: { id: analysisJobId },
    data: { progress },
  });
}

// ─── Worker startup ────────────────────────────────────────

let worker: Worker | null = null;

export function startAnalysisWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<AnalysisJobData>(QUEUE_NAME, processAnalysisJob, {
    connection: getRedisConnection() as any,
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job voltooid: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job mislukt: ${job?.id}`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Fout:', err.message);
  });

  console.log('[Worker] Document-analyse worker gestart (concurrency: 3)');

  return worker;
}

export async function stopAnalysisWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
