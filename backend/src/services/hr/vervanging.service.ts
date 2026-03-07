import prisma from '../../utils/prisma.js';
import type { CreateVervangingsRequest, VervangingsData } from '@schoollaider/shared';

function calculateVervangingsIndex(data: {
  totaalVervangingsDagen: number;
  nietVervuldeDagen: number;
  totaalFte: number;
}): number {
  if (data.totaalFte === 0) return 0;

  // Vervulde dagen ratio (70% gewicht)
  const vervuldRatio = data.totaalVervangingsDagen > 0
    ? (data.totaalVervangingsDagen - data.nietVervuldeDagen) / data.totaalVervangingsDagen
    : 1;
  const vervuldScore = vervuldRatio * 100 * 0.7;

  // Druk per FTE (30% gewicht) — minder dagen per FTE = beter
  const dagenPerFte = data.totaalVervangingsDagen / data.totaalFte;
  const drukScore = Math.max(0, 100 - dagenPerFte * 5) * 0.3; // 20+ dagen/FTE = 0

  return Math.round(Math.max(0, Math.min(100, vervuldScore + drukScore)));
}

export async function getVervanging(
  schoolId: string,
  schooljaar?: string,
): Promise<VervangingsData | null> {
  const record = schooljaar
    ? await prisma.hrVervanging.findUnique({ where: { schoolId_schooljaar: { schoolId, schooljaar } } })
    : await prisma.hrVervanging.findFirst({ where: { schoolId }, orderBy: { schooljaar: 'desc' } });

  if (!record) return null;

  return {
    id: record.id,
    schoolId: record.schoolId,
    schooljaar: record.schooljaar,
    totaalVervangingsDagen: record.totaalVervangingsDagen,
    nietVervuldeDagen: record.nietVervuldeDagen,
    kostenVervanging: record.kostenVervanging,
    totaalFte: record.totaalFte,
    vervangingsIndex: record.vervangingsIndex,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function upsertVervanging(
  schoolId: string,
  data: CreateVervangingsRequest,
): Promise<VervangingsData> {
  const vervangingsIndex = calculateVervangingsIndex(data);

  const record = await prisma.hrVervanging.upsert({
    where: { schoolId_schooljaar: { schoolId, schooljaar: data.schooljaar } },
    create: {
      schoolId,
      ...data,
      vervangingsIndex,
    },
    update: {
      ...data,
      vervangingsIndex,
    },
  });

  return {
    id: record.id,
    schoolId: record.schoolId,
    schooljaar: record.schooljaar,
    totaalVervangingsDagen: record.totaalVervangingsDagen,
    nietVervuldeDagen: record.nietVervuldeDagen,
    kostenVervanging: record.kostenVervanging,
    totaalFte: record.totaalFte,
    vervangingsIndex: record.vervangingsIndex,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getVervangingsScore(schoolId: string): Promise<number> {
  const latest = await getVervanging(schoolId);
  return latest?.vervangingsIndex ?? 0;
}
