import prisma from '../../utils/prisma.js';

export interface SchoolDetail {
  schoolId: string;
  schoolNaam: string;
  rag: 'ROOD' | 'ORANJE' | 'GROEN';
  verzuimPct: number;
  compliancePct: number;
  openActies: number;
  openPdcaItems: number;
  hrSignalen: Array<{ id: string; titel: string; type: string; status: string }>;
  opsSignalen: Array<{ id: string; titel: string; type: string; severity: string; beschrijving: string }>;
  acties: Array<{ id: string; titel: string; prioriteit: string; status: string; deadline: string | null }>;
  complianceDomeinen: Array<{ domeinCode: string; domeinNaam: string; aantoonbaar: number; total: number }>;
  subsidieDeadlines: Array<{ naam: string; deadline: string; status: string }>;
}

export async function getSchoolDetail(tenantId: string, schoolId: string): Promise<SchoolDetail> {
  const school = await prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { naam: true },
  });

  const [hrSignalen, opsSignalen, acties, statuses, dossiers, verzuim, openPdcaItems] = await Promise.all([
    prisma.hrSignaal.findMany({
      where: { schoolId, status: { not: 'AFGEHANDELD' } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.opsSignaal.findMany({
      where: { schoolId, opgelost: false },
      take: 10,
      orderBy: { aangemeldOp: 'desc' },
    }),
    prisma.actie.findMany({
      where: { tenantId, schoolId, status: { in: ['OPEN', 'IN_BEHANDELING'] } },
      take: 15,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.schoolStandaardStatus.findMany({
      where: { schoolId },
      include: { standaard: { include: { domein: true } } },
    }),
    prisma.subsidieDossier.findMany({
      where: { tenantId, schoolIds: { has: schoolId } },
      orderBy: { verantwoordingDeadline: 'asc' },
      take: 5,
    }),
    prisma.hrVerzuim.findFirst({
      where: { schoolId },
      orderBy: { periode: 'desc' },
    }),
    prisma.pdcaItem.count({
      where: { schoolId, status: { not: 'AFGEROND' } },
    }),
  ]);

  // Compliance per domein
  const domeinMap = new Map<string, { code: string; naam: string; total: number; aantoonbaar: number }>();
  for (const s of statuses) {
    const d = s.standaard.domein;
    if (!domeinMap.has(d.id)) {
      domeinMap.set(d.id, { code: d.code, naam: d.naam, total: 0, aantoonbaar: 0 });
    }
    const entry = domeinMap.get(d.id)!;
    entry.total++;
    if (s.status === 'AANTOONBAAR') entry.aantoonbaar++;
  }

  const aantoonbaar = statuses.filter((s) => s.status === 'AANTOONBAAR').length;
  const compliancePct = statuses.length ? Math.round((aantoonbaar / statuses.length) * 100) : 0;
  const verzuimPct = verzuim?.verzuimPct ?? 0;
  const rag: SchoolDetail['rag'] =
    compliancePct >= 70 && verzuimPct <= 7
      ? 'GROEN'
      : compliancePct >= 50 || verzuimPct <= 10
        ? 'ORANJE'
        : 'ROOD';

  return {
    schoolId,
    schoolNaam: school.naam,
    rag,
    verzuimPct,
    compliancePct,
    openActies: acties.length,
    openPdcaItems,
    hrSignalen: hrSignalen.map((s) => ({ id: s.id, titel: s.titel, type: s.type, status: s.status })),
    opsSignalen: opsSignalen.map((s) => ({
      id: s.id,
      titel: s.titel,
      type: s.type,
      severity: s.severity,
      beschrijving: s.beschrijving,
    })),
    acties: acties.map((a) => ({
      id: a.id,
      titel: a.titel,
      prioriteit: a.prioriteit,
      status: a.status,
      deadline: a.deadline?.toISOString().slice(0, 10) ?? null,
    })),
    complianceDomeinen: [...domeinMap.values()].map((d) => ({
      domeinCode: d.code,
      domeinNaam: d.naam,
      aantoonbaar: d.aantoonbaar,
      total: d.total,
    })),
    subsidieDeadlines: dossiers
      .filter((d) => d.verantwoordingDeadline)
      .map((d) => ({
        naam: d.naam ?? 'Subsidiedossier',
        deadline: d.verantwoordingDeadline!.toISOString().slice(0, 10),
        status: d.status,
      })),
  };
}
