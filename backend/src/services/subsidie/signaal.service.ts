import prisma from '../../utils/prisma.js';
import type { SubsidieUrgentie } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────

interface SignaalFilters {
  gelezen?: boolean;
  urgentie?: string;
}

// ─── Service functions ──────────────────────────────────────

export async function listSignalen(tenantId: string, filters?: SignaalFilters) {
  const where: Record<string, unknown> = { tenantId };

  if (filters?.gelezen !== undefined) {
    where.gelezen = filters.gelezen;
  }

  if (filters?.urgentie) {
    where.urgentie = filters.urgentie as SubsidieUrgentie;
  }

  return prisma.subsidieSignaal.findMany({
    where,
    include: {
      dossier: { select: { id: true, naam: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markGelezen(id: string, tenantId: string) {
  const existing = await prisma.subsidieSignaal.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    throw new Error(`SubsidieSignaal met id '${id}' niet gevonden`);
  }

  return prisma.subsidieSignaal.update({
    where: { id },
    data: { gelezen: true },
  });
}

export async function generateDeadlineSignalen(tenantId: string) {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find dossiers with upcoming deadlines
  const dossiers = await prisma.subsidieDossier.findMany({
    where: {
      tenantId,
      status: {
        notIn: ['AFGEROND', 'AFGEWEZEN', 'INGETROKKEN'],
      },
    },
    include: {
      regeling: { select: { naam: true, aanvraagPeriodeSluiting: true } },
    },
  });

  const created: string[] = [];

  for (const dossier of dossiers) {
    // Check verantwoording deadline
    if (dossier.verantwoordingDeadline) {
      const deadline = new Date(dossier.verantwoordingDeadline);

      if (deadline > now && deadline <= in30Days) {
        const urgentie: SubsidieUrgentie = deadline <= in14Days ? 'KRITIEK' : 'WAARSCHUWING';
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Check if a similar signaal already exists recently (within last 7 days)
        const recentSignaal = await prisma.subsidieSignaal.findFirst({
          where: {
            tenantId,
            dossierId: dossier.id,
            type: 'DEADLINE_VERANTWOORDING',
            createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        if (!recentSignaal) {
          await prisma.subsidieSignaal.create({
            data: {
              tenantId,
              dossierId: dossier.id,
              type: 'DEADLINE_VERANTWOORDING',
              titel: `Verantwoording deadline: ${dossier.naam}`,
              beschrijving: `De verantwoording voor '${dossier.naam}' is over ${daysLeft} dagen verlopen.`,
              urgentie,
            },
          });
          created.push(dossier.id);
        }
      }
    }

    // Check project einde deadline
    if (dossier.projectEinde) {
      const deadline = new Date(dossier.projectEinde);

      if (deadline > now && deadline <= in30Days) {
        const urgentie: SubsidieUrgentie = deadline <= in14Days ? 'KRITIEK' : 'WAARSCHUWING';
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const recentSignaal = await prisma.subsidieSignaal.findFirst({
          where: {
            tenantId,
            dossierId: dossier.id,
            type: 'SUBSIDIE_VERLOPEN',
            createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        if (!recentSignaal) {
          await prisma.subsidieSignaal.create({
            data: {
              tenantId,
              dossierId: dossier.id,
              type: 'SUBSIDIE_VERLOPEN',
              titel: `Subsidieperiode eindigt: ${dossier.naam}`,
              beschrijving: `De subsidieperiode voor '${dossier.naam}' eindigt over ${daysLeft} dagen.`,
              urgentie,
            },
          });
          created.push(dossier.id);
        }
      }
    }

    // Check aanvraag deadline from regeling
    if (
      dossier.regeling.aanvraagPeriodeSluiting &&
      ['GESIGNALEERD', 'ORIENTATIE', 'AANVRAAG_IN_VOORBEREIDING'].includes(dossier.status)
    ) {
      const deadline = new Date(dossier.regeling.aanvraagPeriodeSluiting);

      if (deadline > now && deadline <= in30Days) {
        const urgentie: SubsidieUrgentie = deadline <= in14Days ? 'KRITIEK' : 'WAARSCHUWING';
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const recentSignaal = await prisma.subsidieSignaal.findFirst({
          where: {
            tenantId,
            dossierId: dossier.id,
            type: 'DEADLINE_AANVRAAG',
            createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        if (!recentSignaal) {
          await prisma.subsidieSignaal.create({
            data: {
              tenantId,
              dossierId: dossier.id,
              type: 'DEADLINE_AANVRAAG',
              titel: `Aanvraagdeadline nadert: ${dossier.regeling.naam}`,
              beschrijving: `De aanvraagperiode voor '${dossier.regeling.naam}' sluit over ${daysLeft} dagen.`,
              urgentie,
            },
          });
          created.push(dossier.id);
        }
      }
    }
  }

  return { created: created.length, dossierIds: created };
}
