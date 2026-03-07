import prisma from '../utils/prisma.js';
import { getCurrentSchoolYear } from './pdca.service.js';
import type { PdcaFase } from '@prisma/client';

export interface GapAnalysisResult {
  missingDocuments: { type: string; description: string }[];
  missingEvaluations: { standaardCode: string; standaardNaam: string }[];
  outdatedPolicies: { documentId: string; titel: string; vervaltDatum: string }[];
  incompletePdcaPhases: { schooljaar: string; missingPhases: string[] }[];
  standardsWithoutEvidence: { code: string; naam: string }[];
}

const REQUIRED_DOCUMENT_TYPES = [
  { type: 'SCHOOLPLAN', description: 'Schoolplan' },
  { type: 'JAARPLAN', description: 'Jaarplan' },
  { type: 'VEILIGHEIDSBELEID', description: 'Veiligheidsbeleid' },
  { type: 'SCHOOLGIDS', description: 'Schoolgids' },
];

export async function analyzeSchool(tenantId: string, schoolId: string): Promise<GapAnalysisResult> {
  // 1. Missing documents
  const documents = await prisma.document.findMany({
    where: { tenantId, schoolId, status: 'ACTUEEL' },
    select: { type: true },
  });
  const existingTypes = new Set(documents.map((d) => d.type));
  const missingDocuments = REQUIRED_DOCUMENT_TYPES.filter((r) => !existingTypes.has(r.type as any));

  // 2. Missing evaluations
  const statuses = await prisma.schoolStandaardStatus.findMany({
    where: { schoolId, evaluatie: '', status: { not: 'ONTBREEKT' } },
    include: { standaard: true },
  });
  const missingEvaluations = statuses.map((s) => ({
    standaardCode: s.standaard.code,
    standaardNaam: s.standaard.naam,
  }));

  // 3. Outdated policies
  const now = new Date();
  const outdatedDocs = await prisma.document.findMany({
    where: {
      tenantId,
      schoolId,
      OR: [
        { vervaltDatum: { lt: now } },
        { status: 'VERLOPEN' },
      ],
    },
    select: { id: true, titel: true, vervaltDatum: true },
  });
  const outdatedPolicies = outdatedDocs.map((d) => ({
    documentId: d.id,
    titel: d.titel,
    vervaltDatum: d.vervaltDatum?.toISOString() ?? '',
  }));

  // 4. Incomplete PDCA phases
  const schooljaar = getCurrentSchoolYear();
  const pdcaItems = await prisma.pdcaItem.findMany({
    where: { schoolId, schooljaar },
  });
  const allPhases: PdcaFase[] = ['PLAN', 'DO', 'CHECK', 'ACT'];
  const presentPhases = new Set(pdcaItems.map((i) => i.fase));
  const missingPhases = allPhases.filter((p) => !presentPhases.has(p));
  const incompletePdcaPhases = missingPhases.length > 0
    ? [{ schooljaar, missingPhases }]
    : [];

  // 5. Standards without evidence
  const allStandaarden = await prisma.inspectieStandaard.findMany({
    include: {
      documentLinks: { where: { document: { schoolId } } },
    },
  });
  const standardsWithoutEvidence = allStandaarden
    .filter((s) => s.documentLinks.length === 0)
    .map((s) => ({ code: s.code, naam: s.naam }));

  return {
    missingDocuments,
    missingEvaluations,
    outdatedPolicies,
    incompletePdcaPhases,
    standardsWithoutEvidence,
  };
}
