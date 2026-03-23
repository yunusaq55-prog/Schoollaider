import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AggregatedSignaal {
  id: string;
  bron: 'HR' | 'Subsidie' | 'PDCA' | 'Compliance' | 'Operationeel';
  schoolId: string;
  schoolNaam: string;
  titel: string;
  beschrijving: string;
  urgentie: 'KRITIEK' | 'HOOG' | 'MIDDEL' | 'LAAG';
  datum: string;
  bronType: string;
  aanbevolenActie?: string;
}

const URGENTIE_ORDER = { KRITIEK: 4, HOOG: 3, MIDDEL: 2, LAAG: 1 };

function hrSignaalUrgentie(type: string): AggregatedSignaal['urgentie'] {
  const upper = type.toUpperCase();
  if (upper.includes('VERZUIM') || upper.includes('TEKORT')) return 'HOOG';
  if (upper.includes('VERVANGING')) return 'MIDDEL';
  return 'LAAG';
}

function subsidieUrgentie(urgentie: string): AggregatedSignaal['urgentie'] {
  if (urgentie === 'KRITIEK') return 'KRITIEK';
  if (urgentie === 'WAARSCHUWING') return 'HOOG';
  return 'MIDDEL';
}

export async function aggregateSignalen(tenantId: string): Promise<AggregatedSignaal[]> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true, naam: true },
  });

  const schoolIds = schools.map((s) => s.id);
  const schoolMap = new Map(schools.map((s) => [s.id, s.naam]));

  const [hrSignalen, subsidieSignalen, pdcaSuggestions, ontbrekendStatuses, opsSignalen] = await Promise.all([
    prisma.hrSignaal.findMany({
      where: { schoolId: { in: schoolIds }, status: { not: 'AFGEHANDELD' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.subsidieSignaal.findMany({
      where: { tenantId, gelezen: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.pdcaSuggestion.findMany({
      where: { schoolId: { in: schoolIds }, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.schoolStandaardStatus.findMany({
      where: { schoolId: { in: schoolIds }, status: 'ONTBREEKT' },
      include: { standaard: true },
      take: 30,
    }),
    prisma.opsSignaal.findMany({
      where: { tenantId, opgelost: false },
      orderBy: { aangemeldOp: 'desc' },
      take: 30,
    }),
  ]);

  const result: AggregatedSignaal[] = [];

  for (const s of hrSignalen) {
    result.push({
      id: s.id,
      bron: 'HR',
      schoolId: s.schoolId,
      schoolNaam: schoolMap.get(s.schoolId) ?? 'Onbekende school',
      titel: s.titel,
      beschrijving: s.beschrijving,
      urgentie: hrSignaalUrgentie(s.type),
      datum: s.createdAt.toISOString().slice(0, 10),
      bronType: 'HrSignaal',
      aanbevolenActie: s.aanbevolenActie,
    });
  }

  for (const s of subsidieSignalen) {
    result.push({
      id: s.id,
      bron: 'Subsidie',
      schoolId: '',
      schoolNaam: 'Bestuur',
      titel: s.titel,
      beschrijving: s.beschrijving,
      urgentie: subsidieUrgentie(s.urgentie),
      datum: s.createdAt.toISOString().slice(0, 10),
      bronType: 'SubsidieSignaal',
    });
  }

  for (const s of pdcaSuggestions) {
    result.push({
      id: s.id,
      bron: 'PDCA',
      schoolId: s.schoolId,
      schoolNaam: schoolMap.get(s.schoolId) ?? 'Onbekende school',
      titel: s.titel,
      beschrijving: s.beschrijving,
      urgentie: s.vertrouwen >= 0.8 ? 'HOOG' : 'MIDDEL',
      datum: s.createdAt.toISOString().slice(0, 10),
      bronType: 'PdcaSuggestion',
    });
  }

  for (const s of ontbrekendStatuses) {
    result.push({
      id: s.id,
      bron: 'Compliance',
      schoolId: s.schoolId,
      schoolNaam: schoolMap.get(s.schoolId) ?? 'Onbekende school',
      titel: `Standaard ontbreekt: ${s.standaard.code} – ${s.standaard.naam}`,
      beschrijving: s.standaard.beschrijving,
      urgentie: 'HOOG',
      datum: s.updatedAt.toISOString().slice(0, 10),
      bronType: 'SchoolStandaardStatus',
    });
  }

  for (const s of opsSignalen) {
    result.push({
      id: s.id,
      bron: 'Operationeel',
      schoolId: s.schoolId,
      schoolNaam: schoolMap.get(s.schoolId) ?? 'Onbekende school',
      titel: s.titel,
      beschrijving: s.beschrijving,
      urgentie: s.severity === 'URGENT' ? 'KRITIEK' : 'HOOG',
      datum: s.aangemeldOp.toISOString().slice(0, 10),
      bronType: 'OpsSignaal',
      aanbevolenActie: undefined,
    });
  }

  return result.sort(
    (a, b) => URGENTIE_ORDER[b.urgentie] - URGENTIE_ORDER[a.urgentie],
  );
}
