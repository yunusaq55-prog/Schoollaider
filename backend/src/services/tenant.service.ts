import type { Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import type { CreateTenantRequest } from '@schoollaider/shared';

export async function listTenants() {
  return prisma.tenant.findMany({ orderBy: { naam: 'asc' } });
}

export async function getTenant(id: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new NotFoundError('Tenant');
  return tenant;
}

export async function createTenant(data: CreateTenantRequest) {
  const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
  if (existing) throw new ConflictError('Slug is al in gebruik');

  return prisma.tenant.create({
    data: {
      naam: data.naam,
      slug: data.slug,
      settings: (data.settings ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function updateTenant(id: string, data: { naam?: string; slug?: string; active?: boolean; settings?: Record<string, unknown> }) {
  await getTenant(id);
  const updateData: Prisma.TenantUpdateInput = {};
  if (data.naam !== undefined) updateData.naam = data.naam;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.settings !== undefined) updateData.settings = data.settings as Prisma.InputJsonValue;
  return prisma.tenant.update({ where: { id }, data: updateData });
}

export async function deleteTenant(id: string) {
  await getTenant(id);
  return prisma.tenant.delete({ where: { id } });
}
