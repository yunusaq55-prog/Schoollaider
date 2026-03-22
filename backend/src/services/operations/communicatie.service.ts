import { PrismaClient } from '@prisma/client';
import { draftCommunicatie } from '../ai/llm-client.js';

const prisma = new PrismaClient();

export async function listDrafts(
  tenantId: string,
  filters?: { schoolId?: string; definitief?: boolean },
) {
  return prisma.communicatieDraft.findMany({
    where: {
      tenantId,
      ...(filters?.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters?.definitief !== undefined ? { definitief: filters.definitief } : {}),
    },
    include: {
      school: { select: { naam: true } },
      creator: { select: { naam: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function generateDraft(data: {
  tenantId: string;
  schoolId?: string;
  actieId?: string;
  intentie: string;
  ontvangerNaam: string;
  ontvangerRol?: string;
  ontvangerEmail?: string;
  kanaal?: 'EMAIL' | 'BRIEF' | 'NIEUWSBRIEF';
  createdBy: string;
}) {
  // Fetch school name
  const school = data.schoolId
    ? await prisma.school.findUnique({ where: { id: data.schoolId }, select: { naam: true } })
    : null;

  // Get last 3 sent drafts as style examples
  const recenteDrafts = await prisma.communicatieDraft.findMany({
    where: { tenantId: data.tenantId, definitief: true },
    orderBy: { verstuurdOp: 'desc' },
    take: 3,
    select: { onderwerp: true, concept: true },
  });

  const stijlVoorbeelden =
    recenteDrafts.length > 0
      ? `STIJLVOORBEELDEN (eerder verstuurd):\n${recenteDrafts
          .map((d, i) => `Voorbeeld ${i + 1}:\nOnderwerp: ${d.onderwerp}\n${d.concept.slice(0, 300)}...`)
          .join('\n\n')}`
      : '';

  const datum = new Date().toISOString().slice(0, 10);

  const { result } = await draftCommunicatie(
    data.intentie,
    school?.naam ?? 'Onbekende school',
    data.ontvangerNaam,
    data.ontvangerRol ?? 'Schoolleider',
    datum,
    stijlVoorbeelden,
  );

  return prisma.communicatieDraft.create({
    data: {
      tenantId: data.tenantId,
      schoolId: data.schoolId,
      actieId: data.actieId,
      kanaal: (data.kanaal ?? 'EMAIL') as never,
      onderwerp: result.onderwerp,
      ontvangerNaam: data.ontvangerNaam,
      ontvangerEmail: data.ontvangerEmail,
      intentie: data.intentie,
      concept: result.concept,
      createdBy: data.createdBy,
    },
    include: {
      school: { select: { naam: true } },
      creator: { select: { naam: true } },
    },
  });
}

export async function updateDraft(
  id: string,
  tenantId: string,
  data: Partial<{
    onderwerp: string;
    concept: string;
    ontvangerNaam: string;
    ontvangerEmail: string;
    definitief: boolean;
    verstuurdOp: Date;
  }>,
) {
  return prisma.communicatieDraft.update({
    where: { id, tenantId },
    data: data as object,
    include: {
      school: { select: { naam: true } },
      creator: { select: { naam: true } },
    },
  });
}
