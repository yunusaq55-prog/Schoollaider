import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { CreateSchoolRequest } from '@schoollaider/shared';

export async function listSchools(tenantId: string) {
  return prisma.school.findMany({
    where: { tenantId },
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
    data: { tenantId, ...data },
  });
}

export async function updateSchool(tenantId: string, id: string, data: Partial<CreateSchoolRequest>) {
  await getSchool(tenantId, id);
  return prisma.school.update({ where: { id }, data });
}

export async function deleteSchool(tenantId: string, id: string) {
  await getSchool(tenantId, id);
  return prisma.school.delete({ where: { id } });
}
