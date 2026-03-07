import prisma from '../utils/prisma.js';
import { calculateSchoolScore } from './readiness.service.js';
import { analyzeSchool } from './gap-analysis.service.js';
import { getCurrentSchoolYear } from './pdca.service.js';
import type { BewijsStatus } from '@prisma/client';

export interface BestuurKPIs {
  avgReadinessScore: number;
  schoolsBelowThreshold: number;
  missingDocuments: number;
  incompletePdcaCycles: number;
  outdatedPolicies: number;
}

export interface SchoolOverviewRow {
  schoolId: string;
  schoolNaam: string;
  score: number;
  veiligheid: BewijsStatus | 'ONTBREEKT';
  kwaliteit: BewijsStatus | 'ONTBREEKT';
  pdcaComplete: boolean;
  risico: 'LAAG' | 'MIDDEN' | 'HOOG';
}

function getDomainWorstStatus(statuses: { status: string }[]): BewijsStatus {
  if (statuses.length === 0) return 'ONTBREEKT';
  if (statuses.some((s) => s.status === 'ONTBREEKT')) return 'ONTBREEKT';
  if (statuses.some((s) => s.status === 'ONVOLLEDIG')) return 'ONVOLLEDIG';
  return 'AANTOONBAAR';
}

function getRisico(score: number): 'LAAG' | 'MIDDEN' | 'HOOG' {
  if (score >= 70) return 'LAAG';
  if (score >= 50) return 'MIDDEN';
  return 'HOOG';
}

export async function getBestuurKPIs(tenantId: string): Promise<BestuurKPIs> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true },
  });

  let totalScore = 0;
  let schoolsBelowThreshold = 0;
  let missingDocuments = 0;
  let incompletePdcaCycles = 0;
  let outdatedPolicies = 0;

  for (const school of schools) {
    const scoreData = await calculateSchoolScore(tenantId, school.id);
    totalScore += scoreData.totalScore;
    if (scoreData.totalScore < 70) schoolsBelowThreshold++;

    const gaps = await analyzeSchool(tenantId, school.id);
    missingDocuments += gaps.missingDocuments.length;
    incompletePdcaCycles += gaps.incompletePdcaPhases.length;
    outdatedPolicies += gaps.outdatedPolicies.length;
  }

  return {
    avgReadinessScore: schools.length > 0 ? Math.round(totalScore / schools.length) : 0,
    schoolsBelowThreshold,
    missingDocuments,
    incompletePdcaCycles,
    outdatedPolicies,
  };
}

export async function getSchoolOverviewTable(tenantId: string): Promise<SchoolOverviewRow[]> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    orderBy: { naam: 'asc' },
  });

  const rows: SchoolOverviewRow[] = [];
  const schooljaar = getCurrentSchoolYear();

  for (const school of schools) {
    const scoreData = await calculateSchoolScore(tenantId, school.id);

    // Get veiligheid domain statuses (VE)
    const veStatuses = await prisma.schoolStandaardStatus.findMany({
      where: { schoolId: school.id, standaard: { domein: { code: 'VE' } } },
    });

    // Get kwaliteitszorg domain statuses (KA)
    const kaStatuses = await prisma.schoolStandaardStatus.findMany({
      where: { schoolId: school.id, standaard: { domein: { code: 'KA' } } },
    });

    // Check PDCA completeness
    const pdcaItems = await prisma.pdcaItem.findMany({
      where: { schoolId: school.id, schooljaar },
    });
    const phases = new Set(pdcaItems.filter((i) => i.status === 'AFGEROND').map((i) => i.fase));
    const pdcaComplete = phases.size === 4;

    rows.push({
      schoolId: school.id,
      schoolNaam: school.naam,
      score: scoreData.totalScore,
      veiligheid: getDomainWorstStatus(veStatuses),
      kwaliteit: getDomainWorstStatus(kaStatuses),
      pdcaComplete,
      risico: getRisico(scoreData.totalScore),
    });
  }

  return rows.sort((a, b) => a.score - b.score);
}

export async function getSchoolAlerts(tenantId: string) {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true, naam: true },
  });

  const alerts: { type: string; message: string; schoolId: string; schoolNaam: string }[] = [];

  for (const school of schools) {
    const gaps = await analyzeSchool(tenantId, school.id);

    for (const doc of gaps.missingDocuments) {
      alerts.push({
        type: 'missing_document',
        message: `${doc.description} ontbreekt`,
        schoolId: school.id,
        schoolNaam: school.naam,
      });
    }

    for (const phase of gaps.incompletePdcaPhases) {
      alerts.push({
        type: 'incomplete_pdca',
        message: `PDCA-fase(n) ontbreken: ${phase.missingPhases.join(', ')}`,
        schoolId: school.id,
        schoolNaam: school.naam,
      });
    }

    for (const policy of gaps.outdatedPolicies) {
      alerts.push({
        type: 'outdated_policy',
        message: `Verouderd beleid: ${policy.titel}`,
        schoolId: school.id,
        schoolNaam: school.naam,
      });
    }
  }

  return alerts;
}
