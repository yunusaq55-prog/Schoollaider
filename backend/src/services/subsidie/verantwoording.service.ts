import prisma from '../../utils/prisma.js';
import type { InputJsonValue } from '@prisma/client/runtime/library';

// ─── Types ──────────────────────────────────────────────────

interface UpdateVerantwoordingData {
  checklistItems?: InputJsonValue;
  voortgangPct?: number;
  aiConceptTekst?: string;
  ingediendOp?: Date;
}

// ─── Default checklist ──────────────────────────────────────

const DEFAULT_CHECKLIST_ITEMS = [
  { key: 'activiteiten_uitgevoerd', label: 'Activiteiten uitgevoerd conform plan', done: false },
  { key: 'financieel_overzicht', label: 'Financieel overzicht compleet', done: false },
  { key: 'bewijs_verzameld', label: 'Bewijsstukken verzameld', done: false },
  { key: 'evaluatie_geschreven', label: 'Evaluatie geschreven', done: false },
  { key: 'eindrapportage_opgesteld', label: 'Eindrapportage opgesteld', done: false },
];

// ─── Service functions ──────────────────────────────────────

export async function getVerantwoording(dossierId: string, tenantId: string) {
  const dossier = await prisma.subsidieDossier.findFirst({
    where: { id: dossierId, tenantId },
  });

  if (!dossier) {
    throw new Error(`SubsidieDossier met id '${dossierId}' niet gevonden`);
  }

  let verantwoording = await prisma.subsidieVerantwoording.findUnique({
    where: { dossierId },
  });

  if (!verantwoording) {
    verantwoording = await prisma.subsidieVerantwoording.create({
      data: {
        dossierId,
        checklistItems: DEFAULT_CHECKLIST_ITEMS,
        voortgangPct: 0,
      },
    });
  }

  return verantwoording;
}

export async function updateVerantwoording(
  dossierId: string,
  tenantId: string,
  data: UpdateVerantwoordingData,
) {
  const dossier = await prisma.subsidieDossier.findFirst({
    where: { id: dossierId, tenantId },
  });

  if (!dossier) {
    throw new Error(`SubsidieDossier met id '${dossierId}' niet gevonden`);
  }

  return prisma.subsidieVerantwoording.upsert({
    where: { dossierId },
    create: {
      dossierId,
      checklistItems: (data.checklistItems as InputJsonValue) ?? DEFAULT_CHECKLIST_ITEMS,
      voortgangPct: data.voortgangPct ?? 0,
      aiConceptTekst: data.aiConceptTekst,
      ingediendOp: data.ingediendOp,
    },
    update: {
      ...(data.checklistItems !== undefined && { checklistItems: data.checklistItems as InputJsonValue }),
      ...(data.voortgangPct !== undefined && { voortgangPct: data.voortgangPct }),
      ...(data.aiConceptTekst !== undefined && { aiConceptTekst: data.aiConceptTekst }),
      ...(data.ingediendOp !== undefined && { ingediendOp: data.ingediendOp }),
    },
  });
}
