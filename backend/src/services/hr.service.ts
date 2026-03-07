import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';

// ── Score calculations ──────────────────────────────────────────────

function calcCapaciteitsScore(ingevuldeFte: number, begroteFte: number, vacatures: number): number {
  const base = Math.min(100, 100 * (ingevuldeFte / Math.max(begroteFte, 1)));
  const penalty = vacatures * 5;
  return Math.max(0, Math.round((base - penalty) * 10) / 10);
}

function calcBelastbaarheidsIndex(verzuimPct: number): number {
  const score = 100 - verzuimPct * 10;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

function calcVervangingsIndex(nietVervuldeDagen: number, totaalVervangingsDagen: number): number {
  const score = 100 - (nietVervuldeDagen / Math.max(totaalVervangingsDagen, 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

function calcVerwachteUitstroom(categorie60Plus: number, categorie50Tot60: number): number {
  return Math.round((categorie60Plus * 1.0 + categorie50Tot60 * 0.15) * 10) / 10;
}

// ── Formatie ────────────────────────────────────────────────────────

export async function getFormatie(schoolId: string, schooljaar: string) {
  const formatie = await prisma.hrFormatie.findUnique({
    where: { schoolId_schooljaar: { schoolId, schooljaar } },
  });
  if (!formatie) throw new NotFoundError('HrFormatie');
  return formatie;
}

export async function upsertFormatie(schoolId: string, data: {
  schooljaar: string;
  begroteFte: number;
  ingevuldeFte: number;
  vacatures: number;
  tijdelijkPct: number;
  fteLeerkracht: number;
  fteOop: number;
  fteDirectie: number;
}) {
  const capaciteitsScore = calcCapaciteitsScore(data.ingevuldeFte, data.begroteFte, data.vacatures);
  return prisma.hrFormatie.upsert({
    where: { schoolId_schooljaar: { schoolId, schooljaar: data.schooljaar } },
    create: { schoolId, ...data, capaciteitsScore },
    update: { ...data, capaciteitsScore },
  });
}

// ── Verzuim ─────────────────────────────────────────────────────────

export async function getVerzuimPeriodes(schoolId: string, limit = 12) {
  return prisma.hrVerzuim.findMany({
    where: { schoolId },
    orderBy: { periode: 'desc' },
    take: limit,
  });
}

export async function upsertVerzuim(schoolId: string, data: {
  periode: string;
  verzuimPct: number;
  kortVerzuimPct: number;
  langVerzuimPct: number;
  ziekteVervangingsDagen: number;
}) {
  const belastbaarheidsIndex = calcBelastbaarheidsIndex(data.verzuimPct);
  return prisma.hrVerzuim.upsert({
    where: { schoolId_periode: { schoolId, periode: data.periode } },
    create: { schoolId, ...data, belastbaarheidsIndex },
    update: { ...data, belastbaarheidsIndex },
  });
}

// ── Vervanging ──────────────────────────────────────────────────────

export async function getVervanging(schoolId: string, schooljaar: string) {
  const vervanging = await prisma.hrVervanging.findUnique({
    where: { schoolId_schooljaar: { schoolId, schooljaar } },
  });
  if (!vervanging) throw new NotFoundError('HrVervanging');
  return vervanging;
}

export async function upsertVervanging(schoolId: string, data: {
  schooljaar: string;
  totaalVervangingsDagen: number;
  nietVervuldeDagen: number;
  kostenVervanging: number;
  totaalFte: number;
}) {
  const vervangingsIndex = calcVervangingsIndex(data.nietVervuldeDagen, data.totaalVervangingsDagen);
  return prisma.hrVervanging.upsert({
    where: { schoolId_schooljaar: { schoolId, schooljaar: data.schooljaar } },
    create: { schoolId, ...data, vervangingsIndex },
    update: { ...data, vervangingsIndex },
  });
}

// ── Leeftijd ────────────────────────────────────────────────────────

export async function getLeeftijd(schoolId: string, schooljaar: string) {
  const leeftijd = await prisma.hrLeeftijd.findUnique({
    where: { schoolId_schooljaar: { schoolId, schooljaar } },
  });
  if (!leeftijd) throw new NotFoundError('HrLeeftijd');
  return leeftijd;
}

export async function upsertLeeftijd(schoolId: string, data: {
  schooljaar: string;
  categorieOnder30: number;
  categorie30Tot40: number;
  categorie40Tot50: number;
  categorie50Tot60: number;
  categorie60Plus: number;
}) {
  const verwachteUitstroom3Jaar = calcVerwachteUitstroom(data.categorie60Plus, data.categorie50Tot60);
  return prisma.hrLeeftijd.upsert({
    where: { schoolId_schooljaar: { schoolId, schooljaar: data.schooljaar } },
    create: { schoolId, ...data, verwachteUitstroom3Jaar },
    update: { ...data, verwachteUitstroom3Jaar },
  });
}

// ── Signalen ────────────────────────────────────────────────────────

export async function listSignalen(schoolId: string, status?: string) {
  return prisma.hrSignaal.findMany({
    where: {
      schoolId,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { deadline: 'asc' },
  });
}

export async function updateSignaalStatus(id: string, status: string) {
  const signaal = await prisma.hrSignaal.findUnique({ where: { id } });
  if (!signaal) throw new NotFoundError('HrSignaal');
  return prisma.hrSignaal.update({
    where: { id },
    data: { status: status as any },
  });
}

// ── Overview ────────────────────────────────────────────────────────

export async function getHrSchoolOverview(tenantId: string) {
  const schools = await prisma.school.findMany({
    where: { tenantId },
    orderBy: { naam: 'asc' },
  });

  const overview = await Promise.all(
    schools.map(async (school) => {
      const [formatie, verzuim, vervanging, leeftijd, signalen] = await Promise.all([
        prisma.hrFormatie.findFirst({
          where: { schoolId: school.id },
          orderBy: { schooljaar: 'desc' },
        }),
        prisma.hrVerzuim.findFirst({
          where: { schoolId: school.id },
          orderBy: { periode: 'desc' },
        }),
        prisma.hrVervanging.findFirst({
          where: { schoolId: school.id },
          orderBy: { schooljaar: 'desc' },
        }),
        prisma.hrLeeftijd.findFirst({
          where: { schoolId: school.id },
          orderBy: { schooljaar: 'desc' },
        }),
        prisma.hrSignaal.count({
          where: { schoolId: school.id, status: 'OPEN' },
        }),
      ]);

      const formatieScore = formatie?.capaciteitsScore ?? 0;
      const verzuimScore = verzuim?.belastbaarheidsIndex ?? 100;
      const vervIdx = vervanging?.vervangingsIndex ?? 100;
      const hrScore = Math.round(formatieScore * 0.3 + verzuimScore * 0.3 + vervIdx * 0.2 + (leeftijd ? 80 : 100) * 0.2);
      const risico = hrScore >= 70 ? 'STABIEL' : hrScore >= 50 ? 'KWETSBAAR' : 'HOOG_RISICO';

      return {
        schoolId: school.id,
        schoolNaam: school.naam,
        hrScore,
        formatieScore: Math.round(formatieScore),
        verzuimPct: verzuim?.verzuimPct ?? 0,
        vervangingsIndex: Math.round(vervIdx),
        risico,
        openSignalen: signalen,
      };
    }),
  );

  return overview;
}
