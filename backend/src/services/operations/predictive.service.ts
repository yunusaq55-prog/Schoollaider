import { PrismaClient } from '@prisma/client';
import { generatePredictiveInsights } from '../ai/llm-client.js';

const prisma = new PrismaClient();

export async function getPredictiveInsights(tenantId: string) {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true, naam: true },
  });

  const schoolIds = schools.map((s) => s.id);
  const schoolMap = new Map(schools.map((s) => [s.id, s.naam]));

  const verzuimData = await prisma.hrVerzuim.findMany({
    where: { schoolId: { in: schoolIds } },
    orderBy: [{ schoolId: 'asc' }, { periode: 'desc' }],
    take: schoolIds.length * 8,
  });

  if (verzuimData.length === 0) {
    return { inzichten: [] };
  }

  // Group by school and format
  const bySchool = new Map<string, typeof verzuimData>();
  for (const v of verzuimData) {
    if (!bySchool.has(v.schoolId)) bySchool.set(v.schoolId, []);
    bySchool.get(v.schoolId)!.push(v);
  }

  const verzuimStr = Array.from(bySchool.entries())
    .map(([schoolId, records]) => {
      const naam = schoolMap.get(schoolId) ?? 'Onbekend';
      const periodes = records
        .slice(0, 8)
        .map(
          (r) =>
            `  ${r.periode}: verzuim=${r.verzuimPct}%, kort=${r.kortVerzuimPct}%, lang=${r.langVerzuimPct}%`,
        )
        .join('\n');
      return `School: ${naam} (${schoolId})\n${periodes}`;
    })
    .join('\n\n');

  const { result } = await generatePredictiveInsights(verzuimStr);
  return result;
}
