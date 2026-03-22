import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listBeleidsDocumenten(
  tenantId: string,
  filters?: { schoolId?: string; domein?: string; status?: string },
) {
  return prisma.beleidsDocument.findMany({
    where: {
      tenantId,
      ...(filters?.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters?.domein ? { domein: filters.domein } : {}),
      ...(filters?.status ? { status: filters.status as never } : {}),
    },
    include: {
      school: { select: { naam: true } },
      creator: { select: { naam: true } },
    },
    orderBy: { volgendEvaluatieDatum: 'asc' },
  });
}

export async function createBeleidsDocument(data: {
  tenantId: string;
  schoolId?: string;
  titel: string;
  domein: string;
  vastgesteldDatum?: Date;
  evaluatieDatum?: Date;
  volgendEvaluatieDatum?: Date;
  herinneringDagen?: number;
  documentId?: string;
  createdBy: string;
}) {
  return prisma.beleidsDocument.create({
    data: {
      tenantId: data.tenantId,
      schoolId: data.schoolId,
      titel: data.titel,
      domein: data.domein,
      vastgesteldDatum: data.vastgesteldDatum,
      evaluatieDatum: data.evaluatieDatum,
      volgendEvaluatieDatum: data.volgendEvaluatieDatum,
      herinneringDagen: data.herinneringDagen ?? 30,
      documentId: data.documentId,
      createdBy: data.createdBy,
    },
    include: {
      school: { select: { naam: true } },
      creator: { select: { naam: true } },
    },
  });
}

export async function updateBeleidsDocument(
  id: string,
  tenantId: string,
  data: Partial<{
    titel: string;
    domein: string;
    status: string;
    vastgesteldDatum: Date;
    evaluatieDatum: Date;
    volgendEvaluatieDatum: Date;
    herinneringDagen: number;
    voortgangNotes: string;
  }>,
) {
  return prisma.beleidsDocument.update({
    where: { id, tenantId },
    data: data as object,
    include: {
      school: { select: { naam: true } },
      creator: { select: { naam: true } },
    },
  });
}

export async function getUpcomingEvaluaties(tenantId: string, days = 60) {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return prisma.beleidsDocument.findMany({
    where: {
      tenantId,
      status: 'ACTIEF',
      volgendEvaluatieDatum: { lte: cutoff },
    },
    include: {
      school: { select: { naam: true } },
    },
    orderBy: { volgendEvaluatieDatum: 'asc' },
  });
}
