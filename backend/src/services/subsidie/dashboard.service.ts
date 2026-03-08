import prisma from '../../utils/prisma.js';

// ─── Types ──────────────────────────────────────────────────

interface DashboardKpis {
  totalOntvangen: number;
  aantalLopend: number;
  aantalInAanvraag: number;
  deadlinesKomende30Dagen: Array<{
    dossierId: string;
    dossierNaam: string;
    deadline: Date;
    type: string;
  }>;
  gemistPotentieel: number;
  verantwoordingsRisico: number;
  pipelineDistributie: Record<string, number>;
}

// ─── Service functions ──────────────────────────────────────

export async function getDashboardKPIs(tenantId: string): Promise<DashboardKpis> {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch all dossiers for tenant
  const dossiers = await prisma.subsidieDossier.findMany({
    where: { tenantId },
    include: {
      regeling: { select: { naam: true } },
    },
  });

  // totalOntvangen: sum of bedragToegekend for relevant statuses
  const ontvangenStatuses = ['TOEGEKEND', 'LOPEND', 'VERANTWOORD', 'AFGEROND'];
  const totalOntvangen = dossiers
    .filter((d) => ontvangenStatuses.includes(d.status))
    .reduce((sum, d) => sum + (d.bedragToegekend ?? 0), 0);

  // aantalLopend
  const lopendStatuses = ['TOEGEKEND', 'LOPEND', 'VERANTWOORDING_VEREIST'];
  const aantalLopend = dossiers.filter((d) => lopendStatuses.includes(d.status)).length;

  // aantalInAanvraag
  const aanvraagStatuses = ['GESIGNALEERD', 'ORIENTATIE', 'AANVRAAG_IN_VOORBEREIDING', 'INGEDIEND'];
  const aantalInAanvraag = dossiers.filter((d) => aanvraagStatuses.includes(d.status)).length;

  // Deadlines in next 30 days
  const deadlinesKomende30Dagen: DashboardKpis['deadlinesKomende30Dagen'] = [];

  for (const dossier of dossiers) {
    if (
      dossier.verantwoordingDeadline &&
      dossier.verantwoordingDeadline > now &&
      dossier.verantwoordingDeadline <= in30Days
    ) {
      deadlinesKomende30Dagen.push({
        dossierId: dossier.id,
        dossierNaam: dossier.naam,
        deadline: dossier.verantwoordingDeadline,
        type: 'verantwoording',
      });
    }

    if (
      dossier.projectEinde &&
      dossier.projectEinde > now &&
      dossier.projectEinde <= in30Days
    ) {
      deadlinesKomende30Dagen.push({
        dossierId: dossier.id,
        dossierNaam: dossier.naam,
        deadline: dossier.projectEinde,
        type: 'projectEinde',
      });
    }
  }

  deadlinesKomende30Dagen.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  // gemistPotentieel: sum of maxBedrag of high-match regelingen not yet in a dossier
  const existingSubsidieIds = new Set(dossiers.map((d) => d.subsidieId));

  const highMatches = await prisma.subsidieMatch.findMany({
    where: {
      tenantId,
      matchScore: { gte: 0.7 },
    },
    include: {
      regeling: { select: { id: true, maxBedrag: true } },
    },
  });

  const gemistPotentieel = highMatches
    .filter((m) => !existingSubsidieIds.has(m.regeling.id))
    .reduce((sum, m) => sum + (m.regeling.maxBedrag ?? 0), 0);

  // verantwoordingsRisico: count dossiers where verantwoording is due within 30 days
  // and voortgangPct < 50
  const verantwoordingsDossierIds = dossiers
    .filter(
      (d) =>
        d.verantwoordingDeadline &&
        d.verantwoordingDeadline > now &&
        d.verantwoordingDeadline <= in30Days,
    )
    .map((d) => d.id);

  let verantwoordingsRisico = 0;

  if (verantwoordingsDossierIds.length > 0) {
    const verantwoordingen = await prisma.subsidieVerantwoording.findMany({
      where: {
        dossierId: { in: verantwoordingsDossierIds },
      },
    });

    const verantwoordingMap = new Map(verantwoordingen.map((v) => [v.dossierId, v]));

    for (const id of verantwoordingsDossierIds) {
      const v = verantwoordingMap.get(id);
      if (!v || v.voortgangPct < 50) {
        verantwoordingsRisico++;
      }
    }
  }

  // pipelineDistributie: count per status
  const pipelineDistributie: Record<string, number> = {};
  for (const dossier of dossiers) {
    pipelineDistributie[dossier.status] = (pipelineDistributie[dossier.status] ?? 0) + 1;
  }

  return {
    totalOntvangen,
    aantalLopend,
    aantalInAanvraag,
    deadlinesKomende30Dagen,
    gemistPotentieel,
    verantwoordingsRisico,
    pipelineDistributie,
  };
}
