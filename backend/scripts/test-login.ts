import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const testUsers = [
  { email: "admin@schoollaider.nl", password: "Admin123!" },
  { email: "bestuur@spo-twente.nl", password: "Bestuur123!" },
  { email: "directeur@deregenboog.nl", password: "School123!" },
];

async function testLogin() {
  console.log("=== Login Test Script ===\n");

  for (const { email, password } of testUsers) {
    console.log(`--- Test: ${email} ---`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("  FOUT: Gebruiker niet gevonden!\n");
      continue;
    }

    console.log(`  Naam:          ${user.naam}`);
    console.log(`  Role:          ${user.role}`);
    console.log(`  Active:        ${user.active}`);
    console.log(`  Hash (DB):     ${user.passwordHash}`);
    console.log(`  Wachtwoord:    ${password}`);

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log(`  bcrypt.compare: ${valid ? "OK" : "MISLUKT"}`);

    // Test met fout wachtwoord
    const invalid = await bcrypt.compare("FoutWachtwoord!", user.passwordHash);
    console.log(`  Fout ww test:   ${!invalid ? "OK (correct geweigerd)" : "FOUT (zou moeten falen)"}`);

    console.log();
  }
}

testLogin()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
