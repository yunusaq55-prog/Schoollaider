import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export async function listUsers(tenantId: string, schoolId?: string) {
  return prisma.user.findMany({
    where: {
      tenantId,
      ...(schoolId ? { schoolId } : {}),
    },
    select: {
      id: true,
      email: true,
      naam: true,
      role: true,
      tenantId: true,
      schoolId: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { naam: 'asc' },
  });
}

export async function getUser(tenantId: string, id: string) {
  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      email: true,
      naam: true,
      role: true,
      tenantId: true,
      schoolId: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new NotFoundError('Gebruiker');
  return user;
}

export async function updateUser(tenantId: string, id: string, data: { naam?: string; role?: string; active?: boolean; schoolId?: string }) {
  await getUser(tenantId, id);
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.naam !== undefined && { naam: data.naam }),
      ...(data.role !== undefined && { role: data.role as import('@prisma/client').Role }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.schoolId !== undefined && { schoolId: data.schoolId }),
    },
    select: {
      id: true,
      email: true,
      naam: true,
      role: true,
      tenantId: true,
      schoolId: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteUser(tenantId: string, id: string) {
  await getUser(tenantId, id);
  return prisma.user.delete({ where: { id } });
}
