import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SchoolOverviewRow {
  schoolId: string;
  schoolNaam: string;
  hrRisico: string;
  verzuimPct: number;
  compliancePct: number;
  openPdcaItems: number;
  openActies: number;
  openSubsidies: number;
  aankomendSubsidieDeadline: string | null;
  rag: 'ROOD' | 'ORANJE' | 'GROEN';
}

export async function getSchoolOverview(tenantId: string): Promise<SchoolOverviewRow[]> {
  const schools = await prisma.school.findMany({
    where: { tenantId, status: 'ACTIEF' },
    select: { id: true, naam: true },
  });

  const schoolIds = schools.map((s) => s.id);
  const today = new Date();

  const [
    hrScores,
    latestVerzuim,
    standaardStatuses,
    openPdca,
    openActies,
    openSubsidieDossiers,
  ] = await Promise.all([
    prisma.hrSignaal.groupBy({
      by: ['schoolId'],
      where: { schoolId: { in: schoolIds }, status: 'OPEN' },
      _count: { id: true },
    }),
    prisma.hrVerzuim.findMany({
      where: { schoolId: { in: schoolIds } },
      orderBy: { periode: 'desc' },
      distinct: ['schoolId'],
      select: { schoolId: true, verzuimPct: true },
    }),
    prisma.schoolStandaardStatus.groupBy({
      by: ['schoolId', 'status'],
      where: { schoolId: { in: schoolIds } },
      _count: { id: true },
    }),
    prisma.pdcaItem.groupBy({
      by: ['schoolId'],
      where: { schoolId: { in: schoolIds }, status: { not: 'AFGEROND' } },
      _count: { id: true },
    }),
    prisma.actie.groupBy({
      by: ['schoolId'],
      where: { tenantId, schoolId: { in: schoolIds }, status: { in: ['OPEN', 'IN_BEHANDELING'] } },
      _count: { id: true },
    }),
    prisma.subsidieDossier.findMany({
      where: {
        tenantId,
        status: { notIn: ['AFGEROND', 'AFGEWEZEN', 'INGETROKKEN'] },
        verantwoordingDeadline: { not: null },
      },
      select: { schoolIds: true, verantwoordingDeadline: true, status: true },
      orderBy: { verantwoordingDeadline: 'asc' },
    }),
  ]);

  const verzuimMap = new Map(latestVerzuim.map((v) => [v.schoolId, v.verzuimPct]));
  const hrSignalenMap = new Map(hrScores.map((h) => [h.schoolId, h._count.id]));
  const pdcaMap = new Map(openPdca.map((p) => [p.schoolId, p._count.id]));
  const actiesMap = new Map(openActies.map((a) => [a.schoolId, a._count.id]));

  // Compliance per school
  const complianceBySchool = new Map<string, { aantoonbaar: number; total: number }>();
  for (const s of standaardStatuses) {
    const entry = complianceBySchool.get(s.schoolId) ?? { aantoonbaar: 0, total: 0 };
    entry.total += s._count.id;
    if (s.status === 'AANTOONBAAR') entry.aantoonbaar += s._count.id;
    complianceBySchool.set(s.schoolId, entry);
  }

  return schools.map((school) => {
    const verzuim = verzuimMap.get(school.id) ?? 0;
    const compliance = complianceBySchool.get(school.id);
    const compliancePct = compliance && compliance.total > 0
      ? Math.round((compliance.aantoonbaar / compliance.total) * 100)
      : 0;
    const openActiesCount = actiesMap.get(school.id) ?? 0;
    const openPdcaCount = pdcaMap.get(school.id) ?? 0;
    const hrOpenSignalen = hrSignalenMap.get(school.id) ?? 0;

    // Subsidies for this school
    const schoolSubsidies = openSubsidieDossiers.filter((d) =>
      d.schoolIds.includes(school.id),
    );
    const earliestDeadline = schoolSubsidies.find(
      (d) => d.verantwoordingDeadline && d.verantwoordingDeadline >= today,
    )?.verantwoordingDeadline;

    // RAG determination
    let rag: SchoolOverviewRow['rag'] = 'GROEN';
    if (verzuim > 8 || compliancePct < 50 || hrOpenSignalen >= 3) {
      rag = 'ROOD';
    } else if (verzuim > 5 || compliancePct < 70 || hrOpenSignalen >= 1) {
      rag = 'ORANJE';
    }

    return {
      schoolId: school.id,
      schoolNaam: school.naam,
      hrRisico: hrOpenSignalen >= 3 ? 'HOOG_RISICO' : hrOpenSignalen >= 1 ? 'KWETSBAAR' : 'STABIEL',
      verzuimPct: Math.round(verzuim * 10) / 10,
      compliancePct,
      openPdcaItems: openPdcaCount,
      openActies: openActiesCount,
      openSubsidies: schoolSubsidies.length,
      aankomendSubsidieDeadline: earliestDeadline
        ? earliestDeadline.toISOString().slice(0, 10)
        : null,
      rag,
    };
  });
}
