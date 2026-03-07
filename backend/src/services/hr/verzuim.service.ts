import prisma from '../../utils/prisma.js';
import type { CreateVerzuimRequest, VerzuimData } from '@schoollaider/shared';

const NORM_VERZUIM_PCT = 5.5; // Landelijk gemiddelde PO

function calculateBelastbaarheidsIndex(data: {
  verzuimPct: number;
  kortVerzuimPct: number;
  langVerzuimPct: number;
}): number {
  // Belastbaarheid = inverse van verzuimdruk
  // Laag verzuim = hoge belastbaarheid (100), hoog verzuim = lage belastbaarheid (0)
  const verzuimFactor = Math.min(data.verzuimPct / 15, 1); // 15%+ = maximale druk
  const langFactor = Math.min(data.langVerzuimPct / 10, 1); // lang verzuim weegt extra

  const score = 100 - (verzuimFactor * 60 + langFactor * 40);
  return Math.round(Math.max(0, Math.min(100, score)));
}

export async function getVerzuimPeriodes(
  schoolId: string,
  limit = 12,
): Promise<VerzuimData[]> {
  const records = await prisma.hrVerzuim.findMany({
    where: { schoolId },
    orderBy: { periode: 'desc' },
    take: limit,
  });

  return records.map((r) => ({
    id: r.id,
    schoolId: r.schoolId,
    periode: r.periode,
    verzuimPct: r.verzuimPct,
    kortVerzuimPct: r.kortVerzuimPct,
    langVerzuimPct: r.langVerzuimPct,
    ziekteVervangingsDagen: r.ziekteVervangingsDagen,
    belastbaarheidsIndex: r.belastbaarheidsIndex,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function upsertVerzuim(
  schoolId: string,
  data: CreateVerzuimRequest,
): Promise<VerzuimData> {
  const belastbaarheidsIndex = calculateBelastbaarheidsIndex(data);

  const record = await prisma.hrVerzuim.upsert({
    where: { schoolId_periode: { schoolId, periode: data.periode } },
    create: {
      schoolId,
      ...data,
      belastbaarheidsIndex,
    },
    update: {
      ...data,
      belastbaarheidsIndex,
    },
  });

  return {
    id: record.id,
    schoolId: record.schoolId,
    periode: record.periode,
    verzuimPct: record.verzuimPct,
    kortVerzuimPct: record.kortVerzuimPct,
    langVerzuimPct: record.langVerzuimPct,
    ziekteVervangingsDagen: record.ziekteVervangingsDagen,
    belastbaarheidsIndex: record.belastbaarheidsIndex,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getVerzuimScore(schoolId: string): Promise<number> {
  const latest = await prisma.hrVerzuim.findFirst({
    where: { schoolId },
    orderBy: { periode: 'desc' },
  });
  return latest?.belastbaarheidsIndex ?? 0;
}

export async function getLatestVerzuimPct(schoolId: string): Promise<number> {
  const latest = await prisma.hrVerzuim.findFirst({
    where: { schoolId },
    orderBy: { periode: 'desc' },
  });
  return latest?.verzuimPct ?? 0;
}

export { NORM_VERZUIM_PCT };
