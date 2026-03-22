import { PrismaClient, Prisma } from '@prisma/client';
import { aggregateSignalen } from './aggregator.service.js';
import { draftActie } from '../ai/llm-client.js';

const prisma = new PrismaClient();

export interface CreateActieInput {
  tenantId: string;
  schoolId?: string;
  titel: string;
  beschrijving: string;
  prioriteit?: 'LAAG' | 'MIDDEL' | 'HOOG' | 'KRITIEK';
  bron?: 'HR_SIGNAAL' | 'SUBSIDIE_SIGNAAL' | 'PDCA_SUGGESTION' | 'COMPLIANCE' | 'HANDMATIG';
  bronSignaalId?: string;
  bronSignaalType?: string;
  toegewezenAan?: string;
  deadline?: Date;
  conceptEmail?: string;
  createdBy: string;
}

export async function listActies(
  tenantId: string,
  filters?: { schoolId?: string; status?: string; prioriteit?: string },
) {
  const where: Prisma.ActieWhereInput = {
    tenantId,
    status: { not: 'GEANNULEERD' },
  };

  if (filters?.schoolId) where.schoolId = filters.schoolId;
  if (filters?.status) where.status = filters.status as never;
  if (filters?.prioriteit) where.prioriteit = filters.prioriteit as never;

  return prisma.actie.findMany({
    where,
    include: {
      school: { select: { naam: true } },
      assignee: { select: { naam: true, email: true } },
    },
    orderBy: [{ prioriteit: 'desc' }, { deadline: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createActie(data: CreateActieInput) {
  return prisma.actie.create({
    data: {
      tenantId: data.tenantId,
      schoolId: data.schoolId,
      titel: data.titel,
      beschrijving: data.beschrijving,
      prioriteit: (data.prioriteit ?? 'MIDDEL') as never,
      bron: (data.bron ?? 'HANDMATIG') as never,
      bronSignaalId: data.bronSignaalId,
      bronSignaalType: data.bronSignaalType,
      toegewezenAan: data.toegewezenAan,
      deadline: data.deadline,
      conceptEmail: data.conceptEmail,
      createdBy: data.createdBy,
    },
    include: {
      school: { select: { naam: true } },
      assignee: { select: { naam: true, email: true } },
    },
  });
}

export async function updateActie(
  id: string,
  tenantId: string,
  data: Partial<{
    titel: string;
    beschrijving: string;
    prioriteit: string;
    status: string;
    toegewezenAan: string;
    deadline: Date;
    conceptEmail: string;
    afgerondenOp: Date;
  }>,
) {
  return prisma.actie.update({
    where: { id, tenantId },
    data: data as Prisma.ActieUpdateInput,
    include: {
      school: { select: { naam: true } },
      assignee: { select: { naam: true, email: true } },
    },
  });
}

export async function createActieFromSignaal(
  tenantId: string,
  signaalId: string,
  signaalType: string,
  userId: string,
) {
  const allSignalen = await aggregateSignalen(tenantId);
  const signaal = allSignalen.find((s) => s.id === signaalId && s.bronType === signaalType);

  if (!signaal) {
    throw new Error('Signaal niet gevonden');
  }

  const datum = new Date().toISOString().slice(0, 10);
  const signaalJson = JSON.stringify({
    titel: signaal.titel,
    beschrijving: signaal.beschrijving,
    bron: signaal.bron,
    urgentie: signaal.urgentie,
    aanbevolenActie: signaal.aanbevolenActie ?? '',
  });

  const { result } = await draftActie(signaalJson, signaal.schoolNaam, datum);

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + result.deadlineDagen);

  const bronMap: Record<string, string> = {
    HrSignaal: 'HR_SIGNAAL',
    SubsidieSignaal: 'SUBSIDIE_SIGNAAL',
    PdcaSuggestion: 'PDCA_SUGGESTION',
    SchoolStandaardStatus: 'COMPLIANCE',
  };

  return prisma.actie.create({
    data: {
      tenantId,
      schoolId: signaal.schoolId || undefined,
      titel: result.titel,
      beschrijving: result.beschrijving,
      prioriteit: result.prioriteit as never,
      bron: (bronMap[signaalType] ?? 'HANDMATIG') as never,
      bronSignaalId: signaalId,
      bronSignaalType: signaalType,
      deadline,
      conceptEmail: `Onderwerp: ${result.conceptEmail.onderwerp}\n\n${result.conceptEmail.tekst}`,
      createdBy: userId,
    },
    include: {
      school: { select: { naam: true } },
      assignee: { select: { naam: true, email: true } },
    },
  });
}
