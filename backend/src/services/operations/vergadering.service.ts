import { PrismaClient } from '@prisma/client';
import { aggregateSignalen } from './aggregator.service.js';
import { generateAgenda } from '../ai/llm-client.js';

const prisma = new PrismaClient();

export async function listVergaderingen(tenantId: string) {
  return prisma.vergadering.findMany({
    where: { tenantId },
    include: { creator: { select: { naam: true } } },
    orderBy: { datum: 'desc' },
  });
}

export async function createVergadering(data: {
  tenantId: string;
  titel: string;
  datum: Date;
  locatie?: string;
  createdBy: string;
}) {
  return prisma.vergadering.create({
    data: {
      tenantId: data.tenantId,
      titel: data.titel,
      datum: data.datum,
      locatie: data.locatie ?? '',
      createdBy: data.createdBy,
    },
    include: { creator: { select: { naam: true } } },
  });
}

export async function updateVergadering(
  id: string,
  tenantId: string,
  data: Partial<{
    titel: string;
    datum: Date;
    locatie: string;
    status: string;
    notulenTekst: string;
    samenvatting: string;
  }>,
) {
  return prisma.vergadering.update({
    where: { id, tenantId },
    data: data as object,
    include: { creator: { select: { naam: true } } },
  });
}

export async function generateVergaderingAgenda(id: string, tenantId: string) {
  const vergadering = await prisma.vergadering.findUnique({ where: { id, tenantId } });
  if (!vergadering) throw new Error('Vergadering niet gevonden');

  const [openActies, signalen, beleid] = await Promise.all([
    prisma.actie.findMany({
      where: { tenantId, status: { in: ['OPEN', 'IN_BEHANDELING'] } },
      include: { school: { select: { naam: true } } },
      orderBy: { prioriteit: 'desc' },
      take: 20,
    }),
    aggregateSignalen(tenantId),
    prisma.beleidsDocument.findMany({
      where: {
        tenantId,
        status: 'ACTIEF',
        volgendEvaluatieDatum: {
          lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      },
      take: 10,
    }),
  ]);

  const openActiesStr = openActies
    .map((a) => `- [${a.prioriteit}] ${a.titel} (${a.school?.naam ?? 'Bestuur'}, deadline: ${a.deadline?.toISOString().slice(0, 10) ?? 'onbekend'})`)
    .join('\n') || 'Geen openstaande acties';

  const signalenStr = signalen
    .slice(0, 15)
    .map((s) => `- [${s.urgentie}] ${s.bron}: ${s.titel} (${s.schoolNaam})`)
    .join('\n') || 'Geen actuele signalen';

  const beleidStr = beleid
    .map((b) => `- ${b.titel} (evaluatie: ${b.volgendEvaluatieDatum?.toISOString().slice(0, 10) ?? 'onbekend'})`)
    .join('\n') || 'Geen aankomende beleidsevaluaties';

  const { result } = await generateAgenda(
    vergadering.datum.toISOString().slice(0, 10),
    vergadering.titel,
    openActiesStr,
    signalenStr,
    beleidStr,
  );

  return prisma.vergadering.update({
    where: { id },
    data: { agendaJson: result as object, aiGegenereerd: true },
    include: { creator: { select: { naam: true } } },
  });
}
