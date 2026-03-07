import prisma from '../../utils/prisma.js';
import type { HrBestuurKPIs, HrSchoolOverviewRow, HrSignaal } from '@schoollaider/shared';
import { calculateHrScore, getHrRisico } from './hr-score.service.js';
import { getLatestVerzuimPct } from './verzuim.service.js';
import { countOpenSignalen } from './hr-signaal.service.js';

export async function getHrBestuurKPIs(tenantId: string): Promise<HrBestuurKPIs> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true },
  });

  let totalHrScore = 0;
  let scholenHoogRisico = 0;
  let totaalVacatures = 0;
  let totaalVervangingskosten = 0;
  let totalVerzuimPct = 0;
  let schoolsWithData = 0;

  for (const school of schools) {
    const scores = await calculateHrScore(school.id);
    totalHrScore += scores.hrScore;
    if (scores.risico === 'HOOG_RISICO') scholenHoogRisico++;

    // Vacatures
    const formatie = await prisma.hrFormatie.findFirst({
      where: { schoolId: school.id },
      orderBy: { schooljaar: 'desc' },
    });
    if (formatie) {
      totaalVacatures += formatie.vacatures;
    }

    // Vervangingskosten
    const vervanging = await prisma.hrVervanging.findFirst({
      where: { schoolId: school.id },
      orderBy: { schooljaar: 'desc' },
    });
    if (vervanging) {
      totaalVervangingskosten += vervanging.kostenVervanging;
    }

    // Verzuim
    const verzuimPct = await getLatestVerzuimPct(school.id);
    if (verzuimPct > 0) {
      totalVerzuimPct += verzuimPct;
      schoolsWithData++;
    }
  }

  return {
    gemHrScore: schools.length > 0 ? Math.round(totalHrScore / schools.length) : 0,
    scholenHoogRisico,
    totaalVacatures,
    totaalVervangingskosten: Math.round(totaalVervangingskosten),
    gemVerzuimPct: schoolsWithData > 0
      ? Math.round(totalVerzuimPct / schoolsWithData * 10) / 10
      : 0,
  };
}

export async function getHrSchoolOverview(tenantId: string): Promise<HrSchoolOverviewRow[]> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    orderBy: { naam: 'asc' },
  });

  const rows: HrSchoolOverviewRow[] = [];

  for (const school of schools) {
    const scores = await calculateHrScore(school.id);
    const verzuimPct = await getLatestVerzuimPct(school.id);
    const openSignalen = await countOpenSignalen(school.id);

    // Determine trend (simplified)
    const formatieRecords = await prisma.hrFormatie.findMany({
      where: { schoolId: school.id },
      orderBy: { schooljaar: 'desc' },
      take: 2,
    });

    let trend: 'STIJGEND' | 'STABIEL' | 'DALEND' = 'STABIEL';
    if (formatieRecords.length >= 2) {
      const diff = formatieRecords[0].capaciteitsScore - formatieRecords[1].capaciteitsScore;
      if (diff > 5) trend = 'STIJGEND';
      else if (diff < -5) trend = 'DALEND';
    }

    rows.push({
      schoolId: school.id,
      schoolNaam: school.naam,
      hrScore: scores.hrScore,
      formatieScore: scores.formatieScore,
      verzuimPct,
      vervangingsIndex: scores.vervangingsScore,
      risico: scores.risico,
      trend,
      openSignalen,
    });
  }

  // Sort by score ascending (worst first)
  return rows.sort((a, b) => a.hrScore - b.hrScore);
}

export async function getHrAlerts(tenantId: string): Promise<(HrSignaal & { schoolNaam: string })[]> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true, naam: true },
  });

  const schoolMap = new Map(schools.map((s) => [s.id, s.naam]));
  const schoolIds = schools.map((s) => s.id);

  const signalen = await prisma.hrSignaal.findMany({
    where: {
      schoolId: { in: schoolIds },
      status: { not: 'AFGEHANDELD' },
    },
    orderBy: { createdAt: 'desc' },
  });

  return signalen.map((s) => ({
    id: s.id,
    schoolId: s.schoolId,
    type: s.type as HrSignaal['type'],
    titel: s.titel,
    beschrijving: s.beschrijving,
    aanbevolenActie: s.aanbevolenActie,
    deadline: s.deadline?.toISOString() ?? null,
    status: s.status as HrSignaal['status'],
    createdAt: s.createdAt.toISOString(),
    schoolNaam: schoolMap.get(s.schoolId) ?? 'Onbekend',
  }));
}
