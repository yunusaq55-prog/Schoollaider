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

  // 2. 23 scholen aanmaken
  const scholen = [
    { naam: "De Regenboog", brinCode: "00AA01", adres: "Haaksbergerstraat 120, 7513 EG Enschede" },
    { naam: "Het Kompas", brinCode: "00AA02", adres: "Deldenerstraat 45, 7551 AC Hengelo" },
    { naam: "De Springplank", brinCode: "00AA03", adres: "Grotestraat 88, 7607 CK Almelo" },
    { naam: "De Vlindertuin", brinCode: "00AA04", adres: "Molenstraat 12, 7641 DK Wierden" },
    { naam: "Het Mozaïek", brinCode: "00AA05", adres: "Burgemeesterstraat 34, 7442 GM Nijverdal" },
    { naam: "De Zonnewijzer", brinCode: "00AA06", adres: "Kerkstraat 56, 7671 HE Vriezenveen" },
    { naam: "Het Baken", brinCode: "00AA07", adres: "Stationsweg 78, 7461 AP Rijssen" },
    { naam: "De Wegwijzer", brinCode: "00AA08", adres: "Hengelosestraat 90, 7553 EJ Hengelo" },
    { naam: "De Bonte Vlinder", brinCode: "00AA09", adres: "Oldenzaalsestraat 23, 7511 DG Enschede" },
    { naam: "Het Anker", brinCode: "00AA10", adres: "Marktstraat 67, 7607 AX Almelo" },
    { naam: "De Klimop", brinCode: "00AA11", adres: "Schoolstraat 11, 7627 AP Bornerbroek" },
    { naam: "Het Palet", brinCode: "00AA12", adres: "Burg. Jansenplein 5, 7481 BH Haaksbergen" },
    { naam: "De Tweemaster", brinCode: "00AA13", adres: "Langestraat 102, 7491 AK Delden" },
    { naam: "De Driehoek", brinCode: "00AA14", adres: "Tuinstraat 33, 7451 EH Holten" },
    { naam: "Het Startpunt", brinCode: "00AA15", adres: "Sportlaan 8, 7663 BK Mander" },
    { naam: "De Wereldwijzer", brinCode: "00AA16", adres: "Dorpsstraat 44, 7667 RH Reutum" },
    { naam: "Het Talent", brinCode: "00AA17", adres: "Ootmarsumsestraat 19, 7635 LP Tubbergen" },
    { naam: "De Bolster", brinCode: "00AA18", adres: "Kalanderstraat 15, 7511 JC Enschede" },
    { naam: "Het Kristal", brinCode: "00AA19", adres: "Weerseloseweg 77, 7623 DB Borne" },
    { naam: "De Optimist", brinCode: "00AA20", adres: "Spoorstraat 52, 7471 PB Goor" },
    { naam: "Het Spectrum", brinCode: "00AA21", adres: "Brinkstraat 29, 7431 HG Diepenveen" },
    { naam: "De Fontein", brinCode: "00AA22", adres: "Hoofdstraat 61, 7693 PC Sibculo" },
    { naam: "Het Veldhuis", brinCode: "00AA23", adres: "Veldhuis 3, 7678 RG Geesteren" },
  ];

  const createdSchools = [];
  for (const school of scholen) {
    const created = await prisma.school.upsert({
      where: {
        id: `seed-school-${school.brinCode}`,
      },
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

  // 3. Test gebruikers aanmaken
  const salt = await bcrypt.genSalt(10);

  const users = [
    {
      email: "admin@schoollaider.nl",
      password: "Admin123!",
      naam: "Super Admin",
      role: Role.SUPER_ADMIN,
      schoolId: null,
    },
    {
      email: "bestuur@spo-twente.nl",
      password: "Bestuur123!",
      naam: "Bestuur Administrator",
      role: Role.BESTUUR_ADMIN,
      schoolId: null,
    },
    {
      email: "directeur@deregenboog.nl",
      password: "School123!",
      naam: "Jan de Vries",
      role: Role.SCHOOL_DIRECTEUR,
      schoolId: createdSchools[0].id,
    },
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, salt);
    await prisma.user.upsert({
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
    console.log(`Gebruiker aangemaakt: ${user.email} (${user.role})`);
  }

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
