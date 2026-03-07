import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateSchoolRequest } from '@schoollaider/shared';
import type { SchoolStatus } from '@prisma/client';

export async function listSchools(tenantId: string, filters?: { status?: SchoolStatus }) {
  return prisma.school.findMany({
    where: {
      tenantId,
      ...(filters?.status ? { status: filters.status } : { status: 'ACTIEF' }),
    },
    orderBy: { naam: 'asc' },
  });
}

export async function getSchool(tenantId: string, id: string) {
  const school = await prisma.school.findFirst({ where: { id, tenantId } });
  if (!school) throw new NotFoundError('School');
  return school;
}

export async function createSchool(tenantId: string, data: CreateSchoolRequest) {
  return prisma.school.create({
    data: {
      tenantId,
      naam: data.naam,
      brinCode: data.brinCode,
      adres: data.adres,
      directeur: data.directeur ?? '',
      leerlingaantal: data.leerlingaantal ?? 0,
    },
  });
}

export async function updateSchool(tenantId: string, id: string, data: Partial<CreateSchoolRequest>) {
  await getSchool(tenantId, id);
  return prisma.school.update({ where: { id }, data });
}

export async function archiveSchool(tenantId: string, id: string) {
  await getSchool(tenantId, id);
  return prisma.school.update({
    where: { id },
    data: { status: 'GEARCHIVEERD' },
  });
}

export async function deleteSchool(tenantId: string, id: string) {
  await getSchool(tenantId, id);
  return prisma.school.delete({ where: { id } });
}
