import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { BewijsStatus } from '@prisma/client';

export interface ComplianceStandaard {
  standaardId: string;
  code: string;
  naam: string;
  domeinCode: string;
  domeinNaam: string;
  gewicht: number;
  /** Handmatige status uit SchoolStandaardStatus */
  handmatigeStatus: BewijsStatus;
  /** AI-bepaalde status op basis van document-analyses */
  aiStatus: BewijsStatus | null;
  /** Gecombineerde status (handmatig + AI) */
  effectieveStatus: BewijsStatus;
  /** AI confidence score 0-1 */
  aiConfidence: number | null;
  /** Aantal gekoppelde documenten */
  aantalDocumenten: number;
  /** Aantal AI-gekoppelde secties */
  aantalAiSecties: number;
  /** Meest recente bewijs */
  laatsteBewijs: string;
  /** Is het bewijs actueel? */
  actueel: boolean;
}

export interface SchoolComplianceMatrix {
  schoolId: string;
  schoolNaam: string;
  domeinen: {
    code: string;
    naam: string;
    standaarden: ComplianceStandaard[];
    domeinScore: number;
  }[];
  overallScore: number;
  aantoonbaarCount: number;
  onvolledigCount: number;
  ontbreektCount: number;
  totalStandaarden: number;
}

export interface BestuurComplianceOverview {
  schools: {
    schoolId: string;
    schoolNaam: string;
    overallScore: number;
    aantoonbaarPct: number;
    onvolledigPct: number;
    ontbreektPct: number;
    risico: 'LAAG' | 'MIDDEN' | 'HOOG';
  }[];
  gemiddeldScore: number;
}

/**
 * Build a compliance matrix for a school, combining manual statuses and AI analysis.
 */
export async function getSchoolComplianceMatrix(
  tenantId: string,
  schoolId: string,
): Promise<SchoolComplianceMatrix> {
  const school = await prisma.school.findFirst({
    where: { id: schoolId, tenantId },
  });

  if (!school) throw new NotFoundError('School');

  // Fetch all domeinen + standaarden
  const domeinen = await prisma.inspectieDomein.findMany({
    include: { standaarden: { orderBy: { code: 'asc' } } },
    orderBy: { code: 'asc' },
  });

  // Fetch manual statuses
  const manualStatuses = await prisma.schoolStandaardStatus.findMany({
    where: { schoolId },
  });
  const manualMap = new Map(manualStatuses.map((s) => [s.standaardId, s]));

  // Fetch AI section links (from completed analyses for this school)
  const aiSectionLinks = await prisma.sectionStandaardLink.findMany({
    where: {
      section: {
        analysis: {
          document: { schoolId, tenantId },
          status: 'COMPLETED',
        },
      },
    },
    include: {
      section: {
        include: {
          analysis: { select: { documentId: true } },
        },
      },
    },
  });

  // Group AI links by standaard
  const aiByStandaard = new Map<string, { count: number; avgRelevance: number; docIds: Set<string> }>();
  for (const link of aiSectionLinks) {
    const existing = aiByStandaard.get(link.standaardId) || { count: 0, avgRelevance: 0, docIds: new Set<string>() };
    existing.count += 1;
    existing.avgRelevance = (existing.avgRelevance * (existing.count - 1) + link.relevance) / existing.count;
    existing.docIds.add(link.section.analysis.documentId);
    aiByStandaard.set(link.standaardId, existing);
  }

  // Fetch document links (manual)
  const docLinks = await prisma.documentStandaardLink.findMany({
    where: { document: { schoolId, tenantId } },
  });
  const docLinksByStandaard = new Map<string, number>();
  for (const link of docLinks) {
    docLinksByStandaard.set(link.standaardId, (docLinksByStandaard.get(link.standaardId) || 0) + 1);
  }

  let aantoonbaarCount = 0;
  let onvolledigCount = 0;
  let ontbreektCount = 0;
  let totalWeightedScore = 0;
  let totalWeight = 0;

  const domeinResults = domeinen.map((domein) => {
    let domeinWeightedScore = 0;
    let domeinWeight = 0;

    const standaarden: ComplianceStandaard[] = domein.standaarden.map((standaard) => {
      const manual = manualMap.get(standaard.id);
      const ai = aiByStandaard.get(standaard.id);
      const handmatigeStatus: BewijsStatus = manual?.status ?? 'ONTBREEKT';

      // Determine AI status from section links
      let aiStatus: BewijsStatus | null = null;
      let aiConfidence: number | null = null;

      if (ai && ai.count > 0) {
        aiConfidence = ai.avgRelevance;
        if (ai.avgRelevance >= 0.7 && ai.count >= 2) {
          aiStatus = 'AANTOONBAAR';
        } else if (ai.avgRelevance >= 0.4 || ai.count >= 1) {
          aiStatus = 'ONVOLLEDIG';
        } else {
          aiStatus = 'ONTBREEKT';
        }
      }

      // Combined status: prefer the better of manual or AI
      const effectieveStatus = getBetterStatus(handmatigeStatus, aiStatus);

      // Count totals
      if (effectieveStatus === 'AANTOONBAAR') aantoonbaarCount++;
      else if (effectieveStatus === 'ONVOLLEDIG') onvolledigCount++;
      else ontbreektCount++;

      // Score calculation
      const statusScore = effectieveStatus === 'AANTOONBAAR' ? 100 : effectieveStatus === 'ONVOLLEDIG' ? 50 : 0;
      domeinWeightedScore += statusScore * standaard.gewicht;
      domeinWeight += standaard.gewicht;
      totalWeightedScore += statusScore * standaard.gewicht;
      totalWeight += standaard.gewicht;

      return {
        standaardId: standaard.id,
        code: standaard.code,
        naam: standaard.naam,
        domeinCode: domein.code,
        domeinNaam: domein.naam,
        gewicht: standaard.gewicht,
        handmatigeStatus,
        aiStatus,
        effectieveStatus,
        aiConfidence,
        aantalDocumenten: docLinksByStandaard.get(standaard.id) ?? 0,
        aantalAiSecties: ai?.count ?? 0,
        laatsteBewijs: manual?.bewijs ?? '',
        actueel: manual?.actueel ?? false,
      };
    });

    return {
      code: domein.code,
      naam: domein.naam,
      standaarden,
      domeinScore: domeinWeight > 0 ? Math.round(domeinWeightedScore / domeinWeight) : 0,
    };
  });

  const totalStandaarden = aantoonbaarCount + onvolledigCount + ontbreektCount;

  return {
    schoolId,
    schoolNaam: school.naam,
    domeinen: domeinResults,
    overallScore: totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0,
    aantoonbaarCount,
    onvolledigCount,
    ontbreektCount,
    totalStandaarden,
  };
}

/**
 * Get compliance overview for all schools in a bestuur.
 */
export async function getBestuurComplianceOverview(
  tenantId: string,
): Promise<BestuurComplianceOverview> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    orderBy: { naam: 'asc' },
  });

  let totalScore = 0;
  const schoolResults = [];

  for (const school of schools) {
    const matrix = await getSchoolComplianceMatrix(tenantId, school.id);
    const total = matrix.totalStandaarden || 1;

    schoolResults.push({
      schoolId: school.id,
      schoolNaam: school.naam,
      overallScore: matrix.overallScore,
      aantoonbaarPct: Math.round((matrix.aantoonbaarCount / total) * 100),
      onvolledigPct: Math.round((matrix.onvolledigCount / total) * 100),
      ontbreektPct: Math.round((matrix.ontbreektCount / total) * 100),
      risico: matrix.overallScore >= 70 ? 'LAAG' as const : matrix.overallScore >= 50 ? 'MIDDEN' as const : 'HOOG' as const,
    });

    totalScore += matrix.overallScore;
  }

  return {
    schools: schoolResults.sort((a, b) => a.overallScore - b.overallScore),
    gemiddeldScore: schools.length > 0 ? Math.round(totalScore / schools.length) : 0,
  };
}

function getBetterStatus(a: BewijsStatus, b: BewijsStatus | null): BewijsStatus {
  if (!b) return a;
  const order: Record<BewijsStatus, number> = { AANTOONBAAR: 2, ONVOLLEDIG: 1, ONTBREEKT: 0 };
  return order[a] >= order[b] ? a : b;
}
