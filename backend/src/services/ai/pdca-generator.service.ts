import prisma from '../../utils/prisma.js';
import { env } from '../../config/env.js';
import { AppError, NotFoundError } from '../../utils/errors.js';
import { generatePdcaSuggestions } from './llm-client.js';
import { getCurrentSchoolYear } from '../pdca.service.js';

/**
 * Generate PDCA improvement suggestions for a school using AI.
 * Based on completed document analyses.
 */
export async function generateSuggestionsForSchool(
  tenantId: string,
  schoolId: string,
  schooljaar?: string,
): Promise<{ count: number }> {
  if (!env.AI_ENABLED) {
    throw new AppError(400, 'AI is uitgeschakeld.');
  }

  const school = await prisma.school.findFirst({
    where: { id: schoolId, tenantId },
  });
  if (!school) throw new NotFoundError('School');

  const year = schooljaar || getCurrentSchoolYear();

  // Fetch completed analyses for this school
  const analyses = await prisma.documentAnalysis.findMany({
    where: {
      document: { schoolId, tenantId },
      status: 'COMPLETED',
    },
    include: {
      document: { select: { id: true, titel: true, type: true } },
      documentSections: {
        include: {
          standaardLinks: {
            include: { standaard: { select: { code: true, naam: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (analyses.length === 0) {
    throw new AppError(400, 'Geen voltooide analyses gevonden voor deze school. Upload en analyseer eerst documenten.');
  }

  // Build analysis summary for LLM
  const analysisResults = analyses.map((a) => ({
    document: a.document.titel,
    type: a.document.type,
    summary: a.summary,
    gaps: a.gaps,
    sections: a.documentSections.map((s) => ({
      titel: s.titel,
      standaarden: s.standaardLinks.map((l) => ({
        code: l.standaard.code,
        naam: l.standaard.naam,
        relevance: l.relevance,
      })),
    })),
  }));

  const { result } = await generatePdcaSuggestions(
    school.naam,
    year,
    JSON.stringify(analysisResults, null, 2),
  );

  // Build a lookup: document title → document ID for linking suggestions to source documents
  const docTitleToId = new Map<string, string>();
  for (const a of analyses) {
    docTitleToId.set(a.document.titel.toLowerCase(), a.document.id);
  }

  // Store suggestions
  let count = 0;
  for (const suggestion of result) {
    // Try to match bronSectie to a source document
    let bronDocumentId: string | null = null;
    if (suggestion.bronSectie) {
      const bronLower = suggestion.bronSectie.toLowerCase();
      for (const [titel, id] of docTitleToId) {
        if (bronLower.includes(titel) || titel.includes(bronLower)) {
          bronDocumentId = id;
          break;
        }
      }
    }
    // Fallback: use the first analysis document if no match found
    if (!bronDocumentId && analyses.length > 0) {
      bronDocumentId = analyses[0].document.id;
    }

    await prisma.pdcaSuggestion.create({
      data: {
        schoolId,
        schooljaar: year,
        fase: suggestion.fase,
        titel: suggestion.titel,
        beschrijving: suggestion.beschrijving,
        bronSectie: suggestion.bronSectie ?? null,
        bronDocumentId,
        vertrouwen: suggestion.vertrouwen,
        status: 'pending',
      },
    });
    count++;
  }

  return { count };
}

/**
 * List pending suggestions for a school.
 */
export async function listSuggestions(
  schoolId: string,
  schooljaar?: string,
  status?: string,
) {
  return prisma.pdcaSuggestion.findMany({
    where: {
      schoolId,
      ...(schooljaar ? { schooljaar } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ fase: 'asc' }, { vertrouwen: 'desc' }],
  });
}

/**
 * Accept a suggestion and create a PDCA item from it.
 */
export async function acceptSuggestion(suggestionId: string) {
  const suggestion = await prisma.pdcaSuggestion.findUnique({
    where: { id: suggestionId },
  });
  if (!suggestion) throw new NotFoundError('Suggestie');

  // Create PDCA item from suggestion
  const pdcaItem = await prisma.pdcaItem.create({
    data: {
      schoolId: suggestion.schoolId,
      schooljaar: suggestion.schooljaar,
      fase: suggestion.fase,
      titel: suggestion.titel,
      beschrijving: suggestion.beschrijving,
      bron: 'AI_GENERATED',
      bronDocumentId: suggestion.bronDocumentId,
      vertrouwen: suggestion.vertrouwen,
    },
  });

  // Update suggestion status
  await prisma.pdcaSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'accepted', pdcaItemId: pdcaItem.id },
  });

  return pdcaItem;
}

/**
 * Dismiss a suggestion.
 */
export async function dismissSuggestion(suggestionId: string) {
  const suggestion = await prisma.pdcaSuggestion.findUnique({
    where: { id: suggestionId },
  });
  if (!suggestion) throw new NotFoundError('Suggestie');

  return prisma.pdcaSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'dismissed' },
  });
}
