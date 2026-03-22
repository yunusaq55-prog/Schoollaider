import prisma from '../../utils/prisma.js';

interface SignaalData {
  titel: string;
  beschrijving: string;
  severity: 'WAARSCHUWING' | 'URGENT';
  payload: Record<string, unknown>;
}

/**
 * Maakt een OpsSignaal aan als er nog geen open signaal van dit type bestaat voor de school.
 * Voorkomt duplicaten via de @@unique constraint op [schoolId, type, opgelost=false].
 */
export async function createSignaalIfNotExists(
  tenantId: string,
  schoolId: string,
  type: string,
  data: SignaalData,
): Promise<void> {
  await prisma.opsSignaal.upsert({
    where: {
      schoolId_type_opgelost: {
        schoolId,
        type,
        opgelost: false,
      },
    },
    create: {
      tenantId,
      schoolId,
      type,
      titel: data.titel,
      beschrijving: data.beschrijving,
      severity: data.severity,
      payload: data.payload,
      opgelost: false,
    },
    update: {
      // Bestaand open signaal bijwerken met meest recente waarden
      titel: data.titel,
      beschrijving: data.beschrijving,
      severity: data.severity,
      payload: data.payload,
    },
  });
}

/**
 * Voegt een nieuwe MetricSnapshot toe voor de school (append-only tijdreeks).
 */
export async function upsertMetricSnapshot(
  tenantId: string,
  schoolId: string,
  metrics: Record<string, number | null>,
): Promise<void> {
  await prisma.metricSnapshot.create({
    data: {
      tenantId,
      schoolId,
      metrics,
    },
  });
}
