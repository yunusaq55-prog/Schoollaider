import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export async function listCycli(tenantId: string, schoolId?: string) {
  return prisma.pdcaCyclus.findMany({
    where: {
      tenantId,
      ...(schoolId ? { schoolId } : {}),
    },
    include: {
      _count: { select: { acties: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCyclus(tenantId: string, id: string) {
  const cyclus = await prisma.pdcaCyclus.findFirst({
    where: { id, tenantId },
    include: { acties: { orderBy: { createdAt: 'asc' } } },
  });
  if (!cyclus) throw new NotFoundError('PdcaCyclus');
  return cyclus;
}

export async function createCyclus(
  tenantId: string,
  userId: string,
  data: {
    schoolId: string;
    titel: string;
    beschrijving?: string;
    schooljaar: string;
    fase?: string;
    status?: string;
    startDatum?: Date;
    eindDatum?: Date;
  },
) {
  return prisma.pdcaCyclus.create({
    data: {
      tenantId,
      createdBy: userId,
      schoolId: data.schoolId,
      titel: data.titel,
      beschrijving: data.beschrijving ?? '',
      schooljaar: data.schooljaar,
      fase: data.fase as any,
      status: data.status as any,
      startDatum: data.startDatum,
      eindDatum: data.eindDatum,
    },
  });
}

export async function updateCyclus(
  tenantId: string,
  id: string,
  data: {
    titel?: string;
    beschrijving?: string;
    schooljaar?: string;
    fase?: string;
    status?: string;
    startDatum?: Date;
    eindDatum?: Date;
  },
) {
  await getCyclus(tenantId, id);
  return prisma.pdcaCyclus.update({ where: { id }, data: data as any });
}

export async function deleteCyclus(tenantId: string, id: string) {
  await getCyclus(tenantId, id);
  return prisma.pdcaCyclus.delete({ where: { id } });
}

export async function addActie(
  cyclusId: string,
  data: {
    fase: string;
    titel: string;
    beschrijving?: string;
    verantwoordelijke?: string;
    deadline?: Date;
  },
) {
  return prisma.pdcaActie.create({
    data: {
      cyclusId,
      fase: data.fase as any,
      titel: data.titel,
      beschrijving: data.beschrijving ?? '',
      verantwoordelijke: data.verantwoordelijke,
      deadline: data.deadline,
    },
  });
}

export async function updateActie(
  id: string,
  data: {
    titel?: string;
    beschrijving?: string;
    fase?: string;
    verantwoordelijke?: string;
    deadline?: Date;
    afgerond?: boolean;
  },
) {
  const actie = await prisma.pdcaActie.findUnique({ where: { id } });
  if (!actie) throw new NotFoundError('PdcaActie');
  return prisma.pdcaActie.update({ where: { id }, data: data as any });
}

export async function deleteActie(id: string) {
  const actie = await prisma.pdcaActie.findUnique({ where: { id } });
  if (!actie) throw new NotFoundError('PdcaActie');
  return prisma.pdcaActie.delete({ where: { id } });
}
