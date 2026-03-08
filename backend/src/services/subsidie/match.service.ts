import prisma from '../../utils/prisma.js';

// ─── Service functions ──────────────────────────────────────

export async function calculateMatches(tenantId: string) {
  const now = new Date();

  // Fetch tenant schools count
  const schoolsCount = await prisma.school.count({
    where: { tenantId, status: 'ACTIEF' },
  });

  // Fetch all active regelingen
  const regelingen = await prisma.subsidieRegeling.findMany({
    where: { actief: true },
  });

  // Fetch existing dossiers for this tenant
  const existingDossiers = await prisma.subsidieDossier.findMany({
    where: { tenantId },
    select: { subsidieId: true, status: true },
  });

  const dossierByRegeling = new Map<string, string>();
  for (const d of existingDossiers) {
    dossierByRegeling.set(d.subsidieId, d.status);
  }

  const results: Array<{
    subsidieId: string;
    matchScore: number;
    matchToelichting: string;
  }> = [];

  for (const regeling of regelingen) {
    let score = 0.5;
    const toelichting: string[] = [];

    // +0.2 if tenant has more than 3 schools
    if (schoolsCount > 3) {
      score += 0.2;
      toelichting.push(`Bestuur heeft ${schoolsCount} scholen (>3)`);
    }

    // +0.1 if no existing dossier for this regeling
    if (!dossierByRegeling.has(regeling.id)) {
      score += 0.1;
      toelichting.push('Nog geen dossier voor deze regeling');
    }

    // +0.1 if deadline is more than 21 days away
    if (regeling.aanvraagPeriodeSluiting) {
      const deadline = new Date(regeling.aanvraagPeriodeSluiting);
      const daysUntilDeadline = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilDeadline > 21) {
        score += 0.1;
        toelichting.push(`Deadline over ${daysUntilDeadline} dagen (>21)`);
      } else if (daysUntilDeadline < 0) {
        // -0.2 if deadline has passed
        score -= 0.2;
        toelichting.push('Aanvraagdeadline is verstreken');
      }
    }

    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));
    score = Math.round(score * 100) / 100;

    results.push({
      subsidieId: regeling.id,
      matchScore: score,
      matchToelichting: toelichting.join('; '),
    });
  }

  // Upsert all matches
  for (const result of results) {
    await prisma.subsidieMatch.upsert({
      where: {
        tenantId_subsidieId: {
          tenantId,
          subsidieId: result.subsidieId,
        },
      },
      create: {
        tenantId,
        subsidieId: result.subsidieId,
        matchScore: result.matchScore,
        matchToelichting: result.matchToelichting,
      },
      update: {
        matchScore: result.matchScore,
        matchToelichting: result.matchToelichting,
      },
    });
  }

  return { calculated: results.length };
}

export async function getMatches(tenantId: string) {
  return prisma.subsidieMatch.findMany({
    where: { tenantId },
    include: {
      regeling: true,
    },
    orderBy: { matchScore: 'desc' },
  });
}
