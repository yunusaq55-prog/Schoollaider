import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

async function main() {
  console.log('Seeding inspectiekader...');

  for (const domein of DOMEINEN) {
    const createdDomein = await prisma.inspectieDomein.upsert({
      where: { code: domein.code },
      update: { naam: domein.naam, beschrijving: domein.beschrijving, versie: domein.versie },
      create: { code: domein.code, naam: domein.naam, beschrijving: domein.beschrijving, versie: domein.versie },
    });

    for (const standaard of domein.standaarden) {
      await prisma.inspectieStandaard.upsert({
        where: { code: standaard.code },
        update: { naam: standaard.naam, beschrijving: standaard.beschrijving, gewicht: standaard.gewicht, domeinId: createdDomein.id },
        create: { code: standaard.code, naam: standaard.naam, beschrijving: standaard.beschrijving, gewicht: standaard.gewicht, domeinId: createdDomein.id },
      });
    }

    console.log(`  Domein ${domein.code}: ${domein.standaarden.length} standaarden`);
  }

  // Demo data
  console.log('Seeding demo data...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-bestuur' },
    update: {},
    create: { naam: 'Demo Bestuur', slug: 'demo-bestuur' },
  });

  const schools = [
    { naam: 'De Regenboog', brinCode: '01AB', adres: 'Schoolstraat 1, Amsterdam', directeur: 'Jan de Vries', leerlingaantal: 320 },
    { naam: 'Het Kompas', brinCode: '02CD', adres: 'Kompasweg 5, Amsterdam', directeur: 'Marie Jansen', leerlingaantal: 245 },
    { naam: 'De Ontdekking', brinCode: '03EF', adres: 'Ontdekkingslaan 12, Amsterdam', directeur: 'Pieter Bakker', leerlingaantal: 180 },
  ];

  for (const schoolData of schools) {
    await prisma.school.upsert({
      where: { id: `demo-${schoolData.brinCode}` },
      update: { ...schoolData },
      create: { id: `demo-${schoolData.brinCode}`, tenantId: tenant.id, ...schoolData },
    });
  }

  // Create admin user (password: admin123)
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@demo.nl' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.nl',
      passwordHash,
      naam: 'Demo Admin',
      role: 'BESTUUR_ADMIN',
    },
  });

  // Create school director for first school
  await prisma.user.upsert({
    where: { email: 'directeur@demo.nl' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'directeur@demo.nl',
      passwordHash,
      naam: 'Jan de Vries',
      role: 'SCHOOL_DIRECTEUR',
      schoolId: 'demo-01AB',
    },
  });

  // ─── Subsidie regelingen ────────────────────────────────────
  console.log('Seeding subsidie regelingen...');

  const subsidieRegelingen = [
    {
      slug: 'npo-nationaal-programma-onderwijs',
      naam: 'NPO (Nationaal Programma Onderwijs)',
      financier: 'DUS-I',
      financierUrl: 'https://www.dus-i.nl/subsidies/npo',
      beschrijving:
        'Het Nationaal Programma Onderwijs biedt scholen middelen om leervertragingen als gevolg van de coronapandemie te herstellen. De subsidie is bedoeld voor gerichte interventies op het gebied van cognitieve en sociaal-emotionele ontwikkeling van leerlingen in het primair onderwijs.',
      doelgroep: 'PO-scholen met aantoonbare leervertraging',
      minBedrag: 200,
      maxBedrag: 800,
      bedragPerEenheid: 'per leerling',
      aanvraagPeriodeOpen: new Date('2026-01-15'),
      aanvraagPeriodeSluiting: new Date('2026-04-30'),
      projectPeriodeStart: new Date('2026-08-01'),
      projectPeriodeEinde: new Date('2027-07-31'),
      verantwoordingDeadline: 'Uiterlijk 1 oktober 2027',
      verantwoordingEisen:
        'Financieel verslag, inhoudelijk verslag met meetbare resultaten, leerlingvolgsysteem-data ter onderbouwing van interventie-effecten.',
      vereisten: 'Schoolscan uitgevoerd, interventies geselecteerd uit NPO-menukaart, instemming MR.',
      tags: ['leervertraging', 'corona-herstel', 'interventies', 'basisvaardigheden'],
      actief: true,
    },
    {
      slug: 'impuls-basisvaardigheden',
      naam: 'Impuls Basisvaardigheden',
      financier: 'DUS-I',
      financierUrl: 'https://www.dus-i.nl/subsidies/impuls-basisvaardigheden',
      beschrijving:
        'Subsidie gericht op het structureel verbeteren van basisvaardigheden (taal, rekenen en burgerschap) in het primair onderwijs. Scholen kunnen een meerjarig verbeterplan indienen voor professionalisering, curriculumontwikkeling en extra begeleiding.',
      doelgroep: 'PO-scholen en besturen',
      minBedrag: 50000,
      maxBedrag: 200000,
      bedragPerEenheid: 'per aanvraag',
      aanvraagPeriodeOpen: new Date('2026-02-01'),
      aanvraagPeriodeSluiting: new Date('2026-05-15'),
      projectPeriodeStart: new Date('2026-08-01'),
      projectPeriodeEinde: new Date('2028-07-31'),
      verantwoordingDeadline: 'Uiterlijk 1 december 2028',
      verantwoordingEisen:
        'Jaarlijkse voortgangsrapportage, eindverslag met onderbouwing van resultaten op leerlingniveau, financieel verslag met accountantsverklaring bij bedragen boven €125.000.',
      vereisten: 'Analyse van huidige stand basisvaardigheden, verbeterplan met SMART-doelen, commitment van schoolteam.',
      tags: ['basisvaardigheden', 'taal', 'rekenen', 'burgerschap', 'meerjarig'],
      actief: true,
    },
    {
      slug: 'subsidie-zij-instroom',
      naam: 'Subsidie Zij-instroom',
      financier: 'DUS-I',
      financierUrl: 'https://www.dus-i.nl/subsidies/zij-instroom',
      beschrijving:
        'Subsidie voor het begeleiden van zij-instromers naar een bevoegdheid als leraar in het primair onderwijs. De subsidie dekt kosten voor het geschiktheidsonderzoek, het scholingstraject en de begeleiding op de werkplek.',
      doelgroep: 'PO-besturen die zij-instromers aannemen',
      minBedrag: 20000,
      maxBedrag: 40000,
      bedragPerEenheid: 'per FTE zij-instromer',
      aanvraagPeriodeOpen: new Date('2026-01-01'),
      aanvraagPeriodeSluiting: new Date('2026-09-30'),
      projectPeriodeStart: new Date('2026-01-01'),
      projectPeriodeEinde: new Date('2028-12-31'),
      verantwoordingDeadline: 'Binnen 3 maanden na afronding traject',
      verantwoordingEisen:
        'Bewijs van geschiktheidsonderzoek, voortgangsverslagen van het scholingstraject, verklaring van de opleider, financieel overzicht van gemaakte kosten.',
      vereisten: 'Positief geschiktheidsonderzoek van de zij-instromer, samenwerkingsovereenkomst met erkende opleider.',
      tags: ['zij-instroom', 'lerarentekort', 'personeel', 'opleiding'],
      actief: true,
    },
    {
      slug: 'cultuureducatie-met-kwaliteit',
      naam: 'Cultuureducatie met Kwaliteit',
      financier: 'DUS-I',
      financierUrl: 'https://www.dus-i.nl/subsidies/cultuureducatie-met-kwaliteit',
      beschrijving:
        'Stimuleringsregeling voor structurele verankering van cultuureducatie in het primair onderwijs. Scholen kunnen samenwerken met culturele instellingen om een doorlopende leerlijn kunst en cultuur te ontwikkelen.',
      doelgroep: 'PO-scholen in samenwerking met culturele instellingen',
      minBedrag: 15000,
      maxBedrag: 60000,
      bedragPerEenheid: 'per aanvraag',
      aanvraagPeriodeOpen: new Date('2026-03-01'),
      aanvraagPeriodeSluiting: new Date('2026-06-01'),
      projectPeriodeStart: new Date('2026-09-01'),
      projectPeriodeEinde: new Date('2028-08-31'),
      verantwoordingDeadline: 'Uiterlijk 1 november 2028',
      verantwoordingEisen:
        'Inhoudelijk verslag met beschrijving van de doorlopende leerlijn, evaluatie van leerlingactiviteiten, financieel verslag.',
      vereisten: 'Samenwerkingsovereenkomst met minimaal één culturele instelling, vastgesteld cultuurbeleidsplan.',
      tags: ['cultuureducatie', 'kunst', 'doorlopende-leerlijn', 'samenwerking'],
      actief: true,
    },
    {
      slug: 'werkdrukmiddelen-po',
      naam: 'Werkdrukmiddelen PO',
      financier: 'Rijksoverheid',
      financierUrl: 'https://www.rijksoverheid.nl/onderwerpen/werken-in-het-onderwijs/werkdruk-in-het-po',
      beschrijving:
        'Structurele middelen voor het verlagen van de werkdruk in het primair onderwijs. Het team beslist samen met de MR hoe de middelen worden ingezet, bijvoorbeeld voor extra personeel, onderwijsassistenten of administratieve ondersteuning.',
      doelgroep: 'Alle PO-scholen',
      minBedrag: null,
      maxBedrag: null,
      bedragPerEenheid: 'per leerling (structureel via lumpsum)',
      aanvraagPeriodeOpen: null,
      aanvraagPeriodeSluiting: null,
      projectPeriodeStart: new Date('2026-01-01'),
      projectPeriodeEinde: new Date('2026-12-31'),
      verantwoordingDeadline: 'Jaarlijks via jaarverslag bestuur',
      verantwoordingEisen:
        'Verantwoording in het bestuursverslag over de inzet van werkdrukmiddelen, instemming van de MR op het bestedingsplan.',
      vereisten: 'Bestedingsplan opgesteld in overleg met het team, instemming MR vereist.',
      tags: ['werkdruk', 'structureel', 'personeel', 'lumpsum'],
      actief: true,
    },
    {
      slug: 'onderwijsachterstandenbeleid-oab',
      naam: 'Onderwijsachterstandenbeleid (OAB)',
      financier: 'Gemeente',
      financierUrl: null,
      beschrijving:
        'Gemeentelijke middelen voor het bestrijden van onderwijsachterstanden. De hoogte wordt bepaald op basis van de CBS-indicator voor het risico op onderwijsachterstanden per school. Inzet is gericht op extra taalondersteuning, ouderbetrokkenheid en vroegschoolse programma\'s.',
      doelgroep: 'PO-scholen met hoge achterstandsscores',
      minBedrag: null,
      maxBedrag: null,
      bedragPerEenheid: 'variabel, afhankelijk van CBS-indicator',
      aanvraagPeriodeOpen: new Date('2026-01-01'),
      aanvraagPeriodeSluiting: new Date('2026-03-31'),
      projectPeriodeStart: new Date('2026-01-01'),
      projectPeriodeEinde: new Date('2026-12-31'),
      verantwoordingDeadline: 'Uiterlijk 1 juli 2027',
      verantwoordingEisen:
        'Inhoudelijk en financieel verslag aan gemeente, aantoonbare inzet conform gemeentelijk beleidskader onderwijsachterstanden.',
      vereisten: 'School valt binnen doelgroepdefinitie van de gemeente op basis van CBS-achterstandsscores.',
      tags: ['achterstandenbeleid', 'taal', 'ouderbetrokkenheid', 'gemeente'],
      actief: true,
    },
    {
      slug: 'vve-vroeg-voorschoolse-educatie',
      naam: 'VVE (Vroeg- en voorschoolse educatie)',
      financier: 'Gemeente',
      financierUrl: null,
      beschrijving:
        'Gemeentelijke subsidie voor vroeg- en voorschoolse educatie, gericht op het voorkomen van taalachterstanden bij peuters en kleuters. Scholen kunnen VVE-programma\'s aanbieden in samenwerking met kinderopvangorganisaties.',
      doelgroep: 'PO-scholen met vroegschoolse groepen en samenwerkende kinderopvang',
      minBedrag: null,
      maxBedrag: null,
      bedragPerEenheid: 'per VVE-peuter/kleuter',
      aanvraagPeriodeOpen: new Date('2026-02-01'),
      aanvraagPeriodeSluiting: new Date('2026-04-15'),
      projectPeriodeStart: new Date('2026-08-01'),
      projectPeriodeEinde: new Date('2027-07-31'),
      verantwoordingDeadline: 'Uiterlijk 1 oktober 2027',
      verantwoordingEisen:
        'Registratie van deelnemende kinderen, voortgangsrapportage per kind, financieel verslag van bestede middelen, evaluatie van VVE-programma.',
      vereisten: 'Erkend VVE-programma (bijv. Kaleidoscoop, Piramide), gecertificeerde VVE-medewerkers, samenwerking met kinderopvang.',
      tags: ['vve', 'peuters', 'kleuters', 'taalstimulering', 'gemeente'],
      actief: true,
    },
    {
      slug: 'esf-plus',
      naam: 'ESF+ (Europees Sociaal Fonds Plus)',
      financier: 'EU',
      financierUrl: 'https://www.uitvoeringvanbeleidszw.nl/subsidies-en-regelingen/esf',
      beschrijving:
        'Europese subsidie gericht op sociale inclusie en arbeidsmarktparticipatie. Voor het primair onderwijs zijn er mogelijkheden op het gebied van inclusief onderwijs, professionalisering van leraren en innovatieve onderwijsprojecten die bijdragen aan gelijke kansen.',
      doelgroep: 'PO-besturen met innovatieve inclusieprojecten',
      minBedrag: 25000,
      maxBedrag: 100000,
      bedragPerEenheid: 'per project',
      aanvraagPeriodeOpen: new Date('2026-04-01'),
      aanvraagPeriodeSluiting: new Date('2026-07-31'),
      projectPeriodeStart: new Date('2026-09-01'),
      projectPeriodeEinde: new Date('2028-08-31'),
      verantwoordingDeadline: 'Halfjaarlijkse rapportage + eindverslag uiterlijk 1 december 2028',
      verantwoordingEisen:
        'Uitgebreide financiele administratie conform EU-eisen, inhoudelijke tussenrapportages, eindevaluatie met impactmeting, bewijsstukken voor alle uitgaven (EU-audit-proof).',
      vereisten: 'Projectplan conform ESF+ criteria, co-financiering van minimaal 50%, partnerschapsverklaring.',
      tags: ['eu', 'inclusie', 'innovatie', 'gelijke-kansen', 'internationaal'],
      actief: true,
    },
    {
      slug: 'stichting-leergeld',
      naam: 'Stichting Leergeld',
      financier: 'Privaat',
      financierUrl: 'https://www.leergeld.nl',
      beschrijving:
        'Stichting Leergeld ondersteunt kinderen uit gezinnen met een minimuminkomen zodat zij kunnen deelnemen aan activiteiten binnen en buiten school. De stichting vergoedt kosten voor schoolreisjes, sportactiviteiten, muziekles en schoolbenodigdheden.',
      doelgroep: 'PO-leerlingen uit minimagezinnen',
      minBedrag: null,
      maxBedrag: null,
      bedragPerEenheid: 'per leerling (variabel per activiteit)',
      aanvraagPeriodeOpen: new Date('2026-01-01'),
      aanvraagPeriodeSluiting: new Date('2026-12-31'),
      projectPeriodeStart: new Date('2026-01-01'),
      projectPeriodeEinde: new Date('2026-12-31'),
      verantwoordingDeadline: 'Doorlopend, per aanvraag',
      verantwoordingEisen:
        'Bewijsstukken van deelname en kosten per leerling, verklaring van de school over de deelname van de leerling.',
      vereisten: 'Gezinsinkomen onder 130% van het sociaal minimum, aanmelding via school of hulpverlener.',
      tags: ['armoede', 'participatie', 'leerlingen', 'privaat'],
      actief: true,
    },
    {
      slug: 'kansfonds-projectsubsidie',
      naam: 'Kansfonds Projectsubsidie',
      financier: 'Privaat',
      financierUrl: 'https://www.kansfonds.nl',
      beschrijving:
        'Het Kansfonds ondersteunt projecten die bijdragen aan een samenleving waarin iedereen meetelt. Voor het onderwijs zijn er mogelijkheden voor projecten rondom sociale cohesie, mentorprogramma\'s en het bestrijden van eenzaamheid en uitsluiting onder leerlingen.',
      doelgroep: 'PO-scholen met projecten gericht op sociale verbinding',
      minBedrag: 5000,
      maxBedrag: 25000,
      bedragPerEenheid: 'per project',
      aanvraagPeriodeOpen: new Date('2026-03-01'),
      aanvraagPeriodeSluiting: new Date('2026-09-30'),
      projectPeriodeStart: new Date('2026-10-01'),
      projectPeriodeEinde: new Date('2027-09-30'),
      verantwoordingDeadline: 'Uiterlijk 3 maanden na afloop project',
      verantwoordingEisen:
        'Inhoudelijk eindverslag met beschrijving van bereikte doelgroep en impact, financieel overzicht van bestede middelen, minimaal 2 praktijkverhalen van deelnemers.',
      vereisten: 'Concreet projectplan gericht op sociale verbinding, aantoonbare doelgroep, geen winstoogmerk.',
      tags: ['sociaal', 'verbinding', 'mentoring', 'privaat', 'projectsubsidie'],
      actief: true,
    },
  ];

  for (const regeling of subsidieRegelingen) {
    await prisma.subsidieRegeling.upsert({
      where: { slug: regeling.slug },
      update: {
        naam: regeling.naam,
        financier: regeling.financier,
        financierUrl: regeling.financierUrl,
        beschrijving: regeling.beschrijving,
        doelgroep: regeling.doelgroep,
        minBedrag: regeling.minBedrag,
        maxBedrag: regeling.maxBedrag,
        bedragPerEenheid: regeling.bedragPerEenheid,
        aanvraagPeriodeOpen: regeling.aanvraagPeriodeOpen,
        aanvraagPeriodeSluiting: regeling.aanvraagPeriodeSluiting,
        projectPeriodeStart: regeling.projectPeriodeStart,
        projectPeriodeEinde: regeling.projectPeriodeEinde,
        verantwoordingDeadline: regeling.verantwoordingDeadline,
        verantwoordingEisen: regeling.verantwoordingEisen,
        vereisten: regeling.vereisten,
        tags: regeling.tags,
        actief: regeling.actief,
      },
      create: {
        slug: regeling.slug,
        naam: regeling.naam,
        financier: regeling.financier,
        financierUrl: regeling.financierUrl,
        beschrijving: regeling.beschrijving,
        doelgroep: regeling.doelgroep,
        minBedrag: regeling.minBedrag,
        maxBedrag: regeling.maxBedrag,
        bedragPerEenheid: regeling.bedragPerEenheid,
        aanvraagPeriodeOpen: regeling.aanvraagPeriodeOpen,
        aanvraagPeriodeSluiting: regeling.aanvraagPeriodeSluiting,
        projectPeriodeStart: regeling.projectPeriodeStart,
        projectPeriodeEinde: regeling.projectPeriodeEinde,
        verantwoordingDeadline: regeling.verantwoordingDeadline,
        verantwoordingEisen: regeling.verantwoordingEisen,
        vereisten: regeling.vereisten,
        tags: regeling.tags,
        actief: regeling.actief,
      },
    });
  }

  console.log(`  ${subsidieRegelingen.length} subsidie regelingen aangemaakt`);

  // Create operationeel manager user
  await prisma.user.upsert({
    where: { email: 'ops@demo.nl' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'ops@demo.nl',
      passwordHash,
      naam: 'Demo Operationeel Manager',
      role: 'OPERATIONEEL_MANAGER',
    },
  });

  console.log('Seed klaar!');
  console.log('  Login: admin@demo.nl / admin123 (BESTUUR_ADMIN)');
  console.log('  Login: directeur@demo.nl / admin123 (SCHOOL_DIRECTEUR)');
  console.log('  Login: ops@demo.nl / admin123 (OPERATIONEEL_MANAGER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
