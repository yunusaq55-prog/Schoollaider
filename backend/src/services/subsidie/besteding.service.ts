import prisma from '../../utils/prisma.js';
import type { BestedingsCategorie } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────

interface CreateBestedingData {
  dossierId: string;
  tenantId: string;
  schoolId?: string;
  datum: Date;
  bedrag: number;
  categorie: BestedingsCategorie;
  omschrijving: string;
  bonRef?: string;
  createdBy: string;
}

interface UpdateBestedingData {
  schoolId?: string;
  datum?: Date;
  bedrag?: number;
  categorie?: BestedingsCategorie;
  omschrijving?: string;
  bonRef?: string;
}

// ─── Helpers ────────────────────────────────────────────────

async function recalculateBedragBesteed(dossierId: string): Promise<void> {
  const aggregate = await prisma.subsidieBesteding.aggregate({
    where: { dossierId },
    _sum: { bedrag: true },
  });

  await prisma.subsidieDossier.update({
    where: { id: dossierId },
    data: { bedragBesteed: aggregate._sum.bedrag ?? 0 },
  });
}

// ─── Service functions ──────────────────────────────────────

export async function listBestedingen(dossierId: string, tenantId: string) {
  // Verify dossier belongs to tenant
  const dossier = await prisma.subsidieDossier.findFirst({
    where: { id: dossierId, tenantId },
  });

  if (!dossier) {
    throw new Error(`SubsidieDossier met id '${dossierId}' niet gevonden`);
  }

  return prisma.subsidieBesteding.findMany({
    where: { dossierId },
    orderBy: { datum: 'desc' },
  });
}

export async function createBesteding(data: CreateBestedingData) {
  // Verify dossier belongs to tenant
  const dossier = await prisma.subsidieDossier.findFirst({
    where: { id: data.dossierId, tenantId: data.tenantId },
  });

  if (!dossier) {
    throw new Error(`SubsidieDossier met id '${data.dossierId}' niet gevonden`);
  }

  const besteding = await prisma.subsidieBesteding.create({
    data: {
      dossierId: data.dossierId,
      schoolId: data.schoolId,
      datum: data.datum,
      bedrag: data.bedrag,
      categorie: data.categorie,
      omschrijving: data.omschrijving,
      bonRef: data.bonRef,
      createdBy: data.createdBy,
    },
  });

  await recalculateBedragBesteed(data.dossierId);

  return besteding;
}

export async function updateBesteding(id: string, tenantId: string, data: UpdateBestedingData) {
  const existing = await prisma.subsidieBesteding.findUnique({
    where: { id },
    include: { dossier: { select: { tenantId: true } } },
  });

  if (!existing || existing.dossier.tenantId !== tenantId) {
    throw new Error(`SubsidieBesteding met id '${id}' niet gevonden`);
  }

  const updated = await prisma.subsidieBesteding.update({
    where: { id },
    data,
  });

  await recalculateBedragBesteed(existing.dossierId);

  return updated;
}

export async function deleteBesteding(id: string, tenantId: string) {
  const existing = await prisma.subsidieBesteding.findUnique({
    where: { id },
    include: { dossier: { select: { tenantId: true } } },
  });

  if (!existing || existing.dossier.tenantId !== tenantId) {
    throw new Error(`SubsidieBesteding met id '${id}' niet gevonden`);
  }

  await prisma.subsidieBesteding.delete({ where: { id } });

  await recalculateBedragBesteed(existing.dossierId);
}
