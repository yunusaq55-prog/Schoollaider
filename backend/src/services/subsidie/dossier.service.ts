import prisma from '../../utils/prisma.js';
import type { SubsidieStatus } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────

interface DossierFilters {
  status?: string;
}

interface CreateDossierData {
  tenantId: string;
  subsidieId: string;
  naam?: string;
  schoolIds?: string[];
  bedragAangevraagd?: number;
  createdBy: string;
}

interface UpdateDossierData {
  naam?: string;
  status?: SubsidieStatus;
  bedragAangevraagd?: number;
  bedragToegekend?: number;
  aanvraagDatum?: Date;
  beschikkingDatum?: Date;
  projectStart?: Date;
  projectEinde?: Date;
  verantwoordingDeadline?: Date;
  beschikkingsnummer?: string;
  referentie?: string;
  schoolIds?: string[];
  notities?: string;
}

// ─── Service functions ──────────────────────────────────────

export async function listDossiers(tenantId: string, filters?: DossierFilters) {
  const where: Record<string, unknown> = { tenantId };

  if (filters?.status) {
    where.status = filters.status as SubsidieStatus;
  }

  return prisma.subsidieDossier.findMany({
    where,
    include: {
      regeling: { select: { id: true, naam: true, financier: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getDossier(id: string, tenantId: string) {
  const dossier = await prisma.subsidieDossier.findFirst({
    where: { id, tenantId },
    include: {
      regeling: true,
      bestedingen: { orderBy: { datum: 'desc' } },
      documenten: { orderBy: { uploadedAt: 'desc' } },
      verantwoording: true,
      signalen: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!dossier) {
    throw new Error(`SubsidieDossier met id '${id}' niet gevonden`);
  }

  return dossier;
}

export async function createDossier(data: CreateDossierData) {
  // Verify the regeling exists
  const regeling = await prisma.subsidieRegeling.findUnique({
    where: { id: data.subsidieId },
  });

  if (!regeling) {
    throw new Error(`SubsidieRegeling met id '${data.subsidieId}' niet gevonden`);
  }

  return prisma.subsidieDossier.create({
    data: {
      tenantId: data.tenantId,
      subsidieId: data.subsidieId,
      naam: data.naam || regeling.naam,
      schoolIds: data.schoolIds ?? [],
      bedragAangevraagd: data.bedragAangevraagd,
      createdBy: data.createdBy,
    },
    include: {
      regeling: { select: { id: true, naam: true, financier: true } },
    },
  });
}

export async function updateDossier(id: string, tenantId: string, data: UpdateDossierData) {
  const existing = await prisma.subsidieDossier.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw new Error(`SubsidieDossier met id '${id}' niet gevonden`);
  }

  return prisma.subsidieDossier.update({
    where: { id },
    data,
    include: {
      regeling: { select: { id: true, naam: true, financier: true } },
    },
  });
}

export async function deleteDossier(id: string, tenantId: string) {
  const existing = await prisma.subsidieDossier.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw new Error(`SubsidieDossier met id '${id}' niet gevonden`);
  }

  return prisma.subsidieDossier.delete({ where: { id } });
}
