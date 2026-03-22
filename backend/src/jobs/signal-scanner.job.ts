import { Queue, Worker, type Job } from 'bullmq';
import { env } from '../config/env.js';
import prisma from '../utils/prisma.js';
import { createSignaalIfNotExists, upsertMetricSnapshot } from '../services/ops/ops.service.js';

const QUEUE_NAME = 'ops-signal-scanner';
const DREMPEL_PERSONEEL_VERZUIM = 7.0; // %
const DREMPEL_NPO_BESTEDING = 50.0; // % (te laag = risico)

// BullMQ accepts a URL string directly — avoids ioredis version conflicts
const redisOpts = { connection: { url: env.REDIS_URL } as { url: string } };

// ─── Queue ────────────────────────────────────────────────────

export function createSignalScannerQueue() {
  return new Queue(QUEUE_NAME, {
    ...redisOpts,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });
}

// ─── Worker ───────────────────────────────────────────────────

export function startSignalScannerWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { tenantId } = job.data as { tenantId: string };
      console.log(`[SignalScanner] Scannen voor tenant ${tenantId}`);

      const schools = await prisma.school.findMany({
        where: { tenantId, status: 'ACTIEF' },
        select: { id: true, naam: true },
      });

      for (const school of schools) {
        try {
          await scanSchool(tenantId, school.id);
        } catch (err) {
          console.error(
            `[SignalScanner] Fout bij school ${school.naam}:`,
            (err as Error).message,
          );
        }
      }

      console.log(`[SignalScanner] Klaar voor ${schools.length} scholen`);
    },
    { ...redisOpts, concurrency: 2 },
  );

  worker.on('failed', (_job, err) => {
    console.error(`[SignalScanner] Job mislukt:`, err.message);
  });

  return worker;
}

// ─── Per-school scan ──────────────────────────────────────────

async function scanSchool(tenantId: string, schoolId: string) {
  const metricData: Record<string, number | null> = {};

  // 1. Personeelsverzuim
  const verzuim = await prisma.hrVerzuim.findFirst({
    where: { schoolId },
    orderBy: { periode: 'desc' },
  });

  if (verzuim) {
    metricData.personeelVerzuimPct = verzuim.verzuimPct;

    if (verzuim.verzuimPct > DREMPEL_PERSONEEL_VERZUIM) {
      await createSignaalIfNotExists(tenantId, schoolId, 'PERSONEEL_VERZUIM', {
        titel: `Personeelsverzuim ${verzuim.verzuimPct.toFixed(1)}% — boven drempel`,
        beschrijving: `Het personeelsverzuim is ${verzuim.verzuimPct.toFixed(1)}% (drempel: ${DREMPEL_PERSONEEL_VERZUIM}%). Periode: ${verzuim.periode}.`,
        severity: verzuim.verzuimPct > 10 ? 'URGENT' : 'WAARSCHUWING',
        payload: { verzuimPct: verzuim.verzuimPct, periode: verzuim.periode },
      });
    }
  }

  // 2. HR formatie tekort
  const formatie = await prisma.hrFormatie.findFirst({
    where: { schoolId },
    orderBy: { schooljaar: 'desc' },
  });

  if (formatie) {
    metricData.hrFormatieScore = formatie.capaciteitsScore;

    if (formatie.begroteFte - formatie.ingevuldeFte > 1.0) {
      await createSignaalIfNotExists(tenantId, schoolId, 'HR_TEKORT', {
        titel: `FTE-tekort van ${(formatie.begroteFte - formatie.ingevuldeFte).toFixed(1)}`,
        beschrijving: `Er zijn ${formatie.vacatures} openstaande vacatures. Ingevuld: ${formatie.ingevuldeFte} van ${formatie.begroteFte} FTE.`,
        severity: formatie.vacatures > 2 ? 'URGENT' : 'WAARSCHUWING',
        payload: {
          tekort: formatie.begroteFte - formatie.ingevuldeFte,
          vacatures: formatie.vacatures,
        },
      });
    }
  }

  // 3. NPO besteding (via subsidie dossier op tenant-niveau)
  const npoDossier = await prisma.subsidieDossier.findFirst({
    where: {
      tenantId,
      status: { in: ['LOPEND', 'TOEGEKEND'] },
      regeling: { slug: 'npo-nationaal-programma-onderwijs' },
    },
    include: { regeling: { select: { naam: true } } },
  });

  if (npoDossier?.bedragToegekend) {
    const besteedPct = (npoDossier.bedragBesteed / npoDossier.bedragToegekend) * 100;
    metricData.npoBestedigingPct = besteedPct;
    metricData.npoBudgetTotaal = npoDossier.bedragToegekend;
    metricData.npoBudgetBesteed = npoDossier.bedragBesteed;

    if (besteedPct < DREMPEL_NPO_BESTEDING) {
      await createSignaalIfNotExists(tenantId, schoolId, 'NPO_BESTEDING', {
        titel: `NPO-besteding ${besteedPct.toFixed(0)}% — risico op onderbesteding`,
        beschrijving: `Slechts ${besteedPct.toFixed(0)}% van het NPO-budget is besteed (€${npoDossier.bedragBesteed.toLocaleString('nl-NL')} van €${npoDossier.bedragToegekend.toLocaleString('nl-NL')}).`,
        severity: besteedPct < 30 ? 'URGENT' : 'WAARSCHUWING',
        payload: {
          besteedPct,
          bedragBesteed: npoDossier.bedragBesteed,
          bedragToegekend: npoDossier.bedragToegekend,
        },
      });
    }
  } else {
    metricData.npoBestedigingPct = null;
  }

  // 4. Verlopen PDCA items
  const verloopenPdca = await prisma.pdcaItem.count({
    where: {
      schoolId,
      status: { not: 'AFGEROND' },
      deadline: { lt: new Date() },
    },
  });

  if (verloopenPdca > 0) {
    await createSignaalIfNotExists(tenantId, schoolId, 'BELEID_EVALUATIE', {
      titel: `${verloopenPdca} PDCA-actie${verloopenPdca > 1 ? 's' : ''} verlopen`,
      beschrijving: `Er zijn ${verloopenPdca} openstaande PDCA-acties waarvan de deadline is verstreken.`,
      severity: 'WAARSCHUWING',
      payload: { aantalVerlopen: verloopenPdca },
    });
  }

  await upsertMetricSnapshot(tenantId, schoolId, metricData);
}

// ─── Core scan voor alle tenants (herbruikbaar) ───────────────

export async function runScanForAllTenants(): Promise<void> {
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { id: true },
  });

  for (const tenant of tenants) {
    const schools = await prisma.school.findMany({
      where: { tenantId: tenant.id, status: 'ACTIEF' },
      select: { id: true, naam: true },
    });

    for (const school of schools) {
      try {
        await scanSchool(tenant.id, school.id);
      } catch (err) {
        console.error(`[SignalScanner] Fout bij school ${school.naam}:`, (err as Error).message);
      }
    }
  }

  console.log(`[SignalScanner] Scan afgerond voor ${tenants.length} tenant(s)`);
}

// ─── In-process fallback (geen Redis) ─────────────────────────

export function startInProcessScanner(intervalMs = 60 * 60 * 1000): NodeJS.Timeout {
  console.log('[SignalScanner] In-process modus (geen Redis) — interval: 1 uur');
  // Meteen één keer scannen bij opstarten
  runScanForAllTenants().catch((err) =>
    console.error('[SignalScanner] Initiële scan mislukt:', (err as Error).message),
  );
  return setInterval(() => {
    runScanForAllTenants().catch((err) =>
      console.error('[SignalScanner] Interval scan mislukt:', (err as Error).message),
    );
  }, intervalMs);
}

// ─── BullMQ schedule helper ───────────────────────────────────

export async function scheduleSignalScanner(tenantIds: string[]) {
  const queue = createSignalScannerQueue();

  for (const tenantId of tenantIds) {
    await queue.add(
      `scan-${tenantId}`,
      { tenantId },
      {
        repeat: { pattern: '0 * * * *' }, // elk uur
        jobId: `recurring-scan-${tenantId}`,
      },
    );
  }

  console.log(`[SignalScanner] Gepland voor ${tenantIds.length} tenant(s)`);
  return queue;
}
