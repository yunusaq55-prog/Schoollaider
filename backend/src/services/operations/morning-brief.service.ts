import { PrismaClient } from '@prisma/client';
import { aggregateSignalen } from './aggregator.service.js';
import { generateMorningBrief, MorningBriefResult } from '../ai/llm-client.js';

const prisma = new PrismaClient();

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getMorningBrief(tenantId: string): Promise<MorningBriefResult> {
  const today = todayDate();

  const cached = await prisma.morningBrief.findUnique({
    where: { tenantId_datum: { tenantId, datum: today } },
  });

  if (cached) {
    return cached.briefJson as MorningBriefResult;
  }

  return generateAndCache(tenantId, today);
}

export async function regenerateMorningBrief(tenantId: string): Promise<MorningBriefResult> {
  const today = todayDate();

  await prisma.morningBrief.deleteMany({
    where: { tenantId, datum: today },
  });

  return generateAndCache(tenantId, today);
}

async function generateAndCache(tenantId: string, today: Date): Promise<MorningBriefResult> {
  const signalen = await aggregateSignalen(tenantId);
  const datum = today.toISOString().slice(0, 10);

  const signalenJson = JSON.stringify(signalen, null, 2);

  const { result, tokensUsed } = await generateMorningBrief(signalenJson, datum);

  await prisma.morningBrief.create({
    data: {
      tenantId,
      datum: today,
      briefJson: result as object,
      tokensUsed,
    },
  });

  return result;
}
