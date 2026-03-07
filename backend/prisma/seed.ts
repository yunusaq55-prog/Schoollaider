import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Tenant aanmaken
  const tenant = await prisma.tenant.upsert({
    where: { slug: "spo-twente" },
    update: {},
    create: {
      naam: "Stichting Primair Onderwijs Twente",
      slug: "spo-twente",
      active: true,
      settings: {},
    },
  });
  console.log(`Tenant aangemaakt: ${tenant.naam}`);

  // 2. 3 scholen aanmaken
  const scholen = [
    { naam: "De Ontdekking", brinCode: "00AA01", adres: "Haaksbergerstraat 120, 7513 EG Enschede" },
    { naam: "De Regenboog", brinCode: "00AA02", adres: "Deldenerstraat 45, 7551 AC Hengelo" },
    { naam: "Het Kompas", brinCode: "00AA03", adres: "Grotestraat 88, 7607 CK Almelo" },
  ];

  const createdSchools = [];
  for (const school of scholen) {
    const created = await prisma.school.upsert({
      where: { id: `seed-school-${school.brinCode}` },
      update: {},
      create: {
        id: `seed-school-${school.brinCode}`,
        tenantId: tenant.id,
        naam: school.naam,
        brinCode: school.brinCode,
        adres: school.adres,
      },
    });
    createdSchools.push(created);
  }
  console.log(`${createdSchools.length} scholen aangemaakt`);

  // 3. Gebruikers aanmaken
  const salt = await bcrypt.genSalt(10);

  const users = [
    { email: "admin@schoollaider.nl", password: "Admin123!", naam: "Super Admin", role: Role.SUPER_ADMIN, schoolId: null },
    { email: "bestuur@spo-twente.nl", password: "Bestuur123!", naam: "Bestuur Administrator", role: Role.BESTUUR_ADMIN, schoolId: null },
    { email: "directeur@deontdekking.nl", password: "School123!", naam: "Jan de Vries", role: Role.SCHOOL_DIRECTEUR, schoolId: createdSchools[0].id },
    { email: "directeur@deregenboog.nl", password: "School123!", naam: "Maria Jansen", role: Role.SCHOOL_DIRECTEUR, schoolId: createdSchools[1].id },
    { email: "directeur@hetkompas.nl", password: "School123!", naam: "Pieter Bakker", role: Role.SCHOOL_DIRECTEUR, schoolId: createdSchools[2].id },
  ];

  const createdUsers = [];
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, salt);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        tenantId: tenant.id,
        email: user.email,
        passwordHash,
        naam: user.naam,
        role: user.role,
        schoolId: user.schoolId,
        active: true,
      },
    });
    createdUsers.push(created);
    console.log(`Gebruiker aangemaakt: ${user.email} (${user.role})`);
  }

  // 4. Inspectiedomeinen aanmaken
  const domeinen = [
    {
      code: "OP",
      naam: "Onderwijsproces",
      beschrijving: "Het onderwijsproces omvat het aanbod, het didactisch handelen en de leerresultaten.",
      versie: "2021",
      standaarden: [
        { code: "OP1", naam: "Aanbod", beschrijving: "De school biedt een breed en samenhangend onderwijsaanbod.", toelichting: "" },
        { code: "OP2", naam: "Zicht op ontwikkeling", beschrijving: "De school volgt de ontwikkeling van leerlingen systematisch.", toelichting: "" },
        { code: "OP3", naam: "Didactisch handelen", beschrijving: "Het didactisch handelen van leraren stelt leerlingen in staat tot leren.", toelichting: "" },
      ],
    },
    {
      code: "SK",
      naam: "Schoolklimaat",
      beschrijving: "Het schoolklimaat betreft de veiligheid en het pedagogisch klimaat.",
      versie: "2021",
      standaarden: [
        { code: "SK1", naam: "Veiligheid", beschrijving: "De school zorgt voor een veilige omgeving voor leerlingen en personeel.", toelichting: "" },
        { code: "SK2", naam: "Pedagogisch klimaat", beschrijving: "De school zorgt voor een stimulerend pedagogisch klimaat.", toelichting: "" },
      ],
    },
    {
      code: "KA",
      naam: "Kwaliteitszorg en Ambitie",
      beschrijving: "De school werkt planmatig aan verbetering van de onderwijskwaliteit.",
      versie: "2021",
      standaarden: [
        { code: "KA1", naam: "Kwaliteitszorg", beschrijving: "De school heeft een stelsel van kwaliteitszorg.", toelichting: "" },
        { code: "KA2", naam: "Kwaliteitscultuur", beschrijving: "De school heeft een professionele kwaliteitscultuur.", toelichting: "" },
        { code: "KA3", naam: "Verantwoording en dialoog", beschrijving: "De school verantwoordt zich over de onderwijskwaliteit.", toelichting: "" },
      ],
    },
  ];

  for (const domein of domeinen) {
    const { standaarden, ...domeinData } = domein;
    const created = await prisma.inspectieDomein.upsert({
      where: { code: domeinData.code },
      update: {},
      create: domeinData,
    });
    for (const standaard of standaarden) {
      await prisma.inspectieStandaard.upsert({
        where: { code: standaard.code },
        update: {},
        create: { ...standaard, domeinId: created.id },
      });
    }
  }
  console.log("Inspectiedomeinen aangemaakt");

  // 5. Demo PDCA cycli aanmaken
  const pdcaCycli = [
    { schoolIdx: 0, titel: "Verbetering rekenonderwijs", beschrijving: "Implementatie van nieuwe rekenmethode en differentiatie", schooljaar: "2025-2026", fase: "DO" as const, status: "ACTIEF" as const },
    { schoolIdx: 1, titel: "Pedagogisch klimaat versterken", beschrijving: "Schoolbrede aanpak voor sociaal-emotionele ontwikkeling", schooljaar: "2025-2026", fase: "PLAN" as const, status: "CONCEPT" as const },
    { schoolIdx: 2, titel: "Taalbeleid actualiseren", beschrijving: "Herijking taalbeleid met focus op begrijpend lezen", schooljaar: "2024-2025", fase: "CHECK" as const, status: "ACTIEF" as const },
  ];

  for (const cyclus of pdcaCycli) {
    await prisma.pdcaCyclus.create({
      data: {
        tenantId: tenant.id,
        schoolId: createdSchools[cyclus.schoolIdx].id,
        titel: cyclus.titel,
        beschrijving: cyclus.beschrijving,
        schooljaar: cyclus.schooljaar,
        fase: cyclus.fase,
        status: cyclus.status,
        createdBy: createdUsers[cyclus.schoolIdx + 2].id, // directeuren
      },
    });
  }
  console.log("PDCA cycli aangemaakt");

  // 6. Demo HR data aanmaken
  const hrData = [
    { schoolIdx: 0, begroteFte: 12.0, ingevuldeFte: 11.2, vacatures: 1, tijdelijkPct: 15, fteLeerkracht: 8.5, fteOop: 2.0, fteDirectie: 0.7 },
    { schoolIdx: 1, begroteFte: 15.0, ingevuldeFte: 14.5, vacatures: 0, tijdelijkPct: 8, fteLeerkracht: 11.0, fteOop: 2.5, fteDirectie: 1.0 },
    { schoolIdx: 2, begroteFte: 10.0, ingevuldeFte: 8.5, vacatures: 2, tijdelijkPct: 22, fteLeerkracht: 6.5, fteOop: 1.5, fteDirectie: 0.5 },
  ];

  for (const hr of hrData) {
    const capaciteitsScore = Math.round(Math.min(100, (hr.ingevuldeFte / hr.begroteFte) * 100) - hr.vacatures * 5);
    await prisma.hrFormatie.upsert({
      where: { schoolId_schooljaar: { schoolId: createdSchools[hr.schoolIdx].id, schooljaar: "2025-2026" } },
      update: {},
      create: {
        schoolId: createdSchools[hr.schoolIdx].id,
        schooljaar: "2025-2026",
        begroteFte: hr.begroteFte,
        ingevuldeFte: hr.ingevuldeFte,
        vacatures: hr.vacatures,
        tijdelijkPct: hr.tijdelijkPct,
        fteLeerkracht: hr.fteLeerkracht,
        fteOop: hr.fteOop,
        fteDirectie: hr.fteDirectie,
        capaciteitsScore,
      },
    });
  }
  console.log("HR formatiedata aangemaakt");

  // Verzuimdata
  const verzuimData = [
    { schoolIdx: 0, periode: "2025-09", verzuimPct: 4.2, kortVerzuimPct: 2.8, langVerzuimPct: 1.4, ziekteVervangingsDagen: 8 },
    { schoolIdx: 0, periode: "2025-10", verzuimPct: 3.8, kortVerzuimPct: 2.5, langVerzuimPct: 1.3, ziekteVervangingsDagen: 6 },
    { schoolIdx: 1, periode: "2025-09", verzuimPct: 5.8, kortVerzuimPct: 3.2, langVerzuimPct: 2.6, ziekteVervangingsDagen: 14 },
    { schoolIdx: 1, periode: "2025-10", verzuimPct: 6.1, kortVerzuimPct: 3.5, langVerzuimPct: 2.6, ziekteVervangingsDagen: 16 },
    { schoolIdx: 2, periode: "2025-09", verzuimPct: 7.5, kortVerzuimPct: 4.0, langVerzuimPct: 3.5, ziekteVervangingsDagen: 18 },
    { schoolIdx: 2, periode: "2025-10", verzuimPct: 8.2, kortVerzuimPct: 4.5, langVerzuimPct: 3.7, ziekteVervangingsDagen: 22 },
  ];

  for (const v of verzuimData) {
    const belastbaarheidsIndex = Math.round(Math.max(0, Math.min(100, 100 - v.verzuimPct * 10)));
    await prisma.hrVerzuim.upsert({
      where: { schoolId_periode: { schoolId: createdSchools[v.schoolIdx].id, periode: v.periode } },
      update: {},
      create: {
        schoolId: createdSchools[v.schoolIdx].id,
        periode: v.periode,
        verzuimPct: v.verzuimPct,
        kortVerzuimPct: v.kortVerzuimPct,
        langVerzuimPct: v.langVerzuimPct,
        ziekteVervangingsDagen: v.ziekteVervangingsDagen,
        belastbaarheidsIndex,
      },
    });
  }
  console.log("HR verzuimdata aangemaakt");

  // Leeftijdsdata
  const leeftijdData = [
    { schoolIdx: 0, categorieOnder30: 3, categorie30Tot40: 4, categorie40Tot50: 3, categorie50Tot60: 2, categorie60Plus: 1 },
    { schoolIdx: 1, categorieOnder30: 2, categorie30Tot40: 5, categorie40Tot50: 4, categorie50Tot60: 3, categorie60Plus: 2 },
    { schoolIdx: 2, categorieOnder30: 1, categorie30Tot40: 2, categorie40Tot50: 2, categorie50Tot60: 3, categorie60Plus: 2 },
  ];

  for (const l of leeftijdData) {
    const verwachteUitstroom3Jaar = l.categorie60Plus * 1.0 + l.categorie50Tot60 * 0.15;
    await prisma.hrLeeftijd.upsert({
      where: { schoolId_schooljaar: { schoolId: createdSchools[l.schoolIdx].id, schooljaar: "2025-2026" } },
      update: {},
      create: {
        schoolId: createdSchools[l.schoolIdx].id,
        schooljaar: "2025-2026",
        categorieOnder30: l.categorieOnder30,
        categorie30Tot40: l.categorie30Tot40,
        categorie40Tot50: l.categorie40Tot50,
        categorie50Tot60: l.categorie50Tot60,
        categorie60Plus: l.categorie60Plus,
        verwachteUitstroom3Jaar,
      },
    });
  }
  console.log("HR leeftijdsdata aangemaakt");

  // HR Signalen
  const signalen = [
    { schoolIdx: 2, type: "TEKORT", titel: "Hoog FTE-tekort", beschrijving: "Het Kompas heeft 2 openstaande vacatures en een bezettingsgraad van 85%", aanbevolenActie: "Vacatures uitzetten via Meesterbaan en interne mobiliteit onderzoeken" },
    { schoolIdx: 2, type: "VERZUIM", titel: "Verzuim boven norm", beschrijving: "Verzuimpercentage van 8.2% ligt ruim boven de norm van 5.5%", aanbevolenActie: "Gesprek met Arbodienst plannen en verzuimbeleid evalueren" },
    { schoolIdx: 1, type: "VERZUIM", titel: "Stijgend verzuim", beschrijving: "Verzuim De Regenboog stijgt van 5.8% naar 6.1%", aanbevolenActie: "Preventief gesprek met directeur en werkdrukonderzoek" },
  ];

  for (const s of signalen) {
    await prisma.hrSignaal.create({
      data: {
        schoolId: createdSchools[s.schoolIdx].id,
        type: s.type,
        titel: s.titel,
        beschrijving: s.beschrijving,
        aanbevolenActie: s.aanbevolenActie,
        status: "OPEN",
      },
    });
  }
  console.log("HR signalen aangemaakt");

  console.log("Seeding voltooid!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
