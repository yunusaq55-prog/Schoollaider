import prisma from '../../utils/prisma.js';
import type { CreateLeeftijdRequest, LeeftijdData } from '@schoollaider/shared';

function calculateUitstroomRisico(data: {
  categorieOnder30: number;
  categorie30Tot40: number;
  categorie40Tot50: number;
  categorie50Tot60: number;
  categorie60Plus: number;
}): number {
  const totaal =
    data.categorieOnder30 +
    data.categorie30Tot40 +
    data.categorie40Tot50 +
    data.categorie50Tot60 +
    data.categorie60Plus;

  if (totaal === 0) return 0;

  // Schatting: 60+ gaat binnen 3 jaar, 50-60 deels (30%)
  const verwachteUitstroom = data.categorie60Plus + data.categorie50Tot60 * 0.3;
  return Math.round(verwachteUitstroom * 10) / 10;
}

function calculateLeeftijdScore(data: {
  categorieOnder30: number;
  categorie30Tot40: number;
  categorie40Tot50: number;
  categorie50Tot60: number;
  categorie60Plus: number;
}): number {
  const totaal =
    data.categorieOnder30 +
    data.categorie30Tot40 +
    data.categorie40Tot50 +
    data.categorie50Tot60 +
    data.categorie60Plus;

  if (totaal === 0) return 0;

  // Ideaal: evenredige verdeling. Score daalt bij onevenwicht naar 55+
  const pct55Plus = (data.categorie50Tot60 * 0.5 + data.categorie60Plus) / totaal;
  const pctJong = data.categorieOnder30 / totaal;

  // Hoog % 55+ = slecht (max 50% straf), laag % jong = slecht (max 30% straf)
  const ouderenStraf = Math.min(pct55Plus / 0.4, 1) * 50;
  const jongerenStraf = pctJong < 0.1 ? (0.1 - pctJong) / 0.1 * 30 : 0;

  return Math.round(Math.max(0, 100 - ouderenStraf - jongerenStraf));
}

export async function getLeeftijd(
  schoolId: string,
  schooljaar?: string,
): Promise<LeeftijdData | null> {
  const record = schooljaar
    ? await prisma.hrLeeftijd.findUnique({ where: { schoolId_schooljaar: { schoolId, schooljaar } } })
    : await prisma.hrLeeftijd.findFirst({ where: { schoolId }, orderBy: { schooljaar: 'desc' } });

  if (!record) return null;

  return {
    id: record.id,
    schoolId: record.schoolId,
    schooljaar: record.schooljaar,
    categorieOnder30: record.categorieOnder30,
    categorie30Tot40: record.categorie30Tot40,
    categorie40Tot50: record.categorie40Tot50,
    categorie50Tot60: record.categorie50Tot60,
    categorie60Plus: record.categorie60Plus,
    verwachteUitstroom3Jaar: record.verwachteUitstroom3Jaar,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function upsertLeeftijd(
  schoolId: string,
  data: CreateLeeftijdRequest,
): Promise<LeeftijdData> {
  const verwachteUitstroom3Jaar = calculateUitstroomRisico(data);

  const record = await prisma.hrLeeftijd.upsert({
    where: { schoolId_schooljaar: { schoolId, schooljaar: data.schooljaar } },
    create: {
      schoolId,
      ...data,
      verwachteUitstroom3Jaar,
    },
    update: {
      ...data,
      verwachteUitstroom3Jaar,
    },
  });

  return {
    id: record.id,
    schoolId: record.schoolId,
    schooljaar: record.schooljaar,
    categorieOnder30: record.categorieOnder30,
    categorie30Tot40: record.categorie30Tot40,
    categorie40Tot50: record.categorie40Tot50,
    categorie50Tot60: record.categorie50Tot60,
    categorie60Plus: record.categorie60Plus,
    verwachteUitstroom3Jaar: record.verwachteUitstroom3Jaar,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getLeeftijdScore(schoolId: string): Promise<number> {
  const latest = await prisma.hrLeeftijd.findFirst({
    where: { schoolId },
    orderBy: { schooljaar: 'desc' },
  });

  if (!latest) return 0;

  return calculateLeeftijdScore({
    categorieOnder30: latest.categorieOnder30,
    categorie30Tot40: latest.categorie30Tot40,
    categorie40Tot50: latest.categorie40Tot50,
    categorie50Tot60: latest.categorie50Tot60,
    categorie60Plus: latest.categorie60Plus,
  });
}
