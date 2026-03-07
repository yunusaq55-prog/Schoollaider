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

  console.log('Seed klaar!');
  console.log('  Login: admin@demo.nl / admin123 (BESTUUR_ADMIN)');
  console.log('  Login: directeur@demo.nl / admin123 (SCHOOL_DIRECTEUR)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
