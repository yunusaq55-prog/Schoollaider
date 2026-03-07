import prisma from '../utils/prisma.js';

export async function listDomeinen() {
  return prisma.inspectieDomein.findMany({
    include: { standaarden: { orderBy: { code: 'asc' } } },
    orderBy: { code: 'asc' },
  });
}

export async function getSchoolStandaardStatuses(tenantId: string, schoolId: string) {
  const domeinen = await prisma.inspectieDomein.findMany({
    include: { standaarden: { orderBy: { code: 'asc' } } },
    orderBy: { code: 'asc' },
  });

  const existingStatuses = await prisma.schoolStandaardStatus.findMany({
    where: { schoolId },
    include: { standaard: true },
  });

  const statusMap = new Map(existingStatuses.map((s) => [s.standaardId, s]));

  return domeinen.map((domein) => ({
    ...domein,
    standaarden: domein.standaarden.map((standaard) => ({
      ...standaard,
      schoolStatus: statusMap.get(standaard.id) ?? {
        id: null,
        schoolId,
        standaardId: standaard.id,
        status: 'ONTBREEKT' as const,
        bewijs: '',
        evaluatie: '',
        actueel: false,
        opmerking: '',
        updatedAt: null,
      },
    })),
  }));
}

export async function upsertSchoolStandaardStatus(
  schoolId: string,
  standaardId: string,
  data: { status?: 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT'; bewijs?: string; evaluatie?: string; actueel?: boolean; opmerking?: string },
) {
  return prisma.schoolStandaardStatus.upsert({
    where: { schoolId_standaardId: { schoolId, standaardId } },
    update: data,
    create: {
      schoolId,
      standaardId,
      status: data.status ?? 'ONTBREEKT',
      bewijs: data.bewijs ?? '',
      evaluatie: data.evaluatie ?? '',
      actueel: data.actueel ?? false,
      opmerking: data.opmerking ?? '',
    },
  });
}

export async function getStandaardWithEvidence(tenantId: string, schoolId: string, standaardId: string) {
  const status = await prisma.schoolStandaardStatus.findUnique({
    where: { schoolId_standaardId: { schoolId, standaardId } },
  });

  const documents = await prisma.document.findMany({
    where: {
      tenantId,
      schoolId,
      standaardLinks: { some: { standaardId } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { status, documents };
}
