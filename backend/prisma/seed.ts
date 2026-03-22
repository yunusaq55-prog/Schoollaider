import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Inspectiekader ────────────────────────────────────────────

const DOMEINEN = [
  {
    code: 'OP',
    naam: 'Onderwijsproces',
    beschrijving: 'De kwaliteit van het onderwijsproces',
    versie: '2021',
    standaarden: [
      { code: 'OP1', naam: 'Aanbod', beschrijving: 'De school biedt de leerlingen een samenhangend curriculum aan.', gewicht: 2 },
      { code: 'OP2', naam: 'Zicht op ontwikkeling', beschrijving: 'De leraren volgen en analyseren de ontwikkeling van leerlingen.', gewicht: 2 },
      { code: 'OP3', naam: 'Didactisch handelen', beschrijving: 'De leraren geven de leerlingen duidelijke uitleg en bieden passende werkvormen.', gewicht: 2 },
      { code: 'OP4', naam: 'Extra ondersteuning', beschrijving: 'Leerlingen die dat nodig hebben ontvangen extra ondersteuning.', gewicht: 1 },
      { code: 'OP5', naam: 'Samenwerking', beschrijving: 'De school werkt samen met relevante partners om het onderwijs te versterken.', gewicht: 1 },
      { code: 'OP6', naam: 'Pedagogisch handelen', beschrijving: 'De leraren zorgen voor een respectvolle omgang in de groepen.', gewicht: 2 },
    ],
  },
  {
    code: 'OR',
    naam: 'Onderwijsresultaten',
    beschrijving: 'De resultaten die leerlingen behalen',
    versie: '2021',
    standaarden: [
      { code: 'OR1', naam: 'Resultaten', beschrijving: 'De leerlingen behalen resultaten die passen bij hun ontwikkeling.', gewicht: 2 },
      { code: 'OR2', naam: 'Sociale competenties', beschrijving: 'De leerlingen ontwikkelen passende sociale competenties.', gewicht: 1 },
    ],
  },
  {
    code: 'VE',
    naam: 'Veiligheid en Schoolklimaat',
    beschrijving: 'De veiligheid en het schoolklimaat',
    versie: '2021',
    standaarden: [
      { code: 'VE1', naam: 'Sociale en fysieke veiligheid', beschrijving: 'De school zorgt voor de sociale en fysieke veiligheid van leerlingen.', gewicht: 2 },
      { code: 'VE2', naam: 'Pedagogisch klimaat', beschrijving: 'De school draagt zorg voor een goed pedagogisch klimaat.', gewicht: 2 },
    ],
  },
  {
    code: 'KA',
    naam: 'Kwaliteitszorg en Ambitie',
    beschrijving: 'De kwaliteitszorg en ambitie van de school',
    versie: '2021',
    standaarden: [
      { code: 'KA1', naam: 'Kwaliteitszorg', beschrijving: 'De school heeft een stelsel van kwaliteitszorg.', gewicht: 2 },
      { code: 'KA2', naam: 'Verantwoording en dialoog', beschrijving: 'De school verantwoordt zich over de kwaliteit van het onderwijs.', gewicht: 1 },
      { code: 'KA3', naam: 'Ambitie', beschrijving: 'De school werkt planmatig aan verbeteractiviteiten.', gewicht: 1 },
    ],
  },
  {
    code: 'SKA',
    naam: 'Sturen, Kwaliteitszorg, Ambitie (Bestuur)',
    beschrijving: 'De kwaliteitszorg op bestuursniveau',
    versie: '2021',
    standaarden: [
      { code: 'SKA1', naam: 'Visie en ambitie bestuur', beschrijving: 'Het bestuur heeft een heldere visie op de kwaliteit van het onderwijs.', gewicht: 2 },
      { code: 'SKA2', naam: 'Kwaliteitszorg bestuur', beschrijving: 'Het bestuur heeft een stelsel van kwaliteitszorg op bestuursniveau.', gewicht: 2 },
      { code: 'SKA3', naam: 'Financieel beheer', beschrijving: 'Het bestuur zorgt voor doelmatige inzet van middelen.', gewicht: 1 },
    ],
  },
];

// ─── Subsidie regelingen ────────────────────────────────────────

const SUBSIDIE_REGELINGEN = [
  {
    slug: 'npo-nationaal-programma-onderwijs',
    naam: 'NPO (Nationaal Programma Onderwijs)',
    financier: 'DUS-I',
    financierUrl: 'https://www.dus-i.nl/subsidies/npo',
    beschrijving: 'Het Nationaal Programma Onderwijs biedt scholen middelen om leervertragingen als gevolg van de coronapandemie te herstellen. De subsidie is bedoeld voor gerichte interventies op het gebied van cognitieve en sociaal-emotionele ontwikkeling van leerlingen in het primair onderwijs.',
    doelgroep: 'PO-scholen met aantoonbare leervertraging',
    minBedrag: 200, maxBedrag: 800, bedragPerEenheid: 'per leerling',
    aanvraagPeriodeOpen: new Date('2026-01-15'), aanvraagPeriodeSluiting: new Date('2026-04-30'),
    projectPeriodeStart: new Date('2026-08-01'), projectPeriodeEinde: new Date('2027-07-31'),
    verantwoordingDeadline: 'Uiterlijk 1 oktober 2027',
    verantwoordingEisen: 'Financieel verslag, inhoudelijk verslag met meetbare resultaten, leerlingvolgsysteem-data.',
    vereisten: 'Schoolscan uitgevoerd, interventies geselecteerd uit NPO-menukaart, instemming MR.',
    tags: ['leervertraging', 'corona-herstel', 'interventies', 'basisvaardigheden'], actief: true,
  },
  {
    slug: 'impuls-basisvaardigheden',
    naam: 'Impuls Basisvaardigheden',
    financier: 'DUS-I',
    financierUrl: 'https://www.dus-i.nl/subsidies/impuls-basisvaardigheden',
    beschrijving: 'Subsidie gericht op het structureel verbeteren van basisvaardigheden (taal, rekenen en burgerschap) in het primair onderwijs.',
    doelgroep: 'PO-scholen en besturen',
    minBedrag: 50000, maxBedrag: 200000, bedragPerEenheid: 'per aanvraag',
    aanvraagPeriodeOpen: new Date('2026-02-01'), aanvraagPeriodeSluiting: new Date('2026-05-15'),
    projectPeriodeStart: new Date('2026-08-01'), projectPeriodeEinde: new Date('2028-07-31'),
    verantwoordingDeadline: 'Uiterlijk 1 december 2028',
    verantwoordingEisen: 'Jaarlijkse voortgangsrapportage, eindverslag, financieel verslag met accountantsverklaring bij bedragen boven €125.000.',
    vereisten: 'Analyse van huidige stand basisvaardigheden, verbeterplan met SMART-doelen.',
    tags: ['basisvaardigheden', 'taal', 'rekenen', 'burgerschap', 'meerjarig'], actief: true,
  },
  {
    slug: 'subsidie-zij-instroom',
    naam: 'Subsidie Zij-instroom',
    financier: 'DUS-I',
    financierUrl: 'https://www.dus-i.nl/subsidies/zij-instroom',
    beschrijving: 'Subsidie voor het begeleiden van zij-instromers naar een bevoegdheid als leraar in het primair onderwijs.',
    doelgroep: 'PO-besturen die zij-instromers aannemen',
    minBedrag: 20000, maxBedrag: 40000, bedragPerEenheid: 'per FTE zij-instromer',
    aanvraagPeriodeOpen: new Date('2026-01-01'), aanvraagPeriodeSluiting: new Date('2026-09-30'),
    projectPeriodeStart: new Date('2026-01-01'), projectPeriodeEinde: new Date('2028-12-31'),
    verantwoordingDeadline: 'Binnen 3 maanden na afronding traject',
    verantwoordingEisen: 'Bewijs van geschiktheidsonderzoek, voortgangsverslagen, verklaring van de opleider.',
    vereisten: 'Positief geschiktheidsonderzoek, samenwerkingsovereenkomst met erkende opleider.',
    tags: ['zij-instroom', 'lerarentekort', 'personeel', 'opleiding'], actief: true,
  },
  {
    slug: 'vve-vroeg-voorschoolse-educatie',
    naam: 'VVE (Vroeg- en voorschoolse educatie)',
    financier: 'Gemeente',
    financierUrl: null,
    beschrijving: 'Gemeentelijke subsidie voor vroeg- en voorschoolse educatie, gericht op het voorkomen van taalachterstanden bij peuters en kleuters.',
    doelgroep: 'PO-scholen met vroegschoolse groepen en samenwerkende kinderopvang',
    minBedrag: null, maxBedrag: null, bedragPerEenheid: 'per VVE-peuter/kleuter',
    aanvraagPeriodeOpen: new Date('2026-02-01'), aanvraagPeriodeSluiting: new Date('2026-04-15'),
    projectPeriodeStart: new Date('2026-08-01'), projectPeriodeEinde: new Date('2027-07-31'),
    verantwoordingDeadline: 'Uiterlijk 1 oktober 2027',
    verantwoordingEisen: 'Registratie van deelnemende kinderen, voortgangsrapportage, financieel verslag.',
    vereisten: 'Erkend VVE-programma, gecertificeerde VVE-medewerkers, samenwerking met kinderopvang.',
    tags: ['vve', 'peuters', 'kleuters', 'taalstimulering', 'gemeente'], actief: true,
  },
  {
    slug: 'werkdrukmiddelen-po',
    naam: 'Werkdrukmiddelen PO',
    financier: 'Rijksoverheid',
    financierUrl: 'https://www.rijksoverheid.nl/onderwerpen/werken-in-het-onderwijs/werkdruk-in-het-po',
    beschrijving: 'Structurele middelen voor het verlagen van de werkdruk in het primair onderwijs.',
    doelgroep: 'Alle PO-scholen',
    minBedrag: null, maxBedrag: null, bedragPerEenheid: 'per leerling (structureel via lumpsum)',
    aanvraagPeriodeOpen: null, aanvraagPeriodeSluiting: null,
    projectPeriodeStart: new Date('2026-01-01'), projectPeriodeEinde: new Date('2026-12-31'),
    verantwoordingDeadline: 'Jaarlijks via jaarverslag bestuur',
    verantwoordingEisen: 'Verantwoording in het bestuursverslag, instemming van de MR op het bestedingsplan.',
    vereisten: 'Bestedingsplan opgesteld in overleg met het team, instemming MR vereist.',
    tags: ['werkdruk', 'structureel', 'personeel', 'lumpsum'], actief: true,
  },
  {
    slug: 'onderwijsachterstandenbeleid-oab',
    naam: 'Onderwijsachterstandenbeleid (OAB)',
    financier: 'Gemeente',
    financierUrl: null,
    beschrijving: 'Gemeentelijke middelen voor het bestrijden van onderwijsachterstanden.',
    doelgroep: 'PO-scholen met hoge achterstandsscores',
    minBedrag: null, maxBedrag: null, bedragPerEenheid: 'variabel, afhankelijk van CBS-indicator',
    aanvraagPeriodeOpen: new Date('2026-01-01'), aanvraagPeriodeSluiting: new Date('2026-03-31'),
    projectPeriodeStart: new Date('2026-01-01'), projectPeriodeEinde: new Date('2026-12-31'),
    verantwoordingDeadline: 'Uiterlijk 1 juli 2027',
    verantwoordingEisen: 'Inhoudelijk en financieel verslag aan gemeente.',
    vereisten: 'School valt binnen doelgroepdefinitie op basis van CBS-achterstandsscores.',
    tags: ['achterstandenbeleid', 'taal', 'ouderbetrokkenheid', 'gemeente'], actief: true,
  },
];

async function main() {
  console.log('Seeding inspectiekader...');
  for (const domein of DOMEINEN) {
    const created = await prisma.inspectieDomein.upsert({
      where: { code: domein.code },
      update: { naam: domein.naam, beschrijving: domein.beschrijving, versie: domein.versie },
      create: { code: domein.code, naam: domein.naam, beschrijving: domein.beschrijving, versie: domein.versie },
    });
    for (const s of domein.standaarden) {
      await prisma.inspectieStandaard.upsert({
        where: { code: s.code },
        update: { naam: s.naam, beschrijving: s.beschrijving, gewicht: s.gewicht, domeinId: created.id },
        create: { code: s.code, naam: s.naam, beschrijving: s.beschrijving, gewicht: s.gewicht, domeinId: created.id },
      });
    }
  }

  console.log('Seeding subsidie regelingen...');
  for (const r of SUBSIDIE_REGELINGEN) {
    await prisma.subsidieRegeling.upsert({ where: { slug: r.slug }, update: r, create: r });
  }

  // ─── Tenant & scholen ────────────────────────────────────────

  console.log('Seeding tenant & scholen...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-bestuur' },
    update: {},
    create: { naam: 'Stichting Primair Amsterdam Centrum', slug: 'demo-bestuur' },
  });

  const schoolsData = [
    { id: 'demo-01AB', naam: 'De Regenboog', brinCode: '01AB', adres: 'Schoolstraat 1, Amsterdam', directeur: 'Jan de Vries', leerlingaantal: 320 },
    { id: 'demo-02CD', naam: 'Het Kompas', brinCode: '02CD', adres: 'Kompasweg 5, Amsterdam', directeur: 'Marie Jansen', leerlingaantal: 245 },
    { id: 'demo-03EF', naam: 'De Ontdekking', brinCode: '03EF', adres: 'Ontdekkingslaan 12, Amsterdam', directeur: 'Pieter Bakker', leerlingaantal: 180 },
  ];

  for (const s of schoolsData) {
    await prisma.school.upsert({ where: { id: s.id }, update: s, create: { ...s, tenantId: tenant.id } });
  }

  // ─── Gebruikers ────────────────────────────────────────────────

  console.log('Seeding gebruikers...');
  const passwordHash = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.nl' },
    update: {},
    create: { tenantId: tenant.id, email: 'admin@demo.nl', passwordHash, naam: 'Sophie van den Berg', role: 'BESTUUR_ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'directeur@demo.nl' },
    update: {},
    create: { tenantId: tenant.id, email: 'directeur@demo.nl', passwordHash, naam: 'Jan de Vries', role: 'SCHOOL_DIRECTEUR', schoolId: 'demo-01AB' },
  });

  await prisma.user.upsert({
    where: { email: 'directeur2@demo.nl' },
    update: {},
    create: { tenantId: tenant.id, email: 'directeur2@demo.nl', passwordHash, naam: 'Marie Jansen', role: 'SCHOOL_DIRECTEUR', schoolId: 'demo-02CD' },
  });

  await prisma.user.upsert({
    where: { email: 'ops@demo.nl' },
    update: {},
    create: { tenantId: tenant.id, email: 'ops@demo.nl', passwordHash, naam: 'Thomas Meijer', role: 'OPERATIONEEL_MANAGER' },
  });

  // ─── HR data ────────────────────────────────────────────────────
  // Verhaal: Regenboog = stabiel. Kompas = KRITIEK (verzuim + tekort). Ontdekking = hoog verzuim.

  console.log('Seeding HR data...');

  // De Regenboog — stabiel, 1 vacature open
  await prisma.hrFormatie.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-01AB', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-01AB', schooljaar: '2025-2026', begroteFte: 13.0, ingevuldeFte: 12.2, vacatures: 1, tijdelijkPct: 18, fteLeerkracht: 10.2, fteOop: 1.4, fteDirectie: 0.6, capaciteitsScore: 78 },
  });
  for (const [periode, pct, kort, lang, dagen] of [
    ['2025-Q1', 4.8, 2.1, 2.7, 28], ['2025-Q2', 3.9, 1.8, 2.1, 22],
    ['2025-Q3', 5.3, 2.4, 2.9, 31], ['2025-Q4', 4.2, 1.9, 2.3, 25],
    ['2026-Q1', 5.2, 2.1, 3.1, 30],
  ] as [string, number, number, number, number][]) {
    await prisma.hrVerzuim.upsert({
      where: { schoolId_periode: { schoolId: 'demo-01AB', periode } },
      update: {},
      create: { schoolId: 'demo-01AB', periode, verzuimPct: pct, kortVerzuimPct: kort, langVerzuimPct: lang, ziekteVervangingsDagen: dagen, belastbaarheidsIndex: 82 },
    });
  }
  await prisma.hrVervanging.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-01AB', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-01AB', schooljaar: '2025-2026', totaalVervangingsDagen: 48, nietVervuldeDagen: 5, kostenVervanging: 18500, totaalFte: 12.2, vervangingsIndex: 72 },
  });
  await prisma.hrLeeftijd.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-01AB', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-01AB', schooljaar: '2025-2026', categorieOnder30: 2, categorie30Tot40: 5, categorie40Tot50: 7, categorie50Tot60: 5, categorie60Plus: 3, verwachteUitstroom3Jaar: 2.0 },
  });

  // Het Kompas — ROOD: 9.8% verzuim, 1.7 FTE tekort, 2 vacatures
  await prisma.hrFormatie.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-02CD', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-02CD', schooljaar: '2025-2026', begroteFte: 9.5, ingevuldeFte: 7.8, vacatures: 2, tijdelijkPct: 32, fteLeerkracht: 6.2, fteOop: 1.0, fteDirectie: 0.6, capaciteitsScore: 45 },
  });
  for (const [periode, pct, kort, lang, dagen] of [
    ['2025-Q1', 7.2, 2.9, 4.3, 52], ['2025-Q2', 8.1, 3.1, 5.0, 59],
    ['2025-Q3', 9.0, 3.5, 5.5, 65], ['2025-Q4', 10.4, 4.0, 6.4, 75],
    ['2026-Q1', 9.8, 3.2, 6.6, 71],
  ] as [string, number, number, number, number][]) {
    await prisma.hrVerzuim.upsert({
      where: { schoolId_periode: { schoolId: 'demo-02CD', periode } },
      update: {},
      create: { schoolId: 'demo-02CD', periode, verzuimPct: pct, kortVerzuimPct: kort, langVerzuimPct: lang, ziekteVervangingsDagen: dagen, belastbaarheidsIndex: 51 },
    });
  }
  await prisma.hrVervanging.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-02CD', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-02CD', schooljaar: '2025-2026', totaalVervangingsDagen: 95, nietVervuldeDagen: 19, kostenVervanging: 36800, totaalFte: 7.8, vervangingsIndex: 38 },
  });
  await prisma.hrLeeftijd.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-02CD', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-02CD', schooljaar: '2025-2026', categorieOnder30: 1, categorie30Tot40: 2, categorie40Tot50: 4, categorie50Tot60: 5, categorie60Plus: 4, verwachteUitstroom3Jaar: 3.5 },
  });

  // De Ontdekking — hoog verzuim (11.2%), klein team
  await prisma.hrFormatie.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-03EF', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-03EF', schooljaar: '2025-2026', begroteFte: 7.0, ingevuldeFte: 6.8, vacatures: 0, tijdelijkPct: 22, fteLeerkracht: 5.8, fteOop: 0.6, fteDirectie: 0.4, capaciteitsScore: 68 },
  });
  for (const [periode, pct, kort, lang, dagen] of [
    ['2025-Q1', 8.1, 3.2, 4.9, 38], ['2025-Q2', 9.4, 4.0, 5.4, 44],
    ['2025-Q3', 10.2, 4.5, 5.7, 48], ['2025-Q4', 11.8, 5.1, 6.7, 55],
    ['2026-Q1', 11.2, 4.5, 6.7, 52],
  ] as [string, number, number, number, number][]) {
    await prisma.hrVerzuim.upsert({
      where: { schoolId_periode: { schoolId: 'demo-03EF', periode } },
      update: {},
      create: { schoolId: 'demo-03EF', periode, verzuimPct: pct, kortVerzuimPct: kort, langVerzuimPct: lang, ziekteVervangingsDagen: dagen, belastbaarheidsIndex: 58 },
    });
  }
  await prisma.hrVervanging.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-03EF', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-03EF', schooljaar: '2025-2026', totaalVervangingsDagen: 68, nietVervuldeDagen: 11, kostenVervanging: 26200, totaalFte: 6.8, vervangingsIndex: 49 },
  });
  await prisma.hrLeeftijd.upsert({
    where: { schoolId_schooljaar: { schoolId: 'demo-03EF', schooljaar: '2025-2026' } },
    update: {},
    create: { schoolId: 'demo-03EF', schooljaar: '2025-2026', categorieOnder30: 0, categorie30Tot40: 2, categorie40Tot50: 3, categorie50Tot60: 4, categorie60Plus: 2, verwachteUitstroom3Jaar: 1.5 },
  });

  // HR Signalen
  await prisma.hrSignaal.createMany({
    skipDuplicates: true,
    data: [
      {
        schoolId: 'demo-02CD', type: 'VERZUIM', titel: 'Verzuim 9.8% — stijgende trend al 4 kwartalen',
        beschrijving: 'Het personeelsverzuim bij Het Kompas stijgt aanhoudend: van 7.2% in Q1-2025 naar 9.8% in Q1-2026. Dit is significant boven de landelijke norm (5.5%). Vier medewerkers zijn langer dan 6 weken afwezig.',
        aanbevolenActie: 'Start een verzuimgesprekscyclus. Overweeg inzet van een bedrijfsarts voor de langdurig zieken. Bekijk of werkdrukverlichting via de Werkdrukmiddelen PO mogelijk is.',
        deadline: new Date('2026-04-15'), status: 'OPEN',
      },
      {
        schoolId: 'demo-02CD', type: 'TEKORT', titel: '2 openstaande vacatures — 1.7 FTE tekort',
        beschrijving: 'Het Kompas heeft momenteel 2 open vacatures (1.2 FTE groepsleerkracht, 0.5 FTE intern begeleider). De begrotingsnorm is 9.5 FTE, er is 7.8 FTE ingevuld. Dit leidt tot 19 niet-vervulde vervangingsdagen dit schooljaar.',
        aanbevolenActie: 'Overweeg een zij-instromer aan te trekken voor de leerkrachtvacature. Er is subsidie beschikbaar (€20.000–€40.000 per FTE). Zet ook in op netwerken via Onderwijscoöperatie.',
        deadline: new Date('2026-05-01'), status: 'OPEN',
      },
      {
        schoolId: 'demo-03EF', type: 'VERZUIM', titel: 'Verzuim 11.2% — kritiek niveau',
        beschrijving: 'Het personeelsverzuim bij De Ontdekking heeft het kritieke niveau bereikt. Het langdurig verzuim (6.7%) is bijzonder hoog voor een team van 7 medewerkers. 1 medewerker is al 14 weken ziek (burn-out).',
        aanbevolenActie: 'Neem onmiddellijk contact op met arbodienst. Maak een re-integratieplan voor de langdurig zieke medewerker. Onderzoek de werkbelasting van het team — de school heeft de kleinste staf maar een vergelijkbaar leerlingaantal als andere kleine scholen.',
        deadline: new Date('2026-04-01'), status: 'OPEN',
      },
    ],
  });

  // ─── Inspectie statussen ─────────────────────────────────────────────
  // Verhaal: Regenboog bijna klaar voor inspectie. Kompas heeft gaten. Ontdekking goed.

  console.log('Seeding inspectie statussen...');

  const alleStandaarden = await prisma.inspectieStandaard.findMany({ select: { id: true, code: true } });
  const stdMap = Object.fromEntries(alleStandaarden.map(s => [s.code, s.id]));

  const statusPerSchool: Record<string, Record<string, { status: 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT'; bewijs: string; evaluatie: string }>> = {
    'demo-01AB': { // De Regenboog — goed, 2 kleine gaten
      OP1: { status: 'AANTOONBAAR', bewijs: 'Leerplan 2024-2025 vastgesteld, aantoonbaar in lesbezoeken Q1', evaluatie: 'Curriculum is up-to-date en sluit aan bij methodes.' },
      OP2: { status: 'AANTOONBAAR', bewijs: 'LVS Cito volledig ingevuld, groepsplannen aanwezig', evaluatie: 'Leerlingvolging structureel verankerd.' },
      OP3: { status: 'AANTOONBAAR', bewijs: '12 lesbezoeken directeur, feedbackgesprekken gedocumenteerd', evaluatie: 'Didactisch handelen op niveau, differentiatie zichtbaar.' },
      OP4: { status: 'ONVOLLEDIG', bewijs: 'Zorgplan aanwezig, maar geen actuele handelingsplannen voor 8 leerlingen', evaluatie: 'Zorgstructuur aanwezig maar niet volledig bijgewerkt na laatste overdracht.' },
      OP5: { status: 'AANTOONBAAR', bewijs: 'Samenwerkingsovereenkomst Samenwerkingsverband, contacten met kindertherapeut', evaluatie: 'Samenwerking goed gestructureerd.' },
      OP6: { status: 'AANTOONBAAR', bewijs: 'Kanjertraining actief in alle groepen, pedagogisch klimaatmeting positief', evaluatie: 'Pedagogisch klimaat wordt breed gewaardeerd.' },
      OR1: { status: 'AANTOONBAAR', bewijs: 'CITO-scores 2025: gemiddeld 536,4 (landelijk: 535,2)', evaluatie: 'Resultaten boven gemiddeld, consistent.' },
      OR2: { status: 'AANTOONBAAR', bewijs: 'Welzijnsmeting leerlingen (Leerling in Beeld) — 87% positief', evaluatie: 'Sociale competenties worden actief gestimuleerd.' },
      VE1: { status: 'AANTOONBAAR', bewijs: 'BHV-certificaten up-to-date, ontruimingsoefening feb 2026, anti-pestprotocol', evaluatie: 'Veiligheidsbeleid compleet en actueel.' },
      VE2: { status: 'AANTOONBAAR', bewijs: 'Oudertevredenheidsonderzoek 2025: 8.1/10, medewerkerswelzijnsonderzoek: 7.6/10', evaluatie: 'Schoolklimaat positief beoordeeld.' },
      KA1: { status: 'AANTOONBAAR', bewijs: 'Jaarplan 2025-2026 vastgesteld, kwaliteitsagenda aanwezig', evaluatie: 'Kwaliteitscyclus is zichtbaar en systematisch.' },
      KA2: { status: 'ONVOLLEDIG', bewijs: 'Jaarverslag 2024-2025 concept klaar, nog niet gedeeld met MR', evaluatie: 'Verantwoording bijna compleet — jaarverslag moet formeel worden vastgesteld.' },
      KA3: { status: 'AANTOONBAAR', bewijs: 'Schoolplan 2023-2027 bevat 5 strategische doelen, PDCA-cyclus loopt', evaluatie: 'Ambitie helder en planmatig uitgewerkt.' },
      SKA1: { status: 'AANTOONBAAR', bewijs: 'Bestuursvisie 2023-2027 vastgesteld, vertaald naar alle scholen', evaluatie: '' },
      SKA2: { status: 'AANTOONBAAR', bewijs: 'Bestuurskader kwaliteitszorg aanwezig', evaluatie: '' },
      SKA3: { status: 'AANTOONBAAR', bewijs: 'Jaarrekening 2024 goedgekeurd, meerjarenbegroting aanwezig', evaluatie: '' },
    },
    'demo-02CD': { // Het Kompas — RISICO: 4 ontbrekende standaarden
      OP1: { status: 'AANTOONBAAR', bewijs: 'Leerplan aanwezig', evaluatie: 'Curriculum aanwezig maar niet recent herzien.' },
      OP2: { status: 'ONVOLLEDIG', bewijs: 'LVS gedeeltelijk ingevuld — groep 5 en 7 niet bijgewerkt', evaluatie: 'Monitoringssysteem niet consequent gebruikt. Aandachtspunt voor inspectie.' },
      OP3: { status: 'ONVOLLEDIG', bewijs: 'Slechts 4 lesbezoeken dit jaar door directeur (norm: 12+)', evaluatie: 'Directeur heeft door twee langdurig zieken weinig ruimte gehad voor lesbezoeken.' },
      OP4: { status: 'ONTBREEKT', bewijs: '', evaluatie: 'Zorgplan verouderd (2022), geen actuele handelingsplannen aanwezig.' },
      OP5: { status: 'AANTOONBAAR', bewijs: 'Samenwerking Samenwerkingsverband aanwezig', evaluatie: '' },
      OP6: { status: 'AANTOONBAAR', bewijs: 'Sociaal veiligheidsplan aanwezig', evaluatie: '' },
      OR1: { status: 'ONTBREEKT', bewijs: '', evaluatie: 'CITO-scores 2025 significant onder gemiddeld (529.8 vs. 535.2 landelijk). Geen analyse opgesteld.' },
      OR2: { status: 'ONVOLLEDIG', bewijs: 'Welzijnsmeting 2024 uitgevoerd, opvolging niet gedocumenteerd', evaluatie: '' },
      VE1: { status: 'AANTOONBAAR', bewijs: 'BHV up-to-date, ontruimingsoefening okt 2025', evaluatie: '' },
      VE2: { status: 'ONTBREEKT', bewijs: '', evaluatie: 'Oudertevredenheidsonderzoek 2025 niet uitgevoerd (was gepland voor nov 2025, uitgesteld). Medewerkerswelzijnsonderzoek toont lage scores (5.8/10).' },
      KA1: { status: 'ONTBREEKT', bewijs: '', evaluatie: 'Kwaliteitsagenda 2025-2026 niet vastgesteld. Jaarplan ontbreekt formeel.' },
      KA2: { status: 'ONVOLLEDIG', bewijs: 'Jaarverslag 2024-2025 niet afgerond', evaluatie: '' },
      KA3: { status: 'ONVOLLEDIG', bewijs: 'Schoolplan aanwezig maar doelen niet SMART geformuleerd', evaluatie: '' },
      SKA1: { status: 'AANTOONBAAR', bewijs: 'Bestuursvisie 2023-2027 vastgesteld', evaluatie: '' },
      SKA2: { status: 'AANTOONBAAR', bewijs: 'Bestuurskader kwaliteitszorg aanwezig', evaluatie: '' },
      SKA3: { status: 'AANTOONBAAR', bewijs: 'Jaarrekening 2024 goedgekeurd', evaluatie: '' },
    },
    'demo-03EF': { // De Ontdekking — grotendeels goed, 1 gat (OR1 aandacht)
      OP1: { status: 'AANTOONBAAR', bewijs: 'Leerplan 2024-2025 vastgesteld', evaluatie: '' },
      OP2: { status: 'AANTOONBAAR', bewijs: 'LVS volledig bijgewerkt', evaluatie: '' },
      OP3: { status: 'AANTOONBAAR', bewijs: '10 lesbezoeken directeur, feedback gedocumenteerd', evaluatie: '' },
      OP4: { status: 'AANTOONBAAR', bewijs: 'Zorgplan actueel, 9 handelingsplannen aanwezig', evaluatie: '' },
      OP5: { status: 'AANTOONBAAR', bewijs: 'Samenwerking SWV, GGZ en buurtwerk actief', evaluatie: '' },
      OP6: { status: 'AANTOONBAAR', bewijs: 'Positief schoolklimaat, Taakspel geïmplementeerd', evaluatie: '' },
      OR1: { status: 'ONVOLLEDIG', bewijs: 'CITO-scores 2025: 533.1 (licht onder gemiddeld)', evaluatie: 'Resultaten licht onder gemiddeld. Analyse opgesteld, interventieplan in ontwikkeling.' },
      OR2: { status: 'AANTOONBAAR', bewijs: 'Welzijnsmeting positief (82%)', evaluatie: '' },
      VE1: { status: 'AANTOONBAAR', bewijs: 'Veiligheidsbeleid compleet en actueel', evaluatie: '' },
      VE2: { status: 'AANTOONBAAR', bewijs: 'Schoolklimaatonderzoek 7.9/10', evaluatie: '' },
      KA1: { status: 'AANTOONBAAR', bewijs: 'Kwaliteitsagenda vastgesteld', evaluatie: '' },
      KA2: { status: 'AANTOONBAAR', bewijs: 'Jaarverslag vastgesteld en gepubliceerd', evaluatie: '' },
      KA3: { status: 'AANTOONBAAR', bewijs: 'Schoolplan met SMART-doelen', evaluatie: '' },
      SKA1: { status: 'AANTOONBAAR', bewijs: 'Bestuursvisie 2023-2027 vastgesteld', evaluatie: '' },
      SKA2: { status: 'AANTOONBAAR', bewijs: 'Bestuurskader kwaliteitszorg aanwezig', evaluatie: '' },
      SKA3: { status: 'AANTOONBAAR', bewijs: 'Jaarrekening 2024 goedgekeurd', evaluatie: '' },
    },
  };

  for (const [schoolId, statussen] of Object.entries(statusPerSchool)) {
    for (const [code, data] of Object.entries(statussen)) {
      const standaardId = stdMap[code];
      if (!standaardId) continue;
      await prisma.schoolStandaardStatus.upsert({
        where: { schoolId_standaardId: { schoolId, standaardId } },
        update: { status: data.status, bewijs: data.bewijs, evaluatie: data.evaluatie, actueel: true },
        create: { schoolId, standaardId, status: data.status, bewijs: data.bewijs, evaluatie: data.evaluatie, actueel: true },
      });
    }
  }

  // ─── Readiness scores ─────────────────────────────────────────────

  const domeinScores = {
    'demo-01AB': { OP: 87, OR: 92, VE: 95, KA: 78, SKA: 90 },
    'demo-02CD': { OP: 52, OR: 38, VE: 68, KA: 31, SKA: 85 },
    'demo-03EF': { OP: 88, OR: 74, VE: 92, KA: 85, SKA: 88 },
  };
  const totalScores = { 'demo-01AB': 81, 'demo-02CD': 51, 'demo-03EF': 76 };

  for (const [schoolId, scores] of Object.entries(domeinScores)) {
    await prisma.readinessScore.create({
      data: { schoolId, totalScore: totalScores[schoolId as keyof typeof totalScores], domainScores: scores },
    });
  }

  // ─── PDCA items ─────────────────────────────────────────────────────
  // Verhaallijn: Regenboog heeft actieve cyclus. Kompas heeft verlopen items.

  console.log('Seeding PDCA items...');
  const drieWekenGeleden = new Date(Date.now() - 21 * 86400000);
  const twoWeeksGeleden = new Date(Date.now() - 14 * 86400000);
  const overTweeMaanden = new Date(Date.now() + 60 * 86400000);
  const overEenMaand = new Date(Date.now() + 30 * 86400000);
  const overDrieMaanden = new Date(Date.now() + 90 * 86400000);

  await prisma.pdcaItem.createMany({
    skipDuplicates: true,
    data: [
      // De Regenboog — actieve, lopende cyclus
      { schoolId: 'demo-01AB', schooljaar: '2025-2026', fase: 'PLAN', titel: 'Verbetering differentiatie groep 3-4', beschrijving: 'Op basis van LVS-analyse blijkt dat 30% van de leerlingen in groep 3-4 niet voldoende uitgedaagd wordt. We gaan een instructierooster differentiëren.', status: 'BEZIG', deadline: overTweeMaanden, bron: 'MANUAL' },
      { schoolId: 'demo-01AB', schooljaar: '2025-2026', fase: 'DO', titel: 'Implementatie Kanjertraining groep 7-8', beschrijving: 'Kanjertraining uitrollen naar bovenbouw na succesvol pilot in middenbouw.', status: 'BEZIG', deadline: overEenMaand, bron: 'MANUAL' },
      { schoolId: 'demo-01AB', schooljaar: '2025-2026', fase: 'DO', titel: 'Actualiseren zorgplan en handelingsplannen', beschrijving: 'Acht handelingsplannen zijn niet bijgewerkt na de laatste LVS-ronde. IB verantwoordelijk.', status: 'NIET_GESTART', deadline: overEenMaand, bron: 'MANUAL' },
      { schoolId: 'demo-01AB', schooljaar: '2025-2026', fase: 'CHECK', titel: 'Evaluatie rekenresultaten groep 6', beschrijving: 'CITO-M6 uitslag analyseren en koppelen aan inzet rekenmethode Getal & Ruimte.', status: 'AFGEROND', deadline: drieWekenGeleden, bron: 'MANUAL' },
      { schoolId: 'demo-01AB', schooljaar: '2025-2026', fase: 'ACT', titel: 'Borging afspraken oudergesprekken in protocol', beschrijving: 'Resultaten evaluatie oudergespreksprotocol vertalen naar structurele aanpassingen in gespreksvoering.', status: 'NIET_GESTART', deadline: overDrieMaanden, bron: 'MANUAL' },

      // Het Kompas — KRITIEK: verlopen items, weinig voortgang
      { schoolId: 'demo-02CD', schooljaar: '2025-2026', fase: 'PLAN', titel: 'Opstellen kwaliteitsagenda 2025-2026 (VERLOPEN)', beschrijving: 'Kwaliteitsagenda had eind september 2025 vastgesteld moeten zijn. Door personele wisselingen steeds uitgesteld.', status: 'NIET_GESTART', deadline: drieWekenGeleden, bron: 'MANUAL' },
      { schoolId: 'demo-02CD', schooljaar: '2025-2026', fase: 'PLAN', titel: 'Uitvoeren oudertevredenheidsonderzoek (VERLOPEN)', beschrijving: 'Jaarlijks oudertevredenheidsonderzoek gepland voor november 2025. Niet uitgevoerd wegens ziekteverzuim directeur.', status: 'NIET_GESTART', deadline: twoWeeksGeleden, bron: 'MANUAL' },
      { schoolId: 'demo-02CD', schooljaar: '2025-2026', fase: 'DO', titel: 'Verbeteren leerlingresultaten rekenen', beschrijving: 'CITO-scores rekenen liggen 8 punten onder het landelijk gemiddeld. Inzet rekenspecialist gepland.', status: 'BEZIG', deadline: overDrieMaanden, bron: 'MANUAL' },
      { schoolId: 'demo-02CD', schooljaar: '2025-2026', fase: 'CHECK', titel: 'Analyse oorzaken hoog verzuim', beschrijving: 'HR-analyse uitvoeren: welke teamleden zijn frequent ziek? Zijn er werkgerelateerde oorzaken?', status: 'NIET_GESTART', deadline: overEenMaand, bron: 'MANUAL' },

      // De Ontdekking — klein maar actief
      { schoolId: 'demo-03EF', schooljaar: '2025-2026', fase: 'PLAN', titel: 'Interventieplan lichte leerresultaten', beschrijving: 'CITO 2025 licht onder gemiddeld (533.1). Gerichte interventies in rekenen en technisch lezen plannen.', status: 'BEZIG', deadline: overTweeMaanden, bron: 'MANUAL' },
      { schoolId: 'demo-03EF', schooljaar: '2025-2026', fase: 'DO', titel: 'Inzet VVE voor peuters groep 1-2', beschrijving: 'VVE-subsidie benutten voor extra programma-uren kleuters. Samenwerking kinderdagverblijf De Kleine Ontdekker uitbreiden.', status: 'BEZIG', deadline: overDrieMaanden, bron: 'MANUAL' },
      { schoolId: 'demo-03EF', schooljaar: '2025-2026', fase: 'ACT', titel: 'Borging arbobeleid langdurig verzuim', beschrijving: 'Protocol voor begeleiding langdurig zieke medewerkers actualiseren na incident burn-out.', status: 'NIET_GESTART', deadline: overEenMaand, bron: 'MANUAL' },
    ],
  });

  // ─── Subsidie dossiers ─────────────────────────────────────────────

  console.log('Seeding subsidie dossiers...');

  const npoRegeling = await prisma.subsidieRegeling.findUnique({ where: { slug: 'npo-nationaal-programma-onderwijs' } });
  const zijInstroom = await prisma.subsidieRegeling.findUnique({ where: { slug: 'subsidie-zij-instroom' } });
  const vveRegeling = await prisma.subsidieRegeling.findUnique({ where: { slug: 'vve-vroeg-voorschoolse-educatie' } });

  if (npoRegeling) {
    // Het Kompas — NPO dossier met ONDERBESTEDING RISICO (38%)
    const npoDossier = await prisma.subsidieDossier.create({
      data: {
        tenantId: tenant.id,
        subsidieId: npoRegeling.id,
        naam: 'NPO 2025-2026 — Het Kompas',
        status: 'LOPEND',
        bedragAangevraagd: 245 * 580,     // 245 leerlingen × €580
        bedragToegekend: 245 * 540,        // toegekend: €540 per leerling = €132.300
        bedragBesteed: 245 * 540 * 0.38,   // slechts 38% besteed = €50.274
        aanvraagDatum: new Date('2025-10-01'),
        beschikkingDatum: new Date('2025-12-15'),
        projectStart: new Date('2026-01-01'),
        projectEinde: new Date('2026-12-31'),
        verantwoordingDeadline: new Date('2027-03-31'),
        beschikkingsnummer: 'NPO-2025-04821',
        schoolIds: ['demo-02CD'],
        notities: 'Besteding loopt achter door personeelswisselingen. Rekenspecialist kon pas in februari 2026 starten. Risico op terugvordering bij minder dan 70% besteding.',
        createdBy: adminUser.id,
      },
    });
    await prisma.subsidieSignaal.create({
      data: {
        tenantId: tenant.id,
        dossierId: npoDossier.id,
        type: 'ONDERBESTEDING',
        titel: 'NPO-besteding Het Kompas slechts 38% — risico op terugvordering',
        beschrijving: 'Van het toegekende NPO-budget (€132.300) is slechts €50.274 (38%) besteed. De projectperiode eindigt op 31 december 2026. Bij minder dan 70% besteding dreigt gedeeltelijke terugvordering door DUS-I.',
        urgentie: 'KRITIEK',
        gelezen: false,
      },
    });
  }

  if (zijInstroom) {
    // De Regenboog — Zij-instroom dossier (lopend, goed op schema)
    await prisma.subsidieDossier.create({
      data: {
        tenantId: tenant.id,
        subsidieId: zijInstroom.id,
        naam: 'Zij-instroom leerkracht De Regenboog 2026',
        status: 'LOPEND',
        bedragAangevraagd: 32000,
        bedragToegekend: 28500,
        bedragBesteed: 12800,
        aanvraagDatum: new Date('2026-01-15'),
        beschikkingDatum: new Date('2026-02-28'),
        projectStart: new Date('2026-02-01'),
        projectEinde: new Date('2027-01-31'),
        verantwoordingDeadline: new Date('2027-04-30'),
        beschikkingsnummer: 'ZI-2026-00147',
        schoolIds: ['demo-01AB'],
        notities: 'Ahmed Yilmaz gestart als zij-instromer (HBO-niveau, vorige functie: projectleider). Begeleider: Linda Smit (groep 4). Opleidingsinstituut: Hogeschool iPabo.',
        createdBy: adminUser.id,
      },
    });
  }

  if (vveRegeling) {
    // De Ontdekking — VVE dossier (lopend)
    await prisma.subsidieDossier.create({
      data: {
        tenantId: tenant.id,
        subsidieId: vveRegeling.id,
        naam: 'VVE 2025-2026 — De Ontdekking',
        status: 'LOPEND',
        bedragAangevraagd: null,
        bedragToegekend: 18600,
        bedragBesteed: 9300,
        aanvraagDatum: new Date('2025-09-15'),
        beschikkingDatum: new Date('2025-11-01'),
        projectStart: new Date('2026-01-01'),
        projectEinde: new Date('2026-07-31'),
        verantwoordingDeadline: new Date('2026-10-01'),
        beschikkingsnummer: 'VVE-AMS-2025-0312',
        schoolIds: ['demo-03EF'],
        notities: 'Programma Kaleidoscoop ingezet voor 18 VVE-peuters/kleuters. Samenwerking met KDV De Kleine Ontdekker. 50% besteed — op schema.',
        createdBy: adminUser.id,
      },
    });
  }

  // ─── Beleidsdocumenten ─────────────────────────────────────────────

  console.log('Seeding beleidsdocumenten...');
  await prisma.beleidsDocument.createMany({
    skipDuplicates: false,
    data: [
      {
        tenantId: tenant.id, titel: 'Sociaal Veiligheidsplan 2024-2026', domein: 'Veiligheid',
        status: 'ACTIEF', vastgesteldDatum: new Date('2024-06-01'),
        evaluatieDatum: new Date('2024-06-01'), volgendEvaluatieDatum: new Date('2026-06-01'),
        herinneringDagen: 60, voortgangNotes: 'Jaarlijkse check juni 2025 afgerond. Noodprocedures geactualiseerd.',
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id, titel: 'Arbobeleid en Verzuimprotocol', domein: 'HR',
        status: 'ACTIEF', vastgesteldDatum: new Date('2023-09-01'),
        evaluatieDatum: new Date('2024-09-01'), volgendEvaluatieDatum: new Date('2026-04-15'),
        herinneringDagen: 30, voortgangNotes: 'Gezien hoog verzuim bij Ontdekking en Kompas: herziening urgent. Arbodienst betrokken.',
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id, titel: 'ICT-beleid en Privacyreglement (AVG)', domein: 'ICT',
        status: 'VERLOPEN', vastgesteldDatum: new Date('2022-03-01'),
        evaluatieDatum: new Date('2024-03-01'), volgendEvaluatieDatum: new Date('2026-03-01'),
        herinneringDagen: 45, voortgangNotes: 'VERLOPEN: Evaluatiedatum is gepasseerd. AVG-update vereist voor nieuwe verwerkersovereenkomsten (Classroom, Teams).',
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id, titel: 'Taakbeleid en Normjaartaak 2025-2026', domein: 'HR',
        status: 'ACTIEF', vastgesteldDatum: new Date('2025-08-01'),
        evaluatieDatum: new Date('2025-08-01'), volgendEvaluatieDatum: new Date('2026-07-01'),
        herinneringDagen: 30, voortgangNotes: 'MR heeft ingestemd augustus 2025. Evaluatiemoment gepland voor einde schooljaar.',
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id, titel: 'Klachtenregeling en Vertrouwenspersoon', domein: 'Veiligheid',
        status: 'ACTIEF', vastgesteldDatum: new Date('2024-01-15'),
        evaluatieDatum: new Date('2025-01-15'), volgendEvaluatieDatum: new Date('2027-01-15'),
        herinneringDagen: 60, voortgangNotes: 'Vertrouwenspersoon extern: Zorgvrij Nederland. Contract verlengd tot 2027.',
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id, titel: 'Meerjarenbegroting 2024-2028', domein: 'Financiën',
        status: 'ACTIEF', vastgesteldDatum: new Date('2024-11-01'),
        evaluatieDatum: new Date('2024-11-01'), volgendEvaluatieDatum: new Date('2026-11-01'),
        herinneringDagen: 60, voortgangNotes: 'Q1-2026 realisatie binnen begroting. Aandachtspunt: hogere vervangingskosten door verzuim.',
        createdBy: adminUser.id,
      },
    ],
  });

  // ─── Acties ──────────────────────────────────────────────────────────

  console.log('Seeding acties...');
  await prisma.actie.createMany({
    skipDuplicates: false,
    data: [
      {
        tenantId: tenant.id, schoolId: 'demo-02CD',
        titel: 'Gesprek arbodienst voor langdurig zieken Het Kompas',
        beschrijving: 'Er zijn momenteel 4 medewerkers langer dan 6 weken ziek. Arbodienst inschakelen voor re-integratieadvies en plan van aanpak per medewerker opstellen. Daarna update aan MR.',
        prioriteit: 'KRITIEK', status: 'OPEN', bron: 'HR_SIGNAAL',
        deadline: new Date(Date.now() + 7 * 86400000),
        conceptEmail: `Beste [Contactpersoon Arbodienst],\n\nWij verzoeken u op korte termijn een afspraak te plannen inzake het langdurig verzuim bij onze school Het Kompas (BRIN: 02CD).\n\nSituatie: 4 medewerkers zijn langer dan 6 weken afwezig. Het totale verzuimpercentage bedraagt 9.8%, wat significant boven de norm ligt.\n\nWij verzoeken u:\n1. Een individueel adviesgesprek voor elk van de 4 langdurig zieken\n2. Een analyse van mogelijke werkgerelateerde oorzaken\n3. Een re-integratieplan per medewerker\n\nKunt u ons een voorstel voor een afspraak sturen?\n\nMet vriendelijke groet,\nThomas Meijer\nOperationeel Manager, Stichting Primair Amsterdam Centrum`,
        createdBy: adminUser.id, toegewezenAan: adminUser.id,
      },
      {
        tenantId: tenant.id, schoolId: 'demo-02CD',
        titel: 'Zij-instroom vacature leerkracht Het Kompas',
        beschrijving: 'Het Kompas heeft een open leerkrachtvacature (1.2 FTE). Zij-instroom subsidie beschikbaar (€20.000-€40.000). Werving starten via Onderwijscoöperatie en eigen netwerk.',
        prioriteit: 'HOOG', status: 'IN_BEHANDELING', bron: 'HR_SIGNAAL',
        deadline: new Date(Date.now() + 30 * 86400000),
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id, schoolId: 'demo-02CD',
        titel: 'NPO-bestedingsplan versnellen — risico terugvordering',
        beschrijving: 'NPO-besteding staat op 38% (norm: >50% halverwege projectjaar). Actieplan opstellen met directeur Marie Jansen: welke NPO-interventies kunnen versneld worden ingezet? Rekenspecialist uitbreiden naar 3 dagen/week.',
        prioriteit: 'KRITIEK', status: 'OPEN', bron: 'SUBSIDIE_SIGNAAL',
        deadline: new Date(Date.now() + 14 * 86400000),
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id, schoolId: 'demo-03EF',
        titel: 'Re-integratiegesprek langdurig zieke medewerker De Ontdekking',
        beschrijving: '1 medewerker al 14 weken ziek (burn-out). Re-integratieplan opstellen conform Wet Verbetering Poortwachter. Stap 1: probleemanalyse arbodienst (week 6 al voorbij, actie vereist).',
        prioriteit: 'KRITIEK', status: 'OPEN', bron: 'HR_SIGNAAL',
        deadline: new Date(Date.now() + 5 * 86400000),
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id,
        titel: 'AVG/ICT-beleid herzien — verlopen document',
        beschrijving: 'Het ICT-beleid en Privacyreglement (AVG) is verlopen (evaluatiedatum gepasseerd). Nieuwe verwerkersovereenkomsten voor Google Classroom en Teams nodig. Juridisch adviseur inschakelen.',
        prioriteit: 'MIDDEL', status: 'OPEN', bron: 'COMPLIANCE',
        deadline: new Date(Date.now() + 45 * 86400000),
        createdBy: adminUser.id,
      },
    ],
  });

  // ─── Documenten (DocumentHub) ─────────────────────────────────────────
  // Base64-encoded tekst; mimeType text/plain zodat download altijd werkt.

  console.log('Seeding documenten...');

  function toB64(text: string) {
    return Buffer.from(text, 'utf8').toString('base64');
  }

  const docs = [
    // ── De Regenboog ──────────────────────────────────────────────────────
    {
      schoolId: 'demo-01AB', type: 'SCHOOLPLAN', status: 'ACTUEEL',
      titel: 'Schoolplan De Regenboog 2023-2027',
      beschrijving: 'Meerjarig schoolplan met strategische doelen voor 2023-2027.',
      mimeType: 'text/plain',
      vervaltDatum: new Date('2027-07-31'),
      fileData: toB64(`SCHOOLPLAN DE REGENBOOG 2023-2027
Stichting Primair Amsterdam Centrum | BRIN: 01AB

VISIE
Wij geloven dat elk kind uniek is en het recht heeft op onderwijs dat aansluit bij zijn of haar mogelijkheden. De Regenboog streeft naar een lerende gemeenschap waarin kinderen, ouders en medewerkers samen groeien.

MISSIE
Wij bieden kwalitatief hoogstaand onderwijs in een veilige en stimulerende omgeving, waarbij we elk kind optimaal voorbereiden op verdere schoolloopbaan en maatschappelijke participatie.

STRATEGISCHE DOELEN 2023-2027
1. KWALITEIT VAN ONDERWIJS
   - Verhoging CITO-eindscores naar minimaal 537 (huidig: 536.4)
   - Volledige implementatie van adaptief onderwijs in alle groepen
   - Professionalisering leerkrachten: elk teamlid volgt jaarlijks 2 trainingen

2. PERSONEEL EN ORGANISATIE
   - Terugdringing verzuim naar maximaal 4.5% (huidig: 5.2%)
   - Zij-instromer begeleidingsprogramma voor 1-2 kandidaten per schooljaar
   - Teambuilding: 2 teamdagen per jaar

3. VEILIGHEID EN WELZIJN
   - Handhaving anti-pestprotocol: nulmeting pesten jaarlijks
   - Tevredenheidsscore ouders minimaal 8.0 (huidig: 8.1 ✓)
   - Medewerkerswelzijn: score minimaal 7.5 (huidig: 7.6 ✓)

4. FINANCIËN
   - Sluitende meerjarenbegroting
   - Maximale benutting beschikbare subsidies (NPO, Zij-instroom, Werkdruk)
   - Reservevorming voor noodzakelijk groot onderhoud

KWALITEITSZORG
De school hanteert een jaarlijkse PDCA-cyclus met de volgende momenten:
- September: Opstellen jaarplan op basis van schoolplan
- Februari: Mid-year evaluatie met teamoverleg
- Juni: Evaluatie schooljaar, aanpassing jaarplan
- Juli: Bestuursrapportage

VASTGESTELD: Bestuur Stichting Primair Amsterdam Centrum, september 2023
MR INSTEMMING: 14 september 2023`),
    },
    {
      schoolId: 'demo-01AB', type: 'JAARPLAN', status: 'ACTUEEL',
      titel: 'Jaarplan De Regenboog 2025-2026',
      beschrijving: 'Operationeel jaarplan schooljaar 2025-2026, vastgesteld door directie en MR.',
      mimeType: 'text/plain',
      vervaltDatum: new Date('2026-07-31'),
      fileData: toB64(`JAARPLAN 2025-2026 — DE REGENBOOG

PRIORITEITEN DIT SCHOOLJAAR

PRIORITEIT 1: DIFFERENTIATIE IN DE KLAS
Actie: Implementatie instructierooster voor niveaugroepen groep 3-6
Verantwoordelijke: Teamleider middenbouw (Sandra de Wit)
Indicator: 100% van groepen 3-6 werkt met gedifferentieerd instructierooster per 1 februari 2026
Status (jan 2026): IN UITVOERING — 4 van 6 groepen geïmplementeerd

PRIORITEIT 2: BEGRIJPEND LEZEN VERSTERKEN
Actie: Implementatie methode 'Nieuwsbegrip' in groep 5-8 + wekelijkse leesdoelen
Verantwoordelijke: IB (Roos Vermeer)
Indicator: Verhoging CITO begrijpend lezen met gemiddeld 5 punten
Status (jan 2026): OPGESTART — nulmeting december 2025 afgerond

PRIORITEIT 3: HANDELINGSPLANNEN ACTUALISEREN
Actie: IB herziet alle handelingsplannen na LVS-ronde januari 2026
Verantwoordelijke: IB (Roos Vermeer)
Deadline: 1 maart 2026
Status (jan 2026): GEPLAND — LVS-ronde loopt

PRIORITEIT 4: OUDERPARTICIPATIE
Actie: Herinvoering thematische ouderavonden (2x per jaar)
Verantwoordelijke: Directie
Datum: Oktober 2025 ✓, Maart 2026 gepland

FORMATIE 2025-2026
Totaal begroting: 13.0 FTE | Ingevuld: 12.2 FTE | Vacature: 0.8 FTE leerkracht gr. 7
Zij-instromer: Ahmed Yilmaz (gr. 7, begeleid door Linda Smit) — gestart 1 februari 2026

BEGROTING HIGHLIGHTS
NPO-middelen: n.v.t. (school heeft geen leervertragingsopgave)
Werkdrukmiddelen: €28.160 ingezet voor 0.4 FTE OOP extra
Zij-instroomsubsidie: €28.500 toegekend, projectperiode t/m jan 2027`),
    },
    {
      schoolId: 'demo-01AB', type: 'VEILIGHEIDSBELEID', status: 'ACTUEEL',
      titel: 'Sociaal Veiligheidsplan De Regenboog 2024-2026',
      beschrijving: 'Anti-pestprotocol, meldcode, veiligheidsreglement en crisisprotocol.',
      mimeType: 'text/plain',
      vervaltDatum: new Date('2026-06-01'),
      fileData: toB64(`SOCIAAL VEILIGHEIDSPLAN DE REGENBOOG 2024-2026

1. UITGANGSPUNTEN
De Regenboog staat voor een veilige school voor alle kinderen, medewerkers en ouders.
We hanteren de 4-G methode: Gedrag, Gevoel, Gevolg, Gewenst gedrag.

2. ANTI-PESTPROTOCOL
Definitie: Pesten is herhaaldelijk negatief gedrag gericht op dezelfde persoon.
Aanpak: Kanjertraining (alle groepen), ABC-aanpak bij incidenten, betrekken ouders.
Vertrouwenspersoon leerlingen: Juf Sandra (gr. 4)
Coördinator sociale veiligheid: Directeur Jan de Vries

3. MELDCODE HUISELIJK GEWELD EN KINDERMISHANDELING
Stappen: Signaleren → Overleggen (IBP) → Afwegen → Beslissen → Handelen
Contactpersoon: IB Roos Vermeer

4. VEILIGHEIDSREGLEMENT
- BHV-certificaten: 8 medewerkers gecertificeerd (verplicht: 6) ✓
- Ontruimingsoefening: 12 februari 2026 uitgevoerd ✓
- EHBO-certificaten: 3 medewerkers ✓
- Brandmeldinstallatie gekeurd: januari 2026 ✓

5. NOODPROCEDURES
- Brand: Ontruimingsplan beschikbaar bij receptie en in elke klas
- Medisch incident: AED aanwezig, 4 BHV'ers opgeleid
- Lockdown: Protocol aanwezig, geoefend september 2025

VASTGESTELD: Juni 2024 | Evaluatie: Juni 2026`),
    },

    // ── Het Kompas ────────────────────────────────────────────────────────
    {
      schoolId: 'demo-02CD', type: 'RESULTATENANALYSE', status: 'ACTUEEL',
      titel: 'Resultatenanalyse Het Kompas 2024-2025',
      beschrijving: 'Analyse van leerlingresultaten CITO 2025. Toont significante achterstanden in rekenen en begrijpend lezen.',
      mimeType: 'text/plain',
      vervaltDatum: null,
      fileData: toB64(`RESULTATENANALYSE HET KOMPAS 2024-2025

SAMENVATTING
De resultaten van Het Kompas over schooljaar 2024-2025 geven reden tot zorg.
Het gemiddelde eindniveau (CITO) ligt 5.4 punten onder het landelijk gemiddelde.
Dit is een verslechtering ten opzichte van 2023-2024 (-2.1 punten).

CITO RESULTATEN GROEP 8 (2025)
Gemiddelde vaardigheidsscore: 529.8 (landelijk: 535.2)
Afstand tot norm: -5.4 punten
Trend: Dalend (-2.1 punt vs. vorig jaar)

Uitsplitsing per vakgebied:
- Rekenen/Wiskunde: 527.1 (landelijk 534.8) → ONVOLDOENDE
- Lezen: 531.4 (landelijk 536.1) → ONVOLDOENDE
- Taalverzorging: 530.8 (landelijk 534.9) → ONVOLDOENDE
- Begrijpend lezen: 530.2 (landelijk 535.5) → ONVOLDOENDE

ANALYSE OORZAKEN
1. PERSONELE INSTABILITEIT
   - 19 niet-vervulde vervangingsdagen (leerkracht gr. 5 langdurig ziek)
   - Groep 5 heeft 4 verschillende invallers gehad in Q2
   - Weinig continuïteit in begeleiding zwakke leerlingen

2. GEEN ACTUELE HANDELINGSPLANNEN
   - 8 leerlingen met extra ondersteuningsbehoefte zonder actueel plan
   - IB was 6 weken afwezig (ziekte) → achterstand in zorgcoördinatie

3. LEERACHTERSTAND NA INSTROOM
   - 12% van leerlingen heeft achterstand bij instroom (hoog OAB-percentage)
   - Onvoldoende inzet NPO-interventies (besteding 38% in plaats van >50%)

AANBEVELINGEN
1. Versnelling NPO-besteding: rekenspecialist uitbreiden naar 3 dagen/week
2. Aanstelling vaste intern begeleider (vacature openstaat)
3. Implementatie leesbevorderingsprogramma voor zwakste 20%
4. Herziening groeperingsplan voor maximale instructietijd

OPGESTELD DOOR: Marie Jansen (directeur) | September 2025`),
    },
    {
      schoolId: 'demo-02CD', type: 'VEILIGHEIDSBELEID', status: 'VERLOPEN',
      titel: 'Veiligheidsbeleid Het Kompas 2022-2024',
      beschrijving: 'VERLOPEN document — moet worden herzien. Ontbreekt als bewijs voor VE1.',
      mimeType: 'text/plain',
      vervaltDatum: new Date('2024-06-01'),
      fileData: toB64(`VEILIGHEIDSBELEID HET KOMPAS 2022-2024
[VERLOPEN — Dit document is niet meer actueel]

ANTI-PESTPROTOCOL (versie 2022)
De school hanteert een zero-tolerance beleid tegen pesten.

NOODPROCEDURES
- Ontruimingsplan: aanwezig
- BHV'ers: 5 gecertificeerd

[ACTIE VEREIST: Dit beleid loopt af per 1 juni 2024 en is niet verlengd.
Een geactualiseerd veiligheidsbeleid ontbreekt. Dit wordt gesignaleerd als
een risico in de inspectiestandaard VE1.]`),
    },
    {
      schoolId: 'demo-02CD', type: 'JAARPLAN', status: 'CONCEPT',
      titel: 'Jaarplan Het Kompas 2025-2026 (concept)',
      beschrijving: 'Concept-jaarplan — nog niet vastgesteld door MR. Kwaliteitsagenda ontbreekt nog.',
      mimeType: 'text/plain',
      vervaltDatum: null,
      fileData: toB64(`JAARPLAN HET KOMPAS 2025-2026 — CONCEPT
[STATUS: CONCEPT — In afwachting van MR-instemming]

PRIORITEITEN (voorstel directie)

1. RESULTATENVERBETERING REKENEN
Probleem: CITO rekenen 7.7 punt onder landelijk gemiddeld
Actie: Inzet rekenspecialist (NPO-gefinancierd), extra instructietijd gr. 5-7
Verantwoordelijke: Marie Jansen + IB (vacature)
Deadline: Resultaatmeting CITO jan 2026

2. INVULLEN VACATURES
Openstaand: 1.2 FTE leerkracht, 0.5 FTE intern begeleider
Actie: Werving zij-instromer, netwerken via Onderwijscoöperatie
Verantwoordelijke: Marie Jansen + Bestuur
Deadline: 1 mei 2026

3. VERZUIMAANPAK
Probleem: 9.8% verzuim, 4 langdurig zieken
Actie: Gesprekscyclus starten, arbodienst inschakelen, werkdrukanalyse
Verantwoordelijke: Marie Jansen + Thomas Meijer (ops)
Deadline: Evaluatie per Q2 2026

OPMERKING: Kwaliteitsagenda 2025-2026 is nog niet formeel vastgesteld.
Dit moet worden opgelost vóór eventueel inspectiebezoek.`),
    },

    // ── De Ontdekking ─────────────────────────────────────────────────────
    {
      schoolId: 'demo-03EF', type: 'PEDAGOGISCH_BELEIDSPLAN', status: 'ACTUEEL',
      titel: 'Pedagogisch Beleidsplan De Ontdekking 2024-2026',
      beschrijving: 'Pedagogische visie, aanpak positief schoolklimaat en sociaal-emotionele ontwikkeling.',
      mimeType: 'text/plain',
      vervaltDatum: new Date('2026-08-31'),
      fileData: toB64(`PEDAGOGISCH BELEIDSPLAN DE ONTDEKKING 2024-2026

1. PEDAGOGISCHE VISIE
De Ontdekking gelooft in het kind als ontdekker van de eigen wereld. Wij creëren een omgeving
waarin nieuwsgierigheid, samenwerking en eigenaarschap centraal staan.

Kernwaarden: Veiligheid — Vertrouwen — Groei — Verbinding

2. POSITIEF SCHOOLKLIMAAT
Aanpak: Taakspel (alle groepen 1-8) + maandelijkse schoolklimaatmeting
Schoolklimaatcijfer 2025: 7.9/10 (doel: ≥7.5 ✓)

Aanpak sociaal-emotioneel leren:
- Groep 1-4: Taakspel + kringgesprekken
- Groep 5-8: Goed in je vel (SEL-programma) + mentorgesprekken

3. PEDAGOGISCH HANDELEN
Verwachtingen aan medewerkers:
- Positieve benadering: 5x meer positieve feedback dan correctie
- Duidelijke klassenafspraken, zichtbaar in klas
- Actieve ouderbetrokkenheid via Ouder-App

4. ZORGSTRUCTUUR
IB: Renske Hoek (0.6 FTE)
Zorgplan: Geactualiseerd september 2024 ✓
Handelingsplannen: 9 actieve plannen (bijgewerkt na LVS-ronde jan 2026) ✓
Externe partners: Samenwerkingsverband, GGZ-preventie, buurtmaatschappelijk werk

5. OMGANG MET DIVERSITEIT
27% van leerlingen heeft thuistaal anders dan Nederlands
VVE-programma (Kaleidoscoop): 18 peuters/kleuters deelnemen
OAB-inzet: taalondersteuning 4x/week voor zwakste taalgroep

VASTGESTELD: September 2024 | Evaluatie: Juni 2026`),
    },
    {
      schoolId: 'demo-03EF', type: 'IB_JAARVERSLAG', status: 'ACTUEEL',
      titel: 'IB Jaarverslag De Ontdekking 2024-2025',
      beschrijving: 'Jaarverslag intern begeleiding: leerlingzorg, ondersteuningsbehoeften en resultaten.',
      mimeType: 'text/plain',
      vervaltDatum: null,
      fileData: toB64(`IB JAARVERSLAG DE ONTDEKKING 2024-2025
Opgesteld door: Renske Hoek (Intern Begeleider)

LEERLINGPOPULATIE
Totaal leerlingen: 180
Leerlingen met extra ondersteuningsbehoefte: 24 (13.3%)
- Eigen middelen school: 18 leerlingen
- Extra ondersteuning SWV: 6 leerlingen (TLV's)
- Dyslexieverklaring: 7 leerlingen

PRESTATIES ZORGSTRUCTUUR
Handelingsplannen: 9 opgesteld en geëvalueerd ✓
OPP's (Ontwikkelingsperspectief): 6 actueel bijgehouden ✓
Groepsplannen: Alle groepen 1-8 actueel ✓

ZORGSIGNALEN SCHOOLJAAR
Significant: 1 medewerker langdurig ziek (burn-out, aug 2025–heden)
Impact: IB heeft extra taken overgenomen → werkdruk verhoogd
Maatregel: Prioritering zorgcoördinatie, tijdelijk minder directe begeleiding

UITSTROOM ADVIES GROEP 8
VWO/Gymnasium: 2 (11%)
HAVO: 4 (22%)
VMBO-TL: 7 (39%)
VMBO-KB/BB: 5 (28%)
Vergelijking vorig jaar: vergelijkbaar (+1% TL, -1% BB)

AANDACHTSPUNTEN KOMEND JAAR
1. Verzuim IB oplossen: vervanging nodig bij uitval (protocol ontbreekt)
2. Interventieplan rekenen uitvoeren (zie PDCA-item)
3. VVE-evaluatie (resultaten Kaleidoscoop na 1 jaar)

CONCLUSIE
De zorgstructuur is stevig. De impact van het hoge personeelsverzuim op de IB-functie
is het grootste risico voor de komende periode.`),
    },
  ];

  for (const doc of docs) {
    await prisma.document.create({
      data: {
        tenantId: tenant.id,
        schoolId: doc.schoolId,
        titel: doc.titel,
        beschrijving: doc.beschrijving,
        type: doc.type as never,
        status: doc.status as never,
        mimeType: doc.mimeType,
        fileData: doc.fileData,
        vervaltDatum: doc.vervaltDatum,
        uploadedBy: adminUser.id,
        s3Key: '',
        versie: 1,
      },
    });
  }
  console.log(`  ${docs.length} documenten aangemaakt`);

  // ─── PdcaSuggestions (voor Morning Brief aggregator) ──────────────────
  // Dit simuleert AI-suggesties die normaal uit documentanalyse komen.

  console.log('Seeding PDCA suggesties...');
  await prisma.pdcaSuggestion.createMany({
    skipDuplicates: true,
    data: [
      {
        schoolId: 'demo-02CD', schooljaar: '2025-2026', fase: 'PLAN',
        titel: 'Stel een actueel zorgplan op (OP4 ontbreekt als bewijs)',
        beschrijving: 'De resultatenanalyse 2024-2025 toont dat 8 leerlingen met extra ondersteuningsbehoefte geen actueel handelingsplan hebben. Zonder dit plan voldoet de school niet aan inspectiestandaard OP4.',
        bronSectie: 'Resultatenanalyse 2024-2025 — Analyse oorzaken',
        vertrouwen: 0.91, status: 'pending',
      },
      {
        schoolId: 'demo-02CD', schooljaar: '2025-2026', fase: 'PLAN',
        titel: 'Voer een oudertevredenheidsonderzoek uit (VE2 ontbreekt)',
        beschrijving: 'Het jaarlijkse oudertevredenheidsonderzoek is in 2025 niet uitgevoerd. Dit is vereist als bewijs voor VE2. Inplannen voor april 2026 is nog mogelijk.',
        bronSectie: 'Jaarplan Het Kompas 2025-2026 — Concept',
        vertrouwen: 0.85, status: 'pending',
      },
      {
        schoolId: 'demo-02CD', schooljaar: '2025-2026', fase: 'DO',
        titel: 'Analyseer oorzaken dalende CITO-scores rekenen',
        beschrijving: 'CITO rekenen daalt nu 3 jaar op rij. De resultatenanalyse noemt personele instabiliteit als oorzaak, maar vraagt om een diepere didactische analyse. Rekenspecialist inzetten voor een grondige analyse per klas.',
        bronSectie: 'Resultatenanalyse 2024-2025 — CITO Resultaten',
        vertrouwen: 0.88, status: 'pending',
      },
      {
        schoolId: 'demo-03EF', schooljaar: '2025-2026', fase: 'ACT',
        titel: 'Maak een vervangingsprotocol voor de IB-functie',
        beschrijving: 'Het IB jaarverslag signaleert dat er geen protocol is voor vervanging bij uitval van de IB\'er. Gegeven het hoge verzuim in het team is dit een urgent risico voor de zorgstructuur.',
        bronSectie: 'IB Jaarverslag 2024-2025 — Aandachtspunten',
        vertrouwen: 0.82, status: 'pending',
      },
    ],
  });

  console.log('\n✅ Seed voltooid!');
  console.log('\n📧 Login accounts:');
  console.log('  admin@demo.nl     / admin123  (Bestuur Admin — Sophie van den Berg)');
  console.log('  directeur@demo.nl / admin123  (Directeur De Regenboog — Jan de Vries)');
  console.log('  directeur2@demo.nl / admin123 (Directeur Het Kompas — Marie Jansen)');
  console.log('  ops@demo.nl       / admin123  (Operationeel Manager — Thomas Meijer)');
  console.log('\n📊 Demo scenario:');
  console.log('  🟢 De Regenboog — Stabiel (score 81), 1 kleine vacature, actieve PDCA-cyclus');
  console.log('  🔴 Het Kompas  — RISICO (score 51): 9.8% verzuim, 2 vacatures, NPO onderbesteding 38%, 4 ontbrekende inspectiestandaarden');
  console.log('  🟡 De Ontdekking — Aandacht nodig (score 76): 11.2% verzuim (burn-out), goede inspectie');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
