import prisma from '../utils/prisma.js';
import type { Prisma } from '@prisma/client';

interface DomainScore {
  code: string;
  naam: string;
  score: number;
  maxPoints: number;
  earnedPoints: number;
}

interface ScoreBreakdown {
  totalScore: number;
  domainScores: DomainScore[];
}

export async function calculateSchoolScore(tenantId: string, schoolId: string): Promise<ScoreBreakdown> {
  const domeinen = await prisma.inspectieDomein.findMany({
    include: {
      standaarden: {
        include: {
          schoolStatuses: { where: { schoolId } },
          documentLinks: { where: { document: { schoolId } } },
        },
      },
    },
    orderBy: { code: 'asc' },
  });

  const domainScores: DomainScore[] = domeinen.map((domein) => {
    let maxPoints = 0;
    let earnedPoints = 0;

    for (const standaard of domein.standaarden) {
      const fullPoints = standaard.gewicht * 10;
      maxPoints += fullPoints;

      const status = standaard.schoolStatuses[0];
      if (!status || status.status === 'ONTBREEKT') {
        // 0 points
      } else if (status.status === 'ONVOLLEDIG') {
        earnedPoints += fullPoints * 0.4;
      } else if (status.status === 'AANTOONBAAR') {
        const hasEvidence = standaard.documentLinks.length > 0;
        if (status.actueel && hasEvidence) {
          earnedPoints += fullPoints;
        } else {
          earnedPoints += fullPoints * 0.7;
        }
      }
    }

    const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    return { code: domein.code, naam: domein.naam, score, maxPoints, earnedPoints };
  });

  const totalScore = domainScores.length > 0
    ? Math.round(domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length)
    : 0;

  // Cache the score
  await prisma.readinessScore.create({
    data: {
      schoolId,
      totalScore,
      domainScores: Object.fromEntries(domainScores.map((d) => [d.code, d.score])) as Prisma.InputJsonValue,
    },
  });

  return { totalScore, domainScores };
}

export async function calculateAllSchoolScores(tenantId: string) {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true },
  });

  const results: Record<string, ScoreBreakdown> = {};
  for (const school of schools) {
    results[school.id] = await calculateSchoolScore(tenantId, school.id);
  }
  return results;
}

export async function getLatestScore(schoolId: string) {
  return prisma.readinessScore.findFirst({
    where: { schoolId },
    orderBy: { berekendOp: 'desc' },
  });
}
