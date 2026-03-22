import { PrismaClient } from '@prisma/client';
import { searchDocuments } from '../ai/llm-client.js';

const prisma = new PrismaClient();

export async function semanticSearch(tenantId: string, vraag: string) {
  const schools = await prisma.school.findMany({
    where: { tenantId },
    select: { id: true },
  });

  const schoolIds = schools.map((s) => s.id);

  const sections = await prisma.documentSection.findMany({
    where: {
      analysis: {
        document: {
          schoolId: { in: schoolIds },
          tenantId,
        },
        status: 'COMPLETED',
      },
      inhoud: { not: '' },
    },
    include: {
      analysis: {
        include: {
          document: {
            select: { titel: true, createdAt: true, type: true },
          },
        },
      },
    },
    orderBy: { analysis: { document: { createdAt: 'desc' } } },
    take: 30,
  });

  if (sections.length === 0) {
    return {
      antwoord:
        'Er zijn nog geen geanalyseerde documenten beschikbaar. Upload en analyseer eerst documenten via de Documenthub.',
      gevonden: false,
      bronnen: [],
    };
  }

  const sectiesStr = sections
    .map(
      (s, i) =>
        `[Sectie ${i + 1}]\nDocument: ${s.analysis.document.titel}\nDatum: ${s.analysis.document.createdAt.toISOString().slice(0, 10)}\nSectie: ${s.titel}\nInhoud: ${s.inhoud.slice(0, 500)}`,
    )
    .join('\n\n---\n\n');

  const { result } = await searchDocuments(vraag, sectiesStr);
  return result;
}
