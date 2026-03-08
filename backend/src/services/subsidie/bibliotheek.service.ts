import prisma from '../../utils/prisma.js';

// ─── Types ──────────────────────────────────────────────────

interface RegelingFilters {
  financier?: string;
  tags?: string[];
  actief?: boolean;
}

interface CreateRegelingData {
  naam: string;
  slug: string;
  financier: string;
  financierUrl?: string;
  beschrijving: string;
  doelgroep: string;
  minBedrag?: number;
  maxBedrag?: number;
  bedragPerEenheid?: string;
  aanvraagPeriodeOpen?: Date;
  aanvraagPeriodeSluiting?: Date;
  projectPeriodeStart?: Date;
  projectPeriodeEinde?: Date;
  verantwoordingDeadline?: string;
  verantwoordingEisen?: string;
  vereisten?: string;
  tags?: string[];
  actief?: boolean;
}

type UpdateRegelingData = Partial<CreateRegelingData>;

// ─── Service functions ──────────────────────────────────────

export async function listRegelingen(filters?: RegelingFilters) {
  const where: Record<string, unknown> = {};

  if (filters?.financier) {
    where.financier = filters.financier;
  }

  if (filters?.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }

  if (filters?.actief !== undefined) {
    where.actief = filters.actief;
  }

  return prisma.subsidieRegeling.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRegeling(id: string) {
  const regeling = await prisma.subsidieRegeling.findUnique({
    where: { id },
    include: {
      dossiers: { select: { id: true, naam: true, status: true } },
    },
  });

  if (!regeling) {
    throw new Error(`SubsidieRegeling met id '${id}' niet gevonden`);
  }

  return regeling;
}

export async function createRegeling(data: CreateRegelingData) {
  return prisma.subsidieRegeling.create({ data });
}

export async function updateRegeling(id: string, data: UpdateRegelingData) {
  const existing = await prisma.subsidieRegeling.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`SubsidieRegeling met id '${id}' niet gevonden`);
  }

  return prisma.subsidieRegeling.update({
    where: { id },
    data,
  });
}
