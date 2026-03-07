import prisma from '../../utils/prisma.js';
import type { CreateFormatieRequest, FormatieData } from '@schoollaider/shared';

function calculateCapaciteitsScore(data: {
  begroteFte: number;
  ingevuldeFte: number;
  vacatures: number;
  tijdelijkPct: number;
}): number {
  // FTE-dekking: 40% gewicht
  const fteDekking = data.begroteFte > 0
    ? Math.min(data.ingevuldeFte / data.begroteFte, 1) * 100
    : 0;
  const fteScore = fteDekking * 0.4;

  // Vacaturedruk: 30% gewicht (0 vacatures = 100, 5+ = 0)
  const vacatureScore = Math.max(0, 100 - data.vacatures * 20) * 0.3;

  // Tijdelijk percentage: 30% gewicht (0% = 100, 50%+ = 0)
  const tijdelijkScore = Math.max(0, 100 - data.tijdelijkPct * 2) * 0.3;

  return Math.round(fteScore + vacatureScore + tijdelijkScore);
}

export async function getFormatie(
  schoolId: string,
  schooljaar?: string,
): Promise<FormatieData | null> {
  const where = schooljaar
    ? { schoolId_schooljaar: { schoolId, schooljaar } }
    : undefined;

  const record = schooljaar
    ? await prisma.hrFormatie.findUnique({ where: { schoolId_schooljaar: { schoolId, schooljaar } } })
    : await prisma.hrFormatie.findFirst({ where: { schoolId }, orderBy: { schooljaar: 'desc' } });

  if (!record) return null;

  return {
    id: record.id,
    schoolId: record.schoolId,
    schooljaar: record.schooljaar,
    begroteFte: record.begroteFte,
    ingevuldeFte: record.ingevuldeFte,
    vacatures: record.vacatures,
    tijdelijkPct: record.tijdelijkPct,
    fteLeerkracht: record.fteLeerkracht,
    fteOop: record.fteOop,
    fteDirectie: record.fteDirectie,
    capaciteitsScore: record.capaciteitsScore,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function upsertFormatie(
  schoolId: string,
  data: CreateFormatieRequest,
): Promise<FormatieData> {
  const capaciteitsScore = calculateCapaciteitsScore(data);

  const record = await prisma.hrFormatie.upsert({
    where: { schoolId_schooljaar: { schoolId, schooljaar: data.schooljaar } },
    create: {
      schoolId,
      ...data,
      capaciteitsScore,
    },
    update: {
      ...data,
      capaciteitsScore,
    },
  });

  return {
    id: record.id,
    schoolId: record.schoolId,
    schooljaar: record.schooljaar,
    begroteFte: record.begroteFte,
    ingevuldeFte: record.ingevuldeFte,
    vacatures: record.vacatures,
    tijdelijkPct: record.tijdelijkPct,
    fteLeerkracht: record.fteLeerkracht,
    fteOop: record.fteOop,
    fteDirectie: record.fteDirectie,
    capaciteitsScore: record.capaciteitsScore,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getFormatieScore(schoolId: string): Promise<number> {
  const latest = await getFormatie(schoolId);
  return latest?.capaciteitsScore ?? 0;
}
