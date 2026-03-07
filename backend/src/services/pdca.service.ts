import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import type { PdcaFase, PdcaStatus } from '@prisma/client';

export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  // School year starts in August
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export async function listPdcaItems(schoolId: string, schooljaar?: string) {
  return prisma.pdcaItem.findMany({
    where: {
      schoolId,
      ...(schooljaar ? { schooljaar } : {}),
    },
    orderBy: [{ fase: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getPdcaItem(id: string) {
  const item = await prisma.pdcaItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('PDCA item');
  return item;
}

export async function createPdcaItem(data: {
  schoolId: string;
  schooljaar: string;
  fase: PdcaFase;
  titel: string;
  beschrijving?: string;
  deadline?: string;
}) {
  return prisma.pdcaItem.create({
    data: {
      schoolId: data.schoolId,
      schooljaar: data.schooljaar,
      fase: data.fase,
      titel: data.titel,
      beschrijving: data.beschrijving ?? '',
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });
}

export async function updatePdcaItem(id: string, data: {
  titel?: string;
  beschrijving?: string;
  status?: PdcaStatus;
  deadline?: string | null;
}) {
  await getPdcaItem(id);
  return prisma.pdcaItem.update({
    where: { id },
    data: {
      ...(data.titel !== undefined && { titel: data.titel }),
      ...(data.beschrijving !== undefined && { beschrijving: data.beschrijving }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
    },
  });
}

export async function deletePdcaItem(id: string) {
  await getPdcaItem(id);
  return prisma.pdcaItem.delete({ where: { id } });
}

export async function getPdcaCycleStatus(schoolId: string, schooljaar: string) {
  const items = await prisma.pdcaItem.findMany({
    where: { schoolId, schooljaar },
  });

  const phases: PdcaFase[] = ['PLAN', 'DO', 'CHECK', 'ACT'];
  return phases.map((fase) => {
    const phaseItems = items.filter((i) => i.fase === fase);
    const completedItems = phaseItems.filter((i) => i.status === 'AFGEROND');
    return {
      fase,
      totalItems: phaseItems.length,
      completedItems: completedItems.length,
      hasItems: phaseItems.length > 0,
      isComplete: phaseItems.length > 0 && phaseItems.every((i) => i.status === 'AFGEROND'),
    };
  });
}
