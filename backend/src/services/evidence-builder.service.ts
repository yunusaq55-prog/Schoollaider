import prisma from '../utils/prisma.js';
import { getSchoolComplianceMatrix } from './compliance.service.js';

export interface EvidencePackage {
  school: { naam: string; brinCode: string; directeur: string };
  complianceMatrix: {
    overallScore: number;
    domeinen: {
      code: string;
      naam: string;
      score: number;
      standaarden: {
        code: string;
        naam: string;
        status: string;
        aiConfidence: number | null;
        evidence: string[];
        documenten: string[];
      }[];
    }[];
  };
  aiSummaries: {
    documentTitel: string;
    documentType: string;
    summary: string;
    sectionCount: number;
  }[];
  gaps: {
    standaardCode: string;
    beschrijving: string;
    ernst: string;
  }[];
  pdcaSuggesties: number;
}

/**
 * Build a comprehensive evidence package for a school.
 * Aggregates compliance, AI analyses, gaps, and PDCA data.
 */
export async function buildEvidencePackage(
  tenantId: string,
  schoolId: string,
): Promise<EvidencePackage> {
  const school = await prisma.school.findFirstOrThrow({
    where: { id: schoolId, tenantId },
  });

  // Get compliance matrix
  const matrix = await getSchoolComplianceMatrix(tenantId, schoolId);

  // Get AI summaries from completed analyses
  const analyses = await prisma.documentAnalysis.findMany({
    where: {
      document: { schoolId, tenantId },
      status: 'COMPLETED',
    },
    include: {
      document: { select: { titel: true, type: true } },
      documentSections: {
        include: {
          standaardLinks: {
            include: { standaard: { select: { code: true } } },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  });

  const aiSummaries = analyses.map((a) => ({
    documentTitel: a.document.titel,
    documentType: a.document.type,
    summary: a.summary ?? '',
    sectionCount: a.documentSections.length,
  }));

  // Collect all gaps from analyses
  const allGaps: { standaardCode: string; beschrijving: string; ernst: string }[] = [];
  for (const analysis of analyses) {
    const gaps = analysis.gaps as any[];
    if (gaps) {
      for (const gap of gaps) {
        allGaps.push({
          standaardCode: gap.standaardCode,
          beschrijving: gap.beschrijving,
          ernst: gap.ernst,
        });
      }
    }
  }

  // Count pending suggestions
  const suggestionCount = await prisma.pdcaSuggestion.count({
    where: { schoolId, status: 'pending' },
  });

  // Build evidence per standaard
  const complianceDomeinen = matrix.domeinen.map((d) => ({
    code: d.code,
    naam: d.naam,
    score: d.domeinScore,
    standaarden: d.standaarden.map((s) => {
      // Find evidence from AI sections
      const evidence: string[] = [];
      const docNames: string[] = [];

      for (const analysis of analyses) {
        for (const section of analysis.documentSections) {
          const link = section.standaardLinks.find(
            (l) => l.standaard.code === s.code,
          );
          if (link && link.relevance >= 0.5) {
            evidence.push(link.evidence);
            if (!docNames.includes(analysis.document.titel)) {
              docNames.push(analysis.document.titel);
            }
          }
        }
      }

      return {
        code: s.code,
        naam: s.naam,
        status: s.effectieveStatus,
        aiConfidence: s.aiConfidence,
        evidence,
        documenten: docNames,
      };
    }),
  }));

  return {
    school: {
      naam: school.naam,
      brinCode: school.brinCode,
      directeur: school.directeur,
    },
    complianceMatrix: {
      overallScore: matrix.overallScore,
      domeinen: complianceDomeinen,
    },
    aiSummaries,
    gaps: allGaps,
    pdcaSuggesties: suggestionCount,
  };
}
