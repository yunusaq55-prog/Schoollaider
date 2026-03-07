import type { HrRisico, HrRisicoScore } from '@schoollaider/shared';
import prisma from '../../utils/prisma.js';
import { getFormatieScore } from './formatie.service.js';
import { getVerzuimScore } from './verzuim.service.js';
import { getVervangingsScore } from './vervanging.service.js';
import { getLeeftijdScore } from './leeftijd.service.js';

// Gewichten deelmodules
const WEIGHTS = {
  formatie: 0.3,
  verzuim: 0.3,
  vervanging: 0.2,
  leeftijd: 0.2,
};

export function getHrRisico(score: number): HrRisico {
  if (score >= 70) return 'STABIEL';
  if (score >= 50) return 'KWETSBAAR';
  return 'HOOG_RISICO';
}

export async function calculateHrScore(schoolId: string): Promise<{
  hrScore: number;
  formatieScore: number;
  verzuimScore: number;
  vervangingsScore: number;
  leeftijdScore: number;
  risico: HrRisico;
}> {
  const [formatieScore, verzuimScore, vervangingsScore, leeftijdScore] = await Promise.all([
    getFormatieScore(schoolId),
    getVerzuimScore(schoolId),
    getVervangingsScore(schoolId),
    getLeeftijdScore(schoolId),
  ]);

  const hrScore = Math.round(
    formatieScore * WEIGHTS.formatie +
    verzuimScore * WEIGHTS.verzuim +
    vervangingsScore * WEIGHTS.vervanging +
    leeftijdScore * WEIGHTS.leeftijd,
  );

  return {
    hrScore,
    formatieScore,
    verzuimScore,
    vervangingsScore,
    leeftijdScore,
    risico: getHrRisico(hrScore),
  };
}

export async function getHrRisicoScore(schoolId: string): Promise<HrRisicoScore> {
  const school = await prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { naam: true },
  });

  const scores = await calculateHrScore(schoolId);

  // Determine trend by comparing with previous data (simplified: compare last 2 schooljaren)
  const trend = await getScoreTrend(schoolId);

  return {
    schoolId,
    schoolNaam: school.naam,
    ...scores,
    trend,
  };
}

async function getScoreTrend(
  schoolId: string,
): Promise<'STIJGEND' | 'STABIEL' | 'DALEND'> {
  // Get the two most recent formatie records to determine trend
  const formatieRecords = await prisma.hrFormatie.findMany({
    where: { schoolId },
    orderBy: { schooljaar: 'desc' },
    take: 2,
  });

  if (formatieRecords.length < 2) return 'STABIEL';

  const currentScore = formatieRecords[0].capaciteitsScore;
  const previousScore = formatieRecords[1].capaciteitsScore;
  const diff = currentScore - previousScore;

  if (diff > 5) return 'STIJGEND';
  if (diff < -5) return 'DALEND';
  return 'STABIEL';
}
