import prisma from '../../utils/prisma.js';
import type { HrSignaal, HrSignaalStatus } from '@schoollaider/shared';
import { getFormatie } from './formatie.service.js';
import { getLatestVerzuimPct, NORM_VERZUIM_PCT } from './verzuim.service.js';
import { getVervanging } from './vervanging.service.js';
import { getLeeftijd } from './leeftijd.service.js';

function mapSignaal(r: {
  id: string;
  schoolId: string;
  type: string;
  titel: string;
  beschrijving: string;
  aanbevolenActie: string;
  deadline: Date | null;
  status: string;
  createdAt: Date;
}): HrSignaal {
  return {
    id: r.id,
    schoolId: r.schoolId,
    type: r.type as HrSignaal['type'],
    titel: r.titel,
    beschrijving: r.beschrijving,
    aanbevolenActie: r.aanbevolenActie,
    deadline: r.deadline?.toISOString() ?? null,
    status: r.status as HrSignaalStatus,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function generateSignalen(schoolId: string): Promise<HrSignaal[]> {
  const created: HrSignaal[] = [];

  // Check formatie tekort
  const formatie = await getFormatie(schoolId);
  if (formatie && formatie.begroteFte - formatie.ingevuldeFte > 0.5) {
    const existing = await prisma.hrSignaal.findFirst({
      where: { schoolId, type: 'TEKORT', status: { not: 'AFGEHANDELD' } },
    });
    if (!existing) {
      const record = await prisma.hrSignaal.create({
        data: {
          schoolId,
          type: 'TEKORT',
          titel: `FTE-tekort van ${(formatie.begroteFte - formatie.ingevuldeFte).toFixed(1)}`,
          beschrijving: `De school heeft ${formatie.ingevuldeFte} FTE ingevuld van de ${formatie.begroteFte} begrote FTE. Er zijn ${formatie.vacatures} openstaande vacatures.`,
          aanbevolenActie: 'Start wervingsprocedure en overweeg inzet van invalpool.',
        },
      });
      created.push(mapSignaal(record));
    }
  }

  // Check verzuim boven norm
  const verzuimPct = await getLatestVerzuimPct(schoolId);
  if (verzuimPct > NORM_VERZUIM_PCT) {
    const existing = await prisma.hrSignaal.findFirst({
      where: { schoolId, type: 'VERZUIM', status: { not: 'AFGEHANDELD' } },
    });
    if (!existing) {
      const record = await prisma.hrSignaal.create({
        data: {
          schoolId,
          type: 'VERZUIM',
          titel: `Verzuim ${verzuimPct.toFixed(1)}% boven norm (${NORM_VERZUIM_PCT}%)`,
          beschrijving: `Het huidige verzuimpercentage van ${verzuimPct.toFixed(1)}% ligt boven het landelijk gemiddelde van ${NORM_VERZUIM_PCT}% voor het primair onderwijs.`,
          aanbevolenActie: 'Analyseer verzuimoorzaken en plan gesprekken met leidinggevende.',
        },
      });
      created.push(mapSignaal(record));
    }
  }

  // Check vervangingsdruk
  const vervanging = await getVervanging(schoolId);
  if (vervanging && vervanging.vervangingsIndex < 30) {
    const existing = await prisma.hrSignaal.findFirst({
      where: { schoolId, type: 'VERVANGING', status: { not: 'AFGEHANDELD' } },
    });
    if (!existing) {
      const record = await prisma.hrSignaal.create({
        data: {
          schoolId,
          type: 'VERVANGING',
          titel: 'Hoge vervangingsdruk',
          beschrijving: `De vervangingsindex is ${vervanging.vervangingsIndex}. Er zijn ${vervanging.nietVervuldeDagen} niet-vervulde dagen dit schooljaar.`,
          aanbevolenActie: 'Vergroot de invalpool en maak noodscenario-protocol.',
        },
      });
      created.push(mapSignaal(record));
    }
  }

  // Check pensioenpiek (uitstroom)
  const leeftijd = await getLeeftijd(schoolId);
  if (leeftijd) {
    const totaal =
      leeftijd.categorieOnder30 +
      leeftijd.categorie30Tot40 +
      leeftijd.categorie40Tot50 +
      leeftijd.categorie50Tot60 +
      leeftijd.categorie60Plus;

    if (totaal > 0) {
      const pct60Plus = (leeftijd.categorie60Plus / totaal) * 100;
      if (pct60Plus > 30) {
        const existing = await prisma.hrSignaal.findFirst({
          where: { schoolId, type: 'UITSTROOM', status: { not: 'AFGEHANDELD' } },
        });
        if (!existing) {
          const record = await prisma.hrSignaal.create({
            data: {
              schoolId,
              type: 'UITSTROOM',
              titel: `${Math.round(pct60Plus)}% personeel is 60+`,
              beschrijving: `Van de ${totaal} personeelsleden zijn er ${leeftijd.categorie60Plus} ouder dan 60. De verwachte uitstroom binnen 3 jaar is ${leeftijd.verwachteUitstroom3Jaar}.`,
              aanbevolenActie: 'Start kennisoverdracht-programma en strategische werving.',
            },
          });
          created.push(mapSignaal(record));
        }
      }
    }
  }

  return created;
}

export async function listSignalen(
  schoolId: string,
  status?: HrSignaalStatus,
): Promise<HrSignaal[]> {
  const records = await prisma.hrSignaal.findMany({
    where: {
      schoolId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return records.map(mapSignaal);
}

export async function updateSignaalStatus(
  id: string,
  status: HrSignaalStatus,
): Promise<HrSignaal> {
  const record = await prisma.hrSignaal.update({
    where: { id },
    data: { status },
  });
  return mapSignaal(record);
}

export async function countOpenSignalen(schoolId: string): Promise<number> {
  return prisma.hrSignaal.count({
    where: { schoolId, status: { not: 'AFGEHANDELD' } },
  });
}
