import prisma from '../../utils/prisma.js';

export async function getDeadlineKalender(tenantId: string) {
  const dossiers = await prisma.subsidieDossier.findMany({
    where: {
      tenantId,
      status: { notIn: ['AFGEROND', 'AFGEWEZEN', 'INGETROKKEN'] },
    },
    include: {
      regeling: {
        select: {
          naam: true,
          aanvraagPeriodeSluiting: true,
          projectPeriodeEinde: true,
        },
      },
    },
  });

  const items: Array<{
    id: string;
    dossierId: string;
    titel: string;
    datum: string;
    type: string;
  }> = [];

  for (const d of dossiers) {
    if (d.verantwoordingDeadline) {
      items.push({
        id: `${d.id}-verantwoording`,
        dossierId: d.id,
        titel: `Verantwoording: ${d.naam}`,
        datum: d.verantwoordingDeadline.toISOString(),
        type: 'DEADLINE_VERANTWOORDING',
      });
    }

    if (d.projectEinde) {
      items.push({
        id: `${d.id}-einde`,
        dossierId: d.id,
        titel: `Project einde: ${d.naam}`,
        datum: d.projectEinde.toISOString(),
        type: 'EINDE',
      });
    }

    if (d.projectStart) {
      items.push({
        id: `${d.id}-start`,
        dossierId: d.id,
        titel: `Project start: ${d.naam}`,
        datum: d.projectStart.toISOString(),
        type: 'START',
      });
    }

    if (d.regeling.aanvraagPeriodeSluiting) {
      items.push({
        id: `${d.id}-aanvraag`,
        dossierId: d.id,
        titel: `Aanvraag deadline: ${d.regeling.naam}`,
        datum: d.regeling.aanvraagPeriodeSluiting.toISOString(),
        type: 'DEADLINE_AANVRAAG',
      });
    }
  }

  items.sort((a, b) => a.datum.localeCompare(b.datum));

  return items;
}
